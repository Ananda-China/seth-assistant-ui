// OTP store with production fallback
// In production, we'll use a simple approach to avoid complex dependencies

type OtpRecord = { code: string; expireAt: number };

// For production, use a simple approach
let store: Map<string, OtpRecord>;

if (process.env.NODE_ENV === 'production') {
  // Production: Use a new Map for each request (temporary solution)
  store = new Map();
} else {
  // Development: Use global store
  store = (global as any).__otpStore || new Map();
  (global as any).__otpStore = store;
}

export function setOtp(phone: string, code: string, ttlMs = 5 * 60 * 1000) {
  store.set(phone, { code, expireAt: Date.now() + ttlMs });
  
  // In production, log the code for testing
  if (process.env.NODE_ENV === 'production') {
    console.log(`📱 验证码已设置: ${phone} -> ${code} (有效期: ${ttlMs/1000}秒)`);
  }
}

export function consumeOtp(phone: string, code: string): boolean {
  const rec = store.get(phone);
  if (!rec) return false;
  
  if (Date.now() > rec.expireAt) {
    store.delete(phone);
    return false;
  }
  
  const ok = rec.code === code;
  if (ok) {
    store.delete(phone);
    console.log(`✅ 验证码验证成功: ${phone}`);
  } else {
    console.log(`❌ 验证码验证失败: ${phone}, 输入: ${code}, 正确: ${rec.code}`);
  }
  
  return ok;
}



