import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const CONV_FILE = path.join(DATA_DIR, 'conversations.json');
const MSG_FILE = path.join(DATA_DIR, 'messages.json');

type Conversation = {
  id: string;
  user: string; // phone
  title: string;
  dify_conversation_id?: string | null;
  created_at: number;
  updated_at: number;
};

type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  token_usage?: number;
  created_at: number;
};

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const f of [CONV_FILE, MSG_FILE]) {
    try { await fs.access(f); } catch { await fs.writeFile(f, '[]'); }
  }
}

async function readJson<T>(file: string): Promise<T[]> { await ensure(); const buf = await fs.readFile(file, 'utf8'); return JSON.parse(buf || '[]'); }
async function writeJson<T>(file: string, data: T[]) { await ensure(); await fs.writeFile(file, JSON.stringify(data, null, 2)); }

export async function listConversations(user: string): Promise<Conversation[]> {
  const all = await readJson<Conversation>(CONV_FILE); return all.filter(c => c.user === user).sort((a,b)=>b.updated_at-a.updated_at);
}

export async function createConversation(user: string, title = '新会话'): Promise<Conversation> {
  const all = await readJson<Conversation>(CONV_FILE);
  const conv: Conversation = { id: crypto.randomUUID(), user, title, created_at: Date.now(), updated_at: Date.now(), dify_conversation_id: null };
  all.push(conv); await writeJson(CONV_FILE, all); return conv;
}

export async function getConversation(user: string, id: string): Promise<Conversation | null> {
  const all = await readJson<Conversation>(CONV_FILE);
  return all.find(c => c.id === id && c.user === user) || null;
}

export async function renameConversation(user: string, id: string, title: string) {
  const all = await readJson<Conversation>(CONV_FILE); const conv = all.find(c => c.id === id && c.user === user); if (!conv) return false; conv.title = title; conv.updated_at = Date.now(); await writeJson(CONV_FILE, all); return true;
}

export async function deleteConversation(user: string, id: string) {
  const convs = await readJson<Conversation>(CONV_FILE); const msgs = await readJson<Message>(MSG_FILE);
  const newConvs = convs.filter(c => !(c.id === id && c.user === user));
  const newMsgs = msgs.filter(m => m.conversation_id !== id);
  await writeJson(CONV_FILE, newConvs); await writeJson(MSG_FILE, newMsgs);
}

export async function setDifyConversationId(user: string, id: string, difyId: string) {
  const all = await readJson<Conversation>(CONV_FILE); const conv = all.find(c => c.id === id && c.user === user); if (!conv) return false; conv.dify_conversation_id = difyId; conv.updated_at = Date.now(); await writeJson(CONV_FILE, all); return true;
}

export async function ensureConversationTitle(user: string, id: string, suggested: string) {
  const all = await readJson<Conversation>(CONV_FILE);
  const conv = all.find(c => c.id === id && c.user === user);
  if (!conv) return false;
  const should = !conv.title || conv.title === '新会话' || conv.title.trim().length === 0;
  if (should) {
    conv.title = suggested;
    conv.updated_at = Date.now();
    await writeJson(CONV_FILE, all);
    return true;
  }
  return false;
}

export async function listMessages(user: string, conversationId: string): Promise<Message[]> {
  const msgs = await readJson<Message>(MSG_FILE); return msgs.filter(m => m.conversation_id === conversationId).sort((a,b)=>a.created_at-b.created_at);
}

export async function addMessage(user: string, conversationId: string, role: Message['role'], content: string, token_usage?: number): Promise<Message> {
  const msgs = await readJson<Message>(MSG_FILE);
  const message: Message = { id: crypto.randomUUID(), conversation_id: conversationId, role, content, token_usage, created_at: Date.now() };
  msgs.push(message); await writeJson(MSG_FILE, msgs); return message;
}

// 更新消息的token使用量
export async function updateMessageTokens(messageId: string, tokenUsage: number): Promise<void> {
  const msgs = await readJson<Message>(MSG_FILE);
  const message = msgs.find(m => m.id === messageId);
  if (message) {
    message.token_usage = tokenUsage;
    await writeJson(MSG_FILE, msgs);
  }
}

export type { Conversation, Message };


