import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabase';

/**
 * 管理员激活/取消激活激活码的API
 * POST /api/admin/activation-codes-admin
 * 
 * 请求体:
 * {
 *   action: 'activate' | 'deactivate',
 *   codeId: string,
 *   userPhone: string (仅激活时需要)
 * }
 */

export async function POST(req: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { action, codeId, userPhone } = await req.json();

    if (!action || !codeId) {
      return Response.json(
        { success: false, message: '参数不完整' },
        { status: 400 }
      );
    }

    if (action === 'activate') {
      return await handleActivate(codeId, userPhone);
    } else if (action === 'deactivate') {
      return await handleDeactivate(codeId);
    } else {
      return Response.json(
        { success: false, message: '不支持的操作' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('管理员激活码操作错误:', error);
    return Response.json(
      { success: false, message: '操作失败' },
      { status: 500 }
    );
  }
}

/**
 * 管理员激活激活码
 */
async function handleActivate(codeId: string, userPhone: string) {
  try {
    if (!userPhone) {
      return Response.json(
        { success: false, message: '请输入用户手机号' },
        { status: 400 }
      );
    }

    // 获取激活码信息
    const { data: activationCode, error: codeError } = await supabaseAdmin
      .from('activation_codes')
      .select('*, plan:plans(*)')
      .eq('id', codeId)
      .single();

    if (codeError || !activationCode) {
      return Response.json(
        { success: false, message: '激活码不存在' },
        { status: 404 }
      );
    }

    // 检查激活码是否已使用
    if (activationCode.is_used) {
      return Response.json(
        { success: false, message: '激活码已被使用' },
        { status: 400 }
      );
    }

    // 检查激活码是否过期
    const now = new Date();
    const expiresAt = new Date(activationCode.expires_at);
    if (now > expiresAt) {
      return Response.json(
        { success: false, message: '激活码已过期' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, phone')
      .eq('phone', userPhone)
      .single();

    if (userError || !user) {
      return Response.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 更新激活码状态
    const activatedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('activation_codes')
      .update({
        is_used: true,
        used_by_user_id: user.id,
        activated_at: activatedAt
      })
      .eq('id', codeId);

    if (updateError) {
      return Response.json(
        { success: false, message: '激活失败' },
        { status: 500 }
      );
    }

    // 创建订单记录
    const orderId = `ACT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        out_trade_no: orderId,
        user_phone: user.phone,
        plan: activationCode.plan.name,
        plan_id: activationCode.plan.id,
        amount_fen: activationCode.plan.price,
        duration_days: activationCode.plan.duration_days,
        status: 'success',
        trade_no: `ACTIVATION_${activationCode.id}`,
        paid_at: activatedAt,
        activation_code_id: activationCode.id,
        order_type: 'activation'
      });

    if (orderError) {
      console.error('创建订单失败:', orderError);
      // 回滚激活码状态
      await supabaseAdmin
        .from('activation_codes')
        .update({
          is_used: false,
          used_by_user_id: null,
          activated_at: null
        })
        .eq('id', codeId);
      return Response.json(
        { success: false, message: '创建订单失败' },
        { status: 500 }
      );
    }

    // 计算订阅结束时间
    const subscriptionStart = new Date(activatedAt);
    const durationDays = activationCode.plan.duration_days || 365;
    const subscriptionEnd = new Date(
      subscriptionStart.getTime() + durationDays * 24 * 60 * 60 * 1000
    );

    // 先取消现有的活跃订阅
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_phone', user.phone)
      .eq('status', 'active');

    // 创建新的订阅记录
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_phone: user.phone,
        plan: activationCode.plan.name,
        status: 'active',
        period_start: subscriptionStart.toISOString(),
        current_period_end: subscriptionEnd.toISOString(),
        activation_code_id: activationCode.id,
        subscription_type: 'activation'
      });

    if (subscriptionError) {
      console.error('创建订阅失败:', subscriptionError);
      return Response.json(
        { success: false, message: '创建订阅失败' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: '激活成功',
      data: {
        plan: activationCode.plan,
        expires_at: subscriptionEnd.toISOString()
      }
    });
  } catch (error) {
    console.error('激活激活码错误:', error);
    return Response.json(
      { success: false, message: '激活失败' },
      { status: 500 }
    );
  }
}

/**
 * 管理员取消激活激活码
 */
async function handleDeactivate(codeId: string) {
  try {
    // 获取激活码信息
    const { data: activationCode, error: codeError } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .eq('id', codeId)
      .single();

    if (codeError || !activationCode) {
      return Response.json(
        { success: false, message: '激活码不存在' },
        { status: 404 }
      );
    }

    // 检查激活码是否已激活
    if (!activationCode.is_used) {
      return Response.json(
        { success: false, message: '激活码未被激活' },
        { status: 400 }
      );
    }

    // 检查激活时间是否超过10分钟
    const activatedAt = new Date(activationCode.activated_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - activatedAt.getTime()) / (1000 * 60);

    if (diffMinutes > 10) {
      return Response.json(
        { success: false, message: '激活超过10分钟，无法取消激活' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', activationCode.used_by_user_id)
      .single();

    if (userError || !user) {
      return Response.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 取消激活码
    const { error: updateError } = await supabaseAdmin
      .from('activation_codes')
      .update({
        is_used: false,
        used_by_user_id: null,
        activated_at: null
      })
      .eq('id', codeId);

    if (updateError) {
      return Response.json(
        { success: false, message: '取消激活失败' },
        { status: 500 }
      );
    }

    // 取消订阅
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_phone', user.phone)
      .eq('activation_code_id', codeId);

    if (subscriptionError) {
      console.error('取消订阅失败:', subscriptionError);
    }

    return Response.json({
      success: true,
      message: '取消激活成功'
    });
  } catch (error) {
    console.error('取消激活错误:', error);
    return Response.json(
      { success: false, message: '取消激活失败' },
      { status: 500 }
    );
  }
}

