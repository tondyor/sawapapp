import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { files } from '../schema.js';
import { readFileBytes, bytesToBase64 } from '../lib/files.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const id = Number(input?.fileId);
  if (!id) throw new EndpointError('Не указан файл', { code: 'BAD_INPUT' });
  const row = await db.select().from(files).where(eq(files.id, id)).get();
  if (!row || row.tgId !== tgUser.id) {
    throw new EndpointError('Файл не найден', { code: 'NOT_FOUND' });
  }
  const bytes = await readFileBytes(row);
  if (!bytes || !bytes.length) {
    throw new EndpointError('Файл недоступен', { code: 'MISSING' });
  }
  return {
    fileId: row.id,
    name: row.name,
    mime: row.mime,
    size: row.size,
    dataBase64: bytesToBase64(bytes),
  };
}
