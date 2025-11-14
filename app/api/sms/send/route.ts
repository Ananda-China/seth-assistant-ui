import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { phone } = await req.json().catch(() => ({ phone: '' }));
  const ok = /^1[3-9]\d{9}$/.test(String(phone || ''));
  if (!ok) return Response.json({ success: false, message: 'invalid phone' }, { status: 400 });

  // MVP：仅做成功返回。后续对接 send_sms_code/index.js 或第三方短信。
  return Response.json({ success: true, request_id: `${Date.now()}` });
}


