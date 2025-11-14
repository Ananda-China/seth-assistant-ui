import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 添加管理员认证
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { request_id, status, screenshot_url } = await req.json().catch(() => ({}));
    
    if (!request_id || !status) {
      return Response.json({ success: false, message: '参数不完整' }, { status: 400 });
    }

    if (!['completed', 'rejected'].includes(status)) {
      return Response.json({ success: false, message: '状态无效' }, { status: 400 });
    }

    // 获取提现申请信息
    const { data: request, error: requestError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      return Response.json({ success: false, message: '提现申请不存在' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return Response.json({ success: false, message: '该申请已处理' }, { status: 400 });
    }

    // 更新提现申请状态
    const updateData: any = {
      status,
      processed_at: new Date().toISOString()
    };

    if (screenshot_url) {
      updateData.transfer_screenshot_url = screenshot_url;
    }

    const { error: updateError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', request_id);

    if (updateError) {
      return Response.json({ success: false, message: '更新状态失败' }, { status: 500 });
    }

    // 如果状态是拒绝，需要退还用户余额
    if (status === 'rejected') {
      const { data: balance, error: balanceError } = await supabaseAdmin
        .from('balances')
        .select('amount')
        .eq('user_id', request.user_id)
        .single();

      if (!balanceError) {
        const currentAmount = balance?.amount || 0;
        const refundAmount = currentAmount + request.amount;

        await supabaseAdmin
          .from('balances')
          .upsert({
            user_id: request.user_id,
            amount: refundAmount
          });

        console.log(`✅ 提现被拒绝，退还用户余额 ¥${(request.amount / 100).toFixed(2)}`);
      }
    }

    // 注意：如果状态是completed，余额已经在申请时扣减，无需再次扣减

    return Response.json({
      success: true,
      message: '处理成功'
    });
  } catch (error) {
    console.error('处理提现申请错误:', error);
    return Response.json({ success: false, message: '处理失败' }, { status: 500 });
  }
}
