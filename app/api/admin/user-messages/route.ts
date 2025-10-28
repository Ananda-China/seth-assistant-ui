import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return Response.json({ error: '请提供用户手机号' }, { status: 400 });
    }

    // 1. 获取用户信息
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    // 2. 获取用户的所有对话
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_phone', phone)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (convError) {
      return Response.json({ error: '获取对话失败' }, { status: 500 });
    }

    // 3. 获取所有对话的消息详情
    const conversationDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: messages, error: msgError } = await supabaseAdmin
          .from('messages')
          .select('id, role, content, token_usage, created_at')
          .eq('conversation_id', conv.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (msgError) {
          return {
            ...conv,
            messages: [],
            error: msgError.message
          };
        }

        // 计算对话统计
        const totalTokens = messages?.reduce((sum, msg) => sum + (msg.token_usage || 0), 0) || 0;
        const userMessages = messages?.filter(m => m.role === 'user') || [];
        const assistantMessages = messages?.filter(m => m.role === 'assistant') || [];

        return {
          ...conv,
          messageCount: messages?.length || 0,
          userMessageCount: userMessages.length,
          assistantMessageCount: assistantMessages.length,
          totalTokens,
          avgTokensPerMessage: messages?.length ? (totalTokens / messages.length).toFixed(2) : '0',
          messages: messages?.map(msg => ({
            id: msg.id,
            role: msg.role,
            contentLength: msg.content?.length || 0,
            contentPreview: msg.content?.substring(0, 100) + (msg.content?.length > 100 ? '...' : ''),
            tokenUsage: msg.token_usage || 0,
            createdAt: msg.created_at
          })) || []
        };
      })
    );

    // 4. 计算总体统计
    const totalConversations = conversations?.length || 0;
    const totalMessages = conversationDetails.reduce((sum, conv) => sum + conv.messageCount, 0);
    const totalTokens = conversationDetails.reduce((sum, conv) => sum + conv.totalTokens, 0);
    const totalUserMessages = conversationDetails.reduce((sum, conv) => sum + conv.userMessageCount, 0);
    const totalAssistantMessages = conversationDetails.reduce((sum, conv) => sum + conv.assistantMessageCount, 0);

    return Response.json({
      user: {
        phone: user.phone,
        nickname: user.nickname,
        subscriptionType: user.subscription_type,
        status: user.status,
        createdAt: user.created_at
      },
      statistics: {
        totalConversations,
        totalMessages,
        totalUserMessages,
        totalAssistantMessages,
        totalTokens,
        avgTokensPerMessage: totalMessages > 0 ? (totalTokens / totalMessages).toFixed(2) : '0',
        avgTokensPerConversation: totalConversations > 0 ? (totalTokens / totalConversations).toFixed(2) : '0'
      },
      conversations: conversationDetails
    });

  } catch (error) {
    console.error('查询用户消息失败:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

