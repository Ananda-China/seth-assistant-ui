-- 第四步：创建管理员账户

-- 插入默认管理员账户 (用户名: admin, 密码: admin123)
-- 密码哈希是通过 bcrypt 生成的 admin123 的哈希值
INSERT INTO admins (username, password_hash) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
