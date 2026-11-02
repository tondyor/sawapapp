import { EndpointError } from 'sdk';
import { base64ToBytes, normalizeMime, isAllowedMime, storeFile, MAX_FILE_BYTES } from '../lib/files.js';
import { getConversationById } from '../lib/chat.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const convId = Number(input?.conversationId);
  if (!convId) throw new EndpointError('Не указан диалог', { code: 'BAD_INPUT' });
  const conv = await getConversationById(convId, tgUser.id);
  if (!conv) throw new EndpointError('Диалог не найден', { code: 'NOT_FOUND' });

  const name = String(input?.name ?? 'file').slice(0, 120);
  const mime = normalizeMime(input?.mime, name);
  if (!isAllowedMime(mime)) {
    throw new EndpointError('Тип файла не поддерживается', { code: 'BAD_TYPE' });
  }
  const bytes = base64ToBytes(String(input?.dataBase64 ?? ''));
  if (!bytes.length) throw new EndpointError('Пустой файл', { code: 'EMPTY_FILE' });
  if (bytes.length > MAX_FILE_BYTES) {
    throw new EndpointError('Файл больше 10 МБ', { code: 'TOO_BIG' });
  }

  try {
    return await storeFile({ tgId: tgUser.id, conversationId: convId, name, mime, bytes });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (m.includes('хранилище Telegram')) throw new EndpointError('Не удалось сохранить файл', { code: 'STORE_FAILED' });
    throw e;
  }
}
