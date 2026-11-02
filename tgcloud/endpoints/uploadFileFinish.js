import { EndpointError } from 'sdk';
import { normalizeMime, storeFileFromChunks } from '../lib/files.js';
import { getConversationById } from '../lib/chat.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const uploadId = String(input?.uploadId ?? '').trim();
  const convId = Number(input?.conversationId);
  if (!uploadId || uploadId.length > 64) throw new EndpointError('Неверный uploadId', { code: 'BAD_INPUT' });
  if (!convId) throw new EndpointError('Не указан диалог', { code: 'BAD_INPUT' });
  const conv = await getConversationById(convId, tgUser.id);
  if (!conv) throw new EndpointError('Диалог не найден', { code: 'NOT_FOUND' });

  const name = String(input?.name ?? 'file').slice(0, 120);
  const mime = normalizeMime(input?.mime, name);

  try {
    return await storeFileFromChunks({ tgId: tgUser.id, uploadId, conversationId: convId, name, mime });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (m.includes('Файл больше 10 МБ')) throw new EndpointError('Файл больше 10 МБ', { code: 'TOO_BIG' });
    if (m.includes('Части файла')) throw new EndpointError(m, { code: 'CHUNKS_MISSING' });
    if (m.includes('хранилище Telegram')) throw new EndpointError('Не удалось сохранить файл', { code: 'STORE_FAILED' });
    throw e;
  }
}
