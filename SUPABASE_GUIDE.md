# 🚀 Supabase配置和维护指南

## ✅ **当前配置状态**

您的Supabase配置已经完成：
- **项目URL**: ✅ https://izgcguglvapifyngudcu.supabase.co
- **匿名密钥**: ✅ 已配置
- **服务角色密钥**: ✅ 已配置
- **数据库模式**: ✅ 已切换到Supabase

## 🔧 **Supabase配置检查**

### 1. 环境变量验证
```bash
# 检查环境变量是否正确加载
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://izgcguglvapifyngudcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 数据库连接测试
运行以下命令测试数据库连接：
```bash
npm run test:supabase
```

## 🗄️ **数据库表结构**

根据您的迁移文件，应该包含以下表：

### 核心表
- **users** - 用户信息表
- **conversations** - 对话表
- **messages** - 消息表
- **orders** - 订单表
- **subscriptions** - 订阅表
- **admins** - 管理员表

### 表关系
- users ↔ conversations (一对多)
- conversations ↔ messages (一对多)
- users ↔ orders (一对多)
- users ↔ subscriptions (一对多)

## 🛠️ **Supabase日常维护**

### 1. **数据库监控**

#### 访问Supabase Dashboard
- 网址：https://supabase.com/dashboard
- 选择您的项目：`izgcguglvapifyngudcu`

#### 监控指标
- **数据库性能**: 查询响应时间、连接数
- **存储使用**: 数据库大小、文件存储
- **API使用**: 请求数量、错误率
- **实时连接**: WebSocket连接状态

### 2. **数据备份**

#### 自动备份
- Supabase提供**每日自动备份**
- 备份保留**7天**
- 可在Dashboard中查看备份状态

#### 手动备份
```sql
-- 导出用户数据
SELECT * FROM users;

-- 导出对话数据
SELECT * FROM conversations;

-- 导出订单数据
SELECT * FROM orders;
```

### 3. **性能优化**

#### 索引管理
```sql
-- 检查现有索引
SELECT * FROM pg_indexes WHERE tablename = 'users';

-- 创建性能索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_conversations_user_phone ON conversations(user_phone);
CREATE INDEX idx_orders_user_phone ON orders(user_phone);
```

#### 查询优化
```sql
-- 使用EXPLAIN分析查询性能
EXPLAIN SELECT * FROM users WHERE phone = '13800138000';

-- 避免SELECT *，只选择需要的字段
SELECT id, phone, nickname FROM users WHERE phone = '13800138000';
```

### 4. **安全维护**

#### 行级安全策略 (RLS)
```sql
-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = phone);

CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid()::text = user_phone);
```

#### API密钥轮换
- 定期更换 `SUPABASE_SERVICE_ROLE_KEY`
- 监控API使用情况
- 设置API使用限制

### 5. **数据清理**

#### 定期清理
```sql
-- 清理过期数据
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM conversations WHERE updated_at < NOW() - INTERVAL '90 days';

-- 清理失败订单
DELETE FROM orders WHERE status = 'failed' AND created_at < NOW() - INTERVAL '30 days';
```

#### 数据归档
- 将旧数据移动到归档表
- 压缩历史数据
- 设置数据保留策略

## 📊 **监控和告警**

### 1. **设置告警**
- 数据库连接数超过阈值
- 存储使用超过80%
- API错误率超过5%
- 查询响应时间过长

### 2. **日志分析**
- 查看SQL查询日志
- 分析慢查询
- 监控用户行为

## 🔄 **数据迁移和维护脚本**

### 1. **数据迁移**
```bash
# 运行数据库迁移
npm run migrate

# 回滚迁移
npm run migrate:rollback
```

### 2. **数据同步**
```bash
# 从本地文件同步到Supabase
npm run sync:to-supabase

# 从Supabase同步到本地
npm run sync:from-supabase
```

## 🚨 **常见问题和解决方案**

### 1. **连接超时**
```bash
# 检查网络连接
ping izgcguglvapifyngudcu.supabase.co

# 检查防火墙设置
# 确保443端口开放
```

### 2. **权限错误**
```sql
-- 检查用户权限
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'anon' OR grantee = 'authenticated';
```

### 3. **性能问题**
```sql
-- 检查慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 📈 **扩展建议**

### 1. **功能扩展**
- 添加全文搜索
- 实现数据缓存
- 添加数据分析功能

### 2. **性能提升**
- 使用连接池
- 实现读写分离
- 添加CDN加速

## 🎯 **下一步行动**

1. **测试数据库连接** ✅
2. **验证表结构** ✅
3. **设置监控告警** 🔄
4. **优化查询性能** 🔄
5. **实施安全策略** 🔄

---

**总结：您的Supabase配置已经完成，现在可以开始使用数据库功能了！记得定期监控和维护数据库性能。** 🚀
