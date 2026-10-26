import { db } from 'sdk';
import { desc, eq } from 'sdk/db';
import { messages } from '../schema.js';
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
  return { total: withMeta.length, errored: withErrors.length, recent: withMeta, errors: withErrors };
}
