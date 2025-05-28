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

// Database initialization functions
export async function initializeDatabase() {
  try {
    console.log("🔄 تهيئة قاعدة البيانات...")

    // جدول المجموعات
    const { error: groupsError } = await supabase.rpc("exec_sql", {
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
    })

    if (groupsError) {
      console.error("خطأ في إنشاء جدول المجموعات:", groupsError)
    }

    // جدول الرسائل المرسلة
    const { error: messagesError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS forwarded_messages (
          id SERIAL PRIMARY KEY,
          telegram_message_id INTEGER NOT NULL,
          content TEXT,
          media_type TEXT,
          media_url TEXT,
          forwarded_to_groups TEXT[],
          success_count INTEGER DEFAULT 0,
          failed_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status TEXT DEFAULT 'pending'
        )
      `,
    })

    if (messagesError) {
      console.error("خطأ في إنشاء جدول الرسائل:", messagesError)
    }

    // جدول إحصائيات البوت
    const { error: statsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS bot_stats (
          id SERIAL PRIMARY KEY,
          total_forwarded INTEGER DEFAULT 0,
          total_errors INTEGER DEFAULT 0,
          uptime_seconds INTEGER DEFAULT 0,
          last_activity TIMESTAMP WITH TIME ZONE,
          daily_messages INTEGER DEFAULT 0,
          weekly_messages INTEGER DEFAULT 0,
          monthly_messages INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    })

    if (statsError) {
      console.error("خطأ في إنشاء جدول الإحصائيات:", statsError)
    }

    // جدول السجلات
    const { error: logsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS bot_logs (
          id SERIAL PRIMARY KEY,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    })

    if (logsError) {
      console.error("خطأ في إنشاء جدول السجلات:", logsError)
    }

    // جدول الرسائل التجريبية
    const { error: testError } = await supabase.rpc("exec_sql", {
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
    })

    if (testError) {
      console.error("خطأ في إنشاء جدول الرسائل التجريبية:", testError)
    }

    // جدول إعدادات البوت
    const { error: settingsError } = await supabase.rpc("exec_sql", {
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
    })

    if (settingsError) {
      console.error("خطأ في إنشاء جدول الإعدادات:", settingsError)
    }

    // جدول جلسات واتساب
    const { error: sessionsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_sessions (
          id SERIAL PRIMARY KEY,
          session_name TEXT UNIQUE NOT NULL,
          session_data TEXT,
          is_active BOOLEAN DEFAULT false,
          last_used TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    })

    if (sessionsError) {
      console.error("خطأ في إنشاء جدول الجلسات:", sessionsError)
    }

    console.log("✅ تم تهيئة قاعدة البيانات بنجاح")
    return true
  } catch (error) {
    console.error("❌ خطأ في تهيئة قاعدة البيانات:", error)
    return false
  }
}

// دوال إدارة المجموعات
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

// دوال إدارة الرسائل
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

// دوال إدارة الإحصائيات
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

// دوال إدارة السجلات
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

// دوال إدارة الإعدادات
export async function getSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.from("bot_settings").select("setting_value").eq("setting_key", key).single()

    if (error || !data) return null
    return data.setting_value
  } catch {
    return null
  }
}

export async function updateSetting(key: string, value: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("bot_settings")
      .update({
        setting_value: value,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", key)

    return !error
  } catch {
    return false
  }
}

// دوال إدارة جلسات واتساب
export async function saveWhatsAppSession(sessionName: string, sessionData: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("whatsapp_sessions").upsert(
      {
        session_name: sessionName,
        session_data: sessionData,
        is_active: true,
        last_used: new Date().toISOString(),
      },
      { onConflict: "session_name" },
    )

    return !error
  } catch {
    return false
  }
}

export async function getWhatsAppSession(sessionName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("whatsapp_sessions")
      .select("session_data")
      .eq("session_name", sessionName)
      .eq("is_active", true)
      .single()

    if (error || !data) return null
    return data.session_data
  } catch {
    return null
  }
}
