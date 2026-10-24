import React, { useEffect, useRef, useState } from 'react';
import { AgentIcon, IconSend, TypingDots } from './icons.jsx';
import { markdownToHtml } from '../lib/format.js';
import { haptic } from '../lib/tg.js';

const SUGGESTIONS = {
  chat: ['Расскажи что-нибудь удивительное', 'Помоги составить план на день', 'Объясни квантовую запутанность просто'],
  lawyer: ['Проверь договор на риски', 'Вернули бракованный товар — что делать?', 'Права работника при увольнении'],
  marketer: ['Стратегия запуска Telegram-канала', 'Как посчитать LTV и CAC?', 'Идеи контента на месяц'],
  designer: ['Как улучшить этот интерфейс?', 'Палитра для fintech-приложения', 'Критика моего лендинга'],
  copywriter: ['Заголовки для поста о запуске', 'Перепиши текст короче и живее', 'Слоган для кофейни'],
};

function Message({ m, accent }) {
  const isUser = m.role === 'user';
  if (isUser) {
    return <div className="row user"><div className="bubble user">{m.content}</div></div>;
  }
  return (
    <div className="row bot">
      <div className="avatar"><AgentIcon agentId={m.agentId || 'chat'} color={accent} size={30} idp={`m-${m.id}`} /></div>
      <div className="bubble bot md" dangerouslySetInnerHTML={{ __html: markdownToHtml(m.content) }} />
    </div>
  );
}

export default function Chat({ agents, agentId, conversationId, messages, sending, error, onSend, onRetry }) {
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
          <Message key={m.id} m={m} accent={accent} />
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
