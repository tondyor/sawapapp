import { fetch } from 'sdk';
import { EndpointError } from 'sdk';
import { ADMIN_TG_IDS, NVIDIA_BASE_URL } from '../lib/config.js';
import { getApiKey, streamChat } from '../lib/nvidia.js';

// Ф0-пробник: каталог моделей + бенчмарк ролей пайплайна (планировщик/сжатие).
// Один вызов = одна модель (CLI-мост обрывает изолят на ~30с).
// mode 'list'  -> каталог /models
// mode 'bench' -> { model, kind: 'json'|'compress', attempts }

const PLANNER_PROMPT = [
  'Ты — планировщик AI-агента. Доступные инструменты: vision (описать картинки), search (веб-поиск), read_url (прочитать страницу), reason (размышление по подзадаче), direct_answer (прямой ответ без инструментов).',
  'Вопрос пользователя: «Сравни iPhone 17 и Galaxy S26: что актуальнее на 2026 год?»',
  'Краткая история: (пусто). Уровень усилия: medium (2-4 шага). Ключ поиска есть.',
  'Верни СТРОГО JSON-массив шагов, без markdown, без пояснений, формат:',
  '[{"type":"search","title":"кратко","params":{"query":"..."}}]',
].join('\n');

const COMPRESS_INPUT = [
  'Отчёт шага агента (vision): Изображение представляет собой фотографию праздничного стола, накрытого в квартире. На столе: белая скатерть, торт с оранжевой глазурью и тыквами из крема слева, ваза с осенними листьями (клён, рябина) в центре, 6 стаканов с яблочным соком, блюдо с печеньем в форме призрачков, гирлянда из бумажных летучих мышей над столом. Справа частично виден человек в костюме ведьмы: чёрная шляпа с широкими полями, фиолетовый плащ. Освещение тёплое, лампы накаливания, фон — бежевая стена с паутинным декором. Внизу кадра размытая рука с телефоном, снимающая торт. Качество среднее, шум при слабом свете.',
].join('');

const COMPRESS_PROMPT = [
  'Сожми отчёт шага агента в находку для планировщика. Сохрани все факты, имена, числа, надписи дословно. Максимум 2000 знаков. Без вступлений и пояснений — только сжатый текст.',
  '',
  COMPRESS_INPUT,
].join('\n');

// Ремонт частого сбоя малых моделей: лишняя закрывающая скобка, оборванный хвост.
function repairJson(text) {
  const t = String(text ?? '').replace(/```(?:json)?/gi, '').trim();
  const start = Math.min(...['[', '{'].map((c) => { const i = t.indexOf(c); return i === -1 ? Infinity : i; }));
  if (!isFinite(start)) return null;
  const s = t.slice(start);
  const stack = [];
  let inStr = false;
  let esc = false;
  let out = '';
  for (const ch of s) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr) { out += ch; continue; }
    if (ch === '[' || ch === '{') { stack.push(ch === '[' ? ']' : '}'); out += ch; continue; }
    if (ch === ']' || ch === '}') {
      const want = stack[stack.length - 1];
      if (want === ch) { stack.pop(); out += ch; }
      // лишняя закрывающая — молча выбрасываем
      continue;
    }
    out += ch;
  }
  // оборванный хвост: закрыть строки/скобки, отрезать висячую запятую
  let fixed = out;
  if (inStr) fixed += '"';
  while (fixed.length && /[,:[\s]$/.test(fixed)) fixed = fixed.slice(0, -1);
  fixed = fixed.replace(/,+$/, '');
  while (stack.length) fixed += stack.pop();
  return fixed;
}

function tryParse(text) {
  try { return { ok: true, value: JSON.parse(text) }; } catch (e) { return { ok: false, why: String(e?.message ?? e).slice(0, 80) }; }
}

function extractJson(text) {
  const v = tryParse(String(text ?? '').replace(/```(?:json)?/gi, '').trim());
  if (v.ok) return v;
  const fixed = repairJson(text);
  if (fixed === null) return { ok: false, why: 'no json marker' };
  const v2 = tryParse(fixed);
  if (v2.ok) return { ok: true, value: v2.value, repaired: true };
  return { ok: false, why: `repair: ${v2.why}` };
}

