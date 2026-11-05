import { fetch, EndpointError } from "sdk";
import { ADMIN_TG_IDS, NVIDIA_BASE_URL } from "../lib/config.js";
import { getApiKey } from "../lib/nvidia.js";

/**
 * Slow-probe: test tgcloud fetch with known-slow endpoints.
 * input.mode:
 *   "delay5"   — httpbin.org/delay/5 (5s delay)
 *   "delay15"  — httpbin.org/delay/15 (15s delay)
 *   "delay25"  — httpbin.org/delay/25 (25s delay)
 *   "ds_head"  — HEAD request to NVIDIA (no body)
 *   "ds_models"— GET /v1/models (fast, for comparison)
 */
export default async function (input, ctx) {
  const uid = ctx.initData?.user?.id;
  if (!ADMIN_TG_IDS.includes(uid))
    throw new EndpointError("Forbidden", { code: "FORBIDDEN" });

  const mode = input?.mode || "delay5";
  const t0 = Date.now();

  try {
    if (mode === "delay5" || mode === "delay15" || mode === "delay25") {
      const secs = mode === "delay5" ? 5 : mode === "delay15" ? 15 : 25;
      const res = await fetch(`https://httpbin.org/delay/${secs}`, {
        method: "GET",
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, ms: Date.now() - t0, mode, raw: text.slice(0, 200) };
    }

    if (mode === "ds_head") {
      const key = await getApiKey();
      const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "OPTIONS",
        headers: {
          Authorization: `Bearer ${key}`,
          Origin: "https://example.com",
        },
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, ms: Date.now() - t0, mode, raw: text.slice(0, 200) };
    }

    if (mode === "ds_models") {
      const key = await getApiKey();
      const res = await fetch(`${NVIDIA_BASE_URL}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${key}` },
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, ms: Date.now() - t0, mode, raw: text.slice(0, 200) };
    }

    return { error: "unknown mode", mode };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, mode, error: String(err?.message || err).slice(0, 400) };
  }
}
