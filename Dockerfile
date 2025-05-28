# استخدام Node.js الرسمي كصورة أساسية
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

# نسخ ملفات package
COPY package*.json ./

# تثبيت المكتبات
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force
RUN npm install --only=production && npm cache clean --force

# نسخ الكود المصدري
COPY . .

# بناء التطبيق
RUN npm run build

# إنشاء مستخدم غير جذر
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# إنشاء المجلدات المطلوبة وتعيين الصلاحيات
RUN mkdir -p /app/whatsapp-session /app/logs /app/backups
RUN chown -R nextjs:nodejs /app

# التبديل للمستخدم غير الجذر
USER nextjs

# كشف المنفذ
EXPOSE 3000

# متغيرات البيئة
ENV NODE_ENV=production
ENV PORT=3000

# فحص صحة الحاوية
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# تشغيل التطبيق
CMD ["npm", "start"]
