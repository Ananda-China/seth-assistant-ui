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

    // 计算今天的时间范围（用于首行数据）
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

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

    // 获取对话数据（只获取未删除的）
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('is_deleted', false);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return new Response('Failed to fetch conversations', { status: 500 });
    }

    // 获取消息数据（只获取未删除的）
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('is_deleted', false);

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return new Response('Failed to fetch messages', { status: 500 });
    }

    console.log('📊 API数据获取调试:');
    console.log('  消息总数:', messages?.length || 0);
    if (messages && messages.length > 0) {
      console.log('  第一条消息:', messages[0]);
      console.log('  最后一条消息:', messages[messages.length - 1]);
    }

    // 获取订单数据
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*');
    
    if (orderError) {
      console.error('Error fetching orders:', orderError);
      // 订单错误不影响其他统计
    }

    // 辅助函数：将时间转换为Date对象（处理毫秒时间戳和ISO字符串）
    const toDate = (time: any): Date => {
      if (typeof time === 'number') {
        return new Date(time);
      } else if (typeof time === 'string') {
        return new Date(time);
      }
      return new Date();
    };

    // 过滤指定时间范围内的数据
    const recentUsers = users.filter((user: any) => {
      const userDate = toDate(user.created_at);
      return userDate >= startTime && userDate < endTime;
    });
    const recentConversations = conversations.filter((conv: any) => {
      const convDate = toDate(conv.created_at);
      return convDate >= startTime && convDate < endTime;
    });
    const recentMessages = messages.filter((msg: any) => {
      const msgDate = toDate(msg.created_at);
      return msgDate >= startTime && msgDate < endTime;
    });

    // 计算今日数据（首行始终显示今日数据）
    const todayUsers = users.filter((user: any) => {
      const userDate = toDate(user.created_at);
      return userDate >= todayStart && userDate < todayEnd;
    });

    // 今日消息
    const todayMessages = messages.filter((msg: any) => {
      const msgDate = toDate(msg.created_at);
      return msgDate >= todayStart && msgDate < todayEnd;
    });

    // 今日对话数：统计有今日消息的对话数（去重）
    const todayConversationIds = new Set<string>();
    todayMessages.forEach((msg: any) => {
      if (msg.conversation_id) {
        todayConversationIds.add(msg.conversation_id);
      }
    });
    const todayConversations = Array.from(todayConversationIds).map(id =>
      conversations.find((c: any) => c.id === id)
    ).filter(Boolean);

    const todayTokens = todayMessages.reduce((sum: number, msg: any) =>
      sum + (msg.token_usage || 0), 0
    );

    // 计算今日活跃用户（有对话或消息的用户）
    const todayActiveUserPhones = new Set<string>();
    todayConversations.forEach((conv: any) => {
      if (conv.user_phone) todayActiveUserPhones.add(conv.user_phone);
    });
    todayMessages.forEach((msg: any) => {
      if (msg.user_phone) todayActiveUserPhones.add(msg.user_phone);
    });
    const todayActiveUsers = todayActiveUserPhones.size;

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

    // 计算活跃用户（最近三天有聊天的用户数量）
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentThreeDaysMessages = messages.filter((msg: any) => {
      // 处理两种时间格式：ISO字符串和毫秒时间戳
      let msgDate: Date;
      if (typeof msg.created_at === 'number') {
        // 毫秒时间戳
        msgDate = new Date(msg.created_at);
      } else if (typeof msg.created_at === 'string') {
        // ISO字符串
        msgDate = new Date(msg.created_at);
      } else {
        return false;
      }
      return msgDate >= threeDaysAgo;
    });

    console.log('🔍 活跃用户计算调试:');
    console.log('  当前时间:', now.toISOString());
    console.log('  三天前:', threeDaysAgo.toISOString());
    console.log('  总消息数:', messages.length);
    console.log('  最近三天消息数:', recentThreeDaysMessages.length);
    console.log('  总对话数:', conversations.length);
    if (messages.length > 0) {
      console.log('  第一条消息时间:', messages[0].created_at, '类型:', typeof messages[0].created_at);
      const firstMsgDate = new Date(messages[0].created_at);
      console.log('  第一条消息转换后:', firstMsgDate.toISOString());
      console.log('  第一条消息是否在三天内:', firstMsgDate >= threeDaysAgo);
      console.log('  最后一条消息时间:', messages[messages.length - 1].created_at);
      const lastMsgDate = new Date(messages[messages.length - 1].created_at);
      console.log('  最后一条消息转换后:', lastMsgDate.toISOString());
      console.log('  最后一条消息是否在三天内:', lastMsgDate >= threeDaysAgo);
    }

    const activeUserPhones = new Set<string>();
    recentThreeDaysMessages.forEach((msg: any, index: number) => {
      const convId = msg.conversation_id;
      const conv = conversations.find((c: any) => c.id === convId);
      if (index < 3) {
        console.log(`  消息${index + 1}: conversation_id=${convId}, 找到对话=${!!conv}, user_phone=${conv?.user_phone}`);
      }
      if (conv && conv.user_phone) {
        activeUserPhones.add(conv.user_phone);
      }
    });
    console.log('  活跃用户数:', activeUserPhones.size);
    console.log('  活跃用户列表:', Array.from(activeUserPhones));

    const activeUsers = activeUserPhones.size;

    // 计算时间段内的活跃用户（用于下方分析框框）
    const recentActiveUsers = new Set(recentConversations.map((conv: any) => conv.user_phone)).size;

    // 计算时间段内的总token（用于Token使用分析框框）
    const periodTotalTokens = recentMessages.reduce((sum: number, msg: any) =>
      sum + (msg.token_usage || 0), 0
    );

    // 计算活跃度排行（Top 5）
    // 按今日对话数由高到低排序，相同则按最新对话时间排序
    const userActivityMap = new Map<string, {
      phone: string;
      today_messages: number;
      today_tokens: number;
      latest_conversation_time: Date;
    }>();

    // 统计今日每个用户的消息数和token消耗
    todayMessages.forEach((msg: any) => {
      const convId = msg.conversation_id;
      const conv = conversations.find((c: any) => c.id === convId);
      if (conv && conv.user_phone) {
        const phone = conv.user_phone;
        if (!userActivityMap.has(phone)) {
          userActivityMap.set(phone, {
            phone,
            today_messages: 0,
            today_tokens: 0,
            latest_conversation_time: toDate(msg.created_at)
          });
        }
        const userData = userActivityMap.get(phone)!;
        userData.today_messages += 1;
        userData.today_tokens += msg.token_usage || 0;
        // 更新最新对话时间
        const msgTime = toDate(msg.created_at);
        if (msgTime > userData.latest_conversation_time) {
          userData.latest_conversation_time = msgTime;
        }
      }
    });

    // 转换为数组并排序
    const activityRanking = Array.from(userActivityMap.values())
      .sort((a, b) => {
        // 先按今日消息数降序
        if (b.today_messages !== a.today_messages) {
          return b.today_messages - a.today_messages;
        }
        // 相同则按最新对话时间降序
        return b.latest_conversation_time.getTime() - a.latest_conversation_time.getTime();
      })
      .slice(0, 5); // 只取Top 5

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
        const userDate = toDate(user.created_at);
        return userDate >= dayStart && userDate < dayEnd;
      }).length;

      const dayConversations = conversations.filter((conv: any) => {
        const convDate = toDate(conv.created_at);
        return convDate >= dayStart && convDate < dayEnd;
      }).length;

      const dayMessages = messages.filter((msg: any) => {
        const msgDate = toDate(msg.created_at);
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

    // 计算时间段内的平均每消息Token
    const recentAvgTokensPerMessage = recentMessages.length > 0 ? recentTokens / recentMessages.length : 0;

    // 计算用户参与度
    const userEngagement = {
      active_users: activeUsers,
      recent_active: recentActiveUsers,
      today_active: todayActiveUsers,
      engagement_rate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0'
    };

    return Response.json({
      period,
      overview: {
        user_growth: userGrowth,
        conversation_activity: conversationActivity,
        message_stats: messageStats,
        user_engagement: userEngagement,
        // 添加今日数据（首行始终显示今日数据）
        today_data: {
          new_users: todayUsers.length,
          new_conversations: todayConversations.length,
          new_messages: todayMessages.length,
          today_tokens: todayTokens,
          today_active_users: todayActiveUsers,
          // 添加总数据（显示在框框下方）
          total_users: totalUsers,
          total_conversations: totalConversations,
          total_messages: totalMessages
        },
        // 添加时间段相关的数据（用于下方三个分析框框）
        period_data: {
          period_active_users: recentActiveUsers,
          period_tokens: recentTokens,
          period_total_tokens: periodTotalTokens,
          period_avg_tokens_per_message: recentAvgTokensPerMessage.toFixed(1),
          period_conversations: newConversations,
          period_messages: newMessages
        }
      },
      trends: {
        daily_data: dailyData
      },
      activity_ranking: activityRanking.map(item => ({
        phone: item.phone,
        today_messages: item.today_messages,
        today_tokens: item.today_tokens
      })),
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
