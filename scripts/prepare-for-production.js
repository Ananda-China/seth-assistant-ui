/**
 * 生产环境准备脚本
 * 
 * 功能：按照正确的顺序执行数据清理流程
 * 
 * 步骤：
 * 1. 备份当前业务数据
 * 2. 清理业务数据
 * 3. 验证系统配置
 */

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function runScript(scriptPath, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log('='.repeat(60));

  try {
    // 使用绝对路径
    const absolutePath = path.resolve(__dirname, scriptPath);
    execSync(`node "${absolutePath}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\n❌ ${description}失败`);
    return false;
  }
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          🚀 生产环境数据清理准备工具 🚀                    ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('📋 本工具将执行以下操作：\n');
  console.log('   1️⃣  备份当前所有业务数据到 backups/ 目录');
  console.log('   2️⃣  清理所有业务数据（用户、聊天、订单等）');
  console.log('   3️⃣  验证系统配置（管理员、套餐、二维码）');
  console.log('\n');
  console.log('⚠️  注意事项：\n');
  console.log('   • 清理操作不可逆，请确保已做好准备');
  console.log('   • 管理员账号和客服二维码将被保留');
  console.log('   • 建议在非高峰时段执行此操作');
  console.log('\n');

  const confirm = await question('❓ 确认要开始准备生产环境吗？(输入 YES 继续): ');
  
  if (confirm.trim() !== 'YES') {
    console.log('\n❌ 操作已取消\n');
    rl.close();
    return;
  }

  console.log('\n✅ 开始准备流程...\n');

  // 步骤1：备份数据
  const backupSuccess = runScript(
    'backup-business-data.js',
    '步骤 1/3: 备份业务数据'
  );

  if (!backupSuccess) {
    console.log('\n⚠️  备份失败，是否继续？');
    const continueWithoutBackup = await question('❓ 输入 CONTINUE 继续（不推荐），或按回车取消: ');

    if (continueWithoutBackup.trim() !== 'CONTINUE') {
      console.log('\n❌ 操作已取消\n');
      rl.close();
      return;
    }
  }

  // 步骤2：清理数据
  console.log('\n⏸️  准备清理数据，请按回车继续...');
  await question('');

  const clearSuccess = runScript(
    'clear-business-data.js',
    '步骤 2/3: 清理业务数据'
  );

  if (!clearSuccess) {
    console.log('\n❌ 清理失败，流程终止\n');
    rl.close();
    return;
  }

  // 步骤3：验证配置
  const verifySuccess = runScript(
    'verify-system-config.js',
    '步骤 3/3: 验证系统配置'
  );

  // 总结
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║                    🎉 准备完成！ 🎉                         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  if (backupSuccess && clearSuccess && verifySuccess) {
    console.log('✅ 所有步骤执行成功！\n');
    console.log('📝 下一步操作：\n');
    console.log('   1. 检查 backups/ 目录中的备份文件');
    console.log('   2. 在管理后台确认客服二维码显示正常');
    console.log('   3. 测试新用户注册和15次免费聊天');
    console.log('   4. 测试邀请奖励功能（一级30%，二级10%）');
    console.log('\n🚀 系统已准备好上线！\n');
  } else {
    console.log('⚠️  部分步骤执行失败，请检查上述错误信息\n');
  }

  rl.close();
}

main();

