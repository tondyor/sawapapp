import { db, api, InputFile } from 'sdk';
import { eq, and, asc } from 'sdk/db';
import { files, fileChunks } from '../schema.js';

export const DB_BLOB_MAX = 1000000;
export const MAX_FILE_BYTES = 10000000;
export const CHUNK_SIZE = 699999;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Int16Array(128).fill(-1);
for (let i = 0; i < B64.length; i++) LOOKUP[B64.charCodeAt(i)] = i;

export function base64ToBytes(s) {
  const clean = String(s).replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/\s]/g, '');
  const len = clean.length;
  const out = new Uint8Array(Math.ceil((len * 3) / 4));
  let n = 0;
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < len; i++) {
    const v = LOOKUP[clean.charCodeAt(i) & 127];
    if (v < 0) continue;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[n++] = (buf >> bits) & 0xff;
    }
  }
  return out.subarray(0, n);
}

export function bytesToBase64(bytes) {
  let out = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const hasB2 = i + 1 < len;
    const hasB3 = i + 2 < len;
    const b2 = hasB2 ? bytes[i + 1] : 0;
    const b3 = hasB3 ? bytes[i + 2] : 0;
    out += B64[b1 >> 2];
    out += B64[((b1 & 3) << 4) | (b2 >> 4)];
    out += hasB2 ? B64[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    out += hasB3 ? B64[b3 & 63] : '=';
  }
  return out;
}

export function normalizeMime(mime, name) {
  const m = String(mime || '').toLowerCase().trim();
  if (m) return m;
  const n = String(name || '').toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.svg')) return 'image/svg+xml';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.txt')) return 'text/plain';
  if (n.endsWith('.doc')) return 'application/msword';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}

export function isAllowedMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m.startsWith('image/')) return true;
  if (m.startsWith('text/')) return true;
  if (m === 'application/pdf') return true;
  if (m === 'application/msword') return true;
  if (m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return true;
  if (m === 'application/vnd.ms-excel') return true;
  if (m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return true;
  if (m === 'application/octet-stream') return true;
  return false;
}

export async function storeFile({ tgId, conversationId, name, mime, bytes }) {
  if (bytes.length <= DB_BLOB_MAX) {
    const [row] = await db.insert(files).values({
      tgId, conversationId, name, mime, size: bytes.length, data: bytes,
    }).returning();
    return { fileId: row.id, name: row.name, mime: row.mime, size: row.size };
  }
  const doc = await api.sendDocument({
    chat_id: tgId,
    document: new InputFile(bytes, name, { type: mime }),
  });
  const tgFileId = doc?.document?.file_id;
  if (!tgFileId) throw new Error('TG_STORE_FAILED');
  try { await api.deleteMessage({ chat_id: tgId, message_id: doc.message_id }); } catch (_) {}
  const [row] = await db.insert(files).values({
    tgId, conversationId, name, mime, size: bytes.length, tgFileId,
  }).returning();
  return { fileId: row.id, name: row.name, mime: row.mime, size: row.size };
}

export async function readFileBytes(row) {
  if (row.data && row.data.length) return row.data;
  if (row.tgFileId) return api.getFileContent(row.tgFileId);
  return null;
}

export function concatBytes(chunks) {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

export async function storeFileFromChunks({ tgId, uploadId, conversationId, name, mime }) {
  const rows = await db.select().from(fileChunks)
    .where(and(eq(fileChunks.uploadId, uploadId), eq(fileChunks.tgId, tgId)))
    .orderBy(asc(fileChunks.idx))
    .all();
  if (!rows.length) throw new Error('CHUNKS_MISSING');
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].idx !== i) throw new Error('CHUNKS_MISSING');
  }
  let total = 0;
  for (const r of rows) total += (r.data ?? new Uint8Array()).length;
  if (total > MAX_FILE_BYTES) throw new Error('FILE_TOO_BIG');
  const bytes = new Uint8Array(total);
  let off = 0;
  for (const r of rows) {
    const d = r.data ?? new Uint8Array();
    bytes.set(d, off);
    off += d.length;
    r.data = null;
  }
  const stored = await storeFile({ tgId, conversationId, name, mime, bytes });
  await db.delete(fileChunks).where(eq(fileChunks.uploadId, uploadId));
  return stored;
}
