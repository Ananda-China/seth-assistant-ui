# Supabase SQL 分步执行指南

如果整个SQL文件执行失败，请按照以下步骤逐个执行每个SQL语句块。

---

## 步骤1: 创建表

在Supabase SQL Editor中执行：

```sql
CREATE TABLE IF NOT EXISTS custom_ai_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dify_app_id VARCHAR(100) NOT NULL,
  dify_api_key VARCHAR(255) NOT NULL,
  dify_api_url VARCHAR(500) NOT NULL,
  knowledge_base_id VARCHAR(100),
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id)
);
```

**预期结果**: ✅ 表创建成功

---

## 步骤2: 创建索引

```sql
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_customer_id ON custom_ai_configs(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_dify_app_id ON custom_ai_configs(dify_app_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_is_active ON custom_ai_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_ai_configs_created_at ON custom_ai_configs(created_at DESC);
```

**预期结果**: ✅ 4个索引创建成功

---

## 步骤3: 创建触发器函数

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**预期结果**: ✅ 函数创建成功

---

## 步骤4: 创建触发器

```sql
DROP TRIGGER IF EXISTS update_custom_ai_configs_updated_at ON custom_ai_configs;
CREATE TRIGGER update_custom_ai_configs_updated_at BEFORE UPDATE ON custom_ai_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**预期结果**: ✅ 触发器创建成功

---

## 步骤5: 启用RLS

```sql
ALTER TABLE custom_ai_configs ENABLE ROW LEVEL SECURITY;
```

**预期结果**: ✅ RLS启用成功

---

## 步骤6: 创建RLS策略 - 用户查看自己的配置

```sql
DROP POLICY IF EXISTS custom_ai_configs_select_own ON custom_ai_configs;
CREATE POLICY custom_ai_configs_select_own ON custom_ai_configs
  FOR SELECT USING (customer_id = auth.uid());
```

**预期结果**: ✅ 策略创建成功

---

## 步骤7: 创建RLS策略 - 管理员查看所有配置

```sql
DROP POLICY IF EXISTS custom_ai_configs_select_all ON custom_ai_configs;
CREATE POLICY custom_ai_configs_select_all ON custom_ai_configs
  FOR SELECT USING (true);
```

**预期结果**: ✅ 策略创建成功

---

## 步骤8: 创建RLS策略 - 管理员插入配置

```sql
DROP POLICY IF EXISTS custom_ai_configs_insert ON custom_ai_configs;
CREATE POLICY custom_ai_configs_insert ON custom_ai_configs
  FOR INSERT WITH CHECK (true);
```

**预期结果**: ✅ 策略创建成功

---

## 步骤9: 创建RLS策略 - 管理员更新配置

```sql
DROP POLICY IF EXISTS custom_ai_configs_update ON custom_ai_configs;
CREATE POLICY custom_ai_configs_update ON custom_ai_configs
  FOR UPDATE USING (true) WITH CHECK (true);
```

**预期结果**: ✅ 策略创建成功

---

## 步骤10: 创建RLS策略 - 管理员删除配置

```sql
DROP POLICY IF EXISTS custom_ai_configs_delete ON custom_ai_configs;
CREATE POLICY custom_ai_configs_delete ON custom_ai_configs
  FOR DELETE USING (true);
```

**预期结果**: ✅ 策略创建成功

---

## 验证

执行完所有步骤后，运行以下查询验证：

```sql
-- 查看表结构
\d custom_ai_configs

-- 查看表的索引
SELECT indexname FROM pg_indexes WHERE tablename = 'custom_ai_configs';

-- 查看RLS策略
SELECT * FROM pg_policies WHERE tablename = 'custom_ai_configs';
```

---

## 常见问题

### 问题1: "relation 'users' does not exist"
**原因**: users表不存在  
**解决**: 确保你的项目中已经有users表（通常由Supabase Auth自动创建）

### 问题2: "policy already exists"
**原因**: 策略已经存在  
**解决**: 这是正常的，DROP POLICY IF EXISTS会处理这个问题

### 问题3: "syntax error"
**原因**: SQL语法错误  
**解决**: 检查是否有多余的空格或特殊字符

---

## 如果还有问题

如果执行过程中仍然出现错误，请：

1. 复制完整的错误信息
2. 告诉我是在哪一步出错
3. 我会为你提供针对性的解决方案

---

**提示**: 建议先执行步骤1-5，这些是基础设置。如果这些都成功了，再执行步骤6-10的RLS策略。

