"use client";

import { useState } from 'react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const menuItems = [
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'analytics', label: '数据统计', icon: '📊' },
    { id: 'content', label: '内容管理', icon: '💬' },
    { id: 'payments', label: '支付管理', icon: '💰' },
    { id: 'activation', label: '激活码管理', icon: '🎫' }
  ];

  return (
    <aside
      className="w-64 bg-[#1A1D33] border-r border-[#2E335B] flex flex-col"
      style={{
        position: 'static',
        top: 'auto',
        left: 'auto',
        height: '100vh',
        width: '256px',
        background: '#1A1D33',
        backdropFilter: 'none',
        borderRight: '1px solid #2E335B',
        padding: '0',
        margin: '0',
        zIndex: 'auto'
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-[#2E335B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C8B6E2] rounded-lg flex items-center justify-center">
            <span className="text-[#1A1D33] font-bold text-lg">S</span>
          </div>
          <div>
            <div className="font-serif-brand text-lg text-[#C8B6E2]">赛斯助手</div>
            <div className="text-xs text-[#8A94B3]">管理后台</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  activeTab === item.id
                    ? 'bg-[#C8B6E2] text-[#1A1D33] shadow-lg'
                    : 'text-[#EAEBF0] hover:bg-[#2E335B] hover:text-[#C8B6E2]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#2E335B]">
        <div className="text-xs text-[#8A94B3] text-center">
          版本 1.0.0
        </div>
      </div>
    </aside>
  );
}
