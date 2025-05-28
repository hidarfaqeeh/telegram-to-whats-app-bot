import { NextResponse } from "next/server"
import { WhatsAppSessionManager } from "@/lib/whatsapp-session-manager"

export async function POST() {
  try {
    const sessionManager = new WhatsAppSessionManager()
    const exportedSession = await sessionManager.exportSession()

    if (!exportedSession) {
      return NextResponse.json(
        {
          success: false,
          message: "لا توجد جلسة للتصدير",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "تم تصدير الجلسة بنجاح",
      session_data: exportedSession,
      instructions: [
        "أضف هذه البيانات إلى متغير البيئة WHATSAPP_SESSION_DATA",
        "يمكنك الآن استخدام هذه الجلسة في أي مكان آخر",
        "احتفظ بهذه البيانات في مكان آمن",
      ],
    })
  } catch (error) {
    console.error("خطأ في تصدير الجلسة:", error)
    return NextResponse.json(
      {
        success: false,
        message: "خطأ في تصدير الجلسة",
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
