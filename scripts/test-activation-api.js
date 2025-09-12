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

async function testActivationAPI() {
  console.log('🔍 测试激活码API...');
  
  try {
    // 1. 直接查询激活码表
    console.log('\n1️⃣ 直接查询激活码表...');
    const { data: directCodes, error: directError } = await supabase
      .from('activation_codes')
      .select('*')
      .limit(5);

    console.log('直接查询结果:', {
      count: directCodes?.length || 0,
      error: directError,
      codes: directCodes?.map(c => ({ code: c.code, is_used: c.is_used }))
    });

    // 2. 联表查询激活码和套餐
    console.log('\n2️⃣ 联表查询激活码和套餐...');
    const { data: joinedCodes, error: joinError } = await supabase
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*)
      `)
      .limit(5);

    console.log('联表查询结果:', {
      count: joinedCodes?.length || 0,
      error: joinError,
      codes: joinedCodes?.map(c => ({ 
        code: c.code, 
        is_used: c.is_used, 
        plan_name: c.plan?.name 
      }))
    });

    // 3. 完整联表查询（包含用户信息）
    console.log('\n3️⃣ 完整联表查询（包含用户信息）...');
    const { data: fullCodes, error: fullError } = await supabase
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*),
        used_by_user:users(phone, nickname)
      `)
      .limit(5);

    console.log('完整联表查询结果:', {
      count: fullCodes?.length || 0,
      error: fullError,
      codes: fullCodes?.map(c => ({ 
        code: c.code, 
        is_used: c.is_used, 
        plan_name: c.plan?.name,
        user_phone: c.used_by_user?.phone
      }))
    });

    // 4. 检查套餐表
    console.log('\n4️⃣ 检查套餐表...');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*');

    console.log('套餐表查询结果:', {
      count: plans?.length || 0,
      error: plansError,
      plans: plans?.map(p => ({ id: p.id, name: p.name }))
    });

    // 5. 检查用户表
    console.log('\n5️⃣ 检查用户表...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone, nickname, subscription_type')
      .limit(5);

    console.log('用户表查询结果:', {
      count: users?.length || 0,
      error: usersError,
      users: users?.map(u => ({ 
        id: u.id, 
        phone: u.phone, 
        nickname: u.nickname,
        subscription_type: u.subscription_type
      }))
    });

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testActivationAPI();
