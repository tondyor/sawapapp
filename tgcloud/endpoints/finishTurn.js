import { EndpointError } from 'sdk';
import { finishTurnSynthesis } from '../lib/agent/turn.js';

// Финальный синтез хода: находки → ответ → запись assistant-сообщения в чат.
export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const turnId = String(input?.turnId ?? '');
  if (!turnId) throw new EndpointError('turnId обязателен', { code: 'BAD_TURN' });
  try {
    return await finishTurnSynthesis({ turnId, tgId: tgUser.id });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (e?.code) throw new EndpointError(m, { code: e.code });
    if (m.includes('NVIDIA_API_KEY')) throw new EndpointError('Сервис настраивается, ключ модели ещё не задан', { code: 'KEY_MISSING' });
    if (m.startsWith('NVIDIA API')) throw new EndpointError(`Модель вернула ошибку: ${m.replace('NVIDIA API', '').trim().slice(0, 200)}`, { code: 'MODEL_ERROR' });
    throw e;
  }
}
