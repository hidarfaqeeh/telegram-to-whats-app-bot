import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Simple health check without complex database operations
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          connected: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          type: "supabase",
          status: "configured",
        },
        telegram: {
          status: process.env.TELEGRAM_BOT_TOKEN ? "configured" : "not_configured",
        },
        whatsapp: {
          status: "ready",
        },
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
      environment: process.env.NODE_ENV || "development",
      features: {
        database_enabled: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        telegram_enabled: !!process.env.TELEGRAM_BOT_TOKEN,
        whatsapp_enabled: false, // Will be updated when WhatsApp is connected
      },
    }

    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
