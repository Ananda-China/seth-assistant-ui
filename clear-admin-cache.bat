@echo off
echo ========================================
echo   赛斯助手 - 管理后台缓存清理工具
echo ========================================
echo.

echo 🔍 问题分析:
echo 管理后台显示: 4个用户, 9个对话, 32个消息
echo 数据库实际: 3个用户, 0个对话, 0个消息
echo.
echo 这是典型的缓存数据不一致问题！
echo.

echo 🧹 缓存清理步骤:
echo.
echo 1. 清理浏览器缓存
echo 2. 刷新管理后台页面
echo 3. 重新登录管理后台
echo.

echo 🌐 步骤1: 清理浏览器缓存
echo 按任意键打开浏览器缓存清理页面...
pause >nul
start ms-settings:privacy-webdata

echo.
echo 📋 在打开的设置页面中:
echo - 点击"清除浏览数据"
echo - 选择"缓存数据"和"本地存储"
echo - 点击"清除"
echo.

echo 🔄 步骤2: 刷新管理后台
echo 按任意键打开管理后台...
pause >nul
start http://localhost:3000/admin

echo.
echo 📝 在管理后台中:
echo - 按 F5 刷新页面
echo - 或者按 Ctrl+F5 强制刷新
echo - 如果问题仍然存在，重新登录
echo.

echo 💾 步骤3: 检查本地存储 (可选)
echo 如果问题仍然存在:
echo - 按 F12 打开开发者工具
echo - 选择 Application/应用程序 标签
echo - 在左侧找到 Local Storage
echo - 删除相关的缓存数据
echo.

echo 🎯 预期结果:
echo 清理后，管理后台应该显示:
echo - 用户数: 3个 ✅
echo - 对话数: 0个 ✅
echo - 消息数: 0个 ✅
echo.

echo ⚠️ 注意事项:
echo - 清理缓存会清除所有本地存储的数据
echo - 需要重新登录管理后台
echo - 如果问题持续，可能需要重启开发服务器
echo.

echo 🔧 如果问题仍然存在:
echo 1. 重启开发服务器 (Ctrl+C, 然后 npm run dev)
echo 2. 检查 .data 目录中的本地缓存文件
echo 3. 运行 npm run maintenance:supabase 检查数据库
echo.

echo ========================================
echo 缓存清理指南完成！
echo 请按照上述步骤操作
echo ========================================
echo.
pause
