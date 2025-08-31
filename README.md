# Seth Assistant · 本地预览入口

开发时，直接点击下面的链接即可预览（服务需先 `npm run dev` 启动）：

- 外部浏览器
  - 首页：http://localhost:3000/
  - 登录：http://localhost:3000/login
  - 支付：http://localhost:3000/pay

- 直接在 Cursor/VS Code 左侧内置预览（Simple Browser）
  - 首页（内置预览）：command:simpleBrowser.show?%5B%22http%3A%2F%2Flocalhost%3A3000%22%5D
  - 登录（内置预览）：command:simpleBrowser.show?%5B%22http%3A%2F%2Flocalhost%3A3000%2Flogin%22%5D
  - 支付（内置预览）：command:simpleBrowser.show?%5B%22http%3A%2F%2Flocalhost%3A3000%2Fpay%22%5D

提示：首次点击内置预览链接时，如果弹出“是否允许运行命令 URI”，请选择“允许”。
- Chat API（POST，仅供调试）：http://localhost:3000/api/chat

常用命令（Windows）：

```bash
npm run dev          # 启动开发服务器
npm run open         # 打开首页
npm run open:login   # 打开登录页
npm run open:pay     # 打开支付页
```


