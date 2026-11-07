import { db, EndpointError } from "sdk";
import { sql } from "sdk/db";
import { ADMIN_TG_IDS } from "../lib/config.js";
const TABLES = [
  "users",
  "conversations",
  "messages",
  "files",
  "file_chunks",
  "turns",
  "turn_events",
  "settings",
  "events",
  "mcp_servers",
  "marketer_skills",
  "marketer_skill_files",
];
export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid))
    throw new EndpointError("Доступ запрещён", { code: "FORBIDDEN" });
  const mode = String(input?.mode ?? "count");
  if (mode === "count") {
    const counts = {};
    for (const t of TABLES) {
      const row = await db.get(sql.raw(`SELECT count(*) AS c FROM ${t}`));
      counts[t] = Number(row?.c ?? 0);
    }
    return { mode, counts };
  }
  if (mode === "wipe") {
    const deleted = {};
    for (const t of TABLES) {
      const res = await db.run(sql.raw(`DELETE FROM ${t}`));
      deleted[t] = res?.rowsAffected ?? null;
    }
    return { mode, deleted, ok: true };
  }
  throw new EndpointError("mode: count|wipe", { code: "BAD_INPUT" });
}
