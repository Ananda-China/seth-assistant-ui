import { NextRequest } from 'next/server';
import { loadWxConfig, decryptNotifyResource } from '../../../../lib/wxpay';
import { updateOrderStatus, getOrder, upsertSubscription } from '../../../../lib/billing';

export async function POST(req: NextRequest) {
  const cfg = loadWxConfig();
  const payload = await req.json().catch(() => ({}));
  try {
    const resource = payload?.resource;
    const { associated_data, nonce, ciphertext } = resource || {};
    const obj = decryptNotifyResource(cfg.apiV3Key, associated_data, nonce, ciphertext);
    // obj 示例：{ out_trade_no, trade_state, ... }
    if (obj?.trade_state === 'SUCCESS') {
      await updateOrderStatus(obj.out_trade_no, 'success');
      const order = await getOrder(obj.out_trade_no);
      if (order) {
        await upsertSubscription(order.user, order.plan);
      }
    } else {
      await updateOrderStatus(obj.out_trade_no, 'failed');
    }
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ message: e?.message || 'bad notify' }, { status: 400 });
  }
}


