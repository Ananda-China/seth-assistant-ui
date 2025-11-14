# Dify 性能优化代码实现

## 第一步：修正API URL配置

### 修改 `.env.local`

**当前配置**（错误）：
```env
DIFY_API_URL=https://api.dify.ai/v1
```

**修改为**（选择一个）：

**选项1：使用本地Dify服务器（推荐）**
```env
# 如果Dify在同一个腾讯云服务器上
DIFY_API_URL=http://localhost:8001/v1

# 或使用服务器IP
DIFY_API_URL=http://your-server-ip:8001/v1

# 或使用域名
DIFY_API_URL=https://dify.your-domain.com/v1
```

**选项2：保留官方API作为备用**
```env
DIFY_API_URL=http://localhost:8001/v1
DIFY_API_FALLBACK_URL=https://api.dify.ai/v1
```

---

## 第二步：优化后端API代码

### 修改 `app/api/chat/route.ts`

在第124行之前添加以下代码：

```typescript
// ============ 性能优化：添加重试和超时机制 ============

const MAX_RETRIES = 2;
const CONNECT_TIMEOUT = 10000; // 10秒连接超时
const TOTAL_TIMEOUT = 60000; // 60秒总超时
const RETRY_DELAY = 1000; // 重试延迟

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Dify请求 (尝试 ${attempt + 1}/${retries + 1})`);
      
      const controller = new AbortController();
      const connectTimeoutId = setTimeout(() => {
        controller.abort();
      }, CONNECT_TIMEOUT);

      const startTime = Date.now();
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(connectTimeoutId);
      const connectTime = Date.now() - startTime;
      
      console.log(`⏱️ Dify连接时间: ${connectTime}ms`);

      if (response.ok) {
        return response;
      }

      lastError = new Error(`Dify返回 ${response.status}`);
      console.warn(`⚠️ 第 ${attempt + 1} 次尝试失败: ${lastError.message}`);

    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ 第 ${attempt + 1} 次尝试异常:`, lastError.message);

      if (attempt < retries) {
        const delayMs = RETRY_DELAY * (attempt + 1);
        console.log(`⏳ 等待 ${delayMs}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Dify请求失败');
}

// ============ 性能优化：添加性能监控 ============

function createPerformanceMonitor() {
  const startTime = Date.now();
  let chunkCount = 0;
  let lastChunkTime = startTime;

  return {
    recordChunk() {
      chunkCount++;
      const now = Date.now();
      const timeSinceLastChunk = now - lastChunkTime;

      if (chunkCount % 10 === 0) {
        const elapsed = now - startTime;
        console.log(
          `📊 进度: ${chunkCount} chunks, ` +
          `总耗时: ${elapsed}ms, ` +
          `最后chunk耗时: ${timeSinceLastChunk}ms`
        );
      }

      lastChunkTime = now;
    },

    finish() {
      const totalTime = Date.now() - startTime;
      console.log(
        `✅ 完整请求耗时: ${totalTime}ms ` +
        `(${chunkCount} chunks, ` +
        `平均: ${(totalTime / chunkCount).toFixed(2)}ms/chunk)`
      );
      return totalTime;
    }
  };
}
```

### 修改第124行的fetch调用

**原代码**：
```typescript
const difyRes = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${DIFY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inputs: {},
    query,
    response_mode: 'streaming',
    user: 'anonymous',
    conversation_id: difyConversationId || undefined,
    auto_generate_name: false,
  }),
  signal: AbortSignal.timeout(120000),
});
```

**修改为**：
```typescript
const difyRes = await fetchWithRetry(
  apiUrl,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'streaming',
      user: 'anonymous',
      conversation_id: difyConversationId || undefined,
      auto_generate_name: false,
    }),
    signal: AbortSignal.timeout(TOTAL_TIMEOUT),
  },
  MAX_RETRIES
);
```

### 在流式处理中添加性能监控

**在第150行之后添加**：
```typescript
const monitor = createPerformanceMonitor();
```

**在第165行（while循环内）添加**：
```typescript
while (true) {
  const { value, done } = await reader.read();
  if (done) {
    monitor.finish();  // 添加这行
    break;
  }

  monitor.recordChunk();  // 添加这行

  // ... 其他代码 ...
}
```

---

## 第三步：前端超时提示（可选）

### 修改 `app/page.tsx` 第405行

**原代码**：
```typescript
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: userMsg.content,
    conversation_id: currentConvId,
    client_conversation_id: currentConvId,
  }),
});
```

**修改为**：
```typescript
// 添加超时提示
let timeoutWarningId: NodeJS.Timeout | null = null;
let hasShownTimeout = false;

const timeoutWarning = setTimeout(() => {
  if (!hasShownTimeout) {
    hasShownTimeout = true;
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'system',
      content: '⏳ AI正在思考中...（已等待10秒，请耐心等待）'
    }]);
  }
}, 10000);

try {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: userMsg.content,
      conversation_id: currentConvId,
      client_conversation_id: currentConvId,
    }),
  });

  clearTimeout(timeoutWarning);
  
  // ... 其他代码 ...
} catch (error) {
  clearTimeout(timeoutWarning);
  // ... 错误处理 ...
}
```

---

## 第四步：验证优化效果

### 创建诊断脚本 `api/debug/performance.ts`

```typescript
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const tests: Record<string, any> = {};

  // 测试本地Dify
  const localDifyUrl = process.env.DIFY_API_URL || 'http://localhost:8001/v1';
  tests.local_dify = await testLatency(localDifyUrl);

  // 测试官方API
  tests.official_api = await testLatency('https://api.dify.ai/v1');

  return Response.json(tests);
}

async function testLatency(url: string) {
  const start = Date.now();
  try {
    const response = await fetch(`${url}/status`, {
      signal: AbortSignal.timeout(5000)
    });
    const latency = Date.now() - start;
    return {
      status: response.status,
      latency: `${latency}ms`,
      ok: response.ok
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: `${Date.now() - start}ms`
    };
  }
}
```

### 访问诊断页面

```
http://localhost:3000/api/debug/performance
```

---

## 预期效果

### 优化前
```
连接时间: 5-10秒
流式处理: 15-20秒
总耗时: 20-30秒
```

### 优化后
```
连接时间: 0.5-1秒
流式处理: 1-3秒
总耗时: 2-5秒
改进: 4-10倍 ⭐⭐⭐⭐⭐
```

---

## 部署检查清单

- [ ] 确认本地Dify服务器地址
- [ ] 更新 `.env.local` 中的 `DIFY_API_URL`
- [ ] 添加重试和超时机制代码
- [ ] 添加性能监控代码
- [ ] 测试新的API连接
- [ ] 检查后端日志输出
- [ ] 部署到生产环境
- [ ] 监控性能改进

