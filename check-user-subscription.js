const { supabaseAdmin } = require('./lib/supabase.ts');

async function checkUserSubscription() {
  console.log('🔍 检查用户 13472881751 的订阅信息...');
  
  try {
    // 1. 检查套餐配置
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('*');
    
    console.log('📋 套餐配置:');
    plans?.forEach(plan => {
      console.log(`  - ${plan.name}: ${plan.duration_days}天, ¥${plan.price/100}`);
    });
    
    // 2. 获取用户ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, phone, trial_end, subscription_type, subscription_end')
      .eq('phone', '13472881751')
      .single();
    
    if (userError || !user) {
      console.log('❌ 用户不存在');
      return;
    }
    
    console.log('\n👤 用户信息:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - 手机: ${user.phone}`);
    console.log(`  - 试用期结束: ${user.trial_end}`);
    console.log(`  - 订阅类型: ${user.subscription_type}`);
    console.log(`  - 订阅结束: ${user.subscription_end}`);
    
    // 3. 检查用户订阅记录
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_phone', '13472881751')
      .order('created_at', { ascending: false });
    
    console.log('\n📊 用户订阅记录:');
    subscriptions?.forEach((sub, index) => {
      console.log(`  订阅 ${index + 1}:`);
      console.log(`    - 套餐: ${sub.plan}`);
      console.log(`    - 状态: ${sub.status}`);
      console.log(`    - 开始: ${sub.period_start}`);
      console.log(`    - 结束: ${sub.current_period_end}`);
      console.log(`    - 类型: ${sub.subscription_type}`);
      console.log(`    - 激活码ID: ${sub.activation_code_id}`);
      console.log(`    - 创建时间: ${sub.created_at}`);
      console.log('    ---');
    });
    
    // 4. 检查激活码记录
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('activation_codes')
      .select('*, plan:plans(*)')
      .eq('used_by_user_id', user.id);
    
    console.log('\n🎫 用户使用的激活码:');
    codes?.forEach((code, index) => {
      console.log(`  激活码 ${index + 1}:`);
      console.log(`    - 激活码: ${code.code}`);
      console.log(`    - 套餐: ${code.plan?.name} (${code.plan?.duration_days}天)`);
      console.log(`    - 激活时间: ${code.activated_at}`);
      console.log(`    - 创建时间: ${code.created_at}`);
      console.log('    ---');
    });
    
    // 5. 计算时间差
    if (subscriptions && subscriptions.length > 0) {
      const latestSub = subscriptions[0];
      const startDate = new Date(latestSub.period_start);
      const endDate = new Date(latestSub.current_period_end);
      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      console.log('\n⏰ 时间计算:');
      console.log(`  - 开始日期: ${startDate.toLocaleDateString()}`);
      console.log(`  - 结束日期: ${endDate.toLocaleDateString()}`);
      console.log(`  - 实际天数: ${diffDays}天`);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkUserSubscription();
