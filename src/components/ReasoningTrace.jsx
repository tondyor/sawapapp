import React, { useEffect, useRef, useState } from 'react';
import { IconChevron } from './icons.jsx';

// Живая/сохранённая трасса хода агента: одна строка статуса над ответом,
// по нажатию раскрывается вся последовательность (размышления + шаги).
// events: [{ id, type: 'start'|'reasoning'|'content'|'skill'|'done'|'error', payload }]
// live: true — ход ещё идёт (спиннер, хвост размышления бежит).

const MODEL_LABELS = {
  'nvidia/nemotron-3.5-bolt-e4b': 'Sawa Fast',
  'nvidia/nemotron-3.5-super-vl-120b-a12b': 'Sawa Reason',
  // NIM иногда возвращает внутренний алиас без -vl
  'nvidia/nemotron-3.5-super-120b-a12b': 'Sawa Reason',
  'deepseek-ai/deepseek-v4.1-flash': 'DeepSeek Vision',
};
const LEVEL_SHORT = { fast: 'быстро', light: 'лёгкий', medium: 'средний', high: 'высокий', max: 'max' };

function modelLabel(m) { return MODEL_LABELS[m] ?? (m ? String(m).split('/').pop() : ''); }

function fmtSec(ms) {
  if (!ms && ms !== 0) return '';
  return ms < 1000 ? `${ms}мс` : `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}с`;
}

export default function ReasoningTrace({ events, live = false, accent = '#7C8CF8', startedAt = null }) {
  const [open, setOpen] = useState(false);
  const tailRef = useRef(null);

  const reasoning = events.filter((e) => e.type === 'reasoning').map((e) => e.payload?.text ?? '').join('');
  const steps = events.filter((e) => e.type === 'skill' || e.type === 'image');
  const doneEv = events.find((e) => e.type === 'done');
  const errorEv = events.find((e) => e.type === 'error');
  const startEv = events.find((e) => e.type === 'start');
  const lastImage = [...events].reverse().find((e) => e.type === 'image');
  const elapsed = startedAt ? Date.now() - startedAt : null;

  useEffect(() => {
    if (open && live && tailRef.current) {
      tailRef.current.scrollTop = tailRef.current.scrollHeight;
    }
  }, [reasoning.length, open, live]);

  // Пока ход идёт — строка статуса нужна всегда (иначе на медленной vision-модели
  // юзер 30с+ видит только три точки). После завершения — только если было что-то.
  const running = live && !doneEv && !errorEv;
  const hasAnything = running || reasoning.length > 0 || steps.length > 0 || Boolean(errorEv);
  if (!hasAnything) return null;

  let statusText;
  if (errorEv) statusText = 'Ошибка генерации';
  else if (doneEv) {
    const ms = doneEv.payload?.meta?.latencyMs ?? null;
    const parts = ['Размышления'];
    if (ms != null) parts.push(fmtSec(ms));
    if (steps.length) parts.push(`${steps.length} ${steps.length === 1 ? 'шаг' : 'шага'}`);
    statusText = parts.join(' · ');
  } else if (lastImage && !reasoning) statusText = 'Изучаю изображение…';
  else if (steps.some((s) => s.type === 'skill') && !reasoning) statusText = `Читаю навык: ${steps.filter((s) => s.type === 'skill').slice(-1)[0].payload?.name ?? ''}`;
  else if (reasoning) statusText = 'Размышляю…';
  else statusText = 'Думаю…';

  const model = startEv?.payload?.model ?? doneEv?.payload?.meta?.model ?? null;
  const level = startEv?.payload?.reasoning ?? null;

  const tail = reasoning.length > 160 ? '…' + reasoning.slice(-160).replace(/\s+/g, ' ') : reasoning.replace(/\s+/g, ' ');

  return (
    <div className={`rtrace ${live ? 'live' : ''} ${errorEv ? 'err' : ''} ${open ? 'open' : ''}`} style={{ '--accent': accent }}>
      <button className="rtrace-head" onClick={() => { setOpen((v) => !v); }} aria-expanded={open}>
        <span className={`rtrace-dot ${live && !doneEv && !errorEv ? 'pulse' : ''} ${errorEv ? 'dot-err' : doneEv ? 'dot-done' : ''}`} />
        <span className="rtrace-status">{statusText}</span>
        {live && !doneEv && !errorEv && elapsed != null && <span className="rtrace-timer">{fmtSec(elapsed)}</span>}
        {model && <span className="rtrace-model">{modelLabel(model)}{level && level !== 'fast' ? ` · ${LEVEL_SHORT[level] ?? level}` : ''}</span>}
        <IconChevron size={14} />
      </button>
      {!open && live && !doneEv && !errorEv && reasoning && (
        <div className="rtrace-tail">{tail}</div>
      )}
      {open && (
        <div className="rtrace-body">
          {steps.length > 0 && (
            <div className="rtrace-steps">
              {startEv && <div className="rtrace-step">▶ старт · {modelLabel(model) || 'модель'}{level ? ` · уровень: ${LEVEL_SHORT[level] ?? level}` : ''}</div>}
              {steps.map((s, i) => s.type === 'image' ? (
                <div key={s.id ?? i} className="rtrace-step" title={s.payload?.description ?? ''}>
                  👁 изображение «{s.payload?.name ?? i}»{s.payload?.description ? `: ${s.payload.description.slice(0, 90)}${s.payload.description.length > 90 ? '…' : ''}` : ''}
                </div>
              ) : (
                <div key={s.id ?? i} className="rtrace-step">📖 навык: {s.payload?.name ?? s.payload?.id}</div>
              ))}
              {doneEv && <div className="rtrace-step">✓ ответ готов{doneEv.payload?.meta?.latencyMs != null ? ` · ${fmtSec(doneEv.payload.meta.latencyMs)}` : ''}</div>}
              {errorEv && <div className="rtrace-step err">✕ {errorEv.payload?.message ?? 'ошибка'}</div>}
            </div>
          )}
          {steps.length === 0 && (
            <div className="rtrace-steps">
              {startEv && <div className="rtrace-step">▶ старт · {modelLabel(model) || 'модель'}{level ? ` · уровень: ${LEVEL_SHORT[level] ?? level}` : ''}</div>}
              {doneEv && <div className="rtrace-step">✓ ответ готов{doneEv.payload?.meta?.latencyMs != null ? ` · ${fmtSec(doneEv.payload.meta.latencyMs)}` : ''}</div>}
              {errorEv && <div className="rtrace-step err">✕ {errorEv.payload?.message ?? 'ошибка'}</div>}
            </div>
          )}
          {reasoning && (
            <div className="rtrace-text" ref={tailRef}>
              <div className="rtrace-text-title">Ход размышлений</div>
              <div className="rtrace-text-body">{reasoning}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
