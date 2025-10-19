# 生产环境数据清理工具

## 📋 概述

本工具集用于在系统上线前清理所有测试数据，同时保留系统配置（管理员账号、套餐配置、客服二维码）。

## 🎯 使用场景

- ✅ 系统开发测试完成，准备正式上线
- ✅ 需要清理所有测试用户和聊天记录
- ✅ 需要验证新用户注册和15次免费聊天功能
- ✅ 需要测试邀请奖励功能（一级30%，二级10%）

## 📦 工具列表

### 1. `prepare-for-production.js` - 主脚本（推荐使用）

**功能：** 按照正确顺序执行完整的清理流程

**执行步骤：**
1. 备份当前所有业务数据
2. 清理业务数据
3. 验证系统配置

**使用方法：**
```bash
node scripts/prepare-for-production.js
```

**交互提示：**
- 第一次确认：输入 `YES` 开始流程
- 备份完成后：按回车继续
- 清理数据：需要输入 `YES` 和 `CONFIRM` 两次确认

---

### 2. `backup-business-data.js` - 数据备份脚本

**功能：** 备份所有业务数据到 JSON 文件

**备份内容：**
- 用户信息（users）
- 对话记录（conversations）
- 聊天消息（messages）
- 订单记录（orders）
- 订阅信息（subscriptions）
- 激活码（activation_codes）
- 用户余额（balances）
- 佣金记录（commission_records）
- 提现请求（withdrawal_requests）

**使用方法：**
```bash
node scripts/backup-business-data.js
```

**输出位置：** `backups/backup-YYYY-MM-DDTHH-MM-SS.json`

---

### 3. `clear-business-data.js` - 数据清理脚本

**功能：** 清理所有业务数据

**清理内容：**
- ✅ 用户信息（users）
- ✅ 对话记录（conversations）
- ✅ 聊天消息（messages）
- ✅ 订单记录（orders）
- ✅ 订阅信息（subscriptions）
- ✅ 激活码（activation_codes）
- ✅ 用户余额（balances）
- ✅ 佣金记录（commission_records）
- ✅ 提现请求（withdrawal_requests）

**保留内容：**
- 🔒 管理员账号（admins）
- 🔒 套餐配置（plans）
- 🔒 客服二维码（qr_codes）

**使用方法：**
```bash
node scripts/clear-business-data.js
```

**安全确认：**
- 第一次确认：输入 `YES`
- 第二次确认：输入 `CONFIRM`

---

### 4. `verify-system-config.js` - 系统验证脚本

**功能：** 验证清理后系统配置是否完整

**检查项：**
- ✅ 管理员账号是否存在
- ✅ 套餐配置是否存在
- ✅ 客服二维码是否存在
- ✅ 业务数据是否已清空
- ✅ 新用户注册功能是否正常

**使用方法：**
```bash
node scripts/verify-system-config.js
```

---

## 🚀 快速开始

### 方式一：使用主脚本（推荐）

```bash
# 一键执行完整流程
node scripts/prepare-for-production.js
```

### 方式二：手动执行各步骤

```bash
# 步骤1：备份数据
node scripts/backup-business-data.js

# 步骤2：清理数据
node scripts/clear-business-data.js

# 步骤3：验证配置
node scripts/verify-system-config.js
```

---

## ⚠️ 注意事项

### 执行前

1. **确认环境变量**
   - 确保 `.env.local` 文件存在
   - 确认 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 配置正确

2. **确认数据库连接**
   - 确保可以连接到 Supabase 数据库
   - 确认有足够的权限执行删除操作

3. **选择合适的时间**
   - 建议在非高峰时段执行
   - 确保没有用户正在使用系统

### 执行中

1. **仔细阅读提示**
   - 脚本会显示将要清理的数据量
   - 需要多次确认才能执行删除操作

2. **保存备份文件**
   - 备份文件保存在 `backups/` 目录
   - 建议将备份文件复制到安全位置

