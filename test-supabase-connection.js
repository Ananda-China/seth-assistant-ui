// Supabase连接测试脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 测试Supabase连接...\n');

  // 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('USE_SUPABASE:', process.env.USE_SUPABASE);
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已设置' : '❌ 未设置');
  console.log('');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ 环境变量配置不完整，请检查 .env.local 文件');
    return;
  }

  try {
    // 创建Supabase客户端
    console.log('🔌 创建Supabase客户端...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 测试基本连接
    console.log('🌐 测试基本连接...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ 连接失败:', error.message);
      return;
    }

    console.log('✅ 基本连接成功!');

    // 测试表结构
    console.log('\n📊 测试表结构...');
    const tables = ['users', 'conversations', 'messages', 'orders', 'subscriptions', 'admins'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table} 表访问失败:`, error.message);
        } else {
          console.log(`✅ ${table} 表正常`);
        }
      } catch (err) {
        console.log(`❌ ${table} 表不存在或无法访问:`, err.message);
      }
    }

    // 测试数据插入（只测试，不实际插入）
    console.log('\n✏️ 测试数据操作权限...');
    try {
      const { error } = await supabase.from('users').select('phone').eq('phone', 'test@example.com');
      if (error) {
        console.log('❌ 查询权限测试失败:', error.message);
      } else {
        console.log('✅ 查询权限正常');
      }
    } catch (err) {
      console.log('❌ 权限测试失败:', err.message);
    }

    console.log('\n🎉 Supabase连接测试完成!');
    console.log('\n📝 下一步操作:');
    console.log('1. 在浏览器中访问您的应用');
    console.log('2. 测试用户注册和登录功能');
    console.log('3. 测试聊天功能');
    console.log('4. 检查管理后台');

  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
    console.log('请检查网络连接和Supabase配置');
  }
}

// 运行测试
testSupabaseConnection();
