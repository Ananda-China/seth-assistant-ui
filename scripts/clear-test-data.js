/**
 * 清除测试环境数据脚本
 * 用于清除本地测试环境的用户注册信息，以便重新测试奖励规则
 */

const fs = require('fs');
const path = require('path');

// 清除本地JSON文件数据
function clearLocalData() {
  const dataFiles = [
    'data/users.json',
    'data/conversations.json', 
    'data/messages.json',
    'data/activation_codes.json',
    'data/commission_records.json'
  ];

  dataFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        // 备份原文件
        const backupPath = filePath + '.backup.' + Date.now();
        fs.copyFileSync(filePath, backupPath);
        console.log(`✅ 已备份 ${file} 到 ${path.basename(backupPath)}`);
        
        // 清空文件内容，保留空数组结构
        fs.writeFileSync(filePath, '[]', 'utf8');
        console.log(`🗑️  已清空 ${file}`);
      } catch (error) {
        console.error(`❌ 清空 ${file} 失败:`, error.message);
      }
    } else {
      console.log(`⚠️  文件不存在: ${file}`);
    }
  });
}

// 生成Supabase清理SQL
function generateSupabaseClearSQL() {
  const sql = `
-- 清除测试环境数据 (请在Supabase控制台执行)
-- 注意：这将删除所有用户数据，请确保这是测试环境！

-- 清除用户相关数据
DELETE FROM commission_records;
DELETE FROM activation_codes WHERE used_by IS NOT NULL;
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM users;

-- 重置序列（如果有的话）
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- 验证清理结果
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations  
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'activation_codes (used)', COUNT(*) FROM activation_codes WHERE used_by IS NOT NULL
UNION ALL
SELECT 'commission_records', COUNT(*) FROM commission_records;
`;

  const sqlFile = path.join(process.cwd(), 'scripts', 'clear-supabase-data.sql');
  fs.writeFileSync(sqlFile, sql.trim(), 'utf8');
  console.log(`📝 已生成Supabase清理SQL: ${sqlFile}`);
}

// 主函数
function main() {
  console.log('🧹 开始清除测试环境数据...\n');
  
  // 确保scripts目录存在
  const scriptsDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  // 清除本地数据
  console.log('1. 清除本地JSON文件数据:');
  clearLocalData();
  
  console.log('\n2. 生成Supabase清理SQL:');
  generateSupabaseClearSQL();
  
  console.log('\n✅ 数据清理完成！');
  console.log('\n📋 后续步骤:');
  console.log('1. 如果使用Supabase，请在Supabase控制台执行 scripts/clear-supabase-data.sql');
  console.log('2. 重启开发服务器: npm run dev');
  console.log('3. 清除浏览器localStorage和cookies');
  console.log('4. 重新注册用户进行测试');
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { clearLocalData, generateSupabaseClearSQL };
