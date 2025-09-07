import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 临时移除认证检查进行测试
    // const adminAuth = requireAdminAuth(req);
    // if (!adminAuth) {
    //   return Response.json({ success: false, message: '需要管理员权限' }, { status: 401 });
    // }

    console.log('开始获取激活码列表...');
    console.log('环境变量检查:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    });
    
    // 获取激活码列表 - 使用与构建时相同的查询方式
    const { data: codes, error } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .limit(5);

    console.log('激活码查询结果:', { codes, error });
    console.log('错误详情:', error);

    if (error) {
      console.error('获取激活码失败:', error);
      return NextResponse.json({ 
        success: false, 
        message: '获取激活码失败',
        error: error.message,
        details: error
      }, { status: 500 });
    }

    console.log('成功获取激活码数量:', codes?.length || 0);

    return NextResponse.json({
      success: true,
      codes: codes || []
    });
  } catch (error) {
    console.error('获取激活码错误:', error);
    return NextResponse.json({ 
      success: false, 
      message: '获取激活码失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
