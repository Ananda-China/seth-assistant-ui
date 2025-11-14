#!/usr/bin/env node

/**
 * 测试本地管理后台API
 */

// 使用Node.js内置的fetch (Node.js 18+)

const BASE_URL = 'https://seth-assistant-ui.vercel.app';

async function testAdminLogin() {
  console.log('🔐 测试管理员登录...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const data = await response.json();
    console.log('登录响应:', data);

    if (data.success) {
      // 提取cookie
      const setCookieHeader = response.headers.get('set-cookie');
      console.log('Set-Cookie header:', setCookieHeader);
      
      if (setCookieHeader) {
        const adminTokenMatch = setCookieHeader.match(/admin_token=([^;]+)/);
        if (adminTokenMatch) {
          const adminToken = adminTokenMatch[1];
          console.log('✅ 登录成功，获得token:', adminToken.substring(0, 20) + '...');
          return adminToken;
        }
      }
    }
    
    console.log('❌ 登录失败');
    return null;
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return null;
  }
}

async function testActivationCodesAPI(adminToken) {
  console.log('\n📋 测试激活码API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/activation-codes`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${adminToken}`
      }
    });

    console.log('激活码API响应状态:', response.status);
    const data = await response.json();
    console.log('激活码API响应数据:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ 激活码API工作正常');
      console.log(`📊 获取到 ${data.codes?.length || 0} 个激活码`);
    } else {
      console.log('❌ 激活码API失败:', data.message);
    }
  } catch (error) {
    console.error('❌ 激活码API请求失败:', error.message);
  }
}

async function testDebugAPI() {
  console.log('\n🔍 测试调试API（无需认证）...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test/admin-data`);
    console.log('调试API响应状态:', response.status);
    const data = await response.json();
    console.log('调试API响应数据:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ 调试API请求失败:', error.message);
  }
}

async function checkServerStatus() {
  console.log('🌐 检查本地服务器状态...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test`);
    if (response.ok) {
      console.log('✅ 本地服务器运行正常');
      return true;
    } else {
      console.log('❌ 本地服务器响应异常:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 无法连接到本地服务器:', error.message);
    console.log('💡 请确保运行了 npm run dev');
    return false;
  }
}

async function main() {
  console.log('🚀 开始测试本地管理后台API...\n');
  
  // 1. 检查服务器状态
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('\n❌ 测试终止：本地服务器未运行');
    return;
  }
  
  // 2. 测试调试API
  await testDebugAPI();
  
  // 3. 测试管理员登录
  const adminToken = await testAdminLogin();
  if (!adminToken) {
    console.log('\n❌ 测试终止：无法获取管理员token');
    return;
  }
  
  // 4. 测试激活码API
  await testActivationCodesAPI(adminToken);
  
  console.log('\n✅ 本地测试完成');
}

// 运行测试
main().catch(console.error);
