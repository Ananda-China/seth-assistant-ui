import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { requireUser } from '../../../lib/auth';
import { getStoreModule, getBillingModule, getUsers } from '../../../lib/config';

const DIFY_API_URL = process.env.DIFY_API_URL || '';
const DIFY_API_KEY = process.env.DIFY_API_KEY || '';

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (!auth) return new Response('unauthorized', { status: 401 });
  if (!DIFY_API_URL || !DIFY_API_KEY) {
    return new Response('Missing Dify config', { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const query: string = String(body?.query || '').trim();
  const conversationId: string | undefined = body?.conversation_id || undefined;
  const clientConversationId: string | undefined = body?.client_conversation_id || undefined;

  console.log('🔍 接收到的参数:', {
    query: query.substring(0, 50) + '...',
    conversationId,
    clientConversationId,
    hasConversationId: !!conversationId
  });

  // 检查用户权限
  const usersModule = await getUsers();
  const permission = await usersModule.getUserPermission(auth.phone);

  if (!permission.canChat) {
    let message = '';
    if (!permission.isTrialActive && !permission.isPaidUser) {
      message = `您的5次免费使用已用完，请升级到付费版本继续使用。`;
    } else if (permission.usedChats >= permission.chatLimit) {
      message = `免费次数已用完（${permission.usedChats}/${permission.chatLimit}），请升级继续使用。`;
    } else {
      message = '暂时无法使用聊天功能，请联系客服。';
    }

    return new Response(JSON.stringify({
      error: message,
      permission: {
        isTrialActive: permission.isTrialActive,
        isPaidUser: permission.isPaidUser,
        remainingDays: permission.remainingDays,
        chatLimit: permission.chatLimit,
        usedChats: permission.usedChats
      }
    }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 增加聊天次数计数
  const canIncrement = await usersModule.incrementChatCount(auth.phone);
  if (!canIncrement) {
    return new Response(JSON.stringify({
      error: '聊天次数更新失败，请稍后重试。'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 先把用户消息落库（暂时不包含token，稍后更新）
  const storeModule = await getStoreModule();
  let userMessageId: string | null = null;
  if (clientConversationId) {
    try {
      const userMessage = await storeModule.addMessage(auth.phone, clientConversationId, 'user', query);
      userMessageId = userMessage.id;
      // 若标题还是默认值，则用用户问题前 15 字更新标题
      const suggested = query.slice(0, 15);
      await storeModule.ensureConversationTitle(auth.phone, clientConversationId, suggested);
      console.log(`✅ 用户消息已保存到对话 ${clientConversationId}: ${query.substring(0, 50)}...`);
    } catch (error) {
      console.error('❌ 保存用户消息失败:', error);
      // 如果保存失败，返回错误
      return new Response(JSON.stringify({
        error: '消息保存失败，请重试',
        details: error instanceof Error ? error.message : '未知错误'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 获取Dify对话ID（如果存在）
  let difyConversationId: string | undefined = undefined;
  if (clientConversationId) {
    try {
      const conv = await storeModule.getConversation(auth.phone, clientConversationId);
      if (conv && conv.dify_conversation_id) {
        difyConversationId = conv.dify_conversation_id;
        console.log('✅ 找到Dify对话ID:', difyConversationId);
      } else {
        console.log('ℹ️ 未找到Dify对话ID，将创建新对话');
      }
    } catch (error) {
      console.error('❌ 获取Dify对话ID失败:', error);
    }
  }

  if (!query) {
    return new Response('empty query', { status: 400 });
  }

  const apiUrl = `${DIFY_API_URL.replace(/\/$/, '')}/chat-messages`; // e.g. https://api.dify.ai/v1


  console.log('🔍 Dify API 请求参数:', {
    apiUrl,
    query: query.substring(0, 50) + '...',
    conversationId,
    clientConversationId,
    difyConversationId,
    hasDifyConversationId: !!difyConversationId
  });

  const difyRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'streaming',
      user: 'anonymous',
      conversation_id: difyConversationId || undefined, // 使用Dify对话ID，如果为空则让Dify创建新对话
      // 添加更多配置以确保完整回复
      auto_generate_name: false, // 不自动生成对话名称
    }),
    // 增加超时时间，避免长回复被截断
    signal: AbortSignal.timeout(120000), // 120秒超时
  });

  if (!difyRes.ok || !difyRes.body) {
    const text = await difyRes.text().catch(() => '');
    console.error('[DifyError]', difyRes.status, text);
    // 将 Dify 返回的错误原样透传到前端，便于排查（仍统一用 500 返回）
    return new Response(text || 'dify request failed', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const reader = difyRes.body.getReader();
  const encoder = new TextEncoder();
  let assistantFull = '';
  let totalTokens = 0;
  let userTokens = 0;
  let assistantTokens = 0;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let firstEventSent = false;
      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;
      const startTime = Date.now();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          const duration = Date.now() - startTime;
          console.log('✅ Dify流式响应完成:', {
            duration: `${duration}ms`,
            chunks: chunkCount,
            totalLength: assistantFull.length,
            avgSpeed: `${(assistantFull.length / (duration / 1000)).toFixed(2)} chars/s`
          });
          break;
        }

        chunkCount++;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          const dataPrefix = 'data: ';
          if (!line.startsWith(dataPrefix)) continue;
          const jsonStr = line.slice(dataPrefix.length);
          try {
            const evt = JSON.parse(jsonStr);
            if (!firstEventSent && evt?.conversation_id) {
              firstEventSent = true;
              // 独立一行发送，避免与后续回答内容黏连
              controller.enqueue(encoder.encode(`CID:${evt.conversation_id}\n`));
              if (clientConversationId) {
                try {
                  await storeModule.setDifyConversationId(auth.phone, clientConversationId, evt.conversation_id);
                  console.log('✅ Dify对话ID已保存:', evt.conversation_id);
                } catch (error) {
                  console.error('❌ 保存Dify对话ID失败:', error);
                }
              }
            }

            // 解析token使用量
            if (evt?.metadata?.usage) {
              const usage = evt.metadata.usage;
              totalTokens = usage.total_tokens || 0;
              userTokens = usage.prompt_tokens || 0;
              assistantTokens = usage.completion_tokens || 0;
              console.log('📊 Token使用量:', { totalTokens, userTokens, assistantTokens });
            }

            const content = evt?.answer || evt?.data || '';
            if (content) {
              // 清理内容，过滤掉可能的对象字符串，但保留换行符
              let cleanContent = String(content);
              // 过滤掉 [object Object] 等无效内容
              cleanContent = cleanContent.replace(/\[object Object\]/gi, '');
              cleanContent = cleanContent.replace(/\[Object object\]/gi, '');
              // 注意：不要过滤 null 和 undefined 字符串，因为可能是正常内容的一部分
              // 也不要使用 trim()，因为会去掉换行符

              if (cleanContent) {
                assistantFull += cleanContent;
                controller.enqueue(encoder.encode(cleanContent));
              }
            }
          } catch {
            controller.enqueue(encoder.encode(line));
          }
        }
      }
      // 助手消息落库，包含token使用量
      try {
        if (clientConversationId && assistantFull) {
          console.log('📝 保存助手消息:', {
            conversationId: clientConversationId,
            contentLength: assistantFull.length,
            contentPreview: assistantFull.substring(0, 100) + '...',
            contentEnd: '...' + assistantFull.substring(assistantFull.length - 100),
            hasNewlines: assistantFull.includes('\n'),
            newlineCount: (assistantFull.match(/\n/g) || []).length
          });
          await storeModule.addMessage(auth.phone, clientConversationId, 'assistant', assistantFull, assistantTokens);

          // 更新用户消息的token使用量
          if (userMessageId && userTokens > 0) {
            await storeModule.updateMessageTokens(userMessageId, userTokens);
            console.log(`✅ 已更新用户消息token使用量: ${userTokens}`);
          }
        }
      } catch (error) {
        console.error('❌ 保存消息或更新token失败:', error);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}


