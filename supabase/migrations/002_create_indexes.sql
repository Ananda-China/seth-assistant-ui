-- 第二步：创建索引

-- 用户表索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_invite_code ON users(invite_code);
CREATE INDEX idx_users_invited_by ON users(invited_by);

-- 对话表索引
CREATE INDEX idx_conversations_user_phone ON conversations(user_phone);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- 消息表索引
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- 订单表索引
CREATE INDEX idx_orders_user_phone ON orders(user_phone);
CREATE INDEX idx_orders_out_trade_no ON orders(out_trade_no);
CREATE INDEX idx_orders_status ON orders(status);

-- 订阅表索引
CREATE INDEX idx_subscriptions_user_phone ON subscriptions(user_phone);
