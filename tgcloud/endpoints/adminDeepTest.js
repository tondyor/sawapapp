import { fetch, EndpointError } from "sdk";
import { ADMIN_TG_IDS, NVIDIA_BASE_URL } from "../lib/config.js";
import { getApiKey } from "../lib/nvidia.js";
const GUESS_MODEL = "deepseek-ai/deepseek-v4.1-flash";
export default async function (input, ctx) {
  const uid = ctx.initData?.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) throw new EndpointError("Доступ запрещён", { code: "FORBIDDEN" });
  const key = await getApiKey();
  const variant = String(input?.variant ?? "plain");
  const prompt = String(input?.prompt ?? "Привет. Как дела?").trim() || "Привет. Как дела?";
  const maxTokens = Math.max(1, Math.min(1024, Number(input?.maxTokens ?? 64)));
  const t0 = Date.now();
  const body = (extra = {}) => JSON.stringify({
    model: GUESS_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    stream: true,
    ...extra,
  });
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  if (variant === "plain") headers.Accept = "text/event-stream";
  else if (variant === "with_usage") headers.Accept = "text/event-stream";
  else if (variant === "effort_high") headers.Accept = "text/event-stream";
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, { method: "POST", headers,
    body: variant === "full"
      ? JSON.stringify({ model: GUESS_MODEL, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens, stream: false })
      : variant === "with_usage" ? body({ stream_options: { include_usage: true } })
      : variant === "effort_high" ? body({ reasoning_effort: "high" })
      : body() });
  const text = await res.text();
  return { variant, status: res.status, ms: Date.now() - t0, ok: res.ok, len: text.length, head: text.slice(0, 600), tail: text.slice(-300) };
}
