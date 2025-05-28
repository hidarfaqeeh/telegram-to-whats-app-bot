#!/usr/bin/env node

/**
 * سكريبت إعداد البوت التلقائي
 * يقوم بإعداد قاعدة البيانات والتحقق من المتطلبات
 */

import fs from "fs/promises"
import { execSync } from "child_process"
import { createClient } from "@supabase/supabase-js"

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
}

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`\n${colors.bold}[${step}]${colors.reset} ${message}`, "blue")
}

function logSuccess(message) {
  log(`✅ ${message}`, "green")
}

function logError(message) {
  log(`❌ ${message}`, "red")
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow")
}

async function checkRequirements() {
  logStep("1", "فحص المتطلبات الأساسية...")

  // فحص Node.js
  try {
    const nodeVersion = execSync("node --version", { encoding: "utf8" }).trim()
    const majorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0])

    if (majorVersion >= 18) {
      logSuccess(`Node.js ${nodeVersion} ✓`)
    } else {
      logError(`Node.js ${nodeVersion} - يتطلب الإصدار 18 أو أحدث`)
      process.exit(1)
    }
  } catch (error) {
    logError("Node.js غير مثبت")
    process.exit(1)
  }

  // فحص npm
  try {
    const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim()
    logSuccess(`npm ${npmVersion} ✓`)
  } catch (error) {
    logError("npm غير متاح")
    process.exit(1)
  }

  // فحص Chrome/Chromium
  try {
    execSync("which google-chrome || which chromium-browser || which chromium", { stdio: "ignore" })
    logSuccess("Chrome/Chromium متاح ✓")
  } catch (error) {
    logWarning("Chrome/Chromium غير موجود - قد يؤثر على واتساب")
  }
}

async function setupEnvironment() {
  logStep("2", "إعداد متغيرات البيئة...")

  const envPath = ".env.local"
  const envExamplePath = ".env.example"

  try {
    // التحقق من وجود .env.example
    await fs.access(envExamplePath)

    // التحقق من وجود .env.local
    try {
      await fs.access(envPath)
      logWarning(".env.local موجود بالفعل - سيتم تخطي هذه الخطوة")
    } catch {
      // نسخ .env.example إلى .env.local
      const envExample = await fs.readFile(envExamplePath, "utf8")
      await fs.writeFile(envPath, envExample)
      logSuccess("تم إنشاء .env.local من .env.example")
      logWarning("يرجى تحديث القيم في .env.local")
    }
  } catch (error) {
    logError("ملف .env.example غير موجود")
  }
}

async function installDependencies() {
  logStep("3", "تثبيت المكتبات...")

  try {
    log("جاري تثبيت المكتبات...", "yellow")
    execSync("npm install", { stdio: "inherit" })
    logSuccess("تم تثبيت جميع المكتبات")
  } catch (error) {
    logError("فشل في تثبيت المكتبات")
    process.exit(1)
  }
}

async function setupDatabase() {
  logStep("4", "إعداد قاعدة البيانات...")

  // قراءة متغيرات البيئة
  try {
    const envContent = await fs.readFile(".env.local", "utf8")
    const envVars = {}

    envContent.split("\n").forEach((line) => {
      const [key, value] = line.split("=")
      if (key && value) {
        envVars[key.trim()] = value.trim()
      }
    })

    const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      logWarning("متغيرات Supabase غير مكتملة - سيتم تخطي إعداد قاعدة البيانات")
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // إنشاء الجداول
    const tables = [
      {
        name: "whatsapp_groups",
        sql: `
          CREATE TABLE IF NOT EXISTS whatsapp_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            participants INTEGER DEFAULT 0,
            enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
      {
        name: "forwarded_messages",
        sql: `
          CREATE TABLE IF NOT EXISTS forwarded_messages (
            id SERIAL PRIMARY KEY,
            telegram_message_id INTEGER NOT NULL,
            content TEXT,
            media_type TEXT,
            forwarded_to_groups TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status TEXT DEFAULT 'pending'
          )
        `,
      },
      {
        name: "bot_stats",
        sql: `
          CREATE TABLE IF NOT EXISTS bot_stats (
            id SERIAL PRIMARY KEY,
            total_forwarded INTEGER DEFAULT 0,
            total_errors INTEGER DEFAULT 0,
            uptime_seconds INTEGER DEFAULT 0,
            last_activity TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
      {
        name: "bot_logs",
        sql: `
          CREATE TABLE IF NOT EXISTS bot_logs (
            id SERIAL PRIMARY KEY,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
      {
        name: "test_messages",
        sql: `
          CREATE TABLE IF NOT EXISTS test_messages (
            id SERIAL PRIMARY KEY,
            message_type TEXT NOT NULL,
            content TEXT NOT NULL,
            target_groups TEXT[],
            results JSONB,
            total_sent INTEGER DEFAULT 0,
            total_failed INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
      },
    ]

    for (const table of tables) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql: table.sql })
        if (error) throw error
        logSuccess(`جدول ${table.name} ✓`)
      } catch (error) {
        logError(`فشل في إنشاء جدول ${table.name}: ${error.message}`)
      }
    }
  } catch (error) {
    logError(`خطأ في إعداد قاعدة البيانات: ${error.message}`)
  }
}

