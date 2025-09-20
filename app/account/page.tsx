"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InviteSection from '../../components/InviteSection';

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

  // 激活码相关状态
  const [activationCode, setActivationCode] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationMsg, setActivationMsg] = useState('');
  const [balance, setBalance] = useState(0);
  const [commissionRecords, setCommissionRecords] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // 提现相关状态
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('alipay');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  // 登录密码设置
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passLoading, setPassLoading] = useState(false);

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

      // 加载激活码相关数据
      await loadActivationData();
    })();
  }, []);

  const loadActivationData = async () => {
    try {
      // 加载余额
      const balanceRes = await fetch('/api/activation/balance');
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance_yuan || 0);
      }

      // 加载佣金记录
      const commissionRes = await fetch('/api/activation/commission');
      if (commissionRes.ok) {
        const commissionData = await commissionRes.json();
        setCommissionRecords(commissionData.records || []);
      }

      // 加载提现记录
      const withdrawRes = await fetch('/api/activation/withdraw');
      if (withdrawRes.ok) {
        const withdrawData = await withdrawRes.json();
        setWithdrawalRequests(withdrawData.requests || []);
      }

      // 加载套餐信息
      const plansRes = await fetch('/api/activation/plans');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }
    } catch (error) {
      console.error('加载激活码数据失败:', error);
    }
  };

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

  // 设置登录密码
  async function updatePassword() {
    setPassMsg('');
    if (!newPassword || newPassword.length < 6) {
      setPassMsg('密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg('两次输入不一致');
      return;
    }
    setPassLoading(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassMsg('密码已更新');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassMsg(data.message || '更新失败');
      }
    } catch (e) {
      setPassMsg('网络错误，请重试');
    } finally {
      setPassLoading(false);
    }
  }

  // 激活激活码
  async function activateCode() {
    if (!activationCode.trim()) {
      setActivationMsg('请输入激活码');
      return;
    }

    setActivationLoading(true);
    setActivationMsg('');

    try {
      const res = await fetch('/api/activation/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode.trim() })
      });

      const data = await res.json();

      if (data.success) {
        setActivationMsg('激活成功！');
        setActivationCode('');
        // 重新加载数据
        await loadActivationData();
        // 重新加载财务数据
        const f = await fetch('/api/account/finance');
        if (f.ok) {
          const financeData = await f.json();
          setSub(financeData.subscription);
          setOrders(financeData.orders || []);
        }
      } else {
        setActivationMsg(data.message || '激活失败');
      }
    } catch (error) {
      setActivationMsg('激活失败，请重试');
    } finally {
      setActivationLoading(false);
    }
  }

  // 申请提现
  async function submitWithdrawal() {
    if (!withdrawAmount || !withdrawAccount) {
      setWithdrawMsg('请填写完整信息');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 50) {
      setWithdrawMsg('最低提现金额为50元');
      return;
    }

    setWithdrawLoading(true);
    setWithdrawMsg('');

    try {
      const res = await fetch('/api/activation/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          payment_method: withdrawMethod,
          account_info: withdrawAccount
        })
      });

      const data = await res.json();

      if (data.success) {
        setWithdrawMsg('提现申请已提交，请等待处理');
        setWithdrawAmount('');
        setWithdrawAccount('');
        // 重新加载数据
        await loadActivationData();
      } else {
        setWithdrawMsg(data.message || '提现申请失败');
      }
    } catch (error) {
      setWithdrawMsg('提现申请失败，请重试');
    } finally {
      setWithdrawLoading(false);
    }
  }

  return (
    <main className="account-main">
      <div className="account-container">
        <div className="account-header">
          <div className="account-logo">
            <div className="account-logo-icon">心</div>
            <div className="account-logo-title">听心如意</div>
          </div>
        </div>

        <div className="account-content">
          <h1 className="account-title">个人中心</h1>

          {/* 基础信息区域 */}
          <div className="account-section">
            <h2 className="section-title">基础信息</h2>
            <div className="section-cards">
              {/* 个人信息卡 */}
              <div className="account-card">
                <h3 className="card-title">个人信息</h3>
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

              {/* 登录密码卡 */}
              <div className="account-card">
                <h3 className="card-title">登录密码</h3>
                <div className="card-grid">
                  <div className="form-group">
                    <label className="form-label">输入密码</label>
                    <input
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="至少6位"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">确认密码</label>
                    <input
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                    />
                  </div>
                </div>
                <div className="card-actions">
                  <button onClick={updatePassword} disabled={passLoading} className="btn-outline">
                    {passLoading ? '保存中...' : '确认修改'}
                  </button>
                  {passMsg && <span className="card-message">{passMsg}</span>}
                </div>
              </div>
            </div>
          </div>


          {/* 会员服务区域 */}
          <div className="account-section">
            <h2 className="section-title">会员服务</h2>
            <div className="section-cards">
              {/* 订阅信息卡 */}
              <div className="account-card">
                <h3 className="card-title">订阅状态</h3>
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
                      <button
                        className="btn-disabled"
                        disabled
                        title="我们正在完善企业资质认证，在线支付功能暂时关闭。如需购买会员，请联系客服获取激活码。"
                      >
                        续费/升级
                      </button>
                      <div className="payment-notice">
                        <p>我们正在完善企业资质认证，在线支付功能暂时关闭。</p>
                        <p>如需购买会员，请联系客服获取激活码。</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="subscription-empty">
                    未订阅。<a href="/pay" className="subscription-link">立即订阅</a>
                  </div>
                )}
              </div>

              {/* 激活码激活卡 */}
              <div className="account-card">
                <h3 className="card-title">激活码激活</h3>
                <div className="activation-section">
                  <div className="activation-form">
                    <input
                      className="form-input"
                      placeholder="请输入激活码"
                      value={activationCode}
                      onChange={e => setActivationCode(e.target.value)}
                    />
                    <button
                      className="btn-primary"
                      onClick={activateCode}
                      disabled={activationLoading}
                    >
                      {activationLoading ? '激活中...' : '激活'}
                    </button>
                  </div>
                  {activationMsg && <span className="activation-message">{activationMsg}</span>}

                  <div className="plans-info">
                    <div className="plans-title">可用套餐</div>
                    {plans.map(plan => (
                      <div key={plan.id} className="plan-item">
                        <span className="plan-name">{plan.name}</span>
                        <span className="plan-price">¥{(plan.price / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 财务管理区域 */}
          <div className="account-section">
            <h2 className="section-title">财务管理</h2>
            <div className="section-cards">

              {/* 我的余额卡 */}
              <div className="account-card">
                <h3 className="card-title">我的余额</h3>
                <div className="balance-section">
                  <div className="balance-amount">
                    <span className="balance-label">当前余额：</span>
                    <span className="balance-value">¥{balance.toFixed(2)}</span>
                  </div>

                  <div className="withdrawal-form">
                    <div className="form-group">
                      <label className="form-label">提现金额</label>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="最低50元"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">提现方式</label>
                      <select
                        className="form-input"
                        value={withdrawMethod}
                        onChange={e => setWithdrawMethod(e.target.value)}
                      >
                        <option value="alipay">支付宝</option>
                        <option value="wechat">微信</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">收款账号</label>
                      <input
                        className="form-input"
                        placeholder={withdrawMethod === 'alipay' ? '支付宝账号' : '微信账号'}
                        value={withdrawAccount}
                        onChange={e => setWithdrawAccount(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn-primary"
                      onClick={submitWithdrawal}
                      disabled={withdrawLoading}
                    >
                      {withdrawLoading ? '提交中...' : '申请提现'}
                    </button>
                  </div>
                  {withdrawMsg && <span className="withdraw-message">{withdrawMsg}</span>}
                </div>
              </div>

              {/* 佣金记录卡 */}
              <div className="account-card">
                <h3 className="card-title">佣金记录</h3>
                <div className="commission-section">
                  {commissionRecords && commissionRecords.length > 0 ? (
                    <div className="commission-list">
                      {commissionRecords.map(record => (
                        <div key={record.id} className="commission-item">
                          <div className="commission-info">
                            <span className="commission-user">{record.invited_user?.nickname || record.invited_user?.phone}</span>
                            <span className="commission-plan">{record.plan?.name}</span>
                            <span className="commission-level">L{record.level}</span>
                          </div>
                          <div className="commission-amount">+¥{(record.commission_amount / 100).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-text">暂无佣金记录</div>
                  )}
                </div>
              </div>

              {/* 提现记录卡 */}
              <div className="account-card">
                <h3 className="card-title">提现记录</h3>
                <div className="withdrawal-section">
                  {withdrawalRequests && withdrawalRequests.length > 0 ? (
                    <div className="withdrawal-list">
                      {withdrawalRequests.map(request => (
                        <div key={request.id} className="withdrawal-item">
                          <div className="withdrawal-info">
                            <span className="withdrawal-amount">¥{(request.amount / 100).toFixed(2)}</span>
                            <span className="withdrawal-method">{request.payment_method === 'alipay' ? '支付宝' : '微信'}</span>
                            <span className="withdrawal-status">{request.status}</span>
                          </div>
                          <div className="withdrawal-time">{new Date(request.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-text">暂无提现记录</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 推广中心区域 */}
          <div className="account-section">
            <h2 className="section-title">推广中心</h2>
            <div className="section-cards">
              {/* 邀请推广卡 */}
              <div className="account-card">
                <h3 className="card-title">邀请推广</h3>
                <InviteSection phone={phone} />
              </div>

              {/* 邀请关系卡 */}
              <div className="account-card">
                <h3 className="card-title">邀请关系</h3>
                <div className="invite-relation-section">
                  <div className="invite-info">
                    <span className="invite-label">邀请我的人：</span>
                    <span className="invite-value">{invitedBy || '无'}</span>
                  </div>

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
            </div>
          </div>

          {/* 订单记录区域 */}
          <div className="account-section">
            <h2 className="section-title">订单记录</h2>
            <div className="section-cards">
              {/* 支付订单卡 */}
              <div className="account-card full-width">
                <h3 className="card-title">支付订单</h3>
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
            </div>
          </div>

          {/* 退出登录 */}
          <div className="logout-section">
            <a href="/api/auth/logout?redirect=/login" className="btn-outline">退出登录</a>
          </div>
        </div>
      </div>
    </main>
  );
}


