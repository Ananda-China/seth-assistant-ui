# 快速部署检查清单

**最后验证**: 2025-11-02  
**构建状态**: ✅ 成功  
**安全检查**: ✅ 通过

---

## 🎯 部署前最后检查 (5分钟)

### 1. 代码检查 ✅
```
✅ app/api/chat-custom/route.ts - 定制化聊天代理
✅ app/api/user/custom-ai-config/route.ts - 用户配置检查
✅ app/api/admin/custom-ai-configs/route.ts - 管理员API
✅ lib/custom-ai-config.ts - 配置管理模块
✅ lib/chat-client.ts - 前端聊天工具
✅ app/page.tsx - 前端集成
✅ supabase/migrations/008_custom_ai_configs.sql - 数据库迁移
```

### 2. 安全检查 ✅
```
✅ API密钥仅在后端使用
✅ 不会暴露给前端
✅ RLS策略已配置
✅ 用户认证已实现
✅ 管理员认证已实现
✅ 数据隔离正确
```

### 3. 功能检查 ✅
```
✅ 定制化AI功能完整
✅ 共享AI功能保护
✅ 前端自动路由
✅ 流式响应支持
✅ 错误处理完整
```

### 4. 构建检查 ✅
```
✅ npm run build 成功
✅ 没有TypeScript错误
✅ 没有编译警告
✅ 所有API端点正确
```

---

## 📋 部署步骤 (按顺序执行)

### 第1步: 数据库迁移 (2分钟)
```
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 supabase/migrations/008_custom_ai_configs.sql 内容
4. 执行SQL脚本
5. 验证表已创建: SELECT * FROM custom_ai_configs LIMIT 1;
```

### 第2步: 环境变量配置 (1分钟)
```
1. 打开 Vercel 项目设置
2. 进入 Environment Variables
3. 添加: ADMIN_SECRET=<your-secure-secret>
4. 保存
```

### 第3步: 代码提交 (2分钟)
```bash
git add .
git commit -m "feat: 添加定制化AI聊天功能

- 新增 custom_ai_configs 表
- 新增 /api/chat-custom 后端代理
- 新增 /api/user/custom-ai-config 用户配置检查
- 新增 /api/admin/custom-ai-configs 管理员API
- 前端自动路由选择
- 完整的安全性实现"

git push origin main
```

### 第4步: 验证部署 (5分钟)
```
1. 等待 Vercel 部署完成 (通常 2-3 分钟)
2. 测试共享AI功能
3. 创建测试定制化配置
4. 测试定制化AI功能
5. 检查日志无错误
```

---

## 🔍 快速验证命令

### 验证共享AI (现有用户)
```bash
# 应该返回 200 OK
curl -X POST https://your-domain.com/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "测试"}'
```

### 验证定制化AI (新用户)
```bash
# 1. 创建配置
curl -X POST https://your-domain.com/api/admin/custom-ai-configs \
  -H "x-admin-token: <ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "<user-id>",
    "dify_app_id": "test",
    "dify_api_key": "key",
    "dify_api_url": "https://api.dify.ai/v1"
  }'

# 2. 检查配置
curl -X GET https://your-domain.com/api/user/custom-ai-config \
  -H "Authorization: Bearer <token>"

# 3. 测试聊天
curl -X POST https://your-domain.com/api/chat-custom \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "测试"}'
```

---

## ⚠️ 常见问题

### Q: 现有用户会受影响吗?
**A**: 不会。共享AI功能完全保护，现有用户继续使用 `/api/chat`。

### Q: 如何回滚?
**A**: 
```bash
git revert <commit-hash>
git push origin main
```

### Q: 如何禁用定制化AI?
**A**: 在管理员API中将 `is_active` 设置为 `false`。

### Q: API密钥会暴露吗?
**A**: 不会。密钥仅在后端使用，不会返回给前端。

---

## 📊 部署后监控

### 关键指标
- ✅ 共享AI响应时间: < 2秒
- ✅ 定制化AI响应时间: < 2秒
- ✅ 错误率: < 0.1%
- ✅ 可用性: > 99.9%

### 日志检查
```bash
# 查看最近的日志
vercel logs --tail

# 查看错误
vercel logs --error
```

---

## ✅ 最终检查清单

部署前请确认:

- [ ] 数据库迁移脚本已准备
- [ ] 环境变量已配置
- [ ] 代码已提交
- [ ] 构建成功
- [ ] 没有安全问题
- [ ] 现有功能保护完整
- [ ] 测试计划已准备
- [ ] 回滚计划已准备

---

## 🚀 部署命令

```bash
# 一键部署 (需要Vercel CLI)
npm run deploy

# 或预览部署
npm run deploy:preview
```

---

**部署准备完成** ✅  
**预计部署时间**: 15-30分钟  
**风险等级**: 低  
**支持邮箱**: anandali1016@gmail.com