### 执行后

1. **验证系统配置**
   - 运行验证脚本确认配置完整
   - 检查管理员账号是否可以登录

2. **测试核心功能**
   - 测试新用户注册
   - 测试15次免费聊天
   - 测试邀请奖励功能

---

## 📊 清理数据统计示例

```
📊 清理前数据统计：
   users: 25 条记录
   conversations: 150 条记录
   messages: 3500 条记录
   orders: 10 条记录
   subscriptions: 5 条记录
   activation_codes: 100 条记录
   balances: 20 条记录
   commission_records: 30 条记录
   withdrawal_requests: 2 条记录

📊 清理后数据统计：
   users: 0 条记录
   conversations: 0 条记录
   messages: 0 条记录
   orders: 0 条记录
   subscriptions: 0 条记录
   activation_codes: 0 条记录
   balances: 0 条记录
   commission_records: 0 条记录
   withdrawal_requests: 0 条记录

🔒 验证保留的系统配置：
   admins（管理员）: 1 条记录
   plans（套餐）: 2 条记录
   qr_codes（二维码）: 1 条记录
```

---

## 🔧 故障排除

### 问题1：无法连接数据库

**错误信息：** `Connection error` 或 `Invalid API key`

**解决方案：**
1. 检查 `.env.local` 文件是否存在
2. 确认 Supabase URL 和 Service Role Key 是否正确
3. 检查网络连接

### 问题2：删除失败

**错误信息：** `Foreign key constraint violation`

**解决方案：**
- 脚本已按照依赖关系的逆序删除数据
- 如果仍然失败，请检查数据库外键约束
- 可以尝试手动在 Supabase 控制台执行删除

### 问题3：备份文件过大

**现象：** 备份文件超过 100MB

**解决方案：**
1. 这是正常的，说明有大量测试数据
2. 确保磁盘空间充足
3. 可以压缩备份文件：`gzip backups/backup-*.json`

---

## 📝 上线后测试清单

### 1. 用户注册测试

- [ ] 新用户可以正常注册
- [ ] 注册后显示"免费用户"
- [ ] 显示"已使用：0/15次"

### 2. 免费聊天测试

- [ ] 可以发送15条消息
- [ ] 每次发送后计数正确增加
- [ ] 第16条消息提示"免费次数已用完"

### 3. 邀请奖励测试

- [ ] 用户A邀请用户B注册
- [ ] 用户B购买激活码
- [ ] 用户A获得30%佣金（一级奖励）
- [ ] 用户B邀请用户C注册
- [ ] 用户C购买激活码
- [ ] 用户A获得10%佣金（二级奖励）

### 4. 管理后台测试

- [ ] 管理员可以正常登录
- [ ] 可以查看用户列表（应为空）
- [ ] 可以查看订单列表（应为空）
- [ ] 客服二维码显示正常

---

## 🆘 紧急恢复

如果清理后发现问题，需要恢复数据：

### 方式一：从备份恢复（需要自己编写恢复脚本）

```bash
# 查看备份文件
ls -lh backups/

# 恢复脚本需要自己编写，读取 JSON 并插入数据库
```

### 方式二：从 Supabase 备份恢复

1. 登录 Supabase 控制台
2. 进入 Database > Backups
3. 选择清理前的备份点
4. 点击 Restore

---

## 📞 技术支持

如有问题，请联系技术团队或查看：
- Supabase 文档：https://supabase.com/docs
- 项目 README：../README.md

---

## ✅ 执行记录

建议在每次执行后记录：

| 日期 | 操作人 | 备份文件 | 清理记录数 | 验证结果 | 备注 |
|------|--------|----------|-----------|---------|------|
| 2024-XX-XX | XXX | backup-xxx.json | 3842 | ✅ 通过 | 正式上线前清理 |

---

**最后更新：** 2024-01-26
**版本：** 1.0.0

