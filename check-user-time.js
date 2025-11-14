// 检查用户13472881751的支付时间和到期时间
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUserTime() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const userPhone = '13472881751';

  console.log(`\n🔍 检查用户 ${userPhone} 的时间数据...\n`);

  // 1. 检查users表
  console.log('1. users表数据:');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', userPhone)
    .single();

  if (userError) {
    console.error('❌ 查询用户失败:', userError.message);
  } else if (user) {
    console.log('   subscription_type:', user.subscription_type);
    console.log('   subscription_start:', user.subscription_start);
    console.log('   subscription_end:', user.subscription_end);
    if (user.subscription_start && user.subscription_end) {
      const start = new Date(user.subscription_start);
      const end = new Date(user.subscription_end);
      const durationDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
      console.log('   计算天数:', durationDays.toFixed(2), '天');
      console.log('   开始时间(本地):', start.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      console.log('   结束时间(本地):', end.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    }
  }

  // 2. 检查orders表
  console.log('\n2. orders表数据:');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_phone', userPhone)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('❌ 查询订单失败:', ordersError.message);
  } else if (orders && orders.length > 0) {
    orders.forEach((order, index) => {
      console.log(`\n   订单 ${index + 1}:`);
      console.log('   - out_trade_no:', order.out_trade_no);
      console.log('   - plan:', order.plan);
      console.log('   - status:', order.status);
      console.log('   - created_at:', order.created_at);
      console.log('   - paid_at:', order.paid_at);
      if (order.created_at) {
        const created = new Date(order.created_at);
        console.log('   - 创建时间(本地):', created.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      }
      if (order.paid_at) {
        const paid = new Date(order.paid_at);
        console.log('   - 支付时间(本地):', paid.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      }
    });
  } else {
    console.log('   没有订单记录');
  }

  // 3. 检查subscriptions表
  console.log('\n3. subscriptions表数据:');
  const { data: subscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_phone', userPhone)
    .order('created_at', { ascending: false });

  if (subsError) {
    console.error('❌ 查询订阅失败:', subsError.message);
  } else if (subscriptions && subscriptions.length > 0) {
    subscriptions.forEach((sub, index) => {
      console.log(`\n   订阅 ${index + 1}:`);
      console.log('   - plan:', sub.plan);
      console.log('   - status:', sub.status);
      console.log('   - period_start:', sub.period_start);
      console.log('   - current_period_end:', sub.current_period_end);
      if (sub.period_start && sub.current_period_end) {
        const start = new Date(sub.period_start);
        const end = new Date(sub.current_period_end);
        const durationDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
        console.log('   - 计算天数:', durationDays.toFixed(2), '天');
        console.log('   - 开始时间(本地):', start.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
        console.log('   - 结束时间(本地):', end.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      }
    });
  } else {
    console.log('   没有订阅记录');
  }

  // 4. 检查activation_codes表
  console.log('\n4. activation_codes表数据:');
  const { data: activationCodes, error: codesError } = await supabase
    .from('activation_codes')
    .select('*, plan:plans(*)')
    .eq('used_by_user_id', user?.id)
    .order('activated_at', { ascending: false });

  if (codesError) {
    console.error('❌ 查询激活码失败:', codesError.message);
  } else if (activationCodes && activationCodes.length > 0) {
    activationCodes.forEach((code, index) => {
      console.log(`\n   激活码 ${index + 1}:`);
      console.log('   - code:', code.code);
      console.log('   - plan:', code.plan?.name);
      console.log('   - duration_days:', code.plan?.duration_days);
      console.log('   - activated_at:', code.activated_at);
      if (code.activated_at) {
        const activated = new Date(code.activated_at);
        console.log('   - 激活时间(本地):', activated.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      }
    });
  } else {
    console.log('   没有激活码记录');
  }

  console.log('\n✅ 检查完成\n');
}

checkUserTime().catch(console.error);

