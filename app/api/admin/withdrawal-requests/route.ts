import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // 获取提现申请列表
    const { data: requests, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .select(`
        *,
        user:users(phone, nickname)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ success: false, message: '获取提现申请失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      requests: requests || []
    });
  } catch (error) {
    console.error('获取提现申请错误:', error);
    return Response.json({ success: false, message: '获取提现申请失败' }, { status: 500 });
  }
}
