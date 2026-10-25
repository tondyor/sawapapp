import { EndpointError } from 'sdk';
import { completeTurn } from '../lib/chat.js';
import { MAX_MESSAGE_CHARS, REASONING_LEVELS } from '../lib/config.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const text = String(input?.text ?? '').trim();
  if (!text) throw new EndpointError('Пустое сообщение', { code: 'EMPTY_MESSAGE' });
  if (text.length > MAX_MESSAGE_CHARS) {
    throw new EndpointError(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`, { code: 'TOO_LONG' });
  }
  const reasoning = REASONING_LEVELS.includes(input?.reasoning) ? input.reasoning : undefined;
  let result;
  try {
    result = await completeTurn({ tgUser, agentId: input?.agentId, text, reasoning, conversationId: input?.conversationId });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (m.includes('слишком длинное')) throw new EndpointError(m, { code: 'TOO_LONG' });
    if (m.includes('NVIDIA_API_KEY')) throw new EndpointError('Сервис настраивается, ключ модели ещё не задан', { code: 'KEY_MISSING' });
    throw e;
  }
  return {
    conversationId: result.conv.id,
    agentId: result.agent.id,
    agentName: result.agent.name,
    reply: result.reply,
    reasoning: result.conv.reasoning,
    meta: result.meta,
  };
}
