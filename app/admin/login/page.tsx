'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const data = await response.json();
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#2E335B] to-[#23284A] text-[#EAEBF0]">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-lg" style={{ background: '#1A1D33' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif-brand text-[#C8B6E2] mb-2">管理员登录</h1>
          <p className="text-sm text-[#8A94B3]">赛斯助手后台管理系统</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm mb-2 text-[#EAEBF0]">用户名</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-[#2E335B] border-none text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2] transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入管理员用户名"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2 text-[#EAEBF0]">密码</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-[#2E335B] border-none text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#C8B6E2] to-[#A78BDA] text-[#1A1D33] font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-[#8A94B3] hover:text-[#C8B6E2] transition-colors">
            返回首页
          </a>
        </div>
      </div>
    </main>
  );
}
