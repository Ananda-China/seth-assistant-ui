import { NextRequest } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { getUsers } from '../../../../lib/config';

export async function POST(req: NextRequest) {
  const me = requireUser(req);
  if (!me) return Response.json({ success: false, message: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const password = String(body?.password ?? '');

    if (!password || password.length < 6) {
      return Response.json({ success: false, message: '密码长度不能少于6位' }, { status: 400 });
    }

    const usersModule = await getUsers();
    // @ts-ignore dynamic module shape
    const ok: boolean = await usersModule.setPassword(me.phone, password);

    if (ok) return Response.json({ success: true, message: '密码已更新' });
    return Response.json({ success: false, message: '更新失败' }, { status: 500 });
  } catch (e) {
    console.error('/api/me/password error:', e);
    return Response.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

