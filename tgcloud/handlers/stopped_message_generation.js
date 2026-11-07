import { db } from "sdk";
import { and, desc, eq, notInArray } from "sdk/db";
import { turns } from "../schema.js";
import { stopTurn } from "../lib/agent/turn.js";
export default async function (update) {
  const stopped = update?.stopped_message_generation;
  if (!stopped) return;
  const chatId = Number(stopped?.chat?.id ?? 0);
  if (!chatId) return;
  const tgId = chatId;
  const rows = await db
    .select()
    .from(turns)
    .where(and(eq(turns.tgId, tgId), notInArray(turns.status, ["done", "error", "stopped"])))
    .orderBy(desc(turns.createdAt))
    .limit(1)
    .all();
  const active = rows[0];
  if (!active) return;
  try {
    await stopTurn({ turnId: active.turnId, tgId });
  } catch (_) {}
}
