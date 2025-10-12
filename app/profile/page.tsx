"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  phone: string;
  nickname: string;
  inviteCode: string;
  balance: number;
  totalCommission: number;
  invitedCount: number;
}

interface Permission {
  isPaidUser: boolean;
  isTrialActive: boolean;
  remainingDays: number;
  chatLimit: number;
  usedChats: number;
}

interface QRCodeConfig {
  id: string;
  name: string;
  url: string;
  description?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [permission, setPermission] = useState<Permission | null>(null);
  const [qrCodes, setQRCodes] = useState<QRCodeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadQRCodes();
  }, []);

  const loadUserData = async () => {
    try {
      // 获取用户信息
      const userRes = await fetch('/api/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUserInfo(userData);

      // 获取权限信息
      const permRes = await fetch('/api/user/permission');
      if (permRes.ok) {
        const permData = await permRes.json();
        setPermission(permData.data);
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQRCodes = async () => {
    try {
      const response = await fetch('/api/qr-codes');
      if (response.ok) {
        const data = await response.json();
        setQRCodes(data.qrCodes || []);
      }
    } catch (error) {
      console.error('加载二维码失败:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const copyInviteCode = () => {
    if (userInfo?.inviteCode) {
      navigator.clipboard.writeText(userInfo.inviteCode).then(() => {
        alert('邀请码已复制到剪贴板');
      }).catch(() => {
        alert('复制失败，请手动复制');
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1D33] to-[#2E335B] flex items-center justify-center">
        <div className="text-[#EAEBF0]">加载中...</div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1D33] to-[#2E335B] flex items-center justify-center">
        <div className="text-[#EAEBF0]">用户信息加载失败</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1D33] to-[#2E335B] text-[#EAEBF0]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-[#2E335B] hover:bg-[#3A4068] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-[#C8B6E2]">个人中心</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：用户信息 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
              <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">基本信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#8A94B3]">手机号</span>
                  <span>{userInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A94B3]">昵称</span>
                  <span>{userInfo.nickname || '未设置'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8A94B3]">邀请码</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{userInfo.inviteCode}</span>
                    <button
                      onClick={copyInviteCode}
                      className="px-2 py-1 bg-[#C8B6E2] text-[#1A1D33] rounded text-xs hover:bg-[#B8A6D2] transition-colors"
                    >
                      复制
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 账户状态 */}
            {permission && (
              <div className="bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
                <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">账户状态</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8A94B3]">当前状态</span>
                    <span className={
                      permission.isPaidUser ? 'text-[#10B981]' : 
                      permission.isTrialActive ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                    }>
                      {permission.isPaidUser ? '付费用户' : 
                       permission.isTrialActive ? `试用期 (${permission.remainingDays}天)` : '试用已结束'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A94B3]">今日聊天</span>
                    <span>{permission.usedChats}/{permission.chatLimit}</span>
                  </div>
                </div>
                
                {!permission.isPaidUser && (
                  <div className="mt-4 pt-4 border-t border-[#2E335B]">
                    <a
                      href="/pricing"
                      className="block w-full py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg text-center font-medium hover:bg-[#B8A6D2] transition-colors"
                    >
                      升级到付费版本
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* 推广收益 */}
            <div className="bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
              <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">推广收益</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#8A94B3]">账户余额</span>
                  <span className="text-[#10B981] font-semibold">¥{(userInfo.balance / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A94B3]">累计收益</span>
                  <span>¥{(userInfo.totalCommission / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A94B3]">邀请人数</span>
                  <span>{userInfo.invitedCount}人</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：客服联系 */}
          <div className="space-y-6">
            {/* 客服二维码 */}
            <div className="bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
              <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">联系客服</h2>
              <div className="text-center">
                <p className="text-[#8A94B3] mb-4">
                  购买激活码、技术支持、意见反馈
                </p>
                
                {qrCodes.length > 0 ? (
                  <div className="space-y-4">
                    {qrCodes.map((qr) => (
                      <div key={qr.id} className="bg-[#2E335B] rounded-lg p-4">
                        <h3 className="text-[#C8B6E2] font-medium mb-2">{qr.name}</h3>
                        <img 
                          src={qr.url} 
                          alt={qr.name}
                          className="w-48 h-48 mx-auto rounded-lg border border-[#4A5568]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {qr.description && (
                          <p className="text-sm text-[#8A94B3] mt-2">{qr.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#2E335B] rounded-lg p-8">
                    <div className="text-4xl mb-4">📱</div>
                    <p className="text-[#8A94B3]">客服二维码配置中...</p>
                    <p className="text-sm text-[#6B7280] mt-2">
                      请联系管理员在后台配置客服二维码
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 购买指引 */}
            <div className="bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
              <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">购买指引</h2>
              <div className="space-y-3 text-sm text-[#8A94B3]">
                <div className="flex items-start gap-2">
                  <span className="text-[#C8B6E2] font-semibold">1.</span>
                  <span>扫描上方客服二维码，添加客服微信</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#C8B6E2] font-semibold">2.</span>
                  <span>告知客服您需要购买的套餐类型</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#C8B6E2] font-semibold">3.</span>
                  <span>完成付款后，客服会提供激活码</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#C8B6E2] font-semibold">4.</span>
                  <span>在聊天页面输入激活码即可激活套餐</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-[#2E335B] rounded-lg">
                <div className="text-sm">
                  <div className="text-[#C8B6E2] font-semibold mb-1">套餐价格</div>
                  <div className="text-[#8A94B3]">月套餐：¥999 | 年套餐：¥3999</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
