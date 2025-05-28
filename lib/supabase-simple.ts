import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Simple database operations using Supabase only
export async function initializeDatabase() {
  try {
    console.log("🔄 تهيئة قاعدة البيانات...")

    // Create tables using Supabase SQL
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

    // Execute each table creation
    for (const table of tables) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql: table.sql })
        if (error) {
          console.error(`خطأ في إنشاء جدول ${table.name}:`, error)
        } else {
          console.log(`✅ تم إنشاء جدول ${table.name}`)
        }
      } catch (err) {
        console.error(`خطأ في تنفيذ SQL لجدول ${table.name}:`, err)
      }
    }

    console.log("✅ تم تهيئة قاعدة البيانات بنجاح")
    return true
  } catch (error) {
    console.error("❌ خطأ في تهيئة قاعدة البيانات:", error)
    return false
  }
}

// Simple CRUD operations
export async function saveGroups(groups: any[]) {
  try {
    const { error } = await supabase.from("whatsapp_groups").upsert(groups, { onConflict: "id" })
    if (error) throw error
    return true
  } catch (error) {
    console.error("خطأ في حفظ المجموعات:", error)
    return false
  }
}

export async function getGroups() {
  try {
    const { data, error } = await supabase.from("whatsapp_groups").select("*").order("name")
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("خطأ في جلب المجموعات:", error)
    return []
  }
}

export async function saveMessage(messageData: any) {
  try {
    const { error } = await supabase.from("forwarded_messages").insert(messageData)
    if (error) throw error
    return true
  } catch (error) {
    console.error("خطأ في حفظ الرسالة:", error)
    return false
  }
}

export async function updateStats(stats: any) {
  try {
    const { error } = await supabase.from("bot_stats").upsert(stats, { onConflict: "id" })
    if (error) throw error
    return true
  } catch (error) {
    console.error("خطأ في تحديث الإحصائيات:", error)
    return false
  }
}

export async function addLog(level: string, message: string, metadata?: any) {
  try {
    const { error } = await supabase.from("bot_logs").insert({
      level,
      message,
      metadata,
    })
    if (error) throw error
    return true
  } catch (error) {
    console.error("خطأ في إضافة السجل:", error)
    return false
  }
}

export async function getLogs(limit = 100) {
  try {
    const { data, error } = await supabase
      .from("bot_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("خطأ في جلب السجلات:", error)
    return []
  }
}
