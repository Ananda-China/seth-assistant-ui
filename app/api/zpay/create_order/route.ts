import { NextRequest } from 'next/server';
import { createZPayOrder, ZPAY_PLANS } from '../../../../lib/zpay';
import { createOrder } from '../../../../lib/billing';
import { requireUser } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (!auth) {
      return Response.json({ message: 'unauthorized' }, { status: 401 });
    }

    const { planId, payType } = await req.json().catch(() => ({}));
    
    if (!planId || !ZPAY_PLANS[planId as keyof typeof ZPAY_PLANS]) {
      return Response.json({ message: 'invalid plan' }, { status: 400 });
    }

    const plan = ZPAY_PLANS[planId as keyof typeof ZPAY_PLANS];
    const outTradeNo = `zpay_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // 创建本地订单记录
    await createOrder({
      out_trade_no: outTradeNo,
      user: auth.phone,
      plan: plan.name,
      amount_fen: plan.price,
      status: 'pending',
      created_at: Date.now(),
      plan_id: planId,
      duration_days: plan.duration
    });

    // 检查是否为模拟模式
    if (process.env.ZPAY_MOCK === '1') {
      return Response.json({
        success: true,
        data: {
          order_id: outTradeNo,
          pay_url: `/api/zpay/mock_pay?order_id=${outTradeNo}`,
          qr_code: `MOCK-ZPAY-${outTradeNo}`,
          mock: true
        }
      });
    }

    // 调用 ZPay API 创建订单
    const zPayResult = await createZPayOrder({
      amount: plan.price,
      orderId: outTradeNo,
      subject: plan.description,
      userId: auth.phone,
      payType: payType || 'alipay'
    });

    return Response.json({
      success: true,
      data: {
        order_id: outTradeNo,
        pay_url: zPayResult.pay_url,
        qr_code: zPayResult.qr_code,
        amount: plan.price,
        plan_name: plan.name
      }
    });

  } catch (error: any) {
    console.error('ZPay create order error:', error);
    return Response.json({ 
      success: false,
      message: error?.message || 'create order failed' 
    }, { status: 500 });
  }
}
