// OTP store with production fallback
// In production, we'll use a more reliable approach

type OtpRecord = { code: string; expireAt: number };

// For production, use a more reliable approach
let store: Map<string, OtpRecord>;

if (process.env.NODE_ENV === 'production') {
  // Production: Use global store with proper initialization
  if (!(global as any).__otpStore) {
    (global as any).__otpStore = new Map();
  }
  store = (global as any).__otpStore;
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
  if (!rec) {
    console.log(`❌ 验证码不存在: ${phone}`);
    return false;
  }
  
  if (Date.now() > rec.expireAt) {
    store.delete(phone);
    console.log(`❌ 验证码已过期: ${phone}`);
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

// Clean up expired OTPs periodically
export function cleanupExpiredOtps() {
  const now = Date.now();
  const entries = Array.from(store.entries());
  for (const [phone, record] of entries) {
    if (now > record.expireAt) {
      store.delete(phone);
    }
  }
}

// Initialize cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredOtps, 60000); // Clean up every minute
}



