const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testPaidUsers() {
  try {
    console.log('🔍 测试付费用户统计...\n');
    
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. 检查users表中的订阅用户
    console.log('1. 检查users表中的订阅用户:');
    const { data: usersWithSub, error: usersError } = await supabase
      .from('users')
      .select('phone, nickname, subscription_type, subscription_end')
      .neq('subscription_type', 'free');
    
    if (usersError) {
      console.error('❌ 查询users表失败:', usersError.message);
    } else {
      console.log(`✅ users表中非免费用户数量: ${usersWithSub?.length || 0}`);
      usersWithSub?.forEach(user => {
        const isValid = user.subscription_end ? new Date(user.subscription_end) > new Date() : false;
        console.log(`   - ${user.phone} (${user.nickname || '未设置'}) - ${user.subscription_type} - ${isValid ? '有效' : '已过期'}`);
      });
    }

    // 2. 检查subscriptions表中的激活码用户
    console.log('\n2. 检查subscriptions表中的激活码用户:');
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_phone, plan, status, current_period_end')
      .eq('status', 'active');
    
    if (subError) {
      console.error('❌ 查询subscriptions表失败:', subError.message);
    } else {
      console.log(`✅ 激活码订阅用户数量: ${subscriptions?.length || 0}`);
      subscriptions?.forEach(sub => {
        const isValid = new Date(sub.current_period_end) > new Date();
        console.log(`   - ${sub.user_phone} - ${sub.plan} - ${isValid ? '有效' : '已过期'}`);
      });
    }

    // 3. 检查orders表中的成功支付
    console.log('\n3. 检查orders表中的成功支付:');
    const { data: successOrders, error: orderError } = await supabase
      .from('orders')
      .select('user_phone, plan, amount_fen, status, created_at')
      .eq('status', 'success');
    
    if (orderError) {
      console.error('❌ 查询orders表失败:', orderError.message);
    } else {
      console.log(`✅ 成功支付订单数量: ${successOrders?.length || 0}`);
      const uniqueUsers = new Set(successOrders?.map(order => order.user_phone));
      console.log(`✅ 有支付记录的用户数量: ${uniqueUsers.size}`);
      
      successOrders?.forEach(order => {
        console.log(`   - ${order.user_phone} - ${order.plan} - ¥${(order.amount_fen / 100).toFixed(2)} - ${new Date(order.created_at).toLocaleDateString()}`);
      });
    }

    // 4. 综合统计付费用户
    console.log('\n4. 综合统计付费用户:');
    const now = new Date();
    const paidUsers = new Set();

    // 从users表添加有效订阅用户
    usersWithSub?.forEach(user => {
      if (user.subscription_end && new Date(user.subscription_end) > now) {
        paidUsers.add(user.phone);
      }
    });

    // 从subscriptions表添加激活码用户
    subscriptions?.forEach(sub => {
      if (new Date(sub.current_period_end) > now) {
        paidUsers.add(sub.user_phone);
      }
    });

    console.log(`🎯 实际付费用户总数: ${paidUsers.size}`);
    console.log('付费用户列表:');
    Array.from(paidUsers).forEach((phone, index) => {
      console.log(`   ${index + 1}. ${phone}`);
    });

    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testPaidUsers();
