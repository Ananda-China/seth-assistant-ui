const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'AdminPass123!';
  const saltRounds = 12;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('默认管理员密码:', password);
    console.log('bcrypt哈希值:', hash);
    console.log('\n请将此哈希值更新到数据库迁移文件中');
    
    // 验证哈希是否正确
    const isValid = await bcrypt.compare(password, hash);
    console.log('哈希验证:', isValid ? '✅ 成功' : '❌ 失败');
  } catch (error) {
    console.error('生成哈希失败:', error);
  }
}

generateHash();
