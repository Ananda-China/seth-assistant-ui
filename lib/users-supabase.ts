import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export type User = {
  id: string;
  phone: string;
  nickname?: string;
  invite_code: string;
  invited_by?: string;
  created_at: string;
  trial_start?: string;
  trial_end?: string;
  subscription_type: 'free' | 'monthly' | 'quarterly' | 'yearly' | 'times';
  subscription_start?: string;
  subscription_end?: string;
  chat_count: number;
  last_chat_date?: string;
  status: 'active' | 'suspended';
  updated_at: string;
  password_hash?: string | null;
};

export type UserPermission = {
  canChat: boolean;
  isTrialActive: boolean;
  isPaidUser: boolean;
  remainingDays: number;
  chatLimit: number;
  usedChats: number;
  resetTime?: string;
};

// 生成邀请码 - 使用手机号作为邀请码
function generateInviteCode(phone: string): string {
  return phone; // 直接使用手机号作为邀请码
}

// 获取用户
export async function getUser(phone: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // 用户不存在
    throw error;
  }

  return data;
}

// 创建或获取用户
export async function getOrCreateUser(phone: string): Promise<User> {
  let user = await getUser(phone);

  if (!user) {
    const now = new Date().toISOString();
    // 不再设置试用期结束时间，改为使用次数限制
    // trial_end 设置为 null，表示不限制时间

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        phone,
        nickname: '',
        invite_code: generateInviteCode(phone),
        trial_start: now,
        trial_end: null, // 不限制时间
        subscription_type: 'free',
        chat_count: 0,
        last_chat_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;
    user = data;
  }

  return user;
}

// 更新用户昵称
export async function updateUserNickname(phone: string, nickname: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ nickname: nickname.slice(0, 50) })
    .eq('phone', phone)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 设置邀请人
export async function setInvitedBy(phone: string, inviterCode: string): Promise<User | null> {
  // 检查邀请码是否存在（邀请码就是手机号）
  const { data: inviter } = await supabaseAdmin
    .from('users')
    .select('phone')
    .eq('invite_code', inviterCode)
    .single();

  if (!inviter) return null;

  // 不能邀请自己
  if (inviterCode === phone) return null;

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ invited_by: inviterCode })
    .eq('phone', phone)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 获取邀请的用户列表
