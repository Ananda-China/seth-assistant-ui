/**
 * 聊天客户端工具
 * 用于前端选择合适的AI聊天API端点
 */

/**
 * 检查用户是否有定制化AI配置
 */
export async function hasCustomAIConfig(): Promise<boolean> {
  try {
    const response = await fetch('/api/user/custom-ai-config');
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.hasCustomConfig === true;
  } catch (error) {
    console.error('❌ 检查定制化配置失败:', error);
    return false;
  }
}

/**
 * 获取合适的聊天API端点
 * 如果用户有定制化配置，返回 /api/chat-custom
 * 否则返回 /api/chat（共享AI）
 */
export async function getChatEndpoint(): Promise<string> {
  const hasCustom = await hasCustomAIConfig();
  return hasCustom ? '/api/chat-custom' : '/api/chat';
}

/**
 * 发送聊天消息到合适的端点
 */
export async function sendChatMessage(
  query: string,
  conversationId?: string
): Promise<Response> {
  const endpoint = await getChatEndpoint();
  
  console.log('📤 发送聊天消息:', {
    endpoint,
    queryLength: query.length,
    hasConversationId: !!conversationId
  });

  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      conversation_id: conversationId,
      client_conversation_id: conversationId,
    }),
  });
}

/**
 * 获取用户的AI配置信息（不包含敏感信息）
 */
export async function getUserAIConfigInfo(): Promise<{
  hasCustomConfig: boolean;
  difyAppId?: string;
  isActive?: boolean;
} | null> {
  try {
    const response = await fetch('/api/user/custom-ai-config');
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('❌ 获取用户AI配置信息失败:', error);
    return null;
  }
}

