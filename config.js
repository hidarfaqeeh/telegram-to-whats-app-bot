// ملف الإعدادات المتقدمة
export const ADVANCED_CONFIG = {
  // إعدادات التأخير الذكي
  delays: {
    // تأخير متدرج حسب حجم المجموعة
    calculateDelay: (groupSize) => {
      if (groupSize > 100) return 60000; // دقيقة للمجموعات الكبيرة
      if (groupSize > 50) return 45000;  // 45 ثانية للمجموعات المتوسطة
      return 30000; // 30 ثانية للمجموعات الصغيرة
    },
    
    // تأخير إضافي في أوقات الذروة
    peakHours: {
      enabled: true,
      hours: [9, 10, 11, 18, 19, 20], // ساعات الذروة
      multiplier: 1.5 // مضاعف التأخير
    },
    
    // تأخير عشوائي لتجنب الكشف
    randomization: {
      enabled: true,
      variance: 0.3 // 30% تباين عشوائي
    }
  },

  // إعدادات الرسائل
  messages: {
    // حد أقصى لطول الرسالة
    maxLength: 4000,
    
    // إضافة توقيع للرسائل
    signature: {
      enabled: true,
      text: "\n\n🤖 تم إرسالها تلقائياً"
    },
    
    // تنسيق الرسائل
    formatting: {
      addTimestamp: true,
      addSource: true,
      preserveFormatting: true
    }
  },

  // إعدادات الأمان
  security: {
    // حد أقصى للرسائل في الساعة
    rateLimit: {
      enabled: true,
      maxPerHour: 50,
      maxPerDay: 500
    },
    
    // كلمات محظورة
    blockedWords: [
      // أضف الكلمات المحظورة هنا
    ],
    
    // تشفير البيانات المحفوظة
    encryption: {
      enabled: false,
      key: process.env.ENCRYPTION_KEY
    }
  },

  // إعدادات المراقبة
  monitoring: {
    // تسجيل مفصل
    logging: {
      enabled: true,
      level: 'info', // debug, info, warn, error
      saveToFile: true,
      maxFileSize: '10MB'
    },
    
    // إشعارات الأخطاء
    errorNotifications: {
      enabled: true,
      telegramChatId: process.env.ADMIN_CHAT_ID,
      threshold: 5 // عدد الأخطاء قبل الإشعار
    },
    
    // تقارير دورية
    reports: {
      enabled: true,
      interval: '24h', // كل 24 ساعة
      includeStats: true
    }
  },

  // إعدادات النسخ الاحتياطي
  backup: {
    enabled: true,
    interval: '6h', // كل 6 ساعات
    keepDays: 7, // الاحتفاظ لمدة 7 أيام
    location: './backups/'
  }
};

// دالة للحصول على التأخير الذكي
export function getSmartDelay(groupSize, currentHour) {
  let baseDelay = ADVANCED_CONFIG.delays.calculateDelay(groupSize);
  
  // تطبيق مضاعف أوقات الذروة
  if (ADVANCED_CONFIG.delays.peakHours.enabled && 
      ADVANCED_CONFIG.delays.peakHours.hours.includes(currentHour)) {
    baseDelay *= ADVANCED_CONFIG.delays.peakHours.multiplier;
  }
  
  // إضافة تباين عشوائي
  if (ADVANCED_CONFIG.delays.randomization.enabled) {
    const variance = ADVANCED_CONFIG.delays.randomization.variance;
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    baseDelay *= randomFactor;
  }
  
  return Math.floor(baseDelay);
}

// دالة للتحقق من الرسائل المحظورة
export function isMessageBlocked(text) {
  if (!ADVANCED_CONFIG.security.blockedWords.length) return false;
  
  const lowerText = text.toLowerCase();
  return ADVANCED_CONFIG.security.blockedWords.some(word => 
    lowerText.includes(word.toLowerCase())
  );
}

console.log('⚙️ تم تحميل الإعدادات المتقدمة');
