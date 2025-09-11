import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUsers } from '../../../../lib/config';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';
    const decoded = jwt.verify(token, secret) as any;
    const phone = decoded?.phone as string;
    if (!phone) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const usersModule = await getUsers();
    const me = await usersModule.getUser(phone);
    const invitees = me?.invite_code ? await usersModule.listInvitees(me.invite_code) : [];
    return Response.json({ me, invitees });
  } catch {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';
    const decoded = jwt.verify(token, secret) as any;
    const phone = decoded?.phone as string;
    if (!phone) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const body = await req.json().catch(()=>({}));
    const code = String(body?.inviter_code || '').trim();
    if (!code) return new Response('missing code', { status: 400 });
    const usersModule = await getUsers();
    const updated = await usersModule.setInvitedBy(phone, code);
    if (!updated) return new Response('invalid code', { status: 400 });
    const me = await usersModule.getUser(phone);
    const invitees = me?.invite_code ? await usersModule.listInvitees(me.invite_code) : [];
    return Response.json({ me, invitees });
  } catch {
    return new Response('unauthorized', { status: 401 });
  }
}


