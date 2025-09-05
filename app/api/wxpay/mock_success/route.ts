import { NextRequest } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { getBillingModule } from '../../../../lib/config';

// 开发环境下的模拟支付成功接口：
// POST body: { outTradeNo: string }
export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (!auth) return Response.json({ message: 'unauthorized' }, { status: 401 });

  const { outTradeNo } = await req.json().catch(() => ({ outTradeNo: '' }));
  const billingModule = await getBillingModule();
  const order = outTradeNo ? await billingModule.getOrder(String(outTradeNo)) : undefined;
  if (!order) return Response.json({ message: 'order not found' }, { status: 404 });
  
  // 处理不同的Order类型（本地vs Supabase）
  const userPhone = 'user_phone' in order ? order.user_phone : order.user;
  if (userPhone !== auth.phone) return Response.json({ message: 'forbidden' }, { status: 403 });

  await billingModule.updateOrderStatus(order.out_trade_no, 'success');
  await billingModule.upsertSubscription(userPhone, order.plan);

  return Response.json({ success: true });
}


















