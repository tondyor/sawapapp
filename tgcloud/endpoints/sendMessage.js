import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { files } from '../schema.js';
import { completeTurn } from '../lib/chat.js';
import { MAX_MESSAGE_CHARS, REASONING_LEVELS } from '../lib/config.js';
import { sanitizeTurnId } from '../lib/turnEvents.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const text = String(input?.text ?? '').trim();
  const attachmentIds = Array.isArray(input?.attachmentIds) ? input.attachmentIds.slice(0, 4).map(Number).filter(Boolean) : [];
  if (!text && !attachmentIds.length) throw new EndpointError('Пустое сообщение', { code: 'EMPTY_MESSAGE' });
  if (text.length > MAX_MESSAGE_CHARS) {
    throw new EndpointError(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`, { code: 'TOO_LONG' });
  }
  const reasoning = REASONING_LEVELS.includes(input?.reasoning) ? input.reasoning : undefined;
  const turnId = sanitizeTurnId(input?.turnId);

  let attachments = null;
  if (attachmentIds.length) {
    attachments = [];
    for (const fid of attachmentIds) {
      const row = await db.select().from(files).where(eq(files.id, fid)).get();
      if (!row || row.tgId !== tgUser.id) {
        throw new EndpointError('Вложение не найдено', { code: 'FILE_NOT_FOUND' });
      }
      attachments.push({ fileId: row.id, name: row.name, mime: row.mime, size: row.size });
    }
  }

  let result;
  try {
    result = await completeTurn({ tgUser, agentId: input?.agentId, text, reasoning, conversationId: input?.conversationId, attachments, turnId });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (m.includes('слишком длинное')) throw new EndpointError(m, { code: 'TOO_LONG' });
    if (m.includes('NVIDIA_API_KEY')) throw new EndpointError('Сервис настраивается, ключ модели ещё не задан', { code: 'KEY_MISSING' });
    if (m.includes('Изображение слишком большое')) throw new EndpointError(m, { code: 'IMAGE_TOO_BIG' });
    if (m.includes('Файл изображения недоступен')) throw new EndpointError('Не удалось прочитать изображение — попробуйте отправить его заново.', { code: 'IMAGE_UNAVAILABLE' });
    if (m.includes('Vision-модель')) throw new EndpointError('Не удалось разобрать изображение, попробуйте ещё раз.', { code: 'VISION_FAILED' });
    if (m.includes('пустой ответ')) throw new EndpointError('Модель вернула пустой ответ — переформулируйте запрос или снизьте уровень рассуждений.', { code: 'EMPTY_REPLY' });
    if (m.startsWith('NVIDIA API')) {
      throw new EndpointError(`Модель вернула ошибку: ${m.replace('NVIDIA API', '').trim().slice(0, 200)}`, { code: 'MODEL_ERROR' });
    }
    throw e;
  }
  return {
    conversationId: result.conv.id,
    agentId: result.agent.id,
    agentName: result.agent.name,
    reply: result.reply,
    reasoning: result.conv.reasoning,
    meta: result.meta,
    attachments: attachments ?? [],
  };
}
