# استخدام Node.js الرسمي كصورة أساسية
FROM node:18-alpine

# تثبيت المكتبات المطلوبة لـ Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    py3-pip \
    postgresql-client \
    && rm -rf /var/cache/apk/*

# إعداد Puppeteer لاستخدام Chromium المثبت
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# إنشاء مجلد التطبيق
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت المكتبات
RUN npm install && npm cache clean --force

# نسخ ملف requirements.txt وتثبيت المكتبات Python
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# نسخ الكود المصدري
COPY . .

# بناء التطبيق
RUN npm run build

# إنشاء المجلدات المطلوبة
RUN mkdir -p /app/whatsapp-session /app/logs /app/backups

# كشف المنفذ
EXPOSE 3000

# متغيرات البيئة
ENV NODE_ENV=production
ENV PORT=3000

# فحص صحة الحاوية
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:3000/api/health || exit 1

# سكريبت بدء التشغيل
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# تشغيل التطبيق
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
