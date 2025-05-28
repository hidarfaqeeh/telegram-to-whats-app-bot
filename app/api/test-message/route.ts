import { type NextRequest, NextResponse } from "next/server"
import { whatsappManager } from "@/lib/whatsapp-setup"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupId, message, type, file } = body

    // التحقق من الاتصال
    if (!whatsappManager.isConnected()) {
      return NextResponse.json({ success: false, error: "واتساب غير متصل" }, { status: 400 })
    }

    let success = false

    switch (type) {
      case "text":
        success = await whatsappManager.sendTextMessage(groupId, message)
        break

      case "image":
        if (file) {
          const buffer = Buffer.from(file.split(",")[1], "base64")
          success = await whatsappManager.sendImageMessage(groupId, buffer, message)
        } else {
          return NextResponse.json({ success: false, error: "لم يتم تحديد صورة" }, { status: 400 })
        }
        break

      case "video":
        if (file) {
          const buffer = Buffer.from(file.split(",")[1], "base64")
          success = await whatsappManager.sendVideoMessage(groupId, buffer, message)
        } else {
          return NextResponse.json({ success: false, error: "لم يتم تحديد فيديو" }, { status: 400 })
        }
        break

      default:
        return NextResponse.json({ success: false, error: "نوع رسالة غير مدعوم" }, { status: 400 })
    }

    return NextResponse.json({
      success,
      message: success ? "تم إرسال الرسالة بنجاح" : "فشل في إرسال الرسالة",
    })
  } catch (error) {
    console.error("خطأ في إرسال الرسالة التجريبية:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
