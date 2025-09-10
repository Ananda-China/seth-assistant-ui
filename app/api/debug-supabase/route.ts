import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    console.log('🔍 开始调试 Supabase 数据...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      }
    };

    // 1. 测试基本连接
    try {
      const { data: connectionTest, error: connectionError } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);
      
      results.connectionTest = {
        success: !connectionError,
        error: connectionError?.message || null
      };
    } catch (err) {
      results.connectionTest = {
        success: false,
        error: err instanceof Error ? err.message : '连接测试失败'
      };
    }

    // 2. 检查套餐表
    try {
      const { data: plans, error: plansError } = await supabaseAdmin
        .from('plans')
        .select('*');
      
      results.plans = {
        success: !plansError,
        count: plans?.length || 0,
        data: plans || [],
        error: plansError?.message || null
      };
    } catch (err) {
      results.plans = {
        success: false,
        error: err instanceof Error ? err.message : '套餐查询失败'
      };
    }

    // 3. 检查激活码表
    try {
      const { data: codes, error: codesError } = await supabaseAdmin
        .from('activation_codes')
        .select('*')
        .limit(10);
      
      results.activationCodes = {
        success: !codesError,
        count: codes?.length || 0,
        data: codes || [],
        error: codesError?.message || null
      };
    } catch (err) {
      results.activationCodes = {
        success: false,
        error: err instanceof Error ? err.message : '激活码查询失败'
      };
    }

    // 4. 检查用户表
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, phone, nickname')
        .limit(5);
      
      results.users = {
        success: !usersError,
        count: users?.length || 0,
        data: users || [],
        error: usersError?.message || null
      };
    } catch (err) {
      results.users = {
        success: false,
        error: err instanceof Error ? err.message : '用户查询失败'
      };
    }

    // 5. 检查对话表
    try {
      const { data: conversations, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('id, user_phone, title, created_at')
        .limit(5);

      results.conversations = {
        success: !convError,
        count: conversations?.length || 0,
        data: conversations || [],
        error: convError?.message || null
      };
    } catch (err) {
      results.conversations = {
        success: false,
        error: err instanceof Error ? err.message : '对话查询失败'
      };
    }

    // 6. 检查消息表和token统计
    try {
      const { data: messages, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('id, conversation_id, role, token_usage, created_at')
        .limit(5);

      // 统计总token使用量
      const totalTokens = messages?.reduce((sum, msg) => sum + (msg.token_usage || 0), 0) || 0;

      results.messages = {
        success: !msgError,
        count: messages?.length || 0,
        totalTokens: totalTokens,
        data: messages || [],
        error: msgError?.message || null
      };
    } catch (err) {
      results.messages = {
        success: false,
        error: err instanceof Error ? err.message : '消息查询失败'
      };
    }

    // 7. 检查用户统计数据
    try {
      const { data: userStats, error: statsError } = await supabaseAdmin
        .from('users')
        .select('*');

      if (!statsError && userStats) {
        const stats = {
          totalUsers: userStats.length,
          activeUsers: userStats.filter(u => u.status === 'active').length,
          trialUsers: userStats.filter(u => u.subscription_type === 'free').length,
          paidUsers: userStats.filter(u => u.subscription_type !== 'free').length,
        };

        results.userStats = {
          success: true,
          stats: stats,
          sampleUsers: userStats.slice(0, 3)
        };
      } else {
        results.userStats = {
          success: false,
          error: statsError?.message || null
        };
      }
    } catch (err) {
      results.userStats = {
        success: false,
        error: err instanceof Error ? err.message : '用户统计失败'
      };
    }

    // 8. 尝试联表查询（这是后台API使用的查询）
    try {
      const { data: joinedCodes, error: joinError } = await supabaseAdmin
        .from('activation_codes')
        .select(`
          *,
          plan:plans(*),
          used_by_user:users(phone, nickname)
        `)
        .limit(5);

      results.joinedQuery = {
        success: !joinError,
        count: joinedCodes?.length || 0,
        data: joinedCodes || [],
        error: joinError?.message || null
      };
    } catch (err) {
      results.joinedQuery = {
        success: false,
        error: err instanceof Error ? err.message : '联表查询失败'
      };
    }

    console.log('🔍 调试结果:', results);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('🔍 调试过程出错:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '调试失败'
    }, { status: 500 });
  }
}
