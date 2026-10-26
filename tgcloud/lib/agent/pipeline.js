// Планировщик агентского хода (Ф1.2).
// Ход = конечный автомат в БД; планировщик превращает вопрос в строгий JSON-план
// шагов {type, title, params} и умеет достраивать план по находкам (re-plan).
// Принципы: effort scaling (бюджет шагов по уровню), делегирование с целью
// и границами у каждого шага, guardrails вместо жёстких лимитов.
import { getPlannerModel, completeChat, getSettingOr } from '../nvidia.js';

export const STEP_TYPES = ['direct_answer', 'vision', 'search', 'read_url', 'reason', 'synthesize'];

export const STEP_CATALOG = {
  direct_answer: 'прямой ответ без инструментов — для приветствий, болтовни, простых вопросов по контексту диалога',
  vision: 'описать приложенное к сообщению изображение (только если изображения есть)',
  search: 'веб-поиск свежих фактов, params: {"query": "точный поисковый запрос"}',
  read_url: 'прочитать конкретную страницу из результатов поиска, params: {"url": "https://..."}',
  reason: 'размышление/анализ по подзадаче на основе находок, params: {"task": "что именно проанализировать"}',
  synthesize: 'финальный ответ пользователю из находок шагов (ставь последним)',
};

// Бюджет шагов по уровню усилия (в промпте планировщика + жёсткий кап в коде).
export const EFFORT_BUDGET = {
  fast:  'ровно один шаг direct_answer, без инструментов',
  light: '1-2 шага',
  medium: '2-4 шага',
  high: '3-6 шагов',
  max: 'до 8 шагов, максимально глубоко',
};

export const EFFORT_CAP = { fast: 2, light: 3, medium: 5, high: 7, max: 9 };

// ── JSON-repair: малые модели стабильно ломают JSON (лишняя "}", оборванный
// хвост, висячая запятая). Ремонт детерминированный — доказан в Ф0 (5/5).
function repairJson(text) {
  const t = String(text ?? '').replace(/```(?:json)?/gi, '').trim();
  const start = Math.min(...['[', '{'].map((c) => { const i = t.indexOf(c); return i === -1 ? Infinity : i; }));
  if (!isFinite(start)) return null;
  const stack = [];
  let inStr = false;
  let esc = false;
  let out = '';
  for (const ch of t.slice(start)) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr) { out += ch; continue; }
    if (ch === '[' || ch === '{') { stack.push(ch === '[' ? ']' : '}'); out += ch; continue; }
    if (ch === ']' || ch === '}') {
      if (stack[stack.length - 1] === ch) { stack.pop(); out += ch; } // лишние закрывающие — выбрасываем
      continue;
    }
    out += ch;
  }
  let fixed = out;
  if (inStr) fixed += '"';
  while (fixed.length && /[,:[\s]$/.test(fixed)) fixed = fixed.slice(0, -1);
  fixed = fixed.replace(/,+$/, '');
  while (stack.length) fixed += stack.pop();
  return fixed;
}

function tryParse(text) {
  try { return { ok: true, value: JSON.parse(text) }; } catch (e) { return { ok: false, why: String(e?.message ?? e) }; }
}

export function extractPlanJson(text) {
  const raw = tryParse(String(text ?? '').replace(/```(?:json)?/gi, '').trim());
  if (raw.ok) return { value: raw.value, repaired: false };
  const fixed = repairJson(text);
  if (fixed === null) return { value: null, repaired: false };
  const v = tryParse(fixed);
  return v.ok ? { value: v.value, repaired: true } : { value: null, repaired: true };
}

// Ключ шага для дубликат-детекта: тип + нормализованный главный параметр.
export function planKey(step) {
  const p = step?.params ?? {};
  const main = p.query ?? p.url ?? p.task ?? p.skill ?? '';
  return `${step?.type ?? ''}|${String(main).trim().toLowerCase().slice(0, 120)}`;
}

