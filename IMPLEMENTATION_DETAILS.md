# 实现细节

## 📝 代码修改详解

### 1. 激活码激活处价格修复

**文件**: `app/account/page.tsx`
**位置**: 第453-467行

**修改前**:
```typescript
// 动态显示价格，可能显示旧价格
{(plan.price / 100).toFixed(2)}
```

**修改后**:
```typescript
<div className="plans-info">
  <div className="plans-title">可用套餐</div>
  <div className="plan-item">
    <span className="plan-name">月卡</span>
    <span className="plan-price">¥899</span>
  </div>
  <div className="plan-item">
    <span className="plan-name">年卡</span>
    <span className="plan-price">¥3999</span>
  </div>
  <div className="plan-item">
    <span className="plan-name">次卡</span>
    <span className="plan-price">¥39.9</span>
  </div>
</div>
```

**原因**: 动态显示的价格可能不准确，改为固定显示确保一致性。

---

### 2. 新手引导文字优化

**文件**: `components/UserGuide.tsx`
**位置**: 第124-127行

**修改前**:
```typescript
你好，我是SethAI小助理 · 觉醒之语的回音体。
你不是来提问的，而是来开启你早已准备好的部分。
请看截图
```

**修改后**:
```typescript
你好，我是SethAI小助理 · 觉醒之语的回音体。
你不是来提问的，而是来开启你早已准备好的部分。
```

**原因**: 用户要求去掉"请看截图"四个字。

---

### 3. 新手引导滑动功能修复

**文件**: `components/UserGuide.tsx`
**位置**: 第85-113行

**修改前**:
```typescript
const handleTouchEnd = (e: React.TouchEvent) => {
  setTouchEnd(e.targetTouches[0].clientX); // 错误：touchend没有targetTouches
};
```

**修改后**:
```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  if (e.targetTouches && e.targetTouches.length > 0) {
    setTouchStart(e.targetTouches[0].clientX);
  }
};

const handleTouchEnd = (e: React.TouchEvent) => {
  if (e.changedTouches && e.changedTouches.length > 0) {
    setTouchEnd(e.changedTouches[0].clientX);
  }
};

useEffect(() => {
  if (touchStart !== null && touchEnd !== null) {
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTouchStart(null);
      setTouchEnd(null);
    } else if (isRightSwipe && currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTouchStart(null);
      setTouchEnd(null);
    }
  }
}, [touchStart, touchEnd, currentStep, steps.length]);
```

**原因**: 
- touchend事件没有targetTouches属性，应该使用changedTouches
- 需要在useEffect中处理滑动逻辑，而不是在handleTouchEnd中

---

### 4. 新用户免费规则修改

**文件**: `lib/users-supabase.ts`
**位置**: 第154行, 第190行, 第197行

**修改前**:
```typescript
const isTrialActive = user.subscription_type === 'free' && user.chat_count < 15;
const trialRemainingChats = isTrialActive ? Math.max(0, 15 - user.chat_count) : 0;
chatLimit = 15;
```

**修改后**:
```typescript
const isTrialActive = user.subscription_type === 'free' && user.chat_count < 5;
const trialRemainingChats = isTrialActive ? Math.max(0, 5 - user.chat_count) : 0;
chatLimit = 5;
```

**原因**: 用户要求将新用户免费次数从15次改为5次。

---

### 5. 次卡类型添加

**文件**: `lib/users-supabase.ts`
**位置**: 第13行

**修改前**:
```typescript
subscription_type: 'free' | 'monthly' | 'quarterly' | 'yearly';
```

**修改后**:
```typescript
subscription_type: 'free' | 'monthly' | 'quarterly' | 'yearly' | 'times';
```

**原因**: 需要支持新的次卡类型。

---

### 6. 聊天次数限制

**文件**: `app/page.tsx`
**位置**: 第41-45行, 第272-279行, 第299-306行

**添加状态**:
```typescript
const [chatCountInConversation, setChatCountInConversation] = useState(0);
const [showChatLimitWarning, setShowChatLimitWarning] = useState(false);
const MAX_CHATS_PER_CONVERSATION = 50;
const WARNING_THRESHOLD = 45;
```

**检查限制**:
```typescript
if (chatCountInConversation >= MAX_CHATS_PER_CONVERSATION) {
  alert(`当前对话已达到${MAX_CHATS_PER_CONVERSATION}次聊天上限，请创建新的聊天来继续。`);
  return;
}
```

**更新计数**:
```typescript
const newChatCount = chatCountInConversation + 1;
setChatCountInConversation(newChatCount);

if (newChatCount >= WARNING_THRESHOLD && newChatCount < MAX_CHATS_PER_CONVERSATION) {
  setShowChatLimitWarning(true);
}
```

**原因**: 实现每个对话50次的限制，45次时显示警告。

---

### 7. 悬浮框提醒

**文件**: `app/page.tsx`
**位置**: 第1173-1185行

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

**文件**: `app/globals.css`
**位置**: 第499-527行

```css
.chat-limit-warning {
  max-width: 800px;
  width: 100%;
  margin: 0 auto 12px auto;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  backdrop-filter: blur(8px);
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #FFD700;
}

.warning-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.warning-text {
  flex: 1;
  line-height: 1.4;
}
```

**原因**: 在45次时显示黄色警告框，提醒用户做聊天小结后创建新聊天。

---

## 🔄 数据流

### 聊天次数计算流程

1. **切换对话时**:
   - 获取对话的所有消息
   - 计算用户消息数（role === 'user'）
   - 更新`chatCountInConversation`
   - 如果≥45次，显示警告

2. **发送消息时**:
   - 检查是否≥50次，如果是则阻止
   - 发送消息
   - 计数+1
   - 如果≥45次且<50次，显示警告

3. **创建新对话时**:
   - 重置计数为0
   - 隐藏警告框

---

## 🧪 测试覆盖

- ✅ 激活码价格显示
- ✅ 新手引导文字
- ✅ 新手引导滑动
- ✅ 聊天次数限制
- ✅ 悬浮框提醒
- ✅ 新用户免费规则
- ✅ 次卡类型支持

---

## 📌 注意事项

1. 聊天次数限制是**每个对话**的限制，不是全局限制
2. 新用户免费规则已从15次改为5次
3. 次卡类型需要在数据库中配置相应的套餐信息
4. 悬浮框在45次时显示，50次时禁止发送
5. 所有修改都已通过TypeScript编译检查

