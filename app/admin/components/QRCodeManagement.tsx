"use client";

import { useState, useEffect } from 'react';

interface QRCodeConfig {
  id: string;
  name: string;
  url: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function QRCodeManagement() {
  const [qrCodes, setQrCodes] = useState<QRCodeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQR, setEditingQR] = useState<QRCodeConfig | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    try {
      const response = await fetch('/api/admin/qr-codes');
      if (response.ok) {
        const data = await response.json();
        setQrCodes(data.qrCodes || []);
      }
    } catch (error) {
      console.error('加载二维码配置失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      console.log('🔧 提交二维码数据:', formData);

      // 数据验证
      if (!formData.name.trim()) {
        setMsg('请输入二维码名称');
        setLoading(false);
        return;
      }

      if (!formData.url.trim()) {
        setMsg('请输入二维码URL');
        setLoading(false);
        return;
      }

      // 验证URL格式（支持base64图片数据）
      if (!formData.url.startsWith('data:image/')) {
        try {
          new URL(formData.url);
        } catch {
          setMsg('请输入有效的URL格式或上传图片');
          setLoading(false);
          return;
        }
      }

      const url = '/api/admin/qr-codes';
      const method = editingQR ? 'PUT' : 'POST';

      // 对于PUT请求，需要包含ID
      const requestData = editingQR ? { ...formData, id: editingQR.id } : formData;

      console.log('🚀 发送请求:', { method, url, data: requestData });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('📡 响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 响应错误:', errorText);
        setMsg(`请求失败: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();
      console.log('✅ 响应结果:', result);

      if (result.success) {
        setMsg(editingQR ? '更新成功' : '添加成功');
        setShowAddForm(false);
        setEditingQR(null);
        setFormData({ name: '', url: '', description: '', is_active: true });
        await loadQRCodes();
      } else {
        setMsg(result.message || '操作失败');
      }
    } catch (error) {
      console.error('❌ 提交错误:', error);
      setMsg(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (qr: QRCodeConfig) => {
    setEditingQR(qr);
    setFormData({
      name: qr.name,
      url: qr.url,
      description: qr.description || '',
      is_active: qr.is_active
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个二维码配置吗？')) return;

    try {
      const response = await fetch(`/api/admin/qr-codes?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setMsg('删除成功');
        await loadQRCodes();
      } else {
        setMsg(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除错误:', error);
      setMsg('删除失败，请重试');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingQR(null);
    setFormData({ name: '', url: '', description: '', is_active: true });
    setMsg('');
  };

  // 图片上传处理
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setMsg('请选择图片文件');
      return;
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMsg('图片文件不能超过5MB');
      return;
    }

    setUploadingImage(true);
    setMsg('');

    try {
      // 转换为base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({ ...prev, url: base64 }));
        setUploadingImage(false);
        setMsg('图片上传成功');
      };
      reader.onerror = () => {
        setUploadingImage(false);
        setMsg('图片读取失败');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('图片上传失败:', error);
      setUploadingImage(false);
      setMsg('图片上传失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#C8B6E2]">微信二维码管理</h1>
          <p className="text-[#8A94B3] mt-1">管理用于用户引导的微信二维码</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#B8A6D2] transition-colors"
        >
          添加二维码
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg ${msg.includes('成功') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      {/* 添加/编辑表单 */}
      {showAddForm && (
        <div className="bg-[#1A1D33] p-6 rounded-xl border border-[#2E335B]">
          <h2 className="text-xl font-bold text-[#C8B6E2] mb-4">
            {editingQR ? '编辑二维码' : '添加二维码'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-2">名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-[#2E335B] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
                placeholder="例如：客服微信"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-2">二维码URL</label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.url}
                  onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-4 py-2 bg-[#2E335B] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
                  placeholder="https://example.com/qr-code.jpg 或上传图片"
                  required
                />

                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#8A94B3]">或</span>
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#4A5568] hover:bg-[#5A6578] rounded-lg cursor-pointer transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-[#EAEBF0]">
                      {uploadingImage ? '上传中...' : '上传图片'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* 图片预览 */}
                {formData.url && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-[#EAEBF0] mb-2">预览</label>
                    <div className="w-32 h-32 border border-[#4A5568] rounded-lg overflow-hidden bg-[#2E335B] flex items-center justify-center">
                      <img
                        src={formData.url}
                        alt="二维码预览"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="text-[#8A94B3] text-xs text-center">图片加载失败</div>';
                          }
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'block';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-2">描述（可选）</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 bg-[#2E335B] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
                placeholder="二维码用途说明"
                rows={3}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm text-[#EAEBF0]">启用此二维码</label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#B8A6D2] disabled:opacity-50"
              >
                {loading ? '保存中...' : (editingQR ? '更新' : '添加')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-[#4A5568] text-[#EAEBF0] rounded-lg font-medium hover:bg-[#5A6578]"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 二维码列表 */}
      <div className="bg-[#1A1D33] rounded-xl border border-[#2E335B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#2E335B]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">预览</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#8A94B3] uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E335B]">
              {qrCodes.map((qr) => (
                <tr key={qr.id} className="hover:bg-[#2E335B]/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-[#EAEBF0]">{qr.name}</div>
                      {qr.description && (
                        <div className="text-sm text-[#8A94B3]">{qr.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <img 
                      src={qr.url} 
                      alt={qr.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMkUzMzVCIi8+CjxwYXRoIGQ9Ik0zMiAyMEMyNi40NzcgMjAgMjIgMjQuNDc3IDIyIDMwQzIyIDM1LjUyMyAyNi40NzcgNDAgMzIgNDBDMzcuNTIzIDQwIDQyIDM1LjUyMyA0MiAzMEM0MiAyNC40NzcgMzcuNTIzIDIwIDMyIDIwWk0zMiAzNkMzMC44OTUgMzYgMzAgMzUuMTA1IDMwIDM0QzMwIDMyLjg5NSAzMC44OTUgMzIgMzIgMzJDMzMuMTA1IDMyIDM0IDMyLjg5NSAzNCAzNEMzNCAzNS4xMDUgMzMuMTA1IDM2IDMyIDM2WiIgZmlsbD0iIzhBOTRCMyIvPgo8L3N2Zz4K';
                      }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      qr.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {qr.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8A94B3]">
                    {new Date(qr.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(qr)}
                        className="text-[#C8B6E2] hover:text-[#B8A6D2] text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(qr.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {qrCodes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-[#8A94B3] text-lg mb-2">暂无二维码配置</div>
              <div className="text-[#8A94B3] text-sm">点击"添加二维码"开始配置</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
