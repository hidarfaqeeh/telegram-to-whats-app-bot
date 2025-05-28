import { type NextRequest, NextResponse } from "next/server"
import { whatsappManager } from "@/lib/whatsapp-setup"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  try {
    switch (action) {
      case "status":
        return NextResponse.json({
          connected: whatsappManager.isConnected(),
          account: whatsappManager.isConnected() ? await whatsappManager.getAccountInfo() : null,
        })

      case "groups":
        if (!whatsappManager.isConnected()) {
          return NextResponse.json({ error: "واتساب غير متصل" }, { status: 400 })
        }
        const groups = await whatsappManager.getGroups()
        return NextResponse.json(groups)

      default:
        return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 })
    }
  } catch (error) {
    console.error("خطأ في API واتساب:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, data } = body

  try {
    switch (action) {
      case "connect":
        const connected = await whatsappManager.connect()
        return NextResponse.json({
          success: connected,
          message: connected ? "تم بدء الاتصال" : "فشل في الاتصال",
        })

      case "disconnect":
        await whatsappManager.disconnect()
        return NextResponse.json({
          success: true,
          message: "تم قطع الاتصال",
        })

      case "send-message":
        if (!whatsappManager.isConnected()) {
          return NextResponse.json({ error: "واتساب غير متصل" }, { status: 400 })
        }

        const sent = await whatsappManager.sendTextMessage(data.groupId, data.message)
        return NextResponse.json({
          success: sent,
          message: sent ? "تم إرسال الرسالة" : "فشل في الإرسال",
        })

      default:
        return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 })
    }
  } catch (error) {
    console.error("خطأ في API واتساب:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}
