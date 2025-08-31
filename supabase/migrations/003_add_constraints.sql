-- 第三步：添加外键约束和检查约束

-- 添加外键约束
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_user_phone 
FOREIGN KEY (user_phone) REFERENCES users(phone) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user_phone 
FOREIGN KEY (user_phone) REFERENCES users(phone) ON DELETE CASCADE;

ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_user_phone 
FOREIGN KEY (user_phone) REFERENCES users(phone) ON DELETE CASCADE;

-- 添加检查约束
ALTER TABLE users 
ADD CONSTRAINT check_subscription_type 
CHECK (subscription_type IN ('free', 'monthly', 'quarterly', 'yearly'));

ALTER TABLE users 
ADD CONSTRAINT check_status 
CHECK (status IN ('active', 'suspended'));

ALTER TABLE messages 
ADD CONSTRAINT check_role 
CHECK (role IN ('user', 'assistant', 'system'));

ALTER TABLE orders 
ADD CONSTRAINT check_order_status 
CHECK (status IN ('pending', 'success', 'failed'));

ALTER TABLE subscriptions 
ADD CONSTRAINT check_subscription_status 
CHECK (status IN ('active', 'expired', 'cancelled'));

-- 添加唯一约束
ALTER TABLE subscriptions 
ADD CONSTRAINT unique_active_subscription 
UNIQUE (user_phone, status);
