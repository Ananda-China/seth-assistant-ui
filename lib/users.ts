import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export type User = {
  phone: string;
  created_at: number; // 注册时间
  nickname?: string; // 昵称，可为空
  invite_code: string; // 我的邀请码（对外分享）
  invited_by?: string; // 我填写的邀请人邀请码
  // 试用期和订阅相关
  trial_start?: number; // 试用期开始时间
  trial_end?: number; // 试用期结束时间
  subscription_type?: 'free' | 'monthly' | 'quarterly' | 'yearly'; // 订阅类型
  subscription_start?: number; // 订阅开始时间
  subscription_end?: number; // 订阅结束时间
  chat_count?: number; // 聊天次数统计
  last_chat_date?: string; // 最后聊天日期（用于每日重置）
};

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(USERS_FILE); } catch { await fs.writeFile(USERS_FILE, '[]'); }
}

async function readUsers(): Promise<User[]> {
  await ensure();
  const buf = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(buf || '[]');
}

async function writeUsers(users: User[]) {
  await ensure();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function getUser(phone: string): Promise<User | undefined> {
  const users = await readUsers();
  return users.find(u => u.phone === phone);
}

export async function getOrCreateUser(phone: string): Promise<User> {
  const users = await readUsers();
  let user = users.find(u => u.phone === phone);
  if (!user) {
    // 生成 6 位邀请码
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const now = Date.now();
    const trialEnd = now + (7 * 24 * 60 * 60 * 1000); // 7天后

    user = {
      phone,
      created_at: now,
      nickname: '',
      invite_code: code,
      trial_start: now,
      trial_end: trialEnd,
      subscription_type: 'free',
      chat_count: 0,
      last_chat_date: new Date().toDateString()
    };
    users.push(user);
    await writeUsers(users);
  }
  return user;
}

export async function updateUserNickname(phone: string, nickname: string): Promise<User | undefined> {
  const users = await readUsers();
  const u = users.find(x => x.phone === phone);
  if (!u) return undefined;
  u.nickname = String(nickname || '').slice(0, 50);
  await writeUsers(users);
  return u;
}

export async function setInvitedBy(phone: string, inviterCode: string): Promise<User | undefined> {
  const users = await readUsers();
  const me = users.find(x => x.phone === phone);
  if (!me) return undefined;
  const inviter = users.find(x => x.invite_code === inviterCode);
  if (!inviter) return undefined;
  me.invited_by = inviterCode;
  await writeUsers(users);
  return me;
}

export async function listInvitees(inviterCode: string): Promise<User[]> {
  const users = await readUsers();
  return users.filter(u => u.invited_by === inviterCode).sort((a,b)=> a.created_at - b.created_at);
}

// 试用期和权限管理
export type UserPermission = {
  canChat: boolean;
  isTrialActive: boolean;
  isPaidUser: boolean;
  remainingDays: number;
  chatLimit: number;
  usedChats: number;
  resetTime?: string;
};

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

  const now = Date.now();
  const today = new Date().toDateString();

  // 检查试用期状态
  const isTrialActive = user.trial_end ? now < user.trial_end : false;
  
  // 检查是否需要重置每日聊天次数（仅对非试用期用户）
  if (!isTrialActive && user.last_chat_date !== today) {
    user.chat_count = 0;
    user.last_chat_date = today;
    await updateUser(user);
  }
  const trialRemainingDays = user.trial_end ? Math.max(0, Math.ceil((user.trial_end - now) / (24 * 60 * 60 * 1000))) : 0;

  // 检查付费订阅状态
  const isPaidUser = user.subscription_type !== 'free' &&
                     user.subscription_end ? now < user.subscription_end : false;

  // 确定聊天限制
  let chatLimit = 0;
  if (isPaidUser) {
    chatLimit = 1000; // 付费用户每日1000次
  } else if (isTrialActive) {
    chatLimit = 999999; // 试用期用户7天内不限制使用次数
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
      Math.ceil((user.subscription_end! - now) / (24 * 60 * 60 * 1000)) :
      trialRemainingDays,
    chatLimit,
    usedChats,
    resetTime: isPaidUser ? '每日0点重置' : isTrialActive ? '试用期内不限制' : undefined
  };
}

export async function incrementChatCount(phone: string): Promise<boolean> {
  const permission = await getUserPermission(phone);
  if (!permission.canChat) {
    return false;
  }

  const users = await readUsers();
  const user = users.find(u => u.phone === phone);
  if (!user) return false;

  user.chat_count = (user.chat_count || 0) + 1;
  await writeUsers(users);
  return true;
}

export async function updateUser(user: User): Promise<void> {
  const users = await readUsers();
  const index = users.findIndex(u => u.phone === user.phone);
  if (index !== -1) {
    users[index] = user;
    await writeUsers(users);
  }
}

export async function upgradeUserSubscription(
  phone: string,
  subscriptionType: 'monthly' | 'quarterly' | 'yearly'
): Promise<User | null> {
  const users = await readUsers();
  const user = users.find(u => u.phone === phone);
  if (!user) return null;

  const now = Date.now();
  let subscriptionEnd: number;

  switch (subscriptionType) {
    case 'monthly':
      subscriptionEnd = now + (30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarterly':
      subscriptionEnd = now + (90 * 24 * 60 * 60 * 1000);
      break;
    case 'yearly':
      subscriptionEnd = now + (365 * 24 * 60 * 60 * 1000);
      break;
  }

  user.subscription_type = subscriptionType;
  user.subscription_start = now;
  user.subscription_end = subscriptionEnd;
  user.chat_count = 0; // 重置聊天次数
  user.last_chat_date = new Date().toDateString();

  await writeUsers(users);
  return user;
}


