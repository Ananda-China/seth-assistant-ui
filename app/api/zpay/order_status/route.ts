import { NextRequest } from 'next/server';
import { queryZPayOrder } from '../../../../lib/zpay';
import { getBillingModule, getUsers } from '../../../../lib/config';
import { requireUser } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (!auth) {
      return Response.json({ message: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return Response.json({ message: 'missing order_id' }, { status: 400 });
    }

    // 获取订单
    const billingModule = await getBillingModule();
    const localOrder = await billingModule.getOrder(orderId);
    if (!localOrder) {
      return Response.json({ message: 'order not found' }, { status: 404 });
    }

    // 检查订单是否属于当前用户
    const userPhone = 'user_phone' in localOrder ? localOrder.user_phone : localOrder.user;
    if (userPhone !== auth.phone) {
      return Response.json({ message: 'access denied' }, { status: 403 });
    }

    // 如果订单已经成功，直接返回
    if (localOrder.status === 'success') {
      return Response.json({
        success: true,
        data: {
          order_id: orderId,
          status: 'success',
          amount: localOrder.amount_fen,
          plan: localOrder.plan,
          paid_at: localOrder.paid_at
        }
      });
    }

    // 如果是模拟模式，返回模拟状态
    if (process.env.ZPAY_MOCK === '1') {
      return Response.json({
        success: true,
        data: {
          order_id: orderId,
          status: localOrder.status,
          amount: localOrder.amount_fen,
          plan: localOrder.plan,
          mock: true
        }
      });
    }

    // 查询 ZPay 订单状态
    try {
      const zPayResult = await queryZPayOrder(orderId);
      
      // 如果 ZPay 显示支付成功，但本地订单还未更新
      if ((zPayResult.status === 'success' || zPayResult.status === 'paid') && 
          localOrder.status === 'pending') {
        
        // 更新订单状态
        await billingModule.updateOrderStatus(orderId, 'success', {
          trade_no: zPayResult.trade_no,
          paid_at: Date.now(),
          zpay_status: zPayResult.status
        });

        // 升级用户订阅
        const planMapping: Record<string, 'monthly' | 'quarterly' | 'yearly'> = {
          'monthly': 'monthly',
          'quarterly': 'quarterly',
          'yearly': 'yearly'
        };

        const subscriptionType = planMapping[localOrder.plan_id || 'monthly'] || 'monthly';
        
        try {
          const usersModule = await getUsers();
          await usersModule.upgradeUserSubscription(userPhone, subscriptionType);
        } catch (error) {
          console.error('Failed to upgrade user subscription:', error);
        }

        return Response.json({
          success: true,
          data: {
            order_id: orderId,
            status: 'success',
            amount: localOrder.amount_fen,
            plan: localOrder.plan,
            paid_at: Date.now()
          }
        });
      }

      return Response.json({
        success: true,
        data: {
          order_id: orderId,
          status: zPayResult.status,
          amount: localOrder.amount_fen,
          plan: localOrder.plan,
          zpay_trade_no: zPayResult.trade_no
        }
      });

    } catch (error) {
      console.error('Query ZPay order error:', error);
      
      // 如果查询失败，返回本地订单状态
      return Response.json({
        success: true,
        data: {
          order_id: orderId,
          status: localOrder.status,
          amount: localOrder.amount_fen,
          plan: localOrder.plan,
          error: 'failed to query zpay status'
        }
      });
    }

  } catch (error: any) {
    console.error('Order status query error:', error);
    return Response.json({ 
      success: false,
      message: error?.message || 'query failed' 
    }, { status: 500 });
  }
}
