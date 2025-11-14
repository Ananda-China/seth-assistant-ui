// 测试激活码系统修复
const { createClient } = require('@supabase/supabase-js');

// 从环境变量或直接设置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.log('请设置环境变量 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testActivationSystem() {
  try {
    console.log('🔍 测试激活码系统...');
    
    // 1. 检查orders表结构
    console.log('\n1. 检查orders表结构:');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ 查询orders表失败:', ordersError.message);
    } else {
      console.log('✅ orders表字段:', Object.keys(orders?.[0] || {}));
      console.log('   包含activation_code_id:', 'activation_code_id' in (orders?.[0] || {}));
      console.log('   包含order_type:', 'order_type' in (orders?.[0] || {}));
    }
    
    // 2. 检查subscriptions表结构
    console.log('\n2. 检查subscriptions表结构:');
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);
    
    if (subsError) {
      console.error('❌ 查询subscriptions表失败:', subsError.message);
    } else {
      console.log('✅ subscriptions表字段:', Object.keys(subscriptions?.[0] || {}));
      console.log('   包含activation_code_id:', 'activation_code_id' in (subscriptions?.[0] || {}));
      console.log('   包含subscription_type:', 'subscription_type' in (subscriptions?.[0] || {}));
    }
    
    // 3. 检查激活码表
    console.log('\n3. 检查激活码表:');
    const { data: codes, error: codesError } = await supabase
      .from('activation_codes')
      .select('*')
      .limit(1);
    
    if (codesError) {
      console.error('❌ 查询activation_codes表失败:', codesError.message);
    } else {
      console.log('✅ activation_codes表字段:', Object.keys(codes?.[0] || {}));
    }
    
    // 4. 检查套餐表
    console.log('\n4. 检查套餐表:');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*');
    
    if (plansError) {
      console.error('❌ 查询plans表失败:', plansError.message);
    } else {
      console.log('✅ 套餐数据:', plans?.map(p => `${p.name}: ¥${p.price/100}`));
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testActivationSystem();
