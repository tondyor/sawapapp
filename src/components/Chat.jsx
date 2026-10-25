import React, { useEffect, useRef, useState } from 'react';
import { AgentIcon, IconSend, TypingDots, IconCopy, IconPencil, IconRefresh } from './icons.jsx';
import { markdownToHtml } from '../lib/format.js';
import { haptic } from '../lib/tg.js';

const LEVEL_LABELS = { fast: 'Быстро', light: 'Лёгкий', medium: 'Средний', high: 'Высокий', max: 'Max' };

const SUGGESTIONS = {
  chat: ['Расскажи что-нибудь удивительное', 'Помоги составить план на день', 'Объясни квантовую запутанность просто'],
  lawyer: ['Проверь договор на риски', 'Вернули бракованный товар — что делать?', 'Права работника при увольнении'],
  marketer: ['Стратегия запуска Telegram-канала', 'Как посчитать LTV и CAC?', 'Идеи контента на месяц'],
  designer: ['Как улучшить этот интерфейс?', 'Палитра для fintech-приложения', 'Критика моего лендинга'],
  copywriter: ['Заголовки для поста о запуске', 'Перепиши текст короче и живее', 'Слоган для кофейни'],
};

function Message({ m, accent, editing, editContent, onChange, onSave, onCancel, onCopy, onEdit, onRegenerate }) {
  const isUser = m.role === 'user';
  const isTmp = String(m.id).startsWith('tmp-');

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
          <button className="edit-save" onClick={onSave}>Отправить</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`row ${isUser ? 'user' : 'bot'}`}>
      {!isUser && (
        <div className="avatar"><AgentIcon agentId={m.agentId || 'chat'} color={accent} size={30} idp={`m-${m.id}`} /></div>
      )}
      <div className="bubble-wrap">
        {isUser ? (
          <div className="bubble user">{m.content}</div>
        ) : (
          <div className="bubble bot md" dangerouslySetInnerHTML={{ __html: markdownToHtml(m.content) }} />
        )}
        {!isTmp && (
          <div className="actions">
            <button className="act" title="Скопировать" onClick={() => { haptic(); onCopy(m.content); }}>
              <IconCopy size={15} />
            </button>
            <button className="act" title="Редактировать" onClick={() => { haptic(); onEdit(m.id); }}>
              <IconPencil size={15} />
            </button>
            {!isUser && (
              <button className="act" title="Перегенерировать" onClick={() => { haptic(); onRegenerate(m.id); }}>
                <IconRefresh size={15} />
              </button>
            )}
          </div>
        )}
      </div>
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
  editingId,
  editContent,
  onEditChange,
  onEditSave,
  onEditCancel,
  onCopy,
  onEditMessage,
  onRegenerateMessage,
}) {
  const [text, setText] = useState('');
  const taRef = useRef(null);
  const endRef = useRef(null);
  const agent = agents.find((a) => a.id === agentId) || agents[0];
  const accent = agent?.color || '#7C8CF8';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, sending]);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 132) + 'px';
  };

  const submit = () => {
    const t = text.trim();
    if (!t || sending) return;
    haptic();
    setText('');
    requestAnimationFrame(autosize);
    onSend(t);
  };

  const isEmpty = messages.length === 0 && !sending;
  const suggestions = SUGGESTIONS[agentId] || SUGGESTIONS.chat;

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
            editing={m.id === editingId}
            editContent={editContent}
            onChange={onEditChange}
            onSave={() => onEditSave(m.id, editContent, reasoningLevel)}
            onCancel={onEditCancel}
            onCopy={onCopy}
            onEdit={onEditMessage}
            onRegenerate={onRegenerateMessage}
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

      <div className="composer-stack" style={{ '--accent': accent }}>
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
        <div className="composer">
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
      </div>
    </>
  );
}
