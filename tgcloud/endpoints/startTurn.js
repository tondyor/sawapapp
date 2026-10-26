import { EndpointError } from 'sdk';
import { startTurn } from '../lib/agent/turn.js';
import { MAX_MESSAGE_CHARS } from '../lib/config.js';

// Создаёт ход: планирует шаги, пишет user-сообщение, возвращает план.
// Клиент затем крутит runTurnStep, пока статус не станет done/synthesizing.
export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const text = String(input?.text ?? '').trim();
  const attachmentIds = Array.isArray(input?.attachmentIds) ? input.attachmentIds.slice(0, 4).map(Number).filter(Boolean) : [];
  if (!text && !attachmentIds.length) throw new EndpointError('Пустое сообщение', { code: 'EMPTY_MESSAGE' });
  if (text.length > MAX_MESSAGE_CHARS) throw new EndpointError(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`, { code: 'TOO_LONG' });
  try {
    return await startTurn({
      tgUser,
      agentId: input?.agentId,
      text,
      reasoning: input?.reasoning,
      conversationId: input?.conversationId,
      attachmentIds,
    });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (e?.code) throw new EndpointError(m, { code: e.code });
    if (m.includes('слишком длинное')) throw new EndpointError(m, { code: 'TOO_LONG' });
    if (m.includes('NVIDIA_API_KEY')) throw new EndpointError('Сервис настраивается, ключ модели ещё не задан', { code: 'KEY_MISSING' });
    if (m.includes('Вложение не найдено')) throw new EndpointError('Вложение не найдено', { code: 'FILE_NOT_FOUND' });
    throw e;
  }
}
