# 如何添加二维码图片到礼物页面

## 📋 问题说明

当前礼物页面显示的是占位符，因为 `public/images/qr-code-home.png` 文件是空的。

## ✅ 解决方案（3种方法）

---

### 方法1：直接替换文件（推荐）⭐

**步骤**:

1. **保存二维码图片**
   - 从你的截图中保存二维码图片
   - 或者重新生成指向 `https://www.brand-new.ltd/` 的二维码
   - 建议尺寸：240x240 像素或更大

2. **重命名文件**
   ```
   qr-code-home.png
   ```

3. **替换项目文件**
   - 找到项目目录: `public/images/`
   - 将你的二维码图片复制到这个位置
   - 覆盖现有的 `qr-code-home.png` 文件

4. **提交到 Git**
   ```bash
   git add public/images/qr-code-home.png
   git commit -m "添加礼物页面二维码图片"
   git push
   ```

5. **等待部署**
   - Vercel 会自动部署（1-3分钟）
   - 刷新页面查看效果

---

### 方法2：使用在线二维码生成器

如果你没有现成的二维码图片：

1. **访问二维码生成网站**
   - https://www.qrcode-monkey.com/
   - https://www.the-qrcode-generator.com/
   - 或其他二维码生成工具

2. **生成二维码**
   - 输入网址: `https://www.brand-new.ltd/`
   - 选择尺寸: 至少 240x240 像素
   - 下载 PNG 格式

3. **按照方法1的步骤3-5操作**

---

### 方法3：使用图床（临时方案）

如果你想快速测试，可以先上传到图床：

1. **上传图片到图床**
   - 使用 imgur.com
   - 或者 sm.ms
   - 获取图片直链

2. **修改代码使用外部链接**
   
   打开 `app/gift/page.tsx`，找到第85-106行，替换为：

   ```tsx
   <div className="qr-code-container">
     <div className="qr-code-wrapper">
       <img
         src="你的图床链接"
         alt="赛斯助手官网二维码"
         width={240}
         height={240}
         className="qr-code-img"
       />
     </div>
     <a href="https://www.brand-new.ltd/" target="_blank" rel="noopener noreferrer" className="website-link">
       https://www.brand-new.ltd/
     </a>
   </div>
   ```

3. **提交代码**
   ```bash
   git add app/gift/page.tsx
   git commit -m "使用外部链接显示二维码"
   git push
   ```

---

## 🎯 推荐的二维码规格

- **格式**: PNG（推荐）或 JPG
- **尺寸**: 240x240 像素或更大（最大 500x500）
- **背景**: 白色
- **前景**: 黑色
- **容错率**: 中等（M）或高（H）

---

## 🔍 验证二维码是否正确

添加后，请验证：

1. **文件存在**
   ```bash
   # 在项目根目录执行
   ls public/images/qr-code-home.png
   ```

2. **文件不为空**
   ```bash
   # Windows PowerShell
   (Get-Item public/images/qr-code-home.png).length
   
   # 应该显示文件大小（字节），不应该是 0
   ```

3. **访问测试**
   - 部署后访问: `https://www.brand-new.ltd/gift`
   - 检查二维码是否正常显示
   - 用手机扫描测试是否能跳转到 `https://www.brand-new.ltd/`

---

## 🐛 常见问题

### Q1: 为什么我添加了图片但还是不显示？

**可能原因**:
1. 文件名不对（必须是 `qr-code-home.png`）
2. 文件路径不对（必须在 `public/images/` 目录下）
3. 没有提交到 Git 并推送
4. Vercel 还在部署中（等待1-3分钟）
5. 浏览器缓存（按 Ctrl+Shift+R 强制刷新）

**解决方法**:
```bash
# 检查文件是否存在
ls public/images/qr-code-home.png

# 检查 Git 状态
git status

# 如果文件显示为 "Untracked" 或 "Modified"，需要提交
git add public/images/qr-code-home.png
git commit -m "添加二维码图片"
git push
```

---

### Q2: 图片太大或太小怎么办？

**调整尺寸**:

使用图片编辑工具（如 Photoshop、GIMP、或在线工具）调整为：
- 桌面端: 240x240 像素
- 移动端: 200x200 像素

或者修改 CSS 中的尺寸（不推荐，可能导致模糊）。

---

### Q3: 可以使用 JPG 格式吗？

可以，但需要修改代码：

1. 将文件重命名为 `qr-code-home.jpg`
2. 修改 `app/gift/page.tsx` 中的文件名
3. PNG 格式更推荐（支持透明背景，文件更小）

---

## 📞 需要帮助？

如果按照以上步骤操作后仍然有问题，请提供：

1. 文件是否存在的截图
2. Git 状态截图 (`git status`)
3. 浏览器控制台的错误信息
4. Vercel 部署日志

---

## ✨ 完成后的效果

- ✅ 二维码清晰显示
- ✅ 白色背景，圆角卡片
- ✅ 悬停时有放大效果
- ✅ 移动端自适应
- ✅ 扫描后跳转到 `https://www.brand-new.ltd/`

---

**祝你顺利添加二维码！** 🎁

