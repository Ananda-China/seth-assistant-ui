'use client';

import { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  title: string;
  user: string;
  status: string;
  created_at: number;
  updated_at: number;
  total_messages: number;
  user_messages: number;
  ai_messages: number;
  total_tokens: number;
  preview: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    created_at: number;
    token_usage: number;
  }>;
  dify_conversation_id: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ContentManagement() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [updatingConversation, setUpdatingConversation] = useState<string | null>(null);
  const [showMessageDetail, setShowMessageDetail] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  // 计算统计数据
  const stats = {
    total: conversations.length, // 使用实际获取的对话数量，而不是分页总数
    normal: conversations.filter(c => c.status === 'active').length,
    flagged: conversations.filter(c => c.status === 'flagged').length,
    blocked: conversations.filter(c => c.status === 'blocked').length,
    totalMessages: conversations.reduce((sum, c) => sum + (c.total_messages || 0), 0)
  };

  // 获取聊天记录数据
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(userFilter && { user: userFilter })
      });

      const response = await fetch(`/api/admin/content-supabase?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新对话状态
  const updateConversationStatus = async (conversationId: string, newStatus: string) => {
    try {
      setUpdatingConversation(conversationId);
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          status: newStatus
        })
      });

      if (response.ok) {
        // 更新本地状态
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId ? { ...conv, status: newStatus } : conv
        ));
      }
    } catch (error) {
      console.error('Failed to update conversation status:', error);
    } finally {
      setUpdatingConversation(null);
    }
  };

  // 重命名对话标题
  const renameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          title: newTitle
        })
      });

      if (response.ok) {
        // 更新本地状态
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        ));
        setEditingTitle(null);
        setEditingTitleValue('');
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  // 开始编辑标题
  const startEditingTitle = (conversation: Conversation) => {
    setEditingTitle(conversation.id);
    setEditingTitleValue(conversation.title);
  };

  // 保存标题编辑
  const saveTitleEdit = (conversationId: string) => {
    if (editingTitleValue.trim()) {
      renameConversation(conversationId, editingTitleValue.trim());
    }
  };

  // 取消标题编辑
  const cancelTitleEdit = () => {
    setEditingTitle(null);
    setEditingTitleValue('');
  };

  // 批量更新状态
  const bulkUpdateStatus = async (status: string) => {
    if (selectedConversations.length === 0) return;

    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_update',
          id: selectedConversations,
          status
        })
      });

      if (response.ok) {
        // 更新本地状态
        setConversations(prev => prev.map(conv => 
          selectedConversations.includes(conv.id) ? { ...conv, status } : conv
        ));
        // 清空选择
        setSelectedConversations([]);
      }
    } catch (error) {
      console.error('Failed to bulk update status:', error);
    }
  };

  // 删除对话
  const deleteConversation = async (conversationId: string) => {
    if (!confirm('确定要删除这个对话吗？此操作不可恢复。')) return;

    try {
      const response = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conversationId })
      });

      if (response.ok) {
        // 从本地状态中移除
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // 搜索和过滤
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchConversations();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchConversations();
  };

  const handleUserFilter = (user: string) => {
    setUserFilter(user);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchConversations();
  };

  // 分页
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 选择对话
  const toggleConversationSelection = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedConversations.length === conversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(conversations.map(conv => conv.id));
    }
  };

  // 初始加载
  useEffect(() => {
    fetchConversations();
  }, []);

  // 当分页参数变化时重新获取数据
  useEffect(() => {
    if (pagination?.page && pagination?.limit) {
      fetchConversations();
    }
  }, [pagination?.page, pagination?.limit]);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8A94B3]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-2xl font-bold text-[#C8B6E2]">{stats.total}</div>
          <div className="text-sm text-[#8A94B3]">总对话数</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-2xl font-bold text-green-400">{stats.normal}</div>
          <div className="text-sm text-[#8A94B3]">正常对话</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-2xl font-bold text-yellow-400">{stats.flagged}</div>
          <div className="text-sm text-[#8A94B3]">标记对话</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-2xl font-bold text-red-400">{stats.blocked}</div>
          <div className="text-sm text-[#8A94B3]">屏蔽对话</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-2xl font-bold text-blue-400">{stats.totalMessages}</div>
          <div className="text-sm text-[#8A94B3]">总消息数</div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-[#1A1D33] p-4 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="搜索对话标题、内容或用户..."
              className="w-full px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0] placeholder-[#8A94B3]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="flagged">标记</option>
            <option value="blocked">屏蔽</option>
          </select>
          <input
            type="text"
            placeholder="按用户筛选..."
            className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0] placeholder-[#8A94B3]"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUserFilter(userFilter)}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg hover:opacity-90 transition-opacity"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedConversations.length > 0 && (
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[#EAEBF0]">
              已选择 {selectedConversations.length} 个对话
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateStatus('active')}
                className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm hover:bg-green-600/30 transition-colors"
              >
                标记为正常
              </button>
              <button
                onClick={() => bulkUpdateStatus('flagged')}
                className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm hover:bg-yellow-600/30 transition-colors"
              >
                标记为可疑
              </button>
              <button
                onClick={() => bulkUpdateStatus('blocked')}
                className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600/30 transition-colors"
              >
                标记为屏蔽
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 对话列表 */}
      <div className="bg-[#1A1D33] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#2E335B]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedConversations.length === conversations.length && conversations.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[#8A94B3] text-[#C8B6E2] focus:ring-[#C8B6E2]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  对话信息
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  使用统计
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E335B]">
              {conversations.map((conversation) => (
                <tr key={conversation.id} className="hover:bg-[#2E335B] transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedConversations.includes(conversation.id)}
                      onChange={() => toggleConversationSelection(conversation.id)}
                      className="rounded border-[#8A94B3] text-[#C8B6E2] focus:ring-[#C8B6E2]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      {editingTitle === conversation.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            className="flex-1 px-2 py-1 bg-[#2E335B] border-none rounded text-[#EAEBF0] text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && saveTitleEdit(conversation.id)}
                            onKeyDown={(e) => e.key === 'Escape' && cancelTitleEdit()}
                            autoFocus
                          />
                          <button
                            onClick={() => saveTitleEdit(conversation.id)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelTitleEdit}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="font-medium text-[#EAEBF0] cursor-pointer hover:text-[#C8B6E2] transition-colors flex items-center gap-2"
                             onClick={() => setShowMessageDetail(showMessageDetail === conversation.id ? null : conversation.id)}>
                          {conversation.title}
                          <span className="text-xs text-[#8A94B3]">
                            {showMessageDetail === conversation.id ? '点击收起' : '点击展开'}
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-[#8A94B3]">
                        {conversation.total_messages} 条消息
                      </div>
                      <div className="text-xs text-[#8A94B3]">
                        创建：{new Date(conversation.created_at).toLocaleDateString()}
                      </div>
                      
                      {/* 操作图标 - 放在右下角 */}
                      <div className="absolute bottom-0 right-0 flex gap-2">
                        <button
                          onClick={() => startEditingTitle(conversation)}
                          className="p-1 text-[#8A94B3] hover:text-[#C8B6E2] transition-colors"
                          title="重命名"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteConversation(conversation.id)}
                          className="p-1 text-[#8A94B3] hover:text-red-400 transition-colors"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {showMessageDetail === conversation.id && (
                        <div className="mt-3 p-3 bg-[#2E335B] rounded-lg max-h-96 overflow-y-auto">
                          <div className="space-y-3">
                            {conversation.messages && conversation.messages.length > 0 ? (
                              conversation.messages.map((message, index) => (
                                <div key={message.id} className={`p-3 rounded-lg ${
                                  message.role === 'user' 
                                    ? 'bg-[#1A1D33] border-l-4 border-[#C8B6E2]' 
                                    : 'bg-[#2E335B] border-l-4 border-[#8A94B3]'
                                }`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                      message.role === 'user' 
                                        ? 'bg-[#C8B6E2] text-[#1A1D33]' 
                                        : 'bg-[#8A94B3] text-[#1A1D33]'
                                    }`}>
                                      {message.role === 'user' ? '用户' : 'AI助手'}
                                    </span>
                                    <span className="text-xs text-[#8A94B3]">
                                      {new Date(message.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-sm text-[#EAEBF0] whitespace-pre-wrap">
                                    {message.content}
                                  </div>
                                  {message.token_usage > 0 && (
                                    <div className="text-xs text-[#8A94B3] mt-2">
                                      Token: {message.token_usage.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-[#8A94B3] bg-[#1A1D33] p-2 rounded">
                                {conversation.preview}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-[#EAEBF0]">
                        {conversation.user}
                      </div>
                      <div className="text-xs text-[#8A94B3]">
                        最后更新：{new Date(conversation.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-[#8A94B3] space-y-1">
                      <div>用户消息：{conversation.user_messages}</div>
                      <div>AI消息：{conversation.ai_messages}</div>
                      <div>Token：{conversation.total_tokens.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      conversation.status === 'active'
                        ? 'bg-green-900/20 text-green-400'
                        : conversation.status === 'flagged'
                        ? 'bg-yellow-900/20 text-yellow-400'
                        : 'bg-red-900/20 text-red-400'
                    }`}>
                      {conversation.status === 'active' ? '正常' : conversation.status === 'flagged' ? '标记' : '屏蔽'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <select
                        value={conversation.status}
                        onChange={(e) => updateConversationStatus(conversation.id, e.target.value)}
                        disabled={updatingConversation === conversation.id}
                        className="px-2 py-1 bg-[#2E335B] border-none rounded text-xs text-[#EAEBF0] disabled:opacity-50"
                      >
                        <option value="active">正常</option>
                        <option value="flagged">标记</option>
                        <option value="blocked">屏蔽</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-sm text-[#8A94B3]">
            显示第 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
            共 {pagination.total} 条
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 bg-[#2E335B] text-[#EAEBF0] rounded disabled:opacity-50 hover:bg-[#3A416B] transition-colors"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-[#EAEBF0]">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 bg-[#2E335B] text-[#EAEBF0] rounded disabled:opacity-50 hover:bg-[#3A416B] transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

