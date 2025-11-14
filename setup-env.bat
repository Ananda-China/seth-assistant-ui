@echo off
echo ========================================
echo   赛斯助手 - 环境配置脚本
echo ========================================
echo.

if exist ".env.local" (
    echo ❌ .env.local 文件已存在
    echo 如需重新配置，请先删除现有文件
    echo.
    pause
    exit /b 1
)

echo 正在创建环境配置文件...
echo.

(
echo # 赛斯助手本地开发环境配置
echo # 创建时间：%date% %time%
echo.
echo # 基础配置
echo NODE_ENV=development
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
echo.
echo # JWT密钥（本地开发用）
echo JWT_SECRET=your-local-jwt-secret-key-2024
echo.
echo # Dify AI配置（需要您自己配置）
echo DIFY_API_URL=https://api.dify.ai/v1
echo DIFY_API_KEY=your-dify-api-key-here
echo.
echo # 数据存储配置（默认使用本地文件）
echo USE_SUPABASE=false
echo.
echo # 支付配置（模拟模式）
echo ZPAY_MOCK=true
echo ZPAY_MERCHANT_ID=test_merchant
echo ZPAY_API_KEY=test_api_key
echo ZPAY_API_SECRET=test_api_secret
echo.
echo # 微信支付配置（模拟模式）
echo WXPAY_MOCK=true
echo WXPAY_APP_ID=test_app_id
echo WXPAY_MCH_ID=test_mch_id
echo WXPAY_API_KEY=test_api_key
echo.
echo # 短信配置
echo # Spug短信服务配置（优先使用）
echo SPUG_USER_ID=46b2b2f98b174522817a4ea816eea216
echo SPUG_API_KEY=ak_vW2GzOnlxw0byPj9MRjpYQVLXd4gR7Ek
echo SPUG_SEND_URL=
echo SPUG_NAME=Seth验证码
echo # 兼容旧变量（如已存在可保留）
echo SPUT_USER_ID=
echo SPUT_API_KEY=
echo SPUT_API_URL=
echo SPUT_TEMPLATE_ID=
echo.
echo # 腾讯云短信配置（备用）
echo TENCENTCLOUD_SECRET_ID=
echo TENCENTCLOUD_SECRET_KEY=
echo TENCENT_SMS_SDK_APP_ID=
echo TENCENT_SMS_SIGN=
echo TENCENT_SMS_TEMPLATE_ID=
echo TENCENT_REGION=ap-guangzhou
) > .env.local

echo ✅ 环境配置文件已创建：.env.local
echo.
echo 📝 重要提醒：
echo 1. 请编辑 .env.local 文件，配置您的 DIFY_API_KEY
echo 2. 可以修改 JWT_SECRET 为其他随机字符串
echo 3. 其他配置保持默认即可
echo.
echo 🔗 配置完成后，运行 start-local.bat 启动项目
echo.
pause
