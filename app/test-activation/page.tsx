'use client';

import { useState, useEffect } from 'react';

export default function TestActivationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🧪 测试页面：开始加载激活码数据...');
      
      const res = await fetch('/api/test-activation-codes');
      console.log('🧪 测试页面：API响应状态:', res.status);
      
      if (res.ok) {
        const result = await res.json();
        console.log('🧪 测试页面：API返回数据:', result);
        setData(result);
      } else {
        const errorText = await res.text();
        console.error('🧪 测试页面：API错误:', errorText);
        setError(`API错误: ${res.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('🧪 测试页面：请求失败:', err);
      setError(`请求失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testAdminAPI = async () => {
    try {
      console.log('🧪 测试管理员API...');
      const res = await fetch('/api/admin/activation-codes');
      console.log('🧪 管理员API响应状态:', res.status);
      
      if (res.ok) {
        const result = await res.json();
        console.log('🧪 管理员API返回数据:', result);
        alert(`管理员API成功！激活码数量: ${result.codes?.length || 0}`);
      } else {
        const errorText = await res.text();
        console.error('🧪 管理员API错误:', errorText);
        alert(`管理员API错误: ${res.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('🧪 管理员API请求失败:', err);
      alert(`管理员API请求失败: ${err}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>🧪 激活码数据测试</h1>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 激活码数据测试</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadData} style={{ marginRight: '10px', padding: '10px' }}>
          🔄 重新加载测试数据
        </button>
        <button onClick={testAdminAPI} style={{ padding: '10px' }}>
          🔍 测试管理员API
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <h3>❌ 错误信息:</h3>
          <pre>{error}</pre>
        </div>
      )}

      {data && (
        <div>
          <h3>✅ 测试结果:</h3>
          <p><strong>成功:</strong> {data.success ? '是' : '否'}</p>
          <p><strong>激活码数量:</strong> {data.count || 0}</p>
          
          {data.codes && data.codes.length > 0 && (
            <div>
              <h4>激活码列表:</h4>
              <table style={{ border: '1px solid #ccc', borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>激活码</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>套餐ID</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>是否使用</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {data.codes.map((code: any, index: number) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{code.code}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{code.plan_id}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{code.is_used ? '是' : '否'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{new Date(code.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h4>完整数据:</h4>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
