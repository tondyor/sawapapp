import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { files } from '../schema.js';
import { completeTurn } from '../lib/chat.js';
import { MAX_MESSAGE_CHARS, REASONING_LEVELS } from '../lib/config.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const text = String(input?.text ?? '').trim();
  const attachmentIds = Array.isArray(input?.attachmentIds) ? input.attachmentIds.slice(0, 4).map(Number).filter(Boolean) : [];
  if (!text && !attachmentIds.length) throw new EndpointError('Пустое сообщение', { code: 'EMPTY_MESSAGE' });
  if (text.length > MAX_MESSAGE_CHARS) {
    throw new EndpointError(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`, { code: 'TOO_LONG' });
  }
  const reasoning = REASONING_LEVELS.includes(input?.reasoning) ? input.reasoning : undefined;

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
    result = await completeTurn({ tgUser, agentId: input?.agentId, text, reasoning, conversationId: input?.conversationId, attachments });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (m.includes('слишком длинное')) throw new EndpointError(m, { code: 'TOO_LONG' });
    if (m.includes('NVIDIA_API_KEY')) throw new EndpointError('Сервис настраивается, ключ модели ещё не задан', { code: 'KEY_MISSING' });
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
