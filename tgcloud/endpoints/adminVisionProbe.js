import { db } from 'sdk';
import { eq } from 'sdk/db';
import { conversations, files, messages } from '../schema.js';
import sendMessageHandler from './sendMessage.js';
import { ADMIN_TG_IDS } from '../lib/config.js';
import { EndpointError } from 'sdk';

const ctx = { initData: { user: { id: 1707415385 } } };

async function probeImageScenario(uid, size, mime, name) {
  const [conv] = await db.insert(conversations).values({
    userId: 0, tgId: uid, agentId: 'chat', title: 'vision-probe',
  }).returning();

  const [frow] = await db.insert(files).values({
    tgId: uid, conversationId: conv.id, name, mime, size, data: null, tgFileId: null,
  }).returning();

  let outcome;
  try {
    const res = await sendMessageHandler(
      { text: 'Что на картинке?', conversationId: conv.id, agentId: 'chat', attachmentIds: [frow.id] },
      ctx,
    );
    outcome = { delivered: true, replyLen: (res.reply ?? '').length };
  } catch (e) {
    outcome = {
      delivered: false,
      isEndpointError: e?.name === 'Error' && e?.parameters ? true : (e?.parameters ? true : false),
      message: String(e?.message ?? e).slice(0, 160),
      code: e?.parameters?.code ?? null,
    };
  }

  const msgs = await db.select().from(messages).where(eq(messages.conversationId, conv.id)).all();
  const summary = msgs.map((m) => ({ role: m.role, text: (m.content ?? '').slice(0, 50), err: m.meta?.error?.slice(0, 80) ?? null }));

  await db.delete(messages).where(eq(messages.conversationId, conv.id));
  await db.delete(files).where(eq(files.id, frow.id));
  await db.delete(conversations).where(eq(conversations.id, conv.id));

  return { size, mime, outcome, dbMessages: summary };
}

export default async function (input, ctxOuter) {
  const uid = ctxOuter.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  return {
    bigJpeg: await probeImageScenario(uid, 5 * 1000 * 1000, 'image/jpeg', 'camera-photo.jpg'),
    smallNoData: await probeImageScenario(uid, 500000, 'image/webp', 'small.webp'),
  };
}
