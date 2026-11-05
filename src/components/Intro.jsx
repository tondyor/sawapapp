import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import '../intro.css';

// ══════════════════════════════════════════════════════════════════════
// Интро-анимация SAWAP — 6 секунд, играет при каждом открытии.
//
// Вся динамика — JavaScript: один rAF-цикл, который каждый кадр пишет
// transform/opacity напрямую в элементы (лента, вход, «нырок», пропуск,
// живой диалог). CSS-анимаций в интро нет вообще — поведение
// детерминировано и полностью проверяемо:
// ?introAt=<мс> применяет те же формулы один раз на указанном времени —
// получается честный замороженный кадр любого момента, включая «нырок».
//
// Производительность: только transform/opacity, без фильтров и теней;
// всё движение — один rAF-цикл.
// Структура (сверху вниз): якорь → лента агентов → живой диалог (3 обмена,
// 3 агента, печать 0,1 с) → «нырок» в слово SAWAP (5,5–6,0 с) → готовый чат (новый диалог, SAWAP).
// Переход интро → чат — ровно 0,5 с. Пропуск — тап по любому месту (180 мс).
// ТЗ владельца: лента в 3 строки без пилюль; первый ряд (3 агента) проходит
// весь экран за 1,0 с, дальше скорость постоянно растёт до последнего ряда,
// лента исчезает с экрана ровно за 0,1 с до нырка (5,4 с).
// ══════════════════════════════════════════════════════════════════════

const AGENTS = [
  'SAWAP', 'Правовед', 'Маркетолог', 'Дизайнер', 'Копирайтер',
  'Медицина', 'Психология', 'Спорт и фитнес', 'Питание', 'Питомцы и ветеринария',
  'Красота и уход', 'Мода и стиль', 'Дом и ремонт', 'Недвижимость', 'ЖКХ и энергетика',
  'Кулинария', 'Сельское хозяйство и садоводство', 'Экология', 'Финансы', 'Бухгалтерия и налоги',
  'Страхование', 'Бизнес', 'Продажи и торговля', 'Труд и карьера', 'Программирование',
  'Аналитика данных', 'ИИ и нейросети', 'Кибербезопасность', 'Инженерия и техника', 'Производство',
  'Экономика', 'Транспорт и логистика', 'Туризм', 'Педагогика', 'Наука',
  'История и культура', 'Языки и перевод', 'Безопасность и ЧС', 'Государство и документы', 'Урбанистика',
  'Семья и отношения', 'Социальная сфера', 'Покупки', 'Игры', 'Ремесло и хобби',
  'Музыка', 'Изобразительное искусство', 'Фото и видео', 'Сценические искусства', 'Медиа и журналистика',
  'Архитектура', 'Философия и религия', 'Саморазвитие', 'Риторика', 'Гостеприимство и события',
];

const T = {
  END: 6000,
  DIVE: 5500,  // начало «нырка» (переход 5,5–6,0 с = 0,5 с)
  SKIP: 180,
};

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

function bezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    const u = clamp01(x);
    let t = u;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - u;
      if (Math.abs(e) < 1e-4) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(t);
  };
}

const RISE = bezier(0.22, 1, 0.36, 1);
const EASE = bezier(0.25, 0.1, 0.25, 1);

// Профиль скорости ленты (px/с) по ТЗ владельца: первый ряд (3 агента)
// проходит экран справа налево равномерно за 1,0 с; дальше скорость
// постоянно растёт, и лента целиком исчезает с экрана ровно за 0,1 с
// до «нырка» (5,4 с = DIVE − 0,1 с).
function ribbonState(tMs, V, C1, W) {
  const T1 = 1.0;
  const T2 = (T.DIVE - 100) / 1000 - T1;
  const D1 = V + C1;
  const D2 = W - C1;
  const v1 = D1 / T1;
  const vE = 2 * D2 / T2 - v1;
  const t = tMs / 1000;
  if (t <= 0) return { p: V, v: v1 };
  if (t >= T1 + T2) return { p: -W, v: vE };
  if (t <= T1) return { p: V - v1 * t, v: v1 };
  const u = t - T1;
  const S = D1 + v1 * u + ((vE - v1) * u * u) / (2 * T2);
  const v = v1 + ((vE - v1) * u) / T2;
  return { p: V - S, v };
}

