"use client";

import { Component, ErrorInfo, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 AdminDashboard，确保它只在客户端加载
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#2E335B] to-[#23284A]">
      <div className="text-[#EAEBF0] text-xl">加载中...</div>
    </div>
  )
});

interface AdminUser {
  username: string;
  role: string;
  exp: number;
}

interface AdminDashboardWrapperProps {
  currentUser: AdminUser;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('管理后台错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#2E335B] to-[#23284A]">
          <div className="text-center text-[#EAEBF0] p-8">
            <h1 className="text-2xl font-bold mb-4">出错了</h1>
            <p className="mb-4">管理后台加载失败，请刷新页面重试</p>
            <p className="text-sm text-gray-400 mb-4">
              错误信息: {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminDashboardWrapper({ currentUser }: AdminDashboardWrapperProps) {
  return (
    <ErrorBoundary>
      <main
        className="min-h-screen bg-gradient-to-b from-[#2E335B] to-[#23284A] text-[#EAEBF0]"
        style={{
          paddingTop: 0,
          marginTop: 0,
          position: 'relative',
          zIndex: 1
        }}
      >
        <AdminDashboard currentUser={currentUser} />
      </main>
    </ErrorBoundary>
  );
}

