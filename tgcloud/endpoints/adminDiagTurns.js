import { db } from 'sdk';
import { desc, eq, gt } from 'sdk/db';
import { turns, turnEvents, messages } from '../schema.js';
import { ADMIN_TG_IDS } from '../lib/config.js';
import { EndpointError } from 'sdk';

// Диагностика последних ходов/сообщений админа: что реально произошло на сервере.
export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  const since = Date.now() - 6 * 60 * 60 * 1000; // последние 6 часов

  const turnRows = await db.select().from(turns)
    .where(eq(turns.tgId, uid))
    .orderBy(desc(turns.createdAt))
    .limit(12).all();

  const msgRows = await db.select().from(messages)
    .where(gt(messages.id, Number(input?.sinceMsgId) || 0))
    .orderBy(desc(messages.id))
    .limit(25).all();

  const outTurns = [];
  for (const t of turnRows) {
    if ((t.createdAt instanceof Date ? t.createdAt.getTime() : Number(t.createdAt) || 0) < since) continue;
    const evs = await db.select().from(turnEvents).where(eq(turnEvents.turnId, t.turnId)).orderBy(turnEvents.id).limit(40).all();
    outTurns.push({
      turnId: t.turnId,
      conv: t.conversationId,
      status: t.status,
      level: t.reasoningLevel,
      q: String(t.question ?? '').slice(0, 80),
      plan: (t.plan ?? []).map((s) => s.type + (s.duplicate ? '(dup)' : '')),
      currentStep: t.currentStep,
      findings: (t.findings ?? []).map((f) => ({ type: f.type, ok: f.ok, ms: f.ms, text: String(f.text ?? '').slice(0, 140) })),
      error: t.error,
      events: evs.map((e) => `${e.type}${e.payload?.index != null ? `[${e.payload.index}]` : ''}${e.payload?.error ? ` err:${String(e.payload.error).slice(0, 60)}` : ''}`),
    });
  }

  return {
    turns: outTurns,
    messages: msgRows.map((m) => ({
      id: m.id,
      conv: m.conversationId,
      role: m.role,
      text: String(m.content ?? '').slice(0, 70),
      atts: (m.attachments ?? []).map((a) => `${a.name}:${a.mime}:${a.size}${a.vision ? ':vision✓' : ':novision'}`),
      model: m.meta?.model ?? null,
      steps: (m.meta?.steps ?? []).map((s) => `${s.type}:${s.ok ? 'ok' : 'FAIL'}${s.ms != null ? `/${s.ms}мс` : ''}`),
      err: m.meta?.error ?? null,
      at: m.createdAt instanceof Date ? m.createdAt.getTime() : m.createdAt,
    })),
  };
}
