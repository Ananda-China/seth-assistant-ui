// 缓存清理脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function cleanCache() {
  console.log('🧹 开始清理缓存数据...\n');

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📊 检查数据库实际数据...\n');

    // 检查用户表
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');
    
    if (userError) {
      console.log('❌ 获取用户数据失败:', userError.message);
      return;
    }

    console.log(`👥 数据库实际用户数: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.phone} (${user.nickname || '未设置昵称'}) - ${user.created_at}`);
    });

    // 检查对话表
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*');
    
    if (convError) {
      console.log('❌ 获取对话数据失败:', convError.message);
    } else {
      console.log(`\n💬 数据库实际对话数: ${conversations.length}`);
    }

    // 检查消息表
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*');
    
    if (msgError) {
      console.log('❌ 获取消息数据失败:', msgError.message);
    } else {
      console.log(`📝 数据库实际消息数: ${messages.length}`);
    }

    // 检查订单表
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*');
    
    if (orderError) {
      console.log('❌ 获取订单数据失败:', orderError.message);
    } else {
      console.log(`💰 数据库实际订单数: ${orders.length}`);
    }

    // 检查订阅表
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (subError) {
      console.log('❌ 获取订阅数据失败:', subError.message);
    } else {
      console.log(`📅 数据库实际订阅数: ${subscriptions.length}`);
    }

    console.log('\n🔍 分析数据不一致原因...');
    
    // 检查是否有重复数据
    const phoneCounts = {};
    users.forEach(user => {
      phoneCounts[user.phone] = (phoneCounts[user.phone] || 0) + 1;
    });

    const duplicates = Object.entries(phoneCounts).filter(([phone, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('⚠️ 发现重复手机号:');
      duplicates.forEach(([phone, count]) => {
        console.log(`  ${phone}: ${count} 次`);
      });
    } else {
      console.log('✅ 没有发现重复数据');
    }

    // 检查无效数据
    const invalidUsers = users.filter(user => !user.phone || user.phone.trim() === '');
    if (invalidUsers.length > 0) {
      console.log('⚠️ 发现无效用户数据:');
      invalidUsers.forEach(user => {
        console.log(`  ID: ${user.id}, 手机号: ${user.phone}`);
      });
    }

    console.log('\n🧹 清理建议:');
    console.log('1. 如果发现重复数据，可以删除重复记录');
    console.log('2. 如果发现无效数据，可以清理这些记录');
    console.log('3. 管理后台可能需要刷新或重启');
    console.log('4. 检查是否有本地缓存文件需要清理');

    // 提供清理选项
    console.log('\n📋 清理选项:');
    console.log('1. 删除重复用户数据');
    console.log('2. 删除无效用户数据');
    console.log('3. 清理本地缓存文件');
    console.log('4. 重启管理后台服务');

  } catch (error) {
    console.log('❌ 清理过程中发生错误:', error.message);
  }
}

// 运行清理
cleanCache();
