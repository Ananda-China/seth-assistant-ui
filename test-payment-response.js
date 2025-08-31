// 测试支付管理API响应格式
const fetch = require('node-fetch');

async function testPaymentResponse() {
  console.log('🔍 测试支付管理API响应格式...\n');

  try {
    // 注意：这里需要管理员认证，所以会返回401
    // 但我们可以检查响应头和其他信息
    const response = await fetch('http://localhost:3000/api/admin/payment-supabase');
    
    console.log('📊 响应状态:', response.status);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('✅ 正常：API需要管理员认证');
      console.log('💡 这说明API端点可以访问，只是需要正确的认证');
    } else if (response.status === 200) {
      const data = await response.json();
      console.log('📄 响应数据:', JSON.stringify(data, null, 2));
      
      // 检查统计数据格式
      if (data.stats) {
        console.log('\n📈 统计数据格式检查:');
        console.log('total_orders:', typeof data.stats.total_orders, data.stats.total_orders);
        console.log('total_revenue:', typeof data.stats.total_revenue, data.stats.total_revenue);
        console.log('pending_amount:', typeof data.stats.pending_amount, data.stats.pending_amount);
        console.log('refunded_amount:', typeof data.stats.refunded_amount, data.stats.refunded_amount);
        console.log('success_rate:', typeof data.stats.success_rate, data.stats.success_rate);
        console.log('avg_order_value:', typeof data.stats.avg_order_value, data.stats.avg_order_value);
      }
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

// 运行测试
testPaymentResponse();
