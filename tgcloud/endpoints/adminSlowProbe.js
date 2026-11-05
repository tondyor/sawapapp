import { db, EndpointError, fetch } from "sdk";
import { sql } from "sdk/db";
import { settings } from "../schema.js";
import { ADMIN_TG_IDS } from "../lib/config.js";
const GLM = "z-ai/glm-5.3-flash";
export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid))
    throw new EndpointError("Доступ запрещён", { code: "FORBIDDEN" });
  const tag = String(input?.read ?? "");
  if (input?.read !== void 0) {
    const like = tag ? `glmwall-${tag}-%` : "glmwall-%";
    const rows = await db.all(
      sql`SELECT key, value FROM settings WHERE key LIKE ${like} ORDER BY key DESC LIMIT 40`,
    );
    return {
      tag: tag || "(latest)",
      marks: rows
        .reverse()
        .map((r) => ({
          key: r.key.replace(/^glmwall-/, "").replace(/^(\d+)-/, ""),
          value: r.value,
        })),
    };
  }
  const calls = Math.min(Math.max(Number(input?.calls) || 8, 1), 15);
  const t0 = Date.now();
  const keyRow = await db.select().from(settings).all();
  const apiKey = (keyRow.find((r) => r.key === "NVIDIA_API_KEY") ?? {}).value;
  if (!apiKey)
    throw new EndpointError("NVIDIA_API_KEY не задан", { code: "KEY_MISSING" });
  const tagNew = String(t0);
  const mark = async (suffix, value) => {
    await db
      .insert(settings)
      .values({
        key: `glmwall-${tagNew}-${suffix}`,
        value: String(value).slice(0, 400),
      })
      .run();
  };
  await mark("start", t0);
  const latencies = [];
  for (let i = 0; i < calls; i++) {
    const c0 = Date.now();
    let ms = null;
    let err = null;
    try {
      const res = await fetch(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            model: GLM,
            messages: [
              { role: "user", content: "Ответь одним словом: привет" },
            ],
            max_tokens: 16,
            temperature: 0.7,
            stream: false,
          }),
        },
      );
      const j = await res.json();
      ms = Date.now() - c0;
      err = res.ok
        ? null
        : `HTTP ${res.status}: ${JSON.stringify(j).slice(0, 100)}`;
    } catch (e) {
      ms = Date.now() - c0;
      err = `${e?.name ?? "Error"}: ${String(e?.message ?? e).slice(0, 100)}`;
    }
    latencies.push(ms);
    await mark(`call${i}`, JSON.stringify({ ms, err, wall: Date.now() - t0 }));
  }
  await mark("done", JSON.stringify({ calls, totalMs: Date.now() - t0 }));
  return { calls, latencies, totalMs: Date.now() - t0, tag: tagNew };
}
