#!/bin/sh
set -e

# انتظار اتصال PostgreSQL
echo "🔄 انتظار اتصال PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" -c '\q'; do
  echo "⏳ PostgreSQL غير متاح - انتظار..."
  sleep 2
done
echo "✅ تم الاتصال بـ PostgreSQL بنجاح!"

# تهيئة قاعدة البيانات
echo "🔄 تهيئة قاعدة البيانات..."
node scripts/setup-database.js

# تشغيل الأمر المحدد
echo "🚀 بدء تشغيل التطبيق..."
exec "$@"