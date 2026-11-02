import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { files } from '../schema.js';
import { readFileBytes, bytesToBase64, CHUNK_SIZE } from '../lib/files.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const id = Number(input?.fileId);
  const chunkIndex = Number(input?.chunkIndex) || 0;
  if (!id) throw new EndpointError('Не указан файл', { code: 'BAD_INPUT' });
  const row = await db.select().from(files).where(eq(files.id, id)).get();
  if (!row || row.tgId !== tgUser.id) {
    throw new EndpointError('Файл не найден', { code: 'NOT_FOUND' });
  }
  const bytes = await readFileBytes(row);
  if (!bytes || !bytes.length) {
    throw new EndpointError('Файл недоступен', { code: 'MISSING' });
  }
  const total = bytes.length;
  const chunkCount = Math.max(1, Math.ceil(total / CHUNK_SIZE));
  if (chunkIndex < 0 || chunkIndex >= chunkCount) {
    throw new EndpointError('Индекс части вне диапазона', { code: 'BAD_CHUNK' });
  }
  const slice = bytes.subarray(chunkIndex * CHUNK_SIZE, Math.min((chunkIndex + 1) * CHUNK_SIZE, total));
  return {
    fileId: row.id,
    name: row.name,
    mime: row.mime,
    size: total,
    chunkIndex,
    chunkCount,
    done: chunkIndex + 1 >= chunkCount,
    dataBase64: bytesToBase64(slice),
  };
}
