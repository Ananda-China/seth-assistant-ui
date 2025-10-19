# 🚀 快速开始指南

## 📋 问题修复概览

本次修复了4个问题：
1. ✅ 个人中心购买指引增加次卡套餐
2. ✅ 管理后台激活码管理增加次卡套餐
3. ✅ 新手引导被聊天窗口遮挡
4. ✅ 新用户注册后免费次数为0

## ⚡ 快速执行步骤

### 步骤1: 执行数据库SQL（必须）

**打开Supabase Dashboard → SQL Editor，复制粘贴以下SQL并执行：**

```sql
-- 1. 修改plans表schema
ALTER TABLE plans ALTER COLUMN duration_days DROP NOT NULL;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS chat_limit INTEGER;

-- 2. 更新users表CHECK约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_type_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_type_check
  CHECK (subscription_type IN ('free', 'monthly', 'quarterly', 'yearly', 'times'));

-- 3. 插入次卡套餐
INSERT INTO plans (name, price, duration_days, chat_limit, description, is_active) 
VALUES ('次卡', 3990, NULL, 50, '次卡，享受50次AI助手服务，不限制时间', true)
ON CONFLICT (name) DO UPDATE SET 
  price = 3990,
  duration_days = NULL,
  chat_limit = 50,
  description = '次卡，享受50次AI助手服务，不限制时间',
  is_active = true;

-- 4. 更新月卡价格
UPDATE plans SET price = 89900 WHERE name = '月套餐';

-- 5. 修复用户chat_count
UPDATE users SET chat_count = 0 WHERE chat_count IS NULL;

-- 6. 验证结果
SELECT name, price / 100.0 as price_yuan, duration_days, chat_limit, is_active
FROM plans ORDER BY price;
```

### 步骤2: 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm run dev
```

### 步骤3: 测试验证

#### 测试1: 管理后台（1分钟）
1. 访问 http://localhost:3002/admin/activation
2. 查看"选择套餐"下拉框
3. ✅ 应该看到：次卡、月套餐、年套餐

#### 测试2: 新手引导（1分钟）
1. 新用户登录或清除localStorage
2. 查看新手引导弹窗
3. ✅ 应该不被聊天输入框遮挡
4. ✅ 可以正常点击"下一步"和"跳过"

#### 测试3: 购买指引（1分钟）
1. 在新手引导中进入"购买激活码"步骤
2. ✅ 应该看到3个套餐：次卡¥39.9、月套餐¥899、年套餐¥3999

#### 测试4: 新用户免费次数（2分钟）
1. 注册新用户（例如：17301807380）
2. 登录后查看个人中心
3. ✅ 应该显示"剩余5次免费使用"
4. 发送一条消息
5. ✅ 剩余次数应该变为4次

### 步骤4: Git提交

```bash
git config user.email "anandali1016@gmail.com"
git config user.name "Ananda-China"
git add .
git commit -m "修复: 添加次卡套餐、修复新手引导层级、修复新用户免费次数"
git push
```

## 📊 验证清单

- [ ] 数据库SQL执行成功
- [ ] 开发服务器重启成功
- [ ] 管理后台可以看到次卡选项
- [ ] 新手引导不被遮挡
- [ ] 购买指引显示3个套餐
- [ ] 新用户免费次数正常
- [ ] Git提交成功

## 🔍 常见问题

### Q1: SQL执行报错
**A**: 某些错误是正常的（如"constraint does not exist"），继续执行即可。

### Q2: 管理后台看不到次卡
**A**: 
1. 确认SQL执行成功
2. 刷新浏览器页面
3. 检查浏览器控制台是否有错误

### Q3: 新用户免费次数还是0
**A**: 
1. 确认执行了 `UPDATE users SET chat_count = 0 WHERE chat_count IS NULL;`
2. 检查特定用户：
```sql
SELECT phone, chat_count FROM users WHERE phone = '17301807380';
```

### Q4: 新手引导还是被遮挡
**A**: 
1. 清除浏览器缓存
2. 重启开发服务器
3. 使用无痕模式测试

## 📞 需要帮助？

查看详细文档：
- **FINAL_FIX_SUMMARY.md** - 完整修复总结
- **MANUAL_SQL_STEPS.md** - 详细SQL执行步骤
- **FIX_SUMMARY.md** - 问题修复详情

## ✨ 完成！

所有步骤完成后，系统应该：
- ✅ 支持次卡套餐（¥39.9，50次聊天）
- ✅ 新手引导正常显示
- ✅ 新用户有5次免费聊天

---

**预计总时间**: 10分钟
**难度**: 简单
**状态**: 准备执行

