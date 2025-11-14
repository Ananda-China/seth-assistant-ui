# 手动执行SQL步骤

由于Supabase的限制，需要手动在Supabase Dashboard中执行以下SQL语句。

## 步骤1: 打开Supabase Dashboard

1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"

## 步骤2: 执行以下SQL

### SQL 1: 修改plans表schema

```sql
-- 允许duration_days为NULL（用于次卡，不限制时间）
ALTER TABLE plans ALTER COLUMN duration_days DROP NOT NULL;

-- 添加chat_limit字段（用于次卡的聊天次数限制）
ALTER TABLE plans ADD COLUMN IF NOT EXISTS chat_limit INTEGER;
```

### SQL 2: 更新users表的CHECK约束

```sql
-- 删除旧的CHECK约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_type_check;

-- 添加新的CHECK约束，包含'times'类型
ALTER TABLE users ADD CONSTRAINT users_subscription_type_check
  CHECK (subscription_type IN ('free', 'monthly', 'quarterly', 'yearly', 'times'));
```

### SQL 3: 插入次卡套餐

```sql
-- 插入次卡套餐
INSERT INTO plans (name, price, duration_days, chat_limit, description, is_active) 
VALUES ('次卡', 3990, NULL, 50, '次卡，享受50次AI助手服务，不限制时间', true)
ON CONFLICT (name) DO UPDATE SET 
  price = 3990,
  duration_days = NULL,
  chat_limit = 50,
  description = '次卡，享受50次AI助手服务，不限制时间',
  is_active = true;

-- 更新月套餐价格为899元
UPDATE plans SET price = 89900 WHERE name = '月套餐';

-- 确认年套餐价格为3999元
UPDATE plans SET price = 399900 WHERE name = '年套餐';
```

### SQL 4: 验证结果

```sql
-- 查看所有套餐
SELECT 
  name,
  price / 100.0 as price_yuan,
  duration_days,
  chat_limit,
  description,
  is_active
FROM plans
ORDER BY price;
```

## 步骤3: 验证结果

执行完成后，你应该看到3个套餐：

| 名称 | 价格(元) | 时长(天) | 聊天次数 | 描述 | 状态 |
|------|---------|---------|---------|------|------|
| 次卡 | 39.9 | NULL | 50 | 次卡，享受50次AI助手服务，不限制时间 | 启用 |
| 月套餐 | 899 | 30 | NULL | 月度会员，享受30天无限制AI助手服务 | 启用 |
| 年套餐 | 3999 | 365 | NULL | 年度会员，享受365天无限制AI助手服务 | 启用 |

## 步骤4: 修复用户chat_count（如果需要）

如果发现新用户的chat_count为NULL，执行以下SQL：

```sql
-- 查找chat_count为NULL的用户
SELECT phone, chat_count, subscription_type, created_at
FROM users
WHERE chat_count IS NULL
ORDER BY created_at DESC;

-- 修复chat_count为NULL的用户
UPDATE users
SET chat_count = 0
WHERE chat_count IS NULL;

-- 验证修复结果
SELECT phone, chat_count, subscription_type, created_at
FROM users
WHERE subscription_type = 'free'
ORDER BY created_at DESC
LIMIT 10;
```

## 步骤5: 检查特定用户

如果需要检查特定用户（例如17301807380）：

```sql
-- 查看用户详情
SELECT 
  phone,
  nickname,
  subscription_type,
  chat_count,
  trial_start,
  trial_end,
  created_at
FROM users
WHERE phone = '17301807380';

-- 如果chat_count为NULL，修复它
UPDATE users
SET chat_count = 0
WHERE phone = '17301807380' AND chat_count IS NULL;
```

## 常见问题

### Q1: 执行SQL时报错 "constraint does not exist"
**A**: 这是正常的，说明约束已经不存在了，可以继续执行后续SQL。

### Q2: 次卡套餐已存在
**A**: 使用 `ON CONFLICT` 语句会自动更新现有套餐，不会报错。

### Q3: 如何删除次卡套餐
**A**: 执行以下SQL：
```sql
DELETE FROM plans WHERE name = '次卡';
```

## 完成后

执行完所有SQL后：

1. 刷新管理后台页面
2. 在激活码管理中应该能看到次卡选项
3. 可以生成次卡激活码
4. 新用户的免费次数应该正常显示

---

**注意**: 这些SQL语句是幂等的，可以多次执行而不会出错。

