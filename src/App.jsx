import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Logo, IconPlus, IconChevron, Background } from './components/icons.jsx';
import AgentSheet from './components/AgentSheet.jsx';
import Chat from './components/Chat.jsx';
import { initTelegram, callEndpoint, haptic, isTelegram } from './lib/tg.js';
import { fetchAgents, fetchHistory, sendUserMessage, startConversation, errorText } from './lib/api.js';

export default function App() {
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState('chat');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const lastSent = useRef(null);

  useEffect(() => {
    initTelegram();
    if (!isTelegram()) {
      setNotice('Открой этот экран через Telegram — приложение работает внутри бота SawaPApp.');
    }
    (async () => {
      try {
        const list = await fetchAgents();
        setAgents(list);
        try {
          const hist = await fetchHistory(null, null);
          setAgentId(hist.agentId || 'chat');
          setConversationId(hist.conversationId ?? null);
          setMessages(hist.messages ?? []);
        } catch (_) {}
      } catch (e) {
        setError(errorText(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const agent = agents.find((a) => a.id === agentId) || agents[0];

  const handleSend = useCallback(async (text) => {
    if (sending) return;
    lastSent.current = { text, agentId, conversationId };
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: 'user', content: text }]);
    setSending(true);
    setError(null);
    try {
      const res = await sendUserMessage({ text, agentId, conversationId });
      setConversationId(res.conversationId ?? conversationId);
      setAgentId(res.agentId ?? agentId);
      setMessages((prev) => [...prev, { id: `a-${res.conversationId}-${Date.now()}`, role: 'assistant', content: res.reply, agentId: res.agentId }]);
    } catch (e) {
      setError(errorText(e));
      setMessages((prev) => prev.filter((m) => m.content !== text || m.role !== 'user'));
    } finally {
      setSending(false);
    }
  }, [sending, agentId, conversationId]);

  const handleRetry = useCallback(() => {
    if (lastSent.current) handleSend(lastSent.current.text);
    else setError(null);
  }, [handleSend]);

  const handleSelectAgent = useCallback(async (a) => {
    setSheetOpen(false);
    if (a.id === agentId) return;
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
  }, [agentId]);

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

  return (
    <div className="app" style={{ '--accent': agent?.color ?? '#7C8CF8' }}>
      <Background />
      <header className="header">
        <div className="brand">
          <Logo size={30} />
          <span className="brand-name">SawaPApp</span>
        </div>
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
          onSend={handleSend}
          onRetry={handleRetry}
        />
      )}

      <AgentSheet
        open={sheetOpen}
        agents={agents}
        currentId={agentId}
        onSelect={handleSelectAgent}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
