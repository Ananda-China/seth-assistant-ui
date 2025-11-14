import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTimesCardUser() {
  const phone = '17301807380';
  
  console.log(`\n🔍 检查用户 ${phone} 的次卡订阅状态...\n`);

  // 1. 查询用户信息
  console.log('1️⃣ 用户信息:');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (userError) {
    console.error('❌ 查询用户失败:', userError.message);
    return;
  }

  console.log('   手机号:', user.phone);
  console.log('   昵称:', user.nickname || '未设置');
  console.log('   订阅类型:', user.subscription_type);
  console.log('   聊天次数:', user.chat_count);
  console.log('   订阅开始:', user.subscription_start);
  console.log('   订阅结束:', user.subscription_end);

  // 2. 查询订阅记录
  console.log('\n2️⃣ 订阅记录:');
  const { data: subscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_phone', phone)
    .order('created_at', { ascending: false });

  if (subsError) {
    console.error('❌ 查询订阅失败:', subsError.message);
  } else if (subscriptions && subscriptions.length > 0) {
    subscriptions.forEach((sub, index) => {
      console.log(`\n   订阅 ${index + 1}:`);
      console.log('   - ID:', sub.id);
      console.log('   - 套餐:', sub.plan);
      console.log('   - 状态:', sub.status);
      console.log('   - 开始时间:', sub.period_start);
      console.log('   - 结束时间:', sub.current_period_end);
      console.log('   - 是否次卡:', sub.plan === '次卡' ? '是' : '否');
      
      if (sub.plan === '次卡') {
        console.log('   - 次卡说明: 不限制时间，限制50次聊天');
        console.log('   - 当前已用:', user.chat_count, '次');
        console.log('   - 剩余次数:', Math.max(0, 50 - user.chat_count), '次');
      } else {
        const now = new Date();
        const endDate = new Date(sub.current_period_end);
        const isExpired = endDate <= now;
        console.log('   - 是否过期:', isExpired ? '是' : '否');
        if (!isExpired) {
          const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          console.log('   - 剩余天数:', remainingDays, '天');
        }
      }
    });
  } else {
    console.log('   没有订阅记录');
  }

  // 3. 查询激活码记录
  console.log('\n3️⃣ 激活码记录:');
  const { data: activationCodes, error: codesError } = await supabase
    .from('activation_codes')
    .select('*, plan:plans(*)')
    .eq('used_by_user_id', user.id)
    .order('activated_at', { ascending: false });

  if (codesError) {
    console.error('❌ 查询激活码失败:', codesError.message);
  } else if (activationCodes && activationCodes.length > 0) {
    activationCodes.forEach((code, index) => {
      console.log(`\n   激活码 ${index + 1}:`);
      console.log('   - 激活码:', code.code);
      console.log('   - 套餐:', code.plan?.name);
      console.log('   - 价格:', code.plan?.price / 100, '元');
      console.log('   - 时长:', code.plan?.duration_days || '不限制时间');
      console.log('   - 次数限制:', code.plan?.chat_limit || '不限制次数');
      console.log('   - 激活时间:', code.activated_at);
    });
  } else {
    console.log('   没有激活码记录');
  }

  // 4. 查询订单记录
  console.log('\n4️⃣ 订单记录:');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_phone', phone)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('❌ 查询订单失败:', ordersError.message);
  } else if (orders && orders.length > 0) {
    orders.forEach((order, index) => {
      console.log(`\n   订单 ${index + 1}:`);
      console.log('   - 订单号:', order.out_trade_no);
      console.log('   - 套餐:', order.plan);
      console.log('   - 金额:', order.amount_fen / 100, '元');
      console.log('   - 状态:', order.status);
      console.log('   - 订单类型:', order.order_type);
      console.log('   - 创建时间:', order.created_at);
      console.log('   - 支付时间:', order.paid_at || '未支付');
    });
  } else {
    console.log('   没有订单记录');
  }

  // 5. 诊断问题
  console.log('\n5️⃣ 诊断结果:');
  const activeSubscription = subscriptions?.find(s => s.status === 'active');
  
  if (!activeSubscription) {
    console.log('❌ 问题: 没有活跃的订阅记录');
    console.log('💡 建议: 需要创建订阅记录');
  } else if (activeSubscription.plan === '次卡') {
    if (user.chat_count >= 50) {
      console.log('⚠️ 次卡次数已用完 (', user.chat_count, '/50)');
    } else {
      console.log('✅ 次卡状态正常');
      console.log('   - 剩余次数:', 50 - user.chat_count);
      console.log('   - 不限制时间');
    }
  } else {
    const now = new Date();
    const endDate = new Date(activeSubscription.current_period_end);
    if (endDate <= now) {
      console.log('❌ 问题: 订阅已过期');
      console.log('   - 结束时间:', activeSubscription.current_period_end);
      console.log('   - 当前时间:', now.toISOString());
    } else {
      console.log('✅ 订阅状态正常');
      const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      console.log('   - 剩余天数:', remainingDays);
    }
  }

  console.log('\n✅ 检查完成\n');
}

checkTimesCardUser().catch(console.error);

