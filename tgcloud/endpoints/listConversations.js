import { db } from 'sdk';
import { sql } from 'sdk/db';
import { ensureUser } from '../lib/chat.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  await ensureUser(tgUser);
  const limit = Math.min(Number(input?.limit) || 60, 100);
  const rows = await db.all(sql`
    SELECT c.id,
           c.agent_id    AS agentId,
           c.title,
           c.reasoning,
           c.updated_at  AS updatedAt,
           (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS preview,
           (SELECT role    FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS previewRole
    FROM conversations c
    WHERE c.tg_id = ${tgUser.id}
    ORDER BY c.updated_at DESC
    LIMIT ${limit}
  `);
  return {
    conversations: rows.map((r) => ({
      id: r.id,
      agentId: r.agentId,
      title: r.title ?? 'Без названия',
      reasoning: r.reasoning ?? 'fast',
      updatedAt: (r.updatedAt ?? 0) * 1000,
      preview: r.preview ? String(r.preview).slice(0, 110) : null,
      previewRole: r.previewRole ?? null,
    })),
  };
}
