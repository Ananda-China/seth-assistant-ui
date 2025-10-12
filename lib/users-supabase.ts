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
  subscription_type: 'free' | 'monthly' | 'quarterly' | 'yearly';
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
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        phone,
        nickname: '',
        invite_code: generateInviteCode(phone),
        trial_start: now,
        trial_end: trialEnd,
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

  // 检查试用期状态
  const isTrialActive = user.trial_end ? new Date(user.trial_end) > now : false;

  // 检查付费订阅状态（包括激活码订阅）
  let isPaidUser = user.subscription_type !== 'free' &&
                   user.subscription_end ? new Date(user.subscription_end) > now : false;

  // 检查激活码订阅
  if (!isPaidUser) {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_phone', phone)
      .eq('status', 'active')
      .single();

    if (subscription && new Date(subscription.current_period_end) > now) {
      isPaidUser = true;
    }
  }

  // 检查是否需要重置每日聊天次数（仅对非试用期且非付费用户）
  if (!isTrialActive && !isPaidUser && user.last_chat_date !== today) {
    await supabaseAdmin
      .from('users')
      .update({
        chat_count: 0,
        last_chat_date: today
      })
      .eq('phone', phone);

    user.chat_count = 0;
    user.last_chat_date = today;
  }
  const trialRemainingDays = user.trial_end ?
    Math.max(0, Math.ceil((new Date(user.trial_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;

  // 确定聊天限制
  let chatLimit = 0;
  if (isPaidUser) {
    chatLimit = 999999; // 付费用户有效期内不限制使用次数
  } else if (isTrialActive) {
    chatLimit = 50; // 试用期用户7天内限制50条聊天
  } else {
    chatLimit = 0; // 试用期结束且未付费，无法聊天
  }

  const usedChats = user.chat_count || 0;
  const canChat = usedChats < chatLimit;

  return {
    canChat,
    isTrialActive,
    isPaidUser,
    remainingDays: isPaidUser ?
      Math.ceil((new Date(user.subscription_end!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) :
      trialRemainingDays,
    chatLimit,
    usedChats,
    resetTime: isPaidUser ? '有效期内不限制' : isTrialActive ? '试用期内限制50条' : undefined
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
  const now = new Date();
  let subscriptionEnd: Date;

  switch (subscriptionType) {
    case 'monthly':
      subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarterly':
      subscriptionEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      break;
    case 'yearly':
      subscriptionEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      break;
  }

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

