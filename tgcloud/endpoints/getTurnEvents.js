import { EndpointError } from 'sdk';
import { readTurnEvents, sanitizeTurnId } from '../lib/turnEvents.js';

// Поллинг хода агента для Mini App: клиент вызывает каждые ~700мс, пока идёт
// генерация, и рисует шаги/размышления над ответом в realtime.
export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const turnId = sanitizeTurnId(input?.turnId);
  if (!turnId) throw new EndpointError('Неверный turnId', { code: 'BAD_INPUT' });
  const afterId = Number(input?.afterId) || 0;
  const events = await readTurnEvents(turnId, tgUser.id, afterId);
  return {
    turnId,
    events,
    lastId: events.length ? events[events.length - 1].id : afterId,
    done: events.some((e) => e.type === 'done' || e.type === 'error'),
  };
}
