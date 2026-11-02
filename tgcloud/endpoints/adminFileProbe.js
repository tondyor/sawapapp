import { db } from 'sdk';
import { eq } from 'sdk/db';
import { files, messages, conversations } from '../schema.js';
import uploadChunk from './uploadFileChunk.js';
import uploadFinish from './uploadFileFinish.js';
import getChunk from './getFileChunk.js';
import { bytesToBase64, base64ToBytes } from '../lib/files.js';
import { ADMIN_TG_IDS } from '../lib/config.js';
import { EndpointError } from 'sdk';

const ctx = { initData: { user: { id: 1707415385 } } };

export default async function (input, ctxOuter) {
  const uid = ctxOuter.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  const mb = Number(input?.mb) || 1.5;
  const bytes = new Uint8Array(Math.floor(mb * 1024 * 1024));
  for (let i = 0; i < bytes.length; i += 4096) bytes[i] = (i / 4096) % 256;

  const [conv] = await db.insert(conversations).values({
    userId: 0, tgId: uid, agentId: 'chat', title: 'file-probe',
  }).returning();

  const uploadId = `probe-${Date.now()}`;
  const CHUNK = 700000;
  const count = Math.ceil(bytes.length / CHUNK);
  for (let i = 0; i < count; i++) {
    const slice = bytes.subarray(i * CHUNK, Math.min((i + 1) * CHUNK, bytes.length));
    await uploadChunk({ uploadId, idx: i, dataBase64: bytesToBase64(slice) }, ctx);
  }
  const stored = await uploadFinish({ uploadId, conversationId: conv.id, name: 'probe.jpg', mime: 'image/jpeg' }, ctx);

  const [msg] = await db.insert(messages).values({
    conversationId: conv.id,
    role: 'user',
    content: 'probe.jpg',
    agentId: 'chat',
    attachments: [{ fileId: stored.fileId, name: stored.name, mime: stored.mime, size: stored.size }],
  }).returning();

  let b64 = '';
  let done = false;
  let ci = 0;
  while (!done) {
    const part = await getChunk({ fileId: stored.fileId, chunkIndex: ci }, ctx);
    b64 += part.dataBase64;
    done = part.done;
    ci += 1;
  }
  const dec = base64ToBytes(b64);
  const decLen = dec.length;

  await db.delete(messages).where(eq(messages.id, msg.id));
  await db.delete(files).where(eq(files.id, stored.fileId));
  await db.delete(conversations).where(eq(conversations.id, conv.id));

  let bytesMatch = dec.length === bytes.length;
  if (bytesMatch) {
    for (let i = 0; i < bytes.length; i += 997) {
      if (dec[i] !== bytes[i]) { bytesMatch = false; break; }
    }
  }
  return {
    ok: bytesMatch,
    uploaded: stored.size,
    chunks: count,
    readLen: decLen,
    path: stored.size > 1000000 ? 'telegram' : 'db',
  };
}
