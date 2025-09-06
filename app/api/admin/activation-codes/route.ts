import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // 获取激活码列表
    const { data: codes, error } = await supabaseAdmin
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*),
        used_by_user:users(phone, nickname)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ success: false, message: '获取激活码失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      codes: codes || []
    });
  } catch (error) {
    console.error('获取激活码错误:', error);
    return Response.json({ success: false, message: '获取激活码失败' }, { status: 500 });
  }
}
