import {
  supabase,
  initializeDatabase,
  saveGroups,
  getGroups,
  saveMessage,
  updateStats,
  addLog,
  getLogs,
} from "./supabase-simple"

interface DatabaseConfig {
  type: "supabase"
  url: string
  key: string
}

class DatabaseManager {
  private config: DatabaseConfig | null = null
  private connected = false

  async initialize(): Promise<boolean> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error("❌ متغيرات البيئة لـ Supabase غير موجودة")
        return false
      }

      this.config = {
        type: "supabase",
        url: supabaseUrl,
        key: supabaseKey,
      }

      // Test connection
      const { data, error } = await supabase.from("whatsapp_groups").select("count").limit(1)

      if (error && !error.message.includes("relation") && !error.message.includes("does not exist")) {
        console.error("❌ فشل في الاتصال بقاعدة البيانات:", error)
        return false
      }

      this.connected = true
      console.log("✅ تم الاتصال بقاعدة البيانات بنجاح")

      // Initialize tables if they don't exist
      if (error && (error.message.includes("relation") || error.message.includes("does not exist"))) {
        console.log("🔄 إنشاء الجداول...")
        const initialized = await initializeDatabase()
        if (!initialized) {
          console.error("❌ فشل في إنشاء الجداول")
          return false
        }
      }

      return true
    } catch (error) {
      console.error("❌ خطأ في تهيئة قاعدة البيانات:", error)
      this.connected = false
      return false
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.config = null
    console.log("✅ تم قطع الاتصال بقاعدة البيانات")
  }

  isConnected(): boolean {
    return this.connected
  }

  getConfig(): DatabaseConfig | null {
    return this.config
  }

  // Groups management
  async saveGroups(groups: any[]): Promise<boolean> {
    if (!this.connected) {
      console.error("❌ قاعدة البيانات غير متصلة")
      return false
    }
    return await saveGroups(groups)
  }

  async getGroups(): Promise<any[]> {
    if (!this.connected) {
      console.error("❌ قاعدة البيانات غير متصلة")
      return []
    }
    return await getGroups()
  }

  // Messages management
  async saveMessage(messageData: any): Promise<boolean> {
    if (!this.connected) {
      console.error("❌ قاعدة البيانات غير متصلة")
      return false
    }
    return await saveMessage(messageData)
  }

  // Stats management
  async updateStats(stats: any): Promise<boolean> {
    if (!this.connected) {
      console.error("❌ قاعدة البيانات غير متصلة")
      return false
    }
    return await updateStats(stats)
  }

  async getStats(): Promise<any> {
    if (!this.connected) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from("bot_stats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error("خطأ في جلب الإحصائيات:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات:", error)
      return null
    }
  }

  // Logs management
  async addLog(level: string, message: string, metadata?: any): Promise<boolean> {
    if (!this.connected) {
      console.error("❌ قاعدة البيانات غير متصلة")
      return false
    }
    return await addLog(level, message, metadata)
  }

  async getLogs(limit = 100): Promise<any[]> {
    if (!this.connected) {
      console.error("❌ قاعدة البيانات غير متصلة")
      return []
    }
    return await getLogs(limit)
  }

  // Health check
  async healthCheck(): Promise<{
    connected: boolean
    tablesExist: boolean
    error?: string
  }> {
    try {
      if (!this.connected) {
        return {
          connected: false,
          tablesExist: false,
          error: "غير متصل",
        }
      }

      // Test basic query
      const { data, error } = await supabase.from("whatsapp_groups").select("count").limit(1)

      if (error) {
        if (error.message.includes("relation") || error.message.includes("does not exist")) {
          return {
            connected: true,
            tablesExist: false,
            error: "الجداول غير موجودة",
          }
        }
        return {
          connected: false,
          tablesExist: false,
          error: error.message,
        }
      }

      return {
        connected: true,
        tablesExist: true,
      }
    } catch (error) {
      return {
        connected: false,
        tablesExist: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      }
    }
  }

  // Settings management
  async getSetting(key: string): Promise<string | null> {
    if (!this.connected) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from("bot_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .single()

      if (error || !data) return null
      return data.setting_value
    } catch {
      return null
    }
  }

  async updateSetting(key: string, value: string): Promise<boolean> {
    if (!this.connected) {
      return false
    }

    try {
      const { error } = await supabase.from("bot_settings").upsert(
        {
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      )

      return !error
    } catch {
      return false
    }
  }

  async getAllSettings(): Promise<Record<string, string>> {
    if (!this.connected) {
      return {}
    }

    try {
      const { data, error } = await supabase.from("bot_settings").select("setting_key, setting_value")

      if (error || !data) return {}

      const settings: Record<string, string> = {}
      data.forEach((item) => {
        settings[item.setting_key] = item.setting_value
      })

      return settings
    } catch {
      return {}
    }
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager()
