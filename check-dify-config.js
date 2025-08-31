require('dotenv').config({ path: '.env.local' });

async function checkDifyConfig() {
  console.log('🔍 检查Dify API配置...\n');

  const DIFY_API_URL = process.env.DIFY_API_URL;
  const DIFY_API_KEY = process.env.DIFY_API_KEY;

  console.log('📋 环境变量检查:');
  console.log(`DIFY_API_URL: ${DIFY_API_URL ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`DIFY_API_KEY: ${DIFY_API_KEY ? '✅ 已设置' : '❌ 未设置'}`);

  if (!DIFY_API_URL || !DIFY_API_KEY) {
    console.log('\n❌ 缺少必要的Dify API配置');
    console.log('请在.env.local文件中设置:');
    console.log('DIFY_API_URL=https://api.dify.ai/v1');
    console.log('DIFY_API_KEY=your_api_key_here');
    return;
  }

  console.log('\n📋 API配置详情:');
  console.log(`API URL: ${DIFY_API_URL}`);
  console.log(`API Key: ${DIFY_API_KEY.substring(0, 10)}...${DIFY_API_KEY.substring(DIFY_API_KEY.length - 4)}`);

  // 测试API连接
  console.log('\n🧪 测试Dify API连接...');
  try {
    const response = await fetch(`${DIFY_API_URL.replace(/\/$/, '')}/chat-messages`, {
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

    console.log(`状态码: ${response.status}`);
    
    if (response.status === 401) {
      console.log('❌ API认证失败 - 请检查API Key是否正确');
    } else if (response.status === 200) {
      console.log('✅ API连接成功');
    } else {
      console.log(`⚠️ 意外状态码: ${response.status}`);
      const errorText = await response.text();
      console.log('错误详情:', errorText);
    }
  } catch (error) {
    console.error('❌ API连接失败:', error.message);
  }
}

checkDifyConfig();
