import { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  if (!stripeSecret) {
    return Response.json({ message: 'missing stripe key' }, { status: 500 });
  }
  const { priceId } = await req.json().catch(() => ({}));
  if (!priceId) return Response.json({ message: 'missing priceId' }, { status: 400 });

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/?paid=1`,
    cancel_url: `${baseUrl}/pay?canceled=1`,
  });

  return Response.json({ url: session.url });
}


