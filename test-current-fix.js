// 测试当前部署的修复
console.log('🔍 测试当前激活码系统...');

// 模拟激活码激活过程
async function testActivation() {
  try {
    // 模拟用户登录后的请求
    const response = await fetch('/api/activation/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'sid=test_token' // 这里需要真实的JWT token
      },
      body: JSON.stringify({
        code: '9USRDANO'
      })
    });
    
    const result = await response.json();
    console.log('激活结果:', result);
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 在浏览器控制台中运行
console.log('请在浏览器控制台中运行: testActivation()');
