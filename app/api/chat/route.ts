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

  // 检查用户权限
  const usersModule = await getUsers();
  const permission = await usersModule.getUserPermission(auth.phone);

  if (!permission.canChat) {
    let message = '';
    if (!permission.isTrialActive && !permission.isPaidUser) {
      message = `您的7天免费试用已结束，请升级到付费版本继续使用。`;
    } else if (permission.usedChats >= permission.chatLimit) {
      message = `今日聊天次数已用完（${permission.usedChats}/${permission.chatLimit}），${permission.resetTime || '明日'}可继续使用。`;
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

  // 先把用户消息落库
  const storeModule = await getStoreModule();
  if (clientConversationId) {
    try {
      await storeModule.addMessage(auth.phone, clientConversationId, 'user', query);
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

  if (!query) {
    return new Response('empty query', { status: 400 });
  }

  const apiUrl = `${DIFY_API_URL.replace(/\/$/, '')}/chat-messages`; // e.g. https://api.dify.ai/v1

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
      conversation_id: conversationId,
    }),
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
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let firstEventSent = false;
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
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
                await storeModule.setDifyConversationId(auth.phone, clientConversationId, evt.conversation_id);
              }
            }
            const content = evt?.answer || evt?.data || '';
            if (content) {
              // 清理内容，过滤掉可能的对象字符串
              let cleanContent = String(content);
              // 过滤掉 [object Object] 等无效内容
              cleanContent = cleanContent.replace(/\[object Object\]/gi, '');
              cleanContent = cleanContent.replace(/\[Object object\]/gi, '');
              cleanContent = cleanContent.replace(/null/gi, '');
              cleanContent = cleanContent.replace(/undefined/gi, '');
              cleanContent = cleanContent.trim();
              
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
      // 助手消息落库
      try {
        if (clientConversationId && assistantFull) {
          await storeModule.addMessage(auth.phone, clientConversationId, 'assistant', assistantFull);
        }
      } catch {}
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


