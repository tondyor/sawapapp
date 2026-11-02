import { db, EndpointError } from 'sdk';
import { eq, gte, gt, and } from 'sdk/db';
import { messages } from '../schema.js';
import { getConversationById, regenerateTurn } from '../lib/chat.js';
import { REASONING_LEVELS, MAX_MESSAGE_CHARS } from '../lib/config.js';
import { sanitizeTurnId } from '../lib/turnEvents.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const messageId = Number(input?.messageId);
  const content = input?.content == null ? null : String(input.content).trim();
  const reasoning = REASONING_LEVELS.includes(input?.reasoning) ? input.reasoning : undefined;
  const turnId = sanitizeTurnId(input?.turnId);
  if (!messageId) throw new EndpointError('Не указано сообщение', { code: 'BAD_INPUT' });
  if (content && content.length > MAX_MESSAGE_CHARS) {
    throw new EndpointError(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`, { code: 'TOO_LONG' });
  }

  const m = await db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!m) throw new EndpointError('Сообщение не найдено', { code: 'NOT_FOUND' });
  const conv = await getConversationById(m.conversationId, tgUser.id);
  if (!conv) throw new EndpointError('Диалог не найден', { code: 'NOT_FOUND' });

  if (m.role === 'user') {
    if (!content) throw new EndpointError('Пустое сообщение', { code: 'EMPTY_MESSAGE' });
    await db.update(messages).set({ content }).where(eq(messages.id, messageId));
    const oldTitle = (conv.title ?? '').slice(0, 80);
    if (oldTitle && oldTitle === (m.content ?? '').slice(0, 80)) {
      await db.update(conversations).set({ title: content.slice(0, 80) }).where(eq(conversations.id, conv.id));
    }
    await db.delete(messages).where(and(eq(messages.conversationId, conv.id), gt(messages.id, messageId)));
  } else {
    await db.delete(messages).where(and(eq(messages.conversationId, conv.id), gte(messages.id, messageId)));
  }

  try {
    const result = await regenerateTurn({ tgUser, conversationId: conv.id, reasoning, turnId });
    return {
      conversationId: conv.id,
      agentId: result.agent.id,
      agentName: result.agent.name,
      reply: result.reply,
      reasoning: result.conv.reasoning,
      meta: result.meta,
    };
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (msg.includes('Нечего перегенерировать')) throw new EndpointError(msg, { code: 'NOTHING_TO_REGENERATE' });
    throw e;
  }
}
