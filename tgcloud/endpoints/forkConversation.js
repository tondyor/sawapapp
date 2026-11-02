import { db, EndpointError } from 'sdk';
import { eq, asc, lte, and } from 'sdk/db';
import { conversations, messages } from '../schema.js';
import { getConversationById, createConversation, ensureUser } from '../lib/chat.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const convId = Number(input?.conversationId);
  if (!convId) throw new EndpointError('Не указан диалог', { code: 'BAD_INPUT' });
  const src = await getConversationById(convId, tgUser.id);
  if (!src) throw new EndpointError('Диалог не найден', { code: 'NOT_FOUND' });

  const userRow = await ensureUser(tgUser);
  const copy = await createConversation(userRow, src.agentId, src.title ? `Копия: ${src.title.slice(0, 70)}` : 'Копия диалога');
  copy.reasoning = src.reasoning ?? 'fast';

  const conds = [eq(messages.conversationId, src.id)];
  if (input?.upToMessageId) {
    const upTo = Number(input.upToMessageId);
    if (!upTo) throw new EndpointError('Неверное сообщение', { code: 'BAD_INPUT' });
    conds.push(lte(messages.id, upTo));
  }
  const srcMessages = await db.select().from(messages)
    .where(and(...conds))
    .orderBy(asc(messages.id))
    .all();

  const chunk = [];
  const flush = async () => {
    if (!chunk.length) return;
    await db.insert(messages).values(chunk).run();
    chunk.length = 0;
  };
  let copied = 0;
  for (const m of srcMessages) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    chunk.push({
      conversationId: copy.id,
      role: m.role,
      content: m.content,
      agentId: m.agentId ?? src.agentId,
      ...(m.meta ? { meta: m.meta } : {}),
    });
    copied += 1;
    if (chunk.length >= 40) await flush();
  }
  await flush();

  return { conversationId: copy.id, agentId: copy.agentId, copied };
}
