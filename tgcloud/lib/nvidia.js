import { fetch } from 'sdk';
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { settings } from '../schema.js';
import {
  DEFAULT_MODEL, KEY_SETTING, NVIDIA_BASE_URL, MAX_OUTPUT_TOKENS, TEMPERATURE, REASONING_BUDGET, REASONING_MODEL, VISION_MODEL, PLANNER_MODEL, COMPRESS_MODEL,
} from './config.js';
export async function getApiKey() {
  const row = await db.select().from(settings).where(eq(settings.key, KEY_SETTING)).get();
  if (!row || !row.value) {
    throw new Error('NVIDIA_API_KEY не задан. Сидируется через endpoints/adminSetSetting.');
  }
  return row.value;
}

// Значение из settings с дефолтом (пустая строка/whitespace = используем дефолт).
export async function getSettingOr(key, fallback) {
  try {
    const row = await db.select().from(settings).where(eq(settings.key, key)).get();
    const v = row?.value?.trim();
    return v ? v : fallback;
  } catch (_) {
    return fallback;
  }
}

// Модель-«зритель» для vision-шага агента (читает изображения).
export function getVisionModel() {
  return getSettingOr('VISION_MODEL', VISION_MODEL);
}

export function getDefaultModel() {
  return getSettingOr('DEFAULT_MODEL', DEFAULT_MODEL);
}

// Модель-планировщик хода (строгий JSON-план). Ф0: bolt-e4b 5/5 после repair.
export function getPlannerModel() {
  return getSettingOr('PLANNER_MODEL', PLANNER_MODEL);
}

// Модель-сжиматель находок шагов (<=2000 знаков). Ф0: bolt-e4b 3/3.
export function getCompressModel() {
  return getSettingOr('COMPRESS_MODEL', COMPRESS_MODEL);
}

// Основная модель ответа: thinking-модель для уровней рассуждений, иначе дефолт.
export async function pickMainModel({ reasoning, defaultModel }) {
  if (reasoning && reasoning !== 'fast') return REASONING_MODEL;
  return defaultModel ?? getDefaultModel();
}

// chat_template_kwargs.thinking поддерживают модели семейства nemotron-3.5
// (super-vl, lightning; bolt флаг игнорирует — безвредно). Прочим моделям
// (например deepseek) флаг не отправляем вообще.
function thinkingToggleSupported(model) {
  return typeof model === 'string' && model.startsWith('nvidia/nemotron-3.5');
}

function buildBody(messages, opts = {}) {
  const model = opts.model ?? DEFAULT_MODEL;
  const body = {
    model,
    messages,
    temperature: opts.temperature ?? TEMPERATURE,
    max_tokens: opts.maxTokens ?? MAX_OUTPUT_TOKENS,
    stream: opts.stream === true,
  };
  if (opts.reasoning && opts.reasoning !== 'fast') {
    body.max_tokens = REASONING_BUDGET[opts.reasoning] ?? MAX_OUTPUT_TOKENS;
  }
  if (thinkingToggleSupported(model)) {
    body.chat_template_kwargs = { thinking: opts.reasoning && opts.reasoning !== 'fast' };
  }
  if (body.stream) body.stream_options = { include_usage: true };
  if (opts.tools && opts.tools.length) {
    body.tools = opts.tools;
    body.tool_choice = 'auto';
  }
  return body;
}

function apiError(status, bodyText) {
  let hint = '';
  try {
    const j = JSON.parse(bodyText);
    hint = j?.detail ?? j?.message ?? j?.error?.message ?? '';
    if (Array.isArray(hint)) hint = hint.map((d) => d?.message ?? JSON.stringify(d)).join('; ');
  } catch (_) {}
  return new Error(`NVIDIA API ${status}: ${String(hint || bodyText).slice(0, 400)}`);
}