const LEAK_MARKERS = ['thinking process', 'thought process', 'reasoning_content', 'assistantanalysis'];

function validateJsonRun(content, reasoningLen) {
  const v = extractJson(content);
  const low = String(content ?? '').toLowerCase();
  const leak = LEAK_MARKERS.some((m) => low.includes(m));
  let stepsOk = false;
  if (v.ok && Array.isArray(v.value)) {
    stepsOk = v.value.length > 0 && v.value.every((s) => s && typeof s.type === 'string' && typeof s.title === 'string');
  }
  return { validJson: v.ok && stepsOk, repaired: !!v.repaired, why: v.why ?? null, steps: v.ok && Array.isArray(v.value) ? v.value.length : 0, leak, reasoningLen };
}

function validateCompressRun(content, reasoningLen) {
  return {
    len: content.length,
    within2000: content.length > 0 && content.length <= 2000,
    hasFacts: ['ведьм', 'тыкв', '6', 'яблочн'].filter((k) => content.toLowerCase().includes(k)).length,
    leak: /```|^\s*(вот|итог|сжат)/i.test(content),
    reasoningLen,
  };
}

async function benchOnce(model, kind, maxTokens) {
  const t0 = Date.now();
  let ttfb = null;
  let content = '';
  let reasoningLen = 0;
  let usage = null;
  let err = null;
  try {
    const messages = [{ role: 'user', content: kind === 'json' ? PLANNER_PROMPT : COMPRESS_PROMPT }];
    for await (const chunk of streamChat(messages, { model, temperature: 0.2, maxTokens })) {
      if (ttfb === null && ((chunk.delta && chunk.delta.length) || chunk.reasoning)) ttfb = Date.now() - t0;
      content += chunk.delta ?? '';
      if (chunk.reasoning) reasoningLen += chunk.reasoning.length;
      if (chunk.usage) usage = chunk.usage;
    }
  } catch (e) {
    err = String(e?.message ?? e).slice(0, 200);
  }
  const total = Date.now() - t0;
  return {
    ttfbMs: ttfb,
    totalMs: total,
    contentLen: content.length,
    contentPreview: content.slice(0, 400),
    ...(err ? { err } : {}),
    ...(usage ? { usage } : {}),
    ...(kind === 'json' ? validateJsonRun(content, reasoningLen) : validateCompressRun(content, reasoningLen)),
  };
}

async function listModels() {
  const apiKey = await getApiKey();
  const res = await fetch(`${NVIDIA_BASE_URL}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`models ${res.status}: ${text.slice(0, 200)}`);
  const data = JSON.parse(text);
  return { count: data?.data?.length ?? 0, ids: (data?.data ?? []).map((m) => m.id).sort() };
}

export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  const mode = input?.mode ?? 'list';
  if (mode === 'list') return listModels();
  if (mode === 'bench') {
    const model = String(input.model ?? '');
    if (!model) throw new EndpointError('model обязателен', { code: 'BAD_INPUT' });
    const kind = input.kind === 'compress' ? 'compress' : 'json';
    const attempts = Math.max(1, Math.min(5, Number(input.attempts ?? 3)));
    const maxTokens = Math.max(256, Math.min(8000, Number(input.maxTokens ?? 800)));
    const runs = [];
    for (let i = 0; i < attempts; i++) runs.push(await benchOnce(model, kind, maxTokens));
    const ok = runs.filter((r) => kind === 'json' ? r.validJson : r.within2000).length;
    const ttfbs = runs.map((r) => r.ttfbMs).filter((n) => typeof n === 'number');
    return {
      model,
      kind,
      ok,
      attempts,
      ttfbMinMs: ttfbs.length ? Math.min(...ttfbs) : null,
      ttfbMaxMs: ttfbs.length ? Math.max(...ttfbs) : null,
      runs,
    };
  }
  throw new EndpointError('mode: list|bench', { code: 'BAD_INPUT' });
}
