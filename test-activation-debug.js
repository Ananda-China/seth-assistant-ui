// 测试激活码系统的问题
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少Supabase配置');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testActivationSystem() {
  console.log('🔍 开始测试激活码系统...\n');

  try {
    // 1. 测试激活码查询
    console.log('1. 测试激活码查询...');
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*),
        used_by_user:users(phone, nickname)
      `)
      .order('created_at', { ascending: false });

    if (codesError) {
      console.error('❌ 激活码查询失败:', codesError);
    } else {
      console.log('✅ 激活码查询成功，找到', codes?.length || 0, '个激活码');
      if (codes && codes.length > 0) {
        console.log('   第一个激活码:', {
          code: codes[0].code,
          plan: codes[0].plan?.name,
          is_used: codes[0].is_used
        });
      }
    }

    // 2. 测试套餐查询
    console.log('\n2. 测试套餐查询...');
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('is_active', true);

    if (plansError) {
      console.error('❌ 套餐查询失败:', plansError);
    } else {
      console.log('✅ 套餐查询成功，找到', plans?.length || 0, '个套餐');
      if (plans && plans.length > 0) {
        console.log('   第一个套餐:', {
          id: plans[0].id,
          name: plans[0].name,
          price: plans[0].price,
          id_length: plans[0].id.length
        });
      }
    }

    // 3. 测试orders表结构
    console.log('\n3. 测试orders表结构...');
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.error('❌ orders表查询失败:', ordersError);
    } else {
      console.log('✅ orders表查询成功');
      if (orders && orders.length > 0) {
        console.log('   订单示例:', {
          plan_id: orders[0].plan_id,
          plan_id_length: orders[0].plan_id?.length || 0
        });
      }
    }

    // 4. 测试创建订单（模拟激活码激活）
    console.log('\n4. 测试创建订单（模拟激活码激活）...');
    if (plans && plans.length > 0 && codes && codes.length > 0) {
      const testOrderId = `TEST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const testPlan = plans[0];
      const testCode = codes[0];
      
      console.log('   测试数据:', {
        orderId: testOrderId,
        planId: testPlan.id,
        planIdLength: testPlan.id.length,
        codeId: testCode.id
      });

      const { error: insertError } = await supabaseAdmin
        .from('orders')
        .insert({
          out_trade_no: testOrderId,
          user_phone: 'test_phone',
          plan: testPlan.name,
          plan_id: testPlan.id, // 这里会测试字段长度限制
          amount_fen: testPlan.price,
          duration_days: testPlan.duration_days,
          status: 'success',
          trade_no: `TEST_${testCode.id}`,
          paid_at: new Date().toISOString(),
          activation_code_id: testCode.id,
          order_type: 'activation'
        });

      if (insertError) {
        console.error('❌ 创建测试订单失败:', insertError);
        console.error('   错误详情:', insertError.message);
      } else {
        console.log('✅ 创建测试订单成功');
        
        // 清理测试数据
        await supabaseAdmin
          .from('orders')
          .delete()
          .eq('out_trade_no', testOrderId);
        console.log('   已清理测试数据');
      }
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testActivationSystem().then(() => {
  console.log('\n🏁 测试完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
