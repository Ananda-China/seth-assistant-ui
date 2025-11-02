import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { requireUser } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';

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

    if (!query) {
      return new Response(JSON.stringify({ error: '查询不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📝 聊天请求:', {
      phone: auth.phone,
      queryLength: query.length,
      hasConversationId: !!conversationId
    });

    // 3. 获取用户的定制化配置
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

    // 4. 构建Dify API请求
    const apiUrl = `${customConfig.dify_api_url.replace(/\/$/, '')}/chat-messages`;

    const difyPayload = {
      inputs: {},
      query,
      response_mode: 'streaming',
      user: auth.phone, // 使用用户phone作为标识
      conversation_id: conversationId || undefined,
      auto_generate_name: false,
    };

    console.log('🔍 Dify API请求:', {
      apiUrl,
      queryPreview: query.substring(0, 50) + '...',
      hasConversationId: !!conversationId
    });

    // 5. 转发请求到Dify
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

    if (!difyRes.ok || !difyRes.body) {
      const text = await difyRes.text().catch(() => '');
      console.error('❌ Dify请求失败:', {
        status: difyRes.status,
        statusText: difyRes.statusText,
        responsePreview: text.substring(0, 200)
      });
      return new Response(text || 'Dify请求失败', { status: difyRes.status });
    }

    // 6. 返回流式响应
    console.log('✅ 开始流式传输Dify响应');
    return new Response(difyRes.body, {
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

