import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET() {
  try {
    console.log('开始数据库连接测试...');
    
    // 测试1: 检查环境变量
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('环境变量检查:', { hasUrl, hasServiceKey });
    
    // 测试2: 查询激活码表
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .limit(5);
    
    console.log('激活码查询结果:', { codes, codesError });
    
    // 测试3: 查询套餐表
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('plans')
      .select('*');
    
    console.log('套餐查询结果:', { plans, plansError });
    
    return NextResponse.json({
      success: true,
      environment: {
        hasUrl,
        hasServiceKey,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
      },
      activationCodes: {
        count: codes?.length || 0,
        data: codes,
        error: codesError
      },
      plans: {
        count: plans?.length || 0,
        data: plans,
        error: plansError
      }
    });
  } catch (error) {
    console.error('数据库测试错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
