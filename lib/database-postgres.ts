import { Pool } from 'pg';

// إنشاء اتصال بقاعدة البيانات
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// التحقق من الاتصال
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
  } else {
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح:', res.rows[0].now);
  }
});

// دالة لتنفيذ استعلام SQL
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

// إنشاء جداول قاعدة البيانات
export async function initializeDatabase(): Promise<boolean> {
  try {
    // جدول المجموعات
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS whatsapp_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        participants INTEGER DEFAULT 0,
        enabled BOOLEAN DEFAULT true,
        is_admin BOOLEAN DEFAULT false,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // جدول الرسائل
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS forwarded_messages (
        id SERIAL PRIMARY KEY,
        telegram_message_id INTEGER NOT NULL,
        content TEXT,
        media_type TEXT,
        forwarded_to_groups TEXT[],
        success_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'pending'
      )
    `);

    // جدول الإحصائيات
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS bot_stats (
        id SERIAL PRIMARY KEY,
        total_forwarded INTEGER DEFAULT 0,
        total_errors INTEGER DEFAULT 0,
        uptime_seconds INTEGER DEFAULT 0,
        last_activity TIMESTAMP WITH TIME ZONE,
        daily_messages INTEGER DEFAULT 0,
        weekly_messages INTEGER DEFAULT 0,
        monthly_messages INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // جدول السجلات
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS bot_logs (
        id SERIAL PRIMARY KEY,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // جدول الرسائل التجريبية
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS test_messages (
        id SERIAL PRIMARY KEY,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        target_groups TEXT[],
        results JSONB,
        total_sent INTEGER DEFAULT 0,
        total_failed INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // جدول الإعدادات
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS bot_settings (
        id SERIAL PRIMARY KEY,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type TEXT DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // جدول جلسات واتساب
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id SERIAL PRIMARY KEY,
        session_name TEXT UNIQUE NOT NULL,
        session_data TEXT,
        is_active BOOLEAN DEFAULT false,
        last_used TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
    return false;
  }
}

// دوال إدارة المجموعات
export async function saveGroups(groups: any[]): Promise<boolean> {
  try {
    for (const group of groups) {
      await executeQuery(
        `INSERT INTO whatsapp_groups (id, name, participants, enabled, is_admin, description, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = $2,
           participants = $3,
           enabled = $4,
           is_admin = $5,
           description = $6,
           updated_at = NOW()`,
        [group.id, group.name, group.participants, group.enabled, group.isAdmin, group.description]
      );
    }
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ المجموعات:', error);
    return false;
  }
}

export async function getGroups(): Promise<any[]> {
  try {
    const result = await executeQuery('SELECT * FROM whatsapp_groups ORDER BY name');
    return result.rows;
  } catch (error) {
    console.error('❌ خطأ في جلب المجموعات:', error);
    return [];
  }
}

// دوال إدارة الرسائل
export async function saveMessage(messageData: any): Promise<boolean> {
  try {
    await executeQuery(
      `INSERT INTO forwarded_messages
       (telegram_message_id, content, media_type, forwarded_to_groups, success_count, failed_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        messageData.telegram_message_id,
        messageData.content,
        messageData.media_type,
        messageData.forwarded_to_groups,
        messageData.success_count || 0,
        messageData.failed_count || 0,
        messageData.status || 'pending'
      ]
    );
    return true;
  } catch (error) {
    console.error('❌ خطأ في حفظ الرسالة:', error);
    return false;
  }
}

// دوال إدارة الإحصائيات
export async function updateStats(stats: any): Promise<boolean> {
  try {
    await executeQuery(
      `INSERT INTO bot_stats
       (id, total_forwarded, total_errors, uptime_seconds, last_activity)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         total_forwarded = $2,
         total_errors = $3,
         uptime_seconds = $4,
         last_activity = $5`,
      [
        stats.id || 1,
        stats.total_forwarded,
        stats.total_errors,
        stats.uptime_seconds,
        stats.last_activity
      ]
    );
    return true;
  } catch (error) {
    console.error('❌ خطأ في تحديث الإحصائيات:', error);
    return false;
  }
}

// دوال إدارة السجلات
export async function addLog(level: string, message: string, metadata?: any): Promise<boolean> {
  try {
    await executeQuery(
      `INSERT INTO bot_logs (level, message, metadata) VALUES ($1, $2, $3)`,
      [level, message, metadata ? JSON.stringify(metadata) : null]
    );
    return true;
  } catch (error) {
    console.error('❌ خطأ في إضافة السجل:', error);
    return false;
  }
}

export async function getLogs(limit = 100): Promise<any[]> {
  try {
    const result = await executeQuery(
      'SELECT * FROM bot_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('❌ خطأ في جلب السجلات:', error);
    return [];
  }
}

// دوال إدارة الإعدادات
export async function getSetting(key: string): Promise<string | null> {
  try {
    const result = await executeQuery(
      'SELECT setting_value FROM bot_settings WHERE setting_key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].setting_value;
  } catch (error) {
    console.error(`❌ خطأ في جلب الإعداد ${key}:`, error);
    return null;
  }
}

export async function updateSetting(key: string, value: string): Promise<boolean> {
  try {
    await executeQuery(
      `INSERT INTO bot_settings (setting_key, setting_value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (setting_key) DO UPDATE SET
         setting_value = $2,
         updated_at = NOW()`,
      [key, value]
    );
    return true;
  } catch (error) {
    console.error(`❌ خطأ في تحديث الإعداد ${key}:`, error);
    return false;
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const result = await executeQuery('SELECT setting_key, setting_value FROM bot_settings');
    
    const settings: Record<string, string> = {};
    result.rows.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return settings;
  } catch (error) {
    console.error('❌ خطأ في جلب الإعدادات:', error);
    return {};
  }
}

// دوال إدارة جلسات واتساب
export async function saveWhatsAppSession(sessionName: string, sessionData: string): Promise<boolean> {
  try {
    await executeQuery(
      `INSERT INTO whatsapp_sessions (session_name, session_data, is_active, last_used, updated_at)
       VALUES ($1, $2, true, NOW(), NOW())
       ON CONFLICT (session_name) DO UPDATE SET
         session_data = $2,
         is_active = true,
         last_used = NOW(),
         updated_at = NOW()`,
      [sessionName, sessionData]
    );
    return true;
  } catch (error) {
    console.error(`❌ خطأ في حفظ جلسة واتساب ${sessionName}:`, error);
    return false;
  }
}

export async function getWhatsAppSession(sessionName: string): Promise<string | null> {
  try {
    const result = await executeQuery(
      'SELECT session_data FROM whatsapp_sessions WHERE session_name = $1 AND is_active = true',
      [sessionName]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].session_data;
  } catch (error) {
    console.error(`❌ خطأ في جلب جلسة واتساب ${sessionName}:`, error);
    return null;
  }
}

// تصدير الاتصال بقاعدة البيانات
export default pool;