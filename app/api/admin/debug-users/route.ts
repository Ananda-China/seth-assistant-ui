import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 调试用户数据API开始...');
    
    // 1. 获取所有用户
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('获取用户失败:', usersError);
      return NextResponse.json({ error: '获取用户失败', details: usersError }, { status: 500 });
    }
    
    console.log(`获取到 ${allUsers?.length || 0} 个用户`);
    
    // 2. 获取所有订阅
    const { data: allSubscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (subError) {
      console.error('获取订阅失败:', subError);
    }
    
    console.log(`获取到 ${allSubscriptions?.length || 0} 个订阅`);
    
    // 3. 统计付费用户
    const now = new Date();
    const paidUsersFromUsers = allUsers?.filter(user => {
      if (!user.subscription_type || user.subscription_type === 'free') return false;
      if (!user.subscription_end) return true; // 没有结束时间认为是永久
      return new Date(user.subscription_end) > now;
    }) || [];
    
    const activeSubs = allSubscriptions?.filter(sub => {
      if (sub.status !== 'active') return false;
      return new Date(sub.current_period_end) > now;
    }) || [];
    
    // 合并付费用户（去重）
    const allPaidUserPhones = new Set();
    paidUsersFromUsers.forEach(u => allPaidUserPhones.add(u.phone));
    activeSubs.forEach(s => allPaidUserPhones.add(s.user_phone));
    
    // 4. 获取对话和消息统计
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, user_phone');
    
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('conversation_id, token_usage');
    
    // 5. 计算统计数据
    const totalConversations = conversations?.length || 0;
    const totalMessages = messages?.length || 0;
    const totalTokens = messages?.reduce((sum, msg) => sum + (msg.token_usage || 0), 0) || 0;
    
    // 6. 准备返回数据
    const userStats = allUsers?.map(user => {
      const userConversations = conversations?.filter(c => c.user_phone === user.phone) || [];
      const userMessages = messages?.filter(m => 
        userConversations.some(c => c.id === m.conversation_id)
      ) || [];
      const userTokens = userMessages.reduce((sum, msg) => sum + (msg.token_usage || 0), 0);
      
      const isPaidUser = allPaidUserPhones.has(user.phone);
      const subscription = allSubscriptions?.find(s => s.user_phone === user.phone);
      
      return {
        phone: user.phone,
        subscription_type: user.subscription_type || 'free',
        subscription_end: user.subscription_end,
        is_paid_user: isPaidUser,
        conversations_count: userConversations.length,
        messages_count: userMessages.length,
        tokens_used: userTokens,
        created_at: user.created_at,
        subscription_status: subscription?.status || null,
        subscription_end_from_sub: subscription?.current_period_end || null
      };
    }) || [];
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_users: allUsers?.length || 0,
        paid_users_count: allPaidUserPhones.size,
        paid_users_from_users_table: paidUsersFromUsers.length,
        paid_users_from_subscriptions: activeSubs.length,
        total_conversations: totalConversations,
        total_messages: totalMessages,
        total_tokens: totalTokens
      },
      users: userStats.slice(0, 20), // 只返回前20个用户
      paid_users: userStats.filter(u => u.is_paid_user),
      debug_info: {
        users_table_count: allUsers?.length || 0,
        subscriptions_table_count: allSubscriptions?.length || 0,
        conversations_table_count: totalConversations,
        messages_table_count: totalMessages,
        current_time: now.toISOString()
      }
    };
    
    console.log('调试结果:', {
      totalUsers: result.summary.total_users,
      paidUsers: result.summary.paid_users_count,
      conversations: result.summary.total_conversations,
      messages: result.summary.total_messages,
      tokens: result.summary.total_tokens
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('调试API失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
