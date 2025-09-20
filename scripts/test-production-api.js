#!/usr/bin/env node

/**
 * 测试生产环境 API 功能
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 生产环境 URL
const PRODUCTION_URL = 'https://seth-assistant-cf2099pt5-anandas-projects-049f2ad7.vercel.app';

async function testAPI(endpoint, options = {}) {
  const url = `${PRODUCTION_URL}${endpoint}`;
  console.log(`🔍 测试: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const status = response.status;
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    console.log(`   状态: ${status}`);
    console.log(`   响应: ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`);
    console.log('');
    
    return { status, data, success: status < 400 };
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    console.log('');
    return { error: error.message, success: false };
  }
}

async function main() {
  console.log(`🚀 测试生产环境 API: ${PRODUCTION_URL}\n`);

  // 测试基本页面
  console.log('📄 测试页面访问...');
  await testAPI('/');
  await testAPI('/login');
  await testAPI('/account');

  // 测试 API 端点
  console.log('🔌 测试 API 端点...');
  
  // 测试发送验证码
  await testAPI('/api/auth/send-code', {
    method: 'POST',
    body: { phone: '13800138000' }
  });

  // 测试密码登录 API
  await testAPI('/api/auth/login_password', {
    method: 'POST',
    body: { phone: '13800138000', password: 'test123' }
  });

  // 测试用户信息 API（无认证）
  await testAPI('/api/me');

  console.log('✅ 生产环境 API 测试完成！');
}

main().catch(console.error);
