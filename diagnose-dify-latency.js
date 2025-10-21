#!/usr/bin/env node

/**
 * Dify 延迟诊断工具
 * 用于检查到Dify服务器的网络延迟
 */

const https = require('https');
const http = require('http');

async function testLatency(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, { timeout: 5000 }, (res) => {
      const latency = Date.now() - startTime;
      request.destroy();
      resolve({
        name,
        url,
        status: res.statusCode,
        latency: `${latency}ms`,
        ok: res.statusCode === 200 || res.statusCode === 401,
      });
    });

    request.on('error', (error) => {
      const latency = Date.now() - startTime;
      resolve({
        name,
        url,
        error: error.message,
        latency: `${latency}ms`,
        ok: false,
      });
    });

    request.on('timeout', () => {
      request.destroy();
      const latency = Date.now() - startTime;
      resolve({
        name,
        url,
        error: 'Timeout',
        latency: `${latency}ms`,
        ok: false,
      });
    });
  });
}

async function main() {
  console.log('🔍 Dify 延迟诊断工具\n');
  console.log('测试到不同Dify服务器的网络延迟...\n');

  const tests = [
    {
      name: '官方API (api.dify.ai)',
      url: 'https://api.dify.ai/v1/status',
    },
    {
      name: '生产环境Dify (122.152.220.161:8088)',
      url: 'http://122.152.220.161:8088/v1/status',
    },
    {
      name: '本地Dify (localhost:8001)',
      url: 'http://localhost:8001/v1/status',
    },
    {
      name: '本地Dify (127.0.0.1:8001)',
      url: 'http://127.0.0.1:8001/v1/status',
    },
  ];

  // 如果有环境变量，添加自定义URL
  if (process.env.DIFY_API_URL) {
    tests.push({
      name: '环境变量中的Dify',
      url: `${process.env.DIFY_API_URL}/status`,
    });
  }

  const results = [];

  for (const test of tests) {
    console.log(`⏳ 测试 ${test.name}...`);
    const result = await testLatency(test.url, test.name);
    results.push(result);
    console.log(`   ${result.ok ? '✅' : '❌'} ${result.name}`);
    console.log(`   延迟: ${result.latency}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    } else {
      console.log(`   状态: ${result.status}`);
    }
    console.log();
  }

  // 分析结果
  console.log('📊 分析结果:\n');

  const successResults = results.filter(r => r.ok);
  const failedResults = results.filter(r => !r.ok);

  if (successResults.length > 0) {
    console.log('✅ 可用的服务器:');
    successResults.forEach(r => {
      console.log(`   ${r.name}: ${r.latency}`);
    });
    console.log();

    const fastest = successResults.reduce((a, b) => {
      const aLatency = parseInt(a.latency);
      const bLatency = parseInt(b.latency);
      return aLatency < bLatency ? a : b;
    });

    console.log(`🚀 最快的服务器: ${fastest.name} (${fastest.latency})`);
    console.log();
  }

  if (failedResults.length > 0) {
    console.log('❌ 不可用的服务器:');
    failedResults.forEach(r => {
      console.log(`   ${r.name}: ${r.error || 'Unknown error'}`);
    });
    console.log();
  }

  // 建议
  console.log('💡 建议:\n');

  if (successResults.some(r => r.name.includes('本地'))) {
    const localResult = successResults.find(r => r.name.includes('本地'));
    const officialResult = successResults.find(r => r.name.includes('官方'));

    if (officialResult) {
      const localLatency = parseInt(localResult.latency);
      const officialLatency = parseInt(officialResult.latency);
      const improvement = ((officialLatency - localLatency) / officialLatency * 100).toFixed(0);

      console.log(`1. 使用本地Dify可以减少 ${improvement}% 的延迟`);
      console.log(`   本地: ${localResult.latency} vs 官方: ${officialResult.latency}`);
    }
  } else if (successResults.some(r => r.name.includes('官方'))) {
    console.log('1. ⚠️ 本地Dify服务器不可用，当前使用官方API');
    console.log('   建议检查本地Dify服务器是否正常运行');
  }

  console.log('2. 如果延迟 > 5秒，建议:');
  console.log('   - 检查网络连接');
  console.log('   - 检查Dify服务器状态');
  console.log('   - 检查防火墙设置');
  console.log('   - 考虑使用CDN或代理');

  console.log('\n3. 优化建议:');
  console.log('   - 更新 .env.local 中的 DIFY_API_URL');
  console.log('   - 添加重试机制');
  console.log('   - 添加连接超时');
  console.log('   - 启用性能监控');
}

main().catch(console.error);

