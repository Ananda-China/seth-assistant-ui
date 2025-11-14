'use client';

import { useState, useEffect } from 'react';

type CustomAIConfig = {
  id: string;
  customer_id: string;
  dify_app_id: string;
  dify_api_url: string;
  knowledge_base_id: string | null;
  system_prompt: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  customer?: {
    phone: string;
    nickname: string | null;
  };
};

export default function CustomAIConfigManager() {
  const [configs, setConfigs] = useState<CustomAIConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    dify_app_id: '',
    dify_api_key: '',
    dify_api_url: '',
    knowledge_base_id: '',
    system_prompt: ''
  });

  // 获取配置列表
  const fetchConfigs = async () => {
    if (!adminToken) {
      alert('请先输入管理员令牌');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/custom-ai-configs', {
        headers: {
          'x-admin-token': adminToken
        }
      });

      if (!response.ok) {
        throw new Error('获取配置失败');
      }

      const data = await response.json();
      setConfigs(data.data || []);
    } catch (error) {
      alert('获取配置失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 创建或更新配置
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminToken) {
      alert('请先输入管理员令牌');
      return;
    }

    if (!formData.customer_id || !formData.dify_app_id || !formData.dify_api_key || !formData.dify_api_url) {
      alert('请填写所有必填字段');
      return;
    }

    setLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch('/api/admin/custom-ai-configs', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('操作失败');
      }

      alert(editingId ? '配置更新成功' : '配置创建成功');
      setShowForm(false);
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
      alert('操作失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 删除配置
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此配置吗？')) {
      return;
    }

    if (!adminToken) {
      alert('请先输入管理员令牌');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/custom-ai-configs?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken
        }
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      alert('配置删除成功');
      await fetchConfigs();
    } catch (error) {
      alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 编辑配置
  const handleEdit = (config: CustomAIConfig) => {
    setFormData({
      customer_id: config.customer_id,
      dify_app_id: config.dify_app_id,
      dify_api_key: '', // 不显示现有的API密钥
      dify_api_url: config.dify_api_url,
      knowledge_base_id: config.knowledge_base_id || '',
      system_prompt: config.system_prompt || ''
    });
    setEditingId(config.id);
    setShowForm(true);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">定制化AI配置管理</h2>

      {/* 管理员令牌输入 */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <label className="block text-sm font-medium mb-2">管理员令牌</label>
        <input
          type="password"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          placeholder="输入管理员令牌"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* 操作按钮 */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={fetchConfigs}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '加载中...' : '刷新列表'}
        </button>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              customer_id: '',
              dify_app_id: '',
              dify_api_key: '',
              dify_api_url: '',
              knowledge_base_id: '',
              system_prompt: ''
            });
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          {showForm ? '取消' : '新增配置'}
        </button>
      </div>

      {/* 表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">客户ID *</label>
              <input
                type="text"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                placeholder="客户UUID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dify应用ID *</label>
              <input
                type="text"
                value={formData.dify_app_id}
                onChange={(e) => setFormData({ ...formData, dify_app_id: e.target.value })}
                placeholder="Dify应用ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dify API密钥 *</label>
              <input
                type="password"
                value={formData.dify_api_key}
                onChange={(e) => setFormData({ ...formData, dify_api_key: e.target.value })}
                placeholder="Dify API密钥"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dify API URL *</label>
              <input
                type="text"
                value={formData.dify_api_url}
                onChange={(e) => setFormData({ ...formData, dify_api_url: e.target.value })}
                placeholder="https://api.dify.ai/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">知识库ID</label>
              <input
                type="text"
                value={formData.knowledge_base_id}
                onChange={(e) => setFormData({ ...formData, knowledge_base_id: e.target.value })}
                placeholder="知识库ID（可选）"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">系统提示词</label>
              <input
                type="text"
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="系统提示词（可选）"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '保存中...' : editingId ? '更新配置' : '创建配置'}
          </button>
        </form>
      )}

      {/* 配置列表 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">客户</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Dify应用ID</th>
              <th className="border border-gray-300 px-4 py-2 text-left">状态</th>
              <th className="border border-gray-300 px-4 py-2 text-left">创建时间</th>
              <th className="border border-gray-300 px-4 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config) => (
              <tr key={config.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  {config.customer?.nickname || config.customer?.phone || config.customer_id}
                </td>
                <td className="border border-gray-300 px-4 py-2">{config.dify_app_id}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <span className={`px-2 py-1 rounded text-sm ${config.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {config.is_active ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2">{new Date(config.created_at).toLocaleDateString()}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    onClick={() => handleEdit(config)}
                    className="mr-2 px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {configs.length === 0 && !loading && (
        <p className="text-center text-gray-500 mt-4">暂无配置</p>
      )}
    </div>
  );
}

