import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// 完全新的API路径，绕过所有缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('🆕 新API路径 - 开始获取激活码列表...');
    console.log('🆕 环境变量检查:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    });
    
    // 获取激活码列表
    const { data: codes, error } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .limit(5);

    console.log('🆕 新API路径 - 激活码查询结果:', { codes, error });

    if (error) {
      console.error('🆕 新API路径 - 获取激活码失败:', error);
      return NextResponse.json({ 
        success: false, 
        message: '获取激活码失败',
        error: error.message,
        apiPath: 'activation-codes-new'
      }, { status: 500 });
    }

    console.log('🆕 新API路径 - 成功获取激活码数量:', codes?.length || 0);

    return NextResponse.json({
      success: true,
      codes: codes || [],
      timestamp: new Date().toISOString(),
      cacheBust: Math.random(),
      version: "v3.0-new-path",
      apiPath: "activation-codes-new",
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
    console.error('🆕 新API路径 - 获取激活码错误:', error);
    return NextResponse.json({ 
      success: false, 
      message: '获取激活码失败',
      error: error instanceof Error ? error.message : '未知错误',
      apiPath: 'activation-codes-new'
    }, { status: 500 });
  }
}
