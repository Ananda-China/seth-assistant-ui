import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// 强制动态执行，绕过所有缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 测试管理后台数据API...');

    // 1. 检查激活码数据
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('activation_codes')
      .select(`
        id,
        code,
        is_used,
        used_by_user_id,
        activated_at,
        expires_at,
        created_at,
        plans!inner(name, price_yuan)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('激活码查询结果:', {
      count: codes?.length || 0,
      error: codesError,
      firstCode: codes?.[0]
    });

    // 2. 检查用户数据和token统计
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('phone, nickname, subscription_type, balance')
      .limit(10);

    console.log('用户查询结果:', {
      count: users?.length || 0,
      error: usersError,
      firstUser: users?.[0]
    });

    // 3. 检查消息和token统计
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, token_usage, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    console.log('消息查询结果:', {
      count: messages?.length || 0,
      error: messagesError,
      totalTokens: messages?.reduce((sum, m) => sum + (m.token_usage || 0), 0) || 0
    });

    // 4. 计算统计数据
    const stats = {
      totalUsers: users?.length || 0,
      paidUsers: users?.filter(u => u.subscription_type && u.subscription_type !== 'free').length || 0,
      totalCodes: codes?.length || 0,
      usedCodes: codes?.filter(c => c.is_used).length || 0,
      totalMessages: messages?.length || 0,
      totalTokens: messages?.reduce((sum, m) => sum + (m.token_usage || 0), 0) || 0,
      messagesWithTokens: messages?.filter(m => m.token_usage && m.token_usage > 0).length || 0
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      data: {
        codes: codes || [],
        users: users || [],
        messages: messages?.slice(0, 5) || []
      },
      errors: {
        codesError: codesError?.message || null,
        usersError: usersError?.message || null,
        messagesError: messagesError?.message || null
      }
    });

  } catch (error) {
    console.error('❌ 测试API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
