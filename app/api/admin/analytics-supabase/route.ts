import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // 验证管理员权限
  const authResult = requireAdminAuth(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 计算时间范围
    const now = new Date();
    let startTime: Date;
    let endTime: Date = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 默认到明天

    if (period === 'today') {
      // 今天的开始时间（从今天凌晨00:00:00开始）
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      // 今天的结束时间（到明天凌晨00:00:00）
      endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    } else if (period === 'yesterday') {
      // 昨天的开始时间
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startTime = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      // 昨天的结束时间
      endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    } else {
      const periodMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '14d': 14 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }[period] || 30 * 24 * 60 * 60 * 1000;

      startTime = new Date(now.getTime() - periodMs);
    }

    // 获取用户数据
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response('Failed to fetch users', { status: 500 });
    }

    // 获取对话数据
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*');
    
    if (convError) {
      console.error('Error fetching conversations:', convError);
      return new Response('Failed to fetch conversations', { status: 500 });
    }

    // 获取消息数据
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*');
    
    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return new Response('Failed to fetch messages', { status: 500 });
    }

    // 获取订单数据
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*');
    
    if (orderError) {
      console.error('Error fetching orders:', orderError);
      // 订单错误不影响其他统计
    }

    // 过滤指定时间范围内的数据
    const recentUsers = users.filter((user: any) => {
      const userDate = new Date(user.created_at);
      return userDate >= startTime && userDate < endTime;
    });
    const recentConversations = conversations.filter((conv: any) => {
      const convDate = new Date(conv.created_at);
      return convDate >= startTime && convDate < endTime;
    });
    const recentMessages = messages.filter((msg: any) => {
      const msgDate = new Date(msg.created_at);
      return msgDate >= startTime && msgDate < endTime;
    });

    // 计算基础统计数据
    const totalUsers = users.length;
    const newUsers = recentUsers.length;
    const totalConversations = conversations.length;
    const newConversations = recentConversations.length;
    const totalMessages = messages.length;
    const newMessages = recentMessages.length;
    
    // 计算token使用量
    const totalTokens = messages.reduce((sum: number, msg: any) => 
      sum + (msg.token_usage || 0), 0
    );
    const recentTokens = recentMessages.reduce((sum: number, msg: any) => 
      sum + (msg.token_usage || 0), 0
    );

    // 计算活跃用户（有对话的用户）
    const activeUsers = new Set(conversations.map((conv: any) => conv.user_phone)).size;
    const recentActiveUsers = new Set(recentConversations.map((conv: any) => conv.user_phone)).size;

    // 计算平均对话长度
    const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
    const avgTokensPerMessage = totalMessages > 0 ? totalTokens / totalMessages : 0;

    // 生成每日趋势数据（最近7天）
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayUsers = users.filter((user: any) => {
        const userDate = new Date(user.created_at);
        return userDate >= dayStart && userDate < dayEnd;
      }).length;
      
      const dayConversations = conversations.filter((conv: any) => {
        const convDate = new Date(conv.created_at);
        return convDate >= dayStart && convDate < dayEnd;
      }).length;
      
      const dayMessages = messages.filter((msg: any) => {
        const msgDate = new Date(msg.created_at);
        return msgDate >= dayStart && msgDate < dayEnd;
      }).length;
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        users: dayUsers,
        conversations: dayConversations,
        messages: dayMessages
      });
    }

    // 计算用户增长趋势
    const userGrowth = {
      total: totalUsers,
      new: newUsers,
      growth_rate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : '0.0'
    };

    // 计算对话活跃度
    const conversationActivity = {
      total: totalConversations,
      new: newConversations,
      avg_per_user: totalUsers > 0 ? (totalConversations / totalUsers).toFixed(1) : '0.0',
      avg_messages: avgMessagesPerConversation.toFixed(1)
    };

    // 计算消息和token统计
    const messageStats = {
      total: totalMessages,
      new: newMessages,
      avg_per_conversation: avgMessagesPerConversation.toFixed(1),
      total_tokens: totalTokens,
      recent_tokens: recentTokens,
      avg_tokens_per_message: avgTokensPerMessage.toFixed(1)
    };

    // 计算用户参与度
    const userEngagement = {
      active_users: activeUsers,
      recent_active: recentActiveUsers,
      engagement_rate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0'
    };

    return Response.json({
      period,
      overview: {
        user_growth: userGrowth,
        conversation_activity: conversationActivity,
        message_stats: messageStats,
        user_engagement: userEngagement
      },
      trends: {
        daily_data: dailyData
      },
      top_metrics: [
        {
          label: '总用户数',
          value: totalUsers,
          change: newUsers > 0 ? `+${newUsers}` : '0',
          change_type: newUsers > 0 ? 'positive' : 'neutral'
        },
        {
          label: '总对话数',
          value: totalConversations,
          change: newConversations > 0 ? `+${newConversations}` : '0',
          change_type: newConversations > 0 ? 'positive' : 'neutral'
        },
        {
          label: '总消息数',
          value: totalMessages,
          change: newMessages > 0 ? `+${newMessages}` : '0',
          change_type: newMessages > 0 ? 'positive' : 'neutral'
        },
        {
          label: 'Token使用量',
          value: totalTokens.toLocaleString(),
          change: recentTokens > 0 ? `+${recentTokens.toLocaleString()}` : '0',
          change_type: recentTokens > 0 ? 'positive' : 'neutral'
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
