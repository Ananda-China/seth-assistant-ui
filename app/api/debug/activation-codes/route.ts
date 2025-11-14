import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// 强制动态执行，绕过所有缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('🔍 调试API - 开始获取激活码列表...');

    // 环境变量检查
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    };
    console.log('🔍 环境变量检查:', envCheck);

    // 1. 最简单的查询
    console.log('🔍 步骤1: 最简单的查询...');
    const { data: simpleCodes, error: simpleError } = await supabaseAdmin
      .from('activation_codes')
      .select('id, code, is_used')
      .limit(3);

    console.log('🔍 简单查询结果:', {
      count: simpleCodes?.length || 0,
      error: simpleError,
      codes: simpleCodes
    });

    // 2. 联表查询套餐
    console.log('🔍 步骤2: 联表查询套餐...');
    const { data: withPlans, error: plansError } = await supabaseAdmin
      .from('activation_codes')
      .select(`
        id,
        code,
        is_used,
        plan:plans(name)
      `)
      .limit(3);

    console.log('🔍 联表套餐查询结果:', {
      count: withPlans?.length || 0,
      error: plansError,
      codes: withPlans
    });

    // 3. 完整查询
    console.log('🔍 步骤3: 完整查询...');
    const { data: fullCodes, error: fullError } = await supabaseAdmin
      .from('activation_codes')
      .select(`
        *,
        plan:plans(*),
        used_by_user:users(phone, nickname)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('🔍 完整查询结果:', {
      count: fullCodes?.length || 0,
      error: fullError,
      firstCode: fullCodes?.[0]
    });

    // 返回调试信息
    return NextResponse.json({
      success: true,
      debug: {
        environment: envCheck,
        simpleQuery: {
          count: simpleCodes?.length || 0,
          error: simpleError,
          data: simpleCodes
        },
        plansQuery: {
          count: withPlans?.length || 0,
          error: plansError,
          data: withPlans
        },
        fullQuery: {
          count: fullCodes?.length || 0,
          error: fullError,
          data: fullCodes
        }
      },
      codes: fullCodes || simpleCodes || [],
      message: '调试API工作正常'
    });

  } catch (error) {
    console.error('❌ 调试API错误:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