// ── Диалог: 3 обмена, 3 агента ──────────────────────────────────────
// Каждое сообщение печатается за 0,1 с; расписание — по ТЗ владельца.
// Все шесть успевают напечататься до «нырка» (5,5 с).
const DIALOG = [
  // 0. Пользователь — запрос про упаковку услуги
  {
    role: 'user',
    text: 'Хочу упаковать услугу "Бренд-старт" и продавать за 120к, а не за часы. Как лучше сформулировать оффер?',
    delay: 100,      // когда появляется (мс от старта)
    duration: 100,   // время «печати»
  },
  // 1. Маркетолог — стратегия и тарифы
  {
    role: 'assistant',
    agent: 'marketer',
    name: 'Маркетолог',
    color: '#34D399',
    text: 'Позиционируй не через «дизайн», а через результат клиента: «Готовый визуальный пакет за 2 недели — открываешь заявки, получаешь клиентов». Тарифы: 80к / 120к / 200к. Ценник обоснован: клиент экономит 3 месяца найма арт-директора.',
    delay: 800,
    duration: 100,
  },
  // 2. Пользователь — обращение к Копирайтеру
  {
    role: 'user',
    text: '@Копирайтер Напиши заголовок и лид для лендинга тарифа Про — чтобы сразу было понятно ценность и не «водой»',
    delay: 1600,
    duration: 100,
  },
  // 3. Копирайтер — заголовок и лид
  {
    role: 'assistant',
    agent: 'copywriter',
    name: 'Копирайтер',
    color: '#38BDF8',
    text: 'Бренд за 14 дней. Не «логотип», а система, с которой малый бизнес выглядит как игрок. Лендинг, гайдлайн, посты на месяц — ты открываешь заявки, мы закрываем визуал. Старт — на следующей неделе.',
    delay: 2400,
    duration: 100,
  },
  // 4. Пользователь — обращение к Правоведу
  {
    role: 'user',
    text: '@Правовед Есть ли риски в таком договоре: «Результат — готовые файлы, правки не ограничены, возврат денег нет»?',
    delay: 3200,
    duration: 100,
  },
  // 5. Правовед — юридический разбор
  {
    role: 'assistant',
    agent: 'lawyer',
    name: 'Правовед',
    color: '#C9A227',
    text: 'Риск высокий: «правки не ограничены» = бесконечная работа за фикс. Замени на «2 раунда правок в тариф, далее — по часовой ставке». «Возврат денег нет» — не пойдет (ст. 16 ЗоЗПП). Добавь: «Возврат 50% до передачи эскизов, после — возврат не предусмотрен» — это юридически чистый вариант.',
    delay: 4000,
    duration: 100,
  },
];