async function createStartupScripts() {
  logStep("5", "إنشاء سكريبتات التشغيل...")

  // سكريبت تشغيل البوت
  const startScript = `#!/bin/bash
# سكريبت تشغيل البوت

echo "🚀 بدء تشغيل بوت تلقرام - واتساب..."

# التحقق من متغيرات البيئة
if [ ! -f .env.local ]; then
    echo "❌ ملف .env.local غير موجود"
    exit 1
fi

# تشغيل البوت
npm run build
npm start
`

  const stopScript = `#!/bin/bash
# سكريپت إيقاف البوت

echo "🛑 إيقاف البوت..."

# البحث عن عملية البوت وإيقافها
pkill -f "telegram-whatsapp-bot"

echo "✅ تم إيقاف البوت"
`

  const restartScript = `#!/bin/bash
# سكريپت إعادة تشغيل البوت

echo "🔄 إعادة تشغيل البوت..."

# إيقاف البوت
./scripts/stop.sh

# انتظار قليل
sleep 2

# تشغيل البوت
./scripts/start.sh
`

  try {
    // إنشاء مجلد scripts
    await fs.mkdir("scripts", { recursive: true })

    // كتابة السكريپتات
    await fs.writeFile("scripts/start.sh", startScript)
    await fs.writeFile("scripts/stop.sh", stopScript)
    await fs.writeFile("scripts/restart.sh", restartScript)

    // جعل السكريپتات قابلة للتنفيذ
    execSync("chmod +x scripts/*.sh")

    logSuccess("تم إنشاء سكريپتات التشغيل")
  } catch (error) {
    logError(`فشل في إنشاء السكريپتات: ${error.message}`)
  }
}

async function generateSystemdService() {
  logStep("6", "إنشاء ملف خدمة systemd...")

  const serviceContent = `[Unit]
Description=Telegram to WhatsApp Bot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${process.cwd()}
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`

  try {
    await fs.writeFile("telegram-whatsapp-bot.service", serviceContent)
    logSuccess("تم إنشاء ملف الخدمة")
    log("لتثبيت الخدمة:", "yellow")
    log("sudo cp telegram-whatsapp-bot.service /etc/systemd/system/", "yellow")
    log("sudo systemctl enable telegram-whatsapp-bot", "yellow")
    log("sudo systemctl start telegram-whatsapp-bot", "yellow")
  } catch (error) {
    logError(`فشل في إنشاء ملف الخدمة: ${error.message}`)
  }
}

async function showNextSteps() {
  logStep("✅", "اكتمل الإعداد!")

  log("\n📋 الخطوات التالية:", "bold")
  log("1. حدث متغيرات البيئة في .env.local", "yellow")
  log("2. احصل على توكن بوت تلقرام من @BotFather", "yellow")
  log("3. أضف البوت إلى قناة تلقرام كمشرف", "yellow")
  log("4. شغل البوت: npm run dev", "yellow")
  log("5. اذهب إلى /setup لربط واتساب", "yellow")
  log("6. اختبر البوت في /test", "yellow")

  log("\n🔧 أوامر مفيدة:", "bold")
  log("npm run dev          # تشغيل في وضع التطوير", "blue")
  log("npm run build        # بناء المشروع", "blue")
  log("npm start            # تشغيل الإنتاج", "blue")
  log("./scripts/start.sh   # تشغيل البوت", "blue")
  log("./scripts/stop.sh    # إيقاف البوت", "blue")
  log("./scripts/restart.sh # إعادة تشغيل البوت", "blue")

  log("\n📚 للمساعدة:", "bold")
  log("- راجع الوثائق في /docs", "blue")
  log("- تحقق من السجلات في لوحة التحكم", "blue")
  log("- استخدم /api/health للتحقق من حالة البوت", "blue")
}

async function main() {
  log("🤖 مرحباً بك في معالج إعداد بوت تلقرام - واتساب", "bold")
  log("سيقوم هذا المعالج بإعداد البوت تلقائياً\n", "blue")

  try {
    await checkRequirements()
    await setupEnvironment()
    await installDependencies()
    await setupDatabase()
    await createStartupScripts()
    await generateSystemdService()
    await showNextSteps()
  } catch (error) {
    logError(`خطأ في الإعداد: ${error.message}`)
    process.exit(1)
  }
}

// تشغيل المعالج
main().catch(console.error)
