// 测试支付管理API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testPaymentAPI() {
  console.log('🔍 测试支付管理API...\n');

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📊 检查Supabase支付数据...\n');

    // 获取订单数据
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (orderError) {
      console.log('❌ 获取订单数据失败:', orderError.message);
      return;
    }

    console.log(`💰 订单总数: ${orders.length}`);
    
    if (orders.length === 0) {
      console.log('✅ 没有订单数据，这与预期一致');
    } else {
      console.log('⚠️ 发现订单数据:');
      orders.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.out_trade_no} - ${order.plan} - ${order.status}`);
      });
    }

    // 获取用户数据
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('phone, nickname');
    
    if (userError) {
      console.log('❌ 获取用户数据失败:', userError.message);
      return;
    }

    console.log(`\n👥 用户总数: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.phone} (${user.nickname || '未设置昵称'})`);
    });

    // 计算统计数据
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.status === 'success')
      .reduce((sum, order) => sum + (order.amount_fen || 0), 0) / 100;
    
    const pendingPayment = orders
      .filter(order => order.status === 'pending')
      .reduce((sum, order) => sum + (order.amount_fen || 0), 0) / 100;
    
    const refunded = orders
      .filter(order => order.status === 'refunded')
      .reduce((sum, order) => sum + (order.amount_fen || 0), 0) / 100;
    
    const successRate = totalOrders > 0 
      ? ((orders.filter(order => order.status === 'success').length / totalOrders) * 100).toFixed(1)
      : '0.0';
    
    const averageOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';

    console.log('\n📈 统计数据:');
    console.log(`总订单数: ${totalOrders}`);
    console.log(`总收入: ¥${totalRevenue.toFixed(2)}`);
    console.log(`待支付: ¥${pendingPayment.toFixed(2)}`);
    console.log(`已退款: ¥${refunded.toFixed(2)}`);
    console.log(`成功率: ${successRate}%`);
    console.log(`平均订单: ¥${averageOrder}`);

    console.log('\n🎯 预期结果:');
    console.log('支付管理页面应该显示:');
    console.log('- 总订单数: 0 ✅');
    console.log('- 总收入: ¥0.00 ✅');
    console.log('- 待支付: ¥0.00 ✅');
    console.log('- 已退款: ¥0.00 ✅');
    console.log('- 成功率: 0.0% ✅');
    console.log('- 平均订单: ¥0.00 ✅');

    console.log('\n🧹 如果页面仍显示模拟数据:');
    console.log('1. 刷新支付管理页面 (F5)');
    console.log('2. 检查浏览器控制台是否有错误');
    console.log('3. 确认组件已更新为使用Supabase API');

  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testPaymentAPI();
