import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('🧪 测试激活码查询...');
    console.log('🧪 环境变量检查:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    });

    // 1. 先测试数据库连接
    const { data: testConnection, error: connectionError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    console.log('🧪 数据库连接测试:', { testConnection, connectionError });

    // 2. 查询激活码表
    const { data: codes, error } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('🧪 激活码查询结果:', {
      codesCount: codes?.length || 0,
      error,
      firstCode: codes?.[0]
    });

    // 3. 查询套餐表
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .limit(5);

    console.log('🧪 套餐查询结果:', {
      plansCount: plans?.length || 0,
      plansError,
      firstPlan: plans?.[0]
    });

    return NextResponse.json({
      success: !error,
      codes: codes || [],
      plans: plans || [],
      error: error?.message || null,
      plansError: plansError?.message || null,
      count: codes?.length || 0,
      plansCount: plans?.length || 0,
      connectionTest: !connectionError,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 测试激活码查询错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
