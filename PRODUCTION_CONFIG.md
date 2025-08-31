# 生产环境配置指南

## 解决500错误的关键配置

### 1. 环境变量配置

在Vercel项目设置中添加以下环境变量：

#### 必需配置
```bash
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
INVITE_CODE=your_invite_code_here
```

#### Dify AI配置
```bash
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your_dify_api_key_here
```

#### 腾讯云SMS配置（用于短信验证码）
```bash
TENCENTCLOUD_SECRET_ID=your_tencent_secret_id
TENCENTCLOUD_SECRET_KEY=your_tencent_secret_key
TENCENT_SMS_SDK_APP_ID=your_sms_sdk_app_id
TENCENT_SMS_SIGN=your_sms_sign_name
TENCENT_SMS_TEMPLATE_ID=your_sms_template_id
TENCENT_REGION=ap-guangzhou
```

#### 其他可选配置
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
STRIPE_SECRET_KEY=your_stripe_secret_key
USE_SUPABASE=true
```

### 2. 配置步骤

1. 登录Vercel控制台
2. 选择您的项目 `seth-assistant-ui`
3. 进入 "Settings" → "Environment Variables"
4. 添加上述环境变量
5. 重新部署项目

### 3. 已修复的问题

#### OTP存储问题
- ✅ 修复了生产环境OTP存储不持久的问题
- ✅ 添加了过期OTP自动清理机制
- ✅ 改进了错误日志记录

#### SMS API问题
- ✅ 添加了SMS配置检查
- ✅ 提供了优雅的fallback机制
- ✅ 改进了错误处理和日志记录

### 4. 测试验证

配置完成后，测试以下功能：

1. **登录流程**：发送验证码 → 验证验证码
2. **聊天功能**：确保AI对话正常工作
3. **权限检查**：验证用户权限系统

### 5. 监控和调试

- 查看Vercel函数日志
- 检查控制台输出
- 验证环境变量是否正确加载

## 注意事项

- 确保JWT_SECRET足够复杂且安全
- 生产环境建议配置真实的SMS服务
- 定期检查API密钥的有效性
- 监控错误日志，及时处理异常
