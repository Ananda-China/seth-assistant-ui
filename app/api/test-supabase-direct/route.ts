import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('直接测试Supabase连接...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    console.log('环境变量:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      url: supabaseUrl?.substring(0, 20) + '...',
      serviceKeyLength: supabaseServiceKey?.length || 0
    });
    
    // 创建新的Supabase客户端实例
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 测试查询激活码
    const { data: codes, error } = await supabase
      .from('activation_codes')
      .select('*')
      .limit(5);
    
    console.log('直接查询结果:', { codes, error });
    
    // 测试查询套餐
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*');
    
    console.log('套餐查询结果:', { plans, plansError });
    
    return NextResponse.json({
      success: true,
      environment: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        url: supabaseUrl?.substring(0, 20) + '...',
        serviceKeyLength: supabaseServiceKey?.length || 0
      },
      activationCodes: {
        count: codes?.length || 0,
        data: codes,
        error: error
      },
      plans: {
        count: plans?.length || 0,
        data: plans,
        error: plansError
      }
    });
  } catch (error) {
    console.error('直接测试错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
