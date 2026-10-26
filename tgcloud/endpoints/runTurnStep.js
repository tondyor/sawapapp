import { EndpointError } from 'sdk';
import { runTurnStep } from '../lib/agent/turn.js';

// Исполняет ОДИН следующий шаг хода: находка → advance → возможный re-plan.
// Обрыв вызова не теряет ход: состояние в БД, клиент продолжает с currentStep.
export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const turnId = String(input?.turnId ?? '');
  if (!turnId) throw new EndpointError('turnId обязателен', { code: 'BAD_TURN' });
  try {
    return await runTurnStep({ turnId, tgId: tgUser.id });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (e?.code) throw new EndpointError(m, { code: e.code });
    if (m.includes('NVIDIA_API_KEY')) throw new EndpointError('Сервис настраивается, ключ модели ещё не задан', { code: 'KEY_MISSING' });
    if (m.startsWith('NVIDIA API')) throw new EndpointError(`Модель вернула ошибку: ${m.replace('NVIDIA API', '').trim().slice(0, 200)}`, { code: 'MODEL_ERROR' });
    throw e;
  }
}
