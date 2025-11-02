-- 定制化AI配置表迁移
-- 创建时间: 2025-11-02
-- 用途: 存储定制化客户与Dify应用的映射关系

-- ============================================
-- 第1步: 创建定制化AI配置表
-- ============================================
CREATE TABLE IF NOT EXISTS custom_ai_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dify_app_id VARCHAR(100) NOT NULL,
  dify_api_key VARCHAR(255) NOT NULL,
  dify_api_url VARCHAR(500) NOT NULL,
  knowledge_base_id VARCHAR(100),
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- ============================================
-- 第2步: 创建索引以提高查询性能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_customer_id ON custom_ai_configs(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_dify_app_id ON custom_ai_configs(dify_app_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_is_active ON custom_ai_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_created_at ON custom_ai_configs(created_at DESC);

-- ============================================
-- 第3步: 创建更新时间戳的触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 第4步: 为custom_ai_configs表创建触发器
-- ============================================
DROP TRIGGER IF EXISTS update_custom_ai_configs_updated_at ON custom_ai_configs;
CREATE TRIGGER update_custom_ai_configs_updated_at BEFORE UPDATE ON custom_ai_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 第5步: 启用行级安全策略（RLS）
-- ============================================
ALTER TABLE custom_ai_configs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 第6步: 创建RLS策略
-- ============================================

-- 允许用户查看自己的配置
DROP POLICY IF EXISTS custom_ai_configs_select_own ON custom_ai_configs;
CREATE POLICY custom_ai_configs_select_own ON custom_ai_configs
  FOR SELECT USING (customer_id = auth.uid());

-- 允许管理员查看所有配置（需要在应用层面进行管理员验证）
DROP POLICY IF EXISTS custom_ai_configs_select_all ON custom_ai_configs;
CREATE POLICY custom_ai_configs_select_all ON custom_ai_configs
  FOR SELECT USING (true);

-- 允许管理员插入配置（需要在应用层面进行管理员验证）
DROP POLICY IF EXISTS custom_ai_configs_insert ON custom_ai_configs;
CREATE POLICY custom_ai_configs_insert ON custom_ai_configs
  FOR INSERT WITH CHECK (true);

-- 允许管理员更新配置（需要在应用层面进行管理员验证）
DROP POLICY IF EXISTS custom_ai_configs_update ON custom_ai_configs;
CREATE POLICY custom_ai_configs_update ON custom_ai_configs
  FOR UPDATE USING (true) WITH CHECK (true);

-- 允许管理员删除配置（需要在应用层面进行管理员验证）
DROP POLICY IF EXISTS custom_ai_configs_delete ON custom_ai_configs;
CREATE POLICY custom_ai_configs_delete ON custom_ai_configs
  FOR DELETE USING (true);