// Валидация и нормализация плана: известные типы, кап по уровню, пометки дубликатов.
export function normalizeSteps(raw, { effort = 'medium', executedKeys = [] } = {}) {
  const arr = Array.isArray(raw) ? raw : [];
  const cap = EFFORT_CAP[effort] ?? EFFORT_CAP.medium;
  const seen = new Set(executedKeys);
  const out = [];
  for (const s of arr) {
    if (!s || typeof s !== 'object') continue;
    const type = typeof s.type === 'string' ? s.type.trim() : '';
    if (!STEP_TYPES.includes(type)) continue;
    const title = typeof s.title === 'string' && s.title.trim() ? s.title.trim().slice(0, 120) : type;
    const params = (s.params && typeof s.params === 'object') ? s.params : {};
    if (type === 'search' && !String(params.query ?? '').trim()) continue;
    if (type === 'read_url' && !/^https?:\/\//i.test(String(params.url ?? ''))) continue;
    const key = planKey({ type, params });
    const step = { type, title, params, key, duplicate: seen.has(key) };
    seen.add(key);
    out.push(step);
    if (out.length >= cap) break;
  }
  return out;
}

// ── Эвристический план без вызова LLM (zero-overhead путь, Ф5.5):
// fast = текущее поведение: [vision?] + direct_answer.
export function heuristicPlan({ reasoning, hasImages, executedKeys = [] }) {
  const steps = [];
  if (hasImages) steps.push({ type: 'vision', title: 'Изучить изображения', params: {} });
  steps.push({ type: 'direct_answer', title: 'Прямой ответ', params: {} });
  return normalizeSteps(steps, { effort: reasoning === 'fast' ? 'fast' : 'light', executedKeys });
}

// Нужен ли LLM-план: fast-уровень всегда отвечает эвристикой (без оверхеда).
export function needsPlanner(reasoning) {
  return reasoning !== 'fast';
}

// ── Промпт планировщика ────────────────────────────────────────────────────
function historyBrief(history, max = 6) {
  const rows = (history ?? []).slice(-max);
  if (!rows.length) return '(пусто)';
  return rows.map((m) => {
    const text = String(m.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 140);
    const role = m.role === 'user' ? 'Пользователь' : 'Агент';
    return `${role}: ${text || '(приложение)'}`;
  }).join('\n');
}

function capabilitiesText({ hasImages, search, readUrl }) {
  const lines = [];
  lines.push('- direct_answer — прямой ответ (всегда доступен)');
  if (hasImages) lines.push('- vision — описать изображения, приложенные к последнему сообщению');
  lines.push('- reason — размышление/анализ по подзадаче (всегда доступен)');
  lines.push('- synthesize — финальный ответ из находок (всегда доступен)');
  if (search) lines.push('- search — веб-поиск актуальных фактов');
  if (readUrl) lines.push('- read_url — чтение конкретной страницы');
  return lines.join('\n');
}

function plannerSystemPrompt({ effort, hasImages, search, readUrl, replan }) {
  const parts = [
    'Ты — планировщик многошагового хода AI-агента. Ты составляешь план из шагов-инструментов.',
    'Доступные типы шагов:',
    capabilitiesText({ hasImages, search, readUrl }),
    'Правила:',
    `- Уровень усилия «${effort}»: план из ${EFFORT_BUDGET[effort]}. Ровно настолько глубоко, насколько нужен вопрос, не больше.`,
    '- Приветствия, болтовня, простые вопросы по контексту диалога → ровно один шаг direct_answer.',
    '- direct_answer: params оставь пустым {} — НЕ пиши сам ответ в плане, ответ даёт исполнитель.',
    replan
      ? '- Это ДОСТРОЙКА плана: учитывай выполненные шаги (помечены [ВЫПОЛНЕН]) и находки. Верни массив ТОЛЬКО новых шагов. Если находок уже достаточно для полного ответа — верни пустой массив [].'
      : '- Не планируй шаги, типы которых не перечислены как доступные.',
    '- Каждый шаг — конкретная цель: title коротко о чём шаг; search-запросы самодостаточные и точные.',
    '- Не дублируй шаги (одинаковый тип + запрос).',
    '- Если используешь инструменты (search/read_url/vision) — последний шаг synthesize.',
    'Ответ: СТРОГО JSON-массив, без markdown, без пояснений, формат:',
    '[{"type":"search","title":"кратко","params":{"query":"точный запрос"}}]',
  ];
  return parts.join('\n');
}

function plannerUserPrompt({ question, history, hasImages, priorSteps, findings }) {
  const parts = [`Вопрос пользователя: ${question}`];
  parts.push(`История диалога (кратко):\n${historyBrief(history)}`);
  parts.push(`Изображения приложены: ${hasImages ? 'да' : 'нет'}`);
  if (priorSteps?.length) {
    const planLines = priorSteps.map((s, i) => {
      const p = s.params ?? {};
      const main = p.query ?? p.url ?? p.task ?? '';
      return `${i + 1}. ${s.type}${main ? ` (${String(main).slice(0, 80)})` : ''}${s.executed ? ' [ВЫПОЛНЕН]' : ''}${s.duplicate ? ' [ДУБЛЬ — уже выполнялся]' : ''}`;
    });
    parts.push(`Текущий план:\n${planLines.join('\n')}`);
  }
  if (findings?.length) {
    const fLines = findings.map((f) => `- (${f.type}) ${f.title}: ${String(f.text ?? '').slice(0, 700)}`);
    parts.push(`Находки выполненных шагов:\n${fLines.join('\n')}`);
  }
  parts.push('Составь план (JSON-массив).');
  return parts.join('\n\n');
}

// Есть ли ключ поиска (планировщик исключает search/read_url без ключа — Ф2.1).
export async function searchAvailable() {
  const v = await getSettingOr('SERPER_API_KEY', '');
  return Boolean(v);
}

// ── Главная функция: план хода. Возвращает {steps, repaired, model, usage, latencyMs}.
// При неудаче планировщика — безопасный фолбэк [direct_answer] (ход не ломается).
export async function planTurn({ question, history = [], effort = 'medium', hasImages = false, priorSteps = [], findings = [], executedKeys = [] }) {
  const t0 = Date.now();
  const replan = Boolean(priorSteps.length);
  try {
    const search = await searchAvailable();
    const model = await getPlannerModel();
    const res = await completeChat(
      [
        { role: 'system', content: plannerSystemPrompt({ effort, hasImages, search, readUrl: search, replan }) },
        { role: 'user', content: plannerUserPrompt({ question, history, hasImages, priorSteps, findings }) },
      ],
      { model, temperature: 0.2, maxTokens: 800, reasoning: 'fast' },
    );
    const { value, repaired } = extractPlanJson(res.content);
    let steps = normalizeSteps(value, { effort, executedKeys });
    if (replan && steps.length) {
      // в достройку нельзя снова ставить synthesize после каждого шага —
      // synthesize добавляется ровно один раз в конце всего хода
      steps = steps.filter((s) => s.type !== 'synthesize');
    }
    if (!replan && !steps.length) {
      steps = heuristicPlan({ reasoning: 'medium', hasImages, executedKeys });
    }
    if (replan && !steps.length) steps = []; // [] = находок достаточно, к ответу
    return { steps, repaired, model: res.model ?? model, usage: res.usage ?? null, latencyMs: Date.now() - t0, ok: true };
  } catch (e) {
    const steps = replan ? [] : heuristicPlan({ reasoning: 'medium', hasImages, executedKeys });
    return {
      steps,
      repaired: false,
      model: null,
      usage: null,
      latencyMs: Date.now() - t0,
      ok: false,
      error: String(e?.message ?? e).slice(0, 200),
    };
  }
}
