-- 添加二维码类型字段
-- 创建时间: 2025-10-26

-- 1. 添加 type 字段到 qr_codes 表
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'customer';

-- 2. 添加类型检查约束
ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_type_check 
  CHECK (type IN ('customer', 'payment'));

-- 3. 更新现有数据为客服类型
UPDATE qr_codes SET type = 'customer' WHERE type IS NULL;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON qr_codes(type);

-- 5. 添加注释
COMMENT ON COLUMN qr_codes.type IS '二维码类型：customer=客服二维码, payment=收款二维码';

