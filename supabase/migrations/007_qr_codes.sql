-- 创建二维码配置表
CREATE TABLE qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_qr_codes_is_active ON qr_codes(is_active);
CREATE INDEX idx_qr_codes_created_at ON qr_codes(created_at);

-- 插入默认的微信二维码配置示例
INSERT INTO qr_codes (name, url, description, is_active) VALUES 
('客服微信', 'https://via.placeholder.com/200x200?text=WeChat+QR', '用于用户咨询和购买激活码', true);

-- 添加RLS策略（如果需要）
-- ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
