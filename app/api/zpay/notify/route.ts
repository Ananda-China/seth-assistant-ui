import { NextRequest } from 'next/server';
import { verifyZPayNotify } from '../../../../lib/zpay';
import { updateOrderStatus, getOrder } from '../../../../lib/billing';
import { upgradeUserSubscription } from '../../../../lib/users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      merchant_id,
      order_id,
      amount,
      status,
      trade_no,
      user_id,
      timestamp,
      nonce,
      sign
    } = body;

    // 验证必要参数
    if (!order_id || !sign) {
      console.error('ZPay notify: missing required parameters');
      return new Response('FAIL', { status: 400 });
    }

    // 验证签名
    const params = {
      merchant_id,
      order_id,
      amount,
      status,
      trade_no,
      user_id,
      timestamp,
      nonce
    };

    const isValidSign = verifyZPayNotify(params, sign);
    if (!isValidSign) {
      console.error('ZPay notify: invalid signature');
      return new Response('FAIL', { status: 400 });
    }

    // 获取本地订单
    const localOrder = await getOrder(order_id);
    if (!localOrder) {
      console.error('ZPay notify: order not found', order_id);
      return new Response('FAIL', { status: 404 });
    }

    // 检查订单状态
    if (localOrder.status === 'success') {
      console.log('ZPay notify: order already processed', order_id);
      return new Response('SUCCESS');
    }

    // 处理支付成功
    if (status === 'success' || status === 'paid') {
      // 更新订单状态
      await updateOrderStatus(order_id, 'success', {
        trade_no,
        paid_at: Date.now(),
        zpay_status: status
      });

      // 升级用户订阅
      const planMapping: Record<string, 'monthly' | 'quarterly' | 'yearly'> = {
        'monthly': 'monthly',
        'quarterly': 'quarterly', 
        'yearly': 'yearly'
      };

      const subscriptionType = planMapping[localOrder.plan_id || 'monthly'] || 'monthly';
      
      try {
        await upgradeUserSubscription(localOrder.user, subscriptionType);
        console.log('ZPay notify: user subscription upgraded', {
          user: localOrder.user,
          plan: subscriptionType,
          order_id
        });
      } catch (error) {
        console.error('ZPay notify: failed to upgrade user subscription', error);
        // 即使升级失败，也返回成功，避免重复回调
      }

      return new Response('SUCCESS');
    }

    // 处理支付失败
    if (status === 'failed' || status === 'cancelled') {
      await updateOrderStatus(order_id, 'failed', {
        zpay_status: status,
        failed_at: Date.now()
      });
      return new Response('SUCCESS');
    }

    // 其他状态
    console.log('ZPay notify: unhandled status', { order_id, status });
    return new Response('SUCCESS');

  } catch (error) {
    console.error('ZPay notify error:', error);
    return new Response('FAIL', { status: 500 });
  }
}
