// 管理后台缓存修复脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixAdminCache() {
  console.log('🔧 开始修复管理后台缓存问题...\n');

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📊 当前数据库状态:');
    
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

    console.log('\n🔍 检查可能的问题...');

    // 检查是否有隐藏或软删除的数据
    const { data: allUsers, error: allUserError } = await supabase
      .from('users')
      .select('*')
      .or('status.is.null,status.eq.active,status.eq.inactive,status.eq.deleted');

    if (!allUserError && allUsers) {
      console.log(`📋 包括所有状态的用户数: ${allUsers.length}`);
      
      // 按状态分组
      const statusGroups = {};
      allUsers.forEach(user => {
        const status = user.status || 'active';
        statusGroups[status] = (statusGroups[status] || 0) + 1;
      });
      
      console.log('📊 用户状态分布:');
      Object.entries(statusGroups).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} 个`);
      });
    }

    // 检查是否有测试数据
    const testUsers = users.filter(user => 
      user.phone.includes('test') || 
      user.phone.includes('demo') || 
      user.phone.includes('example') ||
      user.nickname?.includes('test') ||
      user.nickname?.includes('demo')
    );

    if (testUsers.length > 0) {
      console.log('\n⚠️ 发现可能的测试用户:');
      testUsers.forEach(user => {
        console.log(`  ${user.phone} (${user.nickname})`);
      });
    }

    console.log('\n🧹 缓存清理建议:');

    // 1. 清理浏览器缓存
    console.log('1. 🌐 清理浏览器缓存:');
    console.log('   - 按 Ctrl+Shift+Delete');
    console.log('   - 选择"缓存数据"和"本地存储"');
    console.log('   - 点击"清除数据"');

    // 2. 重启管理后台
    console.log('\n2. 🔄 重启管理后台:');
    console.log('   - 刷新管理后台页面 (F5)');
    console.log('   - 或者重新登录管理后台');

    // 3. 检查本地存储
    console.log('\n3. 💾 检查本地存储:');
    console.log('   - 按 F12 打开开发者工具');
    console.log('   - 选择 Application/应用程序 标签');
    console.log('   - 在左侧找到 Local Storage');
    console.log('   - 删除相关的缓存数据');

    // 4. 强制刷新
    console.log('\n4. ⚡ 强制刷新:');
    console.log('   - 按 Ctrl+F5 强制刷新');
    console.log('   - 或者按 Ctrl+Shift+R');

    console.log('\n🎯 立即执行的操作:');
    console.log('1. 刷新管理后台页面');
    console.log('2. 如果问题仍然存在，清除浏览器缓存');
    console.log('3. 重新登录管理后台');

    // 提供数据重置选项
    console.log('\n📋 数据重置选项 (谨慎使用):');
    console.log('1. 重置管理后台统计数据');
    console.log('2. 清理过期的会话数据');
    console.log('3. 重新计算用户统计');

  } catch (error) {
    console.log('❌ 修复过程中发生错误:', error.message);
  }
}

// 运行修复
fixAdminCache();
