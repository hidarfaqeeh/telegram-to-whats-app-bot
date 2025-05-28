#!/usr/bin/env node

/**
 * سكريبت إعداد قاعدة البيانات تلقائياً
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// تكوين الاتصال بقاعدة البيانات
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// الجداول المطلوبة
const tables = [
  {
    name: "whatsapp_groups",
    sql: `
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
    `
  },
  {
    name: "forwarded_messages",
    sql: `
      CREATE TABLE IF NOT EXISTS forwarded_messages (
        id SERIAL PRIMARY KEY,
        telegram_message_id INTEGER NOT NULL,
        content TEXT,
        media_type TEXT,
        media_url TEXT,
        forwarded_to_groups TEXT[],
        success_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'pending'
      )
    `
  },
  {
    name: "bot_stats",
    sql: `
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
    `
  },
  {
    name: "bot_logs",
    sql: `
      CREATE TABLE IF NOT EXISTS bot_logs (
        id SERIAL PRIMARY KEY,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: "test_messages",
    sql: `
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
    `
  },
  {
    name: "bot_settings",
    sql: `
      CREATE TABLE IF NOT EXISTS bot_settings (
        id SERIAL PRIMARY KEY,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type TEXT DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  },
  {
    name: "whatsapp_sessions",
    sql: `
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id SERIAL PRIMARY KEY,
        session_name TEXT UNIQUE NOT NULL,
        session_data TEXT,
        is_active BOOLEAN DEFAULT false,
        last_used TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  }
];

// الإعدادات الافتراضية
const defaultSettings = [
  {
    setting_key: "bot_min_delay",
    setting_value: "30",
    setting_type: "number",
    description: "الحد الأدنى للتأخير بين الرسائل (ثانية)"
  },
  {
    setting_key: "bot_max_delay",
    setting_value: "120",
    setting_type: "number",
    description: "الحد الأقصى للتأخير بين الرسائل (ثانية)"
  },
  {
    setting_key: "bot_between_groups_delay",
    setting_value: "15",
    setting_type: "number",
    description: "التأخير بين المجموعات (ثانية)"
  },
  {
    setting_key: "bot_max_messages_per_hour",
    setting_value: "50",
    setting_type: "number",
    description: "الحد الأقصى للرسائل في الساعة"
  },
  {
    setting_key: "bot_enabled",
    setting_value: "false",
    setting_type: "boolean",
    description: "تفعيل البوت"
  }
];

// دالة لتنفيذ استعلام SQL
async function executeQuery(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// دالة لإنشاء الجداول
async function createTables() {
  console.log('🔄 إنشاء الجداول...');
  
  for (const table of tables) {
    try {
      await executeQuery(table.sql);
      console.log(`✅ تم إنشاء جدول ${table.name}`);
    } catch (error) {
      console.error(`❌ خطأ في إنشاء جدول ${table.name}:`, error.message);
    }
  }
}

// دالة لإدراج الإعدادات الافتراضية
async function insertDefaultSettings() {
  console.log('🔄 إدراج الإعدادات الافتراضية...');
  
  for (const setting of defaultSettings) {
    try {
      await executeQuery(
        `INSERT INTO bot_settings (setting_key, setting_value, setting_type, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (setting_key) DO NOTHING`,
        [setting.setting_key, setting.setting_value, setting.setting_type, setting.description]
      );
      console.log(`✅ تم إدراج إعداد ${setting.setting_key}`);
    } catch (error) {
      console.error(`❌ خطأ في إدراج إعداد ${setting.setting_key}:`, error.message);
    }
  }
}

// دالة رئيسية
async function main() {
  console.log('🚀 بدء إعداد قاعدة البيانات...');
  
  try {
    // التحقق من الاتصال
    await executeQuery('SELECT NOW()');
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // إنشاء الجداول
    await createTables();
    
    // إدراج الإعدادات الافتراضية
    await insertDefaultSettings();
    
    console.log('✅ تم إعداد قاعدة البيانات بنجاح');
  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// تنفيذ الدالة الرئيسية
main().catch(console.error);
