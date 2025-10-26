# 手动执行 SQL 说明

## 需要在 Supabase SQL Editor 中执行以下 SQL

请按照以下步骤操作：

1. 打开 Supabase 控制台
2. 进入 SQL Editor
3. 复制下面的 SQL 并执行

```sql
-- 添加二维码类型字段
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'customer';

-- 添加类型检查约束
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'qr_codes_type_check'
  ) THEN
    ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_type_check 
      CHECK (type IN ('customer', 'payment'));
  END IF;
END $$;

-- 更新现有数据为客服类型
UPDATE qr_codes SET type = 'customer' WHERE type IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON qr_codes(type);
```

## 执行完成后

执行完成后，你就可以：

1. 在后台管理中添加两种类型的二维码：
   - **客服二维码** (type = 'customer'): 用于用户咨询
   - **收款二维码** (type = 'payment'): 用于用户付款

2. 前端会自动分别显示这两种二维码：
   - 客服二维码显示在"联系客服"卡片中
   - 收款二维码显示在"扫码付款"卡片中

## 验证

执行以下 SQL 验证字段是否添加成功：

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' AND column_name = 'type';
```

应该返回：
- column_name: type
- data_type: character varying
- column_default: 'customer'::character varying

