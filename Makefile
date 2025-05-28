# Makefile لإدارة Docker

.PHONY: help setup start stop restart logs status build cleanup backup restore

# متغيرات
COMPOSE_FILE = docker-compose.yml
COMPOSE_FILE_DEV = docker-compose.dev.yml
PROJECT_NAME = telegram-whatsapp-bot

# الهدف الافتراضي
help: ## عرض المساعدة
	@echo "الأوامر المتاحة:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## إعداد البوت للإنتاج
	@./scripts/docker-setup.sh setup

setup-dev: ## إعداد البوت للتطوير
	@./scripts/docker-setup.sh setup dev

start: ## تشغيل البوت (إنتاج)
	@docker-compose up -d
	@echo "✅ تم تشغيل البوت - http://localhost"

start-dev: ## تشغيل البوت (تطوير)
	@docker-compose -f $(COMPOSE_FILE_DEV) up -d
	@echo "✅ تم تشغيل البوت في وضع التطوير - http://localhost:3000"

stop: ## إيقاف البوت (إنتاج)
	@docker-compose down

stop-dev: ## إيقاف البوت (تطوير)
	@docker-compose -f $(COMPOSE_FILE_DEV) down

restart: stop start ## إعادة تشغيل البوت (إنتاج)

restart-dev: stop-dev start-dev ## إعادة تشغيل البوت (تطوير)

logs: ## عرض السجلات (إنتاج)
	@docker-compose logs -f

logs-dev: ## عرض السجلات (تطوير)
	@docker-compose -f $(COMPOSE_FILE_DEV) logs -f

status: ## فحص حالة الخدمات (إنتاج)
	@docker-compose ps
	@echo "\n🔍 فحص صحة التطبيق..."
	@curl -s http://localhost/api/health | jq . || echo "❌ التطبيق غير متاح"

status-dev: ## فحص حالة الخدمات (تطوير)
	@docker-compose -f $(COMPOSE_FILE_DEV) ps
	@echo "\n🔍 فحص صحة التطبيق..."
	@curl -s http://localhost:3000/api/health | jq . || echo "❌ التطبيق غير متاح"

build: ## بناء الصور (إنتاج)
	@docker-compose build --no-cache

build-dev: ## بناء الصور (تطوير)
	@docker-compose -f $(COMPOSE_FILE_DEV) build --no-cache

shell: ## الدخول إلى حاوية التطبيق
	@docker-compose exec telegram-whatsapp-bot sh

shell-dev: ## الدخول إلى حاوية التطبيق (تطوير)
	@docker-compose -f $(COMPOSE_FILE_DEV) exec telegram-whatsapp-bot-dev sh

cleanup: ## تنظيف النظام
	@./scripts/docker-setup.sh cleanup

backup: ## إنشاء نسخة احتياطية
	@./scripts/docker-setup.sh backup

restore: ## استعادة نسخة احتياطية (استخدم: make restore BACKUP_DIR=path)
	@./scripts/docker-setup.sh restore $(BACKUP_DIR)

update: ## تحديث الصور
	@docker-compose pull
	@docker-compose up -d

health: ## فحص صحة التطبيق
	@curl -f http://localhost/api/health && echo "✅ التطبيق يعمل بشكل طبيعي" || echo "❌ التطبيق لا يعمل"

health-dev: ## فحص صحة التطبيق (تطوير)
	@curl -f http://localhost:3000/api/health && echo "✅ التطبيق يعمل بشكل طبيعي" || echo "❌ التطبيق لا يعمل"

# أوامر الصيانة
prune: ## حذف الصور والحاويات غير المستخدمة
	@docker system prune -f
	@docker volume prune -f

reset: ## إعادة تعيين كامل (حذف جميع البيانات)
	@echo "⚠️  هذا سيحذف جميع البيانات!"
	@read -p "هل أنت متأكد؟ (y/N): " confirm && [ "$$confirm" = "y" ]
	@docker-compose down -v
	@docker-compose -f $(COMPOSE_FILE_DEV) down -v
	@docker system prune -af
	@rm -rf whatsapp-session logs backups
	@echo "✅ تم إعادة التعيين"
