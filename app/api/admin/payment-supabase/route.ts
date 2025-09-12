import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // 验证管理员权限
  const authResult = requireAdminAuth(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 获取订单数据
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (orderError) {
      console.error('Error fetching orders:', orderError);
      return new Response('Failed to fetch orders', { status: 500 });
    }

    // 获取用户数据
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('phone, nickname');
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response('Failed to fetch users', { status: 500 });
    }

    // 创建用户映射
    const userMap = new Map(users.map(user => [user.phone, user.nickname || user.phone]));

    // 计算统计数据
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.status === 'success')
      .reduce((sum, order) => sum + (order.amount_fen || 0), 0) / 100; // 转换为元
    
    const pendingPayment = orders
      .filter(order => order.status === 'pending')
      .reduce((sum, order) => sum + (order.amount_fen || 0), 0) / 100;
    
    const refunded = orders
      .filter(order => order.status === 'refunded')
      .reduce((sum, order) => sum + (order.amount_fen || 0), 0) / 100;
    
    const successRate = totalOrders > 0 
      ? ((orders.filter(order => order.status === 'success').length / totalOrders) * 100).toFixed(1)
      : '0.0';
    
    const averageOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';

    // 格式化订单数据
    const orderStats = orders.map(order => {
      const user = userMap.get(order.user_phone);
      const amountYuan = (order.amount_fen || 0) / 100;
      
      return {
        id: order.id,
        out_trade_no: order.out_trade_no,
        plan: order.plan,
        user_phone: order.user_phone,
        user_nickname: user || order.user_phone,
        amount_fen: order.amount_fen,
        amount_yuan: amountYuan,
        status: order.status,
        payment_method: order.zpay_status ? 'ZPay' : (order.trade_no ? '微信支付' : '未知'),
        gateway_order_no: order.trade_no || order.zpay_status || 'N/A',
        created_at: order.created_at,
        paid_at: order.paid_at,
        failed_at: order.failed_at
      };
    });

    return Response.json({
      stats: {
        total_orders: totalOrders,
        total_revenue: totalRevenue.toFixed(2),
        pending_payment: pendingPayment.toFixed(2),
        refunded: refunded.toFixed(2),
        success_rate: successRate,
        average_order: averageOrder
      },
      orders: orderStats
    });
  } catch (error) {
    console.error('Error fetching payment data:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
