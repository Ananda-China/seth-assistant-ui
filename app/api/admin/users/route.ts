import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { getUsers } from '../../../../lib/config';
import { supabaseAdmin } from '../../../../lib/supabase';

// 模拟用户状态数据（因为当前用户系统没有状态字段）
const mockUserStatuses = new Map<string, { status: 'active' | 'suspended', subscription: 'free' | 'premium' | 'enterprise' }>();

// 初始化一些模拟状态数据
function getMockUserStatus(phone: string) {
  if (!mockUserStatuses.has(phone)) {
    const statuses = ['active', 'suspended'] as const;
    const subscriptions = ['free', 'premium', 'enterprise'] as const;
    mockUserStatuses.set(phone, {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      subscription: subscriptions[Math.floor(Math.random() * subscriptions.length)]
    });
  }
  return mockUserStatuses.get(phone)!;
}

export async function GET(req: NextRequest) {
  // 验证管理员权限
  const authResult = requireAdminAuth(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  try {
    const usersModule = await getUsers();

    // 检查是否有 getAllUsers 方法（Supabase 版本）
    if ('getAllUsers' in usersModule) {
      // 使用 Supabase 版本
      const result = await usersModule.getAllUsers(page, limit);

      // 获取所有对话和消息数据
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id, user_phone');

      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('conversation_id, token_usage, created_at');

      // 获取用户余额数据
      const { data: balances } = await supabaseAdmin
        .from('balances')
        .select('user_id, amount');

      // 获取佣金记录
      const { data: commissions } = await supabaseAdmin
        .from('commission_records')
        .select('inviter_user_id, commission_amount');

      // 获取提现记录
      const { data: withdrawals } = await supabaseAdmin
        .from('withdrawal_requests')
        .select('user_id, amount, status')
        .eq('status', 'completed');

      // 获取激活码订阅数据
      const { data: subscriptions } = await supabaseAdmin
        .from('subscriptions')
        .select('user_phone, status, current_period_end');

      const enrichedUsers = result.users.map((user: any) => {
        const mockStatus = getMockUserStatus(user.phone);

        // 计算用户统计数据
        const userConversations = conversations?.filter(conv => conv.user_phone === user.phone) || [];
        const userMessages = messages?.filter(msg =>
          userConversations.some(conv => conv.id === msg.conversation_id)
        ) || [];
        const userTokens = userMessages.reduce((sum, msg) => sum + (msg.token_usage || 0), 0);

        // 获取财务数据
        const userBalance = balances?.find(b => b.user_id === user.id);
        const userCommissions = commissions?.filter(c => c.inviter_user_id === user.id) || [];
        const totalCommission = userCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const userWithdrawals = withdrawals?.filter(w => w.user_id === user.id) || [];
        const totalWithdrawn = userWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

        // 检查是否为付费用户
        const now = new Date();
        let isPaidUser = false;

        // 1. 检查users表中的订阅
        if (user.subscription_type && user.subscription_type !== 'free' && user.subscription_end) {
          isPaidUser = new Date(user.subscription_end) > now;
        }

        // 2. 检查激活码订阅
        if (!isPaidUser) {
          const userSubscription = subscriptions?.find(s =>
            s.user_phone === user.phone &&
            s.status === 'active' &&
            new Date(s.current_period_end) > now
          );
          isPaidUser = !!userSubscription;
        }

        return {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname || '未设置',
          status: user.status || mockStatus.status,
          subscription_type: isPaidUser ? (user.subscription_type || 'monthly') : 'free',
          is_paid_user: isPaidUser,
          created_at: user.created_at,
          last_login: user.created_at,
          invite_code: user.invite_code || 'N/A',
          invited_by: user.invited_by || null,
          total_conversations: userConversations.length,
          total_messages: userMessages.length,
          total_tokens: userTokens,
          balance: (userBalance?.amount || 0) / 100, // 转换为元
          total_commission: totalCommission / 100, // 转换为元
          total_withdrawn: totalWithdrawn / 100 // 转换为元
        };
      });

      // 计算所有用户的统计数据（不仅仅是当前页面）
      const allUsersResult = await usersModule.getAllUsers(1, 1000); // 获取所有用户
      const now = new Date();

      // 计算最近三天有聊天的用户（活跃用户）
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const recentThreeDaysMessages = messages?.filter((msg: any) => {
        const msgDate = new Date(msg.created_at);
        return msgDate >= threeDaysAgo;
      }) || [];

      const activeUserPhones = new Set<string>();
      recentThreeDaysMessages.forEach((msg: any) => {
        const convId = msg.conversation_id;
        const conv = conversations?.find((c: any) => c.id === convId);
        if (conv && conv.user_phone) {
          activeUserPhones.add(conv.user_phone);
        }
      });

      const allEnrichedUsers = allUsersResult.users.map((user: any) => {
        // 检查是否为付费用户
        let isPaidUser = false;

        // 1. 检查users表中的订阅
        if (user.subscription_type && user.subscription_type !== 'free' && user.subscription_end) {
          isPaidUser = new Date(user.subscription_end) > now;
        }

        // 2. 检查激活码订阅
        if (!isPaidUser) {
          const userSubscription = subscriptions?.find(s =>
            s.user_phone === user.phone &&
            s.status === 'active' &&
            new Date(s.current_period_end) > now
          );
          isPaidUser = !!userSubscription;
        }

        return {
          ...user,
          is_paid_user: isPaidUser
        };
      });

      const totalPaidUsers = allEnrichedUsers.filter(u => u.is_paid_user).length;
      const totalActiveUsers = activeUserPhones.size; // 改为最近三天有聊天的用户数
      const totalSuspendedUsers = allEnrichedUsers.filter(u => u.status === 'suspended').length;

      return Response.json({
        users: enrichedUsers,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.totalPages
        },
        statistics: {
          total_users: result.total,
          paid_users: totalPaidUsers,
          active_users: totalActiveUsers,
          suspended_users: totalSuspendedUsers
        }
      });
    }

    // 如果没有 getAllUsers 方法，使用文件系统版本（保持向后兼容）
    // 从文件系统读取所有用户、对话和消息数据
    const { promises: fs } = await import('fs');
    const path = await import('path');
    const DATA_DIR = path.join(process.cwd(), '.data');
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    const CONV_FILE = path.join(DATA_DIR, 'conversations.json');
    const MSG_FILE = path.join(DATA_DIR, 'messages.json');
    
    let users = [];
    let conversations = [];
    let messages = [];
    
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      console.log('Raw users file content:', data);
      users = JSON.parse(data || '[]');
      console.log('Parsed users:', users);
    } catch (error) {
      console.log('No users file found, starting with empty array');
      users = [];
    }
    
    try {
      const convData = await fs.readFile(CONV_FILE, 'utf8');
      console.log('Raw conversations file content length:', convData.length);
      conversations = JSON.parse(convData || '[]');
      console.log('Parsed conversations count:', conversations.length);
    } catch (error) {
      console.log('No conversations file found');
      conversations = [];
    }
    
    try {
      const msgData = await fs.readFile(MSG_FILE, 'utf8');
      console.log('Raw messages file content length:', msgData.length);
      messages = JSON.parse(msgData || '[]');
      console.log('Parsed messages count:', messages.length);
    } catch (error) {
      console.log('No messages file found');
      messages = [];
    }

    // 应用搜索过滤
    let filteredUsers = users;
    if (search) {
      filteredUsers = users.filter((user: any) => 
        user.phone.includes(search) || 
        (user.nickname && user.nickname.includes(search))
      );
    }

    // 应用状态过滤
    if (status) {
      filteredUsers = filteredUsers.filter((user: any) => {
        const mockStatus = getMockUserStatus(user.phone);
        return mockStatus.status === status;
      });
    }

    // 计算分页
    const total = filteredUsers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // 为每个用户添加模拟状态和真实统计数据
    const enrichedUsers = paginatedUsers.map((user: any) => {
      const mockStatus = getMockUserStatus(user.phone);
      
      // 计算该用户的真实统计数据
      const userConversations = conversations.filter((conv: any) => conv.user === user.phone);
      const userMessages = messages.filter((msg: any) => {
        return userConversations.some((conv: any) => conv.id === msg.conversation_id);
      });
      const userTokens = userMessages.reduce((sum: number, msg: any) => sum + (msg.token_usage || 0), 0);
      
      console.log(`User ${user.phone} stats:`, {
        conversations: userConversations.length,
        messages: userMessages.length,
        tokens: userTokens
      });
      
      return {
        id: user.phone, // 使用手机号作为ID
        phone: user.phone,
        nickname: user.nickname || '未设置',
        status: mockStatus.status,
        subscription: mockStatus.subscription,
        created_at: user.created_at,
        last_login: user.created_at, // 暂时使用创建时间
        invite_code: user.invite_code || 'N/A',
        invited_by: user.invited_by || null,
        total_conversations: userConversations.length,
        total_messages: userMessages.length,
        total_tokens: userTokens
      };
    });

    return Response.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // 验证管理员权限
  const authResult = requireAdminAuth(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id, status, subscription } = await req.json();
    
    if (!id) {
      return new Response('User ID is required', { status: 400 });
    }

    // 更新模拟状态数据
    if (status) {
      const currentStatus = mockUserStatuses.get(id) || { status: 'active', subscription: 'free' };
      mockUserStatuses.set(id, { ...currentStatus, status });
    }

    if (subscription) {
      const currentStatus = mockUserStatuses.get(id) || { status: 'active', subscription: 'free' };
      mockUserStatuses.set(id, { ...currentStatus, subscription });
    }

    return Response.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
