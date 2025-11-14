-- 添加 token_usage 字段到 messages 表
ALTER TABLE messages ADD COLUMN IF NOT EXISTS token_usage INTEGER DEFAULT 0;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_token_usage ON messages(token_usage);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_phone ON conversations(user_phone);

-- 更新现有消息的 token_usage（可选，为历史数据设置默认值）
UPDATE messages SET token_usage = 0 WHERE token_usage IS NULL;
