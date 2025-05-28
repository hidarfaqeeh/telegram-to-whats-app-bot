import { supabase, initializeDatabase } from "./supabase-simple"

export class AutoDatabaseSetup {
  private static instance: AutoDatabaseSetup | null = null

  static getInstance(): AutoDatabaseSetup {
    if (!this.instance) {
      this.instance = new AutoDatabaseSetup()
    }
    return this.instance
  }

  async setupDatabase(): Promise<boolean> {
    try {
      console.log("🔄 بدء إعداد قاعدة البيانات تلقائياً...")

      // Test connection first
      const { data, error } = await supabase.from("whatsapp_groups").select("count").limit(1)

      if (error && !error.message.includes("relation") && !error.message.includes("does not exist")) {
        console.error("❌ فشل في الاتصال بقاعدة البيانات:", error)
        return false
      }

      // Initialize database tables
      const success = await initializeDatabase()

      if (success) {
        console.log("✅ تم إعداد قاعدة البيانات بنجاح")

        // Insert default settings
        await this.insertDefaultSettings()

        return true
      } else {
        console.error("❌ فشل في إعداد قاعدة البيانات")
        return false
      }
    } catch (error) {
      console.error("❌ خطأ في إعداد قاعدة البيانات:", error)
      return false
    }
  }

  private async insertDefaultSettings(): Promise<void> {
    try {
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
          setting_key: "bot_between_groups_delay",
          setting_value: "15",
          setting_type: "number",
          description: "التأخير بين المجموعات (ثانية)",
        },
        {
          setting_key: "bot_max_messages_per_hour",
          setting_value: "50",
          setting_type: "number",
          description: "الحد الأقصى للرسائل في الساعة",
        },
        {
          setting_key: "bot_enabled",
          setting_value: "false",
          setting_type: "boolean",
          description: "تفعيل البوت",
        },
      ]

      for (const setting of defaultSettings) {
        await supabase.from("bot_settings").upsert(setting, { onConflict: "setting_key" })
      }

      console.log("✅ تم إدراج الإعدادات الافتراضية")
    } catch (error) {
      console.error("⚠️ خطأ في إدراج الإعدادات الافتراضية:", error)
    }
  }

  async checkDatabaseHealth(): Promise<{
    connected: boolean
    tablesExist: boolean
    error?: string
  }> {
    try {
      // Test basic connection
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

  async getSetupStatus(): Promise<{
    database: boolean
    tables: boolean
    settings: boolean
    overall: boolean
  }> {
    try {
      const health = await this.checkDatabaseHealth()

      if (!health.connected) {
        return {
          database: false,
          tables: false,
          settings: false,
          overall: false,
        }
      }

      if (!health.tablesExist) {
        return {
          database: true,
          tables: false,
          settings: false,
          overall: false,
        }
      }

      // Check if settings exist
      const { data: settings } = await supabase.from("bot_settings").select("count").limit(1)

      const hasSettings = !!settings

      return {
        database: true,
        tables: true,
        settings: hasSettings,
        overall: hasSettings,
      }
    } catch (error) {
      console.error("خطأ في فحص حالة الإعداد:", error)
      return {
        database: false,
        tables: false,
        settings: false,
        overall: false,
      }
    }
  }
}
