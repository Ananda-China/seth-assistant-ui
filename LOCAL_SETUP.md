# 🚀 本地开发环境配置指南

## 📋 环境配置步骤

### 1. 创建环境配置文件

在项目根目录创建 `.env.local` 文件，内容如下：

```bash
# 基础配置
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# JWT密钥（本地开发用）
JWT_SECRET=your-local-jwt-secret-key-2024

# Dify AI配置（需要您自己配置）
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your-dify-api-key-here

# 数据存储配置（默认使用本地文件）
USE_SUPABASE=false

# 支付配置（模拟模式）
ZPAY_MOCK=true
ZPAY_MERCHANT_ID=test_merchant
ZPAY_API_KEY=test_api_key
ZPAY_API_SECRET=test_api_secret

# 微信支付配置（模拟模式）
WXPAY_MOCK=true
WXPAY_APP_ID=test_app_id
WXPAY_MCH_ID=test_mch_id
WXPAY_API_KEY=test_api_key

# 短信配置（模拟模式）
SMS_MOCK=true
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

- 主应用：http://localhost:3000
- 登录页面：http://localhost:3000/login
- 套餐页面：http://localhost:3000/pricing
- 管理后台：http://localhost:3000/admin

## 🔑 管理员账号

- 用户名：admin
- 密码：admin123

## 📱 测试账号

可以使用任意手机号注册，系统会模拟发送验证码。

## 🧪 功能测试清单

### 用户功能测试
- [ ] 手机号注册
- [ ] 验证码登录
- [ ] 邀请码使用
- [ ] 个人信息管理

### 聊天功能测试
- [ ] 创建新对话
- [ ] 发送消息
- [ ] 查看历史记录
- [ ] 会话管理

### 支付功能测试
- [ ] 套餐选择
- [ ] 模拟支付
- [ ] 权限升级

### 管理功能测试
- [ ] 管理员登录
- [ ] 用户管理
- [ ] 数据统计

## 🚨 注意事项

1. **Dify API配置**：需要您自己申请Dify API密钥
2. **支付模拟**：当前使用模拟模式，不会真实扣费
3. **数据存储**：默认使用本地JSON文件，数据会保存在`.data`目录
4. **端口冲突**：如果3000端口被占用，可以修改`package.json`中的端口配置

## 🆘 常见问题

### Q: 启动失败怎么办？
A: 检查Node.js版本（建议16+），确保依赖安装完整

### Q: 聊天功能不工作？
A: 检查Dify API配置是否正确

### Q: 支付功能测试失败？
A: 当前使用模拟模式，检查环境变量配置

### Q: 数据库连接失败？
A: 默认使用本地文件存储，无需数据库连接
