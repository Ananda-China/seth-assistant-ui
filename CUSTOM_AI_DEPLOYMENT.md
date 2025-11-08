# 定制化AI功能部署指南

## 📋 部署概述

本次部署添加了**定制化AI管理功能**，允许管理员为特定用户配置专属的Dify应用。

### 🔧 本次更新 (2025-11-08)

**✅ 修复了管理员认证问题！**

之前的问题：点击"创建"按钮时提示"**未找到管理员配置**"

**根本原因**：
- 其他管理员API使用cookie认证（标准方式）
- 定制化AI管理API使用请求头认证（不一致）
- 导致即使管理员已登录，仍然无法创建配置

**解决方案**：
- ✅ 统一使用cookie认证方式
- ✅ 使用标准的`requireAdminAuth()`函数
- ✅ 移除不必要的token手动传递
- ✅ 与其他管理员API保持一致

---

## 🚀 部署步骤

### 步骤1: 执行Supabase数据库迁移

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New Query**
5. 复制并执行以下SQL（来自 `supabase/migrations/008_custom_ai_configs.sql`）：

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
DROP POLICY IF EXISTS custom_ai_configs_select_own ON custom_ai_configs;
CREATE POLICY custom_ai_configs_select_own ON custom_ai_configs
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS custom_ai_configs_select_all ON custom_ai_configs;
CREATE POLICY custom_ai_configs_select_all ON custom_ai_configs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS custom_ai_configs_insert ON custom_ai_configs;
CREATE POLICY custom_ai_configs_insert ON custom_ai_configs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS custom_ai_configs_update ON custom_ai_configs;
CREATE POLICY custom_ai_configs_update ON custom_ai_configs
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS custom_ai_configs_delete ON custom_ai_configs;
CREATE POLICY custom_ai_configs_delete ON custom_ai_configs
  FOR DELETE USING (true);
```

6. 点击 **Run** 执行SQL
7. 确认执行成功

### 步骤2: 验证Vercel自动部署

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目（seth-assistant-ui）
3. 查看 **Deployments** 页面
4. 确认最新的部署状态为 **Ready**
5. Commit ID: `48ecb18`

### 步骤3: 测试部署

#### 3.1 测试现有用户（共享AI）

1. 访问你的网站
2. 使用现有用户账号登录
3. 进入聊天页面
4. 发送测试消息
5. **预期结果**: 正常使用共享AI，体验无变化 ✅

#### 3.2 测试管理员登录

1. 访问 `https://your-domain.com/admin/login`
2. 使用管理员账号登录
3. **预期结果**: 成功登录，进入管理后台 ✅

#### 3.3 测试定制化AI管理（重点测试）

1. 在管理后台，点击左侧菜单 **定制化AI管理**
2. 点击 **添加配置** 按钮
3. 填写表单：
   - **客户ID**: 选择一个测试用户的UUID
   - **Dify应用ID**: 输入Dify应用ID（例如：`app-xxxxxxxxxxxxx`）
   - **Dify API密钥**: 输入Dify API密钥
   - **Dify API URL**: 输入Dify API URL（例如：`https://api.dify.ai/v1`）
4. 点击 **创建**
5. **预期结果**: 
   - ✅ 显示 "配置创建成功"
   - ✅ 配置出现在列表中
   - ✅ **不再显示 "未找到管理员配置" 错误**

---

## 🔍 如何获取Dify应用ID

### 方法1: 从URL获取（最简单）

1. 登录Dify后台
2. 打开你的应用（例如："卢林商业版赛斯"）
3. 查看浏览器地址栏URL
4. 格式：`https://cloud.dify.ai/app/{应用ID}/...`
5. 复制 `{应用ID}` 部分

### 方法2: 从API访问页面获取

1. 登录Dify后台
2. 打开你的应用
3. 点击左侧菜单 **API访问**
4. 在API文档中查找应用ID
5. 格式：`app-xxxxxxxxxxxxx`

---

## ⚠️ 重要提醒

### 安全性保证

- ✅ 现有用户完全不受影响
- ✅ 共享AI的URL和API配置不变
- ✅ 定制AI配置存储在数据库中
- ✅ 管理员认证使用JWT + HTTP-only Cookie

### 兼容性保证

- ✅ 完全向后兼容
- ✅ 零影响现有用户体验
- ✅ 自动路由机制
- ✅ 完全隔离的配置

### 环境变量

**无需修改任何环境变量！**

- 共享AI继续使用 `DIFY_API_URL` 和 `DIFY_API_KEY`
- 定制AI使用数据库配置
- 互不干扰

---

## 🎯 功能说明

### 自动路由机制

```
用户登录 → 检查是否有定制配置
  ├─ 有配置 → 使用 /api/chat-custom（定制AI）
  └─ 无配置 → 使用 /api/chat（共享AI）
```

### API端点

- **共享AI**: `/api/chat` (不变)
- **定制AI**: `/api/chat-custom` (新增)
- **管理API**: `/api/admin/custom-ai-configs` (新增)

---

## 🐛 故障排查

### 问题1: "未找到管理员配置"

**状态**: ✅ 已修复

**如果仍然出现**:
1. 清除浏览器缓存
2. 访问 `/admin/login` 重新登录
3. 确认登录成功后返回定制化AI管理页面

### 问题2: Vercel部署失败

**解决方案**:
1. 检查Vercel部署日志
2. 确认GitHub代码已成功推送
3. 查看是否有编译错误

### 问题3: 数据库迁移失败

**解决方案**:
1. 检查Supabase SQL Editor的错误信息
2. 确认users表存在
3. 尝试逐步执行SQL

---

## ✅ 部署检查清单

- [ ] Supabase数据库迁移已执行
- [ ] Vercel部署状态为Ready
- [ ] 现有用户聊天功能正常
- [ ] 管理员可以成功登录
- [ ] **可以创建定制化AI配置（不再显示"未找到管理员配置"错误）**
- [ ] 定制用户可以使用专属AI

---

## 📝 技术细节

### 修改的文件

1. **app/api/admin/custom-ai-configs/route.ts**
   - 改用 `requireAdminAuth(req)` 从cookie读取token
   - 移除自定义的 `verifyAdmin()` 函数

2. **app/admin/components/CustomAIManagement.tsx**
   - 移除手动获取和传递token的代码
   - 添加 `credentials: 'include'` 确保发送cookie
   - 简化认证逻辑

3. **app/admin/debug-auth/page.tsx**
   - 新增调试页面（可选使用）

### Git提交信息

```
Commit: 48ecb18
Message: 修复定制化AI管理的管理员认证问题 - 统一使用cookie认证方式
Author: Ananda <anandali1016@gmail.com>
Date: 2025-11-08
```

---

**部署完成后，请在检查清单中勾选所有项目！**

