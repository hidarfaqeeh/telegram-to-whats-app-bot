# 🗄️ قواعد البيانات المتاحة في Northflank

## أنواع قواعد البيانات المدعومة

### 1. PostgreSQL 🐘
- **الوصف**: قاعدة بيانات علائقية قوية ومفتوحة المصدر
- **الاستخدام**: مثالية للتطبيقات التي تحتاج لاستعلامات معقدة وعلاقات بين البيانات
- **المميزات**:
  - دعم كامل لـ SQL
  - أداء عالي
  - دعم JSON
  - نسخ احتياطي تلقائي
- **الإصدارات المتاحة**: 12, 13, 14, 15, 16
- **أحجام المثيل**: من 1GB إلى 64GB RAM

### 2. MongoDB 🍃
- **الوصف**: قاعدة بيانات NoSQL مرنة
- **الاستخدام**: مثالية للبيانات غير المنظمة والتطبيقات السريعة
- **المميزات**:
  - مرونة في هيكل البيانات
  - سهولة التوسع الأفقي
  - دعم للبيانات الجغرافية
  - استعلامات سريعة
- **الإصدارات المتاحة**: 4.4, 5.0, 6.0, 7.0
- **أحجام المثيل**: من 1GB إلى 32GB RAM

### 3. Redis 🔴
- **الوصف**: قاعدة بيانات في الذاكرة للتخزين المؤقت
- **الاستخدام**: مثالية للتخزين المؤقت والجلسات والطوابير
- **المميزات**:
  - سرعة فائقة
  - دعم لأنواع بيانات متقدمة
  - نشر/اشتراك
  - انتهاء صلاحية تلقائي
- **الإصدارات المتاحة**: 6.2, 7.0, 7.2
- **أحجام المثيل**: من 512MB إلى 16GB RAM

### 4. MySQL 🐬
- **الوصف**: قاعدة بيانات علائقية شائعة
- **الاستخدام**: مثالية للتطبيقات التقليدية وWordPress
- **المميزات**:
  - سهولة الاستخدام
  - أداء جيد
  - دعم واسع
  - أدوات إدارة متقدمة
- **الإصدارات المتاحة**: 5.7, 8.0
- **أحجام المثيل**: من 1GB إلى 32GB RAM

## 💰 التسعير (تقريبي)

### PostgreSQL & MySQL
- **Micro (1GB RAM, 10GB Storage)**: $15/شهر
- **Small (2GB RAM, 20GB Storage)**: $30/شهر
- **Medium (4GB RAM, 40GB Storage)**: $60/شهر
- **Large (8GB RAM, 80GB Storage)**: $120/شهر

### MongoDB
- **Micro (1GB RAM, 10GB Storage)**: $20/شهر
- **Small (2GB RAM, 20GB Storage)**: $40/شهر
- **Medium (4GB RAM, 40GB Storage)**: $80/شهر

### Redis
- **Micro (512MB RAM)**: $10/شهر
- **Small (1GB RAM)**: $20/شهر
- **Medium (2GB RAM)**: $40/شهر

## 🔧 إعداد قاعدة البيانات في Northflank

### الخطوات:
1. **تسجيل الدخول** إلى Northflank
2. **إنشاء مشروع جديد** أو اختيار مشروع موجود
3. **النقر على "Add Service"**
4. **اختيار "Database"**
5. **اختيار نوع قاعدة البيانات** (PostgreSQL, MongoDB, Redis, MySQL)
6. **تحديد الإصدار والحجم**
7. **تكوين الإعدادات**:
   - اسم قاعدة البيانات
   - اسم المستخدم
   - كلمة المرور
   - المنطقة الجغرافية
8. **النشر والانتظار** حتى تصبح جاهزة

### الحصول على معلومات الاتصال:
بعد إنشاء قاعدة البيانات، ستحصل على:
- **Host**: عنوان الخادم
- **Port**: رقم المنفذ
- **Username**: اسم المستخدم
- **Password**: كلمة المرور
- **Database Name**: اسم قاعدة البيانات
- **Connection String**: سلسلة الاتصال الكاملة

## 🏆 التوصيات لبوت تلقرام-واتساب

### للاستخدام الأساسي:
**PostgreSQL Micro (1GB RAM)**
- مثالي للبداية
- يدعم جميع ميزات البوت
- سعر معقول ($15/شهر)

### للاستخدام المتقدم:
**PostgreSQL Small (2GB RAM) + Redis Micro**
- PostgreSQL للبيانات الأساسية
- Redis للتخزين المؤقت والجلسات
- أداء محسن
- إجمالي: $50/شهر

### للاستخدام المكثف:
**PostgreSQL Medium (4GB RAM) + Redis Small**
- للبوتات التي تخدم مئات المجموعات
- أداء عالي
- إجمالي: $100/شهر

## 🔄 البدائل المجانية

إذا كنت تريد توفير المال، يمكنك استخدام:

1. **Supabase** (مجاني حتى 500MB)
2. **PlanetScale** (مجاني حتى 1GB)
3. **MongoDB Atlas** (مجاني حتى 512MB)
4. **Redis Cloud** (مجاني حتى 30MB)
5. **Neon** (PostgreSQL مجاني حتى 3GB)

## 📝 مثال على متغيرات البيئة

\`\`\`env
# PostgreSQL في Northflank
DATABASE_TYPE=postgresql
DATABASE_HOST=your-db-host.northflank.app
DATABASE_PORT=5432
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=your-database
DATABASE_SSL=true

# أو MongoDB
DATABASE_TYPE=mongodb
DATABASE_HOST=your-mongo-host.northflank.app
DATABASE_PORT=27017
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=your-database

# أو Redis للتخزين المؤقت
REDIS_HOST=your-redis-host.northflank.app
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
