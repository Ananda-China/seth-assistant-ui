import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('简化版激活码API - 开始获取激活码列表...');
    
    // 获取激活码列表（不进行认证检查）
    const { data: codes, error } = await supabaseAdmin
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*),
        used_by_user:users(phone, nickname)
      `)
      .order('created_at', { ascending: false });

    console.log('简化版激活码API - 查询结果:', { codes, error });

    if (error) {
      console.error('简化版激活码API - 获取激活码失败:', error);
      return Response.json({ 
        success: false, 
        message: '获取激活码失败',
        error: error.message
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      codes: codes || [],
      message: '简化版API工作正常'
    });
  } catch (error) {
    console.error('简化版激活码API - 错误:', error);
    return Response.json({ 
      success: false, 
      message: '简化版API错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
