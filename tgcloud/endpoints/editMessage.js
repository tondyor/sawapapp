import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { conversations, messages } from '../schema.js';
import { getConversationById, deleteMessagesAfter, regenerateTurn } from '../lib/chat.js';
import { REASONING_LEVELS, MAX_MESSAGE_CHARS } from '../lib/config.js';
import { sanitizeTurnId } from '../lib/turnEvents.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const messageId = Number(input?.messageId);
  const content = String(input?.content ?? '').trim();
  const reasoning = REASONING_LEVELS.includes(input?.reasoning) ? input.reasoning : undefined;
  const turnId = sanitizeTurnId(input?.turnId);
  if (!messageId) throw new EndpointError('Не указано сообщение', { code: 'BAD_INPUT' });
  if (!content) throw new EndpointError('Пустое сообщение', { code: 'EMPTY_MESSAGE' });
  if (content.length > MAX_MESSAGE_CHARS) {
    throw new EndpointError(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`, { code: 'TOO_LONG' });
  }

  const m = await db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!m) throw new EndpointError('Сообщение не найдено', { code: 'NOT_FOUND' });
  const conv = await getConversationById(m.conversationId, tgUser.id);
  if (!conv) throw new EndpointError('Диалог не найден', { code: 'NOT_FOUND' });

  if (m.role === 'assistant') {
    await db.update(messages).set({ content }).where(eq(messages.id, messageId));
    return { updated: true, conversationId: conv.id };
  }

  const oldTitle = (conv.title ?? '').slice(0, 80);
  await db.update(messages).set({ content }).where(eq(messages.id, messageId));
  if (oldTitle && oldTitle === (m.content ?? '').slice(0, 80)) {
    await db.update(conversations).set({ title: content.slice(0, 80) }).where(eq(conversations.id, conv.id));
  }
  await deleteMessagesAfter(conv.id, messageId);

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
    if (msg.includes('слишком длинное')) throw new EndpointError(msg, { code: 'TOO_LONG' });
    if (msg.includes('NVIDIA_API_KEY')) throw new EndpointError('Сервис настраивается, ключ модели ещё не задан', { code: 'KEY_MISSING' });
    if (msg.includes('Изображение слишком большое')) throw new EndpointError(msg, { code: 'IMAGE_TOO_BIG' });
    if (msg.includes('Файл изображения недоступен')) throw new EndpointError('Не удалось прочитать изображение — попробуйте отправить его заново.', { code: 'IMAGE_UNAVAILABLE' });
    if (msg.includes('Vision-модель')) throw new EndpointError('Не удалось разобрать изображение, попробуйте ещё раз.', { code: 'VISION_FAILED' });
    if (msg.includes('пустой ответ')) throw new EndpointError('Модель вернула пустой ответ — переформулируйте запрос или снизьте уровень рассуждений.', { code: 'EMPTY_REPLY' });
    if (msg.startsWith('NVIDIA API')) {
      throw new EndpointError(`Модель вернула ошибку: ${msg.replace('NVIDIA API', '').trim().slice(0, 200)}`, { code: 'MODEL_ERROR' });
    }
    throw e;
  }
}
