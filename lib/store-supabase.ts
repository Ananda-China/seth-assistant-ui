import { supabaseAdmin } from './supabase';

export type Conversation = {
  id: string;
  user_phone: string;
  title: string | null;
  dify_conversation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  token_usage?: number;
  created_at: string;
};

// 获取用户的对话列表
export async function getConversations(userPhone: string): Promise<Conversation[]> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('user_phone', userPhone)
    .eq('is_deleted', false) // 只获取未删除的对话
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// 创建新对话
export async function createConversation(userPhone: string, title?: string): Promise<Conversation> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      user_phone: userPhone,
      title: title || '新会话'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 获取对话详情
export async function getConversation(userPhone: string, conversationId: string): Promise<Conversation | null> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_phone', userPhone)
    .eq('is_deleted', false) // 只获取未删除的对话
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// 更新对话标题
export async function updateConversationTitle(userPhone: string, conversationId: string, title: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ title })
    .eq('id', conversationId)
    .eq('user_phone', userPhone);

  if (error) throw error;
}

// 设置 Dify 对话 ID
export async function setDifyConversationId(userPhone: string, conversationId: string, difyConversationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ dify_conversation_id: difyConversationId })
    .eq('id', conversationId)
    .eq('user_phone', userPhone);

  if (error) throw error;
}

// 删除对话（软删除）
export async function deleteConversation(userPhone: string, conversationId: string): Promise<void> {
  // 软删除：标记为已删除，而不是物理删除
  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', conversationId)
    .eq('user_phone', userPhone);

  if (error) throw error;
  
  // 同时软删除相关的消息
  const { error: msgError } = await supabaseAdmin
    .from('messages')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq('conversation_id', conversationId);

  if (msgError) {
    console.warn('删除对话消息失败:', msgError);
    // 不抛出错误，因为对话删除已经成功
  }
}

// 获取对话的消息列表
export async function getMessages(userPhone: string, conversationId: string): Promise<Message[]> {
  // 首先验证对话是否属于该用户
  const conversation = await getConversation(userPhone, conversationId);
  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false) // 只获取未删除的消息
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 添加消息
export async function addMessage(
  userPhone: string,
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  token_usage?: number
): Promise<Message> {
  // 首先验证对话是否属于该用户
  const conversation = await getConversation(userPhone, conversationId);
  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      token_usage: token_usage || 0
    })
    .select()
    .single();

  if (error) throw error;

  // 更新对话的 updated_at 时间
  await supabaseAdmin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

// 确保对话有合适的标题
export async function ensureConversationTitle(userPhone: string, conversationId: string, suggestedTitle: string): Promise<void> {
  const conversation = await getConversation(userPhone, conversationId);
  if (!conversation) return;

  // 如果标题是默认值或为空，则更新
  if (!conversation.title || conversation.title === '新会话' || conversation.title.trim().length === 0) {
    await updateConversationTitle(userPhone, conversationId, suggestedTitle);
  }
}

// 获取用户的消息统计
export async function getUserMessageStats(userPhone: string): Promise<{
  totalConversations: number;
  totalMessages: number;
  todayMessages: number;
}> {
  // 获取对话数量
  const { count: conversationCount } = await supabaseAdmin
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_phone', userPhone)
    .eq('is_deleted', false);

  // 获取总消息数量
  const { data: userConversations } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('user_phone', userPhone)
    .eq('is_deleted', false);
  
  const conversationIds = userConversations?.map(c => c.id) || [];
  
  const { count: totalMessageCount } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .eq('is_deleted', false);

  // 获取今日消息数量
  const today = new Date().toISOString().split('T')[0];
  const { count: todayMessageCount } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)
    .in('conversation_id', conversationIds);

  return {
    totalConversations: conversationCount || 0,
    totalMessages: totalMessageCount || 0,
    todayMessages: todayMessageCount || 0
  };
}

// 管理员获取所有对话（用于后台管理）
export async function getAllConversationsForAdmin(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabaseAdmin
    .from('conversations')
    .select(`
      *,
      users!conversations_user_phone_fkey(phone, nickname)
    `, { count: 'exact' })
    .eq('is_deleted', false) // 只获取未删除的对话
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    conversations: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

// 管理员获取用户的对话详情
export async function getConversationForAdmin(conversationId: string) {
  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select(`
      *,
      users!conversations_user_phone_fkey(phone, nickname)
    `)
    .eq('id', conversationId)
    .single();

  if (convError) throw convError;

  const { data: messages, error: msgError } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (msgError) throw msgError;

  return {
    conversation,
    messages: messages || []
  };
}

// 兼容性函数：listMessages (别名)
export async function listMessages(userPhone: string, conversationId: string): Promise<Message[]> {
  return getMessages(userPhone, conversationId);
}

// 兼容性函数：listConversations (别名)
export async function listConversations(userPhone: string): Promise<Conversation[]> {
  return getConversations(userPhone);
}

// 兼容性函数：renameConversation
export async function renameConversation(userPhone: string, conversationId: string, title: string): Promise<boolean> {
  try {
    await updateConversationTitle(userPhone, conversationId, title);
    return true;
  } catch (error) {
    console.error('Failed to rename conversation:', error);
    return false;
  }
}
