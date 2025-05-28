import { NextResponse } from "next/server"
import { SimpleTelegramWhatsAppBot } from "@/lib/bot-core-simple"
import { databaseManager } from "@/lib/database-manager"

let botInstance: SimpleTelegramWhatsAppBot | null = null

export async function POST() {
  try {
    if (botInstance && botInstance.getStats().isRunning) {
      return NextResponse.json({
        success: false,
        message: "البوت يعمل بالفعل",
      })
    }

    // تهيئة قاعدة البيانات
    const dbConnected = await databaseManager.initialize()
    if (!dbConnected) {
      return NextResponse.json(
        {
          success: false,
          message: "فشل في الاتصال بقاعدة البيانات",
        },
        { status: 500 },
      )
    }

    // إعداد البوت
    const config = {
      telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN || "",
        channelId: process.env.TELEGRAM_CHANNEL_ID || "",
      },
      whatsapp: {
        delays: {
          min: Number.parseInt(process.env.BOT_MIN_DELAY || "30"),
          max: Number.parseInt(process.env.BOT_MAX_DELAY || "120"),
          betweenGroups: Number.parseInt(process.env.BOT_BETWEEN_GROUPS_DELAY || "15"),
        },
      },
      security: {
        maxMessagesPerHour: Number.parseInt(process.env.BOT_MAX_MESSAGES_PER_HOUR || "50"),
        blockedWords: (process.env.BLOCKED_WORDS || "").split(",").filter((word) => word.trim()),
      },
    }

    // إنشاء وتشغيل البوت
    botInstance = new SimpleTelegramWhatsAppBot(config)
    const started = await botInstance.initialize()

    if (started) {
      return NextResponse.json({
        success: true,
        message: "تم بدء تشغيل البوت بنجاح",
        stats: botInstance.getStats(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "فشل في بدء تشغيل البوت",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("خطأ في بدء تشغيل البوت:", error)
    return NextResponse.json(
      {
        success: false,
        message: "خطأ في الخادم",
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    if (!botInstance) {
      return NextResponse.json({
        isRunning: false,
        message: "البوت غير مهيأ",
      })
    }

    return NextResponse.json({
      isRunning: botInstance.getStats().isRunning,
      stats: botInstance.getStats(),
      groups: botInstance.getGroups(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
