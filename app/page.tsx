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
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [mePhone, setMePhone] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean>(false);
  const [permission, setPermission] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const creatingConversationRef = useRef<boolean>(false);

  // 自动调整输入框高度
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 140);
      textareaRef.current.style.height = Math.max(newHeight, 50) + 'px';
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    adjustTextareaHeight();
  };

  // 自动创建聊天记录（如果没有的话）
  const ensureConversation = async () => {
    // 如果已经有活跃对话，直接返回
    if (activeConv) {
      console.log('✅ 已有活跃对话:', activeConv);
      return activeConv;
    }
    
    // 检查是否已有未使用的对话（标题为"新会话"且没有消息的对话）
    const existingEmptyConv = conversations.find(c => 
      c.title === '新会话' && 
      !messages.some(m => m.role === 'user' || m.role === 'assistant')
    );
    
    if (existingEmptyConv) {
      console.log('✅ 找到现有空对话:', existingEmptyConv.id);
      setActiveConv(existingEmptyConv.id);
      return existingEmptyConv.id;
    }
    
    // 如果正在创建中，等待一下再重试
    if (creatingConversationRef.current) {
      console.log('⏳ 对话正在创建中，等待...');
      // 等待创建完成
      let attempts = 0;
      while (creatingConversationRef.current && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (activeConv) {
        console.log('✅ 等待后获取到活跃对话:', activeConv);
        return activeConv;
      }
    }
    
    try {
      creatingConversationRef.current = true;
      console.log('🔄 自动创建新聊天记录...');
      const res = await fetch('/api/conversations', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversation;
        console.log('✅ 新聊天记录创建成功:', conv.id);
        setConversations(prev => [...prev, conv]);
        setActiveConv(conv.id);
        conversationIdRef.current = null;
        try { localStorage.removeItem('cid'); } catch {}
        setMessages([]);
        creatingConversationRef.current = false;
        return conv.id;
      } else {
        console.error('❌ 创建聊天记录失败:', res.status);
        creatingConversationRef.current = false;
        return null;
      }
    } catch (error) {
      console.error('❌ 创建聊天记录失败:', error);
      creatingConversationRef.current = false;
      return null;
    }
  };

  // 恢复已保存的会话ID
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cid');
      if (saved) {
        conversationIdRef.current = saved;
      }
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/conversations');
      if (r.ok) {
        const data = await r.json();
        setConversations(data.list || []);
        if (!activeConv && data.list?.[0]) setActiveConv(data.list[0].id);
      }
      try {
        const m = await fetch('/api/me');
        if (m.ok) {
          const j = await m.json();
          setMe(j.nickname || '');
          setMePhone(j.phone || '');
          setAuthed(true);

          // 获取用户权限信息
          const p = await fetch('/api/user/permission');
          if (p.ok) {
            const permData = await p.json();
            setPermission(permData.data);
          }
        } else {
          setAuthed(false);
        }
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  // 当切换会话时拉取历史消息
  useEffect(() => {
    if (!activeConv) return;
    (async () => {
      try {
        const r = await fetch(`/api/conversations/${activeConv}`);
        if (r.ok) {
          const data = await r.json();
          const list = (data.list || []) as { id:string; role:'user'|'assistant'|'system'; content:string }[];
          if (list && list.length > 0) {
            setMessages(list.map(m => ({ id: m.id, role: m.role, content: m.content })));
          } else {
            // 如果没有消息，保持当前消息列表，不要清空
            console.log('⚠️ 对话中没有消息，保持当前状态');
          }
        } else {
          console.error('❌ 获取对话消息失败:', r.status);
          // 失败时也不要清空消息
        }
      } catch (error) {
        console.error('❌ 获取对话消息出错:', error);
        // 出错时也不要清空消息
      }
    })();
  }, [activeConv]);

  // 当消息更新时自动滚动到底部
  useEffect(() => {
    const scrollToBottom = () => {
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      window.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
    };
    
    const timer = setTimeout(scrollToBottom, 300);
    return () => clearTimeout(timer);
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    
    // 确保有聊天记录，并等待创建完成
    const convId = await ensureConversation();
    
    // 如果没有获取到对话ID，不允许发送消息
    if (!convId && !activeConv) {
      console.error('❌ 无法创建或获取对话ID，消息发送失败');
      return;
    }
    
    const originalInput = input;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: originalInput };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    // 确保有活跃的对话ID，优先使用新创建的对话ID
    const currentConvId = convId || activeConv;
    if (!activeConv && convId) {
      setActiveConv(convId);
    }
    
    // 重置输入框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px';
    }
    
    // 立即滚动到底部，显示用户消息
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 50);

    // 乐观更新：如果当前会话标题为默认值，则先改为问题的前缀
    if (activeConv) {
      const snippet = originalInput.slice(0, 15);
      console.log('🔄 更新对话标题:', snippet);
      setConversations(prev => prev.map(c => {
        if (c.id !== activeConv) return c;
        if (!c.title || c.title === '新会话' || c.title.trim().length === 0) {
          console.log('✅ 对话标题已更新:', snippet);
          return { ...c, title: snippet };
        }
        return c;
      }));
    } else if (convId) {
      // 如果是新创建的对话，也要更新标题
      const snippet = originalInput.slice(0, 15);
      console.log('🔄 更新新对话标题:', snippet);
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c;
        if (!c.title || c.title === '新会话' || c.title.trim().length === 0) {
          console.log('✅ 新对话标题已更新:', snippet);
          return { ...c, title: snippet };
        }
        return c;
      }));
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userMsg.content,
        conversation_id: conversationIdRef.current,
        client_conversation_id: currentConvId, // 使用当前有效的对话ID
      }),
    });

    if (!res.ok || !res.body) {
      setLoading(false);

      if (res.status === 402) {
        // 权限不足，尝试解析错误信息
        try {
          const errorData = await res.json();
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'system',
            content: `⚠️ ${errorData.error || '权限不足'}\n\n${
              !errorData.permission?.isPaidUser && !errorData.permission?.isTrialActive
                ? '您的7天免费试用已结束，请升级到付费版本继续使用。'
                : errorData.permission?.usedChats >= errorData.permission?.chatLimit
                ? `今日聊天次数已用完，明日可继续使用。`
                : ''
            }`
          }]);

          // 更新权限状态
          if (errorData.permission) {
            setPermission(errorData.permission);
          }
        } catch {
          const errText = await res.text().catch(() => '权限不足');
          setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: errText }]);
        }
      } else if (res.status === 500) {
        // 服务器错误，可能是消息保存失败或Dify API问题
        try {
          const errorData = await res.json();
          console.error('❌ 聊天API错误:', errorData);
          
          // 检查是否是Dify认证问题
          if (errorData.error && (errorData.error.includes('unauthorized') || errorData.error.includes('Access token is invalid'))) {
            setMessages(prev => [...prev, { 
              id: crypto.randomUUID(), 
              role: 'system', 
              content: `⚠️ Dify API认证失败\n\n您的消息已保存，但AI助手暂时无法回复。\n请联系管理员检查Dify API配置。` 
            }]);
          } else {
            setMessages(prev => [...prev, { 
              id: crypto.randomUUID(), 
              role: 'system', 
              content: `⚠️ ${errorData.error || '服务器错误，请重试'}` 
            }]);
          }
        } catch {
          const errText = await res.text().catch(() => '服务器错误');
          setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: errText }]);
        }
      } else {
        const errText = await res.text().catch(() => '请求失败');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: errText || '请求失败' }]);
      }
      
      // 重要：即使出错，也要保留用户消息，并更新对话标题
      if (activeConv) {
        const snippet = originalInput.slice(0, 15);
        setConversations(prev => prev.map(c => {
          if (c.id !== activeConv) return c;
          if (!c.title || c.title === '新会话' || c.title.trim().length === 0) {
            return { ...c, title: snippet };
          }
          return c;
        }));
      }
      
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let assistantText = '';
    let assistantMessageId = '';
    let isFirstChunk = true;
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // 可能一次读到多行，逐行处理
      const parts = chunk.split('\n');
      for (const part of parts) {
        if (!part) continue;
        if (part.startsWith('CID:')) {
          const cid = part.slice(4).trim();
          if (cid) {
            conversationIdRef.current = cid;
            try { localStorage.setItem('cid', cid); } catch {}
          }
          continue;
        }
        
        // 过滤掉可能的 [object Object] 内容
        if (part.includes('[object Object]') || part.includes('[Object object]')) {
          console.log('⚠️ 过滤掉 [object Object]:', part);
          continue;
        }
        
        // 过滤掉其他可能的无效内容
        if (part.trim() === '' || part.trim() === 'null' || part.trim() === 'undefined') {
          continue;
        }
        
        assistantText += part;
        
        // 只在第一次创建消息，后续只更新内容
        if (isFirstChunk) {
          const assistantMessage = { 
            id: crypto.randomUUID(), 
            role: 'assistant' as const, 
            content: assistantText 
          };
          setMessages(prev => [...prev, assistantMessage]);
          assistantMessageId = assistantMessage.id;
          isFirstChunk = false;
        } else {
          // 后续更新只修改最后一条消息的内容
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantText };
            }
            return updated;
          });
        }
      }
    }
    setLoading(false);

    // 更新权限状态
    try {
      const p = await fetch('/api/user/permission');
      if (p.ok) {
        const permData = await p.json();
        setPermission(permData.data);
      }
    } catch {}

    // AI回复完成后，再次滚动到底部
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }

  return (
    <main className="main-wrap">
      {/* 顶部标题栏 */}
      <div className="header">
        <div className="logo-area">
          {/* 保持品牌区域宽度，内容移至侧边栏 */}
        </div>
      </div>

      {/* 主应用区域 */}
      <div className="app-shell">
        {/* 左侧边栏 */}
        <aside className="sidebar">
          {/* 顶部品牌区域 */}
          <div className="sidebar-header">
            <div className="brand-logo">
              <div className="logo-icon">
                <span className="logo-text">S</span>
              </div>
              <div className="brand-title">赛斯助手</div>
            </div>
          </div>
          
          {/* 聊天记录标签和新建按钮 */}
          <div className="chat-history-header">
            <div className="chat-history-label">聊天记录</div>
            <button 
              className="new-chat-btn" 
              title="新建会话" 
              onClick={async () => {
                // 如果当前对话是空的，直接切换到它
                if (activeConv && messages.length === 0) {
                  console.log('✅ 当前对话为空，直接使用');
                  return;
                }
                
                // 创建新对话
                const res = await fetch('/api/conversations', { method: 'POST' });
                const data = await res.json();
                const conv = data.conversation;
                setConversations(prev => [conv, ...prev]);
                setActiveConv(conv.id);
                conversationIdRef.current = null; 
                try { localStorage.removeItem('cid'); } catch {}
                setMessages([]);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>
          
          {/* 聊天记录列表 */}
          <ul className="conversation-list">
            {conversations.map(c => (
              <li key={c.id} className="conversation-item">
                <div className={`conversation-content ${activeConv === c.id ? 'selected' : ''}`}>
                  <button 
                    className="conversation-title" 
                    onClick={() => {
                      setActiveConv(c.id);
                      conversationIdRef.current = null; 
                      try { localStorage.removeItem('cid'); } catch {}
                      setMessages([]);
                    }}
                  >
                    {c.title}
                  </button>
                  
                  {/* 操作按钮 */}
                  <div className="conversation-actions">
                    <button 
                      className="action-btn rename-btn" 
                      onClick={async (e) => {
                        e.stopPropagation();
                        const title = prompt('重命名会话', c.title);
                        if (!title) return;
                        await fetch(`/api/conversations/${c.id}`, { 
                          method: 'PATCH', 
                          headers: { 'Content-Type': 'application/json' }, 
                          body: JSON.stringify({ title }) 
                        });
                        setConversations(prev => prev.map(x => x.id === c.id ? { ...x, title } : x));
                      }} 
                      title="重命名"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      className="action-btn delete-btn" 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('确定删除该会话？')) return;
                        
                        try {
                          console.log('🗑️ 删除对话:', c.id);
                          const response = await fetch(`/api/conversations/${c.id}`, { method: 'DELETE' });
                          
                          if (response.ok) {
                            console.log('✅ 对话删除成功');
                            // 从本地状态中移除
                            setConversations(prev => prev.filter(x => x.id !== c.id));
                            
                            // 如果删除的是当前活跃对话，清空消息
                            if (activeConv === c.id) {
                              setActiveConv(null);
                              setMessages([]);
                              conversationIdRef.current = null; 
                              try { localStorage.removeItem('cid'); } catch {}
                            }
                          } else {
                            console.error('❌ 删除对话失败:', response.status);
                            const errorData = await response.json().catch(() => ({}));
                            alert(`删除失败: ${errorData.error || '未知错误'}`);
                          }
                        } catch (error) {
                          console.error('❌ 删除对话失败:', error);
                          alert('删除失败，请重试');
                        }
                      }} 
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {/* 个人账户区域 */}
          {authed ? (
            <div className="user-profile">
              <div className="profile-separator"></div>

              {/* 权限状态显示 */}
              {permission && (
                <div style={{
                  padding: '12px',
                  marginBottom: '12px',
                  background: 'rgba(76, 85, 138, 0.2)',
                  borderRadius: '12px',
                  border: '1px solid rgba(200, 182, 226, 0.1)'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#8A94B3',
                    marginBottom: '4px'
                  }}>
                    使用状态
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#EAEBF0',
                    marginBottom: '4px'
                  }}>
                    {permission.isPaidUser ? (
                      <span style={{ color: '#10B981' }}>付费用户</span>
                    ) : permission.isTrialActive ? (
                      <span style={{ color: '#F59E0B' }}>试用期 ({permission.remainingDays}天)</span>
                    ) : (
                      <span style={{ color: '#EF4444' }}>试用已结束</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#8A94B3'
                  }}>
                    今日聊天：{permission.usedChats}/{permission.chatLimit}
                  </div>

                  {/* 升级按钮 */}
                  {(!permission.isPaidUser && (!permission.isTrialActive || permission.usedChats >= permission.chatLimit)) && (
                    <a
                      href="/pricing"
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #C8B6E2 0%, #8A94B3 100%)',
                        color: '#1A1D33',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {!permission.isTrialActive ? '试用已结束，立即升级' : '今日次数已用完，升级无限制'}
                    </a>
                  )}
                </div>
              )}

              <a href="/account" className="profile-link">
                <div className="profile-avatar">
                  {me ? (me[0]?.toUpperCase()) : 'A'}
                </div>
                <div className="profile-info">
                  <div className="profile-name">
                    {me && me.length > 0 ? me : '未设置昵称'}
                  </div>
                  <div className="profile-phone">
                    {mePhone ? `手机：${mePhone}` : '点击设置个人信息'}
                  </div>
                </div>
              </a>
            </div>
          ) : (
            <div className="user-profile">
              <div className="profile-separator"></div>
              <a href="/login" className="profile-link login-link">
                <div className="profile-avatar">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="profile-info">
                  <div className="profile-name">登录</div>
                  <div className="profile-phone">点击进入登录页面</div>
                </div>
              </a>
            </div>
          )}
        </aside>

        {/* 右侧主内容区域 */}
        <div className="main-content">
          {/* 聊天消息区域 */}
          <div className="chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`message ${m.role === 'user' ? 'user-message' : 'assistant-message'}`}>
                <div className={`message-bubble ${m.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="loading-indicator">生成中...</div>}
          </div>
          
          {/* 输入区域 */}
          <div className="input-area">
            <div className="composer">
              <textarea
                rows={1}
                className="message-input"
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                placeholder="问问赛斯"
                style={{ 
                  minHeight: '50px', 
                  maxHeight: '140px',
                  fontSize: '16px',
                  lineHeight: '1.6'
                }}
                ref={textareaRef}
                onInput={adjustTextareaHeight}
                onKeyUp={handleKeyDown}
                onKeyDown={handleKeyDown}
              />
              <button
                className={`send-btn ${input.trim() ? 'active' : ''}`}
                onClick={send}
                disabled={loading}
                title="发送"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


