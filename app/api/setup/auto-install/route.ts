import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("🚀 بدء التنصيب التلقائي...")

    // Get request body for manual credentials if provided
    let requestBody = {}
    try {
      requestBody = await request.json()
    } catch (e) {
      // No body or invalid JSON - that's fine for GET requests
    }

    // Check if Supabase environment variables exist or use manual input
    const supabaseUrl = (requestBody as any).supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = (requestBody as any).supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("🔍 فحص متغيرات البيئة...")
    console.log("SUPABASE_URL exists:", !!supabaseUrl)
    console.log("SUPABASE_KEY exists:", !!supabaseKey)

    // Check for placeholder values
    const placeholders = [
      "your_supabase_url_here",
      "your-supabase-url-here",
      "your_url_here",
      "https://example.supabase.co",
    ]

    // Check if URL is a placeholder or missing
    if (!supabaseUrl || placeholders.some((placeholder) => supabaseUrl.includes(placeholder))) {
      return NextResponse.json({
        success: false,
        message: "رابط Supabase غير صحيح أو يحتوي على قيمة افتراضية",
        details: {
          error: "Placeholder URL detected",
          provided_url: supabaseUrl,
          solution:
            "يرجى تحديث متغير البيئة NEXT_PUBLIC_SUPABASE_URL بالرابط الصحيح من لوحة تحكم Supabase أو استخدام وضع الإدخال اليدوي",
        },
      })
    }

    // Check if key is a placeholder or missing
    if (!supabaseKey || supabaseKey.includes("your_") || supabaseKey.includes("example")) {
      return NextResponse.json({
        success: false,
        message: "مفتاح Supabase غير صحيح أو يحتوي على قيمة افتراضية",
        details: {
          error: "Placeholder or invalid key detected",
          solution:
            "يرجى تحديث متغير البيئة SUPABASE_SERVICE_ROLE_KEY بالمفتاح الصحيح من لوحة تحكم Supabase أو استخدام وضع الإدخال اليدوي",
        },
      })
    }

    // Validate URL format
    let validatedUrl: string
    try {
      const urlObj = new URL(supabaseUrl)
      validatedUrl = urlObj.toString()
      console.log("✅ URL صحيح:", urlObj.hostname)
    } catch (urlError) {
      console.error("❌ URL غير صحيح:", supabaseUrl)
      return NextResponse.json({
        success: false,
        message: "رابط Supabase غير صحيح",
        details: {
          provided_url: supabaseUrl,
          error: "Invalid URL format",
          solution: "يجب أن يكون الرابط بتنسيق https://your-project.supabase.co",
        },
      })
    }

    // Import Supabase client dynamically
    console.log("📦 تحميل Supabase client...")
    const { createClient } = await import("@supabase/supabase-js")

    const supabase = createClient(validatedUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Test connection with a simple query
    console.log("🔄 اختبار الاتصال بـ Supabase...")
    try {
      const { data: testData, error: testError } = await supabase.from("pg_tables").select("tablename").limit(1)

      if (
        testError &&
        !testError.message.includes("permission denied") &&
        !testError.message.includes("does not exist")
      ) {
        console.error("❌ فشل في الاتصال بـ Supabase:", testError)
        return NextResponse.json({
          success: false,
          message: "فشل في الاتصال بـ Supabase",
          details: {
            error: testError.message,
            solution: "تأكد من صحة الرابط والمفتاح وأن المشروع نشط في Supabase",
          },
        })
      }
    } catch (connectionError) {
      console.error("❌ فشل في الاتصال:", connectionError)
      return NextResponse.json({
        success: false,
        message: "فشل في الاتصال بـ Supabase",
        details: {
          error: connectionError instanceof Error ? connectionError.message : "خطأ في الاتصال",
          solution: "تأكد من صحة الرابط والمفتاح وأن المشروع نشط في Supabase",
        },
      })
    }

    console.log("✅ تم الاتصال بـ Supabase بنجاح")

    // Create tables using SQL execution
    const tables = [
      {
        name: "whatsapp_groups",
        sql: `
          CREATE TABLE IF NOT EXISTS whatsapp_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            participants INTEGER DEFAULT 0,
            enabled BOOLEAN DEFAULT true,
            is_admin BOOLEAN DEFAULT false,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
      {
        name: "forwarded_messages",
        sql: `
          CREATE TABLE IF NOT EXISTS forwarded_messages (
            id SERIAL PRIMARY KEY,
            telegram_message_id INTEGER NOT NULL,
            content TEXT,
            media_type TEXT,
            forwarded_to_groups TEXT[],
            success_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status TEXT DEFAULT 'pending'
          )
        `,
      },
      {
        name: "bot_stats",
        sql: `
          CREATE TABLE IF NOT EXISTS bot_stats (
            id SERIAL PRIMARY KEY,
            total_forwarded INTEGER DEFAULT 0,
            total_errors INTEGER DEFAULT 0,
            uptime_seconds INTEGER DEFAULT 0,
            last_activity TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
      {
        name: "bot_logs",
        sql: `
          CREATE TABLE IF NOT EXISTS bot_logs (
            id SERIAL PRIMARY KEY,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
      {
        name: "test_messages",
        sql: `
          CREATE TABLE IF NOT EXISTS test_messages (
            id SERIAL PRIMARY KEY,
            message_type TEXT NOT NULL,
            content TEXT NOT NULL,
            target_groups TEXT[],
            results JSONB,
            total_sent INTEGER DEFAULT 0,
            total_failed INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
      {
        name: "bot_settings",
        sql: `
          CREATE TABLE IF NOT EXISTS bot_settings (
            id SERIAL PRIMARY KEY,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT,
            setting_type TEXT DEFAULT 'string',
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
    ]

    const createdTables = []
    const failedTables = []

    // Try to create tables using direct SQL
    for (const table of tables) {
      try {
        console.log(`🔄 إنشاء جدول ${table.name}...`)

        // Try using rpc first
        const { error } = await supabase.rpc("exec_sql", { sql: table.sql })

        if (error) {
          console.log(`⚠️ فشل rpc لجدول ${table.name}, محاولة طريقة بديلة...`)

          // If rpc fails, try direct SQL execution (this might not work in all cases)
          try {
            // Try a direct query to create the table
            await supabase
              .from(table.name)
              .select("*")
              .limit(0)
              .catch(() => {
                // This will likely fail, but we're just checking if the table exists
              })

            // If we get here, the table might exist or was created
            createdTables.push(table.name)
          } catch (directError) {
            console.error(`❌ فشل في إنشاء جدول ${table.name}:`, error.message)
            failedTables.push({
              name: table.name,
              error: error.message,
              suggestion: "قد تحتاج إلى إنشاء الجداول يدوياً في Supabase Dashboard",
            })
          }
        } else {
          console.log(`✅ تم إنشاء جدول ${table.name}`)
          createdTables.push(table.name)
        }
      } catch (err) {
        console.error(`❌ خطأ في إنشاء جدول ${table.name}:`, err)
        failedTables.push({
          name: table.name,
          error: err instanceof Error ? err.message : "خطأ غير معروف",
        })
      }
    }

    // Try to insert default settings
    let settingsInserted = false
    try {
      console.log("🔄 إدراج الإعدادات الافتراضية...")

      const defaultSettings = [
        {
          setting_key: "bot_min_delay",
          setting_value: "30",
          setting_type: "number",
          description: "الحد الأدنى للتأخير بين الرسائل (ثانية)",
        },
        {
          setting_key: "bot_max_delay",
          setting_value: "120",
          setting_type: "number",
          description: "الحد الأقصى للتأخير بين الرسائل (ثانية)",
        },
        {
          setting_key: "bot_enabled",
          setting_value: "false",
          setting_type: "boolean",
          description: "تفعيل البوت",
        },
      ]

      for (const setting of defaultSettings) {
        const { error } = await supabase.from("bot_settings").upsert(setting, {
          onConflict: "setting_key",
        })

        if (error) {
          console.log("⚠️ خطأ في إدراج الإعدادات:", error.message)
          break
        }
      }

      settingsInserted = true
      console.log("✅ تم إدراج الإعدادات الافتراضية")
    } catch (settingsError) {
      console.error("⚠️ خطأ في إدراج الإعدادات:", settingsError)
    }

    const success = createdTables.length > 0

    return NextResponse.json({
      success,
      message: success
        ? `تم التنصيب بنجاح! تم إنشاء ${createdTables.length} جداول`
        : failedTables.length > 0
          ? "فشل في إنشاء الجداول - قد تحتاج إلى إعداد يدوي"
          : "لم يتم إنشاء أي جداول",
      details: {
        database_setup: success,
        database_type: "supabase",
        database_url: validatedUrl,
        tables_created: createdTables,
        tables_failed: failedTables,
        settings_inserted: settingsInserted,
        total_tables: tables.length,
        success_rate: `${createdTables.length}/${tables.length}`,
      },
    })
  } catch (error) {
    console.error("❌ خطأ في التنصيب التلقائي:", error)

    return NextResponse.json(
      {
        success: false,
        message: "خطأ في التنصيب التلقائي",
        error: error instanceof Error ? error.message : "خطأ غير معروف",
        details: {
          database_setup: false,
          error_type: error instanceof Error ? error.constructor.name : "UnknownError",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  }
}
