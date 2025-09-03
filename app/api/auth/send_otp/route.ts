import { NextRequest } from 'next/server';
import { setOtp } from '../../../../lib/otpStore';
import { sendSms } from '../../../../lib/sms';

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

    // 检查SMS配置是否完整
    const hasSputConfig = process.env.SPUT_USER_ID && process.env.SPUT_API_KEY;
    const hasTencentConfig = process.env.TENCENTCLOUD_SECRET_ID && 
                            process.env.TENCENTCLOUD_SECRET_KEY && 
                            process.env.TENCENT_SMS_SDK_APP_ID && 
                            process.env.TENCENT_SMS_SIGN && 
                            process.env.TENCENT_SMS_TEMPLATE_ID;
    const hasSmsConfig = hasSputConfig || hasTencentConfig;

    // 生产环境：如果有SMS配置则尝试发送，否则返回调试码
    if (process.env.NODE_ENV === 'production') {
      if (hasSmsConfig) {
        try {
          await sendSms({ phone, code });
          console.log(`📱 生产环境短信发送成功: ${phone}`);
          return Response.json({ 
            success: true, 
            message: '验证码已发送到您的手机'
          });
        } catch (smsError) {
          console.error('❌ 生产环境短信发送失败:', smsError);
          // SMS失败时返回调试码
          return Response.json({ 
            success: true, 
            debug_code: code,
            message: '短信发送失败，请查看控制台日志获取验证码'
          });
        }
      } else {
        // 没有SMS配置，返回调试码
        console.log(`📱 生产环境验证码（无SMS配置）: ${phone} -> ${code}`);
        return Response.json({ 
          success: true, 
          debug_code: code,
          message: '验证码已生成，请查看控制台日志'
        });
      }
    }

    // 开发环境
    try {
      if (hasSmsConfig) {
        await sendSms({ phone, code });
        return Response.json({ success: true, debug_code: code });
      } else {
        // 开发环境没有SMS配置，直接返回调试码
        return Response.json({ 
          success: true, 
          debug_code: code,
          message: '开发环境：验证码已生成，请查看响应数据'
        });
      }
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

