import { EndpointError } from 'sdk';
import { startTurn } from '../lib/agent/turn.js';

// Перегенерация с сообщения юзера: ход пайплайна (планировщик → шаги →
// кусочный синтез), всё после выбранного сообщения удаляется на сервере.
// Клиент ведёт ход как обычную отправку: runTurnStep → finishTurn.
export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const messageId = Number(input?.messageId);
  const conversationId = Number(input?.conversationId);
  if (!messageId || !conversationId) {
    throw new EndpointError('messageId и conversationId обязательны', { code: 'BAD_INPUT' });
  }
  try {
    return await startTurn({
      tgUser,
      agentId: input?.agentId,
      conversationId,
      text: '',
      fromMessageId: messageId,
    });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (e?.code) throw new EndpointError(m, { code: e.code });
    if (m.includes('NVIDIA_API_KEY')) throw new EndpointError('Сервис настраивается, ключ модели ещё не задан', { code: 'KEY_MISSING' });
    throw e;
  }
}
