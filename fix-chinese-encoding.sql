-- 修复套餐名称中文编码问题
-- 执行时间: 2024-01-26

-- 更新套餐名称，修复中文编码问题
UPDATE plans SET 
  name = '月套餐',
  description = '月度会员，享受30天无限制AI助手服务'
WHERE id = '19699d89-2719-44e4-b4ca-10e3f6027d63';

UPDATE plans SET 
  name = '年套餐',
  description = '年度会员，享受365天无限制AI助手服务'
WHERE id = '8fbf6d63-d210-470e-b7e4-c6899495bbbc';

-- 验证更新结果
SELECT id, name, description FROM plans ORDER BY created_at;
