import * as tencentcloud from 'tencentcloud-sdk-nodejs';

type SendSmsParams = {
  phone: string;
  code: string;
  ttlMinutes?: number;
};

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




