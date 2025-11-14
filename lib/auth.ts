import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export type AuthedUser = { phone: string };

export function requireUser(req: NextRequest): AuthedUser | null {
  try {
    const cookie = req.headers.get('cookie') || '';
    console.log('🍪 收到的Cookie:', cookie.substring(0, 100) + '...');

    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';

    console.log('🔍 Token信息:', {
      hasCookie: !!cookie,
      hasMatch: !!match,
      hasToken: !!token,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...'
    });

    if (!token) {
      console.error('❌ 缺少或无效的token:', { hasToken: false, tokenLength: 0 });
      return null;
    }

    const secret = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';
    const decoded = jwt.verify(token, secret) as any;

    console.log('✅ Token验证成功:', { phone: decoded.phone });

    if (!decoded || typeof decoded.phone !== 'string') return null;
    return { phone: decoded.phone };
  } catch (error) {
    console.error('❌ Token验证失败:', error instanceof Error ? error.message : error);
    return null;
  }
}


