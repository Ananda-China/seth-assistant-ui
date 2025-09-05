import { NextRequest } from 'next/server';
import { getBillingModule, getUsers } from '../../../../lib/config';

export async function GET(req: NextRequest) {
  // 仅在开发环境或明确启用模拟模式时可用
  if (process.env.NODE_ENV === 'production' && process.env.ZPAY_MOCK !== '1') {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return new Response(`
        <html>
          <body>
            <h1>错误</h1>
            <p>缺少订单ID</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 获取订单信息
    const billingModule = await getBillingModule();
    const order = await billingModule.getOrder(orderId);
    if (!order) {
      return new Response(`
        <html>
          <body>
            <h1>错误</h1>
            <p>订单不存在: ${orderId}</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 返回模拟支付页面
    return new Response(`
      <html>
        <head>
          <title>模拟支付 - ZPay</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
            .btn:hover { background: #005a87; }
            .btn.danger { background: #dc3545; }
            .btn.danger:hover { background: #c82333; }
            .amount { font-size: 24px; color: #007cba; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>🔄 模拟支付页面</h1>
          
          <div class="card">
            <h3>订单信息</h3>
            <p><strong>订单号:</strong> ${orderId}</p>
            <p><strong>商品:</strong> ${order.plan}</p>
            <p><strong>金额:</strong> <span class="amount">¥${(order.amount_fen / 100).toFixed(2)}</span></p>
            <p><strong>用户:</strong> ${'user_phone' in order ? order.user_phone : order.user}</p>
            <p><strong>状态:</strong> ${order.status}</p>
          </div>

          <div class="card">
            <h3>模拟支付操作</h3>
            <p>这是一个模拟支付页面，仅用于开发测试。</p>
            
            <button class="btn" onclick="simulatePayment('success')">
              ✅ 模拟支付成功
            </button>
            
            <button class="btn danger" onclick="simulatePayment('failed')">
              ❌ 模拟支付失败
            </button>
          </div>

          <script>
            async function simulatePayment(result) {
              try {
                const response = await fetch('/api/zpay/mock_pay', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    order_id: '${orderId}', 
                    result: result 
                  })
                });
                
                const data = await response.json();
                
                if (data.success) {
                  alert('模拟支付' + (result === 'success' ? '成功' : '失败') + '！');
                  if (result === 'success') {
                    window.location.href = '/account?payment=success';
                  } else {
                    window.location.href = '/account?payment=failed';
                  }
                } else {
                  alert('操作失败: ' + data.message);
                }
              } catch (error) {
                alert('操作失败: ' + error.message);
              }
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Mock pay page error:', error);
    return new Response(`
      <html>
        <body>
          <h1>错误</h1>
          <p>系统错误，请稍后重试</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

export async function POST(req: NextRequest) {
  // 仅在开发环境或明确启用模拟模式时可用
  if (process.env.NODE_ENV === 'production' && process.env.ZPAY_MOCK !== '1') {
    return Response.json({ message: 'Not Found' }, { status: 404 });
  }

  try {
    const { order_id, result } = await req.json().catch(() => ({}));

    if (!order_id || !result) {
      return Response.json({ 
        success: false, 
        message: 'missing parameters' 
      }, { status: 400 });
    }

    const billingModule = await getBillingModule();
    const order = await billingModule.getOrder(order_id);
    if (!order) {
      return Response.json({ 
        success: false, 
        message: 'order not found' 
      }, { status: 404 });
    }

    if (result === 'success') {
      // 模拟支付成功
      await billingModule.updateOrderStatus(order_id, 'success', {
        trade_no: `MOCK_${Date.now()}`,
        paid_at: Date.now(),
        zpay_status: 'success'
      });

      // 升级用户订阅
      const planMapping: Record<string, 'monthly' | 'quarterly' | 'yearly'> = {
        'monthly': 'monthly',
        'quarterly': 'quarterly',
        'yearly': 'yearly'
      };

      const subscriptionType = planMapping[order.plan_id || 'monthly'] || 'monthly';
      
      try {
        const usersModule = await getUsers();
        const userPhone = 'user_phone' in order ? order.user_phone : order.user;
        await usersModule.upgradeUserSubscription(userPhone, subscriptionType);
      } catch (error) {
        console.error('Failed to upgrade user subscription:', error);
      }

      return Response.json({ 
        success: true, 
        message: 'payment simulated successfully' 
      });

    } else if (result === 'failed') {
      // 模拟支付失败
      await billingModule.updateOrderStatus(order_id, 'failed', {
        zpay_status: 'failed',
        failed_at: Date.now()
      });

      return Response.json({ 
        success: true, 
        message: 'payment failure simulated' 
      });
    }

    return Response.json({ 
      success: false, 
      message: 'invalid result' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Mock payment error:', error);
    return Response.json({ 
      success: false, 
      message: error?.message || 'simulation failed' 
    }, { status: 500 });
  }
}
