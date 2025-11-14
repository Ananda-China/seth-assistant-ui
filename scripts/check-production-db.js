#!/usr/bin/env node

/**
 * 检查生产环境数据库状态
 * 验证表结构和必要的列是否存在
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 配置环境变量');
  console.error('需要设置: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 检查生产环境数据库状态...\n');

  try {
    // 检查 users 表结构
    console.log('📋 检查 users 表结构...');
    const { data: usersColumns, error: usersError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' });

    if (usersError) {
      console.log('⚠️  无法获取 users 表结构，尝试直接查询...');
      
      // 尝试直接查询表
      const { data: testUser, error: testError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('❌ users 表不存在或无法访问:', testError.message);
        return false;
      } else {
        console.log('✅ users 表存在且可访问');
      }
    } else {
      console.log('✅ users 表结构获取成功');
      console.log('列信息:', usersColumns);
    }

    // 检查 password_hash 列是否存在
    console.log('\n🔐 检查 password_hash 列...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('password_hash')
      .limit(1);

    if (testError && testError.message.includes('password_hash')) {
      console.log('⚠️  password_hash 列不存在，需要执行迁移');
      return { needsMigration: true, reason: 'password_hash 列缺失' };
    } else {
      console.log('✅ password_hash 列存在');
    }

    // 检查其他必要的表
    const tables = ['chat_sessions', 'chat_messages', 'user_subscriptions', 'payment_orders'];
    
    for (const table of tables) {
      console.log(`\n📋 检查 ${table} 表...`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`⚠️  ${table} 表可能不存在:`, error.message);
      } else {
        console.log(`✅ ${table} 表存在且可访问`);
      }
    }

    console.log('\n🎉 数据库检查完成！');
    return { needsMigration: false };

  } catch (error) {
    console.error('❌ 数据库检查失败:', error);
    return false;
  }
}

async function main() {
  const result = await checkDatabase();
  
  if (result === false) {
    console.log('\n❌ 数据库检查失败，请检查配置');
    process.exit(1);
  }
  
  if (result.needsMigration) {
    console.log(`\n⚠️  需要执行数据库迁移: ${result.reason}`);
    console.log('请在 Supabase Dashboard 的 SQL Editor 中执行以下迁移:');
    console.log('supabase/migrations/008_add_password_hash.sql');
    process.exit(1);
  }
  
  console.log('\n✅ 数据库状态正常，无需迁移');
}

main().catch(console.error);
