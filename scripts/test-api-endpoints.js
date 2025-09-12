const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testAPIEndpoints() {
  console.log('🔍 测试API端点...');
  
  const baseUrl = 'http://localhost:3002'; // 本地开发服务器
  
  try {
    // 1. 测试激活码API
    console.log('\n1️⃣ 测试激活码API...');
    const activationResponse = await fetch(`${baseUrl}/api/admin/activation-codes`);
    console.log('激活码API状态:', activationResponse.status);
    
    if (activationResponse.ok) {
      const activationData = await activationResponse.json();
      console.log('激活码API响应:', {
        success: activationData.success,
        codesCount: activationData.codes?.length || 0,
        message: activationData.message,
        firstCode: activationData.codes?.[0]
      });
    } else {
      const errorText = await activationResponse.text();
      console.log('激活码API错误:', errorText);
    }

    // 2. 测试简化版激活码API
    console.log('\n2️⃣ 测试简化版激活码API...');
    const simpleResponse = await fetch(`${baseUrl}/api/admin/activation-codes-simple`);
    console.log('简化版API状态:', simpleResponse.status);
    
    if (simpleResponse.ok) {
      const simpleData = await simpleResponse.json();
      console.log('简化版API响应:', {
        success: simpleData.success,
        codesCount: simpleData.codes?.length || 0,
        message: simpleData.message
      });
    } else {
      const errorText = await simpleResponse.text();
      console.log('简化版API错误:', errorText);
    }

    // 3. 测试新版激活码API
    console.log('\n3️⃣ 测试新版激活码API...');
    const newResponse = await fetch(`${baseUrl}/api/admin/activation-codes-new`);
    console.log('新版API状态:', newResponse.status);
    
    if (newResponse.ok) {
      const newData = await newResponse.json();
      console.log('新版API响应:', {
        success: newData.success,
        codesCount: newData.codes?.length || 0,
        message: newData.message
      });
    } else {
      const errorText = await newResponse.text();
      console.log('新版API错误:', errorText);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.log('\n💡 提示：请确保开发服务器正在运行 (npm run dev)');
  }
}

// 运行测试
testAPIEndpoints();
