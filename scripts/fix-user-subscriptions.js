const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserSubscriptions() {
  console.log('🔧 开始修复用户订阅状态...');
  
  try {
    // 1. 获取所有已使用的激活码及其关联信息
    console.log('\n1️⃣ 获取已使用的激活码...');
    const { data: usedCodes, error: codesError } = await supabase
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*),
        used_by_user:users(*)
      `)
      .eq('is_used', true);

    if (codesError) {
      console.error('❌ 获取激活码失败:', codesError);
      return;
    }

    console.log(`✅ 找到 ${usedCodes.length} 个已使用的激活码`);

    // 2. 为每个使用激活码的用户更新订阅状态
    for (const code of usedCodes) {
      if (!code.used_by_user || !code.plan) {
        console.log(`⚠️ 跳过激活码 ${code.code}：缺少用户或套餐信息`);
        continue;
      }

      const user = code.used_by_user;
      const plan = code.plan;
      
      console.log(`\n🔄 处理用户 ${user.phone} (${user.nickname})...`);
      console.log(`   激活码: ${code.code}`);
      console.log(`   套餐: ${plan.name} (${plan.duration_days}天)`);

      // 计算订阅结束时间
      const activatedAt = new Date(code.activated_at || code.created_at);
      const subscriptionEnd = new Date(activatedAt.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

      // 确定订阅类型
      let subscriptionType = 'monthly';
      if (plan.duration_days >= 365) {
        subscriptionType = 'yearly';
      } else if (plan.duration_days >= 90) {
        subscriptionType = 'quarterly';
      }

      console.log(`   订阅类型: ${subscriptionType}`);
      console.log(`   订阅结束: ${subscriptionEnd.toISOString()}`);

      // 更新用户订阅状态
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_type: subscriptionType,
          subscription_start: activatedAt.toISOString(),
          subscription_end: subscriptionEnd.toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ 更新用户 ${user.phone} 失败:`, updateError);
      } else {
        console.log(`✅ 用户 ${user.phone} 订阅状态已更新`);
      }
    }

    // 3. 验证修复结果
    console.log('\n3️⃣ 验证修复结果...');
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('users')
      .select('phone, nickname, subscription_type, subscription_start, subscription_end')
      .in('subscription_type', ['monthly', 'quarterly', 'yearly']);

    if (verifyError) {
      console.error('❌ 验证失败:', verifyError);
    } else {
      console.log(`✅ 修复完成！付费用户数量: ${updatedUsers.length}`);
      console.log('\n付费用户列表:');
      updatedUsers.forEach(user => {
        const endDate = new Date(user.subscription_end);
        const isActive = endDate > new Date();
        console.log(`  - ${user.phone} (${user.nickname})`);
        console.log(`    订阅类型: ${user.subscription_type}`);
        console.log(`    结束时间: ${endDate.toLocaleDateString()}`);
        console.log(`    状态: ${isActive ? '✅ 有效' : '❌ 已过期'}`);
        console.log('');
      });
    }

    // 4. 检查激活码显示
    console.log('\n4️⃣ 检查激活码显示数据...');
    const { data: displayCodes, error: displayError } = await supabase
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*),
        used_by_user:users(phone, nickname)
      `)
      .order('created_at', { ascending: false });

    if (displayError) {
      console.error('❌ 获取显示数据失败:', displayError);
    } else {
      console.log(`✅ 激活码显示数据准备完成，共 ${displayCodes.length} 条记录`);
      displayCodes.forEach(code => {
        console.log(`  - ${code.code} | ${code.plan?.name} | ${code.is_used ? '已使用' : '未使用'} | ${code.used_by_user?.phone || '无'}`);
      });
    }

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  }
}

// 运行修复
fixUserSubscriptions();
