import { NextRequest } from 'next/server';
import { createNativeOrder, loadWxConfig } from '../../../../lib/wxpay';
import { createOrder } from '../../../../lib/billing';
import { requireUser } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (!auth) return Response.json({ message: 'unauthorized' }, { status: 401 });
    const { amountFen, description, outTradeNo, plan } = await req.json().catch(() => ({}));
    if (!amountFen || !description || !outTradeNo) {
      return Response.json({ message: 'invalid params' }, { status: 400 });
    }
    // 如果未配置微信商户关键参数，走本地模拟下单流程
    const cfg = loadWxConfig();
    const missingKeys = !cfg.mchid || !cfg.mchSerialNo || !cfg.privateKey || !cfg.apiV3Key || !cfg.appid;
    await createOrder({ out_trade_no: String(outTradeNo), user: auth.phone, plan: plan || description, amount_fen: Number(amountFen), status: 'pending', created_at: Date.now() });
    if (missingKeys || process.env.WECHAT_MOCK === '1') {
      return Response.json({ code_url: `MOCK-${outTradeNo}`, mock: true });
    }
    const data = await createNativeOrder(Number(amountFen), String(description), String(outTradeNo));
    return Response.json({ code_url: data.code_url });
  } catch (e: any) {
    return Response.json({ message: e?.message || 'wxpay error' }, { status: 500 });
  }
}


