import { NextRequest } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { getOrder, updateOrderStatus, upsertSubscription } from '../../../../lib/billing';

// 开发环境下的模拟支付成功接口：
// POST body: { outTradeNo: string }
export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (!auth) return Response.json({ message: 'unauthorized' }, { status: 401 });

  const { outTradeNo } = await req.json().catch(() => ({ outTradeNo: '' }));
  const order = outTradeNo ? await getOrder(String(outTradeNo)) : undefined;
  if (!order) return Response.json({ message: 'order not found' }, { status: 404 });
  if (order.user !== auth.phone) return Response.json({ message: 'forbidden' }, { status: 403 });

  await updateOrderStatus(order.out_trade_no, 'success');
  await upsertSubscription(order.user, order.plan);

  return Response.json({ success: true });
}















