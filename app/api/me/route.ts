import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUsers } from '../../../lib/config';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(token, secret) as any;
    if (!decoded || !decoded.phone) return new Response('unauthorized', { status: 401 });
    // 支持 GET /api/me?nickname=newname 来更新昵称
    const url = new URL(req.url);
    const newNick = url.searchParams.get('nickname');
    const usersModule = await getUsers();
    if (newNick !== null) {
      await usersModule.updateUserNickname(decoded.phone, newNick);
    }
    const user = await usersModule.getUser(decoded.phone);
    return Response.json({ phone: String(decoded.phone), nickname: user?.nickname || '' });
  } catch {
    return new Response('unauthorized', { status: 401 });
  }
}


