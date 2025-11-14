-- 更新管理员密码哈希
-- 删除旧的默认管理员账户
DELETE FROM admins WHERE username = 'admin';

-- 插入新的管理员账户，使用bcrypt哈希
-- 默认密码: AdminPass123! (请在首次登录后立即修改)
-- bcrypt哈希值是使用 bcryptjs.hash('AdminPass123!', 12) 生成的
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2b$12$hpN2yaecdgBDsYXWy14jzuAJFbsLpQgHPqcCufV1QqKTKbryWwEC.');

-- 添加注释说明
COMMENT ON TABLE admins IS '管理员账户表，密码使用bcrypt哈希存储';
COMMENT ON COLUMN admins.password_hash IS 'bcrypt哈希密码，默认密码为AdminPass123!，请首次登录后立即修改';
