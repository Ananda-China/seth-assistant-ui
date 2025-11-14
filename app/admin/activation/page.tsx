"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivationAdminPage() {
  const router = useRouter();
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
  const [processingStatus, setProcessingStatus] = useState('');
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
      console.log('🔍 前端开始加载激活码...');
      const res = await fetch('/api/admin/activation-codes');
      console.log('🔍 API响应状态:', res.status, res.ok);

      if (res.ok) {
        const data = await res.json();
        console.log('🔍 API返回数据:', data);
        console.log('🔍 激活码数量:', data.codes?.length || 0);
        setActivationCodes(data.codes || []);
      } else {
        const errorData = await res.text();
        console.error('❌ API请求失败:', res.status, errorData);
      }
    } catch (error) {
      console.error('❌ 加载激活码失败:', error);
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
    <div className="admin-container">
      <div className="admin-header">
        <h1>激活码与提现管理</h1>
        <button onClick={() => router.push('/admin')} className="btn-outline">
          返回管理后台
        </button>
      </div>

      {msg && (
        <div className="admin-message">
          {msg}
        </div>
      )}

      <div className="admin-content">
        {/* 激活码生成 */}
        <div className="admin-card">
          <h2>生成激活码</h2>
          <div className="form-group">
            <label>选择套餐</label>
            <select
              value={selectedPlan}
              onChange={e => setSelectedPlan(e.target.value)}
              className="form-input"
            >
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ¥{(plan.price / 100).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>生成数量</label>
            <input
              type="number"
              value={generateCount}
              onChange={e => setGenerateCount(parseInt(e.target.value) || 0)}
              className="form-input"
              min="1"
              max="100"
            />
          </div>
          <button
            onClick={generateActivationCodes}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '生成中...' : '生成激活码'}
          </button>
          
          {generatedCodes.length > 0 && (
            <div className="generated-codes">
              <h3>生成的激活码：</h3>
              <div className="codes-list">
                {generatedCodes.map((code, index) => (
                  <div key={index} className="code-item">
                    {code}
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="btn-copy-small"
                    >
                      复制
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 激活码列表 */}
        <div className="admin-card">
          <h2>激活码列表</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>激活码</th>
                  <th>套餐</th>
                  <th>状态</th>
                  <th>使用用户</th>
                  <th>激活时间</th>
                  <th>过期时间</th>
                </tr>
              </thead>
              <tbody>
                {activationCodes.map(code => (
                  <tr key={code.id}>
                    <td>{code.code}</td>
                    <td>{code.plan?.name}</td>
                    <td>
                      <span className={`status-badge ${code.is_used ? 'used' : 'unused'}`}>
                        {code.is_used ? '已使用' : '未使用'}
                      </span>
                    </td>
                    <td>{code.used_by_user?.phone || '-'}</td>
                    <td>{code.activated_at ? new Date(code.activated_at).toLocaleString() : '-'}</td>
                    <td>{new Date(code.expires_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 提现申请管理 */}
        <div className="admin-card">
          <h2>提现申请管理</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>金额</th>
                  <th>方式</th>
                  <th>账号</th>
                  <th>状态</th>
                  <th>申请时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map(request => (
                  <tr key={request.id}>
                    <td>{request.user?.phone}</td>
                    <td>¥{(request.amount / 100).toFixed(2)}</td>
                    <td>{request.payment_method === 'alipay' ? '支付宝' : '微信'}</td>
                    <td>{request.account_info}</td>
                    <td>
                      <span className={`status-badge ${request.status}`}>
                        {request.status === 'pending' ? '待处理' : 
                         request.status === 'processing' ? '处理中' :
                         request.status === 'completed' ? '已完成' : '已拒绝'}
                      </span>
                    </td>
                    <td>{new Date(request.created_at).toLocaleString()}</td>
                    <td>
                      {request.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="btn-outline-small"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>处理提现申请</h3>
            <div className="form-group">
              <label>用户：{selectedRequest.user?.phone}</label>
            </div>
            <div className="form-group">
              <label>金额：¥{(selectedRequest.amount / 100).toFixed(2)}</label>
            </div>
            <div className="form-group">
              <label>收款账号：{selectedRequest.account_info}</label>
            </div>
            <div className="form-group">
              <label>转账截图URL（可选）</label>
              <input
                type="url"
                value={screenshotUrl}
                onChange={e => setScreenshotUrl(e.target.value)}
                className="form-input"
                placeholder="上传截图后填入URL"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => processWithdrawal(selectedRequest.id, 'completed')}
                disabled={loading}
                className="btn-primary"
              >
                完成提现
              </button>
              <button
                onClick={() => processWithdrawal(selectedRequest.id, 'rejected')}
                disabled={loading}
                className="btn-outline"
              >
                拒绝申请
              </button>
              <button
                onClick={() => setSelectedRequest(null)}
                className="btn-outline"
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
