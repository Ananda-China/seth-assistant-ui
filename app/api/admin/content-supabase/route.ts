import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // 验证管理员权限
  const authResult = requireAdminAuth(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const showDeleted = searchParams.get('show_deleted') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const user = searchParams.get('user') || '';

    // 获取对话数据（根据参数决定是否包含已删除的）
    let conversationsQuery = supabase
      .from('conversations')
      .select('*');

    if (!showDeleted) {
      conversationsQuery = conversationsQuery.eq('is_deleted', false); // 只获取未删除的对话
    }

    const { data: conversations, error: convError } = await conversationsQuery
      .order('updated_at', { ascending: false });
    
    if (convError) {
      console.error('Error fetching conversations:', convError);
      return new Response('Failed to fetch conversations', { status: 500 });
    }

    // 获取消息数据（只获取未删除的）
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('is_deleted', false); // 只获取未删除的消息
    
    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return new Response('Failed to fetch messages', { status: 500 });
    }

    // 获取用户数据
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('phone, nickname');
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response('Failed to fetch users', { status: 500 });
    }

    // 创建用户映射
    const userMap = new Map(users.map(user => [user.phone, user.nickname || user.phone]));

    // 计算每个对话的消息统计
    const conversationStats = conversations.map(conv => {
      const convMessages = messages.filter(msg => msg.conversation_id === conv.id);
      const userMessages = convMessages.filter(msg => msg.role === 'user').length;
      const aiMessages = convMessages.filter(msg => msg.role === 'assistant').length;
      const totalTokens = convMessages.reduce((sum, msg) => sum + (msg.token_usage || 0), 0);

      // 获取对话的前几条消息作为预览
      const previewMessages = convMessages
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(0, 3)
        .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content.slice(0, 50)}...`)
        .join(' | ');

      return {
        id: conv.id,
        title: conv.title || '新会话',
        user: userMap.get(conv.user_phone) || conv.user_phone,
        status: 'active', // 默认状态为正常
        created_at: new Date(conv.created_at).getTime(),
        updated_at: new Date(conv.updated_at).getTime(),
        total_messages: convMessages.length,
        user_messages: userMessages,
        ai_messages: aiMessages,
        total_tokens: totalTokens,
        preview: previewMessages || '暂无消息',
        messages: convMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: new Date(msg.created_at).getTime(),
          token_usage: msg.token_usage || 0
        })),
        dify_conversation_id: conv.dify_conversation_id,
        is_deleted: conv.is_deleted || false
      };
    });

    // 计算统计数据（基于所有对话，不受分页影响）
    const stats = {
      total: conversationStats.length,
      normal: conversationStats.filter(c => c.status === 'active').length,
      flagged: conversationStats.filter(c => c.status === 'flagged').length,
      blocked: conversationStats.filter(c => c.status === 'blocked').length,
      totalMessages: conversationStats.reduce((sum, c) => sum + (c.total_messages || 0), 0)
    };

    console.log('📊 统计数据:', {
      conversationsCount: conversations?.length || 0,
      conversationStatsCount: conversationStats.length,
      stats,
      showDeleted,
      statusFilter: status
    });

    // 应用过滤
    let filteredConversations = conversationStats;

    if (search) {
      filteredConversations = filteredConversations.filter(conv =>
        conv.title.toLowerCase().includes(search.toLowerCase()) ||
        conv.user.toLowerCase().includes(search.toLowerCase()) ||
        conv.preview.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status) {
      filteredConversations = filteredConversations.filter(conv => conv.status === status);
    }

    if (user) {
      filteredConversations = filteredConversations.filter(conv =>
        conv.user.toLowerCase().includes(user.toLowerCase())
      );
    }

    // 计算分页
    const total = filteredConversations.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = filteredConversations.slice(startIndex, endIndex);

    return Response.json({
      conversations: paginatedConversations,
      pagination: {
        page,
        limit,
        total,
        pages
      },
      stats // 返回完整的统计数据
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
