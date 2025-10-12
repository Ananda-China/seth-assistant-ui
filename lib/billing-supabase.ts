import { supabaseAdmin } from './supabase';

export type Order = {
  id: string;
  out_trade_no: string;
  user_phone: string;
  plan: string;
  plan_id?: string;
  amount_fen: number;
  duration_days?: number;
  status: 'pending' | 'success' | 'failed';
  trade_no?: string;
  zpay_status?: string;
  created_at: string;
  paid_at?: string;
  failed_at?: string;
};

export type Subscription = {
  id: string;
  user_phone: string;
  plan: string;
  status: 'active' | 'expired' | 'cancelled';
  period_start: string;
  current_period_end: string;
  monthly_quota?: number;
  used_this_period: number;
  created_at: string;
  updated_at: string;
};

// 创建订单
export async function createOrder(orderData: {
  out_trade_no: string;
  user: string;
  plan: string;
  amount_fen: number;
  status: 'pending' | 'success' | 'failed';
  created_at: number;
  plan_id?: string;
  duration_days?: number;
}): Promise<Order> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert({
      out_trade_no: orderData.out_trade_no,
      user_phone: orderData.user,
      plan: orderData.plan,
      plan_id: orderData.plan_id,
      amount_fen: orderData.amount_fen,
      duration_days: orderData.duration_days,
      status: orderData.status,
      created_at: new Date(orderData.created_at).toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 更新订单状态
export async function updateOrderStatus(
  out_trade_no: string,
  status: 'pending' | 'success' | 'failed',
  extraData?: {
    trade_no?: string;
    paid_at?: number;
    failed_at?: number;
    zpay_status?: string;
  }
): Promise<void> {
  const updateData: any = { status };

  if (status === 'success' && !extraData?.paid_at) {
    updateData.paid_at = new Date().toISOString();
  }

  if (extraData) {
    if (extraData.trade_no) updateData.trade_no = extraData.trade_no;
    if (extraData.paid_at) updateData.paid_at = new Date(extraData.paid_at).toISOString();
    if (extraData.failed_at) updateData.failed_at = new Date(extraData.failed_at).toISOString();
    if (extraData.zpay_status) updateData.zpay_status = extraData.zpay_status;
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('out_trade_no', out_trade_no);

  if (error) throw error;
}

// 获取订单
export async function getOrder(out_trade_no: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('out_trade_no', out_trade_no)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// 获取用户的订单列表
export async function listOrdersByUser(userPhone: string): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('user_phone', userPhone)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// 创建或更新订阅
export async function upsertSubscription(userPhone: string, plan: string): Promise<void> {
  const now = new Date();
  const addDays = plan.includes('年') ? 365 : plan.includes('季') ? 90 : 30;
  const endDate = new Date(now.getTime() + addDays * 24 * 60 * 60 * 1000);

  // 先取消现有的活跃订阅
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_phone', userPhone)
    .eq('status', 'active');

  // 创建新订阅
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_phone: userPhone,
      plan,
      status: 'active',
      period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
      used_this_period: 0
    });

  if (error) throw error;
}

// 获取用户订阅（包括过期订阅）
export async function getSubscription(userPhone: string): Promise<Subscription | null> {
  // 首先获取最新的订阅记录（不限制状态）
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_phone', userPhone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // 检查订阅是否已过期
  if (data && new Date(data.current_period_end) <= new Date()) {
    // 订阅已过期，更新状态为expired
    if (data.status === 'active') {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', data.id);

      // 更新返回数据的状态
      data.status = 'expired';
    }
  }

  return data;
}

// 获取所有订单（管理员用）
export async function getAllOrders(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      users!orders_user_phone_fkey(phone, nickname)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    orders: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

// 获取订单统计
export async function getOrderStats() {
  // 总订单数
  const { count: totalOrders } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true });

  // 成功订单数
  const { count: successOrders } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'success');

  // 今日订单数
  const today = new Date().toISOString().split('T')[0];
  const { count: todayOrders } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);

  // 今日收入
  const { data: todayRevenue } = await supabaseAdmin
    .from('orders')
    .select('amount_fen')
    .eq('status', 'success')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);

  const todayRevenueTotal = todayRevenue?.reduce((sum, order) => sum + order.amount_fen, 0) || 0;

  // 总收入
  const { data: totalRevenue } = await supabaseAdmin
    .from('orders')
    .select('amount_fen')
    .eq('status', 'success');

  const totalRevenueAmount = totalRevenue?.reduce((sum, order) => sum + order.amount_fen, 0) || 0;

  return {
    totalOrders: totalOrders || 0,
    successOrders: successOrders || 0,
    todayOrders: todayOrders || 0,
    todayRevenue: todayRevenueTotal,
    totalRevenue: totalRevenueAmount,
    successRate: totalOrders ? ((successOrders || 0) / totalOrders * 100).toFixed(1) : '0'
  };
}

// 获取活跃订阅统计
export async function getSubscriptionStats() {
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // 按套餐类型统计
  const { data: planStats } = await supabaseAdmin
    .from('subscriptions')
    .select('plan')
    .eq('status', 'active');

  const planCounts = planStats?.reduce((acc: Record<string, number>, sub) => {
    acc[sub.plan] = (acc[sub.plan] || 0) + 1;
    return acc;
  }, {}) || {};

  return {
    activeSubscriptions: activeSubscriptions || 0,
    planBreakdown: planCounts
  };
}
