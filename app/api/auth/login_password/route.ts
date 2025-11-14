import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUsers } from '../../../../lib/config';

const JWT_SECRET = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? '');
    const password = String(body?.password ?? '');

    const okPhone = /^1[3-9]\d{9}$/.test(String(phone || ''));
    if (!okPhone) return Response.json({ success: false, message: '手机号格式不正确' }, { status: 400 });
    if (!password) return Response.json({ success: false, message: '请输入密码' }, { status: 400 });

    const usersModule = await getUsers();
    // @ts-ignore dynamic module shape
    const result = await usersModule.verifyPassword(phone, password);

    if (result === 'OK') {
      const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
        },
      });
    }

    if (result === 'NO_PASSWORD') {
      return Response.json(
        { success: false, message: '未设置密码，请使用验证码登录或在个人信息中设置密码' },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, message: '手机号或密码错误' },
      { status: 401 }
    );
  } catch (e) {
    console.error('login_password error:', e);
    return Response.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

