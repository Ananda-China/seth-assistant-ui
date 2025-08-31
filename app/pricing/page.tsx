'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PLANS = {
  monthly: {
    id: 'monthly',
    name: '月度会员',
    price: 29,
    originalPrice: 39,
    duration: '1个月',
    description: '适合轻度使用用户',
    features: [
      '无限聊天次数',
      '优先响应速度',
      '专属客服支持',
      '历史记录保存'
    ],
    popular: false
  },
  quarterly: {
    id: 'quarterly',
    name: '季度会员',
    price: 79,
    originalPrice: 117,
    duration: '3个月',
    description: '最受欢迎的选择',
    features: [
      '无限聊天次数',
      '优先响应速度',
      '专属客服支持',
      '历史记录保存',
      '季度优惠32%'
    ],
    popular: true
  },
  yearly: {
    id: 'yearly',
    name: '年度会员',
    price: 299,
    originalPrice: 468,
    duration: '12个月',
    description: '最超值的长期选择',
    features: [
      '无限聊天次数',
      '优先响应速度',
      '专属客服支持',
      '历史记录保存',
      '年度优惠36%',
      '专属会员徽章'
    ],
    popular: false
  }
};

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [permission, setPermission] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        setAuthed(true);
        
        // 获取用户权限信息
        const permResponse = await fetch('/api/user/permission');
        if (permResponse.ok) {
          const permData = await permResponse.json();
          setPermission(permData.data);
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const handlePurchase = async (planId: string, payType: 'alipay' | 'wechat' = 'alipay') => {
    if (loading) return;
    
    setLoading(planId);
    
    try {
      const response = await fetch('/api/zpay/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, payType }),
      });

      const result = await response.json();
      
      if (result.success) {
        // 跳转到支付页面
        window.open(result.data.pay_url, '_blank');
        
        // 开始轮询订单状态
        pollOrderStatus(result.data.order_id);
      } else {
        alert('创建订单失败：' + result.message);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('购买失败，请稍后重试');
    } finally {
      setLoading(null);
    }
  };

  const pollOrderStatus = async (orderId: string) => {
    const maxAttempts = 60; // 最多轮询5分钟
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/zpay/order_status?order_id=${orderId}`);
        const result = await response.json();
        
        if (result.success && result.data.status === 'success') {
          alert('支付成功！正在刷新页面...');
          window.location.reload();
          return;
        }
        
        if (result.data.status === 'failed') {
          alert('支付失败，请重试');
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // 5秒后再次检查
        }
      } catch (error) {
        console.error('Poll order status error:', error);
      }
    };
    
    setTimeout(poll, 3000); // 3秒后开始第一次检查
  };

  if (!authed) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#1A1D33',
        color: '#EAEBF0'
      }}>
        <div>正在验证登录状态...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A1D33 0%, #2E335B 100%)',
      color: '#EAEBF0',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #C8B6E2 0%, #8A94B3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            选择您的套餐
          </h1>
          <p style={{ fontSize: '18px', color: '#8A94B3' }}>
            升级到付费版本，享受无限制的AI助手服务
          </p>
          
          {/* 当前状态显示 */}
          {permission && (
            <div style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '12px 24px',
              background: 'rgba(76, 85, 138, 0.2)',
              borderRadius: '12px',
              border: '1px solid rgba(200, 182, 226, 0.1)'
            }}>
              <div style={{ fontSize: '14px', color: '#8A94B3' }}>当前状态</div>
              <div style={{ fontSize: '16px', marginTop: '4px' }}>
                {permission.isPaidUser ? (
                  <span style={{ color: '#10B981' }}>付费用户 ({permission.remainingDays}天)</span>
                ) : permission.isTrialActive ? (
                  <span style={{ color: '#F59E0B' }}>试用期 ({permission.remainingDays}天)</span>
                ) : (
                  <span style={{ color: '#EF4444' }}>试用已结束</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 套餐卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.popular 
                  ? 'linear-gradient(135deg, rgba(200, 182, 226, 0.1) 0%, rgba(138, 148, 179, 0.1) 100%)'
                  : 'rgba(26, 29, 51, 0.6)',
                border: plan.popular 
                  ? '2px solid #C8B6E2' 
                  : '1px solid rgba(46, 51, 91, 0.5)',
                borderRadius: '20px',
                padding: '32px',
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #C8B6E2 0%, #8A94B3 100%)',
                  color: '#1A1D33',
                  padding: '6px 20px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  最受欢迎
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: plan.popular ? '#C8B6E2' : '#EAEBF0'
                }}>
                  {plan.name}
                </h3>
                <p style={{ color: '#8A94B3', fontSize: '14px' }}>
                  {plan.description}
                </p>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold', 
                  color: plan.popular ? '#C8B6E2' : '#EAEBF0',
                  marginBottom: '8px'
                }}>
                  ¥{plan.price}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#8A94B3',
                  textDecoration: 'line-through'
                }}>
                  原价 ¥{plan.originalPrice}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#8A94B3',
                  marginTop: '4px'
                }}>
                  {plan.duration}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                {plan.features.map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <span style={{ 
                      color: '#10B981', 
                      marginRight: '12px',
                      fontSize: '16px'
                    }}>
                      ✓
                    </span>
                    <span style={{ color: '#EAEBF0', fontSize: '14px' }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handlePurchase(plan.id, 'alipay')}
                  disabled={loading === plan.id}
                  style={{
                    flex: 1,
                    background: plan.popular 
                      ? 'linear-gradient(135deg, #C8B6E2 0%, #8A94B3 100%)'
                      : 'rgba(200, 182, 226, 0.1)',
                    color: plan.popular ? '#1A1D33' : '#C8B6E2',
                    border: plan.popular ? 'none' : '1px solid #C8B6E2',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: loading === plan.id ? 'not-allowed' : 'pointer',
                    opacity: loading === plan.id ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading === plan.id ? '创建订单中...' : '支付宝支付'}
                </button>
                
                <button
                  onClick={() => handlePurchase(plan.id, 'wechat')}
                  disabled={loading === plan.id}
                  style={{
                    flex: 1,
                    background: 'rgba(76, 85, 138, 0.2)',
                    color: '#EAEBF0',
                    border: '1px solid rgba(76, 85, 138, 0.5)',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: loading === plan.id ? 'not-allowed' : 'pointer',
                    opacity: loading === plan.id ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading === plan.id ? '创建订单中...' : '微信支付'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 返回按钮 */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(76, 85, 138, 0.2)',
              color: '#8A94B3',
              border: '1px solid rgba(76, 85, 138, 0.5)',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            返回聊天
          </button>
        </div>
      </div>
    </div>
  );
}
