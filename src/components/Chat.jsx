import React, { useEffect, useRef, useState } from 'react';
import { AgentIcon, IconSend, TypingDots, IconCopy, IconPencil, IconFork, IconChevron, IconClip, IconFile, IconX } from './icons.jsx';
import { markdownToHtml } from '../lib/format.js';
import { haptic } from '../lib/tg.js';
import { uploadFileChunk, uploadFileFinish, readFileSliceAsBase64, fetchFileDataUrl } from '../lib/api.js';
import { convertToWebp } from '../lib/img.js';
import ReasoningTrace from './ReasoningTrace.jsx';
import { eventsFromMeta } from '../lib/trace.js';

const LEVEL_LABELS = { fast: 'Быстро', light: 'Лёгкий', medium: 'Средний', high: 'Высокий', max: 'Max' };

const SUGGESTIONS = {
  chat: ['Расскажи что-нибудь удивительное', 'Помоги составить план на день', 'Объясни квантовую запутанность просто'],
  lawyer: ['Проверь договор на риски', 'Вернули бракованный товар — что делать?', 'Права работника при увольнении'],
  marketer: ['Стратегия запуска Telegram-канала', 'Как посчитать LTV и CAC?', 'Идеи контента на месяц'],
  designer: ['Как улучшить этот интерфейс?', 'Палитра для fintech-приложения', 'Критика моего лендинга'],
  copywriter: ['Заголовки для поста о запуске', 'Перепиши текст короче и живее', 'Слоган для кофейни'],
};

function fmtSize(n) {
  if (n === undefined || n === null) return '';
  if (n < 1024) return n + ' Б';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' КБ';
  return (n / 1048576).toFixed(1) + ' МБ';
}

