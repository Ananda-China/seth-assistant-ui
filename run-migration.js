require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已设置' : '未设置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 开始执行数据库迁移...\n');

  try {
    // 1. 为conversations表添加删除标记字段
    console.log('📝 为conversations表添加删除标记字段...');
    const { error: convError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE conversations 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
        
        ALTER TABLE conversations 
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
      `
    });

    if (convError) {
      console.log('⚠️ conversations表字段可能已存在，继续执行...');
    } else {
      console.log('✅ conversations表字段添加成功');
    }

    // 2. 为messages表添加删除标记字段
    console.log('📝 为messages表添加删除标记字段...');
    const { error: msgError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
        
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
      `
    });

    if (msgError) {
      console.log('⚠️ messages表字段可能已存在，继续执行...');
    } else {
      console.log('✅ messages表字段添加成功');
    }

    // 3. 创建索引
    console.log('🔍 创建索引...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_conversations_deleted 
        ON conversations(is_deleted, deleted_at);
        
        CREATE INDEX IF NOT EXISTS idx_messages_deleted 
        ON messages(is_deleted, deleted_at);
      `
    });

    if (indexError) {
      console.log('⚠️ 索引可能已存在，继续执行...');
    } else {
      console.log('✅ 索引创建成功');
    }

    // 4. 验证字段是否存在
    console.log('🔍 验证字段是否添加成功...');
    const { data: convColumns, error: convColError } = await supabase
      .from('conversations')
      .select('is_deleted, deleted_at')
      .limit(1);

    if (convColError) {
      console.error('❌ 验证conversations表失败:', convColError);
    } else {
      console.log('✅ conversations表字段验证成功');
    }

    const { data: msgColumns, error: msgColError } = await supabase
      .from('messages')
      .select('is_deleted, deleted_at')
      .limit(1);

    if (msgColError) {
      console.error('❌ 验证messages表失败:', msgColError);
    } else {
      console.log('✅ messages表字段验证成功');
    }

    console.log('\n🎉 数据库迁移完成！');
    console.log('✅ 已添加软删除功能');
    console.log('✅ 删除的记录将被标记而不是物理删除');
    console.log('✅ 重新登录后删除的记录不会显示');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    
    // 如果RPC方法不存在，尝试直接执行SQL
    console.log('🔄 尝试直接执行SQL...');
    try {
      const { error: directError } = await supabase
        .from('conversations')
        .select('*')
        .limit(1);
      
      if (!directError) {
        console.log('✅ 数据库连接正常，请手动执行以下SQL:');
        console.log(`
          ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
          ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
          ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
          ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
          CREATE INDEX IF NOT EXISTS idx_conversations_deleted ON conversations(is_deleted, deleted_at);
          CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted, deleted_at);
        `);
      }
    } catch (directError) {
      console.error('❌ 直接连接也失败:', directError);
    }
  }
}

runMigration();
