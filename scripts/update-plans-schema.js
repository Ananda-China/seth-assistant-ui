/**
 * 更新plans表schema，允许duration_days为NULL
 * 运行方式: node scripts/update-plans-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
});

async function updatePlansSchema() {
  console.log('🚀 开始更新plans表schema...\n');

  try {
    // 1. 修改duration_days字段，允许NULL
    console.log('1️⃣ 修改duration_days字段，允许NULL...');
    
    // 使用RPC调用执行SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE plans ALTER COLUMN duration_days DROP NOT NULL;'
    });

    if (error) {
      // 如果RPC不存在，尝试直接使用SQL
      console.log('⚠️  RPC方法不可用，尝试使用Supabase Dashboard手动执行SQL');
      console.log('\n请在Supabase Dashboard的SQL Editor中执行以下SQL:');
      console.log('─'.repeat(80));
      console.log('-- 允许duration_days为NULL');
      console.log('ALTER TABLE plans ALTER COLUMN duration_days DROP NOT NULL;');
      console.log('');
      console.log('-- 添加chat_limit字段');
      console.log('ALTER TABLE plans ADD COLUMN IF NOT EXISTS chat_limit INTEGER;');
      console.log('');
      console.log('-- 更新users表的CHECK约束');
      console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_type_check;');
      console.log('ALTER TABLE users ADD CONSTRAINT users_subscription_type_check');
      console.log("  CHECK (subscription_type IN ('free', 'monthly', 'quarterly', 'yearly', 'times'));");
      console.log('─'.repeat(80));
      console.log('\n执行完成后，再运行: node scripts/add-times-plan.js');
      return;
    }

    console.log('✅ duration_days字段已允许NULL');

    // 2. 添加chat_limit字段
    console.log('\n2️⃣ 添加chat_limit字段...');
    const { error: chatLimitError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE plans ADD COLUMN IF NOT EXISTS chat_limit INTEGER;'
    });

    if (chatLimitError) {
      console.log('⚠️  无法添加chat_limit字段，请手动执行');
    } else {
      console.log('✅ chat_limit字段已添加');
    }

    // 3. 更新users表的CHECK约束
    console.log('\n3️⃣ 更新users表的CHECK约束...');
    const { error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_type_check;
        ALTER TABLE users ADD CONSTRAINT users_subscription_type_check
          CHECK (subscription_type IN ('free', 'monthly', 'quarterly', 'yearly', 'times'));
      `
    });

    if (checkError) {
      console.log('⚠️  无法更新CHECK约束，请手动执行');
    } else {
      console.log('✅ CHECK约束已更新');
    }

    console.log('\n✅ Schema更新完成！');
    console.log('\n📝 下一步: 运行 node scripts/add-times-plan.js 添加次卡套餐');

  } catch (error) {
    console.error('❌ 发生错误:', error);
    console.log('\n请在Supabase Dashboard的SQL Editor中手动执行以下SQL:');
    console.log('─'.repeat(80));
    console.log('-- 允许duration_days为NULL');
    console.log('ALTER TABLE plans ALTER COLUMN duration_days DROP NOT NULL;');
    console.log('');
    console.log('-- 添加chat_limit字段');
    console.log('ALTER TABLE plans ADD COLUMN IF NOT EXISTS chat_limit INTEGER;');
    console.log('');
    console.log('-- 更新users表的CHECK约束');
    console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_type_check;');
    console.log('ALTER TABLE users ADD CONSTRAINT users_subscription_type_check');
    console.log("  CHECK (subscription_type IN ('free', 'monthly', 'quarterly', 'yearly', 'times'));");
    console.log('─'.repeat(80));
  }
}

// 运行脚本
updatePlansSchema();