export async function completeChat(messages, opts = {}) {
  const apiKey = opts.apiKey ?? (await getApiKey());
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(buildBody(messages, { ...opts, apiKey })),
  });
  const text = await res.text();
  if (!res.ok) throw apiError(res.status, text);
  let data;
  try { data = JSON.parse(text); } catch (_) { throw new Error('NVIDIA API: некорректный JSON в ответе'); }
  const choice = data?.choices?.[0];
  const msg = choice?.message ?? {};
  const content = msg.content ?? '';
  const finish = choice?.finish_reason ?? '';
  if (!content && !msg.tool_calls?.length && finish !== 'length') {
    throw new Error(`NVIDIA API: пустой ответ (finish_reason=${finish})`);
  }
  return {
    content,
    reasoning: typeof msg.reasoning_content === 'string' ? msg.reasoning_content : '',
    toolCalls: msg.tool_calls ?? null,
    model: normalizeModelId(data?.model) ?? opts.model ?? DEFAULT_MODEL,
    usage: data?.usage ?? null,
  };
}

// NIM возвращает то 'nvidia/...', то 'private/nvidia/...' — приводим к каталогу.
export function normalizeModelId(m) {
  return typeof m === 'string' && m ? m.replace(/^private\//, '') : null;
}

export async function* streamChat(messages, opts = {}) {
  const apiKey = opts.apiKey ?? (await getApiKey());
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(buildBody(messages, { ...opts, apiKey, stream: true })),
  });
  if (!res.ok) throw apiError(res.status, await res.text());
  const toolAcc = new Map();
  let usage = null;
  for await (const line of sseLines(res.body)) {
    const t = line.trim();
    if (!t.startsWith('data:')) continue;
    const payload = t.slice(5).trim();
    if (payload === '[DONE]') {
      if (toolAcc.size) yield { delta: '', reasoning: null, finish: 'tool_calls', toolCalls: [...toolAcc.values()], model: null, usage };
      else if (usage) yield { delta: '', reasoning: null, finish: null, model: null, usage };
      return;
    }
    let j;
    try { j = JSON.parse(payload); } catch (_) { continue; }
    if (j?.usage) usage = j.usage;
    const choice = j?.choices?.[0];
    if (!choice) continue;
    const delta = choice?.delta ?? {};
    const tcs = delta.tool_calls;
    if (Array.isArray(tcs)) {
      for (const tc of tcs) {
        const idx = tc.index ?? 0;
        const prev = toolAcc.get(idx) ?? { id: tc.id ?? null, type: 'function', function: { name: '', arguments: '' } };
        if (tc.id) prev.id = tc.id;
        if (tc.function?.name) prev.function.name = tc.function.name;
        if (tc.function?.arguments) prev.function.arguments += tc.function.arguments;
        toolAcc.set(idx, prev);
      }
    }
    const hasContent = typeof delta.content === 'string' && delta.content.length > 0;
    const hasReasoning = typeof delta.reasoning_content === 'string' && delta.reasoning_content.length > 0;
    if (hasContent || hasReasoning || toolAcc.size) {
      yield {
        delta: delta.content ?? '',
        reasoning: hasReasoning ? delta.reasoning_content : null,
        finish: choice?.finish_reason ?? null,
        model: normalizeModelId(j?.model),
        ...(usage ? { usage } : {}),
        ...(toolAcc.size ? { toolCalls: [...toolAcc.values()] } : {}),
      };
    }
  }
  if (toolAcc.size) yield { delta: '', reasoning: null, finish: 'tool_calls', toolCalls: [...toolAcc.values()], model: null, usage };
  else if (usage) yield { delta: '', reasoning: null, finish: null, model: null, usage };
}

function utf8Decode(bytes) {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    let cp;
    if (b < 0x80) { cp = b; i += 1; }
    else if (b < 0xe0) { cp = ((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f); i += 2; }
    else if (b < 0xf0) { cp = ((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f); i += 3; }
    else { cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f); i += 4; }
    out += String.fromCodePoint(cp);
  }
  return out;
}

function mergeBytes(parts, total) {
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

async function* sseLines(body) {
  let parts = [];
  let len = 0;
  for await (const chunk of body) {
    let start = 0;
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === 0x0a) {
        if (i > start) { parts.push(chunk.subarray(start, i)); len += i - start; }
        if (len > 0) yield utf8Decode(mergeBytes(parts, len));
        parts = [];
        len = 0;
        start = i + 1;
      }
    }
    if (start < chunk.length) { parts.push(chunk.subarray(start)); len += chunk.length - start; }
  }
  if (len > 0) yield utf8Decode(mergeBytes(parts, len));
}
