import crypto from 'crypto';

type ZPayConfig = {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  notifyUrl: string;
};

export function loadZPayConfig(): ZPayConfig {
  const cfg: ZPayConfig = {
    merchantId: process.env.ZPAY_MERCHANT_ID || '',
    apiKey: process.env.ZPAY_API_KEY || '',
    apiSecret: process.env.ZPAY_API_SECRET || '',
    baseUrl: process.env.ZPAY_BASE_URL || 'https://api.zpay.com',
    notifyUrl: process.env.ZPAY_NOTIFY_URL || '',
  };
  return cfg;
}

// 生成签名
function generateSignature(params: Record<string, any>, secret: string): string {
  // 按键名排序
  const sortedKeys = Object.keys(params).sort();
  const signString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&') + `&key=${secret}`;
  
  return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
}

// 创建支付订单
export async function createZPayOrder(params: {
  amount: number; // 金额（分）
  orderId: string; // 商户订单号
  subject: string; // 商品描述
  userId: string; // 用户ID
  payType?: 'alipay' | 'wechat' | 'unionpay'; // 支付方式
}) {
  const cfg = loadZPayConfig();
  
  if (!cfg.merchantId || !cfg.apiKey || !cfg.apiSecret) {
    throw new Error('ZPay configuration is incomplete');
  }

  const orderParams = {
    merchant_id: cfg.merchantId,
    order_id: params.orderId,
    amount: params.amount,
    subject: params.subject,
    user_id: params.userId,
    pay_type: params.payType || 'alipay',
    notify_url: cfg.notifyUrl,
    timestamp: Math.floor(Date.now() / 1000),
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  // 生成签名
  const sign = generateSignature(orderParams, cfg.apiSecret);
  
  const requestData = {
    ...orderParams,
    sign,
  };

  try {
    const response = await fetch(`${cfg.baseUrl}/api/v1/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`ZPay API error: ${result.message || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    console.error('ZPay create order error:', error);
    throw error;
  }
}

// 查询订单状态
export async function queryZPayOrder(orderId: string) {
  const cfg = loadZPayConfig();
  
  const queryParams = {
    merchant_id: cfg.merchantId,
    order_id: orderId,
    timestamp: Math.floor(Date.now() / 1000),
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const sign = generateSignature(queryParams, cfg.apiSecret);
  
  const requestData = {
    ...queryParams,
    sign,
  };

  try {
    const response = await fetch(`${cfg.baseUrl}/api/v1/order/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`ZPay query error: ${result.message || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    console.error('ZPay query order error:', error);
    throw error;
  }
}

// 验证回调签名
export function verifyZPayNotify(params: Record<string, any>, signature: string): boolean {
  const cfg = loadZPayConfig();
  const expectedSign = generateSignature(params, cfg.apiSecret);
  return expectedSign === signature;
}

// 支付套餐配置
export const ZPAY_PLANS = {
  monthly: {
    id: 'monthly',
    name: '月套餐',
    price: 99900, // 999元，单位：分
    duration: 30, // 天数
    description: '月套餐，享受无限聊天',
    features: ['无限聊天次数', '优先响应', '专属客服']
  },
  yearly: {
    id: 'yearly',
    name: '年套餐',
    price: 399900, // 3999元，单位：分
    duration: 365, // 天数
    description: '年套餐，最超值的选择',
    features: ['无限聊天次数', '优先响应', '专属客服', '年度超值', '专属徽章']
  }
};
