# 🚀 دليل النشر على Northflank

## نظرة عامة
Northflank هي منصة سحابية ممتازة لنشر التطبيقات مع دعم كامل لـ Docker وقواعد البيانات المتقدمة.

## 📋 المتطلبات الأساسية

### 1. حساب Northflank
- اذهب إلى [northflank.com](https://northflank.com)
- أنشئ حساب جديد أو سجل دخول
- احصل على الخطة المجانية (تكفي للبداية)

### 2. ملفات المشروع
- تأكد من وجود `Dockerfile` في المشروع
- ملف `package.json` مع جميع المكتبات
- متغيرات البيئة جاهزة

## 🗄️ إعداد قاعدة البيانات

### الخطوة 1: إنشاء قاعدة بيانات PostgreSQL

1. **اذهب إلى Northflank Dashboard**
2. **اضغط "Create Service"**
3. **اختر "Database"**
4. **اختر "PostgreSQL"**

### إعدادات قاعدة البيانات:
\`\`\`yaml
Database Type: PostgreSQL
Version: 15 (الأحدث)
Plan: 
  - Micro (1GB RAM, 10GB Storage) - $15/شهر
  - أو Small (2GB RAM, 20GB Storage) - $30/شهر

Configuration:
  Database Name: telegram_whatsapp_bot
  Username: bot_user
  Password: [سيتم إنشاؤها تلقائياً]
  
Region: اختر الأقرب لك (Europe West أو US East)
\`\`\`

### الخطوة 2: الحصول على معلومات الاتصال

بعد إنشاء قاعدة البيانات، ستحصل على:
\`\`\`env
DATABASE_HOST=your-db-host.northflank.app
DATABASE_PORT=5432
DATABASE_USERNAME=bot_user
DATABASE_PASSWORD=generated_password
DATABASE_NAME=telegram_whatsapp_bot
DATABASE_SSL=true
\`\`\`

## 🚀 نشر التطبيق

### الخطوة 1: إنشاء خدمة جديدة

1. **في Northflank Dashboard، اضغط "Create Service"**
2. **اختر "Combined Service"**
3. **اختر "Deploy from Git Repository"**

### الخطوة 2: ربط المستودع

\`\`\`yaml
Repository Settings:
  Source: GitHub/GitLab
  Repository: your-username/telegram-whatsapp-bot
  Branch: main
  
Build Settings:
  Build Method: Dockerfile
  Dockerfile Path: ./Dockerfile
  Context Path: .
\`\`\`

### الخطوة 3: إعدادات الخدمة

\`\`\`yaml
Service Configuration:
  Service Name: telegram-whatsapp-bot
  Port: 3000
  
Resources:
  CPU: 0.5 vCPU
  Memory: 1GB RAM
  
Scaling:
  Min Replicas: 1
  Max Replicas: 2
\`\`\`

## 🔧 متغيرات البيئة

### إضافة متغيرات البيئة في Northflank:

1. **اذهب إلى Service Settings**
2. **اضغط "Environment Variables"**
3. **أضف المتغيرات التالية:**

\`\`\`env
# إعدادات تلقرام
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=@your_channel
ADMIN_CHAT_ID=your_admin_chat_id

# إعدادات قاعدة البيانات (من الخطوة السابقة)
DATABASE_TYPE=postgresql
DATABASE_HOST=your-db-host.northflank.app
DATABASE_PORT=5432
DATABASE_USERNAME=bot_user
DATABASE_PASSWORD=your_generated_password
DATABASE_NAME=telegram_whatsapp_bot
DATABASE_SSL=true

# إعدادات الأمان
ENCRYPTION_KEY=your_32_character_encryption_key

# إعدادات البوت
BOT_MIN_DELAY=30
BOT_MAX_DELAY=120
BOT_BETWEEN_GROUPS_DELAY=15
BOT_MAX_MESSAGES_PER_HOUR=50

# إعدادات الإنتاج
NODE_ENV=production
PORT=3000
\`\`\`

## 📦 Dockerfile محسن لـ Northflank

```dockerfile file="Dockerfile.northflank"
# استخدام Node.js 18 Alpine للحجم الأصغر
FROM node:18-alpine AS base

# تثبيت المكتبات المطلوبة لـ Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# إعداد Puppeteer لاستخدام Chromium المثبت
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ ملفات package أولاً للاستفادة من Docker cache
COPY package*.json ./

# تثبيت المكتبات
RUN npm ci --only=production && npm cache clean --force

# نسخ الكود المصدري
COPY . .

# بناء التطبيق
RUN npm run build

# إنشاء مستخدم غير جذر للأمان
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# إنشاء المجلدات المطلوبة وتعيين الصلاحيات
RUN mkdir -p /app/whatsapp-session /app/logs /app/backups && \
    chown -R nextjs:nodejs /app

# التبديل للمستخدم غير الجذر
USER nextjs

# كشف المنفذ
EXPOSE 3000

# متغيرات البيئة
ENV NODE_ENV=production \
    PORT=3000

# فحص صحة الحاوية
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# تشغيل التطبيق
CMD ["npm", "start"]
