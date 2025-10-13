// 详细检查用户13472881751的数据
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUserDetail() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const phone = '13472881751';
  console.log('\n📊 检查用户', phone, '的完整数据\n');
  console.log('='.repeat(80));

  // 1. 用户基本信息
  console.log('\n1️⃣ 用户基本信息（users表）：');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (userError) {
    console.error('❌ 查询用户失败:', userError);
    return;
  }

  console.log('用户ID:', user.id);
  console.log('手机号:', user.phone);
  console.log('订阅开始:', user.subscription_start);
  console.log('订阅结束:', user.subscription_end);
  console.log('订阅类型:', user.subscription_type);
  console.log('订阅状态:', user.subscription_status);

  // 转换为中国时间显示
  if (user.subscription_start) {
    const startDate = new Date(user.subscription_start);
    console.log('  → 中国时间:', startDate.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  }
  if (user.subscription_end) {
    const endDate = new Date(user.subscription_end);
    console.log('  → 中国时间:', endDate.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    
    // 计算天数
    const startDate = new Date(user.subscription_start);
    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
    console.log('  → 订阅天数:', days.toFixed(2), '天');
  }

  // 2. 订单记录
  console.log('\n2️⃣ 订单记录（orders表）：');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_phone', phone)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('❌ 查询订单失败:', ordersError);
  } else {
    orders.forEach((order, index) => {
      console.log(`\n订单 ${index + 1}:`);
      console.log('  订单ID:', order.id);
      console.log('  套餐:', order.plan);
      console.log('  金额:', order.amount, '元');
      console.log('  状态:', order.status);
      console.log('  创建时间:', order.created_at);
      console.log('    → 中国时间:', new Date(order.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      if (order.paid_at) {
        console.log('  支付时间:', order.paid_at);
        console.log('    → 中国时间:', new Date(order.paid_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      }
    });
  }

  // 3. 激活码记录
  console.log('\n3️⃣ 激活码记录（activation_codes表）：');
  const { data: codes, error: codesError } = await supabase
    .from('activation_codes')
    .select('*, activation_plans(*)')
    .eq('user_phone', phone)
    .order('created_at', { ascending: false });

  if (codesError) {
    console.error('❌ 查询激活码失败:', codesError);
  } else {
    codes.forEach((code, index) => {
      console.log(`\n激活码 ${index + 1}:`);
      console.log('  激活码:', code.code);
      console.log('  套餐:', code.activation_plans?.name || '未知');
      console.log('  天数:', code.activation_plans?.duration_days || '未知');
      console.log('  状态:', code.status);
      console.log('  创建时间:', code.created_at);
      console.log('    → 中国时间:', new Date(code.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      if (code.activated_at) {
        console.log('  激活时间:', code.activated_at);
        console.log('    → 中国时间:', new Date(code.activated_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      }
      if (code.activated_by) {
        console.log('  激活用户:', code.activated_by);
      }
    });
  }

  // 4. 订阅记录
  console.log('\n4️⃣ 订阅记录（subscriptions表）：');
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_phone', phone)
    .order('created_at', { ascending: false });

  if (subsError) {
    console.error('❌ 查询订阅失败:', subsError);
  } else {
    subs.forEach((sub, index) => {
      console.log(`\n订阅 ${index + 1}:`);
      console.log('  订阅ID:', sub.id);
      console.log('  套餐:', sub.plan);
      console.log('  状态:', sub.status);
      console.log('  订阅类型:', sub.subscription_type);
      console.log('  开始时间:', sub.period_start);
      console.log('    → 中国时间:', new Date(sub.period_start).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      console.log('  结束时间:', sub.current_period_end);
      console.log('    → 中国时间:', new Date(sub.current_period_end).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      
      // 计算天数
      const startDate = new Date(sub.period_start);
      const endDate = new Date(sub.current_period_end);
      const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
      console.log('    → 订阅天数:', days.toFixed(2), '天');
      
      if (sub.activation_code_id) {
        console.log('  激活码ID:', sub.activation_code_id);
      }
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 数据检查完成\n');
}

checkUserDetail().catch(console.error);

