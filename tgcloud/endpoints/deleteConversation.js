import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { conversations, messages } from '../schema.js';
import { getConversationById } from '../lib/chat.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const convId = Number(input?.conversationId);
  if (!convId) throw new EndpointError('Не указан диалог', { code: 'BAD_INPUT' });
  const conv = await getConversationById(convId, tgUser.id);
  if (!conv) throw new EndpointError('Диалог не найден', { code: 'NOT_FOUND' });
  await db.delete(messages).where(eq(messages.conversationId, conv.id));
  await db.delete(conversations).where(eq(conversations.id, conv.id));
  return { ok: true, conversationId: conv.id };
}
