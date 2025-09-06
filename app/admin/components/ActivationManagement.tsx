"use client";

import { useEffect, useState } from 'react';

export default function ActivationManagement() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  // 激活码管理
  const [activationCodes, setActivationCodes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [generateCount, setGenerateCount] = useState(10);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  // 提现管理
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 加载套餐
      const plansRes = await fetch('/api/activation/plans');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
        if (plansData.plans && plansData.plans.length > 0) {
          setSelectedPlan(plansData.plans[0].id);
        }
      }

      // 加载激活码
      await loadActivationCodes();
      
      // 加载提现申请
      await loadWithdrawalRequests();
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const loadActivationCodes = async () => {
    try {
      const res = await fetch('/api/admin/activation-codes');
      if (res.ok) {
        const data = await res.json();
        setActivationCodes(data.codes || []);
      }
    } catch (error) {
      console.error('加载激活码失败:', error);
    }
  };

  const loadWithdrawalRequests = async () => {
    try {
      const res = await fetch('/api/admin/withdrawal-requests');
      if (res.ok) {
        const data = await res.json();
        setWithdrawalRequests(data.requests || []);
      }
    } catch (error) {
      console.error('加载提现申请失败:', error);
    }
  };

  const generateActivationCodes = async () => {
    if (!selectedPlan || !generateCount) {
      setMsg('请选择套餐和数量');
      return;
    }

    setLoading(true);
    setMsg('');
    
    try {
      const res = await fetch('/api/admin/generate-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan,
          count: generateCount
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMsg(`成功生成 ${data.codes.length} 个激活码`);
        setGeneratedCodes(data.codes);
        await loadActivationCodes();
      } else {
        setMsg(data.message || '生成失败');
      }
    } catch (error) {
      setMsg('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const processWithdrawal = async (requestId: string, status: string) => {
    setLoading(true);
    setMsg('');
    
    try {
      const res = await fetch('/api/admin/process-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          status,
          screenshot_url: screenshotUrl
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMsg('处理成功');
        setSelectedRequest(null);
        setScreenshotUrl('');
        await loadWithdrawalRequests();
      } else {
        setMsg(data.message || '处理失败');
      }
    } catch (error) {
      setMsg('处理失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#C8B6E2] mb-2">激活码与提现管理</h1>
          <p className="text-[#8A94B3]">管理激活码生成和用户提现申请</p>
        </div>

        {msg && (
          <div className="mb-6 p-4 bg-[#10B981] bg-opacity-20 border border-[#10B981] rounded-lg text-[#10B981]">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 激活码生成 */}
          <div className="bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
            <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">生成激活码</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-2">选择套餐</label>
                <select
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value)}
                  className="w-full px-4 py-2 bg-[#2E335B] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ¥{(plan.price / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-2">生成数量</label>
                <input
                  type="number"
                  value={generateCount}
                  onChange={e => setGenerateCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-[#2E335B] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
                  min="1"
                  max="100"
                />
              </div>
              <button
                onClick={generateActivationCodes}
                disabled={loading}
                className="w-full px-4 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#B8A6D2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '生成中...' : '生成激活码'}
              </button>
              
              {generatedCodes.length > 0 && (
                <div className="mt-4 p-4 bg-[#2E335B] rounded-lg">
                  <h3 className="text-[#C8B6E2] font-medium mb-2">生成的激活码：</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {generatedCodes.map((code, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-[#1A1D33] rounded">
                        <span className="text-[#EAEBF0] font-mono">{code}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(code)}
                          className="px-2 py-1 bg-[#C8B6E2] text-[#1A1D33] rounded text-xs hover:bg-[#B8A6D2]"
                        >
                          复制
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 激活码统计 */}
          <div className="bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
            <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">激活码统计</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#2E335B] rounded-lg">
                  <div className="text-2xl font-bold text-[#C8B6E2]">
                    {activationCodes.length}
                  </div>
                  <div className="text-sm text-[#8A94B3]">总激活码数</div>
                </div>
                <div className="p-4 bg-[#2E335B] rounded-lg">
                  <div className="text-2xl font-bold text-[#10B981]">
                    {activationCodes.filter(c => c.is_used).length}
                  </div>
                  <div className="text-sm text-[#8A94B3]">已使用</div>
                </div>
              </div>
              <div className="text-sm text-[#8A94B3]">
                使用率: {activationCodes.length > 0 ? 
                  ((activationCodes.filter(c => c.is_used).length / activationCodes.length) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* 激活码列表 */}
        <div className="mt-6 bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
          <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">激活码列表</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2E335B]">
                  <th className="text-left py-3 px-4 text-[#8A94B3]">激活码</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">套餐</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">状态</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">使用用户</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">激活时间</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">过期时间</th>
                </tr>
              </thead>
              <tbody>
                {activationCodes.map(code => (
                  <tr key={code.id} className="border-b border-[#2E335B] hover:bg-[#2E335B]">
                    <td className="py-3 px-4 text-[#EAEBF0] font-mono">{code.code}</td>
                    <td className="py-3 px-4 text-[#EAEBF0]">{code.plan?.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        code.is_used 
                          ? 'bg-[#10B981] bg-opacity-20 text-[#10B981]' 
                          : 'bg-[#F59E0B] bg-opacity-20 text-[#F59E0B]'
                      }`}>
                        {code.is_used ? '已使用' : '未使用'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#EAEBF0]">{code.used_by_user?.phone || '-'}</td>
                    <td className="py-3 px-4 text-[#8A94B3]">
                      {code.activated_at ? new Date(code.activated_at).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-[#8A94B3]">
                      {new Date(code.expires_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 提现申请管理 */}
        <div className="mt-6 bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
          <h2 className="text-xl font-semibold text-[#C8B6E2] mb-4">提现申请管理</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2E335B]">
                  <th className="text-left py-3 px-4 text-[#8A94B3]">用户</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">金额</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">方式</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">账号</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">状态</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">申请时间</th>
                  <th className="text-left py-3 px-4 text-[#8A94B3]">操作</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map(request => (
                  <tr key={request.id} className="border-b border-[#2E335B] hover:bg-[#2E335B]">
                    <td className="py-3 px-4 text-[#EAEBF0]">{request.user?.phone}</td>
                    <td className="py-3 px-4 text-[#EAEBF0]">¥{(request.amount / 100).toFixed(2)}</td>
                    <td className="py-3 px-4 text-[#EAEBF0]">
                      {request.payment_method === 'alipay' ? '支付宝' : '微信'}
                    </td>
                    <td className="py-3 px-4 text-[#EAEBF0]">{request.account_info}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        request.status === 'pending' ? 'bg-[#F59E0B] bg-opacity-20 text-[#F59E0B]' :
                        request.status === 'completed' ? 'bg-[#10B981] bg-opacity-20 text-[#10B981]' :
                        request.status === 'rejected' ? 'bg-[#EF4444] bg-opacity-20 text-[#EF4444]' :
                        'bg-[#8A94B3] bg-opacity-20 text-[#8A94B3]'
                      }`}>
                        {request.status === 'pending' ? '待处理' : 
                         request.status === 'processing' ? '处理中' :
                         request.status === 'completed' ? '已完成' : '已拒绝'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#8A94B3]">
                      {new Date(request.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-3 py-1 bg-[#C8B6E2] text-[#1A1D33] rounded text-xs hover:bg-[#B8A6D2]"
                          >
                            处理
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 提现处理弹窗 */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1A1D33] rounded-xl p-6 w-full max-w-md border border-[#2E335B]">
            <h3 className="text-xl font-semibold text-[#C8B6E2] mb-4">处理提现申请</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-1">用户</label>
                <div className="text-[#8A94B3]">{selectedRequest.user?.phone}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-1">金额</label>
                <div className="text-[#8A94B3]">¥{(selectedRequest.amount / 100).toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-1">收款账号</label>
                <div className="text-[#8A94B3]">{selectedRequest.account_info}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EAEBF0] mb-2">转账截图URL（可选）</label>
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={e => setScreenshotUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-[#2E335B] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
                  placeholder="上传截图后填入URL"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => processWithdrawal(selectedRequest.id, 'completed')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#10B981] text-white rounded-lg font-medium hover:bg-[#059669] disabled:opacity-50"
              >
                完成提现
              </button>
              <button
                onClick={() => processWithdrawal(selectedRequest.id, 'rejected')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-lg font-medium hover:bg-[#DC2626] disabled:opacity-50"
              >
                拒绝申请
              </button>
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-[#2E335B] text-[#EAEBF0] rounded-lg font-medium hover:bg-[#4A5568]"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
