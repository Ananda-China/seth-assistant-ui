/**
 * 定制化AI配置管理模块
 * 用于管理定制化客户与Dify应用的映射关系
 */

import { supabaseAdmin } from './supabase';

export type CustomAIConfig = {
  id: string;
  customer_id: string;
  dify_app_id: string;
  dify_api_key: string;
  dify_api_url: string;
  knowledge_base_id: string | null;
  system_prompt: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * 获取用户的定制化AI配置
 */
export async function getCustomAIConfig(userId: string): Promise<CustomAIConfig | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_ai_configs')
      .select('*')
      .eq('customer_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ 获取定制化配置失败:', error);
      return null;
    }

    return data as CustomAIConfig;
  } catch (error) {
    console.error('❌ 数据库查询异常:', error);
    return null;
  }
}

/**
 * 创建或更新定制化AI配置
 */
export async function upsertCustomAIConfig(
  customerId: string,
  config: Omit<CustomAIConfig, 'id' | 'customer_id' | 'created_at' | 'updated_at'>
): Promise<CustomAIConfig | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_ai_configs')
      .upsert({
        customer_id: customerId,
        ...config,
      }, {
        onConflict: 'customer_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 保存定制化配置失败:', error);
      return null;
    }

    return data as CustomAIConfig;
  } catch (error) {
    console.error('❌ 数据库操作异常:', error);
    return null;
  }
}

/**
 * 删除定制化AI配置
 */
export async function deleteCustomAIConfig(customerId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('custom_ai_configs')
      .delete()
      .eq('customer_id', customerId);

    if (error) {
      console.error('❌ 删除定制化配置失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 数据库操作异常:', error);
    return false;
  }
}

/**
 * 禁用定制化AI配置
 */
export async function disableCustomAIConfig(customerId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('custom_ai_configs')
      .update({ is_active: false })
      .eq('customer_id', customerId);

    if (error) {
      console.error('❌ 禁用定制化配置失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 数据库操作异常:', error);
    return false;
  }
}

/**
 * 启用定制化AI配置
 */
export async function enableCustomAIConfig(customerId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('custom_ai_configs')
      .update({ is_active: true })
      .eq('customer_id', customerId);

    if (error) {
      console.error('❌ 启用定制化配置失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 数据库操作异常:', error);
    return false;
  }
}

/**
 * 获取所有定制化AI配置（用于管理后台）
 */
export async function getAllCustomAIConfigs(limit = 100, offset = 0): Promise<CustomAIConfig[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_ai_configs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ 获取所有定制化配置失败:', error);
      return [];
    }

    return (data || []) as CustomAIConfig[];
  } catch (error) {
    console.error('❌ 数据库查询异常:', error);
    return [];
  }
}

/**
 * 检查用户是否有定制化AI配置
 */
export async function hasCustomAIConfig(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_ai_configs')
      .select('id')
      .eq('customer_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

