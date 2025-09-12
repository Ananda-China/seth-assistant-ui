"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [canSetInvite, setCanSetInvite] = useState(true);
  const [inviteCheckMsg, setInviteCheckMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 从URL参数中获取邀请码
  useEffect(() => {
    const inviteParam = searchParams.get('invite');
    if (inviteParam) {
      setInvite(inviteParam);
      setTab('otp');
    }
  }, [searchParams]);

  // 检查邀请码状态（手机号改变时）
  const checkInviteStatus = async (phoneNumber: string) => {
    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      setCanSetInvite(true);
      setInviteCheckMsg('');
      return;
    }
    try {
      const response = await fetch('/api/auth/check-invite-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await response.json();
      if (data.success) {
        setCanSetInvite(data.canSetInvite);
        setInviteCheckMsg(data.message);
        if (!data.canSetInvite) setInvite('');
      }
    } catch (error) {
      console.error('检查邀请状态失败:', error);
      setCanSetInvite(true);
      setInviteCheckMsg('');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkInviteStatus(phone);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [phone]);

  // 倒计时定时器
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  async function sendCode() {
    if (!phone) {
      setMsg('请输入手机号');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const r = await fetch('/api/auth/send_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.success) {
        setMsg(data.message || '验证码已发送');
        if (data.debug_code) setCode(String(data.debug_code));
        setCountdown(600);
      } else {
        setMsg(data?.message || '发送失败');
      }
    } catch (error) {
      console.error('发送验证码错误:', error);
      setMsg('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setMsg('');
    try {
      const r = await fetch('/api/auth/verify_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, invite }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.success) {
        setMsg('登录成功，正在跳转...');
        setTimeout(() => router.push('/'), 200);
      } else {
        setMsg(data?.message || '验证失败');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loginPassword() {
    if (!phone || !password) {
      setMsg('请输入手机号和密码');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const r = await fetch('/api/auth/login_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data?.success) {
        setMsg('登录成功，正在跳转...');
        setTimeout(() => router.push('/'), 200);
      } else {
        setMsg(data?.message || '登录失败');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-main">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">S</div>
            <div className="login-logo-title">听心如意</div>
          </div>
        </div>

        <div className="login-form">
          <h1 className="login-title">登录</h1>

          {/* 标签切换 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className={tab === 'password' ? 'btn-primary' : 'btn-outline'}
              onClick={() => setTab('password')}
            >
              密码登录
            </button>
            <button
              type="button"
              className={tab === 'otp' ? 'btn-primary' : 'btn-outline'}
              onClick={() => setTab('otp')}
            >
              验证码登录
            </button>
          </div>

          {/* 密码登录 */}
          {tab === 'password' && (
            <>
              <div className="form-group">
                <label className="form-label">账号（手机号）</label>
                <input
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                />
              </div>
              <div className="form-group">
                <label className="form-label">密码</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                />
              </div>
              <div className="form-actions">
                <button onClick={loginPassword} disabled={loading} className="btn-primary">
                  {loading ? '登录中...' : '登录'}
                </button>
                <a href="/" className="btn-outline">返回</a>
              </div>
              {msg && <div className="form-message">{msg}</div>}
            </>
          )}

          {/* 验证码登录 */}
          {tab === 'otp' && (
            <>
              <div className="form-group">
                <label className="form-label">手机号</label>
                <input
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                />
              </div>
              <div className="form-group">
                <label className="form-label">验证码</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6位验证码"
                  />
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={sendCode}
                    disabled={loading || countdown > 0}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {countdown > 0 ? `重新发送(${countdown}s)` : '获取验证码'}
                  </button>
                </div>
              </div>

              {canSetInvite && (
                <div className="form-group">
                  <label className="form-label">邀请码（可选）</label>
                  <input
                    className="form-input"
                    value={invite}
                    onChange={(e) => setInvite(e.target.value)}
                    placeholder="没有可留空"
                  />
                  {inviteCheckMsg && (
                    <div className="invite-check-message invite-check-success">{inviteCheckMsg}</div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button onClick={verify} disabled={loading} className="btn-primary">
                  {loading ? '验证中...' : '验证并登录'}
                </button>
                <a href="/" className="btn-outline">返回</a>
              </div>
              {msg && <div className="form-message">{msg}</div>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}


