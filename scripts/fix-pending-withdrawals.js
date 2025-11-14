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

async function fixPendingWithdrawals() {
  console.log('🔧 开始修复待处理的提现申请...');
  
  try {
    // 1. 获取所有待处理的提现申请
    console.log('\n1️⃣ 获取待处理的提现申请...');
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        user:users(phone, nickname)
      `)
      .eq('status', 'pending');

    if (requestsError) {
      console.error('❌ 获取提现申请失败:', requestsError);
      return;
    }

    console.log(`✅ 找到 ${pendingRequests.length} 个待处理的提现申请`);

    if (pendingRequests.length === 0) {
      console.log('✅ 没有待处理的提现申请需要修复');
      return;
    }

    // 2. 为每个待处理的提现申请扣减用户余额
    for (const request of pendingRequests) {
      const user = request.user;
      console.log(`\n🔄 处理用户 ${user.phone} (${user.nickname}) 的提现申请...`);
      console.log(`   申请金额: ¥${(request.amount / 100).toFixed(2)}`);
      console.log(`   申请时间: ${new Date(request.created_at).toLocaleString()}`);

      // 获取用户当前余额
      const { data: balance, error: balanceError } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', request.user_id)
        .single();

      if (balanceError) {
        console.error(`❌ 获取用户 ${user.phone} 余额失败:`, balanceError);
        continue;
      }

      const currentBalance = balance?.amount || 0;
      console.log(`   当前余额: ¥${(currentBalance / 100).toFixed(2)}`);

      // 检查余额是否足够
      if (currentBalance < request.amount) {
        console.log(`⚠️ 用户 ${user.phone} 余额不足，无法扣减`);
        console.log(`   需要: ¥${(request.amount / 100).toFixed(2)}, 实际: ¥${(currentBalance / 100).toFixed(2)}`);
        
        // 可以选择取消这个提现申请
        const { error: cancelError } = await supabase
          .from('withdrawal_requests')
          .update({
            status: 'rejected',
            rejection_reason: '余额不足，系统自动取消',
            processed_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (cancelError) {
          console.error(`❌ 取消提现申请失败:`, cancelError);
        } else {
          console.log(`✅ 已自动取消用户 ${user.phone} 的提现申请`);
        }
        continue;
      }

      // 扣减余额
      const newBalance = currentBalance - request.amount;
      const { error: updateError } = await supabase
        .from('balances')
        .upsert({
          user_id: request.user_id,
          amount: newBalance
        });

      if (updateError) {
        console.error(`❌ 扣减用户 ${user.phone} 余额失败:`, updateError);
      } else {
        console.log(`✅ 用户 ${user.phone} 余额已扣减`);
        console.log(`   扣减前: ¥${(currentBalance / 100).toFixed(2)}`);
        console.log(`   扣减后: ¥${(newBalance / 100).toFixed(2)}`);
      }
    }

    // 3. 验证修复结果
    console.log('\n3️⃣ 验证修复结果...');
    
    // 检查所有用户的余额
    const { data: allBalances, error: balancesError } = await supabase
      .from('balances')
      .select(`
        *,
        user:users(phone, nickname)
      `);

    if (balancesError) {
      console.error('❌ 获取余额失败:', balancesError);
    } else {
      console.log('\n💰 当前用户余额状态:');
      allBalances.forEach(balance => {
        console.log(`  - ${balance.user.phone} (${balance.user.nickname}): ¥${(balance.amount / 100).toFixed(2)}`);
      });
    }

    // 检查待处理的提现申请
    const { data: remainingRequests, error: remainingError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending');

    if (remainingError) {
      console.error('❌ 获取剩余提现申请失败:', remainingError);
    } else {
      console.log(`\n📋 剩余待处理提现申请: ${remainingRequests.length} 个`);
    }

    console.log('\n✅ 提现申请修复完成！');

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  }
}

// 运行修复
fixPendingWithdrawals();
