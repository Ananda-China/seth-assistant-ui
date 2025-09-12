const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase环境变量');
  console.log('请确保设置了以下环境变量:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importTestData() {
  console.log('🚀 开始导入测试数据...');
  
  try {
    // 1. 创建测试套餐
    console.log('📦 创建测试套餐...');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .upsert([
        {
          id: '19699d89-2719-44e4-b4ca-10e3f6027d63',
          name: '月套餐',
          price: 99900,
          duration_days: 30,
          description: '月度会员，享受30天无限制AI助手服务',
          is_active: true
        },
        {
          id: '8fbf6d63-d210-470e-b7e4-c6899495bbbc',
          name: '年套餐',
          price: 399900,
          duration_days: 365,
          description: '年度会员，享受365天无限制AI助手服务',
          is_active: true
        }
      ], { onConflict: 'id' });

    if (plansError) {
      console.error('❌ 套餐创建失败:', plansError);
    } else {
      console.log('✅ 套餐创建成功');
    }

    // 2. 创建测试激活码
    console.log('🎫 创建测试激活码...');
    const { data: codes, error: codesError } = await supabase
      .from('activation_codes')
      .upsert([
        {
          id: '004204d2-4ea6-4537-ad4c-014427b24edc',
          code: 'RUO5NU4H',
          plan_id: '19699d89-2719-44e4-b4ca-10e3f6027d63',
          is_used: true,
          expires_at: '2025-12-07T06:31:21.287+00:00'
        },
        {
          id: '006dc7a5-4710-40a7-a2d3-572554c678e5',
          code: 'AA5I6P08',
          plan_id: '19699d89-2719-44e4-b4ca-10e3f6027d63',
          is_used: true,
          expires_at: '2025-12-10T01:08:13.145+00:00'
        },
        {
          id: '28fa644a-855c-418e-bd56-6c9f797ac48c',
          code: '9USRDANO',
          plan_id: '19699d89-2719-44e4-b4ca-10e3f6027d63',
          is_used: true,
          expires_at: '2025-12-06T09:02:08.489+00:00'
        }
      ], { onConflict: 'id' });

    if (codesError) {
      console.error('❌ 激活码创建失败:', codesError);
    } else {
      console.log('✅ 激活码创建成功');
    }

    // 3. 创建测试用户
    console.log('👥 创建测试用户...');
    const testUsers = [
      {
        id: '59c12597-810a-4c98-b181-339a1bc5cadb',
        phone: '13800138001',
        nickname: '测试用户1',
        invite_code: '13800138001',
        subscription_type: 'monthly',
        subscription_end: '2025-12-07T06:31:21.287+00:00'
      },
      {
        id: 'd23a8780-5694-41aa-91b4-243416497570',
        phone: '13800138002',
        nickname: '测试用户2',
        invite_code: '13800138002',
        subscription_type: 'monthly',
        subscription_end: '2025-12-10T01:08:13.145+00:00'
      },
      {
        id: '24c01461-60ec-477d-9a46-31a7f23de7ad',
        phone: '13800138003',
        nickname: '测试用户3',
        invite_code: '13800138003',
        subscription_type: 'monthly',
        subscription_end: '2025-12-06T09:02:08.489+00:00'
      }
    ];

    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert(testUsers, { onConflict: 'id' });

    if (usersError) {
      console.error('❌ 用户创建失败:', usersError);
    } else {
      console.log('✅ 用户创建成功');
    }

    // 4. 更新激活码的使用者
    console.log('🔗 关联激活码和用户...');
    const codeUpdates = [
      { id: '004204d2-4ea6-4537-ad4c-014427b24edc', used_by_user_id: '59c12597-810a-4c98-b181-339a1bc5cadb' },
      { id: '006dc7a5-4710-40a7-a2d3-572554c678e5', used_by_user_id: 'd23a8780-5694-41aa-91b4-243416497570' },
      { id: '28fa644a-855c-418e-bd56-6c9f797ac48c', used_by_user_id: '24c01461-60ec-477d-9a46-31a7f23de7ad' }
    ];

    for (const update of codeUpdates) {
      const { error } = await supabase
        .from('activation_codes')
        .update({ 
          used_by_user_id: update.used_by_user_id,
          activated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ 更新激活码 ${update.id} 失败:`, error);
      }
    }

    console.log('✅ 激活码关联完成');

    // 5. 验证数据
    console.log('🔍 验证导入的数据...');

    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*')
      .in('subscription_type', ['monthly', 'yearly']);

    if (finalError) {
      console.error('❌ 数据验证失败:', finalError);
    } else {
      console.log(`✅ 数据导入完成！付费用户数量: ${finalUsers.length}`);
      console.log('付费用户列表:');
      finalUsers.forEach(user => {
        console.log(`  - ${user.phone} (${user.nickname}) - ${user.subscription_type}`);
      });
    }

    // 6. 验证激活码数据
    const { data: finalCodes, error: finalCodesError } = await supabase
      .from('activation_codes')
      .select('*');

    if (finalCodesError) {
      console.error('❌ 激活码验证失败:', finalCodesError);
    } else {
      console.log(`✅ 激活码数量: ${finalCodes.length}`);
      console.log('激活码列表:');
      finalCodes.forEach(code => {
        console.log(`  - ${code.code} (${code.is_used ? '已使用' : '未使用'})`);
      });
    }

  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error);
  }
}

// 运行导入
importTestData();
