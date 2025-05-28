#!/bin/bash

# سكريپت إعداد Docker للبوت
set -e

# ألوان للمخرجات
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دوال المساعدة
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# فحص متطلبات النظام
check_requirements() {
    log_info "فحص متطلبات النظام..."

    # فحص Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker غير مثبت. يرجى تثبيت Docker أولاً."
        exit 1
    fi
    log_success "Docker متاح ✓"

    # فحص Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً."
        exit 1
    fi
    log_success "Docker Compose متاح ✓"

    # فحص Git
    if ! command -v git &> /dev/null; then
        log_warning "Git غير مثبت. قد تحتاجه لاحقاً."
    else
        log_success "Git متاح ✓"
    fi
}

# إنشاء ملف البيئة
setup_environment() {
    log_info "إعداد متغيرات البيئة..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "تم إنشاء ملف .env من .env.example"
        else
            cat > .env << EOF
# إعدادات تلقرام
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHANNEL_ID=@your_channel_username
ADMIN_CHAT_ID=your_admin_chat_id

# إعدادات xAI
XAI_API_KEY=your_xai_api_key_here

# إعدادات Supabase
SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# إعدادات الأمان
ENCRYPTION_KEY=your_encryption_key_here

# إعدادات Redis
REDIS_PASSWORD=your_redis_password_here

# إعدادات Docker
COMPOSE_PROJECT_NAME=telegram-whatsapp-bot
EOF
            log_success "تم إنشاء ملف .env جديد"
        fi
        
        log_warning "يرجى تحديث القيم في ملف .env قبل المتابعة"
        read -p "اضغط Enter بعد تحديث ملف .env..."
    else
        log_success "ملف .env موجود بالفعل"
    fi
}

# إنشاء المجلدات المطلوبة
create_directories() {
    log_info "إنشاء المجلدات المطلوبة..."

    directories=(
        "whatsapp-session"
        "logs"
        "backups"
        "nginx/ssl"
        "data/redis"
    )

    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "تم إنشاء مجلد: $dir"
        fi
    done
}

# بناء الصور
build_images() {
    log_info "بناء صور Docker..."

    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml build
    else
        docker-compose build
    fi

    log_success "تم بناء الصور بنجاح"
}

# تشغيل الخدمات
start_services() {
    log_info "تشغيل الخدمات..."

    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml up -d
        log_success "تم تشغيل الخدمات في وضع التطوير"
        log_info "يمكنك الوصول للتطبيق على: http://localhost:3000"
    else
        docker-compose up -d
        log_success "تم تشغيل الخدمات في وضع الإنتاج"
        log_info "يمكنك الوصول للتطبيق على: http://localhost"
    fi
}

# إيقاف الخدمات
stop_services() {
    log_info "إيقاف الخدمات..."

    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml down
    else
        docker-compose down
    fi

    log_success "تم إيقاف الخدمات"
}

# عرض السجلات
show_logs() {
    log_info "عرض السجلات..."

    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose logs -f
    fi
}

