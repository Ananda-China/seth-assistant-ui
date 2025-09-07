-- 修复orders表plan_id字段长度限制问题
-- 创建时间: 2024-01-26

-- 将orders表的plan_id字段从VARCHAR(20)改为VARCHAR(50)
-- 这样可以存储UUID格式的plan_id（36个字符）
ALTER TABLE orders ALTER COLUMN plan_id TYPE VARCHAR(50);

-- 添加注释说明
COMMENT ON COLUMN orders.plan_id IS '套餐ID，支持UUID格式（36字符）或短格式ID';
