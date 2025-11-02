import { NextRequest } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

/**
 * 获取用户的定制化AI配置信息
 * 注意：此端点不返回敏感信息（如API密钥）
 * 只返回配置是否存在和基本信息
 */
export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const auth = requireUser(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: '未认证' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 从phone获取user_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', auth.phone)
      .single();

    if (userError || !userData) {
      return new Response(JSON.stringify({
        hasCustomConfig: false,
        error: '用户不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = userData.id;

    // 检查用户是否有定制化配置
    const { data: configData, error: configError } = await supabaseAdmin
      .from('custom_ai_configs')
      .select('id, dify_app_id, is_active')
      .eq('customer_id', userId)
      .eq('is_active', true)
      .single();

    if (configError || !configData) {
      // 用户没有定制化配置，使用共享AI
      return new Response(JSON.stringify({
        hasCustomConfig: false,
        message: '用户使用共享AI服务'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 用户有定制化配置
    return new Response(JSON.stringify({
      hasCustomConfig: true,
      difyAppId: configData.dify_app_id,
      isActive: configData.is_active
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ 获取用户定制化配置异常:', error);
    return new Response(JSON.stringify({
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

