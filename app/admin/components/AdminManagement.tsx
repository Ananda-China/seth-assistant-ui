'use client';

import { useState } from 'react';


interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}



export default function AdminManagement() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 修改密码表单状态
  const [changePasswordForm, setChangePasswordForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      showMessage('error', '新密码和确认密码不匹配');
      return;
    }

    if (changePasswordForm.newPassword.length < 8) {
      showMessage('error', '新密码长度不能少于8位');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: changePasswordForm.currentPassword,
          newPassword: changePasswordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', '密码修改成功！');
        setChangePasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showMessage('error', data.message || '密码修改失败');
      }
    } catch (error) {
      showMessage('error', '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EAEBF0]">管理功能</h1>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-900/20 border-green-500/30 text-green-400'
            : 'bg-red-900/20 border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-[#1A1D33] rounded-xl border border-[#2E335B] overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
            {/* 当前密码 */}
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                当前密码 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={changePasswordForm.currentPassword}
                onChange={(e) => setChangePasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-4 py-3 bg-[#2E335B] border border-[#3A4063] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2] transition-colors"
                placeholder="请输入当前密码"
                required
              />
            </div>

            {/* 新密码 */}
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                新密码 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={changePasswordForm.newPassword}
                onChange={(e) => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-3 bg-[#2E335B] border border-[#3A4063] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2] transition-colors"
                placeholder="请输入新密码（至少8位）"
                required
              />
            </div>

            {/* 确认新密码 */}
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                确认新密码 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={changePasswordForm.confirmPassword}
                onChange={(e) => setChangePasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 bg-[#2E335B] border border-[#3A4063] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2] transition-colors"
                placeholder="请再次输入新密码"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#D4C4E8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '修改中...' : '修改密码'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
