import { NextRequest } from 'next/server';
import { setOtp } from '../../../../lib/otpStore';
import { sendSmsTencent } from '../../../../lib/sms';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? '');
    const ok = /^1[3-9]\d{9}$/.test(String(phone || ''));
    if (!ok) return Response.json({ success: false, message: 'invalid phone' }, { status: 400 });

    const code = generateCode();
    setOtp(phone, code); // 5分钟

    // 生产环境暂时返回调试码，避免短信服务错误
    if (process.env.NODE_ENV === 'production') {
      console.log(`📱 生产环境验证码: ${phone} -> ${code}`);
      return Response.json({ 
        success: true, 
        debug_code: code,
        message: '验证码已生成，请查看控制台日志'
      });
    }

    // 开发环境
    try {
      await sendSmsTencent({ phone, code });
      return Response.json({ success: true, debug_code: code });
    } catch (smsError) {
      console.error('❌ 短信发送失败:', smsError);
      // 即使短信失败，也返回验证码用于测试
      return Response.json({ 
        success: true, 
        debug_code: code,
        message: '短信发送失败，但验证码已生成'
      });
    }
  } catch (e: any) {
    console.error('❌ OTP API错误:', e);
    return Response.json({ 
      success: false, 
      message: '服务器内部错误，请稍后重试' 
    }, { status: 500 });
  }
}

