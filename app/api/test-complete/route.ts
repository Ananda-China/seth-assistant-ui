import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 完整测试开始...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // 1. 测试用户数据
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(5);
      
      results.tests.users = {
        success: !usersError,
        count: users?.length || 0,
        sampleData: users?.map(u => ({
          phone: u.phone,
          subscription_type: u.subscription_type,
          status: u.status,
          created_at: u.created_at
        })) || [],
        error: usersError?.message || null
      };
    } catch (err) {
      results.tests.users = {
        success: false,
        error: err instanceof Error ? err.message : '用户查询失败'
      };
    }

    // 2. 测试对话数据
    try {
      const { data: conversations, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .limit(5);
      
      results.tests.conversations = {
        success: !convError,
        count: conversations?.length || 0,
        sampleData: conversations?.slice(0, 3) || [],
        error: convError?.message || null
      };
    } catch (err) {
      results.tests.conversations = {
        success: false,
        error: err instanceof Error ? err.message : '对话查询失败'
      };
    }

    // 3. 测试消息和token数据
    try {
      const { data: messages, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('conversation_id, token_usage, created_at')
        .limit(10);
      
      const totalTokens = messages?.reduce((sum, msg) => sum + (msg.token_usage || 0), 0) || 0;
      
      results.tests.messages = {
        success: !msgError,
        count: messages?.length || 0,
        totalTokens: totalTokens,
        sampleData: messages?.slice(0, 3) || [],
        error: msgError?.message || null
      };
    } catch (err) {
      results.tests.messages = {
        success: false,
        error: err instanceof Error ? err.message : '消息查询失败'
      };
    }

    // 4. 测试余额数据
    try {
      const { data: balances, error: balanceError } = await supabaseAdmin
        .from('balances')
        .select('*')
        .limit(5);
      
      results.tests.balances = {
        success: !balanceError,
        count: balances?.length || 0,
        sampleData: balances || [],
        error: balanceError?.message || null
      };
    } catch (err) {
      results.tests.balances = {
        success: false,
        error: err instanceof Error ? err.message : '余额查询失败'
      };
    }

    // 5. 测试佣金数据
    try {
      const { data: commissions, error: commError } = await supabaseAdmin
        .from('commission_records')
        .select('*')
        .limit(5);
      
      results.tests.commissions = {
        success: !commError,
        count: commissions?.length || 0,
        sampleData: commissions || [],
        error: commError?.message || null
      };
    } catch (err) {
      results.tests.commissions = {
        success: false,
        error: err instanceof Error ? err.message : '佣金查询失败'
      };
    }

    // 6. 测试付费用户统计
    try {
      const { data: paidUsers, error: paidError } = await supabaseAdmin
        .from('users')
        .select('phone, subscription_type')
        .neq('subscription_type', 'free');
      
      results.tests.paidUsers = {
        success: !paidError,
        count: paidUsers?.length || 0,
        sampleData: paidUsers || [],
        error: paidError?.message || null
      };
    } catch (err) {
      results.tests.paidUsers = {
        success: false,
        error: err instanceof Error ? err.message : '付费用户查询失败'
      };
    }

    // 7. 测试用户管理API模拟
    try {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(3);

      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id, user_phone');

      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('conversation_id, token_usage');

      const { data: balances } = await supabaseAdmin
        .from('balances')
        .select('user_id, amount');

      const enrichedUsers = users?.map((user: any) => {
        const userConversations = conversations?.filter(conv => conv.user_phone === user.phone) || [];
        const userMessages = messages?.filter(msg =>
          userConversations.some(conv => conv.id === msg.conversation_id)
        ) || [];
        const userTokens = userMessages.reduce((sum, msg) => sum + (msg.token_usage || 0), 0);
        const userBalance = balances?.find(b => b.user_id === user.id);

        return {
          phone: user.phone,
          subscription_type: user.subscription_type,
          status: user.status,
          total_conversations: userConversations.length,
          total_messages: userMessages.length,
          total_tokens: userTokens,
          balance: (userBalance?.amount || 0) / 100
        };
      }) || [];

      results.tests.userManagementAPI = {
        success: true,
        enrichedUsers: enrichedUsers,
        paidUsersCount: enrichedUsers.filter(u => u.subscription_type !== 'free').length
      };
    } catch (err) {
      results.tests.userManagementAPI = {
        success: false,
        error: err instanceof Error ? err.message : '用户管理API测试失败'
      };
    }

    // 8. 汇总统计
    results.summary = {
      totalTests: Object.keys(results.tests).length,
      passedTests: Object.values(results.tests).filter((test: any) => test.success).length,
      failedTests: Object.values(results.tests).filter((test: any) => !test.success).length
    };

    console.log('🔍 完整测试结果:', results);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('🔍 完整测试出错:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '测试失败'
    }, { status: 500 });
  }
}
