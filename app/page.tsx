"use client";

import { useEffect, useRef, useState } from 'react';
import UserGuide from '../components/UserGuide';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768; // 手机端默认折叠
    }
    return false;
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const creatingConversationRef = useRef<boolean>(false);

  // 语音录制相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const isRecordingRef = useRef(false); // 使用ref跟踪实时录音状态

  // 用户引导相关状态
  const [showUserGuide, setShowUserGuide] = useState(false);

  // 聊天次数限制相关状态
  const [chatCountInConversation, setChatCountInConversation] = useState(0);
  const [showChatLimitWarning, setShowChatLimitWarning] = useState(false);
  const MAX_CHATS_PER_CONVERSATION = 50;
  const WARNING_THRESHOLD = 45;

  // 输入字数限制
  const MAX_INPUT_LENGTH = 1500;

  // 自动调整输入框高度
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // 使用视口高度的30%作为最大高度，最小高度为120px
      const maxHeight = Math.min(window.innerHeight * 0.3, 300);
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = Math.max(newHeight, 120) + 'px';
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // 防止在加载中重复发送
      if (!loading) {
        send();
      }
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
        // 修复：将新对话添加到数组开头，与其他地方保持一致
        setConversations(prev => [conv, ...prev]);
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

  // 获取用户信息的函数
  const fetchUserInfo = async () => {
    try {
      console.log('🔍 开始获取用户信息...');
      const m = await fetch('/api/me');
      console.log('📱 /api/me 响应状态:', m.status);
      if (m.ok) {
        const j = await m.json();
        console.log('✅ 用户信息获取成功:', j);
        setMe(j.nickname || '');
        setMePhone(j.phone || '');
        setAuthed(true);

        // 检查是否需要显示用户引导
        const hasSeenGuide = localStorage.getItem(`user_guide_seen_${j.phone}`);
        console.log('🎯 新手引导检查:', {
          phone: j.phone,
          hasSeenGuide: hasSeenGuide,
          willShowGuide: !hasSeenGuide
        });
        if (!hasSeenGuide) {
          console.log('✅ 显示新手引导');
          setShowUserGuide(true);
        } else {
          console.log('⏭️ 跳过新手引导（已看过）');
        }

        // 获取用户权限信息
        console.log('🔍 开始获取用户权限...');
        const p = await fetch('/api/user/permission');
        console.log('📱 /api/user/permission 响应状态:', p.status);
        if (p.ok) {
          const permData = await p.json();
          console.log('✅ 用户权限获取成功:', permData);
          setPermission(permData.data);
        } else {
          console.error('❌ 用户权限获取失败:', p.status);
        }
      } else {
        console.error('❌ 用户信息获取失败:', m.status);
        setAuthed(false);
      }
    } catch (error) {
      console.error('❌ 获取用户信息异常:', error);
      setAuthed(false);
    }
  };

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/conversations');
      if (r.ok) {
        const data = await r.json();
        setConversations(data.list || []);
        if (!activeConv && data.list?.[0]) setActiveConv(data.list[0].id);
      }
      await fetchUserInfo();
    })();
  }, []);

  // 监听页面可见性变化，当从其他页面返回时重新获取用户信息
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 页面重新可见，刷新用户信息');
        fetchUserInfo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);


  //  监听窗口大小变化，自动调整侧边栏状态（移动端默认折叠）
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setSidebarCollapsed(isMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // 当切换会话时拉取历史消息
  useEffect(() => {
    if (!activeConv) return;
    (async () => {
      try {
        console.log('🔄 开始加载对话消息:', activeConv);
        const r = await fetch(`/api/conversations/${activeConv}`);
        console.log('📡 API响应状态:', r.status, r.ok);
        if (r.ok) {
          const data = await r.json();
          console.log('📦 API返回的原始数据:', data);
          const list = (data.list || []) as { id:string; role:'user'|'assistant'|'system'; content:string }[];
          console.log('📋 解析后的消息列表:', {
            length: list.length,
            sample: list.slice(0, 3),
            roles: list.map(m => m.role)
          });
          if (list && list.length > 0) {
            setMessages(list.map(m => ({ id: m.id, role: m.role, content: m.content })));
            // 计算当前对话中的用户消息数（聊天次数）
            const userMessageCount = list.filter(m => m.role === 'user').length;
            console.log('📊 聊天次数统计:', {
              conversationId: activeConv,
              totalMessages: list.length,
              userMessages: userMessageCount,
              warningThreshold: WARNING_THRESHOLD,
              maxChats: MAX_CHATS_PER_CONVERSATION,
              shouldShowWarning: userMessageCount >= WARNING_THRESHOLD && userMessageCount < MAX_CHATS_PER_CONVERSATION
            });
            setChatCountInConversation(userMessageCount);
            // 检查是否需要显示警告
            if (userMessageCount >= WARNING_THRESHOLD && userMessageCount < MAX_CHATS_PER_CONVERSATION) {
              console.log('⚠️ 显示聊天次数警告');
              setShowChatLimitWarning(true);
            } else {
              console.log('✅ 不显示警告');
              setShowChatLimitWarning(false);
            }
          } else {
            // 如果没有消息，保持当前消息列表，不要清空
            console.log('⚠️ 对话中没有消息，保持当前状态');
            setChatCountInConversation(0);
            setShowChatLimitWarning(false);
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

    // 检查聊天次数限制
    if (chatCountInConversation >= MAX_CHATS_PER_CONVERSATION) {
      alert(`当前对话已达到${MAX_CHATS_PER_CONVERSATION}次聊天上限，请创建新的聊天来继续。`);
      return;
    }

    console.log('🚀 开始发送消息:', input.trim());

    // 确保有聊天记录，并等待创建完成
    const convId = await ensureConversation();
    console.log('📝 获取到的对话ID:', { convId, activeConv });

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

    // 更新聊天计数
    const newChatCount = chatCountInConversation + 1;
    setChatCountInConversation(newChatCount);

    // 检查是否需要显示警告
    if (newChatCount >= WARNING_THRESHOLD && newChatCount < MAX_CHATS_PER_CONVERSATION) {
      setShowChatLimitWarning(true);
    }

    // 确保有活跃的对话ID，优先使用新创建的对话ID
    const currentConvId = convId || activeConv;
    if (!activeConv && convId) {
      setActiveConv(convId);
    }

    // 重置输入框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = '120px';
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

    console.log('📤 发送到 /api/chat:', {
      query: userMsg.content,
      conversation_id: currentConvId,
      client_conversation_id: currentConvId
    });

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userMsg.content,
        conversation_id: currentConvId, // 修复：使用当前有效的对话ID
        client_conversation_id: currentConvId, // 使用当前有效的对话ID
      }),
    });

    console.log('📥 /api/chat 响应状态:', res.status);

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
                ? '您的5次免费使用已用完，请升级到付费版本继续使用。'
                : errorData.permission?.usedChats >= errorData.permission?.chatLimit
                ? `免费次数已用完，请升级继续使用。`
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
      if (done) {
        console.log('✅ 流式响应完成，最终内容:', {
          length: assistantText.length,
          preview: assistantText.substring(0, 100) + '...',
          end: '...' + assistantText.substring(assistantText.length - 100),
          hasNewlines: assistantText.includes('\n'),
          newlineCount: (assistantText.match(/\n/g) || []).length,
          endsWithPunctuation: /[。！？，、；：.!?,;:]$/.test(assistantText.trim())
        });
        if (!assistantText.trim().match(/[。！？.!?]$/)) {
          console.warn('⚠️ 警告: AI回复可能不完整（没有结束标点符号）');
        }
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      console.log('📦 收到chunk:', {
        length: chunk.length,
        preview: chunk.substring(0, 50),
        hasCID: chunk.includes('CID:')
      });

      // 检查是否包含 CID: 标记
      if (chunk.includes('CID:')) {
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('CID:')) {
            const cid = line.slice(4).trim();
            if (cid) {
              conversationIdRef.current = cid;
              try { localStorage.setItem('cid', cid); } catch {}
            }
          } else if (line) {
            // 过滤掉可能的 [object Object] 内容
            if (line.includes('[object Object]') || line.includes('[Object object]')) {
              console.log('⚠️ 过滤掉 [object Object]:', line);
              continue;
            }
            assistantText += line;
          }
        }
      } else {
        // 过滤掉可能的 [object Object] 内容
        if (chunk.includes('[object Object]') || chunk.includes('[Object object]')) {
          console.log('⚠️ 过滤掉 [object Object]:', chunk);
          continue;
        }
        // 直接追加内容，保留所有格式（包括换行符）
        assistantText += chunk;
      }

      // 只在第一次创建消息，后续只更新内容
      if (isFirstChunk && assistantText) {
        const assistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: assistantText
        };
        setMessages(prev => [...prev, assistantMessage]);
        assistantMessageId = assistantMessage.id;
        isFirstChunk = false;
      } else if (assistantText) {
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

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🎤 初始化语音识别...');
      console.log('🌐 浏览器信息:', navigator.userAgent);

      // 检测浏览器类型
      const isEdge = navigator.userAgent.includes('Edg/');
      const isChrome = navigator.userAgent.includes('Chrome/') && !isEdge;
      const isSafari = navigator.userAgent.includes('Safari/') && !isChrome && !isEdge;

      console.log('🌐 浏览器类型:', { isEdge, isChrome, isSafari });

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        console.log('✅ 浏览器支持语音识别');

        try {
          const recognition = new SpeechRecognition();

          // 配置语音识别参数
          recognition.continuous = true;  // 持续识别，不自动停止
          recognition.interimResults = true;  // 显示中间结果
          recognition.lang = 'zh-CN';

          // Edge浏览器特殊配置
          if (isEdge) {
            console.log('🔧 为Edge浏览器优化配置');
            recognition.maxAlternatives = 1;
            // Edge浏览器可能需要更保守的配置
            recognition.continuous = false;  // Edge浏览器先使用非持续模式
            recognition.interimResults = false;  // Edge浏览器先禁用中间结果
          }

          recognition.onstart = () => {
            console.log('🎤 语音识别已启动');
            isRecordingRef.current = true;
            setIsRecording(true);
          };

          recognition.onresult = (event: any) => {
            console.log('🎤 语音识别结果:', event.results);
            console.log('🎤 结果数量:', event.results.length);

            if (event.results && event.results.length > 0) {
              let finalTranscript = '';
              let interimTranscript = '';

              // 处理所有结果
              for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                console.log(`🎤 结果[${i}]:`, {
                  transcript,
                  isFinal: event.results[i].isFinal,
                  confidence: event.results[i][0].confidence
                });

                if (event.results[i].isFinal) {
                  finalTranscript += transcript;
                } else {
                  interimTranscript += transcript;
                }
              }

              console.log('📝 最终文字:', finalTranscript);
              console.log('📝 中间文字:', interimTranscript);

              // Edge浏览器在非持续模式下，可能所有结果都不是isFinal
              // 所以我们需要在识别结束时获取最后的结果
              // 这里先处理最终结果
              if (finalTranscript) {
                console.log('✅ 添加最终识别文字到输入框:', finalTranscript);
                setInput(prev => {
                  const newValue = prev + finalTranscript;
                  console.log('📝 更新后的输入框内容:', newValue);
                  return newValue;
                });
                setTimeout(adjustTextareaHeight, 10);
              } else if (isEdge && interimTranscript) {
                // Edge浏览器特殊处理：如果没有最终结果但有中间结果，也添加到输入框
                console.log('⚠️ Edge浏览器：使用中间结果作为最终结果');
                setInput(prev => {
                  const newValue = prev + interimTranscript;
                  console.log('📝 更新后的输入框内容:', newValue);
                  return newValue;
                });
                setTimeout(adjustTextareaHeight, 10);
              }
            }
          };

          recognition.onend = () => {
            console.log('🎤 语音识别结束');
            console.log('🎤 当前isRecording状态:', isRecordingRef.current);
            console.log('🎤 当前浏览器是Edge:', isEdge);

            // Edge浏览器在非持续模式下，识别结束后自动停止
            if (isEdge) {
              console.log('✅ Edge浏览器：识别结束，自动停止录音');
              isRecordingRef.current = false;
              setIsRecording(false);
              return;
            }

            // 只有在用户主动停止时才设置为false，否则自动重启
            if (!isRecordingRef.current) {
              console.log('🎤 用户主动停止，不重启');
              return;
            }

            // 如果是意外结束，尝试重启（但有限制）
            console.log('🎤 意外结束，尝试重启...');
            setTimeout(() => {
              if (isRecordingRef.current && recognition) {
                try {
                  recognition.start();
                  console.log('🎤 语音识别重启成功');
                } catch (error) {
                  console.error('❌ 语音识别重启失败:', error);
                  isRecordingRef.current = false;
                  setIsRecording(false);
                }
              }
            }, 100);
          };

          recognition.onerror = (event: any) => {
            console.error('❌ 语音识别错误:', event.error);
            console.error('❌ 错误详情:', event);
            isRecordingRef.current = false;
            setIsRecording(false);

            // Edge浏览器特殊错误处理
            if (isEdge) {
              if (event.error === 'not-allowed') {
                alert('请在Edge浏览器中允许麦克风权限：\n1. 点击地址栏左侧的锁图标\n2. 将麦克风权限设置为"允许"\n3. 刷新页面后重试');
              } else if (event.error === 'no-speech') {
                alert('未检测到语音，请重试');
              } else if (event.error === 'network') {
                alert('网络错误，请检查网络连接后重试');
              } else {
                alert(`Edge浏览器语音识别错误: ${event.error}\n请尝试刷新页面或重启浏览器`);
              }
            } else {
              if (event.error === 'not-allowed') {
                alert('请允许麦克风权限以使用语音输入功能');
              } else if (event.error === 'no-speech') {
                alert('未检测到语音，请重试');
              } else {
                alert(`语音识别失败: ${event.error}`);
              }
            }
          };

          setRecognition(recognition);
          console.log('✅ 语音识别初始化成功');
        } catch (error) {
          console.error('❌ 语音识别初始化失败:', error);
          // Edge浏览器初始化失败时，不设置recognition对象
          // 这样在startRecording时会触发重新初始化
        }
      } else {
        console.error('❌ 浏览器不支持语音识别');
      }
    }
  }, []);

  // 语音录制功能
  const startRecording = () => {
    console.log('🎤 尝试启动语音识别...');
    console.log('🔍 当前状态检查:');
    console.log('- isRecording (state):', isRecording);
    console.log('- isRecording (ref):', isRecordingRef.current);
    console.log('- recognition对象:', !!recognition);
    console.log('- window.location.protocol:', window.location.protocol);

    // 检测浏览器类型
    const isEdge = navigator.userAgent.includes('Edg/');
    console.log('🌐 当前浏览器是Edge:', isEdge);

    // 使用ref检查录音状态，避免闭包问题
    if (isRecordingRef.current) {
      console.log('⚠️ 语音识别已在运行，先停止...');
      stopRecording();
      return;
    }

    // 检查HTTPS要求
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      alert('语音识别功能需要在HTTPS环境下使用，请使用HTTPS访问或在localhost测试');
      return;
    }

    if (!recognition) {
      console.error('❌ 语音识别对象不存在');
      alert('您的浏览器不支持语音识别功能，请使用Chrome、Edge或Safari浏览器');
      return;
    }

    // 启动语音识别
    try {
      console.log('🎤 启动语音识别...');

      // 先设置UI状态为录音中
      isRecordingRef.current = true;
      setIsRecording(true);

      // Edge浏览器特殊处理
      if (isEdge) {
        console.log('🔧 Edge浏览器启动流程');

        // 检查recognition对象的状态
        const recState = (recognition as any).state;
        console.log('🔍 Edge: recognition.state =', recState);

        // 如果已经在运行，先停止
        if (recState === 'running' || recState === 'starting') {
          console.log('⚠️ Edge: 语音识别已在运行，先停止...');
          try {
            recognition.abort();
          } catch (e) {
            console.error('❌ Edge: 停止失败:', e);
          }
          // 等待一下再启动
          setTimeout(() => {
            try {
              recognition.start();
              console.log('✅ Edge: 语音识别重新启动成功');
            } catch (retryError) {
              console.error('❌ Edge: 重新启动失败:', retryError);
              isRecordingRef.current = false;
              setIsRecording(false);
              alert('Edge浏览器语音识别启动失败，请刷新页面后重试');
            }
          }, 200);
          return;
        }

        // 直接启动
        try {
          recognition.start();
          console.log('✅ Edge: 语音识别启动成功');
        } catch (edgeError: any) {
          console.error('❌ Edge: 启动失败:', edgeError);
          isRecordingRef.current = false;
          setIsRecording(false);

          if (edgeError.name === 'InvalidStateError') {
            // 状态错误，尝试重置后再启动
            console.log('🔧 Edge: 检测到InvalidStateError，尝试重置...');
            try {
              recognition.abort();
              setTimeout(() => {
                try {
                  recognition.start();
                  isRecordingRef.current = true;
                  setIsRecording(true);
                  console.log('✅ Edge: 重置后启动成功');
                } catch (retryError) {
                  console.error('❌ Edge: 重置后启动仍失败:', retryError);
                  alert('Edge浏览器语音识别状态错误，请刷新页面后重试');
                }
              }, 200);
            } catch (abortError) {
              console.error('❌ Edge: 重置失败:', abortError);
              alert('Edge浏览器语音识别状态错误，请刷新页面后重试');
            }
          } else if (edgeError.name === 'NotAllowedError') {
            alert('请在Edge浏览器中允许麦克风权限：\n1. 点击地址栏左侧的锁图标\n2. 将麦克风权限设置为"允许"\n3. 刷新页面后重试');
          } else {
            alert(`Edge浏览器语音识别错误: ${edgeError.message}\n请尝试刷新页面`);
          }
        }
      } else {
        // 其他浏览器的处理
        if ((recognition as any).state && (recognition as any).state !== 'inactive') {
          console.log('⚠️ 语音识别状态异常，重置...');
          recognition.abort();
          setTimeout(() => {
            recognition.start();
          }, 100);
        } else {
          recognition.start();
        }
      }
    } catch (error: any) {
      console.error('❌ 启动语音识别失败:', error);
      isRecordingRef.current = false;
      setIsRecording(false);

      if (isEdge) {
        if (error.name === 'InvalidStateError') {
          alert('Edge浏览器语音识别状态异常，请刷新页面后重试');
        } else if (error.name === 'NotAllowedError') {
          alert('请在Edge浏览器中允许麦克风权限：\n1. 点击地址栏左侧的锁图标\n2. 将麦克风权限设置为"允许"\n3. 刷新页面后重试');
        } else {
          alert(`Edge浏览器启动语音识别失败: ${error.message}\n请尝试刷新页面`);
        }
      } else {
        if (error.name === 'InvalidStateError') {
          alert('语音识别状态异常，请刷新页面后重试');
        } else if (error.name === 'NotAllowedError') {
          alert('请允许麦克风权限后重试');
        } else if (error.name === 'NotFoundError') {
          alert('未找到麦克风设备，请检查您的麦克风是否正常连接');
        } else {
          alert(`启动语音识别失败: ${error.message}`);
        }
      }
    }
  };

  const stopRecording = () => {
    console.log('🛑 用户主动停止语音识别...');
    console.log('- isRecording (state):', isRecording);
    console.log('- isRecording (ref):', isRecordingRef.current);
    console.log('- recognition对象:', !!recognition);

    // 先设置状态，防止onend事件重启
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognition) {
      try {
        console.log('🛑 执行停止操作...');
        recognition.stop(); // 使用stop而不是abort，确保获取最后的结果
      } catch (error) {
        console.error('❌ 停止语音识别失败:', error);
        // 如果stop失败，尝试abort
        try {
          recognition.abort();
        } catch (abortError) {
          console.error('❌ 强制停止语音识别也失败:', abortError);
        }
      }
    }
  };

  // 关闭用户引导
  const handleCloseUserGuide = () => {
    setShowUserGuide(false);
    if (mePhone) {
      localStorage.setItem(`user_guide_seen_${mePhone}`, 'true');
    }
  };

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
        {/* 移动端浮动开关按钮 */}
        <button
          className="sidebar-fab"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="切换侧边栏"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        {/* 左侧边栏 */}
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {/* 顶部品牌区域 */}
          <div className="sidebar-header">
            <div className="brand-logo">
              <div className="logo-icon">
                <span className="logo-text">S</span>
              </div>
              <div className="brand-title">赛斯AI小助手</div>
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                {sidebarCollapsed ? (
                  <path d="M9 18l6-6-6-6" />
                ) : (
                  <path d="M15 18l-6-6 6-6" />
                )}
              </svg>
            </button>

          </div>

          {/* 聊天记录标签 */}
          <div className="chat-history-header">
            <div className="chat-history-label">聊天记录</div>
          </div>

          {/* 发起新对话按钮 */}
          <button
            className="new-conversation-btn"
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chat-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>发起新对话</span>
          </button>

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
                      <span style={{ color: '#F59E0B' }}>免费用户</span>
                    ) : (
                      <span style={{ color: '#EF4444' }}>免费次数已用完</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#8A94B3'
                  }}>
                    {permission.isPaidUser ? (
                      `今日聊天：${permission.usedChats}次`
                    ) : (
                      `已使用：${permission.usedChats}/${permission.chatLimit}次`
                    )}
                  </div>

                  {/* 升级按钮和客服提示 */}
                  {(!permission.isPaidUser && (!permission.isTrialActive || permission.usedChats >= permission.chatLimit)) && (
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href="/pricing"
                        style={{
                          display: 'block',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #C8B6E2 0%, #8A94B3 100%)',
                          color: '#1A1D33',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          marginBottom: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {!permission.isTrialActive ? '免费次数已用完，立即升级' : '次数已用完，升级无限制'}
                      </a>

                      {/* 客服联系提示 */}
                      {!permission.isTrialActive && (
                        <div style={{
                          fontSize: '11px',
                          color: '#8A94B3',
                          textAlign: 'center',
                          lineHeight: '1.4'
                        }}>
                          请进入
                          <a
                            href="/account"
                            style={{
                              color: '#C8B6E2',
                              textDecoration: 'underline',
                              margin: '0 2px'
                            }}
                          >
                            个人中心
                          </a>
                          联系客服购买激活码激活套餐
                        </div>
                      )}
                    </div>
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
        <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
            {/* 聊天次数限制警告 */}
            {(() => {
              const shouldShow = showChatLimitWarning && chatCountInConversation >= WARNING_THRESHOLD && chatCountInConversation < MAX_CHATS_PER_CONVERSATION;
              console.log('🔍 警告框渲染检查:', {
                showChatLimitWarning,
                chatCountInConversation,
                WARNING_THRESHOLD,
                MAX_CHATS_PER_CONVERSATION,
                shouldShow
              });
              return shouldShow ? (
                <div className="chat-limit-warning">
                  <div className="warning-content">
                    <span className="warning-icon">⚠️</span>
                    <span className="warning-text">
                      已聊天 {chatCountInConversation}/{MAX_CHATS_PER_CONVERSATION} 次，建议做聊天小结后创建新的聊天
                    </span>
                  </div>
                </div>
              ) : null;
            })()}
            <div className="composer">
              <textarea
                rows={1}
                className="message-input"
                value={input}
                onChange={e => {
                  const newValue = e.target.value;
                  // 限制输入字数
                  if (newValue.length <= MAX_INPUT_LENGTH) {
                    setInput(newValue);
                    adjustTextareaHeight();
                  }
                }}
                placeholder="问问赛斯"
                style={{
                  minHeight: '120px',
                  maxHeight: '30vh',
                  fontSize: '16px',
                  lineHeight: '1.6'
                }}
                ref={textareaRef}
                onInput={adjustTextareaHeight}
                onKeyUp={handleKeyDown}
                onKeyDown={handleKeyDown}
              />
              {/* 字数统计 */}
              <div style={{
                position: 'absolute',
                bottom: '60px',
                right: '20px',
                fontSize: '12px',
                color: input.length > MAX_INPUT_LENGTH * 0.9 ? '#ff6b6b' : '#8A94B3',
                pointerEvents: 'none'
              }}>
                {input.length}/{MAX_INPUT_LENGTH}
              </div>
              <div className="input-actions">
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
      </div>

      {/* 用户引导弹窗 */}
      {showUserGuide && mePhone && (
        <UserGuide phone={mePhone} onClose={handleCloseUserGuide} />
      )}
    </main>
  );
}


