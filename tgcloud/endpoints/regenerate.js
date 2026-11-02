import { db, EndpointError } from 'sdk';
import { eq, gte, gt, and } from 'sdk/db';
import { messages } from '../schema.js';
import { getConversationById, regenerateTurn, ensureUser, latestConversation } from '../lib/chat.js';
import { REASONING_LEVELS } from '../lib/config.js';
import { sanitizeTurnId } from '../lib/turnEvents.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const reasoning = REASONING_LEVELS.includes(input?.reasoning) ? input.reasoning : undefined;
  const turnId = sanitizeTurnId(input?.turnId);
  let conversationId = input?.conversationId ? Number(input.conversationId) : null;

  if (input?.messageId) {
    const messageId = Number(input.messageId);
    const m = await db.select().from(messages).where(eq(messages.id, messageId)).get();
    if (!m) throw new EndpointError('Сообщение не найдено', { code: 'NOT_FOUND' });
    const conv = await getConversationById(m.conversationId, tgUser.id);
    if (!conv) throw new EndpointError('Диалог не найден', { code: 'NOT_FOUND' });
    if (m.role === 'user') {
      await db.delete(messages).where(and(eq(messages.conversationId, conv.id), gt(messages.id, messageId)));
    } else {
      await db.delete(messages).where(and(eq(messages.conversationId, conv.id), gte(messages.id, messageId)));
    }
    conversationId = conv.id;
  }

  if (!conversationId) {
    const userRow = await ensureUser(tgUser);
    const conv = await latestConversation(userRow, null);
    if (!conv) throw new EndpointError('Нет диалога для перегенерации', { code: 'NOT_FOUND' });
    conversationId = conv.id;
  }

  try {
    const result = await regenerateTurn({ tgUser, conversationId, reasoning, turnId });
    return {
      conversationId: result.conv.id,
      agentId: result.agent.id,
      agentName: result.agent.name,
      reply: result.reply,
      reasoning: result.conv.reasoning,
      meta: result.meta,
    };
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (msg.includes('Диалог не найден')) throw new EndpointError(msg, { code: 'NOT_FOUND' });
    if (msg.includes('Нечего перегенерировать')) throw new EndpointError(msg, { code: 'NOTHING_TO_REGENERATE' });
    throw e;
  }
}
