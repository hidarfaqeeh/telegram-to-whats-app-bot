import { NextResponse } from "next/server"
import { databaseManager } from "@/lib/database-manager"

// متغير عام لتتبع البوت (يجب أن يكون مشتركاً مع start/route.ts)
declare global {
  var botInstance: any
}

export async function POST() {
  try {
    if (!global.botInstance) {
      return NextResponse.json({
        success: false,
        message: "البوت غير مشغل",
      })
    }

    // إيقاف البوت
    await global.botInstance.stop()
    global.botInstance = null

    // قطع الاتصال بقاعدة البيانات
    await databaseManager.disconnect()

    return NextResponse.json({
      success: true,
      message: "تم إيقاف البوت بنجاح",
    })
  } catch (error) {
    console.error("خطأ في إيقاف البوت:", error)
    return NextResponse.json(
      {
        success: false,
        message: "خطأ في إيقاف البوت",
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
