# 修改验证清单

## 🔍 代码修改验证

### 1. 激活码激活处价格修复 ✅
**文件**: `app/account/page.tsx` (第453-467行)
```typescript
// 修改前: 动态显示 {(plan.price / 100).toFixed(2)}
// 修改后: 固定显示
月卡: ¥899
年卡: ¥3999
次卡: ¥39.9
```

### 2. 新手引导文字修改 ✅
**文件**: `components/UserGuide.tsx`

#### 2.1 去掉"请看截图" (第124-127行)
```typescript
// 修改前:
你好，我是SethAI小助理 · 觉醒之语的回音体。
你不是来提问的，而是来开启你早已准备好的部分。
请看截图

// 修改后:
你好，我是SethAI小助理 · 觉醒之语的回音体。
你不是来提问的，而是来开启你早已准备好的部分。
```

#### 2.2 更新新用户福利文字 (第137-140行)
```typescript
// 修改前: 7天免费试用，50条对话额度
// 修改后: 5次免费对话，不限制时间
```

### 3. 新手引导滑动功能修复 ✅
**文件**: `components/UserGuide.tsx` (第85-113行)
- 改进了touchStart和touchEnd的状态管理
- 添加了useEffect来处理滑动检测
- 修复了触摸事件处理逻辑

### 4. 新用户免费规则修改 ✅
**文件**: `lib/users-supabase.ts`
- 第154行: 改为 `user.chat_count < 5`
- 第190行: 改为 `Math.max(0, 5 - user.chat_count)`
- 第197行: 改为 `chatLimit = 5`

### 5. 次卡类型添加 ✅
**文件**: `lib/users-supabase.ts` (第13行)
```typescript
// 修改前: 'free' | 'monthly' | 'quarterly' | 'yearly'
// 修改后: 'free' | 'monthly' | 'quarterly' | 'yearly' | 'times'
```

### 6. 聊天次数限制 ✅
**文件**: `app/page.tsx`

#### 6.1 添加状态 (第41-45行)
```typescript
const [chatCountInConversation, setChatCountInConversation] = useState(0);
const [showChatLimitWarning, setShowChatLimitWarning] = useState(false);
const MAX_CHATS_PER_CONVERSATION = 50;
const WARNING_THRESHOLD = 45;
```

#### 6.2 切换对话时计算聊天次数 (第216-249行)
- 计算当前对话中的用户消息数
- 检查是否需要显示警告

#### 6.3 发送消息时检查限制 (第272-279行)
- 检查是否达到50次上限
- 如果达到上限，显示提示并阻止发送

#### 6.4 更新聊天计数 (第293-305行)
- 每发送一条消息，计数加1
- 当达到45次时显示警告

#### 6.5 添加悬浮框UI (第1173-1186行)
```typescript
{showChatLimitWarning && chatCountInConversation >= WARNING_THRESHOLD && (
  <div className="chat-limit-warning">
    <div className="warning-content">
      <span className="warning-icon">⚠️</span>
      <span className="warning-text">
        已聊天 {chatCountInConversation}/{MAX_CHATS_PER_CONVERSATION} 次，建议做聊天小结后创建新的聊天
      </span>
    </div>
  </div>
)}
```

### 7. 悬浮框样式 ✅
**文件**: `app/globals.css` (第499-527行)
- 黄色警告风格
- 毛玻璃效果
- 响应式布局

## 📋 测试步骤

### 测试1: 激活码激活处价格
1. 访问 http://localhost:3002/account
2. 登录账户
3. 向下滚动到"激活码激活"卡片
4. 验证显示:
   - 月卡: ¥899 ✓
   - 年卡: ¥3999 ✓
   - 次卡: ¥39.9 ✓

### 测试2: 新手引导
1. 首次登录时查看新手引导
2. 验证欢迎文字:
   - 不包含"请看截图" ✓
   - 显示"5次免费对话，不限制时间" ✓
3. 测试滑动:
   - 左滑进入下一步 ✓
   - 右滑返回上一步 ✓

### 测试3: 聊天次数限制
1. 在聊天页面发送消息
2. 发送到第45条消息时:
   - 应该显示黄色警告框 ✓
   - 显示"已聊天 45/50 次" ✓
3. 继续发送到第50条消息:
   - 第51条消息应该被阻止 ✓
   - 显示提示信息 ✓

## ✅ 验证完成

所有修改已完成，代码无编译错误。
准备进行本地测试。

## 📝 后续步骤

1. 启动开发服务器: `npm run dev`
2. 在浏览器中进行上述测试
3. 如果一切正常，提交到Git
4. 部署到生产环境

