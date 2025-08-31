"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [sub, setSub] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [invitedBy, setInvitedByState] = useState('');
  const [invitees, setInvitees] = useState<any[]>([]);
  const [inviteMsg, setInviteMsg] = useState('');

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/me');
      if (r.ok) {
        const j = await r.json();
        setPhone(j.phone || '');
        setNickname(j.nickname || '');
      }
      const f = await fetch('/api/account/finance');
      if (f.ok) {
        const data = await f.json();
        setSub(data.subscription);
        setOrders(data.orders || []);
      }
      const iv = await fetch('/api/account/invite');
      if (iv.ok) {
        const data = await iv.json();
        setInviteCode(data.me?.invite_code || '');
        setInvitedByState(data.me?.invited_by || '');
        setInvitees(data.invitees || []);
      }
    })();
  }, []);

  async function save() {
    setLoading(true);
    setMsg('');
    try {
      const r = await fetch(`/api/me?nickname=${encodeURIComponent(nickname)}`);
      if (r.ok) {
        setMsg('保存成功');
        // 保存成功后跳回首页，让头像立即显示首字母
        setTimeout(() => router.push('/'), 300);
      } else setMsg('保存失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="account-main">
      <div className="account-container">
        <div className="account-header">
          <div className="account-logo">
            <div className="account-logo-icon">S</div>
            <div className="account-logo-title">赛斯助手</div>
          </div>
        </div>
        
        <div className="account-content">
          <h1 className="account-title">个人中心</h1>
          
          <div className="account-cards">
            {/* 个人信息卡 */}
            <div className="account-card">
              <h2 className="card-title">个人信息</h2>
              <div className="card-grid">
                <div className="form-group">
                  <label className="form-label">手机号</label>
                  <input className="form-input" value={phone} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">昵称</label>
                  <input className="form-input" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="填写昵称" />
                </div>
              </div>
              <div className="card-actions">
                <button onClick={save} disabled={loading} className="btn-outline">保存</button>
                {msg && <span className="card-message">{msg}</span>}
              </div>
            </div>

            {/* 订阅信息卡 */}
            <div className="account-card">
              <h2 className="card-title">订阅状态</h2>
              {sub ? (
                <div className="subscription-info">
                  <div className="subscription-details">
                    <span className="subscription-item">
                      <span className="subscription-label">套餐</span>
                      <span className="subscription-badge" title={String(sub.plan)}>
                        {sub.plan}
                      </span>
                    </span>
                    <span className="subscription-item">
                      <span className="subscription-label">状态</span>
                      <span>{sub.status}</span>
                    </span>
                    <span className="subscription-item">
                      <span className="subscription-label">有效期至</span>
                      <span>{sub.current_period_end ? new Date(sub.current_period_end).toLocaleString() : '-'}</span>
                    </span>
                  </div>
                  <div className="subscription-actions">
                    <a href="/pay" className="btn-primary">续费/升级</a>
                  </div>
                </div>
              ) : (
                <div className="subscription-empty">
                  未订阅。<a href="/pay" className="subscription-link">立即订阅</a>
                </div>
              )}
            </div>

            {/* 订单表 */}
            <div className="account-card">
              <h2 className="card-title">支付订单</h2>
              {orders && orders.length > 0 ? (
                <div className="orders-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="table-header">时间</th>
                        <th className="table-header">订单号</th>
                        <th className="table-header">套餐</th>
                        <th className="table-header">金额</th>
                        <th className="table-header">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.out_trade_no} className="table-row">
                          <td className="table-cell">{new Date(o.created_at).toLocaleString()}</td>
                          <td className="table-cell">{o.out_trade_no}</td>
                          <td className="table-cell">{o.plan}</td>
                          <td className="table-cell">¥{(o.amount_fen/100).toFixed(2)}</td>
                          <td className="table-cell">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-text">暂无订单</p>
              )}
            </div>

            {/* 邀请关系卡 */}
            <div className="account-card">
              <h2 className="card-title">邀请关系</h2>
              <div className="invite-section">
                <div className="invite-code">
                  <span className="invite-label">我的邀请码：</span>
                  <span className="invite-badge">{inviteCode || '-'}</span>
                  <button
                    type="button"
                    className="btn-copy"
                    onClick={async ()=>{
                      if (!inviteCode) return;
                      try { await navigator.clipboard.writeText(inviteCode); alert('已复制邀请码'); } catch {}
                    }}
                  >复制</button>
                </div>
                <div className="invite-info">邀请我的人：{invitedBy || '（未填写）'}</div>
                <div className="invite-form">
                  <input
                    className="form-input"
                    placeholder="输入邀请人的邀请码"
                    value={invitedBy}
                    onChange={e=>setInvitedByState(e.target.value)}
                  />
                  <button className="btn-outline" onClick={async ()=>{
                    setInviteMsg('');
                    const r = await fetch('/api/account/invite', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ inviter_code: invitedBy })});
                    if (r.ok) {
                      setInviteMsg('已保存');
                    } else {
                      setInviteMsg('邀请码无效');
                    }
                  }}>保存邀请人</button>
                </div>
                {inviteMsg && <span className="invite-message">{inviteMsg}</span>}

                <div className="invitees-section">
                  <div className="invitees-title">我邀请的人</div>
                  {invitees && invitees.length>0 ? (
                    <ul className="invitees-list">
                      {invitees.map(x => (
                        <li key={x.phone}>{x.nickname || x.phone}（{x.phone}）</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-text">暂无</div>
                  )}
                </div>
              </div>
            </div>

            <div className="logout-section">
              <a href="/api/auth/logout?redirect=/login" className="btn-outline">退出登录</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


