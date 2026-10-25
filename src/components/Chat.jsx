import React, { useEffect, useRef, useState } from 'react';
import { AgentIcon, IconSend, TypingDots, IconCopy, IconPencil, IconRefresh, IconExpand } from './icons.jsx';
import { markdownToHtml } from '../lib/format.js';
import { haptic } from '../lib/tg.js';

const LEVEL_LABELS = { fast: 'Быстро', light: 'Лёгкий', medium: 'Средний', high: 'Высокий', max: 'Max' };

function formatTime(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function stepLabel(s) {
  if (s.type === 'skill_read') return `прочитал навык «${s.name}»`;
  if (s.type === 'reasoning') return `размышление модели (${s.chars ?? 0} симв.)`;
  if (s.type === 'error') return `ошибка: ${s.message ?? s}`;
  return s.type;
}

function Message({ m, accent, isLast, editing, editContent, onChange, onSave, onCancel, onCopy, onEdit, onRegenerate, onExpandTrace, expandedTraceId }) {
  const isUser = m.role === 'user';
  const meta = m.meta ?? null;
  const traceText = (() => {
    if (!meta) return null;
    const parts = [];
    if (meta.latencyMs) parts.push(`${Math.round(meta.latencyMs / 1000)} с`);
    if (meta.skills?.length) parts.push('навык: ' + meta.skills.map((s) => s.name).join(', '));
    const nSteps = (meta.steps ?? []).length;
    if (nSteps) parts.push(`${nSteps} шаг${nSteps === 1 ? '' : 'а'}`);
    if (meta.error) parts.push('ошибка');
    return parts.length ? parts.join(' · ') : null;
  })();

  if (editing) {
    return (
      <div className="row edit-row">
        <div className="bubble editor">
          <textarea
            value={editContent}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Редактируйте сообщение…"
          />
        </div>
        <div className="edit-controls">
          <button className="edit-cancel" onClick={onCancel}>Отмена</button>
          <button className="edit-save primary" onClick={onSave}>Отправить</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`row ${isUser ? 'user' : 'bot'}`}>
      {!isUser && (
        <div className="avatar"><AgentIcon agentId={m.agentId ?? 'chat'} color={accent} size={30} idp={`m-${m.id}`} /></div>
      )}
      <div className="bubble-wrap" style={{ maxWidth: isUser ? '82%' : '88%' }}>
        <div
          className={`bubble ${isUser ? 'user' : 'bot md'}`}
          dangerouslySetInnerHTML={{ __html: markdownToHtml(m.content) }}
        />
        <div className="actions">
          <button className="act copy" onClick={(e) => { e.stopPropagation(); haptic(); onCopy(m.content); }} title="Скопировать">
            <IconCopy size={16} />
          </button>
          <button className="act pencil" onClick={(e) => { e.stopPropagation(); haptic(); onEdit(m.id); }} title="Редактировать">
            <IconPencil size={16} />
          </button>
          {!isUser && isLast && (
            <button className="act refresh" onClick={(e) => { e.stopPropagation(); haptic(); onRegenerate(m.id); }} title="Перегенерировать ответ">
              <IconRefresh size={16} />
            </button>
          )}
        </div>
        {traceText && (
          <div className="trace" onClick={(e) => { e.stopPropagation(); haptic(); onExpandTrace(m.id === expandedTraceId ? null : m.id); }}>
            {traceText}
            <IconExpand size={12} />
          </div>
        )}
        {expandedTraceId === m.id && meta && (
          <div className="trace-card">
            <div className="trace-row"><span className="trace-k">Уровень:</span> <span className="trace-v">${meta.reasoning ?? 'fast'}</span></div>
            {meta.latencyMs && <div className="trace-row"><span className="trace-k">Время:</span> <span className="trace-v">${Math.round(meta.latencyMs / 1000)} с</span></div>}
            {meta.tokens && (
              <div className="trace-row"><span className="trace-k">Токены:</span> <span className="trace-v">вх. ${meta.tokens.prompt ?? '—'} · изх. ${meta.tokens.completion ?? '—'} · всего ${meta.tokens.total ?? '—'}</span></div>
            )}
            {(meta.steps ?? []).length && (
              <>
                <div className="trace-sub">Шаги:</div>
                {(meta.steps ?? []).map((s, i) => (
                  <div className="trace-step" key={i}>{stepLabel(s)}</div>
                ))}
              </>
            )}
            {meta.reasoningText && (
              <>
                <div className="trace-sub">Рассуждение модели:</div>
                <div className="trace-text">${meta.reasoningText}</div>
              </>
            )}
            {meta.error && (
              <div className="trace-row error"><span className="trace-k">Ошибка:</span> <span className="trace-v">${meta.error}</span></div>
            )}
          </div>
        )}
      </div>
      <div className="msg-time">${formatTime(m.createdAt)}</div>
    </div>
  );
}

export default function Chat({
  agents,
  agentId,
  conversationId,
  messages,
  sending,
  error,
  reasoningLevel,
  onChangeReasoning,
  onSend,
  onRetry,
  onEditChange,
  onEditSave,
  onEditCancel,
  onCopy,
  onEditMessage,
  onRegenerateMessage,
  onExpandTrace,
  expandedTraceId,
}) {
  const taRef = useRef(null);
  const endRef = useRef(null);
  const [text, setText] = useState('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, sending]);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 132) + 'px';
  };

  useEffect(() => autosize(), [text]);

  const submit = () => {
    const t = text.trim();
    if (!t || sending) return;
    haptic();
    setText('');
    requestAnimationFrame(autosize);
    onSend(t);
  };

  const agent = agents.find((a) => a.id === agentId) || agents[0];
  const accent = agent?.color ?? '#7C8CF8';
  const isEmpty = messages.length === 0 && !sending;
  const suggestions = (() => {
    const map = {
      chat: ['Расскажи что-нибудь удивительное', 'Помоги составить план на день', 'Объясни квантовую запутанность просто'],
      lawyer: ['Проверь договор на риски', 'Вернули бракованный товар — что делать?', 'Права работника при увольнении'],
      marketer: ['Стратегия запуска Telegram-канала', 'Как посчитать LTV и CAC?', 'Идеи контента на месяц'],
      designer: ['Как улучшить этот интерфейс?', 'Палитра для fintech-приложения', 'Критика моего лендинга'],
      copywriter: ['Заголовки для поста о запуске', 'Перепиши текст короче и живее', 'Слоган для кофейни'],
    };
    return map[agentId] ?? map.chat;
  })();

  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <div className="chat-scroll">
        {isEmpty && (
          <div className="empty">
            <div className="empty-icon" style={{ '--accent': accent }}>
              <AgentIcon agentId={agentId} color={accent} size={92} idp="empty" />
            </div>
            <div className="empty-name">{agent?.name ?? 'Sawa'}</div>
            <div className="empty-tagline">{agent?.tagline ?? 'Твой AI-собеседник'}</div>
            <div className="empty-desc">{agent?.description}</div>
            <div className="chips">
              {suggestions.map((s) => (
                <button key={s} className="chip" onClick={() => { haptic(); onSend(s); }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <Message
            key={m.id}
            m={m}
            accent={accent}
            isLast={m.id === lastMessage?.id}
            editing={m.id === editingId}
            editContent={editContent}
            onChange={onEditChange}
            onSave={onEditSave}
            onCancel={onEditCancel}
            onCopy={onCopy}
            onEdit={onEditMessage}
            onRegenerate={onRegenerateMessage}
            onExpandTrace={onExpandTrace}
            expandedTraceId={expandedTraceId}
          />
        ))}
        {sending && (
          <div className="row bot">
            <div className="avatar"><AgentIcon agentId={agentId} color={accent} size={30} idp="typing" /></div>
            <div className="bubble bot typing-bubble"><TypingDots color={accent} /></div>
          </div>
        )}
        {error && (
          <div className="row bot">
            <div className="bubble error">
              {error}
              <button className="retry" onClick={onRetry}>Повторить</button>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="levels">
        {Object.entries(LEVEL_LABELS).map(([id, label]) => (
          <button
            key={id}
            className={`level-chip ${reasoningLevel === id ? 'active' : ''}`}
            onClick={() => { haptic(); onChangeReasoning(id); }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="composer" style={{ '--accent': accent }}>
        <textarea
          ref={taRef}
          value={text}
          rows={1}
          placeholder={`Сообщение для «${agent?.name ?? 'агента'}»…`}
          onChange={(e) => { setText(e.target.value); autosize(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button className="send" onClick={submit} disabled={!text.trim() || sending} aria-label="Отправить">
          <IconSend size={20} />
        </button>
      </div>
    </>
  );
}
