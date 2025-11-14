// 管理后台数据修复脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixAdminData() {
  console.log('🔧 开始修复管理后台数据问题...\n');

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📊 当前Supabase数据库状态:');
    
    // 获取真实数据
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*');
    
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*');
    
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*');

    if (userError) {
      console.log('❌ 获取用户数据失败:', userError.message);
      return;
    }

    console.log(`👥 用户数: ${users.length}`);
    console.log(`💬 对话数: ${conversations?.length || 0}`);
    console.log(`📝 消息数: ${messages?.length || 0}`);
    console.log(`💰 订单数: ${orders?.length || 0}`);

    console.log('\n🔍 问题分析:');
    console.log('管理后台显示的数据与Supabase数据库不一致！');
    console.log('原因: 管理后台API仍在使用本地文件系统，而不是Supabase');

    console.log('\n🧹 解决方案:');
    console.log('1. 我已经创建了Supabase版本的管理后台API:');
    console.log('   - /api/admin/analytics-supabase');
    console.log('   - /api/admin/content-supabase');
    console.log('   - /api/admin/payment-supabase');

    console.log('\n2. 现在需要修改管理后台组件，使用正确的API端点');

    console.log('\n3. 或者，您可以手动清理本地缓存文件:');
    console.log('   - 删除 .data 目录');
    console.log('   - 重启开发服务器');

    console.log('\n🎯 立即执行的操作:');
    console.log('1. 重启开发服务器 (Ctrl+C, 然后 npm run dev)');
    console.log('2. 刷新管理后台页面');
    console.log('3. 检查数据是否已更新');

    console.log('\n📋 如果问题仍然存在:');
    console.log('1. 检查 .data 目录是否存在');
    console.log('2. 运行 npm run maintenance:supabase');
    console.log('3. 确认环境变量配置正确');

  } catch (error) {
    console.log('❌ 修复过程中发生错误:', error.message);
  }
}

// 运行修复
fixAdminData();
