#!/bin/bash

# سكريپت فحص صحة الحاوية
set -e

# متغيرات
HEALTH_URL="http://localhost:3000/api/health"
MAX_RETRIES=3
RETRY_DELAY=5

# دالة فحص الصحة
check_health() {
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
            echo "✅ التطبيق يعمل بشكل طبيعي"
            return 0
        fi
        
        retries=$((retries + 1))
        echo "⚠️  محاولة $retries من $MAX_RETRIES فشلت، إعادة المحاولة خلال $RETRY_DELAY ثانية..."
        sleep $RETRY_DELAY
    done
    
    echo "❌ فشل في الوصول للتطبيق بعد $MAX_RETRIES محاولات"
    return 1
}

# فحص متطلبات النظام
check_system() {
    # فحص استخدام الذاكرة
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    echo "📊 استخدام الذاكرة: ${memory_usage}%"
    
    # فحص مساحة القرص
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "💾 استخدام القرص: ${disk_usage}%"
    
    # تحذيرات
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        echo "⚠️  تحذير: استخدام الذاكرة مرتفع"
    fi
    
    if [ "$disk_usage" -gt 90 ]; then
        echo "⚠️  تحذير: مساحة القرص منخفضة"
    fi
}

# فحص الخدمات
check_services() {
    echo "🔍 فحص حالة الخدمات..."
    
    # فحص حاوية التطبيق
    if docker ps | grep -q "telegram-whatsapp-bot"; then
        echo "✅ حاوية التطبيق تعمل"
    else
        echo "❌ حاوية التطبيق لا تعمل"
        return 1
    fi
    
    # فحص Redis
    if docker ps | grep -q "telegram-whatsapp-redis"; then
        echo "✅ Redis يعمل"
    else
        echo "⚠️  Redis لا يعمل"
    fi
    
    # فحص Nginx
    if docker ps | grep -q "telegram-whatsapp-nginx"; then
        echo "✅ Nginx يعمل"
    else
        echo "⚠️  Nginx لا يعمل"
    fi
}

# الدالة الرئيسية
main() {
    echo "🏥 بدء فحص صحة النظام..."
    echo "================================"
    
    check_system
    echo ""
    
    check_services
    echo ""
    
    check_health
    
    echo "================================"
    echo "✅ انتهى فحص الصحة"
}

# تشغيل الفحص
main "$@"
