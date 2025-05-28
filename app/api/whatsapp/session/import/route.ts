import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_data, session_name = "imported" } = body

    if (!session_data) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات الجلسة مطلوبة",
        },
        { status: 400 },
      )
    }

    // حفظ الجلسة في قاعدة البيانات
    const { error } = await supabase.from("whatsapp_sessions").upsert(
      {
        session_name,
        session_data,
        is_active: true,
        last_used: new Date().toISOString(),
      },
      { onConflict: "session_name" },
    )

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "فشل في حفظ الجلسة",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "تم استيراد الجلسة بنجاح",
      session_name,
    })
  } catch (error) {
    console.error("خطأ في استيراد الجلسة:", error)
    return NextResponse.json(
      {
        success: false,
        message: "خطأ في استيراد الجلسة",
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
