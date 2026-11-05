import { fetch, EndpointError } from "sdk";
import { ADMIN_TG_IDS, NVIDIA_BASE_URL } from "../lib/config.js";
import { getApiKey } from "../lib/nvidia.js";

export default async function (input, ctx) {
  const uid = ctx.initData?.user?.id;
  if (!ADMIN_TG_IDS.includes(uid))
    throw new EndpointError("Forbidden", { code: "FORBIDDEN" });

  const model = input?.model || "nvidia/nemotron-3.5-super-vl-120b-a12b";
  const key = await getApiKey();
  const t0 = Date.now();

  const payload = {
    model,
    messages: [
      { role: "user", content: "Привет! Назови одно слово: 'Тест'." }
    ],
    max_tokens: 32,
  };

  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const ms = Date.now() - t0;
  let json = {};
  try { json = JSON.parse(text); } catch (_) {}

  return {
    ok: res.ok,
    status: res.status,
    ms,
    model,
    content: json.choices?.[0]?.message?.content,
    raw: text.slice(0, 300)
  };
}
