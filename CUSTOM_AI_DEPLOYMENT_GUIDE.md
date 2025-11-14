# 定制化AI聊天平台 - 部署指南

## 📋 部署前检查清单

- [ ] Supabase项目已创建
- [ ] Vercel项目已创建
- [ ] Dify实例已部署（腾讯云）
- [ ] 环境变量已准备
- [ ] 备份已完成

## 🚀 快速部署步骤

### 步骤1: 数据库迁移

#### 方式A: 使用Supabase Dashboard（推荐）

1. 打开 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 创建新查询
5. 复制以下SQL并执行:

```sql
-- 定制化AI配置表迁移
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_customer_id ON custom_ai_configs(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_dify_app_id ON custom_ai_configs(dify_app_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_is_active ON custom_ai_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_created_at ON custom_ai_configs(created_at DESC);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_custom_ai_configs_updated_at ON custom_ai_configs;
CREATE TRIGGER update_custom_ai_configs_updated_at BEFORE UPDATE ON custom_ai_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE custom_ai_configs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
DROP POLICY IF EXISTS "Users can view own custom AI config" ON custom_ai_configs;
CREATE POLICY "Users can view own custom AI config" ON custom_ai_configs
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage custom AI configs" ON custom_ai_configs;
CREATE POLICY "Admins can manage custom AI configs" ON custom_ai_configs
  FOR ALL USING (true);
```

#### 方式B: 使用迁移文件

```bash
# 复制迁移文件到supabase/migrations目录
cp supabase/migrations/008_custom_ai_configs.sql supabase/migrations/

# 使用Supabase CLI执行迁移
supabase migration up
```

### 步骤2: 环境变量配置

#### 本地开发环境 (.env.local)

```bash
# 现有变量（保持不变）
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
DIFY_API_URL=<shared-dify-url>
DIFY_API_KEY=<shared-dify-key>
JWT_SECRET=<your-jwt-secret>

# 新增变量
ADMIN_SECRET=<your-admin-secret-key>
```

#### Vercel环境变量

1. 打开 https://vercel.com/dashboard
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加以下变量:

```
ADMIN_SECRET=<your-admin-secret-key>
```

### 步骤3: 代码部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm install

# 3. 本地测试
npm run dev

# 4. 构建
npm run build

# 5. 部署到Vercel
npm run deploy

# 或预览部署
npm run deploy:preview
```

### 步骤4: 验证部署

#### 本地验证

```bash
# 运行安全性测试
node scripts/test-custom-ai-security.js

# 运行集成测试
node scripts/test-custom-ai-integration.js
```

#### 生产环境验证

1. 打开应用首页
2. 登录用户账户
3. 检查浏览器控制台是否有错误
4. 测试聊天功能

## 📝 为客户配置定制化AI

### 方式A: 使用管理后台界面

1. 访问管理后台
2. 进入"定制化AI配置管理"
3. 输入管理员令牌
4. 点击"新增配置"
5. 填写以下信息:
   - 客户ID: 用户的UUID
   - Dify应用ID: 在Dify中创建的应用ID
   - Dify API密钥: 从Dify获取
   - Dify API URL: Dify API端点
   - 知识库ID: (可选)
   - 系统提示词: (可选)
6. 点击"创建配置"

### 方式B: 使用API

```bash
# 创建配置
curl -X POST http://localhost:3000/api/admin/custom-ai-configs \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <admin-secret>" \
  -d '{
    "customer_id": "<user-uuid>",
    "dify_app_id": "<dify-app-id>",
    "dify_api_key": "<dify-api-key>",
    "dify_api_url": "https://api.dify.ai/v1",
    "knowledge_base_id": "<kb-id>",
    "system_prompt": "<prompt>"
  }'

# 获取所有配置
curl -X GET http://localhost:3000/api/admin/custom-ai-configs \
  -H "x-admin-token: <admin-secret>"

