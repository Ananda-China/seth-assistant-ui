import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(token, secret) as any;
    const phone = decoded?.phone as string;
    
    if (!phone) {
      return Response.json({ success: false, message: '未登录' }, { status: 401 });
    }

    // 获取用户ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return Response.json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    // 获取提现参数
    const { amount, payment_method, account_info } = await req.json().catch(() => ({}));
    
    if (!amount || !payment_method || !account_info) {
      return Response.json({ success: false, message: '参数不完整' }, { status: 400 });
    }

    // 验证提现金额（最低50元）
    const amountFen = Math.floor(amount * 100);
    if (amountFen < 5000) {
      return Response.json({ success: false, message: '最低提现金额为50元' }, { status: 400 });
    }

    // 检查用户余额
    const { data: balance, error: balanceError } = await supabaseAdmin
      .from('balances')
      .select('amount')
      .eq('user_id', user.id)
      .single();

    const currentBalance = balance?.amount || 0;
    if (currentBalance < amountFen) {
      return Response.json({ success: false, message: '余额不足' }, { status: 400 });
    }

    // 检查是否有待处理的提现申请
    const { data: pendingRequest, error: pendingError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .single();

    if (!pendingError && pendingRequest) {
      return Response.json({ success: false, message: '您有待处理的提现申请' }, { status: 400 });
    }

    // 创建提现申请
    const { data: request, error: requestError } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount: amountFen,
        payment_method,
        account_info
      })
      .select()
      .single();

    if (requestError) {
      console.error('创建提现申请失败:', requestError);
      return Response.json({ success: false, message: '创建提现申请失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: '提现申请已提交，请等待处理',
      request_id: request.id
    });
  } catch (error) {
    console.error('创建提现申请错误:', error);
    return Response.json({ success: false, message: '创建提现申请失败' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const cookie = req.headers.get('cookie') || '';
    const match = /(?:^|;\s*)sid=([^;]+)/.exec(cookie);
    const token = match ? decodeURIComponent(match[1]) : '';
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(token, secret) as any;
    const phone = decoded?.phone as string;
    
    if (!phone) {
      return Response.json({ success: false, message: '未登录' }, { status: 401 });
    }

    // 获取用户ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return Response.json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    // 获取用户提现记录
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      return Response.json({ success: false, message: '获取提现记录失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      requests: requests || []
    });
  } catch (error) {
    console.error('获取提现记录错误:', error);
    return Response.json({ success: false, message: '获取提现记录失败' }, { status: 500 });
  }
}
