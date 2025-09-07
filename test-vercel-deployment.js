// 测试Vercel部署后的API状态
const https = require('https');

const VERCEL_URL = 'https://seth-assistant-cv9b63fcm-anandas-projects-049f2ad7.vercel.app';

async function testDeployment() {
  console.log('🔍 测试Vercel部署状态...\n');

  // 测试1: 检查网站是否可访问
  console.log('1. 测试网站可访问性...');
  try {
    const response = await fetch(VERCEL_URL);
    console.log(`   状态码: ${response.status}`);
    if (response.ok) {
      console.log('   ✅ 网站可访问');
    } else {
      console.log('   ❌ 网站不可访问');
    }
  } catch (error) {
    console.error('   ❌ 网站访问失败:', error.message);
  }

  // 测试2: 检查管理员登录API
  console.log('\n2. 测试管理员登录API...');
  try {
    const response = await fetch(`${VERCEL_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    console.log(`   状态码: ${response.status}`);
    const responseText = await response.text();
    console.log(`   响应: ${responseText.substring(0, 100)}...`);
    
    if (response.ok) {
      console.log('   ✅ 管理员登录API正常');
      
      // 获取Cookie
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log('   ✅ 获取到认证Cookie');
        
        // 测试3: 使用Cookie测试激活码API
        console.log('\n3. 测试激活码API...');
        const cookieMatch = setCookie.match(/admin_token=([^;]+)/);
        if (cookieMatch) {
          const token = cookieMatch[1];
          const activationResponse = await fetch(`${VERCEL_URL}/api/admin/activation-codes`, {
            method: 'GET',
            headers: {
              'Cookie': `admin_token=${token}`
            }
          });
          
          console.log(`   状态码: ${activationResponse.status}`);
          const activationText = await activationResponse.text();
          console.log(`   响应: ${activationText.substring(0, 200)}...`);
          
          if (activationResponse.ok) {
            console.log('   ✅ 激活码API正常');
          } else {
            console.log('   ❌ 激活码API失败');
          }
        }
      } else {
        console.log('   ❌ 未获取到认证Cookie');
      }
    } else {
      console.log('   ❌ 管理员登录API失败');
    }
    
  } catch (error) {
    console.error('   ❌ 请求失败:', error.message);
  }

  console.log('\n🏁 测试完成');
}

// 运行测试
testDeployment().catch(console.error);
