import { fetch } from 'sdk';
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { settings } from '../schema.js';
import { DEFAULT_MODEL, KEY_SETTING, NVIDIA_BASE_URL, MAX_OUTPUT_TOKENS, TEMPERATURE } from './config.js';

export async function getApiKey() {
  const row = await db.select().from(settings).where(eq(settings.key, KEY_SETTING)).get();
  if (!row || !row.value) {
    throw new Error('NVIDIA_API_KEY не задан. Сидируется через endpoints/adminSetSetting.');
  }
  return row.value;
}

function buildRequest(messages, opts = {}) {
  return {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? TEMPERATURE,
      max_tokens: opts.maxTokens ?? MAX_OUTPUT_TOKENS,
      stream: false,
    }),
  };
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
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, buildRequest(messages, { ...opts, apiKey }));
  const text = await res.text();
  if (!res.ok) throw apiError(res.status, text);
  let data;
  try { data = JSON.parse(text); } catch (_) { throw new Error('NVIDIA API: некорректный JSON в ответе'); }
  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? '';
  const finish = choice?.finish_reason ?? '';
  if (!content && finish !== 'length') {
    throw new Error(`NVIDIA API: пустой ответ (finish_reason=${finish})`);
  }
  return { content, model: data?.model ?? opts.model ?? DEFAULT_MODEL, usage: data?.usage ?? null };
}

export async function* streamChat(messages, opts = {}) {
  const apiKey = opts.apiKey ?? (await getApiKey());
  const req = buildRequest(messages, { ...opts, apiKey });
  req.headers.Accept = 'text/event-stream';
  req.body = req.body.replace('"stream":false', '"stream":true');
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, req);
  if (!res.ok) throw apiError(res.status, await res.text());
  for await (const line of sseLines(res.body)) {
    const t = line.trim();
    if (!t.startsWith('data:')) continue;
    const payload = t.slice(5).trim();
    if (payload === '[DONE]') return;
    let j;
    try { j = JSON.parse(payload); } catch (_) { continue; }
    const delta = j?.choices?.[0]?.delta?.content;
    if (delta) yield { delta, finish: j?.choices?.[0]?.finish_reason ?? null };
  }
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
