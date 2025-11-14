# Git提交脚本 - 时间显示优化
# 用于提交内容管理页面时间显示优化

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git提交脚本 - 时间显示优化" -ForegroundColor Cyan
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

# 添加修改的文件
Write-Host "添加修改的文件到暂存区..." -ForegroundColor Yellow
git add app/admin/components/ContentManagement.tsx
Write-Host "✓ 文件已添加" -ForegroundColor Green
Write-Host ""

# 提交修改
Write-Host "提交修改..." -ForegroundColor Yellow
$commitMessage = "优化：内容管理页面时间显示精确到年月日时分秒

修改内容:
- 将创建时间显示从年月日改为年月日时分秒
- 将更新时间显示从年月日改为年月日时分秒
- 不影响其他功能，仅优化时间显示格式

修改文件:
- app/admin/components/ContentManagement.tsx (第459行和第532行)"

git commit -m $commitMessage
Write-Host "✓ 修改已提交" -ForegroundColor Green
Write-Host ""

# 推送到远程仓库
Write-Host "推送到远程仓库..." -ForegroundColor Yellow
git push origin main
Write-Host "✓ 修改已推送到远程仓库" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "提交完成！Vercel将自动部署更新" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

