const https = require('https');

async function testVercelAPI() {
  try {
    console.log('🔍 测试Vercel线上API...\n');
    
    // 测试管理员登录
    console.log('1. 测试管理员登录:');
    const loginData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });
    
    const loginOptions = {
      hostname: 'seth-assistant-cv963f-ananda-chinas-projects.vercel.app',
      port: 443,
      path: '/api/admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('登录响应:', loginResponse.substring(0, 200) + '...');
    
    // 提取token（如果有的话）
    let token = null;
    try {
      const loginResult = JSON.parse(loginResponse);
      if (loginResult.success) {
        console.log('✅ 登录成功');
        // 从响应头或响应体中获取token
      } else {
        console.log('❌ 登录失败:', loginResult.message);
      }
    } catch (e) {
      console.log('⚠️ 登录响应解析失败');
    }
    
    // 测试用户管理API
    console.log('\n2. 测试用户管理API:');
    const usersOptions = {
      hostname: 'seth-assistant-cv963f-ananda-chinas-projects.vercel.app',
      port: 443,
      path: '/api/admin/users?page=1&limit=10',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const usersResponse = await makeRequest(usersOptions);
    console.log('用户API响应:', usersResponse.substring(0, 500) + '...');
    
    try {
      const usersResult = JSON.parse(usersResponse);
      if (usersResult.users) {
        console.log(`✅ 获取到 ${usersResult.users.length} 个用户`);
        console.log(`✅ 分页信息: 总数 ${usersResult.pagination?.total || 0}`);
        
        // 统计付费用户
        const paidUsers = usersResult.users.filter(u => 
          u.is_paid_user || (u.subscription_type && u.subscription_type !== 'free')
        );
        console.log(`🎯 付费用户数量: ${paidUsers.length}`);
        
        // 显示前几个用户的详细信息
        console.log('\n用户详情:');
        usersResult.users.slice(0, 3).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.phone} - ${user.subscription_type} - 付费: ${user.is_paid_user ? '是' : '否'}`);
        });
      } else {
        console.log('❌ 用户数据获取失败');
      }
    } catch (e) {
      console.log('⚠️ 用户API响应解析失败:', e.message);
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve(responseData);
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

testVercelAPI();
