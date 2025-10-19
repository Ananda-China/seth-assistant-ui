/**
 * 备份业务数据脚本
 * 
 * 功能：在清理数据前备份所有业务数据到JSON文件
 * 
 * 备份的表：
 * - users（用户）
 * - conversations（对话）
 * - messages（消息）
 * - orders（订单）
 * - subscriptions（订阅）
 * - activation_codes（激活码）
 * - balances（余额）
 * - commission_records（佣金记录）
 * - withdrawal_requests（提现请求）
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function backupBusinessData() {
  console.log('\n💾 ===== 数据备份脚本 ===== 💾\n');
  console.log('📋 开始备份业务数据...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupDir = path.join(__dirname, '..', 'backups');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  // 创建备份目录
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {}
  };

  try {
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

    for (const table of tables) {
      console.log(`📦 备份 ${table}...`);
      
      let allData = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .range(from, from + pageSize - 1);

        if (error) {
          console.log(`   ⚠️  警告: ${error.message}`);
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

      backup.data[table] = allData;
      console.log(`   ✅ 已备份 ${allData.length} 条记录`);
    }

    // 写入备份文件
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');

    console.log('\n✅ 备份完成！\n');
    console.log(`📁 备份文件: ${backupFile}`);
    console.log(`📊 备份统计:`);
    
    let totalRecords = 0;
    for (const [table, data] of Object.entries(backup.data)) {
      console.log(`   ${table}: ${data.length} 条记录`);
      totalRecords += data.length;
    }
    
    console.log(`\n📝 总计: ${totalRecords} 条记录`);
    
    const fileSizeMB = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);
    console.log(`💾 文件大小: ${fileSizeMB} MB\n`);

  } catch (error) {
    console.error('\n❌ 备份过程中出现错误:', error);
    console.log('\n⚠️  请检查错误信息并重试\n');
  }
}

// 执行备份
backupBusinessData();

