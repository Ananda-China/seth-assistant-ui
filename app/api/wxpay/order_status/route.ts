import { NextRequest } from 'next/server';
import { getBillingModule } from '../../../../lib/config';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const out_trade_no = url.searchParams.get('out_trade_no') || '';
  if (!out_trade_no) return Response.json({ message: 'missing out_trade_no' }, { status: 400 });
  const billingModule = await getBillingModule();
  const order = await billingModule.getOrder(out_trade_no);
  if (!order) return Response.json({ status: 'not_found' });
  return Response.json({ status: order.status });
}


