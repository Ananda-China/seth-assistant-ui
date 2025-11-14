import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { requireUser } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { getStoreModule, getUsers } from '../../../lib/config';

// 性能优化配置
const MAX_RETRIES = 2;
const CONNECT_TIMEOUT = 10000; // 10秒连接超时
const TOTAL_TIMEOUT = 300000; // 300秒（5分钟）总超时
const RETRY_DELAY = 1000; // 重试延迟

// 带重试的fetch函数
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TOTAL_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ 请求失败 (尝试 ${i + 1}/${retries + 1}):`, lastError.message);

      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
      }
    }
  }

  throw lastError || new Error('请求失败');
}

/**
 * 获取用户的定制化AI配置
 * 这个函数从数据库中获取用户的Dify API密钥和URL
 * 密钥绝不会暴露给前端
 */
async function getCustomAIConfig(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_ai_configs')
      .select('dify_api_key, dify_api_url, dify_app_id, knowledge_base_id, system_prompt')
      .eq('customer_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ 获取定制化配置失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ 数据库查询异常:', error);
    return null;
  }
}

/**
 * 定制化AI聊天代理端点
 * 
 * 请求体:
 * {
 *   query: string,           // 用户问题
 *   conversation_id?: string // Dify对话ID（可选）
 * }
 * 
 * 响应: 流式响应，直接转发Dify的响应
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户身份
    const auth = requireUser(req);
    if (!auth) {
      console.error('❌ 用户未认证');
      return new Response(JSON.stringify({ error: '未认证' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ 用户已认证:', auth.phone);

    // 2. 解析请求体
    const body = await req.json().catch(() => ({}));
    const query: string = String(body?.query || '').trim();
    const conversationId: string | undefined = body?.conversation_id;
    const clientConversationId: string | undefined = body?.client_conversation_id || conversationId;

    if (!query) {
      return new Response(JSON.stringify({ error: '查询不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📝 聊天请求:', {
      phone: auth.phone,
      queryLength: query.length,
      hasConversationId: !!conversationId,
      hasClientConversationId: !!clientConversationId
    });

    // 3. 检查用户权限并增加聊天次数
    const usersModule = await getUsers();
    const permission = await usersModule.getUserPermission(auth.phone);

    console.log('🔐 权限检查结果:', {
      phone: auth.phone,
      canChat: permission.canChat,
      isTrialActive: permission.isTrialActive,
      isPaidUser: permission.isPaidUser,
      chatLimit: permission.chatLimit,
      usedChats: permission.usedChats,
      remainingChats: permission.chatLimit - permission.usedChats
    });

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

    console.log('✅ 聊天次数已增加:', {
      phone: auth.phone,
      newCount: permission.usedChats + 1
    });

    // 4. 获取用户的定制化配置
    // 首先需要从phone获取user_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', auth.phone)
      .single();

    if (userError || !userData) {
      console.error('❌ 用户不存在:', userError);
      return new Response(JSON.stringify({ error: '用户不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = userData.id;
    const customConfig = await getCustomAIConfig(userId);

    if (!customConfig) {
      console.error('❌ 用户没有定制化AI配置');
      return new Response(JSON.stringify({ error: '用户没有定制化AI配置' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ 获取定制化配置成功:', {
      difyAppId: customConfig.dify_app_id,
      hasApiKey: !!customConfig.dify_api_key,
      apiUrl: customConfig.dify_api_url
    });

    // 5. 获取Dify对话ID（如果存在）
    let difyConversationId: string | undefined = undefined;
    if (clientConversationId) {
      try {
        const storeModule = await getStoreModule();
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

    // 6. 构建Dify API请求
    const apiUrl = `${customConfig.dify_api_url.replace(/\/$/, '')}/chat-messages`;

    const difyPayload = {
      inputs: {},
      query,
      response_mode: 'streaming',
      user: auth.phone, // 使用用户phone作为标识
      conversation_id: difyConversationId || undefined, // 使用Dify对话ID，如果为空则让Dify创建新对话
      auto_generate_name: false,
    };

    console.log('🔍 Dify API请求:', {
      apiUrl,
      queryPreview: query.substring(0, 50) + '...',
      clientConversationId,
      difyConversationId,
      hasDifyConversationId: !!difyConversationId
    });

    // 7. 保存用户消息到数据库
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

    // 8. 转发请求到Dify
    console.log('🚀 准备发送Dify请求:', {
      apiUrl,
      hasApiKey: !!customConfig.dify_api_key,
      apiKeyPrefix: customConfig.dify_api_key?.substring(0, 10) + '...',
      payloadPreview: JSON.stringify(difyPayload).substring(0, 200)
    });

    const difyRes = await fetchWithRetry(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${customConfig.dify_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(difyPayload),
        signal: AbortSignal.timeout(TOTAL_TIMEOUT),
      },
      MAX_RETRIES
    );

    console.log('📥 Dify响应状态:', {
      ok: difyRes.ok,
      status: difyRes.status,
      statusText: difyRes.statusText,
      hasBody: !!difyRes.body,
      headers: Object.fromEntries(difyRes.headers.entries())
    });

    if (!difyRes.ok || !difyRes.body) {
      const text = await difyRes.text().catch(() => '');
      console.error('❌ Dify请求失败:', {
        status: difyRes.status,
        statusText: difyRes.statusText,
        responsePreview: text.substring(0, 200),
        fullResponse: text
      });
      return new Response(text || 'Dify请求失败', { status: difyRes.status });
    }

    // 9. 处理流式响应
    console.log('✅ 开始流式传输Dify响应');

    const reader = difyRes.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let firstEventSent = false;
    let assistantFull = ''; // 收集完整的助手回复
    let totalTokens = 0;
    let userTokens = 0;
    let assistantTokens = 0;
    let chunkCount = 0;
    let eventCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('✅ 流式响应传输完成:', {
                totalChunks: chunkCount,
                totalEvents: eventCount,
                assistantLength: assistantFull.length,
                assistantPreview: assistantFull.substring(0, 100)
              });
              break;
            }

            chunkCount++;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\n/);
            buffer = lines.pop() || '';

            if (chunkCount <= 3) {
              console.log(`📦 Chunk ${chunkCount}:`, {
                linesCount: lines.length,
                bufferLength: buffer.length,
                firstLine: lines[0]?.substring(0, 100)
              });
            }

            for (const line of lines) {
              const dataPrefix = 'data: ';
              if (!line.startsWith(dataPrefix)) {
                // 跳过非data行，不转发
                continue;
              }

              const jsonStr = line.slice(dataPrefix.length).trim();
              if (!jsonStr || jsonStr === '[DONE]') {
                continue;
              }

              try {
                eventCount++;
                const evt = JSON.parse(jsonStr);

                if (eventCount <= 3) {
                  console.log(`📨 Event ${eventCount}:`, {
                    event: evt.event,
                    hasConversationId: !!evt.conversation_id,
                    hasAnswer: !!evt.answer,
                    hasMetadata: !!evt.metadata,
                    eventKeys: Object.keys(evt)
                  });
                }

                // 提取并发送conversation_id
                if (!firstEventSent && evt?.conversation_id) {
                  firstEventSent = true;
                  console.log('✅ 提取到Dify对话ID:', evt.conversation_id);

                  // 发送CID标记给前端
                  controller.enqueue(encoder.encode(`CID:${evt.conversation_id}\n`));

                  // 保存Dify对话ID到数据库
                  if (clientConversationId && !difyConversationId) {
                    try {
                      await storeModule.setDifyConversationId(
                        auth.phone,
                        clientConversationId,
                        evt.conversation_id
                      );
                      console.log('✅ Dify对话ID已保存到数据库');
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

                // 转发AI回复内容
                const content = evt?.answer || evt?.data || '';
                if (content) {
                  assistantFull += content; // 收集完整内容
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                // JSON解析失败，记录错误但继续处理
                console.error('❌ JSON解析失败:', e, 'line:', line);
              }
            }
          }

          // 保存助手消息到数据库
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

              const savedMessage = await storeModule.addMessage(
                auth.phone,
                clientConversationId,
                'assistant',
                assistantFull,
                assistantTokens
              );
              console.log('✅ 助手消息已保存到数据库:', {
                messageId: savedMessage.id,
                contentLength: savedMessage.content?.length || 0
              });

              // 更新用户消息的token使用量
              if (userMessageId && userTokens > 0) {
                await storeModule.updateMessageTokens(userMessageId, userTokens);
                console.log(`✅ 已更新用户消息token使用量: ${userTokens}`);
              }
            } else {
              if (!clientConversationId) {
                console.warn('⚠️ 未提供clientConversationId，无法保存消息');
              }
              if (!assistantFull) {
                console.warn('⚠️ 助手回复为空，无法保存消息');
              }
            }
          } catch (error) {
            console.error('❌ 保存消息或更新token失败:', {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              conversationId: clientConversationId,
              contentLength: assistantFull?.length || 0,
              assistantTokens
            });
            // 即使保存失败也要关闭流，避免客户端挂起
          }
        } catch (error) {
          console.error('❌ 流式传输错误:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('❌ 聊天代理异常:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(JSON.stringify({
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

