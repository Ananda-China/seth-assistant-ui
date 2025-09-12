"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('13472881751'); // 设置默认手机号
  const [code, setCode] = useState('');
  const [invite, setInvite] = useState('');
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [canSetInvite, setCanSetInvite] = useState(true);
  const [inviteCheckMsg, setInviteCheckMsg] = useState('');

  // 从URL参数中获取邀请码
  useEffect(() => {
    const inviteParam = searchParams.get('invite');
    if (inviteParam) {
      setInvite(inviteParam);
    }
  }, [searchParams]);

  // 检查邀请码状态
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

        // 如果不能设置邀请码，清空邀请码输入
        if (!data.canSetInvite) {
          setInvite('');
        }
      }
    } catch (error) {
      console.error('检查邀请状态失败:', error);
      setCanSetInvite(true);
      setInviteCheckMsg('');
    }
  };

  // 监听手机号变化，检查邀请状态
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkInviteStatus(phone);
    }, 500); // 防抖，500ms后检查

    return () => clearTimeout(timeoutId);
  }, [phone]);

  async function sendCode() {
    console.log('发送验证码，手机号:', phone); // 添加调试日志
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
      
      console.log('API响应状态:', r.status); // 添加调试日志
      
      const data = await r.json().catch(() => ({}));
      console.log('API响应数据:', data); // 添加调试日志
      
      if (data?.success) {
        setStep('verify');
        setMsg(data.message || '验证码已发送');
        if (data.debug_code) {
          setCode(String(data.debug_code));
          // 不再显示弹窗，直接设置验证码
        }
      } else {
        setMsg(data?.message || '发送失败');
      }
    } catch (error) {
      console.error('发送验证码错误:', error); // 添加错误日志
      setMsg('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setMsg('');
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
  }

  return (
    <main className="login-main">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">S</div>
            <div className="login-logo-title">赛斯助手</div>
          </div>
        </div>
        
        <div className="login-form">
          <h1 className="login-title">登录</h1>
          
          <div className="form-group">
            <label className="form-label">手机号</label>
            <input 
              className="form-input" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="请输入手机号" 
            />
          </div>
          
          {step === 'verify' && (
            <div className="form-group">
              <label className="form-label">验证码</label>
              <input 
                className="form-input" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                placeholder="6位验证码" 
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">邀请码（可选）</label>
            <input
              className={`form-input ${!canSetInvite ? 'form-input-disabled' : ''}`}
              value={invite}
              onChange={e => canSetInvite && setInvite(e.target.value)}
              placeholder={canSetInvite ? "没有可留空" : "该手机号已有邀请关系"}
              disabled={!canSetInvite}
            />
            {inviteCheckMsg && (
              <div className={`invite-check-message ${canSetInvite ? 'invite-check-success' : 'invite-check-warning'}`}>
                {inviteCheckMsg}
              </div>
            )}
          </div>
          
          <div className="form-actions">
            {step === 'send' ? (
              <button 
                onClick={sendCode} 
                disabled={loading} 
                className="btn-primary"
              >
                {loading ? '发送中...' : '发送验证码'}
              </button>
            ) : (
              <button 
                onClick={verify} 
                disabled={loading} 
                className="btn-primary"
              >
                {loading ? '验证中...' : '验证并登录'}
              </button>
            )}
            <a href="/" className="btn-outline">返回</a>
          </div>
          
          {msg && <div className="form-message">{msg}</div>}
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


