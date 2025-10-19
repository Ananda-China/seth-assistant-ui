-- 添加次卡订阅类型支持

-- 1. 删除旧的CHECK约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_type_check;

-- 2. 添加新的CHECK约束，包含'times'类型
ALTER TABLE users ADD CONSTRAINT users_subscription_type_check 
  CHECK (subscription_type IN ('free', 'monthly', 'quarterly', 'yearly', 'times'));

-- 3. 修改plans表，允许duration_days为NULL（次卡不限制时间）
ALTER TABLE plans ALTER COLUMN duration_days DROP NOT NULL;

-- 4. 添加chat_limit字段到plans表（用于次卡的聊天次数限制）
ALTER TABLE plans ADD COLUMN IF NOT EXISTS chat_limit INTEGER;

-- 5. 更新现有套餐数据
-- 次卡套餐
INSERT INTO plans (name, price, duration_days, chat_limit, description, is_active) 
VALUES ('次卡', 3990, NULL, 50, '次卡，享受50次AI助手服务，不限制时间', true)
ON CONFLICT (name) DO UPDATE SET 
  price = 3990,
  duration_days = NULL,
  chat_limit = 50,
  description = '次卡，享受50次AI助手服务，不限制时间',
  is_active = true;

-- 月套餐（更新价格为899元）
UPDATE plans SET price = 89900 WHERE name = '月套餐';

-- 年套餐（价格保持3999元）
UPDATE plans SET price = 399900 WHERE name = '年套餐';

-- 6. 确保新用户的chat_count默认为0
-- 这个已经在001_initial_schema.sql中设置了，这里只是确认
-- ALTER TABLE users ALTER COLUMN chat_count SET DEFAULT 0;

-- 7. 确保trial_end可以为NULL（不限制时间）
ALTER TABLE users ALTER COLUMN trial_end DROP NOT NULL;

