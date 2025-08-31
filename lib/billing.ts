import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');

export type Order = {
  out_trade_no: string;
  user: string; // phone
  plan: '月付' | '季付' | '年付' | string;
  amount_fen: number;
  status: 'pending' | 'success' | 'failed';
  created_at: number;
  paid_at?: number;
  // ZPay 相关字段
  plan_id?: string; // 套餐ID
  duration_days?: number; // 套餐天数
  trade_no?: string; // 第三方交易号
  zpay_status?: string; // ZPay 状态
  failed_at?: number; // 失败时间
};

export type Subscription = {
  user: string; // phone
  plan: string;
  status: 'active' | 'expired';
  current_period_end: number; // timestamp
  period_start: number;
  monthly_quota?: number; // 可扩展：配额
  used_this_period?: number;
};

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const f of [ORDERS_FILE, SUBS_FILE]) {
    try { await fs.access(f); } catch { await fs.writeFile(f, '[]'); }
  }
}

async function readJson<T>(file: string): Promise<T[]> { await ensure(); const buf = await fs.readFile(file, 'utf8'); return JSON.parse(buf || '[]'); }
async function writeJson<T>(file: string, data: T[]) { await ensure(); await fs.writeFile(file, JSON.stringify(data, null, 2)); }

export async function createOrder(order: Order) {
  const orders = await readJson<Order>(ORDERS_FILE);
  orders.push(order);
  await writeJson(ORDERS_FILE, orders);
}

export async function updateOrderStatus(
  out_trade_no: string,
  status: Order['status'],
  extraData?: Partial<Order>
) {
  const orders = await readJson<Order>(ORDERS_FILE);
  const o = orders.find(x => x.out_trade_no === out_trade_no);
  if (o) {
    o.status = status;
    if (status === 'success') o.paid_at = Date.now();

    // 更新额外数据
    if (extraData) {
      Object.assign(o, extraData);
    }

    await writeJson(ORDERS_FILE, orders);
  }
}

export async function getOrder(out_trade_no: string): Promise<Order | undefined> {
  const orders = await readJson<Order>(ORDERS_FILE);
  return orders.find(x => x.out_trade_no === out_trade_no);
}

export async function listOrdersByUser(user: string): Promise<Order[]> {
  const orders = await readJson<Order>(ORDERS_FILE);
  return orders.filter(o => o.user === user).sort((a,b)=> (b.created_at - a.created_at));
}

export async function upsertSubscription(user: string, plan: string) {
  const subs = await readJson<Subscription>(SUBS_FILE);
  const now = Date.now();
  const addDays = plan.includes('年') ? 365 : plan.includes('季') ? 90 : 30;
  const end = now + addDays * 24 * 60 * 60 * 1000;
  const exist = subs.find(s => s.user === user);
  if (exist) {
    exist.plan = plan;
    exist.status = 'active';
    exist.period_start = now;
    exist.current_period_end = end;
    exist.used_this_period = 0;
  } else {
    subs.push({ user, plan, status: 'active', period_start: now, current_period_end: end, used_this_period: 0 });
  }
  await writeJson(SUBS_FILE, subs);
}

export async function getSubscription(user: string): Promise<Subscription | undefined> {
  const subs = await readJson<Subscription>(SUBS_FILE);
  return subs.find(s => s.user === user);
}

export const _paths = { DATA_DIR, ORDERS_FILE, SUBS_FILE };


