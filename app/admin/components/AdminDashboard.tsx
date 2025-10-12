"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import UserManagement from './UserManagement';
import Analytics from './Analytics';
import ContentManagement from './ContentManagement';
import PaymentManagement from './PaymentManagement';
import ActivationManagement from './ActivationManagement';
import QRCodeManagement from './QRCodeManagement';
import AdminManagement from './AdminManagement';

interface AdminUser {
  username: string;
  role: string;
  exp: number;
}

interface AdminDashboardProps {
  currentUser: AdminUser;
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('users');
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <Analytics />;
      case 'content':
        return <ContentManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'activation':
        return <ActivationManagement />;
      case 'qrcodes':
        return <QRCodeManagement />;
      case 'admin':
        return <AdminManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="flex h-screen" style={{ position: 'relative', zIndex: 1 }}>
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col" style={{ marginLeft: 0, position: 'relative' }}>
        {/* 顶部导航栏 */}
        <header className="bg-[#1A1D33] px-6 py-4 border-b border-[#2E335B]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-serif-brand text-[#C8B6E2]">赛斯助手管理后台</h1>
              <p className="text-sm text-[#8A94B3]">欢迎回来，{currentUser.username}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#8A94B3]">
                角色：<span className="text-[#C8B6E2]">{currentUser.role}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#2E335B] text-[#EAEBF0] rounded-lg hover:bg-[#3A416B] transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </header>
        
        {/* 主要内容区域 */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
