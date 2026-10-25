import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Logo, IconPlus, IconChevron, Background } from './components/icons.jsx';
import AgentSheet from './components/AgentSheet.jsx';
import Drawer from './components/Drawer.jsx';
import Chat from './components/Chat.jsx';
import { initTelegram, haptic, isTelegram } from './lib/tg.js';
import {
  fetchAgents,
  fetchHistory,
  fetchConversations,
  sendUserMessage,
  startConversation,
  deleteConversation,
  forkConversation,
  editMessage as editMsg,
  regenerate as regenerateMessage,
  errorText,
} from './lib/api.js';

const LEVEL_LABELS = { fast: 'Быстро', light: 'Лёгкий', medium: 'Средний', high: 'Высокий', max: 'Max' };

export default function App() {
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState('chat');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [reasoningLevel, setReasoningLevel] = useState('fast');
  const [notice, setNotice] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [expandedTraceId, setExpandedTraceId] = useState(null);
  const lastSent = useRef(null);

  const agent = agents.find((a) => a.id === agentId) || agents[0];

  useEffect(() => {
    initTelegram();
    if (!isTelegram()) {
      setNotice('Открой этот экран через Telegram — приложение работает внутри бота SawaPApp.');
    }
    const load = async () => {
      try {
        const [list, convs] = await Promise.all([fetchAgents(), fetchConversations()]);
        setAgents(list);
        setConvos(conversations ?? []);
      } catch (e) {
        setNotice(errorText(e));
      }
      try {
        const hist = await fetchHistory(null, null);
        setAgentId(hist.agentId || 'chat');
        setConversationId(hist.conversationId ?? null);
        setMessages(hist.messages ?? []);
        setReasoningLevel(hist.reasoning || 'fast');
      } catch (e) {}
    };
    load();
  }, []);

  const setConvos = useCallback((c) => setConversations(c ?? []), []);

  const handleSend = useCallback(
    async (text) => {
      if (sending) return;
      lastSent.current = { text, agentId, conversationId };
      setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: 'user', content: text }]);
      setSending(true);
      setError(null);
      try {
        const res = await sendUserMessage({ text, agentId, conversationId, reasoning: reasoningLevel });
        setConversationId(res.conversationId ?? conversationId);
        setAgentId(res.agentId ?? agentId);
        setMessages((prev) => [...prev.filter((m) => m.id !== `tmp-${Date.now()}`), { id: `a-${res.conversationId}-${Date.now()}`, role: 'assistant', content: res.reply, agentId: res.agentId, meta: res.meta }]);
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== `tmp-${Date.now()}`));
        setError(errorText(e));
      } finally {
        setSending(false);
      }
    },
    [sending, agentId, conversationId, reasoningLevel]
  );

  const handleRetry = useCallback(async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user' && !m.id.startsWith('tmp-'));
    if (!lastUser) { setError(null); return; }
    setSending(true);
    setError(null);
    try {
      const res = await regenerateMessage({ messageId: lastUser.id, reasoning: reasoningLevel });
      setConversationId(res.conversationId ?? conversationId);
      setAgentId(res.agentId ?? agentId);
      setMessages((prev) => {
        const cut = prev.findIndex((m) => m.id === lastUser.id);
        return [...prev.slice(0, cut + 1), { id: `a-${res.conversationId}-${Date.now()}`, role: 'assistant', content: res.reply, agentId: res.agentId, meta: res.meta }];
      });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSending(false);
    }
  }, [messages, conversationId, agentId, reasoningLevel]);

  const handleSelectAgent = useCallback(async (a) => {
    setSheetOpen(false);
    setAgentId(a.id);
    setMessages([]);
    setError(null);
    try {
      const res = await startConversation(a.id);
      setConversationId(res.conversationId ?? null);
    } catch (e) {
      setNotice(errorText(e));
      setConversationId(null);
    }
  }, []);

  const handleNewChat = useCallback(async () => {
    haptic();
    setMessages([]);
    setError(null);
    try {
      const res = await startConversation(agentId);
      setConversationId(res.conversationId ?? null);
    } catch (e) {
      setNotice(errorText(e));
      setConversationId(null);
    }
  }, [agentId]);

  const handleOpenConversation = useCallback(async (id) => {
    setDrawerOpen(false);
    setError(null);
    try {
      const hist = await fetchHistory(null, id);
      setConversationId(hist.conversationId ?? id);
      setAgentId(hist.agentId || agentId);
      setMessages(hist.messages ?? []);
      setReasoningLevel(hist.reasoning || 'fast');
    } catch (e) {
      setNotice(errorText(e));
    }
  }, [agentId]);

  const handleDeleteConversation = useCallback(async (id) => {
    if (!confirm('Удалить этот диалог?')) return;
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
        setError(null);
      }
    } catch (e) {
      setNotice(errorText(e));
    }
  }, [conversationId]);

  const handleForkConversation = useCallback(async (id) => {
    try {
      const res = await forkConversation(id);
      const hist = await fetchHistory(null, res.conversationId);
      setDrawerOpen(false);
      setConversationId(hist.conversationId ?? res.conversationId);
      setAgentId(hist.agentId || agentId);
      setMessages(hist.messages ?? []);
      setReasoningLevel(hist.reasoning || 'fast');
      setConversations((prev) => [...prev, { id: res.conversationId, agentId: res.agentId, title: 'Копия диалога', reasoning: 'fast', updatedAt: Date.now(), preview: null, previewRole: null }]);
    } catch (e) {
      setNotice(errorText(e));
    }
  }, [agentId]);

  const handleEditSave = useCallback(
    async (messageId, content, reasoning) => {
      setSending(true);
      setError(null);
      try {
        const res = await editMsg({ messageId, content, reasoning });
        setConversationId(res.conversationId ?? conversationId);
        setAgentId(res.agentId ?? agentId);
        if (res.reply) {
          setMessages((prev) => {
            const cut = prev.findIndex((m) => m.id === messageId);
            return [...prev.slice(0, cut + 1), { id: `a-${res.conversationId}-${Date.now()}`, role: 'assistant', content: res.reply, agentId: res.agentId, meta: res.meta }];
          });
        } else {
          setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content } : m)));
        }
        setEditingId(null);
        setEditContent('');
      } catch (e) {
        setError(errorText(e));
      } finally {
        setSending(false);
      }
    },
    [conversationId, agentId, reasoningLevel]
  );

  const handleRegenerateMessage = useCallback(
    async (messageId) => {
      setSending(true);
      setError(null);
      try {
        const res = await regenerateMessage({ messageId, reasoning: reasoningLevel });
        setConversationId(res.conversationId ?? conversationId);
        setAgentId(res.agentId ?? agentId);
        setMessages((prev) => {
          const cut = prev.findIndex((m) => m.id === messageId);
          return cut >= 0 ? [...prev.slice(0, cut), { id: `a-${res.conversationId}-${Date.now()}`, role: 'assistant', content: res.reply, agentId: res.agentId, meta: res.meta }] : prev;
        });
      } catch (e) {
        setError(errorText(e));
      } finally {
        setSending(false);
      }
    },
    [conversationId, agentId, reasoningLevel]
  );

  return (
    <div className="app" style={{ '--accent': agent?.color ?? '#7C8CF8' }}>
      <Background />
      <header className="header">
        <div className="brand">
          <Logo size={30} />
          <span className="brand-name">SawaPApp</span>
        </div>
        <button className="icon-btn" onClick={() => { haptic(); setDrawerOpen(true); }} aria-label="История чатов">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="agent-pill" onClick={() => { haptic(); setSheetOpen(true); }}>
          <span className="pill-dot" />
          <span className="pill-name">{agent?.name ?? 'Агент'}</span>
          <IconChevron size={14} />
        </button>
        <button className="icon-btn" onClick={handleNewChat} aria-label="Новый диалог">
          <IconPlus size={18} />
        </button>
      </header>

      {notice && <div className="notice">{notice}</div>}

      {loading ? (
        <div className="loader">Загрузка…</div>
      ) : (
        <Chat
          agents={agents}
          agentId={agentId}
          conversationId={conversationId}
          messages={messages}
          sending={sending}
          error={error}
          reasoningLevel={reasoningLevel}
          onChangeReasoning={setReasoningLevel}
          onSend={handleSend}
          onRetry={handleRetry}
          onEditChange={setEditContent}
          onEditSave={handleEditSave}
          onEditCancel={() => { setEditingId(null); setEditContent(''); }}
          onCopy={(text) => {
            navigator.clipboard.writeText(text).then(() => { haptic(); setNotice('Скопировано'); setTimeout(() => setNotice(null), 1200); });
          }}
          onEditMessage={setEditingId}
          onRegenerateMessage={handleRegenerateMessage}
          onExpandTrace={setExpandedTraceId}
          expandedTraceId={expandedTraceId}
        />
      )}

      <AgentSheet open={sheetOpen} agents={agents} currentId={agentId} onSelect={handleSelectAgent} onClose={() => setSheetOpen(false)} />

      <Drawer
        open={drawerOpen}
        conversations={conversations}
        currentId={conversationId}
        onOpen={handleOpenConversation}
        onDelete={handleDeleteConversation}
        onFork={handleForkConversation}
        onNewChat={handleNewChat}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
