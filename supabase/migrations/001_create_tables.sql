-- 第一步：创建基础表结构

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
  subscription_type VARCHAR(20) DEFAULT 'free',
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  
  -- 使用统计
  chat_count INTEGER DEFAULT 0,
  last_chat_date DATE DEFAULT CURRENT_DATE,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 对话表
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_phone VARCHAR(20) NOT NULL,
  title VARCHAR(200),
  dify_conversation_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 消息表
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  out_trade_no VARCHAR(100) UNIQUE NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  plan_id VARCHAR(20),
  amount_fen INTEGER NOT NULL,
  duration_days INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  
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
  user_phone VARCHAR(20) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  monthly_quota INTEGER,
  used_this_period INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理员表
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
