// 测试佣金API的问题
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

async function testCommissionAPI() {
  console.log('🔍 开始测试佣金API...\n');

  try {
    // 1. 检查commission_records表是否存在
    console.log('1. 检查commission_records表是否存在...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'commission_records');

    if (tablesError) {
      console.error('❌ 查询表信息失败:', tablesError);
    } else {
      console.log('✅ 表查询成功，找到', tables?.length || 0, '个commission_records表');
    }

    // 2. 测试commission_records表查询
    console.log('\n2. 测试commission_records表查询...');
    const { data: records, error: recordsError } = await supabaseAdmin
      .from('commission_records')
      .select('*')
      .limit(1);

    if (recordsError) {
      console.error('❌ commission_records表查询失败:', recordsError);
      console.error('   错误详情:', recordsError.message);
    } else {
      console.log('✅ commission_records表查询成功，找到', records?.length || 0, '条记录');
    }

    // 3. 测试关联查询（模拟佣金API的查询）
    console.log('\n3. 测试关联查询（模拟佣金API的查询）...');
    const { data: joinedRecords, error: joinedError } = await supabaseAdmin
      .from('commission_records')
      .select(`
        *,
        plan:plans(name, price),
        invited_user:users!commission_records_invited_user_id_fkey(phone, nickname)
      `)
      .limit(1);

    if (joinedError) {
      console.error('❌ 关联查询失败:', joinedError);
      console.error('   错误详情:', joinedError.message);
    } else {
      console.log('✅ 关联查询成功，找到', joinedRecords?.length || 0, '条记录');
    }

    // 4. 检查users表结构
    console.log('\n4. 检查users表结构...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, phone, nickname')
      .limit(1);

    if (usersError) {
      console.error('❌ users表查询失败:', usersError);
    } else {
      console.log('✅ users表查询成功，找到', users?.length || 0, '个用户');
    }

    // 5. 检查plans表结构
    console.log('\n5. 检查plans表结构...');
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('id, name, price')
      .limit(1);

    if (plansError) {
      console.error('❌ plans表查询失败:', plansError);
    } else {
      console.log('✅ plans表查询成功，找到', plans?.length || 0, '个套餐');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testCommissionAPI().then(() => {
  console.log('\n🏁 佣金API测试完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
