@echo off
echo ========================================
echo   赛斯助手 - Supabase工具集
echo ========================================
echo.

:menu
echo 请选择要执行的操作：
echo.
echo 1. 测试Supabase连接
echo 2. 运行数据库维护
echo 3. 检查数据库状态
echo 4. 创建性能索引
echo 5. 数据清理
echo 6. 查看数据统计
echo 7. 打开Supabase Dashboard
echo 8. 返回主菜单
echo.
set /p choice=请输入选项 (1-8): 

if "%choice%"=="1" goto test-connection
if "%choice%"=="2" goto run-maintenance
if "%choice%"=="3" goto check-status
if "%choice%"=="4" goto create-indexes
if "%choice%"=="5" goto cleanup-data
if "%choice%"=="6" goto view-stats
if "%choice%"=="7" goto open-dashboard
if "%choice%"=="8" goto main-menu
goto invalid-choice

:test-connection
echo.
echo 🔍 测试Supabase连接...
npm run test:supabase
echo.
pause
goto menu

:run-maintenance
echo.
echo 🚀 运行数据库维护...
npm run maintenance:supabase
echo.
pause
goto menu

:check-status
echo.
echo 📊 检查数据库状态...
node -e "const Maintenance = require('./supabase-maintenance.js'); const m = new Maintenance(); m.checkDatabaseStatus();"
echo.
pause
goto menu

:create-indexes
echo.
echo 🔧 创建性能索引...
node -e "const Maintenance = require('./supabase-maintenance.js'); const m = new Maintenance(); m.createIndexes();"
echo.
pause
goto menu

:cleanup-data
echo.
echo 🧹 数据清理...
node -e "const Maintenance = require('./supabase-maintenance.js'); const m = new Maintenance(); m.cleanupData();"
echo.
pause
goto menu

:view-stats
echo.
echo 📈 查看数据统计...
node -e "const Maintenance = require('./supabase-maintenance.js'); const m = new Maintenance(); m.getStatistics();"
echo.
pause
goto menu

:open-dashboard
echo.
echo 🌐 打开Supabase Dashboard...
start https://supabase.com/dashboard
echo ✅ 已在浏览器中打开Supabase Dashboard
echo 📝 请选择您的项目: izgcguglvapifyngudcu
echo.
pause
goto menu

:invalid-choice
echo.
echo ❌ 无效选项，请重新选择
echo.
pause
goto menu

:main-menu
echo.
echo 返回主菜单...
exit