export default function Intro({ onDone, onExit }) {
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const frozen = (() => {
    const raw = params.get('introAt');
    if (raw == null || raw === '' || Number.isNaN(+raw)) return null;
    return Math.max(0, +raw);
  })();

  const [phase, setPhase] = useState(() => (frozen != null && frozen >= T.DIVE ? 'dive' : 'idle'));
  const [ms, setMs] = useState(0);
  const doneRef = useRef(false);
  const exitFiredRef = useRef(false);
  const skipTimer = useRef(null);
  const t0Ref = useRef(0);
  const skipAtRef = useRef(null);
  const trackRef = useRef(null);
  const dimsRef = useRef(null);
  const rootRef = useRef(null);
  const elsRef = useRef(null);
  const msgRefs = useRef([]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; }, [finish]);

  const fireExit = useCallback(() => {
    if (exitFiredRef.current) return;
    exitFiredRef.current = true;
    if (onExit) onExit();
  }, [onExit]);

  useEffect(() => {
    if (frozen != null) return undefined;
    const t = setTimeout(() => finishRef.current(), T.END);
    return () => clearTimeout(t);
  }, [frozen]);

  useEffect(() => {
    if (frozen != null) return undefined;
    const t = setTimeout(() => {
      if (skipAtRef.current != null) return;
      setPhase('dive');
      fireExit();
    }, T.DIVE);
    return () => clearTimeout(t);
  }, [frozen, fireExit]);

  useEffect(() => () => { if (skipTimer.current) clearTimeout(skipTimer.current); }, []);

  useEffect(() => {
    if (frozen != null) return undefined;
    const t0 = performance.now();
    const iv = setInterval(() => {
      const el = performance.now() - t0;
      setMs(Math.min(el, T.END));
      if (el >= T.END) clearInterval(iv);
    }, 100);
    return () => clearInterval(iv);
  }, [frozen]);

  // ── Единый источник движения: один кадр = один вызов applyFrame(t) ──
  const applyFrame = useCallback((tMs) => {
    const els = elsRef.current;
    if (!els) return;

    // Лента: первый ряд 1,0 с равномерно → постоянный разгон, финиш за 0,1 с до нырка.
    const d = dimsRef.current;
    if (d && els.track) {
      const { p } = ribbonState(tMs, d.vw, d.c1, d.w);
      els.track.style.transform = `translate3d(${p.toFixed(1)}px, 0, 0)`;
    }

    // Пропуск тапом: быстрый фейд корня 180 мс, без «нырка».
    const skipAt = skipAtRef.current;
    if (skipAt != null) {
      els.root.style.opacity = String(1 - clamp01((tMs - skipAt) / T.SKIP));
      return;
    }

    // «Нырок» (5,5–6,0 с): слово раздувается и растворяется, вспышка-ядро,
    // корень гаснет, под ним показывается готовый чат.
    if (tMs >= T.DIVE) {
      const p = clamp01((tMs - T.DIVE) / (T.END - T.DIVE));
      els.root.style.opacity = String(1 - smooth((p - 0.08) / 0.92));
      const dim = String(1 - clamp01(p / 0.15));
      els.tag.style.opacity = dim;
      els.facts.style.opacity = dim;
      els.ribbon.style.opacity = dim;
      els.dialog.style.opacity = dim;
      els.hint.style.opacity = dim;
      els.word.style.opacity = String(1 - smooth((p - 0.5) / 0.5));
      els.word.style.transform = `scale(${(1 + 25 * p * p).toFixed(3)})`;
      els.halo.style.opacity = String(p < 0.4 ? smooth(p / 0.4) : 1 - smooth((p - 0.4) / 0.6));
      els.halo.style.transform = `scale(${(0.2 + 15.8 * (1 - (1 - p) * (1 - p))).toFixed(3)})`;
      return;
    }

    // Вход (0–1,5 с): подъём якоря; окно чата видно сразу — сообщения
    // выходят строго по своему расписанию, начиная с 0,1 с.
    const rise = RISE((tMs - 120) / 560);
    els.word.style.opacity = String(rise);
    els.word.style.transform = `translate3d(0, ${(14 * (1 - rise)).toFixed(2)}px, 0)`;
    const tagP = RISE((tMs - 280) / 560);
    els.tag.style.opacity = String(tagP);
    els.tag.style.transform = `translate3d(0, ${(14 * (1 - tagP)).toFixed(2)}px, 0)`;
    els.facts.style.opacity = String(EASE((tMs - 420) / 420));
    els.dialog.style.opacity = '1';
    els.hint.style.opacity = String(EASE((tMs - 1100) / 420));

    // Живой диалог: каждое сообщение печатается по словам за 0,1 с
    let lastVisibleIdx = -1;
    DIALOG.forEach((msg, i) => {
      const el = msgRefs.current[i];
      if (!el) return;
      const start = msg.delay;
      const end = start + msg.duration;
      if (tMs < start) {
        el.style.opacity = '0';
        el.style.transform = 'translate3d(0, 8px, 0)';
        return;
      }
      lastVisibleIdx = i;
      if (tMs >= end) {
        el.style.opacity = '1';
        el.style.transform = 'translate3d(0, 0, 0)';
        const textEl = el.querySelector('.si-msg-text');
        if (textEl) textEl.textContent = msg.text;
        return;
      }
      // Печатаем по словам
      const progress = (tMs - start) / msg.duration;
      const words = msg.text.split(' ');
      const visibleCount = Math.max(1, Math.ceil(words.length * progress));
      const visibleText = words.slice(0, visibleCount).join(' ');
      const textEl = el.querySelector('.si-msg-text');
      if (textEl) textEl.textContent = visibleText;
      el.style.opacity = String(0.2 + 0.8 * progress);
      el.style.transform = `translate3d(0, ${(8 * (1 - progress)).toFixed(2)}px, 0)`;
    });
    // Прокрутка окна чата вниз за новым сообщением: верхние сообщения
    // уходят под верхнюю границу окна и не перекрывают ленту и якорь.
    if (lastVisibleIdx >= 0 && els.dialog) {
      const targetEl = msgRefs.current[lastVisibleIdx];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'instant', block: 'end' });
      }
    }
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const chips = track.querySelectorAll('.si-chip');
    if (chips.length < 6) return;
    const vw = window.innerWidth;
    const colBoundary = chips[3].offsetLeft - chips[0].offsetLeft - 6;
    dimsRef.current = { vw, c1: colBoundary, w: track.scrollWidth };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    elsRef.current = {
      root,
      track: trackRef.current,
      word: root.querySelector('.si-word'),
      tag: root.querySelector('.si-tag'),
      facts: root.querySelector('.si-facts'),
      ribbon: root.querySelector('.si-ribbon'),
      dialog: root.querySelector('.si-dialog'),
      hint: root.querySelector('.si-hint'),
      halo: root.querySelector('.si-halo'),
    };
    msgRefs.current = DIALOG.map((_, i) => root.querySelector(`.si-msg[data-idx="${i}"]`));
    measure();
    applyFrame(frozen != null ? frozen : 0);
  }, [measure, applyFrame, frozen]);

  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        measure();
        applyFrame(frozen != null ? frozen : 0);
      });
    }
  }, [measure, applyFrame, frozen]);

  useEffect(() => {
    if (frozen != null) return undefined;
    let raf;
    t0Ref.current = performance.now();
    const tick = () => {
      const t = performance.now() - t0Ref.current;
      applyFrame(t);
      if (t < T.END + 150) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frozen, applyFrame]);

  const handleSkip = useCallback(() => {
    if (doneRef.current || phase !== 'idle') return;
    setPhase('skip');
    fireExit();
    if (frozen != null) {
      finish();
      return;
    }
    skipAtRef.current = performance.now() - t0Ref.current;
    if (skipTimer.current) return;
    skipTimer.current = setTimeout(() => finish(), T.SKIP);
  }, [phase, finish, frozen, fireExit]);

  const displayMs = frozen != null ? frozen : ms;
  const phaseIdx = Math.max(0, Math.min(DIALOG.length - 1, Math.floor((displayMs - 500) / 800)));

  const rootClass = [
    'intro-si',
    phase === 'dive' ? 'intro-si--dive' : '',
    phase === 'skip' ? 'intro-si--skip' : '',
    frozen != null ? 'intro-si--frozen' : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={rootClass} onPointerDown={handleSkip}>
      {/* Якорь */}
      <div className="si-anchor">
        <h1 className="si-word">SAWAP</h1>
        <p className="si-tag">Команда ИИ-агентов в чате</p>
        <p className="si-facts">Бесплатно <span className="si-dim">·</span> Без регистрации <span className="si-dim">·</span> Без VPN</p>
      </div>

      {/* Лента агентов: 55 чипов, 3 ряда, справа налево */}
      <div className="si-ribbon" aria-hidden="true">
        <div className="si-track" ref={trackRef}>
          {AGENTS.map((name) => (
            <span key={name} className="si-chip">{name}</span>
          ))}
        </div>
      </div>

      {/* Живой диалог: 3 обмена, 3 агента */}
      <div className="si-dialog" aria-hidden="true">
        {DIALOG.map((msg, i) => (
          <div
            key={i}
            ref={(el) => { msgRefs.current[i] = el; }}
            className={`si-msg si-msg--${msg.role}`}
            data-idx={i}
            style={{ opacity: 0, transform: 'translate3d(0, 8px, 0)' }}
          >
            {msg.role === 'assistant' && (
              <div className="si-msg-head">
                <span className="si-msg-agent" style={{ background: msg.color }}>
                  {msg.name}
                </span>
              </div>
            )}
            <div className="si-msg-bubble">
              <span className="si-msg-text"></span>
            </div>
          </div>
        ))}
      </div>

      <div className="si-hint">нажми, чтобы пропустить</div>

      {/* Вспышка-ядро для «нырка» в SAWAP */}
      <div className="si-halo" aria-hidden="true" />
    </div>
  );
}