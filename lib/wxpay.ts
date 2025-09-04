import crypto from 'crypto';

type WxConfig = {
  mchid: string;
  mchSerialNo: string;
  privateKey: string; // PEM
  apiV3Key: string; // 32 bytes
  appid: string;
  notifyUrl: string;
};

export function loadWxConfig(): WxConfig {
  const cfg: WxConfig = {
    mchid: process.env.WECHAT_MCH_ID || '',
    mchSerialNo: process.env.WECHAT_MCH_SERIAL || '',
    privateKey: (process.env.WECHAT_MCH_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    apiV3Key: process.env.WECHAT_API_V3_KEY || '',
    appid: process.env.WECHAT_APPID || '',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
  };
  return cfg;
}

function buildAuthorization(cfg: WxConfig, method: string, urlPath: string, body: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(message);
  const signature = signer.sign(cfg.privateKey, 'base64');
  const token = `mchid=\"${cfg.mchid}\",serial_no=\"${cfg.mchSerialNo}\",timestamp=\"${timestamp}\",nonce_str=\"${nonceStr}\",signature=\"${signature}\"`;
  return `WECHATPAY2-SHA256-RSA2048 ${token}`;
}

export async function createNativeOrder(amountFen: number, description: string, outTradeNo: string) {
  const cfg = loadWxConfig();
  const path = '/v3/pay/transactions/native';
  const bodyObj = {
    appid: cfg.appid,
    mchid: cfg.mchid,
    description,
    out_trade_no: outTradeNo,
    notify_url: cfg.notifyUrl,
    amount: { total: amountFen, currency: 'CNY' },
  };
  const body = JSON.stringify(bodyObj);
  const auth = buildAuthorization(cfg, 'POST', path, body);
  const res = await fetch(`https://api.mch.weixin.qq.com${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth,
      'Accept': 'application/json',
      'User-Agent': 'seth-assistant-ui/1.0.0',
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`wxpay create order failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data as { code_url: string };
}

export function decryptNotifyResource(apiV3Key: string, associated_data: string, nonce: string, ciphertext: string): any {
  const key = Buffer.from(apiV3Key, 'utf8');
  const buf = Buffer.from(ciphertext, 'base64');
  const aad = Buffer.from(associated_data, 'utf8');
  const iv = Buffer.from(nonce, 'utf8');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(buf.slice(buf.length - 16));
  decipher.setAAD(aad);
  const content = Buffer.concat([decipher.update(buf.slice(0, buf.length - 16)), decipher.final()]);
  return JSON.parse(content.toString('utf8'));
}
















