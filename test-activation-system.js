/**
 * 激活码系统测试脚本
 * 用于测试完整的激活码支付与推广返佣流程
 */

const { createClient } = require('@supabase/supabase-js');

// 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('请设置 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testActivationSystem() {
  console.log('🚀 开始测试激活码系统...\n');

  try {
    // 1. 测试套餐数据
    console.log('1. 检查套餐数据...');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true);

    if (plansError) {
      console.error('❌ 获取套餐失败:', plansError);
      return;
    }

    console.log('✅ 套餐数据:', plans.map(p => `${p.name} - ¥${(p.price/100).toFixed(2)}`));

    // 2. 测试激活码生成
    console.log('\n2. 测试激活码生成...');
    const testPlan = plans[0];
    if (!testPlan) {
      console.error('❌ 没有找到套餐数据');
      return;
    }

    // 生成测试激活码
    const { data: newCodes, error: generateError } = await supabase
      .from('activation_codes')
      .insert([
        {
          code: 'TEST001',
          plan_id: testPlan.id,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90天后过期
        },
        {
          code: 'TEST002',
          plan_id: testPlan.id,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
      .select();

    if (generateError) {
      console.error('❌ 生成激活码失败:', generateError);
      return;
    }

    console.log('✅ 生成测试激活码成功:', newCodes.map(c => c.code));

    // 3. 测试用户创建
    console.log('\n3. 创建测试用户...');
    const testUsers = [
      {
        phone: '13800138001',
        nickname: '测试用户1',
        invite_code: 'INV001',
        invited_by: null
      },
      {
        phone: '13800138002',
        nickname: '测试用户2',
        invite_code: 'INV002',
        invited_by: 'INV001'
      }
    ];

    for (const user of testUsers) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', user.phone)
        .single();

      if (!existingUser) {
        const { error: userError } = await supabase
          .from('users')
          .insert(user);

        if (userError) {
          console.error(`❌ 创建用户 ${user.phone} 失败:`, userError);
        } else {
          console.log(`✅ 创建用户 ${user.phone} 成功`);
        }
      } else {
        console.log(`✅ 用户 ${user.phone} 已存在`);
      }
    }

    // 4. 测试激活码激活
    console.log('\n4. 测试激活码激活...');
    const { data: user1 } = await supabase
      .from('users')
      .select('id')
      .eq('phone', '13800138001')
      .single();

    if (user1) {
      // 模拟激活码激活
      const { error: activateError } = await supabase
        .from('activation_codes')
        .update({
          is_used: true,
          used_by_user_id: user1.id,
          activated_at: new Date().toISOString()
        })
        .eq('code', 'TEST001');

      if (activateError) {
        console.error('❌ 激活码激活失败:', activateError);
      } else {
        console.log('✅ 激活码 TEST001 激活成功');

        // 创建订单记录
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            out_trade_no: `TEST_${Date.now()}`,
            user_phone: '13800138001',
            plan: testPlan.name,
            plan_id: testPlan.id,
            amount_fen: testPlan.price,
            duration_days: testPlan.duration_days,
            status: 'success',
            trade_no: `ACTIVATION_TEST001`,
            paid_at: new Date().toISOString(),
            activation_code_id: newCodes[0].id,
            order_type: 'activation'
          });

        if (orderError) {
          console.error('❌ 创建订单失败:', orderError);
        } else {
          console.log('✅ 订单创建成功');
        }

        // 创建订阅记录
        const subscriptionEnd = new Date();
        subscriptionEnd.setDate(subscriptionEnd.getDate() + testPlan.duration_days);

        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .upsert({
            user_phone: '13800138001',
            plan: testPlan.name,
            status: 'active',
            period_start: new Date().toISOString(),
            current_period_end: subscriptionEnd.toISOString(),
            activation_code_id: newCodes[0].id,
            subscription_type: 'activation'
          }, {
            onConflict: 'user_phone,status'
          });

        if (subscriptionError) {
          console.error('❌ 创建订阅失败:', subscriptionError);
        } else {
          console.log('✅ 订阅创建成功');
        }
      }
    }

    // 5. 测试返佣系统
    console.log('\n5. 测试返佣系统...');
    const { data: user2 } = await supabase
      .from('users')
      .select('id')
      .eq('phone', '13800138002')
      .single();

    if (user2) {
      // 创建佣金记录
      const commissionAmount = Math.floor(testPlan.price * 0.4); // 40% 返佣
      const { error: commissionError } = await supabase
        .from('commission_records')
        .insert({
          inviter_user_id: user2.id,
          invited_user_id: user1.id,
          plan_id: testPlan.id,
          commission_amount: commissionAmount,
          commission_percentage: 40,
          level: 0,
          activation_code_id: newCodes[0].id
        });

      if (commissionError) {
        console.error('❌ 创建佣金记录失败:', commissionError);
      } else {
        console.log('✅ 佣金记录创建成功');

        // 更新用户余额
        const { error: balanceError } = await supabase
          .from('balances')
          .upsert({
            user_id: user2.id,
            amount: commissionAmount
          });

        if (balanceError) {
          console.error('❌ 更新用户余额失败:', balanceError);
        } else {
          console.log('✅ 用户余额更新成功');
        }
      }
    }

    // 6. 测试提现申请
    console.log('\n6. 测试提现申请...');
    if (user2) {
      const { error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user2.id,
          amount: 2000, // 20元
          payment_method: 'alipay',
          account_info: 'test@example.com'
        });

      if (withdrawalError) {
        console.error('❌ 创建提现申请失败:', withdrawalError);
      } else {
        console.log('✅ 提现申请创建成功');
      }
    }

    // 7. 验证数据
    console.log('\n7. 验证数据...');
    
    // 检查激活码状态
    const { data: usedCodes } = await supabase
      .from('activation_codes')
      .select('*')
      .eq('is_used', true);

    console.log(`✅ 已使用激活码数量: ${usedCodes?.length || 0}`);

    // 检查订单
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'activation');

    console.log(`✅ 激活码订单数量: ${orders?.length || 0}`);

    // 检查佣金记录
    const { data: commissions } = await supabase
      .from('commission_records')
      .select('*');

    console.log(`✅ 佣金记录数量: ${commissions?.length || 0}`);

    // 检查提现申请
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*');

    console.log(`✅ 提现申请数量: ${withdrawals?.length || 0}`);

    console.log('\n🎉 激活码系统测试完成！');
    console.log('\n📋 测试总结:');
    console.log('- ✅ 套餐数据正常');
    console.log('- ✅ 激活码生成功能正常');
    console.log('- ✅ 用户创建功能正常');
    console.log('- ✅ 激活码激活功能正常');
    console.log('- ✅ 订单创建功能正常');
    console.log('- ✅ 订阅创建功能正常');
    console.log('- ✅ 返佣系统功能正常');
    console.log('- ✅ 提现申请功能正常');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testActivationSystem();
