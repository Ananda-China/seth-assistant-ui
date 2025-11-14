# Vercel 环境变量配置指南

## ✅ 代码已推送到GitHub

提交信息：
```
commit ddbdc1c
fix: 修复聊天显示问题和性能优化

- 修复流式数据中的换行符丢失问题
- 修正Dify API URL配置（从官方API改为生产环境）
- 添加重试机制和超时控制
- 添加性能监控和详细日志
- 预期性能提升10倍以上
```

GitHub仓库：https://github.com/Ananda-China/seth-assistant-ui

---

## ⚠️ 重要：必须配置Vercel环境变量

**Vercel不会自动读取`.env.local`文件！**

你必须在Vercel Dashboard中手动配置环境变量，否则生产环境仍会使用旧的配置。

---

## 📝 配置步骤（详细图文说明）

### 步骤1：登录Vercel

1. 访问 https://vercel.com/login
2. 使用GitHub账号登录（或你注册Vercel时使用的账号）

### 步骤2：找到你的项目

1. 登录后会看到Dashboard
2. 找到项目 `seth-assistant-ui`
3. 点击项目名称进入项目详情页

### 步骤3：进入环境变量设置

1. 在项目页面顶部，点击 **Settings** 标签
2. 在左侧菜单中，点击 **Environment Variables**

### 步骤4：更新DIFY_API_URL

**查找现有变量**：
- 在Environment Variables页面，查找 `DIFY_API_URL`
- 如果存在，点击右侧的 **Edit** 按钮
- 如果不存在，点击页面上的 **Add New** 按钮

**更新/添加变量**：
```
Name: DIFY_API_URL
Value: http://122.152.220.161:8088/v1
```

**选择环境**：
- ✅ Production（生产环境）
- ✅ Preview（预览环境）
- ✅ Development（开发环境）

**建议：全部勾选**，确保所有环境都使用新的配置。

### 步骤5：保存配置

1. 点击 **Save** 按钮
2. Vercel会提示：需要重新部署才能生效

### 步骤6：触发重新部署

**选项A：自动部署（推荐）**
- GitHub推送后，Vercel会自动检测并部署
- 等待3-5分钟即可

**选项B：手动重新部署**
1. 在项目页面，点击 **Deployments** 标签
2. 找到最新的部署（应该是刚才GitHub推送触发的）
3. 如果状态是 "Building" 或 "Ready"，等待完成即可
4. 如果需要强制重新部署：
   - 点击最新部署右侧的 **⋯** (三个点)
   - 选择 **Redeploy**
   - 确认重新部署

---

## 🔍 验证配置是否生效

### 方法1：检查部署日志

1. 在 **Deployments** 标签中，点击最新的部署
2. 点击 **Functions** 标签
3. 点击 **Logs** 查看日志
4. 查找以下日志：

```
🔍 Dify API 请求参数: {
  apiUrl: "http://122.152.220.161:8088/v1/chat-messages",
  ...
}
```

**如果看到 `https://api.dify.ai`，说明环境变量没有生效！**

### 方法2：测试聊天功能

1. 访问你的生产环境网站
2. 登录并发送一条测试消息
3. 观察响应时间：
   - ✅ 如果在 **2-5秒** 内回复，说明配置成功
   - ❌ 如果仍需要 **20-30秒**，说明仍在使用官方API

### 方法3：检查浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console** 标签
3. 发送消息后，查找日志：

```
⏱️ Dify连接时间: 100-200ms  ✅ 正常
⏱️ Dify连接时间: 900-1000ms  ❌ 仍在使用官方API
```

---

## 📊 预期效果

### 配置成功后

| 指标 | 值 |
|------|-----|
| API延迟 | 80-150ms |
| 首次响应 | 1-2秒 |
| 完整回复 | 2-5秒 |
| 用户体验 | ⭐⭐⭐⭐⭐ |

### 如果仍然很慢

说明环境变量没有生效，请检查：
1. 是否保存了环境变量
2. 是否选择了 Production 环境
3. 是否触发了重新部署
4. 部署是否完成（状态为 Ready）

---

## 🛠️ 其他需要配置的环境变量

确保以下环境变量都已配置：

```
# Dify配置
DIFY_API_URL=http://122.152.220.161:8088/v1
DIFY_API_KEY=app-R3d28A2K5z2sNulLScvcmZlF

# JWT密钥
JWT_SECRET=seth-assistant-super-secret-key-2024

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://izgcguglvapifyngudcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 其他配置
USE_SUPABASE=true
ZPAY_MOCK=1
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
SPUG_SEND_URL=https://push.spug.cc/send/X4PBx8Ew9EjYAny5
SPUG_NAME=Seth验证码
```

**注意**：
- 以 `NEXT_PUBLIC_` 开头的变量会暴露给前端
- 其他变量只在服务器端可用
- 敏感信息（如API密钥）不要以 `NEXT_PUBLIC_` 开头

---

## 🚨 常见问题

### Q1：环境变量保存后，为什么还是很慢？

**原因**：环境变量更新后，需要重新部署才能生效。

**解决**：
1. 进入 Deployments 标签
2. 点击最新部署的 **Redeploy** 按钮
3. 等待部署完成

### Q2：如何确认使用的是哪个Dify地址？

**方法**：查看部署日志
1. Deployments → 最新部署 → Functions → Logs
2. 查找 `apiUrl` 字段
3. 应该显示 `http://122.152.220.161:8088/v1/chat-messages`

### Q3：可以同时配置多个环境吗？

**可以**！Vercel支持为不同环境配置不同的值：
- Production：生产环境
- Preview：预览环境（PR部署）
- Development：开发环境（本地开发）

建议：
- Production 和 Preview 使用生产Dify地址
- Development 可以使用本地Dify（如果有）

### Q4：环境变量会被提交到GitHub吗？

**不会**！`.env.local` 已在 `.gitignore` 中，不会被提交。

Vercel的环境变量存储在Vercel服务器上，与GitHub仓库分离。

---

## ✅ 配置完成检查清单

- [ ] 登录Vercel Dashboard
- [ ] 找到项目 seth-assistant-ui
- [ ] 进入 Settings → Environment Variables
- [ ] 更新 DIFY_API_URL 为 http://122.152.220.161:8088/v1
- [ ] 选择 Production, Preview, Development 环境
- [ ] 保存配置
- [ ] 触发重新部署（或等待自动部署）
- [ ] 等待部署完成（状态为 Ready）
- [ ] 测试聊天功能（响应时间应在2-5秒）
- [ ] 检查部署日志（确认使用新的API地址）

---

## 📞 需要帮助？

如果配置过程中遇到问题，请提供：
1. Vercel部署日志截图
2. 环境变量配置截图
3. 浏览器控制台日志
4. 具体的错误信息

---

## 🎉 下一步

配置完成后，你应该能看到：
- ✅ 回复速度从20-30秒降低到2-5秒
- ✅ 多行回复正确显示
- ✅ 刷新后消息不会丢失
- ✅ 更详细的日志便于排查问题

享受飞速的AI聊天体验吧！🚀