export async function listInvitees(inviterCode: string): Promise<User[]> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('invited_by', inviterCode)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 获取用户权限
export async function getUserPermission(phone: string): Promise<UserPermission> {
  const user = await getUser(phone);
  if (!user) {
    return {
      canChat: false,
      isTrialActive: false,
      isPaidUser: false,
      remainingDays: 0,
      chatLimit: 0,
      usedChats: 0
    };
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // 检查试用期状态：改为基于次数而不是时间
  // 如果用户的 chat_count < 5，则认为试用期有效
  const isTrialActive = user.subscription_type === 'free' && user.chat_count < 5;

  // 检查付费订阅状态（包括激活码订阅）
  let isPaidUser = user.subscription_type !== 'free' &&
                   user.subscription_end ? new Date(user.subscription_end) > now : false;

  // 检查激活码订阅（优先级更高）
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_phone', phone)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 判断是否是次卡
  const isTimesCard = subscription?.plan === '次卡';

  if (subscription) {
    if (isTimesCard) {
      // 次卡：不限制时间，只限制次数（50次）
      isPaidUser = true;
      console.log('✅ 用户有次卡订阅:', {
        phone,
        plan: subscription.plan,
        chatCount: user.chat_count,
        chatLimit: 50
      });
    } else if (new Date(subscription.current_period_end) > now) {
      // 月卡/年卡：限制时间，不限制次数
      isPaidUser = true;
      console.log('✅ 用户有有效的激活码订阅:', {
        phone,
        plan: subscription.plan,
        endDate: subscription.current_period_end,
        subscriptionType: subscription.subscription_type
      });
    } else {
      console.log('⚠️ 用户有过期的订阅:', {
        phone,
        plan: subscription.plan,
        endDate: subscription.current_period_end,
        isExpired: new Date(subscription.current_period_end) <= now
      });
    }
  }

  // 不再需要每日重置聊天次数，因为试用期改为总次数限制
  // 付费用户仍然不限制次数

  const trialRemainingChats = isTrialActive ? Math.max(0, 5 - user.chat_count) : 0;

  // 确定聊天限制
  let chatLimit = 0;
  if (isPaidUser) {
    if (isTimesCard) {
      // 次卡：限制50次
      chatLimit = 50;
    } else {
      // 月卡/年卡：有效期内不限制使用次数
      chatLimit = 999999;
    }
  } else if (isTrialActive) {
    chatLimit = 5; // 免费用户限制5次聊天，不限制时间
  } else {
    chatLimit = 0; // 试用次数用完且未付费，无法聊天
  }

  const usedChats = user.chat_count || 0;
  const canChat = usedChats < chatLimit;

  console.log('🔍 权限计算详情:', {
    phone,
    isTrialActive,
    isPaidUser,
    isTimesCard,
    chatLimit,
    usedChats,
    canChat,
    calculation: `${usedChats} < ${chatLimit} = ${canChat}`
  });

  return {
    canChat,
    isTrialActive,
    isPaidUser,
    remainingDays: isPaidUser ?
      Math.ceil((new Date(user.subscription_end!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) :
      0, // 免费用户不显示剩余天数
    chatLimit,
    usedChats,
    resetTime: isPaidUser ? '有效期内不限制' : isTrialActive ? `剩余${trialRemainingChats}次免费使用` : undefined
  };
}

// 增加聊天次数
export async function incrementChatCount(phone: string): Promise<boolean> {
  const permission = await getUserPermission(phone);
  if (!permission.canChat) {
    return false;
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ chat_count: permission.usedChats + 1 })
    .eq('phone', phone);

  return !error;
}

// 升级用户订阅
export async function upgradeUserSubscription(
  phone: string,
  subscriptionType: 'monthly' | 'quarterly' | 'yearly'
): Promise<User | null> {
  // 使用UTC时间进行计算
  const now = new Date();
  let subscriptionEnd: Date;

  switch (subscriptionType) {
    case 'monthly':
      // 月套餐：从当前时间开始计算30天（720小时）
      subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarterly':
      subscriptionEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      break;
    case 'yearly':
      subscriptionEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      break;
  }

  console.log('🕐 订阅时间计算:', {
    subscriptionType,
    now: now.toISOString(),
    subscriptionEnd: subscriptionEnd.toISOString(),
    durationDays: (subscriptionEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  });

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_type: subscriptionType,
      subscription_start: now.toISOString(),
      subscription_end: subscriptionEnd.toISOString(),
      chat_count: 0,
      last_chat_date: now.toISOString().split('T')[0]
    })
    .eq('phone', phone)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 获取所有用户（管理员用）
export async function getAllUsers(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    users: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

// 简单密码哈希（salt + sha256），无强安全诉求
function makeSalt(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}
function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
function buildPasswordHash(raw: string) {
  const salt = makeSalt(16);
  const hash = sha256Hex(salt + raw);
  return `${salt}:${hash}`;
}
function checkPassword(raw: string, stored: string) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const calc = sha256Hex(salt + raw);
  return calc === hash;
}

// 设置/更新密码
export async function setPassword(phone: string, password: string): Promise<boolean> {
  const password_hash = buildPasswordHash(password);
  const { error } = await supabaseAdmin
    .from('users')
    .update({ password_hash })
    .eq('phone', phone);
  return !error;
}

// 校验密码
export async function verifyPassword(
  phone: string,
  password: string
): Promise<'OK' | 'NO_PASSWORD' | 'INVALID'> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('password_hash')
    .eq('phone', phone)
    .single();
  if (error) return 'INVALID';
  const stored = data?.password_hash as string | null;
  if (!stored) return 'NO_PASSWORD';
  return checkPassword(password, stored) ? 'OK' : 'INVALID';
}

