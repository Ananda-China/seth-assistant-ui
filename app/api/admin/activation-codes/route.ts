import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabase';

// 强制动态执行，绕过所有缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }
    const adminUser = authResult.user;

    console.log('🔍 开始获取激活码列表...');

    // 先尝试简单查询，不联表
    const { data: simpleCodes, error: simpleError } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('🔍 简单查询结果:', {
      count: simpleCodes?.length || 0,
      error: simpleError,
      firstCode: simpleCodes?.[0]
    });

    if (simpleError) {
      console.error('❌ 简单查询失败:', simpleError);
      return NextResponse.json({
        success: false,
        message: '数据库查询失败',
        error: simpleError.message
      }, { status: 500 });
    }

    // 如果简单查询成功，再尝试联表查询
    let codes = simpleCodes;
    let error = simpleError;

    // 尝试联表查询，如果失败则使用简单查询结果
    try {
      const { data: joinedCodes, error: joinError } = await supabaseAdmin
        .from('activation_codes')
        .select(`
          *,
          plan:plans(*),
          used_by_user:users(phone, nickname)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!joinError && joinedCodes) {
        codes = joinedCodes;
        error = joinError;
        console.log('✅ 联表查询成功');
      } else {
        console.log('⚠️ 联表查询失败，使用简单查询结果:', joinError);
      }
    } catch (joinErr) {
      console.log('⚠️ 联表查询异常，使用简单查询结果:', joinErr);
    }

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
      codes: codes || [],
      timestamp: new Date().toISOString(),
      cacheBust: Math.random(),
      version: "v2.0-cache-bust",
      debug: {
        codesCount: codes?.length || 0,
        hasError: !!error,
        errorMessage: error?.message || null,
        environment: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
        }
      }
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
