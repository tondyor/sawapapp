import { getPlannerModel, streamChat, getSettingOr } from "../nvidia.js";
export const STEP_TYPES = [
  "direct_answer",
  "vision",
  "search",
  "read_url",
  "reason",
  "math",
  "deep_reason",
  "pdf_parse",
  "skill",
  "synthesize",
];
export const STEP_CATALOG = {
  direct_answer:
    "прямой ответ без инструментов — для приветствий, болтовни, простых вопросов по контексту диалога",
  vision:
    "описать приложенное к сообщению изображение (ОБЯЗАТЕЛЬНО ставь шагом №1, если есть картинка)",
  search:
    'веб-поиск свежих фактов, params: {"query": "точный поисковый запрос"}',
  read_url:
    'прочитать конкретную страницу из результатов поиска, params: {"url": "https://..."}',
  reason:
    'размышление/анализ по подзадаче на основе находок, params: {"task": "что именно проанализировать"}',
  math:
    'точные математические и финансовые расчёты, формулы, юнит-экономика, params: {"task": "что посчитать"}',
  deep_reason:
    'глубокий стратегический анализ и сложные дилеммы, params: {"task": "что проанализировать"}',
  pdf_parse:
    'извлечение таблиц и текста из прикреплённого документа/PDF, params: {"task": "что извлечь"}',
  skill:
    'прочитать профильный навык из библиотеки агента, params: {"skill": "<id навыка>"}',
  synthesize: "финальный ответ пользователю из находок шагов (ставь последним)",
};
export const PLAN_BUDGET =
  "1-5 шагов: ровно настолько глубоко, насколько нужен вопрос";
