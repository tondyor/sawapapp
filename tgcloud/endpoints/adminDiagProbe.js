import { db } from 'sdk';
import { desc, eq } from 'sdk/db';
import { messages, turns } from '../schema.js';
import { ADMIN_TG_IDS } from '../lib/config.js';
import { EndpointError } from 'sdk';

export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) {
    throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  }

  const limit = Math.min(Number(input?.limit) || 60, 200);
  const rows = await db.select().from(messages)
    .orderBy(desc(messages.id))
    .limit(limit)
    .all();

  const withMeta = [];
  for (const r of rows) {
    const meta = r.meta ?? null;
    const atts = r.attachments ?? [];
    withMeta.push({
      id: r.id,
      conv: r.conversationId,
      role: r.role,
      text: String(r.content ?? '').slice(0, 100),
      hasAtt: atts.length > 0,
      attMimes: atts.map((a) => a.mime).join(','),
      model: meta?.model ?? null,
      reasoning: meta?.reasoning ?? null,
      latencyMs: meta?.latencyMs ?? null,
      skills: (meta?.skills ?? []).map((s) => s.id).join(','),
      steps: (meta?.steps ?? []).map((s) => s.type).join(','),
      error: meta?.error ?? null,
      tokens: meta?.tokens?.total ?? null,
    });
  }

  const withErrors = withMeta.filter((m) => m.error);

  // Smoke таблицы turns (Ф1.1): insert -> select -> delete.
  let turnsSmoke = null;
  try {
    const tid = `diag-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    const [ins] = await db.insert(turns).values({
      turnId: tid, conversationId: 0, tgId: uid, agentId: 'chat',
      status: 'planning', question: 'diag', plan: [{ type: 'direct_answer', title: 't' }], currentStep: 0,
    }).returning();
    const got = await db.select().from(turns).where(eq(turns.turnId, tid)).get();
    await db.delete(turns).where(eq(turns.turnId, tid));
    turnsSmoke = {
      inserted: !!ins, readBack: got?.turnId === tid,
      planParsed: Array.isArray(got?.plan) && got.plan[0]?.type === 'direct_answer',
      status: got?.status ?? null,
    };
  } catch (e) {
    turnsSmoke = { error: String(e?.message ?? e).slice(0, 160) };
  }

  return { total: withMeta.length, errored: withErrors.length, recent: withMeta, errors: withErrors, turnsSmoke };
}
