import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// إنشاء جداول قاعدة البيانات
export async function initializeDatabase() {
  try {
    // جدول المجموعات
    await supabase.sql`
      CREATE TABLE IF NOT EXISTS whatsapp_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        participants INTEGER DEFAULT 0,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // جدول الرسائل
    await supabase.sql`
      CREATE TABLE IF NOT EXISTS forwarded_messages (
        id SERIAL PRIMARY KEY,
        telegram_message_id INTEGER NOT NULL,
        content TEXT,
        media_type TEXT,
        forwarded_to_groups TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'pending'
      )
    `

    // جدول الإحصائيات
    await supabase.sql`
      CREATE TABLE IF NOT EXISTS bot_stats (
        id SERIAL PRIMARY KEY,
        total_forwarded INTEGER DEFAULT 0,
        total_errors INTEGER DEFAULT 0,
        uptime_seconds INTEGER DEFAULT 0,
        last_activity TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // جدول السجلات
    await supabase.sql`
      CREATE TABLE IF NOT EXISTS bot_logs (
        id SERIAL PRIMARY KEY,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

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

// Re-export everything from supabase.ts for backward compatibility
export * from "./supabase"
export { supabase as default } from "./supabase"
