require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🚀 开始数据库迁移...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('环境变量检查:');
console.log('URL:', supabaseUrl ? '已设置' : '未设置');
console.log('KEY:', supabaseServiceKey ? '已设置' : '未设置');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('\n📝 测试数据库连接...');
    
    // 测试连接
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ 数据库连接失败:', error);
      return;
    }
    
    console.log('✅ 数据库连接成功');
    
    // 检查字段是否存在
    console.log('\n🔍 检查现有字段...');
    const { data: columns, error: colError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.error('❌ 查询失败:', colError);
      return;
    }
    
    if (columns && columns.length > 0) {
      const sampleRecord = columns[0];
      console.log('✅ 现有字段:', Object.keys(sampleRecord));
      
      // 检查是否已有删除标记字段
      if ('is_deleted' in sampleRecord) {
        console.log('✅ is_deleted 字段已存在');
      } else {
        console.log('❌ is_deleted 字段不存在，需要添加');
      }
      
      if ('deleted_at' in sampleRecord) {
        console.log('✅ deleted_at 字段已存在');
      } else {
        console.log('❌ deleted_at 字段不存在，需要添加');
      }
    }
    
    console.log('\n📋 请手动执行以下SQL语句:');
    console.log(`
-- 为conversations表添加删除标记字段
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 为messages表添加删除标记字段  
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversations_deleted ON conversations(is_deleted, deleted_at);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted, deleted_at);
    `);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  }
}

runMigration();
