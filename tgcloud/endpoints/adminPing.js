import { getApiKey } from '../lib/nvidia.js';
import { completeChat, streamChat } from '../lib/nvidia.js';
import { ADMIN_TG_IDS, DEFAULT_MODEL } from '../lib/config.js';
import { EndpointError } from 'sdk';

export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) {
    throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
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
  let chunks = 0;
  for await (const ev of streamChat(msgs, { model: input?.model ?? DEFAULT_MODEL, maxTokens: 128 })) {
    streamed += ev.delta;
    chunks += 1;
  }
  const streamMs = Date.now() - streamStarted;

  return {
    ok: true,
    model: input?.model ?? DEFAULT_MODEL,
    complete: { ms: completeMs, len: full.content.length },
    stream: { ms: streamMs, chunks, len: streamed.length, sample: streamed.slice(0, 120) },
  };
}
