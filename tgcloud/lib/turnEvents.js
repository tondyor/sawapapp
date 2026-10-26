// События хода агента для Mini App: эндпоинт пишет их в БД по мере генерации,
// клиент параллельно опрашивает getTurnEvents и рисует ход размышлений в realtime.
// В рантайме нет таймеров и фоновых задач после возврата эндпоинта, поэтому
// единственный канал realtime — поллинг этой таблицы из отдельного запроса.
import { db } from 'sdk';
import { eq, and, gt, ne, desc } from 'sdk/db';
import { turnEvents } from '../schema.js';

export const TURN_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

export function sanitizeTurnId(id) {
  const s = String(id ?? '').trim();
  return TURN_ID_RE.test(s) ? s : null;
}

async function insertEvent({ turnId, conversationId, tgId, type, payload = null }) {
  const [row] = await db.insert(turnEvents).values({
    turnId, conversationId, tgId, type,
    ...(payload ? { payload } : {}),
  }).returning({ id: turnEvents.id });
  return row?.id ?? null;
}

// Перед новым ходом подчищаем события старых ходов этого диалога: они нужны
// только для live-прогресса, история хранится в messages.meta.
export async function cleanupConversationTurns(conversationId, keepTurnId) {
  await db.delete(turnEvents).where(
    and(eq(turnEvents.conversationId, conversationId), ne(turnEvents.turnId, keepTurnId)),
  );
}

export function createRecorder({ turnId, conversationId, tgId }) {
  let written = 0;
  return {
    get count() { return written; },
    async event(type, payload) {
      const id = await insertEvent({ turnId, conversationId, tgId, type, payload });
      if (id) written += 1;
      return id;
    },
  };
}

export async function readTurnEvents(turnId, tgId, afterId = 0) {
  const rows = await db.select().from(turnEvents)
    .where(and(eq(turnEvents.turnId, turnId), eq(turnEvents.tgId, tgId), gt(turnEvents.id, Number(afterId) || 0)))
    .orderBy(turnEvents.id)
    .limit(500)
    .all();
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    payload: r.payload ?? null,
    at: r.createdAt instanceof Date ? r.createdAt.getTime() : (r.createdAt ?? null),
  }));
}

export async function latestTurnIdForConversation(conversationId) {
  const row = await db.select({ turnId: turnEvents.turnId }).from(turnEvents)
    .where(eq(turnEvents.conversationId, conversationId))
    .orderBy(desc(turnEvents.id))
    .limit(1)
    .get();
  return row?.turnId ?? null;
}
