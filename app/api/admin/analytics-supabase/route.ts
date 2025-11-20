import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // 验证管理员权限
  const authResult = requireAdminAuth(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';

  try {
    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 计算时间范围
    const now = new Date();
    let startTime: Date;
    let endTime: Date = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 默认到明天

    // 计算今天的时间范围（用于首行数据）- 使用中国时区 UTC+8
    // 获取当前UTC时间
    const nowUTC = new Date();
    // 转换为中国时间（UTC+8）
    const chinaOffset = 8 * 60 * 60 * 1000; // 8小时的毫秒数
    const nowChina = new Date(nowUTC.getTime() + chinaOffset);

    // 计算中国时区的今日开始时间（00:00:00）
    const todayStartChina = new Date(nowChina.getFullYear(), nowChina.getMonth(), nowChina.getDate());
    // 转换回UTC时间
    const todayStart = new Date(todayStartChina.getTime() - chinaOffset);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    console.log('🕐 时区调试:');
    console.log('  当前UTC时间:', nowUTC.toISOString());
    console.log('  当前中国时间:', nowChina.toISOString());
    console.log('  今日开始(UTC):', todayStart.toISOString());
    console.log('  今日结束(UTC):', todayEnd.toISOString());
    console.log('  今日开始(中国):', new Date(todayStart.getTime() + chinaOffset).toISOString());

    if (period === 'today') {
      // 使用已经计算好的中国时区的今日时间范围
      startTime = todayStart;
      endTime = todayEnd;
    } else if (period === 'yesterday') {
      // 昨天的开始时间（中国时区）
      const yesterdayChina = new Date(nowChina.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStartChina = new Date(yesterdayChina.getFullYear(), yesterdayChina.getMonth(), yesterdayChina.getDate());
      startTime = new Date(yesterdayStartChina.getTime() - chinaOffset);
      endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    } else {
      const periodMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '14d': 14 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }[period] || 30 * 24 * 60 * 60 * 1000;

      startTime = new Date(now.getTime() - periodMs);
    }

    // 获取用户数据
    console.log('🔍 开始获取用户数据...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');

    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users', details: userError }), { status: 500 });
    }
    console.log('✅ 用户数据获取成功，共', users?.length || 0, '个用户');

    // 获取对话数据（包括已删除的，用于完整统计）
    console.log('🔍 开始获取对话数据...');
    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select('*');

    if (convError) {
      console.error('❌ Error fetching conversations:', convError);
      return new Response(JSON.stringify({ error: 'Failed to fetch conversations', details: convError }), { status: 500 });
    }

    // 分离未删除和已删除的对话
    const conversations = allConversations?.filter((c: any) => !c.is_deleted) || [];
    const deletedConversations = allConversations?.filter((c: any) => c.is_deleted) || [];
    console.log('✅ 对话数据获取成功，共', allConversations?.length || 0, '个对话（', conversations.length, '个未删除，', deletedConversations.length, '个已删除）');

    // 获取消息数据（只获取未删除的）
    console.log('🔍 开始获取消息数据...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('is_deleted', false);

    if (msgError) {
      console.error('❌ Error fetching messages:', msgError);
      return new Response(JSON.stringify({ error: 'Failed to fetch messages', details: msgError }), { status: 500 });
    }
    console.log('✅ 消息数据获取成功，共', messages?.length || 0, '条消息');

    console.log('📊 API数据获取调试:');
    console.log('  消息总数:', messages?.length || 0);
    if (messages && messages.length > 0) {
      console.log('  第一条消息:', messages[0]);
      console.log('  最后一条消息:', messages[messages.length - 1]);
    }

    // 获取订单数据
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*');

    if (orderError) {
      console.error('Error fetching orders:', orderError);
      // 订单错误不影响其他统计
    }

    // 获取订阅数据
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      // 订阅错误不影响其他统计
    }

    // 辅助函数：将时间转换为Date对象（处理毫秒时间戳和ISO字符串）
    const toDate = (time: any): Date => {
      if (typeof time === 'number') {
        return new Date(time);
      } else if (typeof time === 'string') {
        return new Date(time);
      }
      return new Date();
    };

    // 过滤指定时间范围内的数据
    const recentUsers = users.filter((user: any) => {
      const userDate = toDate(user.created_at);
      return userDate >= startTime && userDate < endTime;
    });
    const recentConversations = conversations.filter((conv: any) => {
      const convDate = toDate(conv.created_at);
      return convDate >= startTime && convDate < endTime;
    });
    const recentMessages = messages.filter((msg: any) => {
      const msgDate = toDate(msg.created_at);
      // 只统计用户消息
      return msgDate >= startTime && msgDate < endTime && msg.role === 'user';
    });

    // 计算今日数据（首行始终显示今日数据）
    const todayUsers = users.filter((user: any) => {
      const userDate = toDate(user.created_at);
      return userDate >= todayStart && userDate < todayEnd;
    });

    // 今日消息（只统计用户消息，不统计助手回复）
    const todayMessages = messages.filter((msg: any) => {
      const msgDate = toDate(msg.created_at);
      const isToday = msgDate >= todayStart && msgDate < todayEnd;

      // 调试：打印前5条消息的时间信息
      if (messages.indexOf(msg) < 5) {
        console.log(`📝 消息 ${messages.indexOf(msg) + 1}:`, {
          created_at: msg.created_at,
          msgDate: msgDate.toISOString(),
          msgDateChina: new Date(msgDate.getTime() + chinaOffset).toISOString(),
          todayStart: todayStart.toISOString(),
          todayEnd: todayEnd.toISOString(),
          isToday,
          role: msg.role
        });
      }

      // 只统计用户消息
      return isToday && msg.role === 'user';
    });

    console.log('📊 今日消息统计（仅用户消息）:', {
      总消息数: messages.length,
      今日用户消息数: todayMessages.length,
      今日开始: todayStart.toISOString(),
      今日结束: todayEnd.toISOString()
    });

    // 今日对话数：统计有今日消息的对话数（去重）
    const todayConversationIds = new Set<string>();
    todayMessages.forEach((msg: any) => {
      if (msg.conversation_id) {
        todayConversationIds.add(msg.conversation_id);
      }
    });
    const todayConversations = Array.from(todayConversationIds).map(id =>
      conversations.find((c: any) => c.id === id)
    ).filter(Boolean);

    const todayTokens = todayMessages.reduce((sum: number, msg: any) =>
      sum + (msg.token_usage || 0), 0
    );

    // 计算今日活跃用户（有对话或消息的用户）
    const todayActiveUserPhones = new Set<string>();
    todayConversations.forEach((conv: any) => {
      if (conv.user_phone) todayActiveUserPhones.add(conv.user_phone);
    });
    todayMessages.forEach((msg: any) => {
      if (msg.user_phone) todayActiveUserPhones.add(msg.user_phone);
    });
    const todayActiveUsers = todayActiveUserPhones.size;

    // 计算基础统计数据
    const totalUsers = users.length;
    const newUsers = recentUsers.length;
    const totalConversations = conversations.length;

    // 计算时间段内有消息的对话数（而不是创建时间）
    const recentConversationIds = new Set<string>();
    recentMessages.forEach((msg: any) => {
      if (msg.conversation_id) {
        recentConversationIds.add(msg.conversation_id);
      }
    });
    const newConversations = recentConversationIds.size;

    // 只统计用户消息（不统计助手回复）
    const totalMessages = messages.filter((msg: any) => msg.role === 'user').length;
    const newMessages = recentMessages.filter((msg: any) => msg.role === 'user').length;
    
    // 计算token使用量
    const totalTokens = messages.reduce((sum: number, msg: any) => 
      sum + (msg.token_usage || 0), 0
    );
    const recentTokens = recentMessages.reduce((sum: number, msg: any) => 
      sum + (msg.token_usage || 0), 0
    );

    // 计算活跃用户（最近三天有聊天的用户数量）
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentThreeDaysMessages = messages.filter((msg: any) => {
      // 处理两种时间格式：ISO字符串和毫秒时间戳
      let msgDate: Date;
      if (typeof msg.created_at === 'number') {
        // 毫秒时间戳
        msgDate = new Date(msg.created_at);
      } else if (typeof msg.created_at === 'string') {
        // ISO字符串
        msgDate = new Date(msg.created_at);
      } else {
        return false;
      }
      return msgDate >= threeDaysAgo;
    });

    console.log('🔍 活跃用户计算调试:');
    console.log('  当前时间:', now.toISOString());
    console.log('  三天前:', threeDaysAgo.toISOString());
    console.log('  总消息数:', messages.length);
    console.log('  最近三天消息数:', recentThreeDaysMessages.length);
    console.log('  总对话数:', conversations.length);
    if (messages.length > 0) {
      console.log('  第一条消息时间:', messages[0].created_at, '类型:', typeof messages[0].created_at);
      const firstMsgDate = new Date(messages[0].created_at);
      console.log('  第一条消息转换后:', firstMsgDate.toISOString());
      console.log('  第一条消息是否在三天内:', firstMsgDate >= threeDaysAgo);
      console.log('  最后一条消息时间:', messages[messages.length - 1].created_at);
      const lastMsgDate = new Date(messages[messages.length - 1].created_at);
      console.log('  最后一条消息转换后:', lastMsgDate.toISOString());
      console.log('  最后一条消息是否在三天内:', lastMsgDate >= threeDaysAgo);
    }

    const activeUserPhones = new Set<string>();
    recentThreeDaysMessages.forEach((msg: any, index: number) => {
      const convId = msg.conversation_id;
      const conv = conversations.find((c: any) => c.id === convId);
      if (index < 3) {
        console.log(`  消息${index + 1}: conversation_id=${convId}, 找到对话=${!!conv}, user_phone=${conv?.user_phone}`);
      }
      if (conv && conv.user_phone) {
        activeUserPhones.add(conv.user_phone);
      }
    });
    console.log('  活跃用户数:', activeUserPhones.size);
    console.log('  活跃用户列表:', Array.from(activeUserPhones));

    const activeUsers = activeUserPhones.size;

    // 计算时间段内的活跃用户（用于下方分析框框）
    const recentActiveUsers = new Set(recentConversations.map((conv: any) => conv.user_phone)).size;

    // 计算时间段内的总token（用于Token使用分析框框）
    const periodTotalTokens = recentMessages.reduce((sum: number, msg: any) =>
      sum + (msg.token_usage || 0), 0
    );

    // 计算订阅提醒数据（快到期用户和免费次数用完用户）
    const subscriptionReminders = [];
    const now_date = new Date();
    const oneMonthLater = new Date(now_date.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 构建用户消息和token统计（通过对话表关联，只统计用户消息）
    const userMessageStats = new Map<string, { messages: number; tokens: number }>();
    conversations.forEach((conv: any) => {
      const userPhone = conv.user_phone;
      // 只统计用户消息（role='user'）
      const convMessages = messages.filter((msg: any) => msg.conversation_id === conv.id && msg.role === 'user');
      const msgCount = convMessages.length;
      const tokenCount = convMessages.reduce((sum: number, msg: any) => sum + (msg.token_usage || 0), 0);

      if (!userMessageStats.has(userPhone)) {
        userMessageStats.set(userPhone, { messages: 0, tokens: 0 });
      }
      const stats = userMessageStats.get(userPhone)!;
      stats.messages += msgCount;
      stats.tokens += tokenCount;
    });

    // 构建有效订阅用户集合（用于排除）
    const activeSubscriptionUsers = new Set<string>();
    if (subscriptions && subscriptions.length > 0) {
      console.log('📋 所有订阅记录:');
      subscriptions.forEach((sub: any) => {
        console.log(`  用户: ${sub.user_phone}, 计划: ${sub.plan}, 状态: ${sub.status}, 到期: ${sub.current_period_end}`);
        const endDate = new Date(sub.current_period_end);
        // 只有有效期内的订阅才算有效
        if (sub.status === 'active' && endDate > now_date) {
          activeSubscriptionUsers.add(sub.user_phone);
          console.log(`    ✅ 添加到有效订阅集合 (endDate=${endDate.toISOString()} > now_date=${now_date.toISOString()})`);
        } else {
          console.log(`    ❌ 不添加到有效订阅集合 (status=${sub.status}, endDate=${endDate.toISOString()}, now_date=${now_date.toISOString()})`);
        }
      });
    }
    console.log('✅ 有效订阅用户集合:', Array.from(activeSubscriptionUsers));

    // 构建订阅提醒列表
    const reminderMap = new Map<string, any>();

    // 1. 先添加一个月内到期的活跃订阅用户（优先级1）
    console.log('🔍 检查一个月内到期的订阅:');
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub: any) => {
        const endDate = new Date(sub.current_period_end);
        const isExpiringSoon = sub.status === 'active' && endDate >= now_date && endDate <= oneMonthLater;
        console.log(`  用户 ${sub.user_phone}: 计划=${sub.plan}, 状态=${sub.status}, 到期=${sub.current_period_end}, 即将到期=${isExpiringSoon}`);
        if (isExpiringSoon) {
          const user = users.find((u: any) => u.phone === sub.user_phone);
          if (user) {
            const stats = userMessageStats.get(user.phone) || { messages: 0, tokens: 0 };
            // 计算该用户的对话数（包括已删除的）
            const userAllConversations = allConversations?.filter((conv: any) => conv.user_phone === user.phone) || [];
            const conversationCount = userAllConversations.length;
            console.log(`    ✅ 添加到提醒列表 (计划: ${sub.plan}, 对话数: ${conversationCount})`);
            reminderMap.set(user.phone, {
              phone: user.phone,
              plan: sub.plan,
              expiry_date: sub.current_period_end,
              conversations: conversationCount,
              messages: stats.messages,
              tokens: stats.tokens,
              priority: 1, // 一个月内到期优先级为1
              total_chat_count: user.chat_count || 0
            });
          }
        }
      });
    }

    // 2. 再添加免费次数用完的用户（subscription_type为'free'且chat_count >= 5）（优先级2）
    // 但要排除那些有有效订阅的用户
    // 注意：chat_count 包含已删除对话中的消息数，这是正确的行为
    console.log('🔍 检查免费用户:');
    const freeUsers = users.filter((u: any) => u.subscription_type === 'free');
    console.log(`  总免费用户数: ${freeUsers.length}`);

    freeUsers.forEach((user: any) => {
      const hasActiveSubscription = activeSubscriptionUsers.has(user.phone);
      const shouldAdd = user.chat_count >= 5 && !hasActiveSubscription;

      // 计算该用户的对话数（包括已删除的）
      const userAllConversations = allConversations?.filter((conv: any) => conv.user_phone === user.phone) || [];
      const conversationCount = userAllConversations.length;

      console.log(`  用户 ${user.phone}: subscription_type=${user.subscription_type}, chat_count=${user.chat_count}, 对话数=${conversationCount}, 有有效订阅=${hasActiveSubscription}, 应该添加=${shouldAdd}`);

      if (shouldAdd) {
        if (!reminderMap.has(user.phone)) {
          const stats = userMessageStats.get(user.phone) || { messages: 0, tokens: 0 };
          console.log(`    ✅ 添加到提醒列表 (对话数: ${conversationCount}, 消息数: ${stats.messages})`);
          reminderMap.set(user.phone, {
            phone: user.phone,
            plan: '免费套餐',
            expiry_date: null,
            conversations: conversationCount,
            messages: stats.messages,
            tokens: stats.tokens,
            priority: 2, // 免费次数用完优先级为2
            total_chat_count: user.chat_count || 0
          });
        }
      } else {
        console.log(`    ❌ 不添加到提醒列表 (chat_count=${user.chat_count}, 需要>=5, hasActiveSubscription=${hasActiveSubscription})`);
      }
    });

    // 3. 再添加次卡用完的用户（subscription_type为'times'且chat_count >= 50）（优先级2）
    // 但要排除那些有有效订阅的用户
    users.forEach((user: any) => {
      if (user.subscription_type === 'times' && user.chat_count >= 50 && !activeSubscriptionUsers.has(user.phone)) {
        if (!reminderMap.has(user.phone)) {
          const stats = userMessageStats.get(user.phone) || { messages: 0, tokens: 0 };
          // 计算该用户的对话数（包括已删除的）
          const userAllConversations = allConversations?.filter((conv: any) => conv.user_phone === user.phone) || [];
          const conversationCount = userAllConversations.length;
          reminderMap.set(user.phone, {
            phone: user.phone,
            plan: '次卡',
            expiry_date: null,
            conversations: conversationCount,
            messages: stats.messages,
            tokens: stats.tokens,
            priority: 2, // 次卡用完优先级为2
            total_chat_count: user.chat_count || 0
          });
        }
      }
    });

    // 转换为数组并按优先级排序
    subscriptionReminders.push(...Array.from(reminderMap.values())
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // 同优先级按到期日期排序（越近越靠前）
        if (a.expiry_date && b.expiry_date) {
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        }
        return 0;
      }));

    // 调试日志
    console.log('📊 订阅提醒调试信息:');
    console.log('当前时间:', now_date.toISOString());
    console.log('一个月后:', oneMonthLater.toISOString());
    console.log('有效订阅用户:', Array.from(activeSubscriptionUsers));
    console.log('订阅提醒列表:', subscriptionReminders.map(r => ({
      phone: r.phone,
      plan: r.plan,
      priority: r.priority,
      expiry_date: r.expiry_date,
      messages: r.messages,
      total_chat_count: r.total_chat_count
    })));

    // 计算活跃度排行（Top 5）
    // 按今日对话数由高到低排序，相同则按最新对话时间排序
    const userActivityMap = new Map<string, {
      phone: string;
      today_messages: number;
      today_tokens: number;
      latest_conversation_time: Date;
      plan_type: string;
      total_chat_count: number;
    }>();

    // 统计今日每个用户的消息数和token消耗（只统计用户消息，不统计助手回复）
    todayMessages.forEach((msg: any) => {
      // 只统计用户发送的消息（role='user'），不统计助手回复
      if (msg.role !== 'user') {
        return;
      }

      const convId = msg.conversation_id;
      const conv = conversations.find((c: any) => c.id === convId);
      if (conv && conv.user_phone) {
        const phone = conv.user_phone;
        if (!userActivityMap.has(phone)) {
          // 获取用户信息
          const user = users.find((u: any) => u.phone === phone);
          // 获取用户订阅信息
          const userSub = subscriptions?.find((s: any) => s.user_phone === phone && s.status === 'active');

          // 确定套餐类型
          let planType = '免费套餐';
          if (userSub) {
            planType = userSub.plan || '未知套餐';
          } else if (user?.subscription_type === 'times') {
            planType = '次卡';
          } else if (user?.subscription_type === 'monthly') {
            planType = '月卡';
          } else if (user?.subscription_type === 'yearly') {
            planType = '年卡';
          }

          userActivityMap.set(phone, {
            phone,
            today_messages: 0,
            today_tokens: 0,
            latest_conversation_time: toDate(msg.created_at),
            plan_type: planType,
            total_chat_count: user?.chat_count || 0
          });
        }
        const userData = userActivityMap.get(phone)!;
        userData.today_messages += 1;
        userData.today_tokens += msg.token_usage || 0;
        // 更新最新对话时间
        const msgTime = toDate(msg.created_at);
        if (msgTime > userData.latest_conversation_time) {
          userData.latest_conversation_time = msgTime;
        }
      }
    });

    // 转换为数组并排序
    const activityRanking = Array.from(userActivityMap.values())
      .sort((a, b) => {
        // 先按今日消息数降序
        if (b.today_messages !== a.today_messages) {
          return b.today_messages - a.today_messages;
        }
        // 相同则按最新对话时间降序
        return b.latest_conversation_time.getTime() - a.latest_conversation_time.getTime();
      })
      .slice(0, 5); // 只取Top 5

    // 调试日志：检查活跃排行数据
    console.log('📊 今日活跃排行数据:', JSON.stringify(activityRanking, null, 2));

    // 计算平均对话长度
    const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
    const avgTokensPerMessage = totalMessages > 0 ? totalTokens / totalMessages : 0;

    // 生成每日趋势数据（最近7天）
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayUsers = users.filter((user: any) => {
        const userDate = toDate(user.created_at);
        return userDate >= dayStart && userDate < dayEnd;
      }).length;

      const dayConversations = conversations.filter((conv: any) => {
        const convDate = toDate(conv.created_at);
        return convDate >= dayStart && convDate < dayEnd;
      }).length;

      const dayMessages = messages.filter((msg: any) => {
        const msgDate = toDate(msg.created_at);
        // 只统计用户消息
        return msgDate >= dayStart && msgDate < dayEnd && msg.role === 'user';
      }).length;
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        users: dayUsers,
        conversations: dayConversations,
        messages: dayMessages
      });
    }

    // 计算用户增长趋势
    const userGrowth = {
      total: totalUsers,
      new: newUsers,
      growth_rate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : '0.0'
    };

    // 计算对话活跃度
    const conversationActivity = {
      total: totalConversations,
      new: newConversations,
      avg_per_user: totalUsers > 0 ? (totalConversations / totalUsers).toFixed(1) : '0.0',
      avg_messages: avgMessagesPerConversation.toFixed(1)
    };

    // 计算消息和token统计
    const messageStats = {
      total: totalMessages,
      new: newMessages,
      avg_per_conversation: avgMessagesPerConversation.toFixed(1),
      total_tokens: totalTokens,
      recent_tokens: recentTokens,
      avg_tokens_per_message: avgTokensPerMessage.toFixed(1)
    };

    // 计算时间段内的平均每消息Token
    const recentAvgTokensPerMessage = recentMessages.length > 0 ? recentTokens / recentMessages.length : 0;

    // 计算用户参与度
    const userEngagement = {
      active_users: activeUsers,
      recent_active: recentActiveUsers,
      today_active: todayActiveUsers,
      engagement_rate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0'
    };

    return Response.json({
      period,
      overview: {
        user_growth: userGrowth,
        conversation_activity: conversationActivity,
        message_stats: messageStats,
        user_engagement: userEngagement,
        // 添加用户统计数据（方便前端访问）
        user_stats: {
          total_users: totalUsers,
          active_users: activeUsers,
          recent_active_users: recentActiveUsers,
          today_active_users: todayActiveUsers,
          new_users: newUsers
        },
        // 添加今日数据（首行始终显示今日数据）
        today_data: {
          new_users: todayUsers.length,
          new_conversations: todayConversations.length,
          new_messages: todayMessages.length,
          today_tokens: todayTokens,
          today_active_users: todayActiveUsers,
          // 添加总数据（显示在框框下方）
          total_users: totalUsers,
          total_conversations: totalConversations,
          total_messages: totalMessages
        },
        // 添加时间段相关的数据（用于下方三个分析框框）
        period_data: {
          period_active_users: recentActiveUsers,
          period_tokens: recentTokens,
          period_total_tokens: periodTotalTokens,
          period_avg_tokens_per_message: recentAvgTokensPerMessage.toFixed(1),
          period_conversations: newConversations,
          period_messages: newMessages
        }
      },
      trends: {
        daily_data: dailyData
      },
      activity_ranking: activityRanking.map(item => ({
        phone: item.phone,
        today_messages: item.today_messages,
        today_tokens: item.today_tokens,
        plan_type: item.plan_type,
        total_chat_count: item.total_chat_count
      })),
      subscription_reminders: subscriptionReminders,
      debug_info: {
        all_subscriptions: subscriptions?.map((s: any) => ({
          user_phone: s.user_phone,
          plan: s.plan,
          status: s.status,
          current_period_end: s.current_period_end
        })) || [],
        active_subscription_users: Array.from(activeSubscriptionUsers),
        free_users_count: users.filter((u: any) => u.subscription_type === 'free').length,
        total_users_count: users.length
      },
      top_metrics: [
        {
          label: '总用户数',
          value: totalUsers,
          change: newUsers > 0 ? `+${newUsers}` : '0',
          change_type: newUsers > 0 ? 'positive' : 'neutral'
        },
        {
          label: '总对话数',
          value: totalConversations,
          change: newConversations > 0 ? `+${newConversations}` : '0',
          change_type: newConversations > 0 ? 'positive' : 'neutral'
        },
        {
          label: '总消息数',
          value: totalMessages,
          change: newMessages > 0 ? `+${newMessages}` : '0',
          change_type: newMessages > 0 ? 'positive' : 'neutral'
        },
        {
          label: 'Token使用量',
          value: totalTokens.toLocaleString(),
          change: recentTokens > 0 ? `+${recentTokens.toLocaleString()}` : '0',
          change_type: recentTokens > 0 ? 'positive' : 'neutral'
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
