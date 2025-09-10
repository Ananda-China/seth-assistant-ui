'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  phone: string;
  nickname: string;
  status: 'active' | 'suspended';
  subscription_type: string;
  is_paid_user?: boolean;
  created_at: number;
  last_login: number;
  invite_code: string;
  invited_by: string | null;
  total_conversations: number;
  total_messages: number;
  total_tokens: number;
  balance?: number;
  total_commission?: number;
  total_withdrawn?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // 计算统计数据
  const stats = {
    total: pagination.total,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    paid: users.filter(u => u.is_paid_user || (u.subscription_type && u.subscription_type !== 'free')).length
  };

  // 获取用户数据
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新用户状态
  const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      setUpdatingUser(userId);
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          status: newStatus
        })
      });

      if (response.ok) {
        // 更新本地状态
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ));
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    } finally {
      setUpdatingUser(null);
    }
  };

  // 搜索和过滤
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  // 分页
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 初始加载和依赖变化时重新获取数据
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit]);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8A94B3]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1A1D33] p-6 rounded-xl border border-[#2E335B] hover:border-[#C8B6E2]/30 transition-colors">
          <div className="text-3xl font-bold text-[#C8B6E2] mb-2">{stats.total}</div>
          <div className="text-sm text-[#8A94B3] font-medium">总用户数</div>
        </div>
        <div className="bg-[#1A1D33] p-6 rounded-xl border border-[#2E335B] hover:border-green-400/30 transition-colors">
          <div className="text-3xl font-bold text-green-400 mb-2">{stats.active}</div>
          <div className="text-sm text-[#8A94B3] font-medium">活跃用户</div>
        </div>
        <div className="bg-[#1A1D33] p-6 rounded-xl border border-[#2E335B] hover:border-yellow-400/30 transition-colors">
          <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.suspended}</div>
          <div className="text-sm text-[#8A94B3] font-medium">暂停用户</div>
        </div>
        <div className="bg-[#1A1D33] p-6 rounded-xl border border-[#2E335B] hover:border-blue-400/30 transition-colors">
          <div className="text-3xl font-bold text-blue-400 mb-2">{stats.paid}</div>
          <div className="text-sm text-[#8A94B3] font-medium">付费用户</div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-[#1A1D33] p-6 rounded-xl border border-[#2E335B]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#8A94B3] mb-2">搜索用户</label>
            <input
              type="text"
              placeholder="搜索手机号、昵称或邀请码..."
              className="w-full px-4 py-3 bg-[#2E335B] border border-[#3A416B] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:border-[#C8B6E2] focus:outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="lg:w-48">
            <label className="block text-sm font-medium text-[#8A94B3] mb-2">状态筛选</label>
            <select
              className="w-full px-4 py-3 bg-[#2E335B] border border-[#3A416B] rounded-lg text-[#EAEBF0] focus:border-[#C8B6E2] focus:outline-none transition-colors"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="suspended">暂停</option>
            </select>
          </div>
          <div className="lg:w-32 flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-6 py-3 bg-[#C8B6E2] text-[#1A1D33] rounded-lg hover:bg-[#B8A6D2] transition-colors font-medium"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-[#1A1D33] rounded-xl overflow-hidden border border-[#2E335B]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-[#2E335B]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  订阅状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  邀请关系
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  使用统计
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  财务信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E335B]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#2E335B]/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="font-medium text-[#EAEBF0] text-sm" title={user.nickname || '未设置昵称'}>
                        {user.nickname || '未设置昵称'}
                      </div>
                      <div className="text-sm text-[#8A94B3] font-mono">{user.phone}</div>
                      <div className="text-xs text-[#8A94B3]">
                        注册：{new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <div className="text-sm text-[#EAEBF0] font-medium">
                        {user.subscription_type === 'free' ? '免费版' :
                         user.subscription_type === 'monthly' ? '月套餐' :
                         user.subscription_type === 'yearly' ? '年套餐' : '其他套餐'}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                        user.subscription_type !== 'free'
                          ? 'bg-green-900/20 text-green-400'
                          : 'bg-gray-900/20 text-gray-400'
                      }`}>
                        {user.subscription_type !== 'free' ? '付费' : '免费'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="text-sm text-[#EAEBF0]">
                        邀请码：<span className="font-mono text-[#C8B6E2] text-xs">{user.invite_code}</span>
                      </div>
                      <div className="text-xs text-[#8A94B3]" title={user.invited_by || '无'}>
                        邀请人：{user.invited_by || '无'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs text-[#8A94B3] space-y-1">
                      <div>对话：<span className="text-[#EAEBF0] font-medium">{user.total_conversations}</span></div>
                      <div>消息：<span className="text-[#EAEBF0] font-medium">{user.total_messages}</span></div>
                      <div>Token：<span className="text-[#EAEBF0] font-medium">{user.total_tokens}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs text-[#8A94B3] space-y-1">
                      <div>余额：<span className="text-green-400 font-medium">¥{(user.balance || 0).toFixed(2)}</span></div>
                      <div>佣金：<span className="text-blue-400 font-medium">¥{(user.total_commission || 0).toFixed(2)}</span></div>
                      <div>已提现：<span className="text-yellow-400 font-medium">¥{(user.total_withdrawn || 0).toFixed(2)}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-900/20 text-green-400'
                        : 'bg-yellow-900/20 text-yellow-400'
                    }`}>
                      {user.status === 'active' ? '活跃' : '暂停'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {user.status === 'active' ? (
                      <button
                        onClick={() => updateUserStatus(user.id, 'suspended')}
                        disabled={updatingUser === user.id}
                        className="px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-600/30 transition-colors disabled:opacity-50"
                      >
                        {updatingUser === user.id ? '处理中...' : '暂停'}
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUserStatus(user.id, 'active')}
                        disabled={updatingUser === user.id}
                        className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg text-xs hover:bg-green-600/30 transition-colors disabled:opacity-50"
                      >
                        {updatingUser === user.id ? '处理中...' : '激活'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-[#1A1D33] p-6 rounded-xl border border-[#2E335B] gap-4">
          <div className="text-sm text-[#8A94B3] font-medium">
            显示第 <span className="text-[#EAEBF0] font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="text-[#EAEBF0] font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> 条，
            共 <span className="text-[#EAEBF0] font-semibold">{pagination.total}</span> 条
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-4 py-2 bg-[#2E335B] text-[#EAEBF0] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3A416B] transition-colors font-medium"
            >
              上一页
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2E335B] rounded-lg">
              <span className="text-[#EAEBF0] font-semibold">{pagination.page}</span>
              <span className="text-[#8A94B3]">/</span>
              <span className="text-[#8A94B3]">{pagination.pages}</span>
            </div>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-4 py-2 bg-[#2E335B] text-[#EAEBF0] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3A416B] transition-colors font-medium"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
