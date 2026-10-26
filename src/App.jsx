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
  startConversation,
  getTurnEvents,
  errorText,
} from './lib/api.js';
import Drawer from './components/Drawer.jsx';
import { eventsFromMeta } from './lib/trace.js';
import {
  startTurn as apiStartTurn,
  runTurnStep as apiRunTurnStep,
  finishTurn as apiFinishTurn,
  getTurnState,
  stopTurn as apiStopTurn,
} from './lib/api.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function newTurnId() {
  return 't-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

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
  const [liveTurn, setLiveTurn] = useState(null); // { turnId, startedAt, events, pipeline }
  const [resumeTurn, setResumeTurn] = useState(null); // активный ход диалога для баннера возобновления
  const lastSent = useRef(null);
  const pollCancel = useRef(null);

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
          if (hist.conversationId) checkResumeTurn(hist.conversationId);
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

  // ── Поллинг хода агента: события пишутся в БД по мере генерации ──────────
  const runTurnPolling = useCallback((turnId) => {
    let cancelled = false;
    pollCancel.current = () => { cancelled = true; };
    const promise = (async () => {
      let afterId = 0;
      let stallMs = 0;
      for (;;) {
        if (cancelled) return null;
        try {
          const res = await getTurnEvents(turnId, afterId);
          stallMs = 0;
          if (res.events.length) {
            afterId = res.lastId;
            setLiveTurn((t) => (t && t.turnId === turnId ? { ...t, events: [...t.events, ...res.events] } : t));
          }
          if (res.done) return res;
        } catch (_) {
          stallMs += 800;
        }
        await sleep(stallMs > 60000 ? 3000 : 800);
      }
    })();
    return { promise, cancel: () => { cancelled = true; } };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollCancel.current) { pollCancel.current(); pollCancel.current = null; }
  }, []);

  // Финализация хода: ответ могли принести и основной вызов, и done-событие.
  const applyAssistant = useCallback((turnId, res, convIdFromRes) => {
    setConversationId((cur) => res.conversationId ?? convIdFromRes ?? cur);
    setAgentId((cur) => res.agentId ?? cur);
    setMessages((prev) => [...prev, {
      id: `a-${res.conversationId ?? 'x'}-${Date.now()}`,
      role: 'assistant',
      content: res.reply,
      agentId: res.agentId,
      meta: res.meta ?? null,
    }]);
    setLiveTurn((t) => (t && t.turnId === turnId ? { ...t, events: [...t.events, { id: 'd-local', type: 'done', payload: { meta: res.meta ?? null } }] } : null));
  }, []);

  // ── Пайплайн-ход (конечный автомат в БД) ──────────────────────────────────

  const applyPipelineMessage = useCallback((turnId, message, convId) => {
    if (convId) setConversationId((cur) => convId ?? cur);
    if (message) {
      setMessages((prev) => [...prev, {
        id: message.id ?? `a-${Date.now()}`,
        role: 'assistant',
        content: message.content,
        agentId: message.meta?.agentId ?? agentId,
        meta: message.meta ?? null,
      }]);
    }
    setLiveTurn((t) => (t && t.turnId === turnId
      ? { ...t, events: [...t.events, { id: 'd-local', type: 'done', payload: { meta: message?.meta ?? null } }] }
      : null));
  }, [agentId]);

  // Проверка активного хода диалога (баннер «Ход не завершён — продолжить?»).
  const checkResumeTurn = useCallback(async (cid) => {
    if (!cid) return;
    try {
      const res = await getTurnState({ conversationId: cid });
      const t = res?.turn;
      if (t && (t.status === 'executing' || t.status === 'synthesizing' || t.status === 'planning')) {
        setResumeTurn(t);
      } else {
        setResumeTurn(null);
      }
    } catch (_) { /* нет хода — нет баннера */ }
  }, []);

  // Ведение хода: крутим runTurnStep до done/synthesizing→finishTurn.
  // Обрыв вызова — не ошибка: состояние в БД, повторяем шаг (ход живёт на сервере).
  const driveTurn = useCallback(async (turnId, convId) => {
    let fails = 0;
    for (let iter = 0; iter < 40; iter++) {
      let r = null;
      try {
        r = await apiRunTurnStep(turnId);
        fails = 0;
      } catch (e) {
        fails += 1;
        if (fails >= 8) throw e;
        setNotice('Ход продолжается…');
        await sleep(3000);
        continue;
      }
      if (r.status === 'executing') continue;
      if (r.status === 'synthesizing') {
        let f = null;
        try {
          f = await apiFinishTurn(turnId);
          fails = 0;
        } catch (e2) {
          fails += 1;
          if (fails >= 8) throw e2;
          setNotice('Собираю ответ…');
          await sleep(3000);
          continue;
        }
        if (f.status === 'done' && f.message) return { turnId, message: f.message, conversationId: convId };
        if (f.status === 'done') return { turnId, already: true, conversationId: convId };
        if (f.status === 'error') return { turnId, error: f.error ?? 'Не удалось собрать ответ', conversationId: convId };
        if (f.status === 'stopped') return { turnId, stopped: true, conversationId: convId };
        continue;
      }
      if (r.status === 'done' && r.message) return { turnId, message: r.message, conversationId: convId };
      if (r.status === 'done') return { turnId, already: true, conversationId: convId };
      if (r.status === 'error') return { turnId, error: r.error ?? 'Ход завершился ошибкой', conversationId: convId };
      if (r.status === 'stopped') return { turnId, stopped: true, conversationId: convId };
      continue;
    }
    return { turnId, error: 'Ход не завершился за отведённое время — открой диалог заново, чтобы продолжить', conversationId: convId };
  }, []);

  const finishPipelineCall = useCallback(async (turnId, poll, convId) => {
    try {
      const res = await driveTurn(turnId, convId);
      if (res.message || res.stopped) {
        // даём поллингу доприлететь: события шагов нужны трассе (до 5с)
        await Promise.race([poll.promise.catch(() => null), sleep(5000).then(() => null)]);
      }
      stopPolling();
      if (res.error) setError(res.error);
      else if (res.message) applyPipelineMessage(turnId, res.message, res.conversationId);
      else if (res.stopped || res.already) setLiveTurn(null);
      else setLiveTurn(null);
    } catch (e) {
      // Основной вызов мог не дожить, а ход на сервере дошёл до конца:
      // ждём done-событие до 20с и берём ответ из него.
      const doneRes = poll ? await Promise.race([poll.promise, sleep(20000).then(() => null)]) : null;
      stopPolling();
      const doneEv = doneRes?.events?.find?.((ev) => ev.type === 'done');
      if (doneEv?.payload?.content) {
        applyPipelineMessage(turnId, { content: doneEv.payload.content, meta: doneEv.payload.meta ?? null }, convId);
      } else {
        setError(errorText(e));
        setLiveTurn(null);
      }
    } finally {
      stopPolling();
      setSending(false);
      refreshConversations();
    }
  }, [driveTurn, stopPolling, applyPipelineMessage, refreshConversations]);

  const handleSend = useCallback(async (text, attachment = null, fileObj = null) => {
    if (sending) return;
    lastSent.current = { text, agentId, conversationId, attachment, fileObj };
    // вложение могло быть уже загружено (повтор после ошибки) — не создаём превью заново
    const localAtt = attachment
      ? [attachment]
      : (fileObj
        ? [{ fileId: `local-${Date.now()}`, name: fileObj.name, mime: fileObj.type, size: fileObj.size, localUrl: URL.createObjectURL(fileObj) }]
        : null);
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, role: 'user', content: text || (localAtt ? localAtt[0].name : ''), attachments: localAtt }]);

    setSending(true);
    setError(null);
    setLiveTurn({ turnId: null, startedAt: Date.now(), events: [], pipeline: true });
    let poll = null;
    let turnId = null;
    try {
      const st = await apiStartTurn({
        text,
        agentId,
        conversationId,
        reasoning: reasoningLevel,
        attachmentIds: attachment ? [attachment.fileId] : undefined,
      });
      turnId = st.turnId;
      setConversationId((cur) => st.conversationId ?? cur);
      setLiveTurn((t) => (t ? { ...t, turnId } : t));
      poll = runTurnPolling(turnId);
      // оптимистичное сообщение уже в списке; tmp- убирается при ответе
      setMessages((prev) => prev.map((m) => (String(m.id).startsWith('tmp-') ? { ...m, id: `u-${turnId}` } : m)));
      await finishPipelineCall(turnId, poll, st.conversationId);
    } catch (e) {
      const doneRes = poll ? await Promise.race([poll.promise, sleep(20000).then(() => null)]) : null;
      stopPolling();
      const doneEv = doneRes?.events?.find?.((ev) => ev.type === 'done');
      if (doneEv?.payload?.content) {
        applyPipelineMessage(turnId, { content: doneEv.payload.content, meta: doneEv.payload.meta ?? null }, null);
      } else if (turnId) {
        // ход жив на сервере (startTurn прошёл) — не теряем его, предлагаем продолжить
        try {
          const t = await getTurnState({ turnId });
          if (t?.turn && (t.turn.status === 'executing' || t.turn.status === 'synthesizing')) {
            setResumeTurn(t.turn);
          }
        } catch (_) { /* ignore */ }
        setError(errorText(e));
        setMessages((prev) => prev.filter((m) => !String(m.id).startsWith('tmp-')));
        setLiveTurn(null);
      } else {
        setError(errorText(e));
        setMessages((prev) => prev.filter((m) => !String(m.id).startsWith('tmp-')));
        setLiveTurn(null);
      }
    } finally {
      stopPolling();
      setSending(false);
      refreshConversations();
    }
  }, [sending, agentId, conversationId, reasoningLevel, refreshConversations, runTurnPolling, stopPolling, applyPipelineMessage, finishPipelineCall]);

  const handleResumeTurn = useCallback(async () => {
    const t = resumeTurn;
    if (!t || sending) return;
    setResumeTurn(null);
    setSending(true);
    setError(null);
    setLiveTurn({ turnId: t.turnId, startedAt: Date.now(), events: [], pipeline: true });
    const poll = runTurnPolling(t.turnId);
    await finishPipelineCall(t.turnId, poll, t.conversationId);
  }, [resumeTurn, sending, runTurnPolling, finishPipelineCall]);

  const handleDiscardTurn = useCallback(async () => {
    const t = resumeTurn;
    if (!t) return;
    setResumeTurn(null);
    try {
      const res = await apiStopTurn(t.turnId);
      if (res?.summary) {
        setMessages((prev) => [...prev, { id: `s-${t.turnId}`, role: 'assistant', content: res.summary, agentId, meta: null }]);
      }
    } catch (e) {
      setNotice(errorText(e));
    }
  }, [resumeTurn, agentId]);

  const handleStopTurn = useCallback(async () => {
    const tid = liveTurn?.turnId;
    if (!tid) return;
    try {
      const res = await apiStopTurn(tid);
      if (res?.summary) {
        setMessages((prev) => [...prev, { id: `s-${tid}`, role: 'assistant', content: res.summary, agentId, meta: null }]);
      }
      setLiveTurn((t) => (t && t.turnId === tid ? { ...t, events: [...t.events, { id: 'stop-local', type: 'stop', payload: {} }] } : null));
    } catch (e) {
      setNotice(errorText(e));
    }
  }, [liveTurn, agentId]);

  const handleRetry = useCallback(() => {
    if (lastSent.current) {
      const { text, attachment, fileObj } = lastSent.current;
      handleSend(text, attachment ?? null, fileObj ?? null);
    } else {
      setError(null);
    }
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
    setLiveTurn(null);
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
      checkResumeTurn(hist.conversationId ?? id);
    } catch (e) {
      setNotice(errorText(e));
    }
  }, [agentId, checkResumeTurn]);

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

  // Загрузка файла требует существующего conversationId — создаём диалог, если его ещё нет.
  const ensureConversationForUpload = useCallback(async () => {
    if (conversationId) return conversationId;
    const res = await startConversation(agentId);
    setConversationId(res.conversationId ?? null);
    refreshConversations();
    return res.conversationId ?? null;
  }, [conversationId, agentId, refreshConversations]);

  const handleEditSave = useCallback(async (messageId, content, reasoning) => {
    setSending(true);
    setError(null);
    const turnId = newTurnId();
    setLiveTurn({ turnId, startedAt: Date.now(), events: [] });
    const poll = runTurnPolling(turnId);
    try {
      const res = await editMsg({ messageId, content, reasoning, turnId });
      stopPolling();
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
      const doneRes = await Promise.race([poll.promise, sleep(20000).then(() => null)]);
      stopPolling();
      const doneEv = doneRes?.events?.find?.((ev) => ev.type === 'done');
      if (doneEv?.payload?.content) {
        setMessages((prev) => {
          const cut = prev.findIndex((m) => m.id === messageId);
          return [...prev.slice(0, cut + 1), { id: `a-${Date.now()}`, role: 'assistant', content: doneEv.payload.content, agentId, meta: doneEv.payload.meta ?? null }];
        });
        setEditingId(null);
        setEditContent('');
      } else {
        setError(errorText(e));
        setLiveTurn(null);
      }
    } finally {
      stopPolling();
      setSending(false);
      refreshConversations();
    }
  }, [conversationId, agentId, reasoningLevel, refreshConversations, runTurnPolling, stopPolling]);

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
          liveTurn={liveTurn}
          onEnsureConversation={ensureConversationForUpload}
          resumeTurn={resumeTurn}
          onResumeTurn={handleResumeTurn}
          onDiscardTurn={handleDiscardTurn}
          onStopTurn={handleStopTurn}
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
