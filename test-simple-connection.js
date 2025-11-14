// 简单连接测试
const http = require('http');

function testConnection() {
  console.log('🧪 测试服务器连接...\n');

  // 测试主页
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log('✅ 连接成功！');
    console.log('状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('响应长度:', data.length);
      console.log('响应开头:', data.substring(0, 200));
    });
  });

  req.on('error', (err) => {
    console.error('❌ 连接失败:', err.message);
    console.error('错误代码:', err.code);
  });

  req.on('timeout', () => {
    console.error('❌ 连接超时');
    req.destroy();
  });

  req.end();
}

testConnection();