# 更新配置
curl -X PUT http://localhost:3000/api/admin/custom-ai-configs \
  -H "Content-Type: application/json" \
  -H "x-admin-token: <admin-secret>" \
  -d '{
    "id": "<config-id>",
    "dify_api_key": "<new-key>",
    "system_prompt": "<new-prompt>"
  }'

# 删除配置
curl -X DELETE "http://localhost:3000/api/admin/custom-ai-configs?id=<config-id>" \
  -H "x-admin-token: <admin-secret>"
```

### 方式C: 使用SQL直接插入

```sql
INSERT INTO custom_ai_configs (
  customer_id,
  dify_app_id,
  dify_api_key,
  dify_api_url,
  knowledge_base_id,
  system_prompt,
  is_active
) VALUES (
  '<user-uuid>',
  '<dify-app-id>',
  '<dify-api-key>',
  'https://api.dify.ai/v1',
  '<kb-id>',
  '<system-prompt>',
  true
);
```

## 🧪 测试定制化AI

### 测试场景1: 共享AI用户

1. 登录没有定制化配置的用户
2. 发送聊天消息
3. 验证消息被路由到共享Dify
4. 验证响应正常

### 测试场景2: 定制化AI用户

1. 为用户创建定制化配置
2. 登录该用户
3. 发送聊天消息
4. 验证消息被路由到定制Dify
5. 验证响应基于定制知识库

### 测试场景3: 安全性验证

1. 打开浏览器开发者工具
2. 进入Network标签
3. 发送聊天消息
4. 检查请求/响应中是否包含API密钥
5. 验证密钥不会暴露

## 🔍 监控与日志

### 查看Vercel日志

```bash
# 使用Vercel CLI查看日志
vercel logs --follow
```

### 查看Supabase日志

1. 打开Supabase Dashboard
2. 进入Logs → Edge Functions
3. 查看API调用日志

### 关键日志消息

```
✅ 用户已认证: <phone>
✅ 获取定制化配置成功
✅ 开始流式传输Dify响应
❌ 用户没有定制化AI配置
❌ 获取定制化配置失败
```

## 🚨 故障排查

### 问题1: 数据库迁移失败

**症状**: SQL执行错误

**解决方案**:
1. 检查表是否已存在
2. 检查外键约束
3. 使用 `IF NOT EXISTS` 语句

### 问题2: API返回401错误

**症状**: 用户无法访问定制化AI

**解决方案**:
1. 检查JWT令牌是否有效
2. 检查Cookie中的sid是否存在
3. 重新登录用户

### 问题3: 定制化配置未生效

**症状**: 用户仍然使用共享AI

**解决方案**:
1. 验证配置是否已创建
2. 检查 `is_active` 是否为true
3. 清除浏览器缓存
4. 重新登录用户

### 问题4: Dify API密钥错误

**症状**: 聊天返回401或403错误

**解决方案**:
1. 验证API密钥是否正确
2. 检查API密钥是否已过期
3. 验证Dify应用是否存在
4. 检查API URL是否正确

## 📊 性能优化建议

1. **缓存配置**: 用户登录时缓存配置
2. **连接池**: 使用连接池提高数据库性能
3. **CDN**: 使用CDN加速API响应
4. **监控**: 设置性能监控告警

## ✅ 部署完成检查

- [ ] 数据库迁移成功
- [ ] 环境变量已配置
- [ ] 代码已部署
- [ ] 安全性测试通过
- [ ] 集成测试通过
- [ ] 至少一个客户配置已创建
- [ ] 定制化AI功能已验证
- [ ] 共享AI功能仍正常
- [ ] 日志监控已设置
- [ ] 文档已更新

## 📞 支持

如有问题，请检查:
1. 技术设计文档: `CUSTOM_AI_TECHNICAL_DESIGN.md`
2. 测试脚本: `scripts/test-custom-ai-*.js`
3. API文档: 各API路由文件中的注释

