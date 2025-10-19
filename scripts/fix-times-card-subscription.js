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

async function fixTimesCardSubscription() {
  const phone = '17301807380';
  
  console.log(`\n🔧 修复用户 ${phone} 的次卡订阅...\n`);

  // 1. 查询用户信息
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (userError) {
    console.error('❌ 查询用户失败:', userError.message);
    return;
  }

  console.log('✅ 找到用户:', user.phone);

  // 2. 查询次卡订阅记录
  const { data: subscription, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_phone', phone)
    .eq('plan', '次卡')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subsError) {
    console.error('❌ 查询订阅失败:', subsError.message);
    return;
  }

  console.log('✅ 找到次卡订阅:', subscription.id);
  console.log('   当前状态:', subscription.status);
  console.log('   开始时间:', subscription.period_start);
  console.log('   结束时间:', subscription.current_period_end);

  // 3. 修复订阅记录
  console.log('\n🔧 修复订阅记录...');
  
  // 次卡不限制时间，设置为100年后
  const subscriptionStart = new Date(subscription.period_start);
  const subscriptionEnd = new Date(subscriptionStart.getTime() + 36500 * 24 * 60 * 60 * 1000);

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: subscriptionEnd.toISOString()
    })
    .eq('id', subscription.id);

  if (updateError) {
    console.error('❌ 更新订阅失败:', updateError.message);
    return;
  }

  console.log('✅ 订阅记录已更新');
  console.log('   新状态: active');
  console.log('   新结束时间:', subscriptionEnd.toISOString());
  console.log('   说明: 次卡不限制时间，只限制50次聊天');

  // 4. 验证修复结果
  console.log('\n🔍 验证修复结果...');
  
  const { data: updatedSubscription, error: verifyError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription.id)
    .single();

  if (verifyError) {
    console.error('❌ 验证失败:', verifyError.message);
    return;
  }

  console.log('✅ 验证成功');
  console.log('   订阅状态:', updatedSubscription.status);
  console.log('   结束时间:', updatedSubscription.current_period_end);
  console.log('   当前已用:', user.chat_count, '次');
  console.log('   剩余次数:', Math.max(0, 50 - user.chat_count), '次');

  console.log('\n✅ 修复完成！用户现在可以正常使用次卡了。\n');
}

fixTimesCardSubscription().catch(console.error);

