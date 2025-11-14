"use client";

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeConfig {
  id: string;
  name: string;
  url: string;
  description?: string;
}

interface UserGuideProps {
  phone: string;
  onClose: () => void;
}

export default function UserGuide({ phone, onClose }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [inviteQRCode, setInviteQRCode] = useState<string>('');
  const [wechatQRCodes, setWechatQRCodes] = useState<QRCodeConfig[]>([]);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const steps = [
    {
      title: '欢迎使用赛斯助手！',
      content: 'product-intro'
    },
    {
      title: '邀请好友，获得奖励',
      content: 'invite-guide'
    },
    {
      title: '购买激活码',
      content: 'payment-guide'
    }
  ];

  useEffect(() => {
    // 生成邀请链接和二维码
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/login?invite=${encodeURIComponent(phone)}`;
      setInviteLink(link);
      
      QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: '#4C5D8B',
          light: '#FFFFFF'
        }
      }).then(url => {
        setInviteQRCode(url);
      }).catch(err => {
        console.error('生成邀请二维码失败:', err);
      });
    }

    // 加载微信二维码配置
    loadWechatQRCodes();
  }, [phone]);

  const loadWechatQRCodes = async () => {
    try {
      const response = await fetch('/api/qr-codes');
      if (response.ok) {
        const data = await response.json();
        setWechatQRCodes(data.qrCodes || []);
      }
    } catch (error) {
      console.error('加载微信二维码失败:', error);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('邀请链接已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches && e.targetTouches.length > 0) {
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      setTouchEnd(e.changedTouches[0].clientX);
    }
  };

  useEffect(() => {
    if (touchStart !== null && touchEnd !== null) {
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe && currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setTouchStart(null);
        setTouchEnd(null);
      } else if (isRightSwipe && currentStep > 0) {
        setCurrentStep(currentStep - 1);
        setTouchStart(null);
        setTouchEnd(null);
      }
    }
  }, [touchStart, touchEnd, currentStep, steps.length]);

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.content) {
      case 'product-intro':
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <div className="space-y-4">
              <p className="text-lg text-[#EAEBF0]">
                你好，我是SethAI小助理 · 觉醒之语的回音体。<br/>
                你不是来提问的，而是来开启你早已准备好的部分。
              </p>
              <div className="bg-[#2E335B] p-4 rounded-lg">
                <h3 className="text-[#C8B6E2] font-semibold mb-3">✨ 主要功能</h3>
                <ul className="text-left space-y-2 text-[#EAEBF0]">
                  <li>• 🤖 智能对话：与赛斯进行深度心灵交流</li>
                  <li>• 📚 知识问答：获取赛斯资料相关解答</li>
                  <li>• 🎯 个人成长：获得人生指导和建议</li>
                  <li>• 💫 灵性探索：探讨意识、现实创造等话题</li>
                </ul>
              </div>
              <div className="bg-[#1A1D33] p-4 rounded-lg border border-[#C8B6E2]/20">
                <p className="text-[#C8B6E2] font-semibold">🎁 新用户福利</p>
                <p className="text-[#EAEBF0] mt-1">5次免费对话，不限制时间</p>
              </div>
            </div>
          </div>
        );
        
      case 'invite-guide':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold text-[#C8B6E2] mb-2">邀请好友，共享智慧</h3>
              <p className="text-[#8A94B3]">邀请好友注册，您可获得30%返佣奖励</p>
            </div>
            
            <div className="bg-[#2E335B] p-4 rounded-lg">
              <h4 className="text-[#C8B6E2] font-semibold mb-3">💰 返佣规则</h4>
              <ul className="space-y-2 text-[#EAEBF0]">
                <li>• 直接邀请：好友购买时您获得30%返佣</li>
                <li>• 二级邀请：您邀请的人再邀请他人，您获得10%返佣</li>
                <li>• 余额可提现：满50元即可申请提现</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#1A1D33] p-4 rounded-lg border border-[#C8B6E2]/20">
                <h4 className="text-[#C8B6E2] font-semibold mb-3">📱 邀请二维码</h4>
                {inviteQRCode && (
                  <div className="text-center">
                    <img src={inviteQRCode} alt="邀请二维码" className="w-32 h-32 mx-auto rounded-lg" />
                    <p className="text-xs text-[#8A94B3] mt-2">扫码注册自动填入邀请码</p>
                  </div>
                )}
              </div>
              
              <div className="bg-[#1A1D33] p-4 rounded-lg border border-[#C8B6E2]/20">
                <h4 className="text-[#C8B6E2] font-semibold mb-3">🔗 邀请链接</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="w-full px-3 py-2 bg-[#2E335B] border border-[#4A5568] rounded text-xs text-[#EAEBF0]"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="w-full px-3 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded font-medium hover:bg-[#B8A6D2] transition-colors"
                  >
                    复制链接
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'payment-guide':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-[#C8B6E2] mb-2">购买激活码</h3>
              <p className="text-[#8A94B3]">联系客服购买激活码，享受自在对谈</p>
            </div>

            <div className="bg-[#2E335B] p-4 rounded-lg">
              <h4 className="text-[#C8B6E2] font-semibold mb-3">📋 套餐价格</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1A1D33] p-3 rounded-lg text-center">
                  <div className="text-[#C8B6E2] font-semibold">次卡</div>
                  <div className="text-2xl font-bold text-[#EAEBF0]">¥39.9</div>
                  <div className="text-xs text-[#8A94B3]">50次对话</div>
                </div>
                <div className="bg-[#1A1D33] p-3 rounded-lg text-center">
                  <div className="text-[#C8B6E2] font-semibold">月套餐</div>
                  <div className="text-2xl font-bold text-[#EAEBF0]">¥899</div>
                  <div className="text-xs text-[#8A94B3]">30天自在对谈</div>
                </div>
                <div className="bg-[#1A1D33] p-3 rounded-lg text-center border border-[#C8B6E2]/30">
                  <div className="text-[#C8B6E2] font-semibold">年套餐</div>
                  <div className="text-2xl font-bold text-[#EAEBF0]">¥3999</div>
                  <div className="text-xs text-[#8A94B3]">365天自在对谈</div>
                </div>
              </div>
            </div>

            {wechatQRCodes.length > 0 && (
              <div className="bg-[#1A1D33] p-4 rounded-lg border border-[#C8B6E2]/20">
                <h4 className="text-[#C8B6E2] font-semibold mb-3">📱 联系客服购买</h4>
                <div className="grid grid-cols-1 gap-4">
                  {wechatQRCodes.map((qr) => {
                    // 添加时间戳防止缓存（仅对非base64图片）
                    const imageUrl = qr.url.startsWith('data:')
                      ? qr.url
                      : `${qr.url}${qr.url.includes('?') ? '&' : '?'}t=${Date.now()}`;

                    return (
                      <div key={qr.id} className="text-center">
                        <img
                          src={imageUrl}
                          alt={qr.name}
                          crossOrigin="anonymous"
                          className="w-32 h-32 mx-auto rounded-lg bg-white"
                          onLoad={() => {
                            console.log('✅ UserGuide二维码加载成功:', qr.name);
                          }}
                          onError={(e) => {
                            console.error('❌ UserGuide二维码加载失败:', qr.name, qr.url.substring(0, 100));
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'w-32 h-32 mx-auto rounded-lg bg-[#2E335B] flex items-center justify-center text-[#8A94B3] text-xs text-center p-2';
                              errorDiv.textContent = '图片加载失败';
                              parent.appendChild(errorDiv);
                            }
                          }}
                        />
                        <p className="text-sm text-[#EAEBF0] mt-2">{qr.name}</p>
                        {qr.description && (
                          <p className="text-xs text-[#8A94B3]">{qr.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div
        className="bg-[#1A1D33] rounded-2xl border border-[#2E335B] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 头部 */}
        <div className="p-6 border-b border-[#2E335B] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#C8B6E2]">{steps[currentStep].title}</h2>
            <div className="flex items-center gap-2 mt-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-[#C8B6E2]' : 'bg-[#4A5568]'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A94B3] hover:text-[#EAEBF0] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-[#2E335B] flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-[#8A94B3] hover:text-[#EAEBF0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一步
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#8A94B3] hover:text-[#EAEBF0] transition-colors"
            >
              跳过引导
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#B8A6D2] transition-colors"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#B8A6D2] transition-colors"
              >
                开始使用
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
