import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { requireAdminAuth } from '../../../../lib/adminAuth';

/**
 * 管理员API：管理定制化AI配置
 *
 * GET: 获取所有定制化配置列表
 * POST: 创建新的定制化配置
 * PUT: 更新定制化配置
 * DELETE: 删除定制化配置
 */

/**
 * GET: 获取所有定制化AI配置
 */
export async function GET(req: NextRequest) {
  try {
    // 验证管理员身份
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    // 获取分页参数
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 获取配置列表
    const { data, error, count } = await supabaseAdmin
      .from('custom_ai_configs')
      .select('id, customer_id, dify_app_id, dify_api_url, knowledge_base_id, system_prompt, is_active, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ 获取配置列表失败:', error);
      return new Response(JSON.stringify({ error: '获取配置列表失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取客户信息
    const configsWithCustomers = await Promise.all(
      (data || []).map(async (config) => {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('phone, nickname')
          .eq('id', config.customer_id)
          .single();
        
        return {
          ...config,
          customer: user
        };
      })
    );

    return new Response(JSON.stringify({
      data: configsWithCustomers,
      total: count,
      limit,
      offset
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ 获取配置列表异常:', error);
    return new Response(JSON.stringify({
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * POST: 创建新的定制化AI配置
 */
export async function POST(req: NextRequest) {
  try {
    // 验证管理员身份
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await req.json();
    const {
      customer_phone, // 前端传入手机号
      dify_app_id,
      dify_api_key,
      dify_api_url,
      knowledge_base_id,
      system_prompt
    } = body;

    // 验证必填字段
    if (!customer_phone || !dify_app_id || !dify_api_key || !dify_api_url) {
      return new Response(JSON.stringify({
        error: '缺少必填字段'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 根据手机号查找用户UUID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', customer_phone)
      .single();

    if (userError || !user) {
      console.error('❌ 查找用户失败:', userError);
      return new Response(JSON.stringify({
        error: '未找到该手机号对应的用户',
        details: `手机号: ${customer_phone}`
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const customer_id = user.id;

    // 检查是否已存在配置
    const { data: existingConfig } = await supabaseAdmin
      .from('custom_ai_configs')
      .select('id')
      .eq('customer_id', customer_id)
      .single();

    if (existingConfig) {
      return new Response(JSON.stringify({
        error: '该用户已存在定制化配置',
        details: '每个用户只能有一个定制化配置'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建配置
    const { data, error } = await supabaseAdmin
      .from('custom_ai_configs')
      .insert({
        customer_id,
        dify_app_id,
        dify_api_key,
        dify_api_url,
        knowledge_base_id: knowledge_base_id || null,
        system_prompt: system_prompt || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 创建配置失败:', error);
      return new Response(JSON.stringify({
        error: '创建配置失败',
        details: error.message,
        code: error.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      message: '配置创建成功',
      data
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ 创建配置异常:', error);
    return new Response(JSON.stringify({
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * PUT: 更新定制化AI配置
 */
export async function PUT(req: NextRequest) {
  try {
    // 验证管理员身份
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await req.json();
    const { id, customer_phone, ...updateData } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: '缺少配置ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 如果提供了手机号，需要转换为UUID
    if (customer_phone) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', customer_phone)
        .single();

      if (userError || !user) {
        console.error('❌ 查找用户失败:', userError);
        return new Response(JSON.stringify({
          error: '未找到该手机号对应的用户',
          details: `手机号: ${customer_phone}`
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      updateData.customer_id = user.id;
    }

    // 更新配置
    const { data, error } = await supabaseAdmin
      .from('custom_ai_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ 更新配置失败:', error);
      return new Response(JSON.stringify({
        error: '更新配置失败',
        details: error.message,
        code: error.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      message: '配置更新成功',
      data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ 更新配置异常:', error);
    return new Response(JSON.stringify({
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * DELETE: 删除定制化AI配置
 */
export async function DELETE(req: NextRequest) {
  try {
    // 验证管理员身份
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    // 从请求体获取ID
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return new Response(JSON.stringify({ error: '缺少配置ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 删除配置
    const { error } = await supabaseAdmin
      .from('custom_ai_configs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ 删除配置失败:', error);
      return new Response(JSON.stringify({
        error: '删除配置失败',
        details: error.message,
        code: error.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      message: '配置删除成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ 删除配置异常:', error);
    return new Response(JSON.stringify({
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

