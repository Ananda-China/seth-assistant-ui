require('dotenv').config({ path: '.env.local' });

async function debugDifyDetailed() {
  console.log('🔍 详细诊断Dify API配置...\n');

  const DIFY_API_URL = process.env.DIFY_API_URL;
  const DIFY_API_KEY = process.env.DIFY_API_KEY;

  console.log('📋 环境变量检查:');
  console.log(`DIFY_API_URL: ${DIFY_API_URL ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`DIFY_API_KEY: ${DIFY_API_KEY ? '✅ 已设置' : '❌ 未设置'}`);

  if (!DIFY_API_URL || !DIFY_API_KEY) {
    console.log('\n❌ 缺少必要的Dify API配置');
    return;
  }

  console.log('\n📋 API配置详情:');
  console.log(`API URL: ${DIFY_API_URL}`);
  console.log(`API Key长度: ${DIFY_API_KEY.length} 字符`);
  console.log(`API Key前缀: ${DIFY_API_KEY.substring(0, 10)}...`);
  console.log(`API Key后缀: ...${DIFY_API_KEY.substring(DIFY_API_KEY.length - 4)}`);
  console.log(`API Key格式: ${DIFY_API_KEY.startsWith('app-') ? '✅ 正确格式 (app-开头)' : '❌ 可能格式错误'}`);

  // 测试不同的API端点
  const endpoints = [
    '/chat-messages',
    '/completion-messages', 
    '/audio/speech-to-text',
    '/audio/text-to-speech'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🧪 测试端点: ${endpoint}`);
    try {
      const response = await fetch(`${DIFY_API_URL.replace(/\/$/, '')}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {},
          query: "测试消息",
          response_mode: "streaming",
          user: "test_user"
        })
      });

      console.log(`  状态码: ${response.status}`);
      
      if (response.status === 401) {
        console.log('  ❌ 认证失败');
        const errorText = await response.text();
        console.log('  错误详情:', errorText);
      } else if (response.status === 200) {
        console.log('  ✅ 连接成功');
        break; // 找到一个可用的端点就停止
      } else if (response.status === 404) {
        console.log('  ⚠️ 端点不存在');
      } else {
        console.log(`  ⚠️ 意外状态码: ${response.status}`);
        const errorText = await response.text();
        console.log('  错误详情:', errorText);
      }
    } catch (error) {
      console.error(`  ❌ 连接失败:`, error.message);
    }
  }

  // 检查是否是自托管Dify
  console.log('\n🔍 检查是否是自托管Dify...');
  if (DIFY_API_URL.includes('localhost') || DIFY_API_URL.includes('127.0.0.1') || DIFY_API_URL.includes('192.168.')) {
    console.log('⚠️ 检测到可能是自托管Dify实例');
    console.log('请确认:');
    console.log('1. Dify服务是否正在运行');
    console.log('2. API Key是否从自托管实例获取');
    console.log('3. 网络连接是否正常');
  } else {
    console.log('✅ 使用官方Dify API');
  }
}

debugDifyDetailed();
