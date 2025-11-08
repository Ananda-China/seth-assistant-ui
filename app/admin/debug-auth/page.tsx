"use client";

import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const getCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  const checkAuth = async () => {
    try {
      const adminToken = getCookieValue('admin_token');
      const allCookies = document.cookie;

      const info: any = {
        hasAdminToken: !!adminToken,
        adminTokenLength: adminToken?.length || 0,
        adminTokenPreview: adminToken ? adminToken.substring(0, 20) + '...' : 'N/A',
        allCookies: allCookies || 'No cookies found',
        timestamp: new Date().toISOString()
      };

      // 测试API调用
      if (adminToken) {
        try {
          const response = await fetch('/api/admin/custom-ai-configs', {
            headers: {
              'x-admin-token': adminToken
            }
          });
          
          info.apiTest = {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          };

          if (response.ok) {
            const data = await response.json();
            info.apiTest.data = data;
          } else {
            const error = await response.text();
            info.apiTest.error = error;
          }
        } catch (error) {
          info.apiTest = {
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      setDebugInfo(info);
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1D3A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">管理员认证调试</h1>
        
        <div className="bg-[#252952] rounded-lg p-6 mb-4">
          <button
            onClick={checkAuth}
            className="px-4 py-2 bg-[#C8B6E2] text-[#1A1D3A] rounded-lg hover:bg-[#D4C4E8] mb-4"
          >
            重新检查
          </button>

          {loading ? (
            <p className="text-[#8A94B3]">检查中...</p>
          ) : (
            <pre className="text-[#EAEBF0] text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-[#252952] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">解决方案</h2>
          <div className="space-y-3 text-[#EAEBF0]">
            <div>
              <strong className="text-[#C8B6E2]">1. 如果没有 admin_token：</strong>
              <p className="text-sm text-[#8A94B3] ml-4">
                请先登录管理员账户：<a href="/admin/login" className="text-[#C8B6E2] underline">前往登录</a>
              </p>
            </div>
            
            <div>
              <strong className="text-[#C8B6E2]">2. 如果 token 已过期：</strong>
              <p className="text-sm text-[#8A94B3] ml-4">
                请重新登录管理员账户
              </p>
            </div>
            
            <div>
              <strong className="text-[#C8B6E2]">3. 如果 API 返回 403：</strong>
              <p className="text-sm text-[#8A94B3] ml-4">
                Token 无效或已过期，请重新登录
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <a
            href="/admin/login"
            className="px-4 py-2 bg-[#C8B6E2] text-[#1A1D3A] rounded-lg hover:bg-[#D4C4E8]"
          >
            前往登录
          </a>
          <a
            href="/admin"
            className="px-4 py-2 bg-[#3A416B] text-[#EAEBF0] rounded-lg hover:bg-[#4A5180]"
          >
            返回后台
          </a>
        </div>
      </div>
    </div>
  );
}