export const MAX_PLAN_STEPS = 5;
function repairJson(text) {
  const t = String(text ?? "")
    .replace(/```(?:json)?/gi, "")
    .trim();
  const start = Math.min(
    ...["[", "{"].map((c) => {
      const i = t.indexOf(c);
      return i === -1 ? Infinity : i;
    }),
  );
  if (!isFinite(start)) return null;
  const stack = [];
  let inStr = false;
  let esc = false;
  let out = "";
  for (const ch of t.slice(start)) {
    if (esc) {
      out += ch;
      esc = false;
      continue;
    }
    if (ch === "\\" && inStr) {
      out += ch;
      esc = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      out += ch;
      continue;
    }
    if (inStr) {
      out += ch;
      continue;
    }
    if (ch === "[" || ch === "{") {
      stack.push(ch === "[" ? "]" : "}");
      out += ch;
      continue;
    }
    if (ch === "]" || ch === "}") {
      if (stack[stack.length - 1] === ch) {
        stack.pop();
        out += ch;
      }
      continue;
    }
    out += ch;
  }
  let fixed = out;
  if (inStr) fixed += '"';
  while (fixed.length && /[,:[\s]$/.test(fixed)) fixed = fixed.slice(0, -1);
  fixed = fixed.replace(/,+$/, "");
  while (stack.length) fixed += stack.pop();
  return fixed;
}
function tryParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, why: String(e?.message ?? e) };
  }
}
export function extractPlanJson(text) {
  const raw = tryParse(
    String(text ?? "")
      .replace(/```(?:json)?/gi, "")
      .trim(),
  );
  if (raw.ok) return { value: raw.value, repaired: false };
  const fixed = repairJson(text);
  if (fixed === null) return { value: null, repaired: false };
  const v = tryParse(fixed);
  return v.ok
    ? { value: v.value, repaired: true }
    : { value: null, repaired: true };
}
export function planKey(step) {
  const p = step?.params ?? {};
  const main = p.query ?? p.url ?? p.task ?? p.skill ?? "";
  return `${step?.type ?? ""}|${String(main).trim().toLowerCase().slice(0, 120)}`;
}
export function normalizeSteps(raw, { executedKeys = [] } = {}) {
  const arr = Array.isArray(raw) ? raw : [];
  const seen = new Set(executedKeys);
  const out = [];
  for (const s of arr) {
    if (!s || typeof s !== "object") continue;
    const type = typeof s.type === "string" ? s.type.trim() : "";
    if (!STEP_TYPES.includes(type)) continue;
    const title =
      typeof s.title === "string" && s.title.trim()
        ? s.title.trim().slice(0, 120)
        : type;
    const params = s.params && typeof s.params === "object" ? s.params : {};
    if (type === "search" && !String(params.query ?? "").trim()) continue;
    if (type === "read_url" && !/^https?:\/\//i.test(String(params.url ?? "")))
      continue;
    if (type === "skill" && !String(params.skill ?? "").trim()) continue;
    const key = planKey({ type, params });
    const step = { type, title, params, key, duplicate: seen.has(key) };
    seen.add(key);
    out.push(step);
    if (out.length >= MAX_PLAN_STEPS) break;
  }
  return out;
}
export function fallbackPlan({ hasImages, executedKeys = [], agentId = null }) {
  const steps = [];
  if (hasImages)
    steps.push({ type: "vision", title: "Изучить изображения", params: {} });
  if (agentId === "marketer")
    steps.push({
      type: "skill",
      title: "Прочитать Growth-фреймворк",
      params: { skill: "growth-framework" },
    });
  steps.push({ type: "direct_answer", title: "Прямой ответ", params: {} });
  return normalizeSteps(steps, { executedKeys });
}
const FAST_PATTERNS = [
  /^(привет|здравствуй|здравствуйте|добрый|доброе|хай|салют|hello|hi|hey|ку|пон|спасибо|благодар|пока|до\s+свидания|как\s+дела)\b/i,
  /^(что|ты|агент|умеешь|можешь|знаешь)\b/i,
  /^(повтор|ещё|еще)\b/i,
];
function looksChatty(question) {
  const q = String(question ?? "").trim().toLowerCase();
  if (q.length <= 40 && /(привет|здравств|приветствую|hello|hi|hey|как дела|спасибо|пока|добрый|доброе|повтор|расскажи|умеешь|можешь)/i.test(q)) return true;
  if (q.length > 80) return false;
  return FAST_PATTERNS.some((re) => re.test(q));
}
export function fastPathPlan({ question, history, hasImages }) {
  if (hasImages) return null;
  if (!looksChatty(question)) return null;
  return normalizeSteps([{ type: "direct_answer", title: "Прямой ответ", params: {} }]);
}
function historyBrief(history, max = 6) {
  const rows = (history ?? []).slice(-max);
  if (!rows.length) return "(пусто)";
  return rows
    .map((m) => {
      const text = String(m.content ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 140);
      const role = m.role === "user" ? "Пользователь" : "Агент";
      return `${role}: ${text || "(приложение)"}`;
    })
    .join("\n");
}
function capabilitiesText({ hasImages, search, readUrl, skills }) {
  const lines = [];
  lines.push("- direct_answer — прямой ответ (всегда доступен)");
  if (hasImages)
    lines.push(
      "- vision — описать изображения (ОБЯЗАТЕЛЬНО ставь шагом №1, если есть картинка)",
    );
  lines.push("- reason — размышление/анализ по подзадаче (всегда доступен)");
  lines.push("- math — точные математические расчёты, формулы, юнит-экономика");
  lines.push("- deep_reason — глубокий многоаспектный стратегический анализ");
  lines.push("- pdf_parse — извлечение таблиц и данных из прикреплённого документа");
  lines.push("- synthesize — финальный ответ из находок (всегда доступен)");
  if (search) lines.push("- search — веб-поиск актуальных фактов");
  if (readUrl) lines.push("- read_url — чтение конкретной страницы");
  if (skills?.length) {
    lines.push(
      '- skill — профильный навык, params: {"skill": "<id>"}',
    );
    lines.push("Доступные навыки (id: название — когда применять):");
    lines.push(
      skills
        .map((s) => {
          const shortWhen = String(s.when || s.name || "")
            .replace(/\s+/g, " ")
            .split(/[.\n;]/)[0]
            .trim()
            .slice(0, 80);
          return `- ${s.id}: ${s.name}${shortWhen && shortWhen !== s.name ? ` (${shortWhen})` : ""}`;
        })
        .join("\n"),
    );
  }
  return lines.join("\n");
}
function plannerSystemPrompt({ hasImages, search, readUrl, replan, skills }) {
  const parts = [
    "Ты — главный планировщик многошагового хода AI-агента. Твоя задача — составить оптимальный план трассы из шагов-инструментов.",
    "Доступные типы шагов:",
    capabilitiesText({ hasImages, search, readUrl, skills }),
    "Правила построения плана:",
    `- Уровень усилия: план из ${PLAN_BUDGET}.`,
    "- ПРИОРИТЕТ ЗРЕНИЯ: если к сообщению прикреплены изображения (hasImages = true) — ШАГ 1 ОБЯЗАТЕЛЬНО должен быть vision.",
    "- Приветствия, болтовня, простые вопросы по контексту диалога → ровно один шаг direct_answer.",
    "- direct_answer: params оставь пустым {} — НЕ пиши сам ответ в плане, ответ даёт исполнитель.",
    "- Если требуются точные подсчёты, формулы, экономика, конверсии → обязательно включи шаг math.",
    "- Для глубоких, сложных аналитических и стратегических задач → включи шаг deep_reason.",
    ...(skills?.length
      ? [
          "- Если вопрос попадает в тематику навыков — поставь 1-3 шага skill (id из списка) ДО synthesize. Для приветствий и болтовни навыки не нужны.",
        ]
      : []),
    replan
      ? "- Это ДОСТРОЙКА плана: учитывай выполненные шаги (помечены [ВЫПОЛНЕН]) и находки. Верни массив ТОЛЬКО новых шагов. Если находок уже достаточно для полного ответа — верни пустой массив []."
      : "- Не планируй шаги, типы которых не перечислены как доступные.",
    "- Каждый шаг — конкретная цель: title коротко о чём шаг; search-запросы самодостаточные и точные.",
    "- Не дублируй шаги (одинаковый тип + запрос).",
    "- Если используешь инструменты (search/read_url/vision/skill/math/deep_reason/pdf_parse) — последний шаг ВСЕГДА synthesize.",
    "- Рассуждай предельно кратко (1-2 коротких предложения в мыслях), сразу переходи к JSON-массиву.",
    "Ответ: СТРОГО JSON-массив, без markdown, без пояснений, формат:",
    '[{"type":"search","title":"кратко","params":{"query":"точный запрос"}}]',
  ];
  return parts.join("\n");
}
function plannerUserPrompt({
  question,
  history,
  hasImages,
  priorSteps,
  findings,
  checkpoint,
}) {
  const parts = [`Вопрос пользователя: ${question}`];
  if (checkpoint) parts.push(`Чекпоинт предыдущего диалога (сжатый пересказ):\n${checkpoint}`);
  parts.push(`История диалога (кратко):
${historyBrief(history)}`);
  parts.push(`Изображения приложены: ${hasImages ? "да" : "нет"}`);
  if (priorSteps?.length) {
    const planLines = priorSteps.map((s, i) => {
      const p = s.params ?? {};
      const main = p.query ?? p.url ?? p.task ?? "";
      return `${i + 1}. ${s.type}${main ? ` (${String(main).slice(0, 80)})` : ""}${s.executed ? " [ВЫПОЛНЕН]" : ""}${s.duplicate ? " [ДУБЛЬ — уже выполнялся]" : ""}`;
    });
    parts.push(`Текущий план:
${planLines.join("\n")}`);
  }
  if (findings?.length) {
    const fLines = findings.map(
      (f) => `- (${f.type}) ${f.title}: ${String(f.text ?? "").slice(0, 700)}`,
    );
    parts.push(`Находки выполненных шагов:
${fLines.join("\n")}`);
  }
  parts.push("Составь план (JSON-массив).");
  return parts.join("\n\n");
}
export async function searchAvailable() {
  const v = await getSettingOr("SERPER_API_KEY", "");
  return Boolean(v);
}
export async function planTurn({
  question,
  history = [],
  hasImages = false,
  skills = [],
  priorSteps = [],
  findings = [],
  executedKeys = [],
  recorder = null,
  checkpoint = null,
}) {
  const t0 = Date.now();
  const replan = Boolean(priorSteps.length);
  try {
    const search = await searchAvailable();
    const model = await getPlannerModel();
    const promptText = [
      plannerSystemPrompt({
        hasImages,
        search,
        readUrl: search,
        replan,
        skills,
      }),
      plannerUserPrompt({
        question,
        history,
        hasImages,
        priorSteps,
        findings,
        checkpoint,
      }),
    ].join("\n\n");
    const msgs = [{ role: "user", content: promptText }];

    let content = "";
    let reasoning = "";
    let pendingReasoning = "";
    let usage = null;
    let resModel = model;

    for await (const ev of streamChat(msgs, {
      model,
      temperature: 0.2,
      maxTokens: 600,
    })) {
      if (ev.model && !resModel) resModel = ev.model;
      if (ev.usage) usage = ev.usage;
      if (ev.delta) content += ev.delta;
      if (ev.reasoning) {
        reasoning += ev.reasoning;
        pendingReasoning += ev.reasoning;
        if (recorder && pendingReasoning.length >= 250) {
          await recorder.event("reasoning", { text: pendingReasoning });
          pendingReasoning = "";
        }
      }
    }
    if (recorder && pendingReasoning) {
      await recorder.event("reasoning", { text: pendingReasoning });
      pendingReasoning = "";
    }

    const planText = content.trim() || reasoning.trim() || "";
    const { value, repaired } = extractPlanJson(planText);
    let steps = normalizeSteps(value, { executedKeys });
    if (replan && steps.length) {
      steps = steps.filter((s) => s.type !== "synthesize");
    }
    if (!replan && !steps.length) {
      steps = fallbackPlan({ hasImages, executedKeys });
    }
    if (replan && !steps.length) steps = [];
    return {
      steps,
      repaired,
      model: resModel,
      usage,
      latencyMs: Date.now() - t0,
      ok: true,
    };
  } catch (e) {
    const steps = replan ? [] : fallbackPlan({ hasImages, executedKeys });
    return {
      steps,
      repaired: false,
      model: null,
      usage: null,
      latencyMs: Date.now() - t0,
      ok: false,
      error: String(e?.message ?? e).slice(0, 200),
    };
  }
}
