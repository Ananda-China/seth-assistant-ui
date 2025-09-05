import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSubscription, listOrdersByUser } from '../../../../lib/billing';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(token, secret) as any;
    const phone = decoded?.phone as string;
    if (!phone) return new Response('unauthorized', { status: 401 });
    const sub = await getSubscription(phone);
    const orders = await listOrdersByUser(phone);
    return Response.json({ subscription: sub || null, orders });
  } catch {
    return new Response('unauthorized', { status: 401 });
  }
}


















