// 测试生产环境的二维码API
async function testAPI() {
  const baseUrl = 'https://seth-assistant-ui.vercel.app';
  
  console.log('\n🧪 测试生产环境二维码API...\n');
  console.log('URL:', baseUrl + '/api/qr-codes');
  console.log('');

  try {
    const response = await fetch(baseUrl + '/api/qr-codes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('');

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API响应成功！');
      console.log('📊 返回数据:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('❌ API响应失败');
      console.log('响应内容:', text);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }

  console.log('\n');
}

testAPI().catch(console.error);

