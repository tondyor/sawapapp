import { db, EndpointError } from "sdk";
import { events } from "../schema.js";
const ALLOWED = new Set(["app_opened"]);
export default async function logEvent(input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id)
    throw new EndpointError("Нет пользователя", { code: "NO_USER" });
  const name = String(input?.name ?? "").trim();
  if (!ALLOWED.has(name))
    throw new EndpointError("Неизвестное событие", { code: "BAD_NAME" });
  const meta =
    input?.meta && typeof input.meta === "object" && !Array.isArray(input.meta)
      ? input.meta
      : null;
  await db
    .insert(events)
    .values({ tgId: user.id, name, ...(meta ? { meta } : {}) })
    .run();
  return { ok: true };
}
