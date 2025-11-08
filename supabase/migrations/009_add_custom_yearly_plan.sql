-- 添加定制年卡套餐
-- 创建时间: 2025-11-08
-- 用途: 为定制化客户提供专属年卡套餐（10000元/年）

-- 插入定制年卡套餐
INSERT INTO plans (name, price, duration_days, description, is_active) 
VALUES ('定制年卡', 1000000, 365, '定制年卡，享受365天专属定制化AI助手服务', true)
ON CONFLICT (name) DO UPDATE SET 
  price = 1000000,
  duration_days = 365,
  description = '定制年卡，享受365天专属定制化AI助手服务',
  is_active = true;

-- 验证套餐列表
-- 执行后应该看到4个套餐：
-- 1. 次卡 - ¥39.90 (不限时，50次)
-- 2. 月套餐 - ¥899.00 (30天)
-- 3. 年套餐 - ¥3999.00 (365天)
-- 4. 定制年卡 - ¥10000.00 (365天)

