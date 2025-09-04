import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { consumeOtp } from '../../../../lib/otpStore';
import { getUsers } from '../../../../lib/config';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const INVITE_CODE = process.env.INVITE_CODE || '';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone ?? '');
  const code = String(body?.code ?? '');
  const invite = String(body?.invite ?? '');
  // 兼容可能出现的空格/全角数字
  const normalizedCode = code.replace(/\s+/g, '').replace(/[\uFF10-\uFF19]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 48));
  const okPhone = /^1[3-9]\d{9}$/.test(String(phone || ''));
  if (!okPhone) return Response.json({ success: false, message: 'invalid phone' }, { status: 400 });

  // 如果配置了邀请码，则必须输入正确的邀请码
  if (INVITE_CODE && INVITE_CODE.trim() !== '' && invite !== INVITE_CODE) {
    return Response.json({ success: false, message: 'invalid invite' }, { status: 403 });
  }

  const verified = consumeOtp(phone, normalizedCode);
  if (!verified) return Response.json({ success: false, message: 'invalid code' }, { status: 400 });

  const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });
  try {
    const usersModule = await getUsers();
    await usersModule.getOrCreateUser(phone);
  } catch {}
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
    },
  });
}


