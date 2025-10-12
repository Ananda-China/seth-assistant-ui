import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data: qrCodes, error } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取二维码配置失败:', error);
      return Response.json({ success: false, message: '获取二维码配置失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      qrCodes: qrCodes || []
    });
  } catch (error) {
    console.error('获取二维码配置错误:', error);
    return Response.json({ success: false, message: '获取二维码配置失败' }, { status: 500 });
  }
}
