import * as tencentcloud from 'tencentcloud-sdk-nodejs';

type SendSmsParams = {
  phone: string;
  code: string;
  ttlMinutes?: number;
};

// Spug短信服务配置（兼容旧Sput命名的环境变量）
type SpugSmsConfig = {
  userId: string;
  apiKey: string;
  apiUrl?: string;
  templateId?: string;
};

// 发送Spug短信（Spug Push）
export async function sendSmsSpug({ phone, code, ttlMinutes = 5 }: SendSmsParams) {
  // 使用专属发送URL：如 https://push.spug.cc/send/<token>
  const sendUrl = process.env.SPUG_SEND_URL || process.env.SPUT_SEND_URL || '';
  const spugName = process.env.SPUG_NAME || process.env.SPUT_NAME || 'Seth验证码';
  if (!sendUrl) {
    throw new Error('Spug SMS env not configured: missing SPUG_SEND_URL');
  }

  // 按文档示例：{ name, code, targets }
  const payload: Record<string, any> = {
    name: spugName,
    code,
    targets: phone,
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Seth-Assistant/1.0'
    };

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // 检查返回结果（文档示例：{"code":200,"msg":"请求成功"}）
    const okByCode = typeof result.code !== 'undefined' ? Number(result.code) === 200 : false;
    const okBySuccess = typeof result.success !== 'undefined' ? !!result.success : false;
    if (!okByCode && !okBySuccess) {
      throw new Error(result.message || 'SMS发送失败');
    }

    return result;
  } catch (error) {
    console.error('Spug SMS发送错误:', error);
    throw error;
  }
}

// 腾讯云短信服务（保留原有功能）
export async function sendSmsTencent({ phone, code, ttlMinutes = 5 }: SendSmsParams) {
  const secretId = process.env.TENCENTCLOUD_SECRET_ID || '';
  const secretKey = process.env.TENCENTCLOUD_SECRET_KEY || '';
  const smsSdkAppId = process.env.TENCENT_SMS_SDK_APP_ID || '';
  const signName = process.env.TENCENT_SMS_SIGN || '';
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID || '';
  const region = process.env.TENCENT_REGION || 'ap-guangzhou';

  if (!secretId || !secretKey || !smsSdkAppId || !signName || !templateId) {
    throw new Error('Tencent SMS env not configured');
  }

  const SmsClient = tencentcloud.sms.v20210111.Client;
  const client = new SmsClient({
    credential: { secretId, secretKey },
    region,
    profile: { httpProfile: { endpoint: 'sms.tencentcloudapi.com' } },
  });

  const e164Phone = `+86${phone}`;
  const req = {
    PhoneNumberSet: [e164Phone],
    SmsSdkAppId: smsSdkAppId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParamSet: [code, String(ttlMinutes)],
  } as any;

  const res = await client.SendSms(req);
  const status = res?.SendStatusSet?.[0];
  if (!status || status.Code !== 'Ok') {
    const msg = status?.Message || 'Unknown SMS error';
    throw new Error(msg);
  }
  return res;
}

// 智能选择短信服务
export async function sendSms({ phone, code, ttlMinutes = 5 }: SendSmsParams) {
  // 优先使用Spug服务（兼容Sput变量名）
  const hasSpugConfig = (process.env.SPUG_USER_ID || process.env.SPUT_USER_ID) && (process.env.SPUG_API_KEY || process.env.SPUT_API_KEY);
  const hasTencentConfig = process.env.TENCENTCLOUD_SECRET_ID && process.env.TENCENTCLOUD_SECRET_KEY;

  if (hasSpugConfig) {
    try {
      console.log('📱 使用Spug短信服务发送验证码');
      return await sendSmsSpug({ phone, code, ttlMinutes });
    } catch (error) {
      console.error('❌ Spug短信发送失败，尝试腾讯云:', error);
      if (hasTencentConfig) {
        return await sendSmsTencent({ phone, code, ttlMinutes });
      }
      throw error;
    }
  } else if (hasTencentConfig) {
    console.log('📱 使用腾讯云短信服务发送验证码');
    return await sendSmsTencent({ phone, code, ttlMinutes });
  } else {
    throw new Error('没有配置任何短信服务');
  }
}

// 为兼容已存在的测试脚本导出别名（可选）
export const sendSmsSput = sendSmsSpug;




