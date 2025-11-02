-- 定制化AI配置表迁移
-- 创建时间: 2024-11-02
-- 用途: 存储定制化客户与Dify应用的映射关系

-- 1. 创建定制化AI配置表
CREATE TABLE IF NOT EXISTS custom_ai_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dify_app_id VARCHAR(100) NOT NULL, -- Dify中创建的应用ID
  dify_api_key VARCHAR(255) NOT NULL, -- Dify API密钥（加密存储）
  dify_api_url VARCHAR(500) NOT NULL, -- Dify API端点URL
  knowledge_base_id VARCHAR(100), -- Dify知识库ID（可选）
  system_prompt TEXT, -- 系统提示词（可选）
  is_active BOOLEAN DEFAULT true, -- 是否启用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保每个客户只有一个活跃配置
  UNIQUE(customer_id)
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_customer_id ON custom_ai_configs(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_dify_app_id ON custom_ai_configs(dify_app_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_is_active ON custom_ai_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_created_at ON custom_ai_configs(created_at DESC);

-- 3. 创建更新时间戳的触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 为custom_ai_configs表创建触发器
DROP TRIGGER IF EXISTS update_custom_ai_configs_updated_at ON custom_ai_configs;
CREATE TRIGGER update_custom_ai_configs_updated_at BEFORE UPDATE ON custom_ai_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 启用行级安全策略（RLS）
ALTER TABLE custom_ai_configs ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略
-- 允许用户查看自己的配置
DROP POLICY IF EXISTS "Users can view own custom AI config" ON custom_ai_configs;
CREATE POLICY "Users can view own custom AI config" ON custom_ai_configs
  FOR SELECT USING (customer_id = auth.uid());

-- 允许管理员查看所有配置
DROP POLICY IF EXISTS "Admins can view all custom AI configs" ON custom_ai_configs;
CREATE POLICY "Admins can view all custom AI configs" ON custom_ai_configs
  FOR SELECT USING (true); -- 需要在应用层面进行管理员验证

-- 允许管理员插入配置
DROP POLICY IF EXISTS "Admins can insert custom AI configs" ON custom_ai_configs;
CREATE POLICY "Admins can insert custom AI configs" ON custom_ai_configs
  FOR INSERT WITH CHECK (true); -- 需要在应用层面进行管理员验证

-- 允许管理员更新配置
DROP POLICY IF EXISTS "Admins can update custom AI configs" ON custom_ai_configs;
CREATE POLICY "Admins can update custom AI configs" ON custom_ai_configs
  FOR UPDATE USING (true) WITH CHECK (true); -- 需要在应用层面进行管理员验证

-- 允许管理员删除配置
DROP POLICY IF EXISTS "Admins can delete custom AI configs" ON custom_ai_configs;
CREATE POLICY "Admins can delete custom AI configs" ON custom_ai_configs
  FOR DELETE USING (true); -- 需要在应用层面进行管理员验证

