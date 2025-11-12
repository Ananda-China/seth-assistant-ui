/**
 * 礼物页面个性化信息更新脚本
 * 
 * 使用方法:
 * node scripts/update-gift-page.js --friend "朋友真实姓名" --sender "Tiffany" --code "RFRSKPRL"
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const params = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  params[key] = value;
}

// 默认值
const friendName = params.friend || '多年好友';
const senderName = params.sender || 'Tiffany';
const activationCode = params.code || 'RFRSKPRL';
const year = params.year || '2025';

console.log('\n🎁 礼物页面个性化信息更新工具\n');
console.log('📝 当前配置:');
console.log(`   朋友姓名: ${friendName}`);
console.log(`   赠送者: ${senderName}`);
console.log(`   激活码: ${activationCode}`);
console.log(`   年份: ${year}`);
console.log('');

// 读取页面文件
const pagePath = path.join(__dirname, '..', 'app', 'gift', 'page.tsx');

try {
  let content = fs.readFileSync(pagePath, 'utf8');
  
  // 替换朋友姓名（主标题）
  content = content.replace(
    /<span className="friend-name">.*?<\/span>/,
    `<span className="friend-name">${friendName}</span>`
  );
  
  // 替换朋友姓名（页脚）
  content = content.replace(
    /<span className="footer-friend">.*?<\/span>/,
    `<span className="footer-friend">${friendName}</span>`
  );
  
  // 替换激活码（复制功能）
  content = content.replace(
    /await navigator\.clipboard\.writeText\('.*?'\);/,
    `await navigator.clipboard.writeText('${activationCode}');`
  );
  
  // 替换激活码（显示）
  content = content.replace(
    /<span className="code-value">.*?<\/span>/,
    `<span className="code-value">${activationCode}</span>`
  );
  
  // 替换赠送者和年份
  content = content.replace(
    /© .*? \d{4} \|/,
    `© ${senderName} ${year} |`
  );
  
  // 写回文件
  fs.writeFileSync(pagePath, content, 'utf8');
  
  console.log('✅ 更新成功！\n');
  console.log('📋 下一步操作:');
  console.log('   1. 检查更新内容: git diff app/gift/page.tsx');
  console.log('   2. 提交更改: git add app/gift/page.tsx');
  console.log('   3. 提交: git commit -m "更新礼物页面个性化信息"');
  console.log('   4. 推送: git push');
  console.log('');
  
} catch (error) {
  console.error('❌ 更新失败:', error.message);
  process.exit(1);
}

