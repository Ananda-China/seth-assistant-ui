# Git提交脚本
# 用于提交所有修改到Git仓库

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git提交脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 配置Git用户信息
Write-Host "配置Git用户信息..." -ForegroundColor Yellow
git config user.email "anandali1016@gmail.com"
git config user.name "Ananda-China"
Write-Host "✓ Git用户信息已配置" -ForegroundColor Green
Write-Host ""

# 查看修改的文件
Write-Host "查看修改的文件..." -ForegroundColor Yellow
git status
Write-Host ""

# 添加所有修改
Write-Host "添加所有修改到暂存区..." -ForegroundColor Yellow
git add .
Write-Host "✓ 所有修改已添加" -ForegroundColor Green
Write-Host ""

# 提交修改
Write-Host "提交修改..." -ForegroundColor Yellow
$commitMessage = "优化功能: 修复激活码价格、新手引导、聊天限制和悬浮框提醒

修改内容:
1. 修复激活码激活处月卡价格显示(¥899)
2. 优化新手引导文字(去掉'请看截图')
3. 修复新手引导滑动功能
4. 修改新用户免费规则(5次,不限制时间)
5. 增加次卡类型(50次,¥39.9)
6. 实现聊天对话框50次限制
7. 添加45次时的悬浮框提醒

修改文件:
- app/account/page.tsx
- components/UserGuide.tsx
- lib/users-supabase.ts
- app/page.tsx
- app/globals.css"

git commit -m $commitMessage
Write-Host "✓ 修改已提交" -ForegroundColor Green
Write-Host ""

# 推送到远程仓库
Write-Host "推送到远程仓库..." -ForegroundColor Yellow
git push
Write-Host "✓ 修改已推送到远程仓库" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "提交完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

