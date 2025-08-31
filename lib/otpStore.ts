// Simple in-memory OTP store shared across routes during a single server process
// NOTE: For production, replace with Redis/DB and add rate limiting

type OtpRecord = { code: string; expireAt: number };
const store: Map<string, OtpRecord> = (global as any).__otpStore || new Map();
(global as any).__otpStore = store;

export function setOtp(phone: string, code: string, ttlMs = 5 * 60 * 1000) {
  store.set(phone, { code, expireAt: Date.now() + ttlMs });
}

export function consumeOtp(phone: string, code: string): boolean {
  const rec = store.get(phone);
  if (!rec) return false;
  if (Date.now() > rec.expireAt) {
    store.delete(phone);
    return false;
  }
  const ok = rec.code === code;
  if (ok) store.delete(phone);
  return ok;
}



