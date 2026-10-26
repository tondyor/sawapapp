import { db } from 'sdk';
import { eq } from 'sdk/db';
import { conversations, messages } from '../schema.js';
import { ADMIN_TG_IDS } from '../lib/config.js';
import { base64ToBytes, storeFile } from '../lib/files.js';
import { EndpointError } from 'sdk';
import { startTurn, runTurnStep, finishTurnSynthesis } from '../lib/agent/turn.js';

// Ф5.1-пробник: ход пайплайна с картинкой (сценарий «хеллоуин»).
// input: { imageB64, mime, name, text, reasoning } → полный прогон автомата.

export default async function (input, ctxOuter) {
  const uid = ctxOuter.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  const b64 = String(input.imageB64 ?? '').trim();
  if (!b64) throw new EndpointError('imageB64 обязателен', { code: 'BAD_INPUT' });
  const mime = String(input.mime ?? 'image/png');
  const name = String(input.name ?? 'probe.png');
  const text = String(input.text ?? 'Что на картинке?');
  const reasoning = input.reasoning === 'light' || input.reasoning === 'medium' ? input.reasoning : 'fast';

  const [conv] = await db.insert(conversations).values({ userId: 0, tgId: uid, agentId: 'chat', title: 'pipeline-vision-probe' }).returning();
  const stored = await storeFile({ tgId: uid, conversationId: conv.id, name, mime, bytes: base64ToBytes(b64) });

  try {
    const started = await startTurn({ tgUser: { id: uid, first_name: 'Probe' }, agentId: 'chat', text, reasoning, conversationId: conv.id, attachmentIds: [stored.fileId] });
    const steps = [];
    let last = null;
    for (let i = 0; i < 8; i++) {
      last = await runTurnStep({ turnId: started.turnId, tgId: uid });
      steps.push(last.status);
      if (last.status === 'done' || last.status === 'error' || last.status === 'stopped') break;
      if (last.status === 'synthesizing') {
        last = await finishTurnSynthesis({ turnId: started.turnId, tgId: uid });
        steps.push(last.status);
        break;
      }
    }
    return {
      plan: started.plan.map((s) => s.type),
      statuses: steps,
      finalStatus: last?.status,
      reply: last?.message?.content?.slice(0, 500) ?? null,
      meta: last?.message?.meta ?? null,
      turnId: started.turnId,
      conversationId: conv.id,
    };
  } finally {
    // чистка: сообщения и диалог (turn остаётся — отладочный след)
    await db.delete(messages).where(eq(messages.conversationId, conv.id));
    await db.delete(conversations).where(eq(conversations.id, conv.id));
  }
}
