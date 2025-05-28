#!/usr/bin/env node

/**
 * سكريپت إعداد البوت البسيط بدون ذكاء اصطناعي
 */

import fs from "fs/promises"

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

async function setupEnvironment() {
  logStep("1", "إعداد متغيرات البيئة...")

  const envPath = ".env.local"
  const envContent = `# إعدادات تلقرام (مطلوبة)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHANNEL_ID=@your_channel_username
ADMIN_CHAT_ID=your_admin_chat_id

# إعدادات قاعدة البيانات - اختر واحدة
# PostgreSQL (موصى به)
DATABASE_TYPE=postgresql
DATABASE_HOST=your-db-host.northflank.app
DATABASE_PORT=5432
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=telegram_whatsapp_bot
DATABASE_SSL=true

# أو MongoDB
# DATABASE_TYPE=mongodb
# DATABASE_HOST=your-mongo-host.northflank.app
# DATABASE_PORT=27017
# DATABASE_USERNAME=your-username
# DATABASE_PASSWORD=your-password
# DATABASE_NAME=telegram_whatsapp_bot

# أو Redis فقط (للاستخدام البسيط)
# DATABASE_TYPE=redis
# REDIS_HOST=your-redis-host.northflank.app
# REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password

# إعدادات الأمان (مطلوبة)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# إعدادات البوت
BOT_MIN_DELAY=30
BOT_MAX_DELAY=120
BOT_BETWEEN_GROUPS_DELAY=15
BOT_MAX_MESSAGES_PER_HOUR=50

# كلمات محظورة (اختيارية)
BLOCKED_WORDS=spam,advertisement,إعلان

# إعدادات Docker (للنشر)
COMPOSE_PROJECT_NAME=telegram-whatsapp-bot-simple
NODE_ENV=production
`

  try {
    await fs.access(envPath)
    logWarning(".env.local موجود بالفعل - سيتم تخطي هذه الخطوة")
  } catch {
    await fs.writeFile(envPath, envContent)
    logSuccess("تم إنشاء .env.local")
    logWarning("يرجى تحديث القيم في .env.local")
  }
}

async function generateEncryptionKey() {
  logStep("2", "إنشاء مفتاح التشفير...")

  try {
    const crypto = await import("crypto")
    const key = crypto.randomBytes(16).toString("hex") // 32 حرف

    log(`مفتاح التشفير المُنشأ: ${key}`, "yellow")
    log("احفظ هذا المفتاح في متغير البيئة ENCRYPTION_KEY", "yellow")

    return key
  } catch (error) {
    logError("فشل في إنشاء مفتاح التشفير")
    return null
  }
}

async function showDatabaseOptions() {
  logStep("3", "خيارات قواعد البيانات...")

  log("\n📊 قواعد البيانات المدعومة:", "bold")

  log("\n🐘 PostgreSQL (موصى به):", "blue")
  log("  • مثالي للاستخدام العام", "reset")
  log("  • دعم كامل لجميع الميزات", "reset")
  log("  • Northflank: $15/شهر (Micro)", "reset")
  log("  • Supabase: مجاني حتى 500MB", "reset")

  log("\n🍃 MongoDB:", "blue")
  log("  • مرونة في هيكل البيانات", "reset")
  log("  • سهولة التوسع", "reset")
  log("  • Northflank: $20/شهر (Micro)", "reset")
  log("  • MongoDB Atlas: مجاني حتى 512MB", "reset")

  log("\n🔴 Redis:", "blue")
  log("  • سرعة فائقة", "reset")
  log("  • مثالي للتخزين المؤقت", "reset")
  log("  • Northflank: $10/شهر (Micro)", "reset")
  log("  • Redis Cloud: مجاني حتى 30MB", "reset")

  log("\n🐬 MySQL:", "blue")
  log("  • سهولة الاستخدام", "reset")
  log("  • دعم واسع", "reset")
  log("  • PlanetScale: مجاني حتى 1GB", "reset")
}

async function showNextSteps() {
  logStep("✅", "اكتمل الإعداد!")

  log("\n📋 الخطوات التالية:", "bold")
  log("1. حدث متغيرات البيئة في .env.local", "yellow")
  log("2. احصل على توكن بوت تلقرام من @BotFather", "yellow")
  log("3. أنشئ قاعدة بيانات في Northflank أو استخدم بديل مجاني", "yellow")
  log("4. شغل البوت: npm run dev", "yellow")
  log("5. اذهب إلى /database لاختبار قاعدة البيانات", "yellow")
  log("6. اذهب إلى /setup لربط واتساب", "yellow")
  log("7. اختبر البوت في /test", "yellow")

  log("\n🔧 أوامر مفيدة:", "bold")
  log("npm run dev          # تشغيل في وضع التطوير", "blue")
  log("npm run build        # بناء المشروع", "blue")
  log("npm start            # تشغيل الإنتاج", "blue")

  log("\n📚 صفحات مفيدة:", "bold")
  log("/database            # إدارة قاعدة البيانات", "blue")
  log("/setup               # ربط واتساب", "blue")
  log("/test                # اختبار الرسائل", "blue")
  log("/status              # حالة النظام", "blue")
  log("/api/health          # فحص صحة النظام", "blue")

  log("\n🎯 مميزات البوت البسيط:", "bold")
  log("✅ بدون ذكاء اصطناعي - أسرع وأوفر", "green")
  log("✅ دعم قواعد بيانات متعددة", "green")
  log("✅ تشفير البيانات الحساسة", "green")
  log("✅ واجهة إدارة سهلة", "green")
  log("✅ مراقبة وإحصائيات", "green")
  log("✅ اختبار الرسائل", "green")
}

async function main() {
  log("🤖 مرحباً بك في معالج إعداد البوت البسيط", "bold")
  log("بوت تلقرام - واتساب بدون ذكاء اصطناعي\n", "blue")

  try {
    await setupEnvironment()
    const encryptionKey = await generateEncryptionKey()
    await showDatabaseOptions()
    await showNextSteps()

    if (encryptionKey) {
      log(`\n🔐 لا تنس إضافة مفتاح التشفير: ${encryptionKey}`, "yellow")
    }
  } catch (error) {
    logError(`خطأ في الإعداد: ${error.message}`)
    process.exit(1)
  }
}

// تشغيل المعالج
main().catch(console.error)
