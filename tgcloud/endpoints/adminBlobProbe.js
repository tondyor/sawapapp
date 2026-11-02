import { db } from 'sdk';
import { eq } from 'sdk/db';
import { files } from '../schema.js';
import { bytesToBase64, base64ToBytes, storeFile, readFileBytes } from '../lib/files.js';
import { EndpointError } from 'sdk';

export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  const mb = Number(input?.mb) || 6;
  const storeOnly = Boolean(input?.storeOnly);
  const bytes = new Uint8Array(Math.floor(mb * 1024 * 1024));
  for (let i = 0; i < bytes.length; i += 4096) bytes[i] = (i / 4096) % 256;

  const started = Date.now();
  const stored = await storeFile({ tgId: uid, conversationId: 0, name: `probe-${mb}mb.bin`, mime: 'application/octet-stream', bytes });
  const storeMs = Date.now() - started;

  if (storeOnly) {
    return { ok: true, mb, storeMs, size: stored.size };
  }

  const row = await db.select().from(files).where(eq(files.id, stored.fileId)).get();
  const readStarted = Date.now();
  const back = await readFileBytes(row);
  const readMs = Date.now() - readStarted;

  const ok = back && back.length === bytes.length;
  const b64Len = ok ? bytesToBase64(back).length : 0;

  await db.delete(files).where(eq(files.id, stored.fileId));
  return { ok, mb, path: row.tgFileId ? 'telegram' : 'db', storeMs, readMs, b64Len, backLen: back ? back.length : 0, originalLen: bytes.length };
}
