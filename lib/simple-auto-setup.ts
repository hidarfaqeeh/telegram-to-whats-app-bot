import { initializeDatabase } from "./supabase-simple"

export class SimpleAutoSetup {
  static async initializeDatabase(): Promise<boolean> {
    try {
      console.log("🔄 بدء إعداد قاعدة البيانات تلقائياً...")

      const success = await initializeDatabase()

      if (success) {
        console.log("✅ تم إعداد قاعدة البيانات بنجاح")
      } else {
        console.error("❌ فشل في إعداد قاعدة البيانات")
      }

      return success
    } catch (error) {
      console.error("❌ خطأ في إعداد قاعدة البيانات:", error)
      return false
    }
  }
}
