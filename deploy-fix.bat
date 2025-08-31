@echo off
echo ========================================
echo 修复500错误后重新部署脚本
echo ========================================
echo.

echo 正在提交修复的代码...
git add .
git commit -m "Fix SMS API 500 errors and OTP store for production environment"
echo.

echo 正在推送到GitHub...
git push origin main
echo.

echo 正在触发Vercel重新部署...
vercel --prod
echo.

echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 请确保在Vercel控制台中配置了必要的环境变量：
echo 1. 进入项目设置 -> Environment Variables
echo 2. 添加 NODE_ENV=production
echo 3. 添加 JWT_SECRET=your_secret_here
echo 4. 添加 DIFY_API_URL 和 DIFY_API_KEY
echo 5. 可选：添加腾讯云SMS配置
echo.
echo 详细配置请参考 PRODUCTION_CONFIG.md 文件
pause
