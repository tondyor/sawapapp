import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { fileChunks } from '../schema.js';
import { base64ToBytes, CHUNK_SIZE } from '../lib/files.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const uploadId = String(input?.uploadId ?? '').trim();
  const idx = Number(input?.idx);
  if (!uploadId || uploadId.length > 64) throw new EndpointError('Неверный uploadId', { code: 'BAD_INPUT' });
  if (!Number.isInteger(idx) || idx < 0 || idx > 32) throw new EndpointError('Неверный индекс части', { code: 'BAD_INPUT' });
  const bytes = base64ToBytes(String(input?.dataBase64 ?? ''));
  if (!bytes.length) throw new EndpointError('Пустая часть файла', { code: 'EMPTY_FILE' });
  if (bytes.length > CHUNK_SIZE + 1024) throw new EndpointError('Часть файла слишком велика', { code: 'TOO_BIG' });

  const existing = await db.select().from(fileChunks)
    .where(and(eq(fileChunks.uploadId, uploadId), eq(fileChunks.idx, idx)))
    .get();
  if (existing) {
    if (existing.tgId !== tgUser.id) throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
    return { received: idx };
  }
  await db.insert(fileChunks).values({ uploadId, tgId: tgUser.id, idx, data: bytes }).run();
  return { received: idx };
}
