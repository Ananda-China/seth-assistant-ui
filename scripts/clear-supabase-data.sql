-- 清除测试环境数据 (请在Supabase控制台执行)
-- 注意：这将删除所有用户数据，请确保这是测试环境！

-- 清除用户相关数据
DELETE FROM commission_records;
DELETE FROM activation_codes WHERE used_by IS NOT NULL;
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM users;

-- 重置序列（如果有的话）
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- 验证清理结果
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations  
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'activation_codes (used)', COUNT(*) FROM activation_codes WHERE used_by IS NOT NULL
UNION ALL
SELECT 'commission_records', COUNT(*) FROM commission_records;