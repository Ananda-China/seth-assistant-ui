# 🚀 赛斯助手部署指南

## 📋 部署步骤概览

1. **Supabase 数据库部署**
2. **Vercel 应用部署**
3. **环境变量配置**
4. **数据迁移**
5. **测试验证**

---

## 🗄️ 第一步：Supabase 数据库部署

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 账号登录
4. 创建新项目：
   - **Project name**: `seth-assistant`
   - **Database password**: 生成强密码并保存
   - **Region**: 选择 `Southeast Asia (Singapore)` 或最近的区域

### 2. 执行数据库迁移

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 复制 `supabase/migrations/001_initial_schema.sql` 的内容
3. 粘贴到 SQL Editor 中并执行
4. 确认所有表都创建成功

### 3. 获取 Supabase 配置

在 Supabase Dashboard 的 **Settings > API** 中获取：
- `Project URL`
- `anon public key`
- `service_role key` (⚠️ 保密)

---

## 🌐 第二步：Vercel 应用部署

### 1. 准备代码

```bash
# 提交所有更改
git add .
git commit -m "Add Supabase integration and ZPay support"
git push origin main
```

### 2. 部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的 `seth-assistant-ui` 仓库
5. 点击 "Deploy"

### 3. 配置自定义域名（可选）

1. 在 Vercel Dashboard 中进入项目
2. 进入 **Settings > Domains**
3. 添加你的域名
4. 按照指引配置 DNS

---

## ⚙️ 第三步：环境变量配置

在 Vercel Dashboard 的 **Settings > Environment Variables** 中添加：

### 必需配置
```bash
# 数据库选择
USE_SUPABASE=true

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key-here

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Dify AI 配置
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your-dify-api-key
```

### 短信配置（如果使用腾讯云短信）
```bash
SMS_API_KEY=your-sms-api-key
SMS_SECRET=your-sms-secret
```

### ZPay 配置（暂时可以不配置）
```bash
# ZPay 配置（可选，暂时使用模拟模式）
ZPAY_MOCK=1
ZPAY_MERCHANT_ID=your-zpay-merchant-id
ZPAY_API_KEY=your-zpay-api-key
ZPAY_API_SECRET=your-zpay-api-secret
ZPAY_BASE_URL=https://api.zpay.com
ZPAY_NOTIFY_URL=https://yourdomain.com/api/zpay/notify
```

---

## 🔄 第四步：数据迁移（如果从 JSON 文件迁移）

如果你之前有 JSON 文件数据，可以创建迁移脚本：

### 1. 创建迁移脚本

```typescript
// scripts/migrate-to-supabase.ts
import { supabaseAdmin } from '../lib/supabase';
import { readFileSync } from 'fs';
import path from 'path';

async function migrateData() {
  try {
    // 迁移用户数据
    const usersData = JSON.parse(readFileSync(path.join(process.cwd(), '.data/users.json'), 'utf8'));
    for (const user of usersData) {
      await supabaseAdmin.from('users').insert({
        phone: user.phone,
        nickname: user.nickname,
        invite_code: user.invite_code,
        invited_by: user.invited_by,
        created_at: new Date(user.created_at).toISOString(),
        // 添加试用期
        trial_start: new Date(user.created_at).toISOString(),
        trial_end: new Date(user.created_at + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_type: 'free',
        chat_count: 0,
        last_chat_date: new Date().toISOString().split('T')[0]
      });
    }
    
    console.log('✅ 用户数据迁移完成');
    
    // 迁移其他数据...
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  }
}

migrateData();
```

### 2. 运行迁移

```bash
npx tsx scripts/migrate-to-supabase.ts
```

---

## ✅ 第五步：测试验证

### 1. 功能测试清单

- [ ] **用户注册登录**
  - 手机号验证码登录
  - 邀请码功能
  - 用户信息管理

- [ ] **聊天功能**
  - 创建新对话
  - 发送消息
  - 查看历史记录
  - 权限控制（试用期限制）

- [ ] **支付功能**
  - 套餐选择页面
  - 模拟支付流程
  - 权限升级

- [ ] **后台管理**
  - 管理员登录
  - 用户管理
  - 订单查看

### 2. 性能测试

- 页面加载速度
- 数据库查询性能
- 并发用户支持

---

## 🔧 故障排除

### 常见问题

1. **Supabase 连接失败**
   - 检查环境变量是否正确
   - 确认 Supabase 项目状态
   - 检查网络连接

2. **权限错误**
   - 检查 RLS 策略
   - 确认 service_role_key 配置

3. **部署失败**
   - 检查构建日志
   - 确认所有依赖已安装
   - 检查环境变量

### 调试技巧

```bash
# 查看 Vercel 部署日志
vercel logs

# 本地测试 Supabase 连接
npm run dev
```

---

## 🎯 下一步

部署完成后，你可以：

1. **配置真实的 ZPay**（当可以访问时）
2. **优化性能和用户体验**
3. **添加更多功能**
4. **监控和分析**

---

## 📞 支持

如果遇到问题，可以：
- 检查 Vercel 和 Supabase 的官方文档
- 查看项目的 GitHub Issues
- 联系技术支持
