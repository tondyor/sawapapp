import { fetch } from "sdk";
import { db } from "sdk";
import { eq } from "sdk/db";
import { settings } from "../schema.js";
import {
  DEFAULT_MODEL,
  KEY_SETTING,
  NVIDIA_BASE_URL,
  MAX_OUTPUT_TOKENS,
  TEMPERATURE,
  ANSWER_MODEL,
  VISION_MODEL,
  PLANNER_MODEL,
  COMPRESS_MODEL,
  MATH_MODEL,
  DEEP_REASON_MODEL,
  STATUS_MODEL,
  PARSE_MODEL,
} from "./config.js";
export async function getApiKey() {
  const row = await db
    .select()
    .from(settings)
    .where(eq(settings.key, KEY_SETTING))
    .get();
  if (!row || !row.value) {
    throw new Error(
      "NVIDIA_API_KEY не задан. Сидируется через endpoints/adminSetSetting.",
    );
  }
  return row.value;
}
export async function getSettingOr(key, fallback) {
  try {
    const row = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .get();
    const v = row?.value?.trim();
    return v ? v : fallback;
  } catch (_) {
    return fallback;
  }
}
export function getVisionModel() {
  return getSettingOr("VISION_MODEL", VISION_MODEL);
}
export function getDefaultModel() {
  return getSettingOr("DEFAULT_MODEL", DEFAULT_MODEL);
}
export function getPlannerModel() {
  return getSettingOr("PLANNER_MODEL", PLANNER_MODEL);
}
export function getAnswerModel() {
  return getSettingOr("ANSWER_MODEL", ANSWER_MODEL);
}
export function getCompressModel() {
  return getSettingOr("COMPRESS_MODEL", COMPRESS_MODEL);
}
export function getMathModel() {
  return getSettingOr("MATH_MODEL", MATH_MODEL);
}
export function getDeepReasonModel() {
  return getSettingOr("DEEP_REASON_MODEL", DEEP_REASON_MODEL);
}
export function getStatusModel() {
  return getSettingOr("STATUS_MODEL", STATUS_MODEL);
}
export function getParseModel() {
  return getSettingOr("PARSE_MODEL", PARSE_MODEL);
}
export async function generateActionStatus({ action, step, question }) {
  try {
    const model = await getStatusModel();
    const prompt = `Ты — быстрый генератор статуса хода AI-агента для отображения в реальном времени.
Сформулируй ОДНУ короткую фразу на русском языке (3-6 слов, от первого лица, настоящее время, без кавычек и точки на конце), отражающую действие:
Вопрос: ${String(question ?? "").slice(0, 100)}
Действие: ${step?.title || step?.type || action || "выполняю шаг"}
Статус:`;
    const res = await completeChat([{ role: "user", content: prompt }], {
      model,
      maxTokens: 25,
      temperature: 0.1,
    });
    const text = (res.content ?? "").trim().replace(/^["'«»]|["'«»]$/g, "").replace(/\.$/, "").trim();
    return text || null;
  } catch (_) {
    return null;
  }
}
export function resolveAnswerModel() {
  return getAnswerModel();
}
function buildBody(messages, opts = {}) {
  const model = opts.model ?? DEFAULT_MODEL;
  const body = {
    model,
    messages,
    temperature: opts.temperature ?? TEMPERATURE,
    max_tokens: opts.maxTokens ?? MAX_OUTPUT_TOKENS,
    stream: opts.stream === true,
  };
  if (typeof opts.reasoningEffort === "string") {
    body.reasoning_effort = opts.reasoningEffort;
  } else if (opts.thinking === true) {
    body.chat_template_kwargs = { thinking: true };
  }
  if (body.stream) body.stream_options = { include_usage: true };
  if (opts.tools && opts.tools.length) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }
  return body;
}
function apiError(status, bodyText) {
  let hint = "";
  try {
    const j = JSON.parse(bodyText);
    hint = j?.detail ?? j?.message ?? j?.error?.message ?? "";
    if (Array.isArray(hint))
      hint = hint.map((d) => d?.message ?? JSON.stringify(d)).join("; ");
  } catch (_) {}
  return new Error(
    `NVIDIA API ${status}: ${String(hint || bodyText).slice(0, 400)}`,
  );
}
export async function completeChat(messages, opts = {}) {
  const apiKey = opts.apiKey ?? (await getApiKey());
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(buildBody(messages, { ...opts, apiKey })),
  });
  const text = await res.text();
  if (!res.ok) throw apiError(res.status, text);
  let data;
  try {
    data = JSON.parse(text);
  } catch (_) {
    throw new Error("NVIDIA API: некорректный JSON в ответе");
  }
  const choice = data?.choices?.[0];
  const msg = choice?.message ?? {};
  const content = msg.content ?? "";
  const finish = choice?.finish_reason ?? "";
  const reasoning =
    typeof msg.reasoning_content === "string" ? msg.reasoning_content : "";
  if (!content && !reasoning && !msg.tool_calls?.length && finish !== "length") {
    throw new Error(`NVIDIA API: пустой ответ (finish_reason=${finish})`);
  }
  return {
    content,
    reasoning,
    toolCalls: msg.tool_calls ?? null,
    model: normalizeModelId(data?.model) ?? opts.model ?? DEFAULT_MODEL,
    usage: data?.usage ?? null,
  };
}
export function normalizeModelId(m) {
  return typeof m === "string" && m ? m.replace(/^private\//, "") : null;
}
export async function* streamChat(messages, opts = {}) {
  const apiKey = opts.apiKey ?? (await getApiKey());
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(
      buildBody(messages, { ...opts, apiKey, stream: true }),
    ),
  });
  if (!res.ok) throw apiError(res.status, await res.text());
  const deadlineMs =
    typeof opts.deadlineMs === "number" && Number.isFinite(opts.deadlineMs)
      ? opts.deadlineMs
      : 22e3;
  const deadlineAt = Date.now() + deadlineMs;
  const hasTimer = typeof setTimeout === "function";
  const toolAcc = new Map();
  let usage = null;
  let deadlineHit = false;
  const tail = () => {
    if (toolAcc.size)
      return {
        delta: "",
        reasoning: null,
        finish: "tool_calls",
        toolCalls: [...toolAcc.values()],
        model: null,
        usage,
      };
    if (deadlineHit)
      return { delta: "", reasoning: null, finish: "length", model: null, usage };
    return { delta: "", reasoning: null, finish: null, model: null, usage };
  };
  const lineIterator = sseLines(res.body)[Symbol.asyncIterator]();
  const raceLine = () =>
    Promise.race([
      lineIterator.next(),
      new Promise((resolve) =>
        setTimeout(() => resolve("__DEADLINE__"), Math.max(50, deadlineAt - Date.now())),
      ),
    ]);
  for (;;) {
    let next;
    if (hasTimer) {
      next = await raceLine();
      if (next === "__DEADLINE__") {
        deadlineHit = true;
        break;
      }
    } else {
      next = await lineIterator.next();
    }
    if (next.done) break;
    if (Date.now() > deadlineAt) {
      deadlineHit = true;
      break;
    }
    const line = next.value;
    const t = line.trim();
    if (!t.startsWith("data:")) continue;
    const payload = t.slice(5).trim();
    if (payload === "[DONE]") {
      yield tail();
      return;
    }
    let j;
    try {
      j = JSON.parse(payload);
    } catch (_) {
      continue;
    }
    if (j?.usage) usage = j.usage;
    const choice = j?.choices?.[0];
    if (!choice) continue;
    const delta = choice?.delta ?? {};
    const tcs = delta.tool_calls;
    if (Array.isArray(tcs)) {
      for (const tc of tcs) {
        const idx = tc.index ?? 0;
        const prev = toolAcc.get(idx) ?? {
          id: tc.id ?? null,
          type: "function",
          function: { name: "", arguments: "" },
        };
        if (tc.id) prev.id = tc.id;
        if (tc.function?.name) prev.function.name = tc.function.name;
        if (tc.function?.arguments)
          prev.function.arguments += tc.function.arguments;
        toolAcc.set(idx, prev);
      }
    }
    const hasContent =
      typeof delta.content === "string" && delta.content.length > 0;
    const hasReasoning =
      typeof delta.reasoning_content === "string" &&
      delta.reasoning_content.length > 0;
    if (hasContent || hasReasoning || toolAcc.size) {
      yield {
        delta: delta.content ?? "",
        reasoning: hasReasoning ? delta.reasoning_content : null,
        finish: choice?.finish_reason ?? null,
        model: normalizeModelId(j?.model),
        ...(usage ? { usage } : {}),
        ...(toolAcc.size ? { toolCalls: [...toolAcc.values()] } : {}),
      };
    }
  }
  yield tail();
}
function utf8Decode(bytes) {
  if (typeof TextDecoder !== "undefined")
    return new TextDecoder().decode(bytes);
  let out = "";
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    let cp;
    if (b < 128) {
      cp = b;
      i += 1;
    } else if (b < 224) {
      cp = ((b & 31) << 6) | (bytes[i + 1] & 63);
      i += 2;
    } else if (b < 240) {
      cp = ((b & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63);
      i += 3;
    } else {
      cp =
        ((b & 7) << 18) |
        ((bytes[i + 1] & 63) << 12) |
        ((bytes[i + 2] & 63) << 6) |
        (bytes[i + 3] & 63);
      i += 4;
    }
    out += String.fromCodePoint(cp);
  }
  return out;
}
function mergeBytes(parts, total) {
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
async function* sseLines(body) {
  let parts = [];
  let len = 0;
  for await (const chunk of body) {
    let start = 0;
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === 10) {
        if (i > start) {
          parts.push(chunk.subarray(start, i));
          len += i - start;
        }
        if (len > 0) yield utf8Decode(mergeBytes(parts, len));
        parts = [];
        len = 0;
        start = i + 1;
      }
    }
    if (start < chunk.length) {
      parts.push(chunk.subarray(start));
      len += chunk.length - start;
    }
  }
  if (len > 0) yield utf8Decode(mergeBytes(parts, len));
}
