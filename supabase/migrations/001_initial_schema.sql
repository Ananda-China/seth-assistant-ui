-- 用户表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  invited_by VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 试用期和订阅相关
  trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'monthly', 'quarterly', 'yearly')),
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  
  -- 使用统计
  chat_count INTEGER DEFAULT 0,
  last_chat_date DATE DEFAULT CURRENT_DATE,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 对话表
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_phone VARCHAR(20) NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  title VARCHAR(200),
  dify_conversation_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 消息表
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  token_usage INTEGER DEFAULT 0, -- Token使用量
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  out_trade_no VARCHAR(100) UNIQUE NOT NULL,
  user_phone VARCHAR(20) NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  plan_id VARCHAR(20),
  amount_fen INTEGER NOT NULL,
  duration_days INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  
  -- 支付相关
  trade_no VARCHAR(100),
  zpay_status VARCHAR(20),
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

-- 订阅表
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_phone VARCHAR(20) NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  monthly_quota INTEGER,
  used_this_period INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_phone, status) -- 每个用户只能有一个活跃订阅
);

-- 管理员表
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_invite_code ON users(invite_code);
CREATE INDEX idx_users_invited_by ON users(invited_by);
CREATE INDEX idx_conversations_user_phone ON conversations(user_phone);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_orders_user_phone ON orders(user_phone);
CREATE INDEX idx_orders_out_trade_no ON orders(out_trade_no);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_subscriptions_user_phone ON subscriptions(user_phone);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认管理员账户 (用户名: admin, 密码: admin123)
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2b$10$K8gF7VQqQqQqQqQqQqQqQeK8gF7VQqQqQqQqQqQqQeK8gF7VQqQqQqQ');

-- 创建 RLS (Row Level Security) 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (phone = current_setting('app.current_user_phone', true));
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (phone = current_setting('app.current_user_phone', true));

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (user_phone = current_setting('app.current_user_phone', true));
CREATE POLICY "Users can create own conversations" ON conversations FOR INSERT WITH CHECK (user_phone = current_setting('app.current_user_phone', true));
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (user_phone = current_setting('app.current_user_phone', true));

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM conversations WHERE user_phone = current_setting('app.current_user_phone', true))
);
CREATE POLICY "Users can create own messages" ON messages FOR INSERT WITH CHECK (
  conversation_id IN (SELECT id FROM conversations WHERE user_phone = current_setting('app.current_user_phone', true))
);

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_phone = current_setting('app.current_user_phone', true));
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (user_phone = current_setting('app.current_user_phone', true));

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_phone = current_setting('app.current_user_phone', true));
