@echo off
echo ========================================
echo   赛斯助手 - 项目状态检查
echo ========================================
echo.

echo 📁 项目目录检查：
if exist "app" echo ✅ app/ - 应用代码目录
if exist "lib" echo ✅ lib/ - 核心库文件
if exist "supabase" echo ✅ supabase/ - 数据库迁移文件
if exist "package.json" echo ✅ package.json - 项目配置
if exist "tailwind.config.js" echo ✅ tailwind.config.js - 样式配置
echo.

echo 🔧 环境配置检查：
if exist ".env.local" (
    echo ✅ .env.local - 环境配置文件已存在
) else (
    echo ❌ .env.local - 环境配置文件缺失
    echo    请运行 setup-env.bat 创建配置文件
)
echo.

echo 📦 依赖检查：
if exist "node_modules" (
    echo ✅ node_modules/ - 依赖已安装
) else (
    echo ❌ node_modules/ - 依赖未安装
    echo    请运行 npm install 安装依赖
)
echo.

echo 🚀 启动脚本检查：
if exist "start-local.bat" echo ✅ start-local.bat - 本地启动脚本
if exist "setup-env.bat" echo ✅ setup-env.bat - 环境配置脚本
echo.

echo 📋 功能模块检查：
if exist "app/login" echo ✅ 登录注册模块
if exist "app/admin" echo ✅ 管理后台模块
if exist "app/pricing" echo ✅ 套餐支付模块
if exist "app/account" echo ✅ 个人中心模块
echo.

echo 🔑 管理员账号：
echo     用户名：admin
echo     密码：admin123
echo.

echo 🌐 访问地址：
echo     主应用：http://localhost:3000
echo     登录页：http://localhost:3000/login
echo     套餐页：http://localhost:3000/pricing
echo     管理后台：http://localhost:3000/admin
echo.

echo 📝 下一步操作：
if exist ".env.local" (
    if exist "node_modules" (
        echo ✅ 环境已配置，依赖已安装
        echo    可以运行 start-local.bat 启动项目
    ) else (
        echo ⚠️  环境已配置，但依赖未安装
        echo    请运行 npm install 安装依赖
    )
) else (
    echo ❌ 环境未配置
    echo    请运行 setup-env.bat 配置环境
)
echo.

pause
