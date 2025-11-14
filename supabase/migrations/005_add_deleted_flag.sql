-- 为conversations表添加删除标记
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 为messages表添加删除标记
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_deleted ON conversations(is_deleted, deleted_at);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(is_deleted, deleted_at);

-- 添加注释
COMMENT ON COLUMN conversations.deleted_at IS '删除时间';
COMMENT ON COLUMN conversations.is_deleted IS '是否已删除';
COMMENT ON COLUMN messages.deleted_at IS '删除时间';
COMMENT ON COLUMN messages.is_deleted IS '是否已删除';
