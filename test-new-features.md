# 新功能测试清单

## 1. 推广返佣比例调整 ✅
- [x] 一级奖励比例从40%调整为30%
- [x] 二级奖励比例保持10%不变
- [x] 更新了相关文档

**测试方法：**
- 查看 `lib/activation.ts` 第274-275行
- 查看 `ACTIVATION_SYSTEM_GUIDE.md` 第98-101行和第122-126行

## 2. 新用户7天聊天次数限制 ✅
- [x] 试用期用户聊天次数限制为50条
- [x] 更新了权限检查逻辑
- [x] 同时更新了Supabase和本地文件版本

**测试方法：**
1. 注册新用户
2. 查看用户权限信息，应显示"试用期内限制50条"
3. 进行聊天测试，验证次数统计

## 3. 语音转文字功能 ✅
- [x] 在聊天输入框旁边添加了语音按钮
- [x] 使用浏览器Web Speech API实现语音识别
- [x] 支持中文语音识别
- [x] 添加了录音状态指示和动画效果

**测试方法：**
1. 打开聊天页面
2. 点击麦克风图标开始录音
3. 说话后自动转换为文字并填入输入框
4. 验证录音状态指示器工作正常

## 4. 管理后台微信二维码上传功能 ✅
- [x] 创建了QRCodeManagement组件
- [x] 实现了二维码的增删改查功能
- [x] 添加了相应的API端点
- [x] 创建了数据库迁移文件
- [x] 在管理后台侧边栏添加了菜单项

**测试方法：**
1. 登录管理后台 (admin/admin123)
2. 点击"二维码管理"菜单
3. 测试添加、编辑、删除二维码配置
4. 验证图片预览功能

## 5. 第一次登录用户引导 ✅
- [x] 创建了UserGuide组件
- [x] 包含产品介绍、邀请指引、付款指引三个步骤
- [x] 集成了邀请二维码生成
- [x] 显示微信客服二维码
- [x] 添加了首次登录检测逻辑

**测试方法：**
1. 清除浏览器localStorage
2. 注册新用户或重新登录
3. 验证用户引导弹窗显示
4. 测试引导流程的各个步骤
5. 验证"跳过引导"和完成引导后不再显示

## 需要手动执行的数据库迁移

如果使用Supabase，需要在Supabase控制台执行以下SQL：

```sql
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
```

## 测试环境信息

- 本地开发服务器：http://localhost:3002
- 管理后台：http://localhost:3002/admin/login
- 默认管理员账号：admin / admin123

## 已知问题和注意事项

1. **语音识别功能**：需要HTTPS环境或localhost才能正常工作
2. **浏览器兼容性**：语音识别主要支持Chrome和Edge浏览器
3. **数据库迁移**：新的qr_codes表需要手动创建
4. **用户引导**：基于localStorage存储，清除浏览器数据会重新显示

## 下一步计划

1. 完成本地测试验证
2. 执行数据库迁移
3. 提交代码到Git仓库
4. 部署到Vercel生产环境
