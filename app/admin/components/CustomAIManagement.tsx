"use client";

import { useState, useEffect } from 'react';

interface CustomAIConfig {
  id: string;
  customer_id: string;
  dify_app_id: string;
  dify_api_url: string;
  knowledge_base_id?: string;
  system_prompt?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CustomAIManagement() {
  const [configs, setConfigs] = useState<CustomAIConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    customer_id: '',
    dify_app_id: '',
    dify_api_key: '',
    dify_api_url: '',
    knowledge_base_id: '',
    system_prompt: ''
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/custom-ai-configs', {
        credentials: 'include' // 确保发送cookie
      });

      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data || data.configs || []);
      } else if (response.status === 401 || response.status === 403) {
        setMsg('未找到管理员配置，请先登录管理员账户');
      } else {
        setMsg('加载配置失败');
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      setMsg('加载配置失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      // 验证必填字段
      if (!formData.customer_id.trim()) {
        setMsg('请输入客户ID');
        setLoading(false);
        return;
      }

      if (!formData.dify_app_id.trim()) {
        setMsg('请输入Dify应用ID');
        setLoading(false);
        return;
      }

      if (!formData.dify_api_key.trim()) {
        setMsg('请输入Dify API密钥');
        setLoading(false);
        return;
      }

      if (!formData.dify_api_url.trim()) {
        setMsg('请输入Dify API URL');
        setLoading(false);
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch('/api/admin/custom-ai-configs', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 确保发送cookie
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '操作失败');
      }

      setMsg(editingId ? '配置更新成功' : '配置创建成功');
      setShowAddForm(false);
      setEditingId(null);
      setFormData({
        customer_id: '',
        dify_app_id: '',
        dify_api_key: '',
        dify_api_url: '',
        knowledge_base_id: '',
        system_prompt: ''
      });
      await fetchConfigs();
    } catch (error) {
      setMsg('操作失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: CustomAIConfig) => {
    setEditingId(config.id);
    setFormData({
      customer_id: config.customer_id,
      dify_app_id: config.dify_app_id,
      dify_api_key: '',
      dify_api_url: config.dify_api_url,
      knowledge_base_id: config.knowledge_base_id || '',
      system_prompt: config.system_prompt || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return;

    try {
      const response = await fetch('/api/admin/custom-ai-configs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 确保发送cookie
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      setMsg('配置删除成功');
      await fetchConfigs();
    } catch (error) {
      setMsg('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      customer_id: '',
      dify_app_id: '',
      dify_api_key: '',
      dify_api_url: '',
      knowledge_base_id: '',
      system_prompt: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#C8B6E2]">定制化AI管理</h1>
          <p className="text-[#8A94B3] mt-1">管理客户的定制化AI实例配置</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#B8A6D2] transition-colors"
        >
          添加配置
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg ${msg.includes('成功') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <div className="flex items-center justify-between">
            <span>{msg}</span>
            {msg.includes('未找到管理员配置') && (
              <a
                href="/admin/login"
                className="ml-4 px-3 py-1 bg-[#C8B6E2] text-[#1A1D33] rounded text-sm hover:bg-[#B8A6D2]"
              >
                前往登录
              </a>
            )}
          </div>
        </div>
      )}

      {/* 添加/编辑表单 */}
      {showAddForm && (
        <div className="bg-[#1A1D33] p-6 rounded-xl border border-[#2E335B]">
          <h2 className="text-xl font-bold text-[#C8B6E2] mb-4">
            {editingId ? '编辑配置' : '添加新配置'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                  客户ID *
                </label>
                <input
                  type="text"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  placeholder="输入客户UUID"
                  className="w-full px-3 py-2 bg-[#2E335B] border border-[#3A416B] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2]"
                  disabled={!!editingId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                  Dify应用ID *
                </label>
                <input
                  type="text"
                  value={formData.dify_app_id}
                  onChange={(e) => setFormData({ ...formData, dify_app_id: e.target.value })}
                  placeholder="输入Dify应用ID"
                  className="w-full px-3 py-2 bg-[#2E335B] border border-[#3A416B] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                  Dify API密钥 *
                </label>
                <input
                  type="password"
                  value={formData.dify_api_key}
                  onChange={(e) => setFormData({ ...formData, dify_api_key: e.target.value })}
                  placeholder="输入Dify API密钥"
                  className="w-full px-3 py-2 bg-[#2E335B] border border-[#3A416B] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                  Dify API URL *
                </label>
                <input
                  type="text"
                  value={formData.dify_api_url}
                  onChange={(e) => setFormData({ ...formData, dify_api_url: e.target.value })}
                  placeholder="https://api.dify.ai/v1"
                  className="w-full px-3 py-2 bg-[#2E335B] border border-[#3A416B] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                  知识库ID (可选)
                </label>
                <input
                  type="text"
                  value={formData.knowledge_base_id}
                  onChange={(e) => setFormData({ ...formData, knowledge_base_id: e.target.value })}
                  placeholder="输入知识库ID"
                  className="w-full px-3 py-2 bg-[#2E335B] border border-[#3A416B] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-2">
                系统提示词 (可选)
              </label>
              <textarea
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="输入系统提示词"
                rows={4}
                className="w-full px-3 py-2 bg-[#2E335B] border border-[#3A416B] rounded-lg text-[#EAEBF0] placeholder-[#8A94B3] focus:outline-none focus:border-[#C8B6E2]"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-[#2E335B] text-[#EAEBF0] rounded-lg hover:bg-[#3A416B] transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#B8A6D2] transition-colors disabled:opacity-50"
              >
                {loading ? '处理中...' : editingId ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 配置列表 */}
      <div className="bg-[#1A1D33] rounded-xl border border-[#2E335B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E335B] bg-[#0F1119]">
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#C8B6E2]">客户ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#C8B6E2]">应用ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#C8B6E2]">API URL</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#C8B6E2]">状态</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#C8B6E2]">创建时间</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-[#C8B6E2]">操作</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id} className="border-b border-[#2E335B] hover:bg-[#0F1119] transition-colors">
                  <td className="px-6 py-3 text-sm text-[#EAEBF0]">{config.customer_id.substring(0, 8)}...</td>
                  <td className="px-6 py-3 text-sm text-[#EAEBF0]">{config.dify_app_id}</td>
                  <td className="px-6 py-3 text-sm text-[#EAEBF0]">{config.dify_api_url.substring(0, 30)}...</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${config.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {config.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-[#8A94B3]">{new Date(config.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(config)}
                      className="text-[#C8B6E2] hover:text-[#B8A6D2] transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {configs.length === 0 && (
          <div className="p-8 text-center text-[#8A94B3]">
            暂无配置，点击"添加配置"创建新的定制化AI配置
          </div>
        )}
      </div>
    </div>
  );
}

