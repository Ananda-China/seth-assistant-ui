# 定制化AI聊天平台 - 技术设计文档

## 1. 概述

本文档描述了为现有AI聊天SaaS平台添加定制化客户支持的技术实现方案。该方案允许每个定制化客户拥有独立的Dify应用实例、知识库和系统提示词，同时保持现有共享AI服务的正常运行。

## 2. 架构设计

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vercel)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  聊天组件 (app/page.tsx)                              │   │
│  │  - 检查用户是否有定制化配置                           │   │
│  │  - 选择合适的API端点                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────────┐            ┌──────────────────────┐
│  /api/chat           │            │  /api/chat-custom    │
│  (共享AI)            │            │  (定制化AI)          │
│  - 使用环境变量      │            │  - 从DB获取配置      │
│  - 调用共享Dify      │            │  - 调用定制Dify      │
└──────────────────────┘            └──────────────────────┘
        ↓                                       ↓
        └───────────────────┬───────────────────┘
                            ↓
                ┌─────────────────────────┐
                │   Supabase 数据库       │
                │  ┌───────────────────┐  │
                │  │ custom_ai_configs │  │
                │  │ - customer_id     │  │
                │  │ - dify_app_id     │  │
                │  │ - dify_api_key    │  │
                │  │ - dify_api_url    │  │
                │  └───────────────────┘  │
                └─────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────────┐            ┌──────────────────────┐
│  共享Dify实例        │            │  定制Dify实例        │
│  (腾讯云)            │            │  (腾讯云)            │
│  - 共享知识库        │            │  - 客户专属知识库    │
│  - 共享提示词        │            │  - 客户专属提示词    │
└──────────────────────┘            └──────────────────────┘
```

### 2.2 数据流

#### 共享AI流程
1. 用户发送消息 → 前端调用 `/api/chat`
2. 后端使用环境变量中的Dify配置
3. 转发请求到共享Dify实例
4. 返回流式响应

#### 定制化AI流程
1. 用户发送消息 → 前端调用 `/api/user/custom-ai-config` 检查
2. 如果有定制配置，调用 `/api/chat-custom`
3. 后端从数据库获取用户的Dify配置
4. 转发请求到用户的定制Dify实例
5. 返回流式响应

## 3. 数据库设计

### 3.1 custom_ai_configs 表

```sql
CREATE TABLE custom_ai_configs (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id),
  dify_app_id VARCHAR(100) NOT NULL,
  dify_api_key VARCHAR(255) NOT NULL,
  dify_api_url VARCHAR(500) NOT NULL,
  knowledge_base_id VARCHAR(100),
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(customer_id)
);
```

### 3.2 关键设计决策

- **UNIQUE(customer_id)**: 确保每个客户只有一个活跃配置
- **dify_api_key**: 存储在数据库中，仅在后端使用
- **is_active**: 允许禁用配置而不删除数据
- **RLS策略**: 用户只能查看自己的配置

## 4. API设计

### 4.1 前端API

#### GET /api/user/custom-ai-config
检查用户是否有定制化配置

**请求**: 需要JWT令牌
**响应**:
```json
{
  "hasCustomConfig": true,
  "difyAppId": "app-123",
  "isActive": true
}
```

**安全性**: 不返回API密钥

### 4.2 聊天API

#### POST /api/chat-custom
定制化AI聊天端点

**请求**:
```json
{
  "query": "用户问题",
  "conversation_id": "对话ID（可选）"
}
```

**响应**: 流式SSE响应

**安全性**:
- 需要JWT令牌认证
- 从数据库获取API密钥
- 密钥仅在后端使用
- 支持重试机制

### 4.3 管理员API

#### GET /api/admin/custom-ai-configs
获取所有定制化配置

**请求头**: `x-admin-token: <token>`
**响应**:
```json
{
  "data": [...],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/admin/custom-ai-configs
创建新配置

**请求**:
```json
{
  "customer_id": "uuid",
  "dify_app_id": "app-id",
  "dify_api_key": "key",
  "dify_api_url": "url",
  "knowledge_base_id": "kb-id",
  "system_prompt": "prompt"
}
```

#### PUT /api/admin/custom-ai-configs
更新配置

#### DELETE /api/admin/custom-ai-configs?id=<id>
删除配置

## 5. 安全性实现

### 5.1 API密钥保护

✅ **已实现**:
- API密钥存储在Supabase数据库中
- 仅在后端 `/api/chat-custom` 中使用
- 不会在任何API响应中返回给前端
- 不会在浏览器控制台中暴露

### 5.2 认证与授权

✅ **已实现**:
- 用户认证: JWT令牌验证
- 用户授权: 只能访问自己的配置
- 管理员认证: x-admin-token验证
- RLS策略: 数据库级别的访问控制

### 5.3 数据隔离

✅ **已实现**:
- 每个客户有独立的Dify应用实例
- 每个客户有独立的知识库
- 每个客户有独立的系统提示词
- 数据库中的UNIQUE约束确保隔离

## 6. 部署步骤

### 6.1 数据库迁移

1. 打开Supabase Dashboard
2. 进入SQL Editor
3. 执行 `supabase/migrations/008_custom_ai_configs.sql`

### 6.2 环境变量配置

在Vercel中添加以下环境变量:

```
ADMIN_SECRET=<your-admin-secret>
```

### 6.3 部署代码

```bash
# 部署到Vercel
npm run deploy

# 或预览部署
npm run deploy:preview
```

### 6.4 验证部署

```bash
# 运行安全性测试
node scripts/test-custom-ai-security.js

# 运行集成测试
node scripts/test-custom-ai-integration.js
```

## 7. 使用指南

### 7.1 为客户配置定制化AI

1. 在Dify中创建新应用实例
2. 配置知识库和系统提示词
3. 获取API密钥和URL
4. 使用管理后台或API创建配置

### 7.2 客户使用定制化AI

1. 用户登录平台
2. 前端自动检测定制化配置
3. 聊天请求自动路由到定制Dify
4. 用户体验无差异

## 8. 故障排查

### 问题1: 用户无法使用定制化AI

**检查清单**:
- [ ] 配置是否已创建
- [ ] 配置是否启用 (is_active = true)
- [ ] Dify API密钥是否正确
- [ ] Dify API URL是否正确
- [ ] 网络连接是否正常

### 问题2: API密钥泄露

**检查清单**:
- [ ] 检查浏览器网络请求
- [ ] 检查浏览器控制台
- [ ] 检查Vercel日志
- [ ] 确认密钥仅在后端使用

### 问题3: 数据隔离问题

**检查清单**:
- [ ] 验证UNIQUE约束
- [ ] 检查RLS策略
- [ ] 验证customer_id映射

## 9. 性能优化

### 9.1 缓存策略

- 配置缓存: 用户登录时缓存配置
- 重试机制: 失败自动重试（最多2次）
- 超时设置: 总超时300秒

### 9.2 监控指标

- API响应时间
- 错误率
- 定制化AI使用率
- 共享AI使用率

## 10. 未来改进

- [ ] 配置加密存储
- [ ] 审计日志
- [ ] 配置版本控制
- [ ] A/B测试支持
- [ ] 自定义模型支持

