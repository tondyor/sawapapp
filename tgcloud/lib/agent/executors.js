import { db } from "sdk";
import { eq } from "sdk/db";
import { messages } from "../../schema.js";
import { buildLlmMessages, streamRounds, describeImage } from "../chat.js";
import {
  completeChat,
  getCompressModel,
  resolveAnswerModel,
} from "../nvidia.js";
import { webSearch, webRead } from "./websearch.js";
import { getSkill } from "../skills/index.js";
import { ensureMarketerSkills } from "../skills/mSkills.js";
export const MAX_FINDING_CHARS = 2e3;
const COMPRESS_PROMPT = [
  "Сожми отчёт шага AI-агента в находку для планировщика и финального ответа.",
  "Сохрани все факты, числа, имена, надписи и ссылки ДОСЛОВНО. Убери воду и повторы.",
  `Максимум ${MAX_FINDING_CHARS} знаков. Без вступлений и пояснений — только сжатый текст.`,
].join("\n");
export async function compressFinding(
  raw,
  { maxChars = MAX_FINDING_CHARS } = {},
) {
  const src = String(raw ?? "").trim();
  if (!src) return "";
  if (src.length <= maxChars) return src;
  try {
    const model = await getCompressModel();
    const r = await completeChat(
      [
        { role: "system", content: COMPRESS_PROMPT },
        { role: "user", content: src },
      ],
      { model, temperature: 0.2, maxTokens: 900 },
    );
    const out = (r.content ?? "").trim();
    return (out && out.length <= maxChars * 1.5 ? out : src).slice(0, maxChars);
  } catch (_) {
    return src.slice(0, maxChars);
  }
}
export async function execVision(step, ctx) {
  const lastUser = [...ctx.history].reverse().find((m) => m.role === "user");
  if (!lastUser)
    return {
      raw: "Изображений в последнем сообщении нет.",
      finding: "Изображений в последнем сообщении нет.",
    };
  const att = (lastUser.attachments ?? []).find((a) => {
    const mime = String(a.mime ?? "").toLowerCase();
    return mime.startsWith("image/") && mime !== "image/svg+xml" && !a.vision;
  });
  let desc;
  let name;
  let cached = false;
  if (!att) {
    const done = (lastUser.attachments ?? []).filter((a) => a.vision);
    desc = done.length
      ? done.map((a) => `${a.name}: ${a.vision}`).join("\n")
      : "Изображений для чтения нет.";
    cached = true;
    name = done.map((a) => a.name).join(", ") || null;
  } else {
    name = att.name;
    desc = await describeImage(att);
    att.vision = desc;
    await db
      .update(messages)
      .set({ attachments: lastUser.attachments ?? [] })
      .where(eq(messages.id, lastUser.id));
  }
  return {
    raw: desc,
    finding: desc.slice(0, 800),
    event: { index: ctx.stepIndex, name, description: desc, cached },
  };
}
export async function execSearch(step, ctx) {
  const query = String(step.params?.query ?? "").trim();
  const { items, raw } = await webSearch(query);
  return {
    raw,
    event: { index: ctx.stepIndex, query, count: items.length, items },
  };
}
export async function execReadUrl(step, ctx) {
  const url = String(step.params?.url ?? "").trim();
  const { text, via } = await webRead(url);
  return {
    raw: text,
    event: { index: ctx.stepIndex, url, via, chars: text.length },
  };
}
const MAX_SKILL_FINDING_CHARS = 16e3;
export async function execSkill(step, ctx) {
  const skillId = String(step.params?.skill ?? "").trim();
  if (!skillId)
    return { raw: "", finding: "Шаг skill без id навыка — пропущен." };
  const dbSkills = await ensureMarketerSkills();
  const skill =
    getSkill(skillId) ?? dbSkills.find((s) => s.id === skillId) ?? null;
  if (!skill?.content) {
    return {
      raw: "",
      finding: `Навык «${skillId}» не найден в библиотеке — отвечай без него, используя свои знания.`,
    };
  }
  return {
    raw: "",
    finding: skill.content.slice(0, MAX_SKILL_FINDING_CHARS),
    event: { index: ctx.stepIndex, id: skillId, name: skill.name },
  };
}
async function runStream({ llmMessages, ctx }) {
  const out = {
    started: Date.now(),
    skills: [],
    steps: [],
    model: null,
    usage: null,
    reasoningText: null,
    content: null,
  };
  const model = await resolveAnswerModel();
  let attempts = 0;
  for (;;) {
    attempts += 1;
    try {
      for await (const _ev of streamRounds(
        { agent: ctx.agent, llmMessages, model },
        out,
        ctx.recorder,
      )) {
      }
      return out;
    } catch (e) {
      const emitted =
        (out.content && out.content.length) ||
        (out.reasoningText && out.reasoningText.length);
      if (attempts >= 2 || emitted) throw e;
    }
  }
}
export async function execDirectAnswer(step, ctx) {
  const llmMessages = await buildLlmMessages(ctx.agent, ctx.history);
  const out = await runStream({ llmMessages, ctx });
  return { stream: out, content: out.content ?? "", finding: null };
}
export function historyWithoutTurnQuestion(history, question) {
  const q = String(question ?? "").trim();
  const last = history[history.length - 1];
  if (last && last.role === "user" && String(last.content ?? "").trim() === q)
    return history.slice(0, -1);
  return history;
}
export async function execReason(step, ctx) {
  const base = await buildLlmMessages(
    ctx.agent,
    historyWithoutTurnQuestion(ctx.history, ctx.question),
  );
  const findingsText = (ctx.findings ?? []).length
    ? `Находки предыдущих шагов:
${ctx.findings.map((f, i) => `${i + 1}. (${f.type}) ${f.title}: ${f.text}`).join("\n")}`
    : "Находок пока нет.";
  const task = String(
    step.params?.task ?? step.title ?? "проанализируй вопрос",
  );
  base.push({
    role: "user",
    content: [
      "Ты — внутренний модуль анализа AI-агента. Это служебный шаг хода, не диалог с пользователем: не приветствуй и не обращайся к пользователю.",
      `Вопрос пользователя: ${ctx.question}`,
      `Подзадача шага: ${task}`,
      findingsText,
      "Верни РЕЗУЛЬТАТ анализа: выводы, факты, числа. Он пойдёт планировщику и финальному ответу.",
    ].join("\n\n"),
  });
  const out = await runStream({ llmMessages: base, ctx });
  return {
    stream: out,
    content: out.content ?? "",
    event: { index: ctx.stepIndex, task },
  };
}
export async function execSynthesize(step, ctx) {
  const base = await buildLlmMessages(
    ctx.agent,
    historyWithoutTurnQuestion(ctx.history, ctx.question),
  );
  const findingsText = (ctx.findings ?? []).length
    ? ctx.findings
        .map(
          (
            f,
            i,
          ) => `[${i + 1}] ${f.title} (${f.type}, ${f.ok ? "успешно" : "не удалось"}):
${f.text}`,
        )
        .join("\n\n")
    : "(шаги не дали находок)";
  base.push({
    role: "user",
    content: [
      `Вопрос пользователя: ${ctx.question}`,
      "Результаты выполненных шагов хода:",
      findingsText,
      "Составь финальный ответ пользователю на основе находок. Если инструмент не сработал — скажи об этом честно и ответь тем, что есть. Отвечай на языке вопроса.",
    ].join("\n\n"),
  });
  const out = await runStream({ llmMessages: base, ctx });
  return { stream: out, content: out.content ?? "", finding: null };
}
export const EXECUTORS = {
  vision: execVision,
  search: execSearch,
  read_url: execReadUrl,
  reason: execReason,
  skill: execSkill,
  direct_answer: execDirectAnswer,
  synthesize: execSynthesize,
};
export function hasExecutor(type) {
  return Boolean(EXECUTORS[type]);
}
export function isFinalStep(type) {
  return type === "direct_answer" || type === "synthesize";
}
