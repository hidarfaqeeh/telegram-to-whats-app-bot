import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("🔍 فحص متغيرات البيئة...")
    console.log("SUPABASE_URL:", !!supabaseUrl)
    console.log("SUPABASE_KEY:", !!supabaseKey)

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        connected: false,
        type: "supabase",
        host: "not_configured",
        port: 443,
        database: "postgres",
        ssl: true,
        status: "missing_credentials",
        error: "متغيرات البيئة لـ Supabase غير موجودة",
        missing_vars: [
          ...(!supabaseUrl ? ["NEXT_PUBLIC_SUPABASE_URL"] : []),
          ...(!supabaseKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
        ],
      })
    }

    // Validate URL format
    let hostname: string
    try {
      const urlObj = new URL(supabaseUrl)
      hostname = urlObj.hostname
      console.log("✅ URL صحيح:", hostname)
    } catch (urlError) {
      console.error("❌ URL غير صحيح:", supabaseUrl)
      return NextResponse.json({
        connected: false,
        type: "supabase",
        host: "invalid_url",
        port: 443,
        database: "postgres",
        ssl: true,
        status: "invalid_url",
        error: `رابط Supabase غير صحيح: ${supabaseUrl}`,
        provided_url: supabaseUrl,
      })
    }

    // Test actual connection
    try {
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // Simple test query
      const { data, error } = await supabase.from("pg_tables").select("tablename").limit(1)

      if (error) {
        console.log("⚠️ خطأ في الاستعلام:", error.message)
        // This might be normal - let's still consider it connected if we got a response
        if (error.message.includes("permission denied") || error.message.includes("does not exist")) {
          return NextResponse.json({
            connected: true,
            type: "supabase",
            host: hostname,
            port: 443,
            database: "postgres",
            ssl: true,
            status: "connected_limited_permissions",
            note: "متصل ولكن مع صلاحيات محدودة",
          })
        }
      }

      return NextResponse.json({
        connected: true,
        type: "supabase",
        host: hostname,
        port: 443,
        database: "postgres",
        ssl: true,
        status: "connected",
      })
    } catch (connectionError) {
      console.error("❌ خطأ في الاتصال:", connectionError)
      return NextResponse.json({
        connected: false,
        type: "supabase",
        host: hostname,
        port: 443,
        database: "postgres",
        ssl: true,
        status: "connection_error",
        error: connectionError instanceof Error ? connectionError.message : "خطأ في الاتصال",
      })
    }
  } catch (error) {
    console.error("❌ خطأ عام:", error)
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
        status: "general_error",
      },
      { status: 500 },
    )
  }
}
