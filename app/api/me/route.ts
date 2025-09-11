import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUsers } from '../../../lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1) 解析并校验 JWT（失败只返回401）
  try {
    const cookie = req.headers.get('cookie') || '';
    console.log('🔍 /api/me 调试信息:', {
      hasCookie: !!cookie,
      cookieLength: cookie.length,
      cookiePreview: cookie.substring(0, 100) + (cookie.length > 100 ? '...' : '')
    });

    const match = /(?:^|\s*)sid=([^;]+)/.exec(cookie) || /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    console.log('🔍 Token信息:', {
      hasToken: !!token,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + (token.length > 50 ? '...' : '')
    });

    const secret = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';
    console.log('🔍 JWT Secret信息:', {
      hasSecret: !!secret,
      secretLength: secret.length,
      secretPreview: secret.substring(0, 10) + '...'
    });

    const decoded = jwt.verify(token, secret) as any;
    console.log('🔍 JWT解码结果:', {
      hasDecoded: !!decoded,
      hasPhone: !!(decoded && decoded.phone),
      phone: decoded?.phone
    });

    if (!decoded || !decoded.phone) {
      console.log('❌ JWT验证失败: 缺少decoded或phone');
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    // 2) 用户信息读写失败时，不再返回401，至少返回已验证的手机号
    try {
      const url = new URL(req.url);
      const newNick = url.searchParams.get('nickname');
      const usersModule = await getUsers();
      if (newNick !== null) {
        await usersModule.updateUserNickname(decoded.phone, newNick);
      }
      const user = await usersModule.getUser(decoded.phone);
      return Response.json({ phone: String(decoded.phone), nickname: user?.nickname || '' });
    } catch (err) {
      console.error('⚠️ 用户资料读取/写入失败，降级仅返回手机号:', err);
      return Response.json({ phone: String((decoded as any).phone), nickname: '' });
    }
  } catch (err) {
    console.error('❌ /api/me 认证失败:', err);
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
}


