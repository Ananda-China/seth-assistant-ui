import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const conversationId = searchParams.get('conversation_id');

    if (!phone && !conversationId) {
      return Response.json({ error: '请提供用户手机号或对话ID' }, { status: 400 });
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      query: { phone, conversationId }
    };

    // 1. 如果提供了手机号，获取用户信息
    if (phone) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      results.user = {
        found: !!user,
        data: user,
        error: userError?.message
      };

      // 获取用户的所有对话
      const { data: conversations, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('user_phone', phone)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      results.conversations = {
        count: conversations?.length || 0,
        data: conversations,
        error: convError?.message
      };
    }

    // 2. 如果提供了对话ID，获取对话详情
    let targetConversationId = conversationId;
    if (!targetConversationId && phone) {
      // 使用最新的对话
      const { data: latestConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('user_phone', phone)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      targetConversationId = latestConv?.id;
    }

    if (targetConversationId) {
      // 获取对话信息
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', targetConversationId)
        .single();

      results.targetConversation = {
        found: !!conversation,
        data: conversation,
        error: convError?.message
      };

      // 获取对话的所有消息
      const { data: messages, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', targetConversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      results.messages = {
        count: messages?.length || 0,
        data: messages?.map(msg => ({
          id: msg.id,
          role: msg.role,
          contentLength: msg.content?.length || 0,
          contentPreview: msg.content?.substring(0, 100),
          tokenUsage: msg.token_usage,
          createdAt: msg.created_at
        })),
        fullData: messages,
        error: msgError?.message
      };

      // 分析消息模式
      const userMessages = messages?.filter(m => m.role === 'user') || [];
      const assistantMessages = messages?.filter(m => m.role === 'assistant') || [];
      
      results.analysis = {
        userMessageCount: userMessages.length,
        assistantMessageCount: assistantMessages.length,
        hasUnrepliedMessages: userMessages.length > assistantMessages.length,
        unrepliedCount: Math.max(0, userMessages.length - assistantMessages.length),
        lastUserMessage: userMessages[userMessages.length - 1] ? {
          content: userMessages[userMessages.length - 1].content?.substring(0, 100),
          createdAt: userMessages[userMessages.length - 1].created_at
        } : null,
        lastAssistantMessage: assistantMessages[assistantMessages.length - 1] ? {
          content: assistantMessages[assistantMessages.length - 1].content?.substring(0, 100),
          createdAt: assistantMessages[assistantMessages.length - 1].created_at
        } : null
      };
    }

    // 3. 检查用户权限
    if (phone) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (user) {
        // 检查订阅状态
        const { data: subscriptions } = await supabaseAdmin
          .from('subscriptions')
          .select('*, subscription_plans(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('end_date', { ascending: false });

        results.permissions = {
          userId: user.id,
          phone: user.phone,
          subscriptions: subscriptions?.map(sub => ({
            planName: (sub as any).subscription_plans?.name,
            status: sub.status,
            startDate: sub.start_date,
            endDate: sub.end_date,
            chatLimit: (sub as any).subscription_plans?.chat_limit,
            remainingChats: sub.remaining_chats
          })),
          hasActiveSubscription: (subscriptions?.length || 0) > 0
        };
      }
    }

    return Response.json(results);

  } catch (error) {
    console.error('诊断失败:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

