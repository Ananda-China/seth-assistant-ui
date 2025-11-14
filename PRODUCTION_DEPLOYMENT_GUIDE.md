# 定制化AI - 生产环境部署指南

**部署日期**: 2025-11-02  
**部署环境**: Vercel + Supabase  
**Git邮箱**: anandali1016@gmail.com

---

## 📋 部署前准备

### 1. 环境检查
```bash
# 验证构建
npm run build

# 检查环境变量
echo "NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE_SERVICE_ROLE_KEY: [已配置]"
echo "JWT_SECRET: [已配置]"
echo "ADMIN_SECRET: [需要配置]"
```

### 2. 数据库准备
- [ ] 备份现有数据库
- [ ] 准备SQL迁移脚本
- [ ] 测试迁移脚本

---

## 🚀 部署步骤

### 步骤1: 数据库迁移

**在Supabase SQL Editor中执行**:

```sql
-- 执行文件: supabase/migrations/008_custom_ai_configs.sql
-- 此脚本将创建:
-- 1. custom_ai_configs 表
-- 2. 4个性能索引
-- 3. 自动时间戳触发器
-- 4. RLS策略
```

**验证迁移**:
```sql
-- 检查表是否创建
SELECT * FROM custom_ai_configs LIMIT 1;

-- 检查索引
SELECT indexname FROM pg_indexes 
WHERE tablename = 'custom_ai_configs';

-- 检查RLS策略
SELECT * FROM pg_policies 
WHERE tablename = 'custom_ai_configs';
```

### 步骤2: 环境变量配置

**在Vercel项目设置中添加**:

```
ADMIN_SECRET=<your-secure-admin-secret>
```

**验证现有环境变量**:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ JWT_SECRET
- ✅ DIFY_API_URL
- ✅ DIFY_API_KEY

### 步骤3: 代码部署

```bash
# 1. 提交代码
git add .
git commit -m "feat: 添加定制化AI聊天功能

- 新增 custom_ai_configs 表
- 新增 /api/chat-custom 后端代理
- 新增 /api/user/custom-ai-config 用户配置检查
- 新增 /api/admin/custom-ai-configs 管理员API
- 前端自动路由选择
- 完整的安全性实现"

# 2. 推送到GitHub
git push origin main

# 3. Vercel自动部署
# 或手动部署
npm run deploy
```

### 步骤4: 部署验证

**验证共享AI功能** (确保现有用户不受影响):
```bash
# 测试共享AI端点
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "你好", "conversation_id": "<conv-id>"}'
```

**验证定制化AI功能**:
```bash
# 1. 创建测试配置
curl -X POST https://your-domain.com/api/admin/custom-ai-configs \
  -H "x-admin-token: <ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "<user-id>",
    "dify_app_id": "test-app",
    "dify_api_key": "test-key",
    "dify_api_url": "https://api.dify.ai/v1",
    "knowledge_base_id": "test-kb",
    "system_prompt": "你是一个测试AI"
  }'

# 2. 检查用户配置
curl -X GET https://your-domain.com/api/user/custom-ai-config \
  -H "Authorization: Bearer <user-token>"

# 3. 测试定制化聊天
curl -X POST https://your-domain.com/api/chat-custom \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "你好", "conversation_id": "<conv-id>"}'
```

---

## 🔍 部署后检查

### 1. 功能检查
- [ ] 共享AI用户能正常聊天
- [ ] 定制化AI用户能正常聊天
- [ ] 管理员能创建/更新/删除配置
- [ ] API密钥不会暴露给前端

### 2. 性能检查
- [ ] 聊天响应时间正常
- [ ] 没有超时错误
- [ ] 流式响应正常工作

### 3. 安全检查
- [ ] 用户只能访问自己的配置
- [ ] 管理员令牌验证正常
- [ ] API密钥存储在数据库
- [ ] 没有密钥泄露

### 4. 日志检查
```bash
# 查看Vercel日志
vercel logs

# 查看错误
vercel logs --error
```

---

## 📊 监控指标

### 关键指标
- API响应时间: < 2秒
- 错误率: < 0.1%
- 可用性: > 99.9%

### 告警规则
- 响应时间 > 5秒
- 错误率 > 1%
- 可用性 < 99%

---

## 🔄 回滚计划

如果部署出现问题:

```bash
# 1. 回滚代码
git revert <commit-hash>
git push origin main

# 2. 回滚数据库 (如果需要)
# 从备份恢复

# 3. 清除缓存
vercel env pull
```

---

## 📞 支持联系

- **Git邮箱**: anandali1016@gmail.com
- **问题报告**: 创建GitHub Issue
- **紧急情况**: 联系技术支持

---

## ✅ 部署检查清单

- [ ] 数据库迁移完成
- [ ] 环境变量配置完成
- [ ] 代码推送完成
- [ ] Vercel部署完成
- [ ] 共享AI功能验证通过
- [ ] 定制化AI功能验证通过
- [ ] 安全性检查通过
- [ ] 性能检查通过
- [ ] 日志检查完成
- [ ] 监控告警配置完成

---

**部署状态**: 准备就绪 ✅  
**预计部署时间**: 15-30分钟  
**风险等级**: 低 (现有功能完全保护)

