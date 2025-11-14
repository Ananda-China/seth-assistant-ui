'use client';

import { useState, useEffect } from 'react';

interface PaymentOrder {
  id: string;
  out_trade_no: string;
  user_phone: string;
  user_nickname: string;
  plan: string;
  amount_fen: number;
  amount_yuan: number;
  status: string;
  payment_method: string;
  gateway_order_no: string;
  created_at: string;
  paid_at?: string;
  failed_at?: string;
  description?: string;
}

interface PaymentStats {
  total_orders: number;
  total_revenue: number;
  pending_amount: number;
  refunded_amount: number;
  success_rate: number;
  avg_order_value: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PaymentManagement() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [stats, setStats] = useState<PaymentStats>({ 
    total_orders: 0, 
    total_revenue: 0, 
    pending_amount: 0, 
    refunded_amount: 0, 
    success_rate: 0, 
    avg_order_value: 0 
  });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [useSupabase, setUseSupabase] = useState(true); // 默认使用Supabase

  // 获取支付订单数据
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // 使用Supabase API
      const response = await fetch('/api/admin/payment-supabase');
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 过滤数据
      let filteredOrders = data.orders || [];

      // 搜索过滤
      if (searchTerm) {
        filteredOrders = filteredOrders.filter((order: any) => 
          order.out_trade_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user_nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user_phone?.includes(searchTerm) ||
          order.plan?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // 状态过滤
      if (statusFilter) {
        filteredOrders = filteredOrders.filter((order: any) => order.status === statusFilter);
      }

      // 日期过滤
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        filteredOrders = filteredOrders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          return orderDate >= startDate && orderDate <= endDate;
        });
      }

      // 分页
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      // 使用API返回的统计数据
      const finalStats = data.stats || {
        total_orders: 0,
        total_revenue: 0,
        pending_amount: 0,
        refunded_amount: 0,
        success_rate: 0,
        avg_order_value: 0
      };

      setOrders(paginatedOrders);
      setStats(finalStats);
      setPagination(prev => ({
        ...prev,
        total: finalStats.total_orders,
        totalPages: Math.ceil(finalStats.total_orders / pagination.limit)
      }));

    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // 如果API失败，显示空数据
      setOrders([]);
      setStats({
        total_orders: 0,
        total_revenue: 0,
        pending_amount: 0,
        refunded_amount: 0,
        success_rate: 0,
        avg_order_value: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和依赖变化时获取数据
  useEffect(() => {
    fetchOrders();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, dateRange.start, dateRange.end, useSupabase]);

  // 处理退款
  const handleRefund = async (orderId: string) => {
    if (confirm('确定要退款吗？')) {
      // TODO: 实现退款逻辑
      alert('退款功能待实现');
    }
  };

  // 处理取消订单
  const handleCancel = async (orderId: string) => {
    if (confirm('确定要取消订单吗？')) {
      // TODO: 实现取消订单逻辑
      alert('取消订单功能待实现');
    }
  };

  // 批量操作
  const handleBulkAction = async (action: 'refund' | 'cancel') => {
    if (selectedOrders.length === 0) {
      alert('请选择要操作的订单');
      return;
    }

    if (confirm(`确定要${action === 'refund' ? '退款' : '取消'}选中的 ${selectedOrders.length} 个订单吗？`)) {
      // TODO: 实现批量操作逻辑
      alert(`${action === 'refund' ? '退款' : '取消'}功能待实现`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8A94B3]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和数据源切换 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#C8B6E2]">支付管理</h1>
          <p className="text-[#8A94B3] mt-1">管理支付订单和交易记录</p>
          <div className="text-xs text-[#8A94B3] mt-1">
            数据源: {useSupabase ? 'Supabase数据库' : '本地API'}
          </div>
        </div>
        
        {/* 数据源切换 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#8A94B3]">数据源：</span>
          <select
            value={useSupabase ? 'supabase' : 'local'}
            onChange={(e) => setUseSupabase(e.target.value === 'supabase')}
            className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
          >
            <option value="supabase">Supabase数据库</option>
            <option value="local">本地API</option>
          </select>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-sm text-[#8A94B3] mb-1">总订单数</div>
          <div className="text-2xl font-bold text-[#C8B6E2]">{stats.total_orders || 0}</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-sm text-[#8A94B3] mb-1">总收入</div>
          <div className="text-2xl font-bold text-[#C8B6E2]">¥{(Number(stats.total_revenue) || 0).toFixed(2)}</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-sm text-[#8A94B3] mb-1">待支付</div>
          <div className="text-2xl font-bold text-[#C8B6E2]">¥{(Number(stats.pending_amount) || 0).toFixed(2)}</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-sm text-[#8A94B3] mb-1">已退款</div>
          <div className="text-2xl font-bold text-[#C8B6E2]">¥{(Number(stats.refunded_amount) || 0).toFixed(2)}</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-sm text-[#8A94B3] mb-1">成功率</div>
          <div className="text-2xl font-bold text-[#C8B6E2]">{(Number(stats.success_rate) || 0).toFixed(1)}%</div>
        </div>
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="text-sm text-[#8A94B3] mb-1">平均订单</div>
          <div className="text-2xl font-bold text-[#C8B6E2]">¥{(Number(stats.avg_order_value) || 0).toFixed(2)}</div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-[#1A1D33] p-4 rounded-xl">
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="搜索订单号、用户或套餐..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0] placeholder-[#8A94B3]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
          >
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="success">已支付</option>
            <option value="failed">支付失败</option>
            <option value="refunded">已退款</option>
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
          />
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 bg-[#C8B6E2] text-[#1A1D33] rounded-lg font-medium hover:bg-[#B8A6D2] transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedOrders.length > 0 && (
        <div className="bg-[#1A1D33] p-4 rounded-xl">
          <div className="flex items-center gap-4">
            <span className="text-[#EAEBF0]">已选择 {selectedOrders.length} 个订单</span>
            <button
              onClick={() => handleBulkAction('refund')}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              批量退款
            </button>
            <button
              onClick={() => handleBulkAction('cancel')}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              批量取消
            </button>
          </div>
        </div>
      )}

      {/* 订单列表 */}
      <div className="bg-[#1A1D33] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#2E335B]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(orders.map(o => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left text-[#EAEBF0]">订单信息</th>
                <th className="px-4 py-3 text-left text-[#EAEBF0]">用户信息</th>
                <th className="px-4 py-3 text-left text-[#EAEBF0]">支付详情</th>
                <th className="px-4 py-3 text-left text-[#EAEBF0]">状态</th>
                <th className="px-4 py-3 text-left text-[#EAEBF0]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E335B]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#8A94B3]">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#2E335B]/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(prev => [...prev, order.id]);
                          } else {
                            setSelectedOrders(prev => prev.filter(id => id !== order.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="font-medium text-[#EAEBF0]">{order.out_trade_no}</div>
                        <div className="text-sm text-[#8A94B3]">{order.plan}</div>
                        <div className="text-xs text-[#8A94B3]">创建: {new Date(order.created_at).toLocaleDateString('zh-CN')}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="font-medium text-[#EAEBF0]">{order.user_nickname || order.user_phone}</div>
                        <div className="text-sm text-[#8A94B3]">{order.user_phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="font-medium text-[#EAEBF0]">¥{(order.amount_fen / 100).toFixed(2)}</div>
                        <div className="text-sm text-[#8A94B3]">{order.payment_method}</div>
                        {order.gateway_order_no && (
                          <div className="text-xs text-[#8A94B3]">网关单号: {order.gateway_order_no}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'success' ? 'bg-green-900/30 text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                        order.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                        order.status === 'refunded' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-gray-900/30 text-gray-400'
                      }`}>
                        {order.status === 'success' ? '已支付' :
                         order.status === 'pending' ? '待支付' :
                         order.status === 'failed' ? '支付失败' :
                         order.status === 'refunded' ? '已退款' :
                         order.status}
                      </span>
                      {order.paid_at && (
                        <div className="text-xs text-[#8A94B3] mt-1">
                          支付时间: {new Date(order.paid_at).toLocaleDateString('zh-CN')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {order.status === 'success' && (
                          <button
                            onClick={() => handleRefund(order.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            退款
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                          >
                            取消
                          </button>
                        )}
                        <button className="px-2 py-1 bg-[#2E335B] text-[#EAEBF0] rounded text-xs hover:bg-[#3E435B]">
                          详情
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#8A94B3]">
            显示 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 bg-[#2E335B] text-[#EAEBF0] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3E435B]"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-[#EAEBF0]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 bg-[#2E335B] text-[#EAEBF0] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3E435B]"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
