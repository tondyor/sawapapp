import { db, EndpointError } from "sdk";
import { like, inArray } from "sdk/db";
import {
  conversations,
  messages,
  files,
  fileChunks,
  turns,
  turnEvents,
  settings,
} from "../schema.js";
import { ADMIN_TG_IDS } from "../lib/config.js";
export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid))
    throw new EndpointError("Доступ запрещён", { code: "FORBIDDEN" });
  const mode = String(input?.mode ?? "list");
  if (mode === "listGmlWall") {
    const rows = await db
      .select()
      .from(settings)
      .where(like(settings.key, "glmwall-%"))
      .all();
    return { mode, count: rows.length, keys: rows.map((r) => r.key) };
  }
  if (mode === "listConversations") {
    const ids = (Array.isArray(input?.ids) ? input.ids : []).map(Number).filter(Boolean);
    if (!ids.length) return { mode, conversations: [] };
    const rows = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, ids))
      .all();
    const msgRows = await db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, ids))
      .limit(50)
      .all();
    const turnRows = await db
      .select()
      .from(turns)
      .where(inArray(turns.conversationId, ids))
      .all();
    return {
      mode,
      conversations: rows.map((r) => ({ id: r.id, title: r.title, agentId: r.agentId })),
      messageCount: msgRows.length,
      turnCount: turnRows.length,
    };
  }
  if (mode === "deleteGmlWall") {
    const res = await db
      .delete(settings)
      .where(like(settings.key, "glmwall-%"))
      .run();
    return { mode, ok: true, deleted: res?.rowsAffected ?? null };
  }
  if (mode === "deleteConversations") {
    const ids = (Array.isArray(input?.ids) ? input.ids : []).map(Number).filter(Boolean);
    if (!ids.length)
      throw new EndpointError("ids обязательны", { code: "BAD_INPUT" });
    await db
      .delete(turnEvents)
      .where(inArray(turnEvents.conversationId, ids))
      .run();
    await db.delete(turns).where(inArray(turns.conversationId, ids)).run();
    await db.delete(files).where(inArray(files.conversationId, ids)).run();
    await db.delete(messages).where(inArray(messages.conversationId, ids)).run();
    const res = await db
      .delete(conversations)
      .where(inArray(conversations.id, ids))
      .run();
    return {
      mode,
      ok: true,
      deletedConversations: res?.rowsAffected ?? null,
      ids,
    };
  }
  throw new EndpointError("mode: listGmlWall|listConversations|deleteGmlWall|deleteConversations", {
    code: "BAD_INPUT",
  });
}
