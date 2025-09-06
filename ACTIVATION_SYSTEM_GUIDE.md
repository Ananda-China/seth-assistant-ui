# 激活码支付与推广返佣系统部署指南

## 系统概述

本系统实现了基于激活码的支付流程和用户推广返佣机制，支持：
- 激活码生成和管理
- 用户激活码激活套餐
- 邀请返佣计算和发放
- 用户余额管理和提现申请
- 管理后台操作界面

## 数据库迁移

### 1. 执行数据库迁移

```bash
# 在 Supabase 控制台中执行以下 SQL 文件
supabase/migrations/006_activation_system.sql
```

### 2. 验证表结构

确保以下表已创建：
- `plans` - 套餐管理
- `activation_codes` - 激活码管理
- `balances` - 用户余额
- `commission_records` - 佣金记录
- `withdrawal_requests` - 提现申请

## 功能模块

### 1. 激活码管理模块 (`lib/activation.ts`)

**主要功能：**
- 生成激活码
- 验证和激活激活码
- 处理返佣计算
- 管理用户余额

**核心方法：**
```typescript
// 生成激活码
ActivationManager.generateActivationCodes(planId, count)

// 激活激活码
ActivationManager.activateCode(code, userId)

// 获取用户余额
ActivationManager.getUserBalance(userId)

// 获取佣金记录
ActivationManager.getUserCommissionRecords(userId)
```

### 2. API 接口

**激活码相关：**
- `POST /api/activation/activate` - 激活激活码
- `GET /api/activation/plans` - 获取套餐列表
- `GET /api/activation/balance` - 获取用户余额
- `GET /api/activation/commission` - 获取佣金记录

**提现相关：**
- `POST /api/activation/withdraw` - 申请提现
- `GET /api/activation/withdraw` - 获取提现记录

**管理后台：**
- `GET /api/admin/activation-codes` - 获取激活码列表
- `POST /api/admin/generate-codes` - 生成激活码
- `GET /api/admin/withdrawal-requests` - 获取提现申请
- `POST /api/admin/process-withdrawal` - 处理提现申请

### 3. 前端页面

**个人中心页面 (`app/account/page.tsx`)**
- 激活码输入和激活
- 余额显示和提现申请
- 佣金记录查看
- 提现记录查看

**管理后台 (`app/admin/activation/page.tsx`)**
- 激活码生成和管理
- 提现申请处理
- 数据统计展示

## 业务流程

### 1. 激活码激活流程

1. 用户在个人中心输入激活码
2. 系统验证激活码有效性
3. 创建订单和订阅记录
4. 计算并发放返佣
5. 更新用户套餐状态

### 2. 返佣计算规则

- **直接邀请（Level 0）：**
  - 首次购买：40% 返佣
  - 再次购买：30% 返佣
- **二级邀请（Level 1）：**
  - 首次购买：10% 返佣

### 3. 提现流程

1. 用户申请提现（最低50元）
2. 管理员审核申请
3. 管理员手动转账
4. 更新提现状态和用户余额

## 配置说明

### 1. 套餐配置

系统默认配置了两个套餐：
- 月套餐：¥999（30天）
- 年套餐：¥3999（365天）

可在 `supabase/migrations/006_activation_system.sql` 中修改价格。

### 2. 返佣比例

返佣比例在 `lib/activation.ts` 中配置：
```typescript
const commissionRate = isFirstPurchase ? 0.4 : 0.3; // 40% 或 30%
const level2CommissionAmount = Math.floor(plan.price * 0.1); // 10%
```

### 3. 激活码设置

- 激活码长度：8位（字母+数字）
- 激活码有效期：3个月
- 生成数量限制：1-100个

## 测试验证

### 1. 运行测试脚本

```bash
node test-activation-system.js
```

### 2. 手动测试流程

1. **生成激活码**
   - 登录管理后台
   - 进入"激活码管理"
   - 选择套餐和数量
   - 点击"生成激活码"

2. **激活测试**
   - 用户登录个人中心
   - 输入激活码
   - 验证激活成功

3. **返佣测试**
   - 创建邀请关系
   - 被邀请人激活套餐
   - 检查邀请人余额变化

4. **提现测试**
   - 用户申请提现
   - 管理员处理申请
   - 验证余额扣除

## 注意事项

### 1. 数据安全

- 激活码使用唯一索引防止重复
- 用户余额操作需要事务保护
- 提现申请需要管理员审核

### 2. 性能优化

- 激活码查询使用索引
- 佣金计算使用批量操作
- 余额更新使用 upsert 操作

### 3. 错误处理

- 激活码过期检查
- 余额不足检查
- 重复激活检查

## 故障排除

### 1. 激活码无法激活

检查：
- 激活码是否存在
- 激活码是否已使用
- 激活码是否过期
- 用户是否存在

### 2. 返佣未发放

检查：
- 邀请关系是否正确
- 佣金计算是否正确
- 余额更新是否成功

### 3. 提现申请失败

检查：
- 用户余额是否充足
- 申请金额是否达到最低限制
- 是否有待处理的申请

## 扩展功能

### 1. 自动化提现

未来可以集成第三方支付API实现自动提现：
- 支付宝转账API
- 微信转账API
- 银行转账API

### 2. 更多套餐类型

可以添加更多套餐类型：
- 季度套餐
- 终身套餐
- 按量计费套餐

### 3. 高级返佣规则

可以实现更复杂的返佣规则：
- 多级返佣
- 阶梯返佣
- 时间限制返佣

## 联系支持

如有问题，请联系开发团队或查看项目文档。
