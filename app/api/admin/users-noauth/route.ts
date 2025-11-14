import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 无认证用户管理API开始...');
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    // 1. 获取用户数据
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (search) {
      query = query.ilike('phone', `%${search}%`);
    }
    
    const { data: allUsers, error: usersError } = await query;
    
    if (usersError) {
      console.error('获取用户失败:', usersError);
      return NextResponse.json({ error: '获取用户失败' }, { status: 500 });
    }
    
    // 2. 获取订阅数据
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*');
    
    // 3. 获取对话数据
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, user_phone');
    
    // 4. 获取消息数据
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('conversation_id, token_usage');
    
    // 5. 统计付费用户
    const now = new Date();
    const paidUserPhones = new Set<string>();
    
    // 从users表统计
    allUsers?.forEach(user => {
      if (user.subscription_type && user.subscription_type !== 'free') {
        if (!user.subscription_end || new Date(user.subscription_end) > now) {
          paidUserPhones.add(user.phone);
        }
      }
    });
    
    // 从subscriptions表统计
    subscriptions?.forEach(sub => {
      if (sub.status === 'active' && new Date(sub.current_period_end) > now) {
        paidUserPhones.add(sub.user_phone);
      }
    });
    
    // 6. 计算每个用户的统计数据
    const usersWithStats = allUsers?.map(user => {
      const userConversations = conversations?.filter(c => c.user_phone === user.phone) || [];
      const userMessages = messages?.filter(m => 
        userConversations.some(c => c.id === m.conversation_id)
      ) || [];
      const userTokens = userMessages.reduce((sum, msg) => sum + (msg.token_usage || 0), 0);
      
      const isPaidUser = paidUserPhones.has(user.phone);
      const subscription = subscriptions?.find(s => s.user_phone === user.phone);
      
      return {
        id: user.id,
        phone: user.phone,
        subscription_type: user.subscription_type || 'free',
        subscription_end: user.subscription_end,
        is_paid_user: isPaidUser,
        status: isPaidUser ? 'active' : 'free',
        conversations_count: userConversations.length,
        messages_count: userMessages.length,
        tokens_used: userTokens,
        created_at: user.created_at,
        updated_at: user.updated_at,
        subscription_details: subscription ? {
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          plan_id: subscription.plan_id
        } : null
      };
    }) || [];
    
    // 7. 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = usersWithStats.slice(startIndex, endIndex);
    
    // 8. 计算总体统计
    const totalConversations = conversations?.length || 0;
    const totalMessages = messages?.length || 0;
    const totalTokens = messages?.reduce((sum, msg) => sum + (msg.token_usage || 0), 0) || 0;
    
    const result = {
      success: true,
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: usersWithStats.length,
        totalPages: Math.ceil(usersWithStats.length / limit),
        hasNext: endIndex < usersWithStats.length,
        hasPrev: page > 1
      },
      statistics: {
        total_users: usersWithStats.length,
        paid_users: paidUserPhones.size,
        free_users: usersWithStats.length - paidUserPhones.size,
        total_conversations: totalConversations,
        total_messages: totalMessages,
        total_tokens: totalTokens
      },
      debug_info: {
        users_from_db: allUsers?.length || 0,
        subscriptions_from_db: subscriptions?.length || 0,
        conversations_from_db: conversations?.length || 0,
        messages_from_db: messages?.length || 0,
        paid_users_calculation: {
          from_users_table: allUsers?.filter(u => 
            u.subscription_type && u.subscription_type !== 'free' && 
            (!u.subscription_end || new Date(u.subscription_end) > now)
          ).length || 0,
          from_subscriptions_table: subscriptions?.filter(s => 
            s.status === 'active' && new Date(s.current_period_end) > now
          ).length || 0,
          combined_unique: paidUserPhones.size
        },
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('用户管理API结果:', {
      totalUsers: result.statistics.total_users,
      paidUsers: result.statistics.paid_users,
      conversations: result.statistics.total_conversations,
      messages: result.statistics.total_messages,
      tokens: result.statistics.total_tokens
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('用户管理API失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
