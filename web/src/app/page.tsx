"use client";

import { useEffect, useRef, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function HomePage() {
  const [input, setInput] = useState(''); // 去掉"你好"默认值
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const conversationIdRef = useRef<string | null>(null);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  async function send() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userMsg.content,
        conversation_id: conversationIdRef.current,
      }),
    });

    if (!res.ok || !res.body) {
      setLoading(false);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: '请求失败' }]);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let assistantText = '';
    // first chunk may return conversation id via header-like prefix
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk.startsWith('CID:')) {
        const cid = chunk.slice(4).trim();
        if (cid) conversationIdRef.current = cid;
        continue;
      }
      assistantText += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, content: assistantText };
          return updated;
        }
        return [...prev, { id: crypto.randomUUID(), role: 'assistant', content: assistantText }];
      });
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">赛斯助手 · MVP</h1>
      <div className="space-y-3 border rounded-md p-4 bg-white min-h-[320px]">
        {messages.map(m => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block rounded px-3 py-2 bg-gray-100">{m.content}</span>
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">生成中...</div>}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="问问赛斯"
        />
        <button className="px-4 py-2 rounded bg-black text-white" onClick={send} disabled={loading}>
          发送
        </button>
      </div>
    </main>
  );
}


