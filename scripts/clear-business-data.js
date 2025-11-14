/**
 * 清理业务数据脚本
 * 
 * 功能：清理所有业务数据（用户、聊天记录、订单等），保留系统配置（管理员、套餐、二维码）
 * 
 * 清理的表：
 * - users（用户）
 * - conversations（对话）
 * - messages（消息）
 * - orders（订单）
 * - subscriptions（订阅）
 * - activation_codes（激活码）
 * - balances（余额）
 * - commission_records（佣金记录）
 * - withdrawal_requests（提现请求）
 * 
 * 保留的表：
 * - admins（管理员）
 * - plans（套餐）
 * - qr_codes（二维码）
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function clearBusinessData() {
  console.log('\n🚨 ===== 数据清理脚本 ===== 🚨\n');
  console.log('⚠️  警告：此操作将清理所有业务数据，不可恢复！\n');
  console.log('📋 将要清理的数据：');
  console.log('   ✓ 用户信息（users）');
  console.log('   ✓ 对话记录（conversations）');
  console.log('   ✓ 聊天消息（messages）');
  console.log('   ✓ 订单记录（orders）');
  console.log('   ✓ 订阅信息（subscriptions）');
  console.log('   ✓ 激活码（activation_codes）');
  console.log('   ✓ 用户余额（balances）');
  console.log('   ✓ 佣金记录（commission_records）');
  console.log('   ✓ 提现请求（withdrawal_requests）');
  console.log('\n🔒 将要保留的数据：');
  console.log('   ✓ 管理员账号（admins）');
  console.log('   ✓ 套餐配置（plans）');
  console.log('   ✓ 客服二维码（qr_codes）');
  console.log('\n');

  // 第一次确认
  const confirm1 = await question('❓ 确认要清理所有业务数据吗？(输入 YES 继续): ');
  if (confirm1.trim() !== 'YES') {
    console.log('\n❌ 操作已取消\n');
    rl.close();
    return;
  }

  // 第二次确认
  const confirm2 = await question('❓ 再次确认：这将删除所有用户和聊天记录，确定吗？(输入 CONFIRM 继续): ');
  if (confirm2.trim() !== 'CONFIRM') {
    console.log('\n❌ 操作已取消\n');
    rl.close();
    return;
  }

  console.log('\n🔄 开始清理数据...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 统计清理前的数据量
    console.log('📊 清理前数据统计：');
    
    const tables = [
      'users',
      'conversations', 
      'messages',
      'orders',
      'subscriptions',
      'activation_codes',
      'balances',
      'commission_records',
      'withdrawal_requests'
    ];

    const beforeStats = {};
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        beforeStats[table] = count || 0;
        console.log(`   ${table}: ${count || 0} 条记录`);
      }
    }

    console.log('\n🗑️  开始清理...\n');

    // 按照外键依赖关系的正确顺序删除数据
    // 顺序：提现请求 -> 佣金记录 -> 余额 -> 订阅 -> 订单 -> 激活码 -> 消息 -> 对话 -> 用户

    console.log('1️⃣ 清理提现请求...');
    const { error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (withdrawalError) {
      console.log(`   ⚠️  警告: ${withdrawalError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['withdrawal_requests'] || 0} 条记录`);
    }

    console.log('2️⃣ 清理佣金记录...');
    const { error: commissionError } = await supabase
      .from('commission_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (commissionError) {
      console.log(`   ⚠️  警告: ${commissionError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['commission_records'] || 0} 条记录`);
    }

    console.log('3️⃣ 清理用户余额...');
    const { error: balancesError } = await supabase
      .from('balances')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (balancesError) {
      console.log(`   ⚠️  警告: ${balancesError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['balances'] || 0} 条记录`);
    }

    console.log('4️⃣ 清理订阅信息...');
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (subscriptionsError) {
      console.log(`   ⚠️  警告: ${subscriptionsError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['subscriptions'] || 0} 条记录`);
    }

    console.log('5️⃣ 清理订单记录...');
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (ordersError) {
      console.log(`   ⚠️  警告: ${ordersError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['orders'] || 0} 条记录`);
    }

    console.log('6️⃣ 清理激活码...');
    const { error: activationError } = await supabase
      .from('activation_codes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (activationError) {
      console.log(`   ⚠️  警告: ${activationError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['activation_codes'] || 0} 条记录`);
    }

    console.log('7️⃣ 清理聊天消息...');
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (messagesError) {
      console.log(`   ⚠️  警告: ${messagesError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['messages'] || 0} 条记录`);
    }

    console.log('8️⃣ 清理对话记录...');
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (conversationsError) {
      console.log(`   ⚠️  警告: ${conversationsError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['conversations'] || 0} 条记录`);
    }

    console.log('9️⃣ 清理用户信息...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (usersError) {
      console.log(`   ⚠️  警告: ${usersError.message}`);
    } else {
      console.log(`   ✅ 已清理 ${beforeStats['users'] || 0} 条记录`);
    }

    // 验证清理结果
    console.log('\n📊 清理后数据统计：');
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`   ${table}: ${count || 0} 条记录`);
      }
    }

    // 验证保留的数据
    console.log('\n🔒 验证保留的系统配置：');
    
    const { count: adminsCount } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true });
    console.log(`   admins（管理员）: ${adminsCount || 0} 条记录`);

    const { count: plansCount } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true });
    console.log(`   plans（套餐）: ${plansCount || 0} 条记录`);

    const { count: qrCodesCount } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true });
    console.log(`   qr_codes（二维码）: ${qrCodesCount || 0} 条记录`);

    console.log('\n✅ 数据清理完成！\n');
    console.log('📝 总结：');
    console.log(`   ✓ 已清理 ${Object.values(beforeStats).reduce((a, b) => a + b, 0)} 条业务数据`);
    console.log(`   ✓ 已保留 ${(adminsCount || 0) + (plansCount || 0) + (qrCodesCount || 0)} 条系统配置`);
    console.log('\n🎉 系统已准备好接受新用户注册！\n');

  } catch (error) {
    console.error('\n❌ 清理过程中出现错误:', error);
    console.log('\n⚠️  请检查错误信息并重试\n');
  } finally {
    rl.close();
  }
}

// 执行清理
clearBusinessData();

