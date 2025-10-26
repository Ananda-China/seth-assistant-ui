# Coze AI 客服集成说明

## 功能说明

已在聊天页面（首页）集成 Coze AI 客服，用户可以在页面右下角看到客服窗口并咨询问题。

## 技术实现

### 1. 组件位置
- **组件文件**: `components/CozeCustomerService.tsx`
- **使用位置**: `app/page.tsx` (聊天页面)

### 2. Coze SDK 配置

```javascript
{
  config: {
    bot_id: '7562450475955191851',
  },
  componentProps: {
    title: 'AI客服',
  },
  auth: {
    type: 'token',
    token: 'pat_7v0CEQ26r2DU6wGuW4xgQSsWdOuILIo7aqGZJZIlVjeC2bbjYNHSd2VAdq5FKU86',
    onRefreshToken: function () {
      return 'pat_7v0CEQ26r2DU6wGuW4xgQSsWdOuILIo7aqGZJZIlVjeC2bbjYNHSd2VAdq5FKU86';
    }
  }
}
```

### 3. SDK 版本
- **CDN**: `https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.10/libs/cn/index.js`
- **版本**: `1.2.0-beta.10`

## 使用方式

### 用户端
1. 打开聊天页面（首页）
2. 在页面右下角会自动显示 Coze 客服窗口
3. 点击窗口即可与 AI 客服对话
4. 可以咨询关于产品、功能、使用等问题

### 管理员端
如需修改客服配置，请编辑 `components/CozeCustomerService.tsx` 文件：

```typescript
// 修改 bot_id
bot_id: '你的新bot_id',

// 修改标题
title: '你的客服标题',

// 修改 token
token: '你的新token',
```

## 注意事项

1. **Token 安全性**: 
   - 当前 token 是硬编码在前端代码中
   - 建议将 token 存储在环境变量中（`.env.local`）
   - 或者使用后端 API 代理请求

2. **SDK 加载**:
   - SDK 通过 CDN 加载，首次访问可能需要几秒钟
   - 加载完成后会在控制台输出 `✅ Coze SDK 加载完成`
   - 初始化成功后会输出 `✅ Coze 客服初始化成功`

3. **兼容性**:
   - 支持所有现代浏览器
   - 移动端也可以正常使用

## 调试

如果客服窗口没有显示，请检查：

1. **浏览器控制台**（F12）查看是否有错误信息
2. **网络请求**：确认 Coze SDK 是否成功加载
3. **Token 有效性**：确认 token 是否过期或无效
4. **Bot ID**：确认 bot_id 是否正确

## 未来优化建议

1. **环境变量配置**:
   ```env
   NEXT_PUBLIC_COZE_BOT_ID=7562450475955191851
   NEXT_PUBLIC_COZE_TOKEN=pat_7v0CEQ26r2DU6wGuW4xgQSsWdOuILIo7aqGZJZIlVjeC2bbjYNHSd2VAdq5FKU86
   ```

2. **后端代理**:
   - 创建 API 路由 `/api/coze/token`
   - 在后端获取和刷新 token
   - 前端通过 API 获取 token

3. **自定义样式**:
   - 可以通过 CSS 自定义客服窗口的样式
   - 可以添加自定义的打开/关闭按钮

4. **多页面支持**:
   - 如需在其他页面也显示客服，可以将组件添加到 `app/layout.tsx`
   - 这样所有页面都会显示客服窗口

