import { getApiKey } from '../lib/nvidia.js';
import { completeChat, streamChat } from '../lib/nvidia.js';
import { fetch } from 'sdk';
import { ADMIN_TG_IDS, DEFAULT_MODEL, NVIDIA_BASE_URL } from '../lib/config.js';
import { EndpointError } from 'sdk';

export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) {
    throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  }

  if (input?.probe) {
    return probe(String(input.probe), input?.model ?? DEFAULT_MODEL);
  }

  const msgs = [
    { role: 'system', content: 'Отвечай ровно одним коротким предложением.' },
    { role: 'user', content: 'Скажи, что связь работает.' },
  ];
  const started = Date.now();
  await getApiKey();
  const full = await completeChat(msgs, { model: input?.model ?? DEFAULT_MODEL, maxTokens: 128 });
  const completeMs = Date.now() - started;

  const streamStarted = Date.now();
  let streamed = '';
  let reasoningLen = 0;
  let chunks = 0;
  for await (const ev of streamChat(msgs, { model: input?.model ?? DEFAULT_MODEL, maxTokens: 128 })) {
    streamed += ev.delta;
    if (ev.reasoning) reasoningLen += ev.reasoning.length;
    chunks += 1;
  }
  const streamMs = Date.now() - streamStarted;

  return {
    ok: true,
    model: input?.model ?? DEFAULT_MODEL,
    complete: { ms: completeMs, len: full.content.length },
    stream: { ms: streamMs, chunks, len: streamed.length, reasoningLen, sample: streamed.slice(0, 120) },
  };
}

async function probe(kind, model) {
  const apiKey = await getApiKey();
  const body = {
    model,
    messages: [{ role: 'user', content: 'Сколько будет 17 * 23? Ответь коротко.' }],
    max_tokens: kind === 'effort_low' ? 2048 : 1024,
    stream: false,
  };
  if (kind === 'chat_template_on') body.chat_template_kwargs = { thinking: true };
  if (kind === 'chat_template_off') body.chat_template_kwargs = { thinking: false };
  if (kind === 'effort_low') body.reasoning_effort = 'low';
  if (kind === 'dump_on') {
    body.chat_template_kwargs = { thinking: true };
    body.max_tokens = 2048;
    body.messages = [{ role: 'user', content: 'Рассуждай подробно: что тяжелее — килограмм пуха или килограмм железа?' }];
  }
  if (kind === 'dump_sys') {
    body.max_tokens = 2048;
    body.messages = [
      { role: 'system', content: 'detailed thinking on' },
      { role: 'user', content: 'Рассуждай подробно: что тяжелее — килограмм пуха или килограмм железа?' },
    ];
  }
  if (kind === 'tool_required') {
    body.tools = [{
      type: 'function',
      function: {
        name: 'read_skill',
        description: 'Читать инструкцию',
        parameters: { type: 'object', properties: { skill: { type: 'string', enum: ['a', 'b'] } }, required: ['skill'] },
      },
    }];
    body.tool_choice = 'required';
    body.messages = [{ role: 'user', content: 'Сколько будет 2 + 2?' }];
  }
  if (kind === 'tool_auto') {
    body.tools = [{
      type: 'function',
      function: {
        name: 'read_skill',
        description: 'Читать инструкцию по проверке договора. Вызывай для правовых вопросов.',
        parameters: { type: 'object', properties: { skill: { type: 'string', enum: ['rf-consult-protocol'] } }, required: ['skill'] },
      },
    }];
    body.tool_choice = 'auto';
    body.messages = [
      { role: 'system', content: 'Доступные навыки: - rf-consult-protocol: Протокол юридической консультации. Вызывай read_skill для правовых вопросов.' },
      { role: 'user', content: 'Мне вернули бракованный товар, магазин не возвращает деньги. Как действовать?' },
    ];
  }

  const started = Date.now();
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const ms = Date.now() - started;
  if (!res.ok) {
    return { kind, status: res.status, ms, error: text.slice(0, 300) };
  }
  let j;
  try { j = JSON.parse(text); } catch (_) { return { kind, status: res.status, ms, error: 'bad json' }; }
  const choice = j?.choices?.[0] ?? {};
  const msg = choice.message ?? {};
  if (kind === 'tool_required' || kind === 'tool_auto') {
    return {
      kind,
      status: res.status,
      ms,
      toolCalls: msg.tool_calls ?? null,
      content: String(msg.content ?? '').slice(0, 100),
      finish: choice.finish_reason ?? null,
    };
  }
  if (kind === 'dump_on' || kind === 'dump_sys') {
    return {
      kind,
      status: res.status,
      ms,
      messageKeys: Object.keys(msg),
      choiceKeys: Object.keys(choice),
      finish: choice.finish_reason ?? null,
      completionTokens: j?.usage?.completion_tokens ?? null,
      raw: JSON.stringify(choice).slice(0, 600),
    };
  }
  return {
    kind,
    status: res.status,
    ms,
    model: j?.model,
    content: String(msg.content ?? '').slice(0, 120),
    reasoningLen: String(msg.reasoning_content ?? '').length,
    reasoningSample: String(msg.reasoning_content ?? '').slice(0, 150),
    completionTokens: j?.usage?.completion_tokens ?? null,
  };
}
