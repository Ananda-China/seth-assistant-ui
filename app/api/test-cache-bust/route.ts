import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('缓存破坏测试 - 强制刷新版本');
    
    // 直接查询激活码
    const { data: codes, error } = await supabaseAdmin
      .from('activation_codes')
      .select('*')
      .limit(5);
    
    console.log('缓存破坏测试查询结果:', { codes, error });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cacheBust: Math.random(),
      codes: codes || [],
      error: error,
      count: codes?.length || 0,
      message: '这是缓存破坏测试版本'
    });
  } catch (error) {
    console.error('缓存破坏测试错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
