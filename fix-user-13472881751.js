// 修复用户13472881751的订阅时间问题
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixUserSubscription() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const userPhone = '13472881751';

  console.log(`\n🔧 修复用户 ${userPhone} 的订阅时间...\n`);

  // 1. 获取用户信息
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', userPhone)
    .single();

  if (userError || !user) {
    console.error('❌ 查询用户失败:', userError?.message);
    return;
  }

  // 2. 获取最新的激活码记录
  const { data: activationCode, error: codeError } = await supabase
    .from('activation_codes')
    .select('*, plan:plans(*)')
    .eq('used_by_user_id', user.id)
    .order('activated_at', { ascending: false })
    .limit(1)
    .single();

  if (codeError || !activationCode) {
    console.error('❌ 查询激活码失败:', codeError?.message);
    return;
  }

  console.log('📋 激活码信息:');
  console.log('   - code:', activationCode.code);
  console.log('   - plan:', activationCode.plan.name);
  console.log('   - duration_days:', activationCode.plan.duration_days);
  console.log('   - activated_at:', activationCode.activated_at);

  // 3. 计算正确的订阅时间
  const activatedAt = new Date(activationCode.activated_at);
  const subscriptionEnd = new Date(activatedAt.getTime() + activationCode.plan.duration_days * 24 * 60 * 60 * 1000);

  console.log('\n📅 计算正确的订阅时间:');
  console.log('   - 激活时间(UTC):', activatedAt.toISOString());
  console.log('   - 激活时间(本地):', activatedAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log('   - 到期时间(UTC):', subscriptionEnd.toISOString());
  console.log('   - 到期时间(本地):', subscriptionEnd.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log('   - 天数:', activationCode.plan.duration_days);

  // 4. 更新users表
  console.log('\n🔄 更新users表...');
  const { error: updateUserError } = await supabase
    .from('users')
    .update({
      subscription_start: activatedAt.toISOString(),
      subscription_end: subscriptionEnd.toISOString()
    })
    .eq('phone', userPhone);

  if (updateUserError) {
    console.error('❌ 更新users表失败:', updateUserError.message);
  } else {
    console.log('✅ users表更新成功');
  }

  // 5. 取消所有旧订阅
  console.log('\n🔄 取消所有旧订阅...');
  const { error: cancelError } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_phone', userPhone);

  if (cancelError) {
    console.error('❌ 取消旧订阅失败:', cancelError.message);
  } else {
    console.log('✅ 旧订阅已取消');
  }

  // 6. 创建新的正确订阅
  console.log('\n🔄 创建新的正确订阅...');
  const { error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      user_phone: userPhone,
      plan: activationCode.plan.name,
      status: 'active',
      period_start: activatedAt.toISOString(),
      current_period_end: subscriptionEnd.toISOString(),
      activation_code_id: activationCode.id,
      subscription_type: 'activation'
    });

  if (insertError) {
    console.error('❌ 创建新订阅失败:', insertError.message);
  } else {
    console.log('✅ 新订阅创建成功');
  }

  // 7. 验证修复结果
  console.log('\n✅ 验证修复结果:');
  const { data: newUser } = await supabase
    .from('users')
    .select('subscription_start, subscription_end')
    .eq('phone', userPhone)
    .single();

  if (newUser) {
    const start = new Date(newUser.subscription_start);
    const end = new Date(newUser.subscription_end);
    console.log('   - 开始时间(本地):', start.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    console.log('   - 结束时间(本地):', end.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    console.log('   - 天数:', ((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)).toFixed(2));
  }

  const { data: newSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_phone', userPhone)
    .eq('status', 'active')
    .single();

  if (newSub) {
    const start = new Date(newSub.period_start);
    const end = new Date(newSub.current_period_end);
    console.log('\n   订阅记录:');
    console.log('   - 开始时间(本地):', start.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    console.log('   - 结束时间(本地):', end.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    console.log('   - 天数:', ((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)).toFixed(2));
  }

  console.log('\n🎉 修复完成！\n');
}

fixUserSubscription().catch(console.error);