function Attachment({ att }) {
  const isImg = String(att.mime ?? '').startsWith('image/');
  const [url, setUrl] = useState(att.localUrl ?? null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (url || !isImg) return;
    let alive = true;
    fetchFileDataUrl(att.fileId)
      .then((r) => { if (alive) setUrl(r.url); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [att.fileId, isImg, url]);

  const download = async () => {
    let u = url;
    if (!u) {
      try {
        const r = await fetchFileDataUrl(att.fileId);
        u = r.url;
        setUrl(u);
      } catch (_) {
        setFailed(true);
        return;
      }
    }
    const a = document.createElement('a');
    a.href = u;
    a.download = att.name ?? 'file';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (isImg) {
    if (failed) return <div className="att-loading">Файл недоступен</div>;
    if (!url) return <div className="att-loading">Загрузка файла…</div>;
    return (
      <>
        <img className="att-img clickable" src={url} alt={att.name ?? 'вложение'} onClick={() => setZoom(true)} />
        {zoom && (
          <div className="lightbox" onClick={() => setZoom(false)} role="dialog" aria-label={att.name ?? 'Изображение'}>
            <img src={url} alt={att.name ?? 'вложение'} />
            <div className="lightbox-name">{att.name}</div>
          </div>
        )}
      </>
    );
  }
  return (
    <button className="att-file" onClick={download}>
      <IconFile size={16} />
      <span className="att-name">{att.name ?? 'файл'}</span>
      <span className="att-size">{fmtSize(att.size)}</span>
    </button>
  );
}

function Message({ m, accent, editing, editContent, onChange, onSave, onCancel, onCopy, onEdit, onFork }) {
  const isUser = m.role === 'user';
  const isTmp = String(m.id).startsWith('tmp-');
  const traceEvents = !isUser && !editing ? eventsFromMeta(m.meta) : [];
  const hasTrace = traceEvents.some((e) => e.type === 'reasoning' || e.type === 'skill' || e.type === 'image' || e.type === 'error');

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
        <div className="avatar"><AgentIcon agentId={m.agentId || 'chat'} color={accent} size={30} idp={'m-' + m.id} /></div>
      )}
      <div className="bubble-wrap">
        {!isUser && hasTrace && (
          <ReasoningTrace events={traceEvents} accent={accent} />
        )}
        {Array.isArray(m.attachments) && m.attachments.length > 0 && (
          <div className="att-list">
            {m.attachments.map((a, i) => (
              <Attachment key={a.fileId ?? 'att-' + i} att={a} />
            ))}
          </div>
        )}
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
            <button className="act" title="Продолжить в новом чате с этого места" onClick={() => { haptic(); onFork(m.id); }}>
              <IconFork size={15} />
            </button>
            {isUser && (
              <button className="act" title="Редактировать" onClick={() => { haptic(); onEdit(m.id); }}>
                <IconPencil size={15} />
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
  onForkMessage,
  agentName,
  onSelectAgent,
  onNotice,
  liveTurn,
  onEnsureConversation,
  resumeTurn,
  onResumeTurn,
  onDiscardTurn,
  onStopTurn,
}) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const agent = agents.find((a) => a.id === agentId) || agents[0];
  const accent = agent?.color || '#7C8CF8';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, sending, uploading, selectedFile]);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 132) + 'px';
  };

  const submit = async () => {
    const t = text.trim();
    if ((!t && !selectedFile) || sending || uploading) return;
    haptic();
    setText('');
    requestAnimationFrame(autosize);
    let attachment = null;
    const f = selectedFile;
    if (f) {
      setSelectedFile(null);
      setUploading(true);
      try {
        let convId = conversationId;
        if (!convId && onEnsureConversation) convId = await onEnsureConversation();
        if (!convId) throw new Error('Не удалось создать диалог для файла');
        const uploadId = 'u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
        const chunkSize = 699999;
        const count = Math.max(1, Math.ceil(f.size / chunkSize));
        for (let i = 0; i < count; i++) {
          const b64 = await readFileSliceAsBase64(f, i * chunkSize, Math.min((i + 1) * chunkSize, f.size));
          await uploadFileChunk({ uploadId, idx: i, dataBase64: b64 });
        }
        attachment = await uploadFileFinish({ uploadId, conversationId: convId, name: f.name, mime: f.type });
      } catch (e) {
        setUploading(false);
        onNotice(e?.message || 'Не удалось загрузить файл');
        if (t) setText(t);
        return;
      }
      setUploading(false);
    }
    onSend(t, attachment, f);
  };

  const pickFile = () => {
    haptic();
    fileRef.current?.click();
  };

  const onFileChosen = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      onNotice('Файл больше 10 МБ');
      return;
    }
    setSelectedFile(f);
    const converted = await convertToWebp(f);
    setSelectedFile((cur) => (cur && cur.name === f.name ? converted : cur));
  };

  const isEmpty = messages.length === 0 && !sending;
  const suggestions = SUGGESTIONS[agentId] || SUGGESTIONS.chat;

  return (
    <>
      <div className="chat-scroll">
        {resumeTurn && !sending && (
          <div className="resume-banner">
            <div className="resume-text">
              ⏸ Ход не завершён: «{(resumeTurn.question ?? '').slice(0, 70)}{(resumeTurn.question ?? '').length > 70 ? '…' : ''}»
            </div>
            <div className="resume-actions">
              <button className="resume-go" onClick={() => { haptic(); onResumeTurn(); }}>Продолжить</button>
              <button className="resume-no" onClick={() => { haptic(); onDiscardTurn(); }}>Остановить</button>
            </div>
          </div>
        )}
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
            onFork={onForkMessage}
          />
        ))}
        {sending && (
          <div className="row bot">
            <div className="avatar"><AgentIcon agentId={agentId} color={accent} size={30} idp="typing" /></div>
            <div className="bubble-wrap">
              {liveTurn && (
                <ReasoningTrace events={liveTurn.events} live accent={accent} startedAt={liveTurn.startedAt} />
              )}
              <div className="bubble bot typing-bubble"><TypingDots color={accent} /></div>
              {onStopTurn && liveTurn?.turnId && (
                <button className="stop-turn" onClick={() => { haptic(); onStopTurn(); }}>
                  ⏹ Остановить ход
                </button>
              )}
            </div>
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
          <button className="act strip-clip" title="Прикрепить файл" onClick={pickFile}>
            <IconClip size={16} />
          </button>
          <input ref={fileRef} type="file" hidden accept="image/*,.pdf,.doc,.docx,.rtf,.txt,.svg,.csv" onChange={onFileChosen} />
          <button className="agent-pill" onClick={() => { haptic(); onSelectAgent(); }}>
            <span className="pill-dot" />
            <span className="pill-name">{agentName}</span>
            <IconChevron size={13} />
          </button>
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
        {selectedFile && (
          <div className="attach-chip">
            <IconFile size={14} />
            <span className="attach-name">{selectedFile.name}</span>
            <span className="attach-size">{fmtSize(selectedFile.size)}</span>
            <button className="attach-remove" onClick={() => { haptic(); setSelectedFile(null); }}>
              <IconX size={12} />
            </button>
          </div>
        )}
        {uploading && <div className="attach-chip uploading">Загрузка файла…</div>}
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
          <button className="send" onClick={submit} disabled={(!text.trim() && !selectedFile) || sending || uploading} aria-label="Отправить">
            <IconSend size={20} />
          </button>
        </div>
      </div>
    </>
  );
}
