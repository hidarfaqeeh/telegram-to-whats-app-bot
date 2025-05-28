import { NextResponse } from "next/server"

export async function GET() {
  try {
    const requiredEnvVars = [
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_CHANNEL_ID",
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]

    const optionalEnvVars = [
      "ADMIN_CHAT_ID",
      "BOT_MIN_DELAY",
      "BOT_MAX_DELAY",
      "BOT_BETWEEN_GROUPS_DELAY",
      "BOT_MAX_MESSAGES_PER_HOUR",
      "BLOCKED_WORDS",
      "AUTO_SETUP_DATABASE",
    ]

    const missingRequired = requiredEnvVars.filter((envVar) => !process.env[envVar])
    const missingOptional = optionalEnvVars.filter((envVar) => !process.env[envVar])

    const allEnvVars = [...requiredEnvVars, ...optionalEnvVars]
    const presentEnvVars = allEnvVars.filter((envVar) => process.env[envVar])

    return NextResponse.json({
      success: missingRequired.length === 0,
      total: allEnvVars.length,
      present: presentEnvVars.length,
      missing_required: missingRequired,
      missing_optional: missingOptional,
      present_vars: presentEnvVars,
      completion_percentage: Math.round((presentEnvVars.length / allEnvVars.length) * 100),
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
