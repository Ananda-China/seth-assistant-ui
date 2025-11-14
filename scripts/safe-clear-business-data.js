/**
 * 安全清理业务数据脚本
 * 
 * 清理内容：
 * - 用户注册登录信息 (users表)
 * - 聊天对话和消息 (conversations, messages表)
 * - 激活码 (activation_codes表)
 * - 订单和支付信息 (orders表)
 * - 用户订阅 (subscriptions表)
 * - 用户余额 (balances表)
 * - 佣金记录 (commission_records表)
 * - 提现申请 (withdrawal_requests表)
 * 
 * 保留内容：
 * - 管理员账号 (admins表)
 * - 套餐配置 (plans表)
 * - 客服二维码 (qr_codes表)
 * - 系统配置
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 配置');
  console.error('请确保 .env.local 文件中包含:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 创建备份目录
const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function main() {
  console.log('🚀 安全业务数据清理工具\n');
  console.log('⚠️  警告: 此操作将清理所有业务数据！');
  console.log('✅ 保留: 管理员账号、套餐配置、客服二维码\n');

  // 1. 统计清理前的数据量
  console.log('📊 清理前数据统计：\n');
  
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

  const beforeStats = {};
  for (const table of businessTables) {
    const { count, error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      beforeStats[table.name] = count || 0;
      console.log(`   ${table.desc} (${table.name}): ${count || 0} 条记录`);
    } else {
      console.log(`   ${table.desc} (${table.name}): ⚠️  无法统计 (${error.message})`);
    }
  }

  // 2. 备份数据
  console.log('\n💾 备份数据到本地...\n');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(backupDir, `business-data-backup-${timestamp}.json`);
  
  const backup = {
    timestamp: new Date().toISOString(),
    stats: beforeStats,
    data: {}
  };

  for (const table of businessTables) {
    console.log(`   备份 ${table.desc}...`);
    
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .range(from, from + pageSize - 1);

      if (error) {
        console.log(`      ⚠️  警告: ${error.message}`);
        hasMore = false;
      } else if (data && data.length > 0) {
        allData = allData.concat(data);
        from += pageSize;
        
        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    backup.data[table.name] = allData;
    console.log(`      ✅ 已备份 ${allData.length} 条记录`);
  }

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`\n✅ 备份完成: ${backupFile}\n`);

  // 3. 确认清理
  console.log('⚠️  即将清理以下数据：');
  businessTables.forEach(table => {
    const count = beforeStats[table.name] || 0;
    if (count > 0) {
      console.log(`   - ${table.desc}: ${count} 条记录`);
    }
  });
  
  console.log('\n⏳ 等待5秒后开始清理...');
  console.log('   如需取消，请按 Ctrl+C\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 4. 按照外键依赖关系的正确顺序删除数据
  console.log('🗑️  开始清理...\n');

  // 顺序：提现请求 -> 佣金记录 -> 余额 -> 订阅 -> 订单 -> 激活码 -> 消息 -> 对话 -> 用户

  console.log('1️⃣ 清理提现申请...');
  const { error: withdrawalError } = await supabase
    .from('withdrawal_requests')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (withdrawalError) {
    console.log(`   ⚠️  警告: ${withdrawalError.message}`);
  } else {
    console.log('   ✅ 提现申请已清理');
  }

  console.log('\n2️⃣ 清理佣金记录...');
  const { error: commissionError } = await supabase
    .from('commission_records')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (commissionError) {
    console.log(`   ⚠️  警告: ${commissionError.message}`);
  } else {
    console.log('   ✅ 佣金记录已清理');
  }

  console.log('\n3️⃣ 清理用户余额...');
  const { error: balanceError } = await supabase
    .from('balances')
    .delete()
    .neq('user_id', '00000000-0000-0000-0000-000000000000');
  
  if (balanceError) {
    console.log(`   ⚠️  警告: ${balanceError.message}`);
  } else {
    console.log('   ✅ 用户余额已清理');
  }

  console.log('\n4️⃣ 清理用户订阅...');
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (subscriptionError) {
    console.log(`   ⚠️  警告: ${subscriptionError.message}`);
  } else {
    console.log('   ✅ 用户订阅已清理');
  }

  console.log('\n5️⃣ 清理订单...');
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (orderError) {
    console.log(`   ⚠️  警告: ${orderError.message}`);
  } else {
    console.log('   ✅ 订单已清理');
  }

  console.log('\n6️⃣ 清理激活码...');
  const { error: activationError } = await supabase
    .from('activation_codes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (activationError) {
    console.log(`   ⚠️  警告: ${activationError.message}`);
  } else {
    console.log('   ✅ 激活码已清理');
  }

  console.log('\n7️⃣ 清理聊天消息...');
  const { error: messageError } = await supabase
    .from('messages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (messageError) {
    console.log(`   ⚠️  警告: ${messageError.message}`);
  } else {
    console.log('   ✅ 聊天消息已清理');
  }

  console.log('\n8️⃣ 清理对话...');
  const { error: conversationError } = await supabase
    .from('conversations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (conversationError) {
    console.log(`   ⚠️  警告: ${conversationError.message}`);
  } else {
    console.log('   ✅ 对话已清理');
  }

  console.log('\n9️⃣ 清理用户...');
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (userError) {
    console.log(`   ⚠️  警告: ${userError.message}`);
  } else {
    console.log('   ✅ 用户已清理');
  }

  // 5. 统计清理后的数据量
  console.log('\n📊 清理后数据统计：\n');
  
  for (const table of businessTables) {
    const { count, error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      const before = beforeStats[table.name] || 0;
      const after = count || 0;
      const cleared = before - after;
      console.log(`   ${table.desc} (${table.name}): ${after} 条记录 (清理了 ${cleared} 条)`);
    }
  }

  // 6. 验证保留的数据
  console.log('\n✅ 验证保留的系统配置：\n');
  
  const { count: adminCount } = await supabase
    .from('admins')
    .select('*', { count: 'exact', head: true });
  console.log(`   管理员账号: ${adminCount || 0} 个`);

  const { count: planCount } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true });
  console.log(`   套餐配置: ${planCount || 0} 个`);

  const { count: qrCount } = await supabase
    .from('qr_codes')
    .select('*', { count: 'exact', head: true });
  console.log(`   客服二维码: ${qrCount || 0} 个`);

  console.log('\n✅ 业务数据清理完成！');
  console.log(`📦 备份文件: ${backupFile}`);
  console.log('\n💡 提示: 如需恢复数据，请联系技术支持\n');
}

main().catch(console.error);

