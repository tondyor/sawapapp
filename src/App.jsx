import React, { useEffect, useState, useRef, useCallback } from 'react';
import { IconPlus, IconChevron, Background } from './components/icons.jsx';
import AgentSheet from './components/AgentSheet.jsx';
import Chat from './components/Chat.jsx';
import { initTelegram, callEndpoint, haptic, isTelegram } from './lib/tg.js';
import {
  fetchAgents,
  fetchHistory,
  fetchConversations,
  deleteConversation,
  forkConversation,
  editMessage as editMsg,
  sendUserMessage,
  startConversation,
  errorText,
} from './lib/api.js';
import Drawer from './components/Drawer.jsx';

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
  const [reasoningLevel, setReasoningLevel] = useState('fast');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
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
          setReasoningLevel(hist.reasoning || 'fast');
        } catch (_) {}
      } catch (e) {
        setError(errorText(e));
      } finally {
        setLoading(false);
      }
    })();
    refreshConversations();
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetchConversations();
      setConversations(res.conversations ?? []);
    } catch (_) {}
  }, []);

  const agent = agents.find((a) => a.id === agentId) || agents[0];

  const handleSend = useCallback(async (text, attachment = null, fileObj = null) => {
    if (sending) return;
    lastSent.current = { text, agentId, conversationId };
    const localAtt = fileObj
      ? [{ fileId: `local-${Date.now()}`, name: fileObj.name, mime: fileObj.type, size: fileObj.size, localUrl: URL.createObjectURL(fileObj) }]
      : null;
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: 'user', content: text || (localAtt ? localAtt[0].name : ''), attachments: localAtt }]);
    setSending(true);
    setError(null);
    try {
      const res = await sendUserMessage({ text, agentId, conversationId, reasoning: reasoningLevel, attachmentIds: attachment ? [attachment.fileId] : undefined });
      setConversationId(res.conversationId ?? conversationId);
      setAgentId(res.agentId ?? agentId);
      setMessages((prev) => [...prev, { id: `a-${res.conversationId}-${Date.now()}`, role: 'assistant', content: res.reply, agentId: res.agentId }]);
    } catch (e) {
      setError(errorText(e));
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('tmp-')));
    } finally {
      setSending(false);
      refreshConversations();
    }
  }, [sending, agentId, conversationId, reasoningLevel, refreshConversations]);

  const handleRetry = useCallback(() => {
    if (lastSent.current) handleSend(lastSent.current.text);
    else setError(null);
  }, [handleSend]);

  const handleSelectAgent = useCallback((a) => {
    setSheetOpen(false);
    if (a.id === agentId) return;
    setAgentId(a.id);
    setError(null);
  }, [agentId]);

  const handleNewChat = useCallback(async () => {
    haptic();
    setMessages([]);
    setError(null);
    try {
      const res = await startConversation(agentId);
      setConversationId(res.conversationId ?? null);
      refreshConversations();
    } catch (e) {
      setNotice(errorText(e));
      setConversationId(null);
    }
  }, [agentId, refreshConversations]);

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
      setDrawerOpen(false);
      const hist = await fetchHistory(null, res.conversationId);
      setConversationId(hist.conversationId ?? res.conversationId);
      setAgentId(hist.agentId || agentId);
      setMessages(hist.messages ?? []);
      setReasoningLevel(hist.reasoning || 'fast');
      refreshConversations();
    } catch (e) {
      setNotice(errorText(e));
    }
  }, [agentId, refreshConversations]);

  const handleEditSave = useCallback(async (messageId, content, reasoning) => {
    setSending(true);
    setError(null);
    try {
      const res = await editMsg({ messageId, content, reasoning });
      setConversationId(res.conversationId ?? conversationId);
      setAgentId(res.agentId ?? agentId);
      if (res.reply) {
        setMessages((prev) => {
          const cut = prev.findIndex((m) => m.id === messageId);
          return [...prev.slice(0, cut + 1), { id: `a-${Date.now()}`, role: 'assistant', content: res.reply, agentId: res.agentId, meta: res.meta }];
        });
      } else {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content } : m)));
      }
      setEditingId(null);
      setEditContent('');
      refreshConversations();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSending(false);
    }
  }, [conversationId, agentId, reasoningLevel, refreshConversations]);

  const handleForkMessage = useCallback(async (messageId) => {
    if (!conversationId) return;
    try {
      const res = await forkConversation(conversationId, messageId);
      const hist = await fetchHistory(null, res.conversationId);
      setConversationId(hist.conversationId ?? res.conversationId);
      setAgentId(hist.agentId || agentId);
      setMessages(hist.messages ?? []);
      setReasoningLevel(hist.reasoning || 'fast');
      refreshConversations();
    } catch (e) {
      setNotice(errorText(e));
    }
  }, [conversationId, agentId, refreshConversations]);

  return (
    <div className="app" style={{ '--accent': agent?.color ?? '#7C8CF8' }}>
      <Background />
      <header className="header">
        <button className="icon-btn" onClick={() => { haptic(); setDrawerOpen(true); }} aria-label="История чатов">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
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
          editingId={editingId}
          editContent={editContent}
          onEditChange={setEditContent}
          onEditSave={handleEditSave}
          onEditCancel={() => { setEditingId(null); setEditContent(''); }}
          onCopy={(t) => {
            navigator.clipboard.writeText(t).then(() => { haptic(); setNotice('Скопировано'); setTimeout(() => setNotice(null), 1200); });
          }}
          onEditMessage={setEditingId}
          onForkMessage={handleForkMessage}
          agentName={agent?.name ?? 'Агент'}
          onSelectAgent={() => { haptic(); setSheetOpen(true); }}
          onNotice={setNotice}
        />
      )}

      <AgentSheet
        open={sheetOpen}
        agents={agents}
        currentId={agentId}
        onSelect={handleSelectAgent}
        onClose={() => setSheetOpen(false)}
      />

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