# فحص حالة الخدمات
check_status() {
    log_info "فحص حالة الخدمات..."

    if [ "$1" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml ps
    else
        docker-compose ps
    fi

    # فحص صحة التطبيق
    log_info "فحص صحة التطبيق..."
    sleep 5
    
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        log_success "التطبيق يعمل بشكل طبيعي ✓"
    else
        log_warning "التطبيق قد لا يعمل بشكل صحيح"
    fi
}

# تنظيف النظام
cleanup() {
    log_info "تنظيف النظام..."

    # إيقاف وحذف الحاويات
    docker-compose down --remove-orphans
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

    # حذف الصور غير المستخدمة
    docker image prune -f

    # حذف الشبكات غير المستخدمة
    docker network prune -f

    log_success "تم تنظيف النظام"
}

# النسخ الاحتياطي
backup() {
    log_info "إنشاء نسخة احتياطية..."

    backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    # نسخ احتياطي للبيانات
    docker-compose exec -T telegram-whatsapp-bot tar czf - /app/whatsapp-session > "$backup_dir/whatsapp-session.tar.gz" 2>/dev/null || true
    docker-compose exec -T redis redis-cli --rdb - > "$backup_dir/redis.rdb" 2>/dev/null || true

    # نسخ ملفات الإعداد
    cp .env "$backup_dir/" 2>/dev/null || true
    cp docker-compose.yml "$backup_dir/" 2>/dev/null || true

    log_success "تم إنشاء النسخة الاحتياطية في: $backup_dir"
}

# استعادة النسخة الاحتياطية
restore() {
    if [ -z "$1" ]; then
        log_error "يرجى تحديد مجلد النسخة الاحتياطية"
        exit 1
    fi

    backup_dir="$1"
    if [ ! -d "$backup_dir" ]; then
        log_error "مجلد النسخة الاحتياطية غير موجود: $backup_dir"
        exit 1
    fi

    log_info "استعادة النسخة الاحتياطية من: $backup_dir"

    # إيقاف الخدمات
    docker-compose down

    # استعادة البيانات
    if [ -f "$backup_dir/whatsapp-session.tar.gz" ]; then
        docker run --rm -v "$(pwd)/whatsapp-session:/restore" alpine tar xzf - -C /restore < "$backup_dir/whatsapp-session.tar.gz"
        log_success "تم استعادة جلسة واتساب"
    fi

    if [ -f "$backup_dir/redis.rdb" ]; then
        cp "$backup_dir/redis.rdb" "data/redis/"
        log_success "تم استعادة بيانات Redis"
    fi

    # استعادة الإعدادات
    if [ -f "$backup_dir/.env" ]; then
        cp "$backup_dir/.env" "./"
        log_success "تم استعادة إعدادات البيئة"
    fi

    # إعادة تشغيل الخدمات
    docker-compose up -d

    log_success "تم استعادة النسخة الاحتياطية بنجاح"
}

# عرض المساعدة
show_help() {
    echo "استخدام: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "الأوامر المتاحة:"
    echo "  setup [dev]     - إعداد البوت (dev للتطوير)"
    echo "  start [dev]     - تشغيل البوت"
    echo "  stop [dev]      - إيقاف البوت"
    echo "  restart [dev]   - إعادة تشغيل البوت"
    echo "  logs [dev]      - عرض السجلات"
    echo "  status [dev]    - فحص حالة الخدمات"
    echo "  build [dev]     - بناء الصور"
    echo "  cleanup         - تنظيف النظام"
    echo "  backup          - إنشاء نسخة احتياطية"
    echo "  restore <dir>   - استعادة نسخة احتياطية"
    echo "  help            - عرض هذه المساعدة"
    echo ""
    echo "أمثلة:"
    echo "  $0 setup        - إعداد للإنتاج"
    echo "  $0 setup dev    - إعداد للتطوير"
    echo "  $0 start        - تشغيل الإنتاج"
    echo "  $0 start dev    - تشغيل التطوير"
}

# الدالة الرئيسية
main() {
    case "$1" in
        setup)
            check_requirements
            setup_environment
            create_directories
            build_images "$2"
            start_services "$2"
            check_status "$2"
            ;;
        start)
            start_services "$2"
            check_status "$2"
            ;;
        stop)
            stop_services "$2"
            ;;
        restart)
            stop_services "$2"
            start_services "$2"
            check_status "$2"
            ;;
        logs)
            show_logs "$2"
            ;;
        status)
            check_status "$2"
            ;;
        build)
            build_images "$2"
            ;;
        cleanup)
            cleanup
            ;;
        backup)
            backup
            ;;
        restore)
            restore "$2"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "أمر غير معروف: $1"
            show_help
            exit 1
            ;;
    esac
}

# تشغيل الدالة الرئيسية
main "$@"
