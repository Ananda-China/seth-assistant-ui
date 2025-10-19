/**
 * 修复用户chat_count问题
 * 确保新用户的chat_count初始化为0
 * 运行方式: node scripts/fix-user-chat-count.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserChatCount() {
  console.log('🚀 开始检查和修复用户chat_count...\n');

  try {
    // 1. 检查所有免费用户
    console.log('1️⃣ 检查所有免费用户...');
    const { data: freeUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('subscription_type', 'free')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 获取用户失败:', fetchError);
      return;
    }

    console.log(`✅ 找到 ${freeUsers.length} 个免费用户\n`);

    // 2. 检查chat_count为null或undefined的用户
    const usersWithNullCount = freeUsers.filter(user => 
      user.chat_count === null || user.chat_count === undefined
    );

    if (usersWithNullCount.length > 0) {
      console.log(`⚠️  发现 ${usersWithNullCount.length} 个用户的chat_count为null`);
      console.log('用户列表:');
      usersWithNullCount.forEach(user => {
        console.log(`   - ${user.phone} (注册时间: ${new Date(user.created_at).toLocaleString()})`);
      });

      // 3. 修复这些用户的chat_count
      console.log('\n2️⃣ 修复chat_count为null的用户...');
      for (const user of usersWithNullCount) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ chat_count: 0 })
          .eq('phone', user.phone);

        if (updateError) {
          console.error(`❌ 修复用户 ${user.phone} 失败:`, updateError);
        } else {
          console.log(`✅ 已修复用户 ${user.phone} 的chat_count`);
        }
      }
    } else {
      console.log('✅ 所有用户的chat_count都正常\n');
    }

    // 4. 显示所有免费用户的统计信息
    console.log('\n3️⃣ 免费用户统计:');
    console.log('─'.repeat(100));
    console.log('手机号\t\t\t聊天次数\t注册时间\t\t\t状态');
    console.log('─'.repeat(100));
    
    freeUsers.slice(0, 10).forEach(user => {
      const chatCount = user.chat_count || 0;
      const createdAt = new Date(user.created_at).toLocaleString('zh-CN');
      const status = chatCount < 5 ? '可用' : '已用完';
      console.log(`${user.phone}\t\t${chatCount}/5\t\t${createdAt}\t${status}`);
    });
    
    if (freeUsers.length > 10) {
      console.log(`... 还有 ${freeUsers.length - 10} 个用户`);
    }
    console.log('─'.repeat(100));

    // 5. 检查特定用户（如果提供了手机号）
    const targetPhone = process.argv[2];
    if (targetPhone) {
      console.log(`\n4️⃣ 检查特定用户: ${targetPhone}`);
      const { data: targetUser, error: targetError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', targetPhone)
        .single();

      if (targetError) {
        console.error('❌ 获取用户失败:', targetError);
      } else if (targetUser) {
        console.log('\n用户信息:');
        console.log('   手机号:', targetUser.phone);
        console.log('   昵称:', targetUser.nickname || '未设置');
        console.log('   订阅类型:', targetUser.subscription_type);
        console.log('   聊天次数:', targetUser.chat_count || 0);
        console.log('   注册时间:', new Date(targetUser.created_at).toLocaleString('zh-CN'));
        console.log('   试用开始:', targetUser.trial_start ? new Date(targetUser.trial_start).toLocaleString('zh-CN') : '未设置');
        console.log('   试用结束:', targetUser.trial_end ? new Date(targetUser.trial_end).toLocaleString('zh-CN') : '不限制时间');
        
        // 计算剩余次数
        const remainingChats = Math.max(0, 5 - (targetUser.chat_count || 0));
        console.log('   剩余次数:', remainingChats);
        
        if (targetUser.chat_count === null || targetUser.chat_count === undefined) {
          console.log('\n⚠️  该用户的chat_count为null，正在修复...');
          const { error: fixError } = await supabase
            .from('users')
            .update({ chat_count: 0 })
            .eq('phone', targetPhone);

          if (fixError) {
            console.error('❌ 修复失败:', fixError);
          } else {
            console.log('✅ 修复成功！chat_count已设置为0');
          }
        }
      } else {
        console.log('❌ 用户不存在');
      }
    }

    console.log('\n✅ 检查和修复完成！');
    console.log('\n📝 使用方法:');
    console.log('   检查所有用户: node scripts/fix-user-chat-count.js');
    console.log('   检查特定用户: node scripts/fix-user-chat-count.js 17301807380');

  } catch (error) {
    console.error('❌ 发生错误:', error);
  }
}

// 运行脚本
fixUserChatCount();

