"use client";

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export default function ActivationManagement() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // 激活码管理
  const [activationCodes, setActivationCodes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [generateCount, setGenerateCount] = useState(10);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // 激活码列表筛选和分页
  const [codeStartDate, setCodeStartDate] = useState('');
  const [codeEndDate, setCodeEndDate] = useState('');
  const [codePageSize, setCodePageSize] = useState(10);
  const [codeCurrentPage, setCodeCurrentPage] = useState(1);

  // 提现管理
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');

  // 提现列表筛选和分页
  const [withdrawalStartDate, setWithdrawalStartDate] = useState('');
  const [withdrawalEndDate, setWithdrawalEndDate] = useState('');
  const [withdrawalPageSize, setWithdrawalPageSize] = useState(10);
  const [withdrawalCurrentPage, setWithdrawalCurrentPage] = useState(1);

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
      console.log('开始加载激活码...');
      const res = await fetch('/api/admin/activation-codes');
      console.log('激活码API响应状态:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('激活码API响应数据:', data);
        setActivationCodes(data.codes || []);
        console.log('设置激活码数量:', data.codes?.length || 0);
      } else {
        console.error('激活码API响应失败:', res.status, res.statusText);
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

  // 筛选激活码
  const getFilteredActivationCodes = () => {
    return activationCodes.filter(code => {
      if (codeStartDate && new Date(code.created_at) < new Date(codeStartDate)) return false;
      if (codeEndDate && new Date(code.created_at) > new Date(codeEndDate)) return false;
      return true;
    });
  };

  // 筛选提现申请
  const getFilteredWithdrawalRequests = () => {
    return withdrawalRequests.filter(request => {
      if (withdrawalStartDate && new Date(request.created_at) < new Date(withdrawalStartDate)) return false;
      if (withdrawalEndDate && new Date(request.created_at) > new Date(withdrawalEndDate)) return false;
      return true;
    });
  };

  // 导出激活码Excel
  const exportActivationCodesToExcel = () => {
    const filteredCodes = getFilteredActivationCodes();
    const totalAmount = filteredCodes.reduce((sum, code) => sum + (code.plan?.price || 0), 0);

    const data = filteredCodes.map(code => ({
      '激活码': code.code,
      '手机号': code.used_by_user?.phone || '-',
      '订阅套餐': code.plan?.name || '-',
      '套餐金额': code.plan ? (code.plan.price / 100).toFixed(2) : '-',
      '状态': code.is_used ? '已使用' : '未使用',
      '激活时间': code.activated_at ? new Date(code.activated_at).toLocaleString('zh-CN') : '-',
      '到期时间': new Date(code.expires_at).toLocaleString('zh-CN')
    }));

    // 添加汇总行
    data.push({
      '激活码': '汇总',
      '手机号': '',
      '订阅套餐': '',
      '套餐金额': (totalAmount / 100).toFixed(2),
      '状态': '',
      '激活时间': '',
      '到期时间': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '激活码列表');
    XLSX.writeFile(workbook, `激活码列表_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 导出提现申请Excel
  const exportWithdrawalRequestsToExcel = () => {
    const filteredRequests = getFilteredWithdrawalRequests();
    const totalAmount = filteredRequests.reduce((sum, req) => sum + req.amount, 0);

    const data = filteredRequests.map(request => ({
      '用户': request.user?.phone || '-',
      '金额': (request.amount / 100).toFixed(2),
      '方式': request.payment_method === 'alipay' ? '支付宝' : '微信',
      '账号': request.account_info || '-',
      '状态': request.status === 'pending' ? '待处理' :
              request.status === 'processing' ? '处理中' :
              request.status === 'completed' ? '已完成' : '已拒绝',
      '申请时间': new Date(request.created_at).toLocaleString('zh-CN')
    }));

    // 添加汇总行
    data.push({
      '用户': '汇总',
      '金额': (totalAmount / 100).toFixed(2),
      '方式': '',
      '账号': '',
      '状态': '',
      '申请时间': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '提现申请');
    XLSX.writeFile(workbook, `提现申请_${new Date().toISOString().split('T')[0]}.xlsx`);
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#C8B6E2]">激活码列表</h2>
            <button
              onClick={exportActivationCodesToExcel}
              className="px-4 py-2 bg-[#10B981] text-white rounded-lg font-medium hover:bg-[#059669] text-sm"
            >
              📥 导出Excel
            </button>
          </div>

          {/* 筛选条件 */}
          <div className="mb-4 p-4 bg-[#2E335B] rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-1">开始日期</label>
              <input
                type="date"
                value={codeStartDate}
                onChange={e => setCodeStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1D33] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-1">结束日期</label>
              <input
                type="date"
                value={codeEndDate}
                onChange={e => setCodeEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1D33] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-1">每页显示</label>
              <select
                value={codePageSize}
                onChange={e => {
                  setCodePageSize(parseInt(e.target.value));
                  setCodeCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#1A1D33] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
              >
                <option value={10}>10条</option>
                <option value={20}>20条</option>
                <option value={50}>50条</option>
                <option value={100}>100条</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-1">操作</label>
              <button
                onClick={() => {
                  setCodeStartDate('');
                  setCodeEndDate('');
                  setCodeCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#4A5568] text-[#EAEBF0] rounded-lg hover:bg-[#5A6578] text-sm"
              >
                重置筛选
              </button>
            </div>
          </div>

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
                {(() => {
                  const filtered = getFilteredActivationCodes();
                  const start = (codeCurrentPage - 1) * codePageSize;
                  const end = start + codePageSize;
                  const paged = filtered.slice(start, end);

                  return paged.map(code => (
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
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[#8A94B3]">
              共 {getFilteredActivationCodes().length} 条记录，第 {codeCurrentPage} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCodeCurrentPage(Math.max(1, codeCurrentPage - 1))}
                disabled={codeCurrentPage === 1}
                className="px-3 py-1 bg-[#2E335B] text-[#EAEBF0] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A5568]"
              >
                上一页
              </button>
              <button
                onClick={() => {
                  const maxPage = Math.ceil(getFilteredActivationCodes().length / codePageSize);
                  setCodeCurrentPage(Math.min(maxPage, codeCurrentPage + 1));
                }}
                disabled={codeCurrentPage * codePageSize >= getFilteredActivationCodes().length}
                className="px-3 py-1 bg-[#2E335B] text-[#EAEBF0] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A5568]"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        {/* 提现申请管理 */}
        <div className="mt-6 bg-[#1A1D33] rounded-xl p-6 border border-[#2E335B]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#C8B6E2]">提现申请管理</h2>
            <button
              onClick={exportWithdrawalRequestsToExcel}
              className="px-4 py-2 bg-[#10B981] text-white rounded-lg font-medium hover:bg-[#059669] text-sm"
            >
              📥 导出Excel
            </button>
          </div>

          {/* 筛选条件 */}
          <div className="mb-4 p-4 bg-[#2E335B] rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-1">开始日期</label>
              <input
                type="date"
                value={withdrawalStartDate}
                onChange={e => setWithdrawalStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1D33] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-1">结束日期</label>
              <input
                type="date"
                value={withdrawalEndDate}
                onChange={e => setWithdrawalEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1D33] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-1">每页显示</label>
              <select
                value={withdrawalPageSize}
                onChange={e => {
                  setWithdrawalPageSize(parseInt(e.target.value));
                  setWithdrawalCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#1A1D33] border border-[#4A5568] rounded-lg text-[#EAEBF0] focus:outline-none focus:ring-2 focus:ring-[#C8B6E2]"
              >
                <option value={10}>10条</option>
                <option value={20}>20条</option>
                <option value={50}>50条</option>
                <option value={100}>100条</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#EAEBF0] mb-1">操作</label>
              <button
                onClick={() => {
                  setWithdrawalStartDate('');
                  setWithdrawalEndDate('');
                  setWithdrawalCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#4A5568] text-[#EAEBF0] rounded-lg hover:bg-[#5A6578] text-sm"
              >
                重置筛选
              </button>
            </div>
          </div>

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
                {(() => {
                  const filtered = getFilteredWithdrawalRequests();
                  const start = (withdrawalCurrentPage - 1) * withdrawalPageSize;
                  const end = start + withdrawalPageSize;
                  const paged = filtered.slice(start, end);

                  return paged.map(request => (
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
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[#8A94B3]">
              共 {getFilteredWithdrawalRequests().length} 条记录，第 {withdrawalCurrentPage} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setWithdrawalCurrentPage(Math.max(1, withdrawalCurrentPage - 1))}
                disabled={withdrawalCurrentPage === 1}
                className="px-3 py-1 bg-[#2E335B] text-[#EAEBF0] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A5568]"
              >
                上一页
              </button>
              <button
                onClick={() => {
                  const maxPage = Math.ceil(getFilteredWithdrawalRequests().length / withdrawalPageSize);
                  setWithdrawalCurrentPage(Math.min(maxPage, withdrawalCurrentPage + 1));
                }}
                disabled={withdrawalCurrentPage * withdrawalPageSize >= getFilteredWithdrawalRequests().length}
                className="px-3 py-1 bg-[#2E335B] text-[#EAEBF0] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A5568]"
              >
                下一页
              </button>
            </div>
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
