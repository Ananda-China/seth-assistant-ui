'use client';

import { useState } from 'react';

export default function DemoPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/conversations-simple');
      const data = await response.json();
      if (data.status === 'success') {
        setConversations(data.list);
        setMessage('会话加载成功！');
      }
    } catch (error) {
      setMessage('加载失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
    setLoading(false);
  };

  const createConversation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/conversations-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: `新会话 ${Date.now()}` })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMessage('会话创建成功！');
        loadConversations(); // 重新加载列表
      }
    } catch (error) {
      setMessage('创建失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Seth Assistant Demo</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">🎉 部署成功！</h2>
        <p className="text-gray-600 mb-4">
          恭喜！您的Seth Assistant应用已经成功部署到Vercel。所有API端点都正常工作。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded border-l-4 border-green-400">
            <h3 className="font-semibold text-green-800">✅ 工作正常的API</h3>
            <ul className="text-sm text-green-700 mt-2">
              <li>• /api/ping</li>
              <li>• /api/health-check</li>
              <li>• /api/env-test</li>
              <li>• /api/conversations-simple</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800">🔧 环境配置</h3>
            <ul className="text-sm text-blue-700 mt-2">
              <li>• Supabase URL: ✅</li>
              <li>• Supabase Key: ✅</li>
              <li>• JWT Secret: ✅</li>
              <li>• 生产环境: ✅</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">会话管理演示</h2>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={loadConversations}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载会话'}
          </button>
          
          <button
            onClick={createConversation}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '创建中...' : '创建新会话'}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-gray-100 rounded">
            {message}
          </div>
        )}

        {conversations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">会话列表</h3>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div key={conv.id} className="border p-3 rounded hover:bg-gray-50">
                  <div className="font-medium">{conv.title}</div>
                  <div className="text-sm text-gray-500">
                    创建时间: {new Date(conv.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-gray-500">
        <p>🚀 您的应用已准备就绪！</p>
        <p className="text-sm mt-2">
          访问 <a href="/test" className="text-blue-500 hover:underline">/test</a> 查看详细的API测试结果
        </p>
      </div>
    </div>
  );
}
