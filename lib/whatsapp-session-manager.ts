import { supabase } from "./supabase-simple"

interface SessionData {
  sessionName: string
  sessionData: string
  isActive: boolean
  lastUsed: Date
}

export class WhatsAppSessionManager {
  private currentSession: SessionData | null = null

  async saveSession(sessionName: string, sessionData: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("whatsapp_sessions").upsert(
        {
          session_name: sessionName,
          session_data: sessionData,
          is_active: true,
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_name" },
      )

      if (error) {
        console.error("خطأ في حفظ الجلسة:", error)
        return false
      }

      this.currentSession = {
        sessionName,
        sessionData,
        isActive: true,
        lastUsed: new Date(),
      }

      console.log(`✅ تم حفظ جلسة واتساب: ${sessionName}`)
      return true
    } catch (error) {
      console.error("خطأ في حفظ الجلسة:", error)
      return false
    }
  }

  async loadSession(sessionName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("whatsapp_sessions")
        .select("session_data")
        .eq("session_name", sessionName)
        .eq("is_active", true)
        .single()

      if (error || !data) {
        console.log(`⚠️ لم يتم العثور على الجلسة: ${sessionName}`)
        return null
      }

      // Update last used
      await supabase
        .from("whatsapp_sessions")
        .update({ last_used: new Date().toISOString() })
        .eq("session_name", sessionName)

      console.log(`✅ تم تحميل جلسة واتساب: ${sessionName}`)
      return data.session_data
    } catch (error) {
      console.error("خطأ في تحميل الجلسة:", error)
      return null
    }
  }

  async getAllSessions(): Promise<SessionData[]> {
    try {
      const { data, error } = await supabase
        .from("whatsapp_sessions")
        .select("*")
        .order("last_used", { ascending: false })

      if (error || !data) {
        return []
      }

      return data.map((item) => ({
        sessionName: item.session_name,
        sessionData: item.session_data,
        isActive: item.is_active,
        lastUsed: new Date(item.last_used),
      }))
    } catch (error) {
      console.error("خطأ في جلب الجلسات:", error)
      return []
    }
  }

  async deleteSession(sessionName: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("whatsapp_sessions").delete().eq("session_name", sessionName)

      if (error) {
        console.error("خطأ في حذف الجلسة:", error)
        return false
      }

      if (this.currentSession?.sessionName === sessionName) {
        this.currentSession = null
      }

      console.log(`✅ تم حذف جلسة واتساب: ${sessionName}`)
      return true
    } catch (error) {
      console.error("خطأ في حذف الجلسة:", error)
      return false
    }
  }

  async deactivateSession(sessionName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("whatsapp_sessions")
        .update({ is_active: false })
        .eq("session_name", sessionName)

      if (error) {
        console.error("خطأ في إلغاء تفعيل الجلسة:", error)
        return false
      }

      console.log(`✅ تم إلغاء تفعيل جلسة واتساب: ${sessionName}`)
      return true
    } catch (error) {
      console.error("خطأ في إلغاء تفعيل الجلسة:", error)
      return false
    }
  }

  async exportSession(): Promise<string | null> {
    if (!this.currentSession) {
      console.log("⚠️ لا توجد جلسة نشطة للتصدير")
      return null
    }

    try {
      const exportData = {
        sessionName: this.currentSession.sessionName,
        sessionData: this.currentSession.sessionData,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      }

      return Buffer.from(JSON.stringify(exportData)).toString("base64")
    } catch (error) {
      console.error("خطأ في تصدير الجلسة:", error)
      return null
    }
  }

  async importSession(exportedData: string, sessionName?: string): Promise<boolean> {
    try {
      const decoded = JSON.parse(Buffer.from(exportedData, "base64").toString())

      const name = sessionName || decoded.sessionName || `imported_${Date.now()}`

      return await this.saveSession(name, decoded.sessionData)
    } catch (error) {
      console.error("خطأ في استيراد الجلسة:", error)
      return false
    }
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession
  }

  async loadFromEnvironment(): Promise<boolean> {
    const sessionData = process.env.WHATSAPP_SESSION_DATA
    const sessionName = process.env.WHATSAPP_SESSION_NAME || "default"

    if (!sessionData) {
      console.log("⚠️ لا توجد بيانات جلسة في متغيرات البيئة")
      return false
    }

    try {
      // Try to import from environment
      const success = await this.importSession(sessionData, sessionName)

      if (success) {
        console.log("✅ تم تحميل الجلسة من متغيرات البيئة")
        return true
      }

      return false
    } catch (error) {
      console.error("خطأ في تحميل الجلسة من متغيرات البيئة:", error)
      return false
    }
  }
}
