import { NextResponse } from "next/server"
import { supabase, initializeDatabase, saveGroups, getGroups } from "@/lib/supabase-simple"

export async function POST() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from("whatsapp_groups").select("count").limit(1)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "فشل في الاتصال بـ Supabase",
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Initialize database tables
    const initialized = await initializeDatabase()

    if (!initialized) {
      return NextResponse.json(
        {
          success: false,
          message: "فشل في تهيئة قاعدة البيانات",
        },
        { status: 500 },
      )
    }

    // Test save and retrieve
    const testGroup = {
      id: "test_group_" + Date.now(),
      name: "مجموعة اختبار",
      participants: 1,
      enabled: true,
    }

    const saved = await saveGroups([testGroup])
    const groups = await getGroups()
    const foundGroup = groups.find((g) => g.id === testGroup.id)

    return NextResponse.json({
      success: true,
      message: "تم اختبار قاعدة البيانات بنجاح",
      testResults: {
        connected: true,
        initialized: true,
        saveTest: saved,
        retrieveTest: !!foundGroup,
        totalGroups: groups.length,
      },
    })
  } catch (error) {
    console.error("خطأ في اختبار قاعدة البيانات:", error)
    return NextResponse.json(
      {
        success: false,
        message: "خطأ في اختبار قاعدة البيانات",
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 },
    )
  }
}
