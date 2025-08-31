import { NextRequest } from 'next/server';
import { setOtp } from '../../../../lib/otpStore';
import { sendSmsTencent } from '../../../../lib/sms';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone ?? '');
  const ok = /^1[3-9]\d{9}$/.test(String(phone || ''));
  if (!ok) return Response.json({ success: false, message: 'invalid phone' }, { status: 400 });

  const code = generateCode();
  setOtp(phone, code); // 5分钟

  try {
    if (process.env.NODE_ENV === 'development') {
      // 开发环境仅本地显示调试码，真实发送可选
      try { await sendSmsTencent({ phone, code }); } catch {}
      return Response.json({ success: true, debug_code: code });
    }
    await sendSmsTencent({ phone, code });
    return Response.json({ success: true });
  } catch (e: any) {
    return Response.json({ success: false, message: e?.message || 'sms failed' }, { status: 500 });
  }
}

