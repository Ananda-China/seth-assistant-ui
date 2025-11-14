/**
 * 清理后验证脚本
 * 
 * 验证：
 * 1. 业务数据已清空
 * 2. 系统配置保留完好
 * 3. 功能可以正常使用
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 清理后系统验证\n');

  let allPassed = true;

  // 1. 验证业务数据已清空
  console.log('1️⃣ 验证业务数据已清空...\n');
  
  const businessTables = [
    { name: 'users', desc: '用户' },
    { name: 'conversations', desc: '对话' },
    { name: 'messages', desc: '消息' },
    { name: 'orders', desc: '订单' },
    { name: 'subscriptions', desc: '订阅' },
    { name: 'activation_codes', desc: '激活码' },
    { name: 'balances', desc: '余额' },
    { name: 'commission_records', desc: '佣金记录' },
    { name: 'withdrawal_requests', desc: '提现申请' }
  ];

  for (const table of businessTables) {
    const { count, error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ ${table.desc}: 查询失败 (${error.message})`);
      allPassed = false;
    } else if (count === 0) {
      console.log(`   ✅ ${table.desc}: 已清空`);
    } else {
      console.log(`   ⚠️  ${table.desc}: 还有 ${count} 条记录`);
      allPassed = false;
    }
  }

  // 2. 验证系统配置保留
  console.log('\n2️⃣ 验证系统配置保留...\n');

  // 检查管理员账号
  const { data: admins, error: adminError } = await supabase
    .from('admins')
    .select('username');
  
  if (adminError) {
    console.log(`   ❌ 管理员账号: 查询失败 (${adminError.message})`);
    allPassed = false;
  } else if (!admins || admins.length === 0) {
    console.log('   ⚠️  管理员账号: 未找到管理员账号');
    allPassed = false;
  } else {
    console.log(`   ✅ 管理员账号: ${admins.length} 个`);
    admins.forEach(admin => {
      console.log(`      - ${admin.username}`);
    });
  }

  // 检查套餐配置
  const { data: plans, error: planError } = await supabase
    .from('plans')
    .select('name, price, duration_days')
    .order('price', { ascending: true });
  
  if (planError) {
    console.log(`   ❌ 套餐配置: 查询失败 (${planError.message})`);
    allPassed = false;
  } else if (!plans || plans.length === 0) {
    console.log('   ⚠️  套餐配置: 未找到套餐配置');
    allPassed = false;
  } else {
    console.log(`   ✅ 套餐配置: ${plans.length} 个`);
    plans.forEach(plan => {
      const price = (plan.price / 100).toFixed(2);
      const duration = plan.duration_days ? `${plan.duration_days}天` : '50次';
      console.log(`      - ${plan.name}: ¥${price} (${duration})`);
    });
  }

  // 检查客服二维码
  const { data: qrCodes, error: qrError } = await supabase
    .from('qr_codes')
    .select('name, description, is_active')
    .eq('is_active', true);
  
  if (qrError) {
    console.log(`   ⚠️  客服二维码: 查询失败 (${qrError.message})`);
  } else if (!qrCodes || qrCodes.length === 0) {
    console.log('   ⚠️  客服二维码: 未找到启用的二维码');
  } else {
    console.log(`   ✅ 客服二维码: ${qrCodes.length} 个`);
    qrCodes.forEach(qr => {
      console.log(`      - ${qr.name}: ${qr.description || '无描述'}`);
    });
  }

  // 3. 验证数据库表结构
  console.log('\n3️⃣ 验证数据库表结构...\n');

  const allTables = [
    ...businessTables,
    { name: 'admins', desc: '管理员' },
    { name: 'plans', desc: '套餐' },
    { name: 'qr_codes', desc: '二维码' }
  ];

  let tableCount = 0;
  for (const table of allTables) {
    const { error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      tableCount++;
    }
  }

  console.log(`   ✅ 数据库表: ${tableCount}/${allTables.length} 个表可访问`);

  // 4. 功能测试建议
  console.log('\n4️⃣ 功能测试建议...\n');
  
  console.log('   📝 建议测试以下功能：');
  console.log('      1. 用户注册 - 注册新用户，验证免费5次');
  console.log('      2. 用户登录 - 登录新注册的用户');
  console.log('      3. 聊天功能 - 发送消息，验证AI回复');
  console.log('      4. 激活码生成 - 管理后台生成激活码');
  console.log('      5. 激活码激活 - 使用激活码激活套餐');
  console.log('      6. 个人中心 - 查看用户信息和剩余次数');
  console.log('      7. 新手引导 - 验证新用户引导流程');

  // 5. 总结
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ 验证通过！系统已准备好进行全新测试');
  } else {
    console.log('⚠️  验证未完全通过，请检查上述问题');
  }
  console.log('='.repeat(50) + '\n');

  // 6. 快速测试命令
  console.log('💡 快速测试命令：\n');
  console.log('   # 启动开发服务器');
  console.log('   npm run dev\n');
  console.log('   # 访问以下页面测试');
  console.log('   - 首页: http://localhost:3002');
  console.log('   - 登录: http://localhost:3002/login');
  console.log('   - 注册: http://localhost:3002/register');
  console.log('   - 管理后台: http://localhost:3002/admin');
  console.log('   - 激活码管理: http://localhost:3002/admin/activation\n');
}

main().catch(console.error);

