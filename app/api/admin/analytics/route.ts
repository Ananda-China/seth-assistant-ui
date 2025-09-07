import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';

export async function GET(req: NextRequest) {
  // 验证管理员权限
  const adminUser = requireAdminAuth(req);
  if (!adminUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';

  try {
    // 从文件系统读取所有数据
    const { promises: fs } = await import('fs');
    const path = await import('path');
    const DATA_DIR = path.join(process.cwd(), '.data');
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    const CONV_FILE = path.join(DATA_DIR, 'conversations.json');
    const MSG_FILE = path.join(DATA_DIR, 'messages.json');
    
    let users = [];
    let conversations = [];
    let messages = [];
    
    try {
      const userData = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(userData || '[]');
    } catch (error) {
      console.log('No users file found, starting with empty array');
      users = [];
    }
    
    try {
      const convData = await fs.readFile(CONV_FILE, 'utf8');
      conversations = JSON.parse(convData || '[]');
    } catch (error) {
      console.log('No conversations file found, starting with empty array');
      conversations = [];
    }
    
    try {
      const msgData = await fs.readFile(MSG_FILE, 'utf8');
      messages = JSON.parse(msgData || '[]');
    } catch (error) {
      console.log('No messages file found, starting with empty array');
      messages = [];
    }

    // 计算时间范围
    const now = Date.now();
    const periodMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '14d': 14 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[period] || 30 * 24 * 60 * 60 * 1000;
    
    const startTime = now - periodMs;

    // 过滤指定时间范围内的数据
    const recentUsers = users.filter((user: any) => user.created_at >= startTime);
    const recentConversations = conversations.filter((conv: any) => conv.created_at >= startTime);
    const recentMessages = messages.filter((msg: any) => msg.created_at >= startTime);

    // 计算基础统计数据
    const totalUsers = users.length;
    const newUsers = recentUsers.length;
    const totalConversations = conversations.length;
    const newConversations = recentConversations.length;
    const totalMessages = messages.length;
    const newMessages = recentMessages.length;
    
    // 计算token使用量
    const totalTokens = messages.reduce((sum: number, msg: any) => sum + (msg.token_usage || 0), 0);
    const recentTokens = recentMessages.reduce((sum: number, msg: any) => sum + (msg.token_usage || 0), 0);

    // 计算活跃用户（有对话的用户）
    const activeUsers = new Set(conversations.map((conv: any) => conv.user)).size;
    const recentActiveUsers = new Set(recentConversations.map((conv: any) => conv.user)).size;

    // 计算平均对话长度
    const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
    const avgTokensPerMessage = totalMessages > 0 ? totalTokens / totalMessages : 0;

    // 生成每日趋势数据（最近7天）
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const dayUsers = users.filter((user: any) => 
        user.created_at >= dayStart && user.created_at < dayEnd
      ).length;
      
      const dayConversations = conversations.filter((conv: any) => 
        conv.created_at >= dayStart && conv.created_at < dayEnd
      ).length;
      
      const dayMessages = messages.filter((msg: any) => 
        msg.created_at >= dayStart && msg.created_at < dayEnd
      ).length;
      
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
