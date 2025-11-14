import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('测试相同查询...');
    
    // 完全复制调试API的查询方式
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .limit(5);
    
    console.log('激活码查询结果:', { codes, codesError });
    
    return NextResponse.json({
      success: true,
      codes: codes || [],
      error: codesError,
      count: codes?.length || 0,
      message: '使用与调试API完全相同的查询'
    });
  } catch (error) {
    console.error('测试查询错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
