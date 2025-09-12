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

async function verifyProduction() {
  console.log('🔍 验证生产环境数据...');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  try {
    // 1. 验证付费用户数据
    console.log('\n1️⃣ 验证付费用户数据...');
    const { data: paidUsers, error: usersError } = await supabase
      .from('users')
      .select('phone, nickname, subscription_type, subscription_start, subscription_end')
      .in('subscription_type', ['monthly', 'quarterly', 'yearly']);

    if (usersError) {
      console.error('❌ 获取付费用户失败:', usersError);
    } else {
      console.log(`✅ 付费用户数量: ${paidUsers.length}`);
      paidUsers.forEach(user => {
        const endDate = new Date(user.subscription_end);
        const isActive = endDate > new Date();
        console.log(`  - ${user.phone} (${user.nickname})`);
        console.log(`    类型: ${user.subscription_type}, 状态: ${isActive ? '✅ 有效' : '❌ 已过期'}`);
      });
    }

    // 2. 验证激活码数据
    console.log('\n2️⃣ 验证激活码数据...');
    const { data: codes, error: codesError } = await supabase
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*),
        used_by_user:users(phone, nickname)
      `)
      .order('created_at', { ascending: false });

    if (codesError) {
      console.error('❌ 获取激活码失败:', codesError);
    } else {
      console.log(`✅ 激活码数量: ${codes.length}`);
      codes.forEach(code => {
        console.log(`  - ${code.code} | ${code.plan?.name} | ${code.is_used ? '已使用' : '未使用'} | ${code.used_by_user?.phone || '无'}`);
      });
    }

    // 3. 验证套餐数据
    console.log('\n3️⃣ 验证套餐数据...');
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true);

    if (plansError) {
      console.error('❌ 获取套餐失败:', plansError);
    } else {
      console.log(`✅ 活跃套餐数量: ${plans.length}`);
      plans.forEach(plan => {
        console.log(`  - ${plan.name}: ¥${(plan.price / 100).toFixed(2)} (${plan.duration_days}天)`);
      });
    }

    // 4. 验证订单数据
    console.log('\n4️⃣ 验证订单数据...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.error('❌ 获取订单失败:', ordersError);
    } else {
      console.log(`✅ 成功订单数量: ${orders.length}`);
      const totalRevenue = orders.reduce((sum, order) => sum + order.amount_fen, 0);
      console.log(`💰 总收入: ¥${(totalRevenue / 100).toFixed(2)}`);
    }

    // 5. 验证消息统计
    console.log('\n5️⃣ 验证消息统计...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, token_usage, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error('❌ 获取消息失败:', messagesError);
    } else {
      console.log(`✅ 最近消息数量: ${messages.length}`);
      const totalTokens = messages.reduce((sum, msg) => sum + (msg.token_usage || 0), 0);
      console.log(`🔤 Token使用量: ${totalTokens}`);
    }

    // 6. 生成管理后台访问信息
    console.log('\n6️⃣ 管理后台访问信息...');
    console.log('🌐 生产环境地址: https://seth-assistant-nmq0srj7e-anandas-projects-049f2ad7.vercel.app');
    console.log('🔐 管理后台: https://seth-assistant-nmq0srj7e-anandas-projects-049f2ad7.vercel.app/admin');
    console.log('👤 管理员账号: admin');
    console.log('🔑 管理员密码: admin123');
    console.log('🛠️ 调试API: https://seth-assistant-nmq0srj7e-anandas-projects-049f2ad7.vercel.app/api/debug/activation-codes');

    console.log('\n✅ 生产环境验证完成！');

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
  }
}

// 运行验证
verifyProduction();
