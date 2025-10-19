# Git提交脚本
# 用法: .\commit-changes.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Seth AI 助手 - Git提交脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 配置Git用户信息
Write-Host "📝 配置Git用户信息..." -ForegroundColor Yellow
git config user.email "anandali1016@gmail.com"
git config user.name "Ananda-China"

# 显示当前状态
Write-Host ""
Write-Host "📊 当前Git状态:" -ForegroundColor Yellow
git status

# 确认提交
Write-Host ""
Write-Host "确认提交以下更改? (Y/N)" -ForegroundColor Cyan
$confirm = Read-Host

if ($confirm -eq "Y" -or $confirm -eq "y") {
    Write-Host ""
    Write-Host "🔄 添加所有更改..." -ForegroundColor Yellow
    git add .
    
    Write-Host "💾 提交更改..." -ForegroundColor Yellow
    git commit -m "优化UI: 增大二维码、更新价格、优化新手引导

- 个人中心二维码大小从200x200px增大到280x280px
- 订阅页面月卡价格更新为¥899，年卡为¥3999
- 个人中心月套餐价格更新为¥899
- 新手引导文字更新为新的欢迎语
- 新手引导添加左右滑动功能
- 新手引导价格同步更新"
    
    Write-Host ""
    Write-Host "📤 推送到远程仓库..." -ForegroundColor Yellow
    git push
    
    Write-Host ""
    Write-Host "✅ 提交完成！" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ 已取消提交" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

