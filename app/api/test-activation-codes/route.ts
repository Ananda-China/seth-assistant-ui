import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('测试激活码查询...');
    
    // 使用与构建时相同的查询方式
    const { data: codes, error } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .limit(5);
    
    console.log('激活码查询结果:', { codes, error });
    
    return NextResponse.json({
      success: true,
      codes: codes || [],
      error: error,
      count: codes?.length || 0
    });
  } catch (error) {
    console.error('测试激活码查询错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
