import { NextRequest } from 'next/server';
import { loadWxConfig, decryptNotifyResource } from '../../../../lib/wxpay';
import { getBillingModule } from '../../../../lib/config';

export async function POST(req: NextRequest) {
  const cfg = loadWxConfig();
  const payload = await req.json().catch(() => ({}));
  try {
    const resource = payload?.resource;
    const { associated_data, nonce, ciphertext } = resource || {};
    const obj = decryptNotifyResource(cfg.apiV3Key, associated_data, nonce, ciphertext);
    // obj 示例：{ out_trade_no, trade_state, ... }
    const billingModule = await getBillingModule();
    if (obj?.trade_state === 'SUCCESS') {
      await billingModule.updateOrderStatus(obj.out_trade_no, 'success');
      const order = await billingModule.getOrder(obj.out_trade_no);
      if (order) {
        const userPhone = 'user_phone' in order ? order.user_phone : order.user;
        await billingModule.upsertSubscription(userPhone, order.plan);
      }
    } else {
      await billingModule.updateOrderStatus(obj.out_trade_no, 'failed');
    }
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ message: e?.message || 'bad notify' }, { status: 400 });
  }
}


