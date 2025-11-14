-- 激活码系统数据库迁移
-- 创建时间: 2024-01-26

-- 1. 套餐表
CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- 如：月套餐, 年套餐
  price INTEGER NOT NULL, -- 价格（分）
  duration_days INTEGER NOT NULL, -- 套餐有效期天数
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 激活码表
CREATE TABLE activation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL, -- 激活码字符串
  plan_id UUID NOT NULL REFERENCES plans(id),
  is_used BOOLEAN DEFAULT false,
  used_by_user_id UUID REFERENCES users(id),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 激活码有效期
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 用户余额表
CREATE TABLE balances (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  amount INTEGER DEFAULT 0, -- 余额（分）
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 佣金记录表
CREATE TABLE commission_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_user_id UUID NOT NULL REFERENCES users(id),
  invited_user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  commission_amount INTEGER NOT NULL, -- 佣金金额（分）
  commission_percentage DECIMAL(5,2) NOT NULL, -- 返佣比例
  level INTEGER NOT NULL, -- 邀请层级：0为直接邀请，1为二级邀请
  activation_code_id UUID REFERENCES activation_codes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 提现申请表
CREATE TABLE withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL, -- 提现金额（分）
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('alipay', 'wechat')),
  account_info TEXT NOT NULL, -- 收款账号信息
  processed_by_admin_id UUID REFERENCES admins(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  transfer_screenshot_url TEXT, -- 转账截图URL
  rejection_reason TEXT, -- 拒绝原因
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 修改现有orders表，添加激活码相关字段
ALTER TABLE orders ADD COLUMN activation_code_id UUID REFERENCES activation_codes(id);
ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'payment' CHECK (order_type IN ('payment', 'activation'));

-- 7. 修改现有subscriptions表，添加激活码相关字段
ALTER TABLE subscriptions ADD COLUMN activation_code_id UUID REFERENCES activation_codes(id);
ALTER TABLE subscriptions ADD COLUMN subscription_type VARCHAR(20) DEFAULT 'payment' CHECK (subscription_type IN ('payment', 'activation'));

-- 创建索引
CREATE INDEX idx_activation_codes_code ON activation_codes(code);
CREATE INDEX idx_activation_codes_plan_id ON activation_codes(plan_id);
CREATE INDEX idx_activation_codes_is_used ON activation_codes(is_used);
CREATE INDEX idx_activation_codes_expires_at ON activation_codes(expires_at);

CREATE INDEX idx_balances_user_id ON balances(user_id);

CREATE INDEX idx_commission_records_inviter ON commission_records(inviter_user_id);
CREATE INDEX idx_commission_records_invited ON commission_records(invited_user_id);
CREATE INDEX idx_commission_records_created_at ON commission_records(created_at DESC);

CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

-- 创建更新时间触发器
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activation_codes_updated_at BEFORE UPDATE ON activation_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认套餐数据
INSERT INTO plans (name, price, duration_days, description) VALUES
('次卡', 3990, NULL, '次卡，享受50次AI助手服务，不限制时间'),
('月套餐', 89900, 30, '月度会员，享受30天无限制AI助手服务'),
('年套餐', 399900, 365, '年度会员，享受365天无限制AI助手服务')
ON CONFLICT (name) DO NOTHING;

-- 创建 RLS 策略
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的余额和提现申请
CREATE POLICY "Users can view own balance" ON balances FOR SELECT USING (user_id = (SELECT id FROM users WHERE phone = current_setting('app.current_user_phone', true)));
CREATE POLICY "Users can update own balance" ON balances FOR UPDATE USING (user_id = (SELECT id FROM users WHERE phone = current_setting('app.current_user_phone', true)));

CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests FOR SELECT USING (user_id = (SELECT id FROM users WHERE phone = current_setting('app.current_user_phone', true)));
CREATE POLICY "Users can create own withdrawal requests" ON withdrawal_requests FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE phone = current_setting('app.current_user_phone', true)));

-- 用户只能查看自己的佣金记录
CREATE POLICY "Users can view own commission records" ON commission_records FOR SELECT USING (
  inviter_user_id = (SELECT id FROM users WHERE phone = current_setting('app.current_user_phone', true))
);

-- 套餐和激活码对所有用户可见（用于激活）
CREATE POLICY "Plans are viewable by all" ON plans FOR SELECT USING (true);
CREATE POLICY "Activation codes are viewable by all" ON activation_codes FOR SELECT USING (true);
CREATE POLICY "Activation codes can be updated by all" ON activation_codes FOR UPDATE USING (true);

-- 管理员可以访问所有数据
CREATE POLICY "Admins can access all data" ON plans FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = current_setting('app.current_admin', true))
);
CREATE POLICY "Admins can access all activation codes" ON activation_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = current_setting('app.current_admin', true))
);
CREATE POLICY "Admins can access all balances" ON balances FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = current_setting('app.current_admin', true))
);
CREATE POLICY "Admins can access all commission records" ON commission_records FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = current_setting('app.current_admin', true))
);
CREATE POLICY "Admins can access all withdrawal requests" ON withdrawal_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE username = current_setting('app.current_admin', true))
);
