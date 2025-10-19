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

async function fixAllTimesCardSubscriptions() {
  console.log('\n🔧 修复所有次卡订阅...\n');

  // 1. 查询所有次卡订阅
  const { data: subscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('plan', '次卡')
    .order('created_at', { ascending: false });

  if (subsError) {
    console.error('❌ 查询订阅失败:', subsError.message);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('ℹ️ 没有找到次卡订阅记录');
    return;
  }

  console.log(`✅ 找到 ${subscriptions.length} 条次卡订阅记录\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  // 2. 逐个修复
  for (const subscription of subscriptions) {
    console.log(`📋 处理订阅: ${subscription.id}`);
    console.log(`   用户: ${subscription.user_phone}`);
    console.log(`   当前状态: ${subscription.status}`);
    console.log(`   开始时间: ${subscription.period_start}`);
    console.log(`   结束时间: ${subscription.current_period_end}`);

    // 检查是否需要修复
    const startDate = new Date(subscription.period_start);
    const endDate = new Date(subscription.current_period_end);
    const needsFix = subscription.status === 'expired' || 
                     (endDate.getTime() - startDate.getTime()) < 365 * 24 * 60 * 60 * 1000; // 小于1年

    if (!needsFix) {
      console.log('   ✅ 状态正常，跳过\n');
      skippedCount++;
      continue;
    }

    // 修复：次卡不限制时间，设置为100年后
    const subscriptionEnd = new Date(startDate.getTime() + 36500 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: subscriptionEnd.toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('   ❌ 更新失败:', updateError.message, '\n');
      continue;
    }

    console.log('   ✅ 已修复');
    console.log('   新状态: active');
    console.log('   新结束时间:', subscriptionEnd.toISOString(), '\n');
    fixedCount++;
  }

  // 3. 总结
  console.log('\n📊 修复总结:');
  console.log(`   总计: ${subscriptions.length} 条订阅`);
  console.log(`   已修复: ${fixedCount} 条`);
  console.log(`   跳过: ${skippedCount} 条`);
  console.log('\n✅ 修复完成！\n');
}

fixAllTimesCardSubscriptions().catch(console.error);

