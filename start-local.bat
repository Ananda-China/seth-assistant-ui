@echo off
echo ========================================
echo   赛斯助手 - 本地开发环境启动脚本
echo ========================================
echo.

echo 正在检查环境配置...
if not exist ".env.local" (
    echo.
    echo ❌ 未找到 .env.local 配置文件
    echo.
    echo 请按照以下步骤创建配置文件：
    echo 1. 在项目根目录创建 .env.local 文件
    echo 2. 参考 LOCAL_SETUP.md 文件中的配置示例
    echo 3. 至少需要配置 JWT_SECRET 和 DIFY_API_KEY
    echo.
    echo 创建配置文件后，重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✅ 环境配置文件已找到
echo.

echo 正在启动开发服务器...
echo 访问地址：http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev
