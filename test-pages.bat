@echo off
echo ========================================
echo   赛斯助手 - 页面访问测试
echo ========================================
echo.

echo 正在测试页面访问...
echo.

echo 1. 测试主页面...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing; echo ✅ 主页面正常 (状态码: $($response.StatusCode)) } catch { echo ❌ 主页面访问失败: $($_.Exception.Message) }"

echo.
echo 2. 测试登录页面...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/login' -UseBasicParsing; echo ✅ 登录页面正常 (状态码: $($response.StatusCode)) } catch { echo ❌ 登录页面访问失败: $($_.Exception.Message) }"

echo.
echo 3. 测试管理后台...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/admin' -UseBasicParsing; echo ✅ 管理后台正常 (状态码: $($response.StatusCode)) } catch { echo ❌ 管理后台访问失败: $($_.Exception.Message) }"

echo.
echo 4. 测试套餐页面...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/pricing' -UseBasicParsing; echo ✅ 套餐页面正常 (状态码: $($response.StatusCode)) } catch { echo ❌ 套餐页面访问失败: $($_.Exception.Message) }"

echo.
echo 5. 测试个人中心...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/account' -UseBasicParsing; echo ✅ 个人中心正常 (状态码: $($response.StatusCode)) } catch { echo ❌ 个人中心访问失败: $($_.Exception.Message) }"

echo.
echo ========================================
echo 测试完成！
echo.
echo 如果所有页面都显示 ✅，说明项目运行正常
echo 如果显示 ❌，请检查项目启动日志
echo.
echo 现在可以在浏览器中访问：
echo - 主应用：http://localhost:3000
echo - 登录页：http://localhost:3000/login
echo - 管理后台：http://localhost:3000/admin
echo ========================================
echo.
pause
