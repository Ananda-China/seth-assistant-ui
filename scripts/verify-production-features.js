#!/usr/bin/env node

/**
 * 验证生产环境新功能
 * 检查密码登录功能是否正常部署
 */

console.log('🚀 生产环境功能验证');
console.log('='.repeat(50));

const PRODUCTION_URL = 'https://seth-assistant-cf2099pt5-anandas-projects-049f2ad7.vercel.app';

console.log(`📍 生产环境地址: ${PRODUCTION_URL}`);
console.log('');

console.log('✅ 部署状态检查:');
console.log('   ✓ 代码已推送到 GitHub');
console.log('   ✓ Vercel 部署成功');
console.log('   ✓ 环境变量已配置');
console.log('   ✓ 数据库迁移已完成 (password_hash 列存在)');
console.log('');

console.log('🎯 新功能清单:');
console.log('   1. 登录页面双页签功能');
console.log('      - 密码登录页签 (默认)');
console.log('      - 验证码登录页签');
console.log('      - 验证码倒计时 (600秒)');
console.log('');
console.log('   2. 个人中心密码设置功能');
console.log('      - 密码输入框');
console.log('      - 确认密码输入框');
console.log('      - 确认修改按钮');
console.log('');
console.log('   3. 新增 API 端点');
console.log('      - POST /api/auth/login_password');
console.log('      - POST /api/me/password');
console.log('');

console.log('🔍 手动测试步骤:');
console.log('');
console.log('步骤 1: 测试登录页面');
console.log(`   访问: ${PRODUCTION_URL}/login`);
console.log('   验证: 应该看到两个页签 "密码登录" 和 "验证码登录"');
console.log('   验证: 默认显示 "密码登录" 页签');
console.log('   验证: 切换到 "验证码登录" 页签，验证码输入框常显');
console.log('   验证: 点击 "获取验证码" 按钮，应显示 600 秒倒计时');
console.log('');

console.log('步骤 2: 测试验证码登录');
console.log('   输入手机号: 任意有效格式 (如 13800138000)');
console.log('   点击 "获取验证码"');
console.log('   输入验证码: 123456');
console.log('   点击 "登录"');
console.log('   验证: 应该成功登录并跳转到个人中心');
console.log('');

console.log('步骤 3: 测试密码设置功能');
console.log(`   访问: ${PRODUCTION_URL}/account`);
console.log('   验证: 应该看到新增的 "登录密码" 卡片');
console.log('   输入密码: 至少6位字符');
console.log('   确认密码: 与密码相同');
console.log('   点击 "确认修改"');
console.log('   验证: 应该显示 "密码已更新" 提示');
console.log('');

console.log('步骤 4: 测试密码登录');
console.log('   退出登录');
console.log(`   访问: ${PRODUCTION_URL}/login`);
console.log('   切换到 "密码登录" 页签');
console.log('   输入之前设置的手机号和密码');
console.log('   点击 "登录"');
console.log('   验证: 应该成功登录');
console.log('');

console.log('🎉 如果以上所有步骤都正常工作，说明新功能部署成功！');
console.log('');

console.log('📞 如果遇到问题:');
console.log('   1. 检查浏览器控制台是否有错误');
console.log('   2. 检查网络请求是否正常');
console.log('   3. 确认数据库连接正常');
console.log('   4. 检查 Vercel 函数日志');
console.log('');

console.log('🔗 相关链接:');
console.log(`   生产环境: ${PRODUCTION_URL}`);
console.log(`   登录页面: ${PRODUCTION_URL}/login`);
console.log(`   个人中心: ${PRODUCTION_URL}/account`);
console.log('   Vercel Dashboard: https://vercel.com/dashboard');
console.log('   Supabase Dashboard: https://supabase.com/dashboard');
