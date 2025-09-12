#!/usr/bin/env node

/**
 * 测试生产环境管理后台API
 */

async function testProductionAPI() {
  const BASE_URL = 'https://seth-assistant-ui.vercel.app';
  
  console.log('🚀 测试生产环境管理后台API...\n');
  
  try {
    // 1. 测试管理员登录
    console.log('🔐 测试管理员登录...');
    const loginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log('登录响应状态:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('登录响应数据:', loginData);

    if (!loginData.success) {
      console.log('❌ 登录失败，无法继续测试');
      return;
    }

    // 提取cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader);
    
    let adminToken = null;
    if (setCookieHeader) {
      const adminTokenMatch = setCookieHeader.match(/admin_token=([^;]+)/);
      if (adminTokenMatch) {
        adminToken = adminTokenMatch[1];
        console.log('✅ 登录成功，获得token:', adminToken.substring(0, 20) + '...');
      }
    }

    if (!adminToken) {
      console.log('❌ 无法获取管理员token');
      return;
    }

    // 2. 测试激活码API
    console.log('\n📋 测试激活码API...');
    const codesResponse = await fetch(`${BASE_URL}/api/admin/activation-codes`, {
      method: 'GET',
      headers: {
        'Cookie': `admin_token=${adminToken}`
      }
    });

    console.log('激活码API响应状态:', codesResponse.status);
    const codesData = await codesResponse.json();
    console.log('激活码API响应数据:', JSON.stringify(codesData, null, 2));

    if (codesData.success) {
      console.log('✅ 激活码API工作正常');
      console.log(`📊 获取到 ${codesData.codes?.length || 0} 个激活码`);
      
      if (codesData.codes && codesData.codes.length > 0) {
        console.log('第一个激活码示例:', {
          id: codesData.codes[0].id,
          code: codesData.codes[0].code,
          is_used: codesData.codes[0].is_used
        });
      }
    } else {
      console.log('❌ 激活码API失败:', codesData.message);
    }

    // 3. 测试调试API（无需认证）
    console.log('\n🔍 测试调试API...');
    const debugResponse = await fetch(`${BASE_URL}/api/test/admin-data`);
    console.log('调试API响应状态:', debugResponse.status);
    const debugData = await debugResponse.json();
    console.log('调试API响应数据:', JSON.stringify(debugData, null, 2));

    console.log('\n✅ 生产环境API测试完成');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testProductionAPI();
