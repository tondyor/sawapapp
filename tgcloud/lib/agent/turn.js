import { db } from "sdk";
import { eq, and, desc } from "sdk/db";
import { turns, files, messages } from "../../schema.js";
import { MAX_MESSAGE_CHARS } from "../config.js";
import {
  sanitizeTurnId,
  createRecorder,
  cleanupConversationTurns,
} from "../turnEvents.js";
import {
  prepareTurn,
  getHistory,
  finishTurn,
  buildMeta,
  getConversationById,
  buildLlmMessages,
  deleteMessagesAfter,
} from "../chat.js";
import { streamChat, resolveAnswerModel } from "../nvidia.js";
import { getAgentOrDefault } from "../agents.js";
import { planTurn, fallbackPlan, planKey, MAX_PLAN_STEPS } from "./pipeline.js";
import {
  EXECUTORS,
  hasExecutor,
  isFinalStep,
  compressFinding,
  historyWithoutTurnQuestion,
} from "./executors.js";
import { MARKETER_AGENT_ID, ensureMarketerSkills } from "../skills/mSkills.js";
const TERMINAL = ["done", "error", "stopped"];
function genTurnId() {
  return (
    sanitizeTurnId(
      `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    ) ?? `a-${Date.now().toString(36)}x`
  );
}
function lastUserImages(history) {
  const lastUser = [...(history ?? [])]
    .reverse()
    .find((m) => m.role === "user");
  return (lastUser?.attachments ?? []).filter((a) => {
    const mime = String(a.mime ?? "").toLowerCase();
    return mime.startsWith("image/") && mime !== "image/svg+xml";
  });
}
async function touch(turnId, patch) {
  await db
    .update(turns)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(turns.turnId, turnId));
}
async function loadOwnedTurn(turnId, tgId) {
  const row = await db
    .select()
    .from(turns)
    .where(eq(turns.turnId, turnId))
    .get();
  if (!row || row.tgId !== tgId) return null;
  return row;
}
export async function startTurn({
  tgUser,
  agentId,
  text,
  conversationId,
  attachmentIds,
  fromMessageId,
}) {
  let prepared, question;
  if (fromMessageId) {
    const conv0 = await getConversationById(
      Number(conversationId) || 0,
      tgUser.id,
    );
    if (!conv0) {
      const e = new Error("Диалог не найден");
      e.code = "CONV_NOT_FOUND";
      throw e;
    }
    const msg = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, Number(fromMessageId)),
          eq(messages.conversationId, conv0.id),
        ),
      )
      .get();
    if (!msg || msg.role !== "user") {
      const e = new Error("Сообщение не найдено");
      e.code = "MESSAGE_NOT_FOUND";
      throw e;
    }
    await deleteMessagesAfter(conv0.id, msg.id);
    prepared = {
      agent: getAgentOrDefault(agentId ?? conv0.agentId),
      conv: conv0,
      history: await getHistory(conv0.id),
    };
    question = String(msg.content ?? "").trim() || "изображение";
  } else {
    if (
      (!text || !String(text).trim()) &&
      !(attachmentIds && attachmentIds.length)
    ) {
      const e = new Error("Пустое сообщение");
      e.code = "EMPTY_MESSAGE";
      throw e;
    }
    if (String(text ?? "").length > MAX_MESSAGE_CHARS) {
      const e = new Error(
        `Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`,
      );
      e.code = "TOO_LONG";
      throw e;
    }
    prepared = await prepareTurn({
      tgUser,
      agentId,
      text,
      conversationId,
      attachments: attachmentIds
        ? await resolveAttachments(tgUser.id, attachmentIds)
        : null,
      reuseLastUser: true,
      forceNewConversation: !conversationId,
    });
    question =
      String(text ?? "").trim() || (attachmentIds?.length ? "изображение" : "");
  }
  const { agent, conv, history } = prepared;
  const images = lastUserImages(history);
  const hasImages = images.length > 0;
  const turnId = genTurnId();
  const recorder = createRecorder({
    turnId,
    conversationId: conv.id,
    tgId: conv.tgId,
  });
  await cleanupConversationTurns(conv.id, turnId);
  await recorder.event("start", {
    model: null,
    agentId: agent.id,
    agentName: agent.name,
    pipeline: true,
  });
  const skills =
    agent.id === MARKETER_AGENT_ID ? await ensureMarketerSkills() : [];
  let plan;
  let planMeta = { ok: true, repaired: false, model: null, latencyMs: 0 };
  const res = await planTurn({ question, history, hasImages, skills });
  plan = res.steps;
  planMeta = {
    ok: res.ok,
    repaired: res.repaired,
    model: res.model,
    latencyMs: res.latencyMs,
    error: res.error ?? null,
  };
  if (!plan.length) plan = fallbackPlan({ hasImages });
  const [row] = await db
    .insert(turns)
    .values({
      turnId,
      conversationId: conv.id,
      tgId: conv.tgId,
      agentId: agent.id,
      status: "executing",
      question,
      plan: plan.map((s) => ({
        type: s.type,
        title: s.title,
        params: s.params,
        key: s.key,
        duplicate: s.duplicate,
      })),
      currentStep: 0,
      findings: [],
    })
    .returning();
  await recorder.event("plan", {
    steps: plan.map((s) => ({ type: s.type, title: s.title })),
    ...planMeta,
  });
  return {
    turnId: row.turnId,
    conversationId: conv.id,
    agentId: agent.id,
    agentName: agent.name,
    status: row.status,
    plan: row.plan,
    planMeta,
  };
}
async function resolveAttachments(tgId, ids) {
  const out = [];
  for (const fid of ids.slice(0, 4).map(Number).filter(Boolean)) {
    const row = await db.select().from(files).where(eq(files.id, fid)).get();
    if (!row || row.tgId !== tgId) {
      const e = new Error("Вложение не найдено");
      e.code = "FILE_NOT_FOUND";
      throw e;
    }
    out.push({
      fileId: row.id,
      name: row.name,
      mime: row.mime,
      size: row.size,
    });
  }
  return out;
}
export async function runTurnStep({ turnId, tgId }) {
  const tid = sanitizeTurnId(turnId);
  if (!tid) {
    const e = new Error("Некорректный turnId");
    e.code = "BAD_TURN";
    throw e;
  }
  const turn = await loadOwnedTurn(tid, tgId);
  if (!turn) {
    const e = new Error("Ход не найден");
    e.code = "TURN_NOT_FOUND";
    throw e;
  }
  if (TERMINAL.includes(turn.status) || turn.status === "synthesizing") {
    return {
      status: turn.status,
      currentStep: turn.currentStep,
      plan: turn.plan,
      findings: turn.findings,
    };
  }
  const plan = Array.isArray(turn.plan) ? turn.plan : [];
  const idx = Number(turn.currentStep ?? 0);
  const conv = await getConversationById(turn.conversationId, tgId);
  if (!conv) {
    const e = new Error("Диалог не найден");
    e.code = "CONV_NOT_FOUND";
    throw e;
  }
  const agent = getAgentOrDefault(turn.agentId);
  const history = await getHistory(conv.id);
  const recorder = createRecorder({
    turnId: tid,
    conversationId: conv.id,
    tgId,
  });
  const findings = Array.isArray(turn.findings) ? [...turn.findings] : [];
  const step = plan[idx];
  if (!step) {
    await touch(tid, { status: "synthesizing" });
    return { status: "synthesizing", currentStep: idx, plan, findings };
  }
  await recorder.event("step_start", {
    index: idx,
    type: step.type,
    title: step.title,
  });
  const t0 = Date.now();
  if (isFinalStep(step.type) && !step.duplicate) {
    await touch(tid, { status: "synthesizing" });
    return { status: "synthesizing", currentStep: idx, plan, findings };
  }
  if (step.duplicate) {
    findings.push({
      index: idx,
      type: step.type,
      title: step.title,
      ok: true,
      ms: 0,
      text: "Шаг с таким же запросом уже выполнялся ранее — пропущен.",
    });
    await recorder.event("step_done", {
      index: idx,
      type: step.type,
      title: step.title,
      ok: true,
      duplicate: true,
      ms: 0,
    });
    await touch(tid, { currentStep: idx + 1, findings });
    return {
      status: "executing",
      currentStep: idx + 1,
      stepResult: {
        index: idx,
        type: step.type,
        title: step.title,
        ok: true,
        duplicate: true,
        ms: 0,
      },
    };
  }
  if (!hasExecutor(step.type)) {
    findings.push({
      index: idx,
      type: step.type,
      title: step.title,
      ok: false,
      ms: 0,
      text: `Неизвестный тип шага «${step.type}» — пропущен.`,
    });
    await recorder.event("step_done", {
      index: idx,
      type: step.type,
      title: step.title,
      ok: false,
      ms: 0,
    });
    await touch(tid, { currentStep: idx + 1, findings });
    return {
      status: "executing",
      currentStep: idx + 1,
      stepResult: { index: idx, type: step.type, ok: false },
    };
  }
  const ctx = {
    agent,
    conv,
    history,
    question: turn.question,
    findings,
    recorder,
    stepIndex: idx,
  };
  try {
    const result = await EXECUTORS[step.type](step, ctx);
    const ms = Date.now() - t0;
    const fresh = await db
      .select()
      .from(turns)
      .where(eq(turns.turnId, tid))
      .get();
    if (fresh && fresh.status === "stopped") {
      return {
        status: "stopped",
        currentStep: idx,
        stepResult: { index: idx, type: step.type, ok: false, stopped: true },
      };
    }
    if (isFinalStep(step.type)) {
      const meta = buildMeta({
        started: t0,
        model: result.stream?.model ?? null,
        usage: result.stream?.usage ?? null,
        steps: stepsMeta(findings, {
          type: step.type,
          title: step.title,
          ms,
          ok: true,
        }),
        skills: result.stream?.skills ?? [],
        reasoningText: result.stream?.reasoningText ?? null,
      });
      const message = await finishTurn(
        conv,
        (result.content ?? "").trim() || "[пустой ответ]",
        meta,
      );
      await recorder.event("done", {
        messageId: message.id,
        content: message.content,
        meta,
      });
      await touch(tid, {
        status: "done",
        currentStep: idx + 1,
        findings: stepsMeta(findings, {
          type: step.type,
          title: step.title,
          ms,
          ok: true,
        }),
      });
      return {
        status: "done",
        message: { id: message.id, content: message.content, meta },
        stepResult: { index: idx, type: step.type, ok: true, ms },
      };
    }
    let findingText;
    let eventPayload = null;
    if (result.finding !== null && result.finding !== void 0) {
      findingText = result.finding;
      eventPayload = result.event ?? null;
    } else {
      findingText = await compressFinding(result.raw ?? "");
    }
    const ok = true;
    findings.push({
      index: idx,
      type: step.type,
      title: step.title,
      ok,
      ms,
      text: findingText,
    });
    await recorder.event("step_done", {
      index: idx,
      type: step.type,
      title: step.title,
      ok,
      ms,
    });
    if (eventPayload) await recorder.event(step.type, eventPayload);
    let updatedPlan = plan;
    let replanned = false;
    {
      const rp = await planTurn({
        question: turn.question,
        history,
        hasImages: lastUserImages(history).length > 0,
        skills:
          turn.agentId === MARKETER_AGENT_ID
            ? await ensureMarketerSkills()
            : [],
        priorSteps: plan.map((s, i) => ({ ...s, executed: i <= idx })),
        findings: findings.map((f) => ({
          type: f.type,
          title: f.title,
          text: f.text,
        })),
        executedKeys: findings.map((f) =>
          planKey({ type: f.type, params: keyParams(plan[f.index]) }),
        ),
      });
      if (rp.ok && rp.steps.length) {
        const cap = MAX_PLAN_STEPS + 1;
        const insertion = rp.steps
          .filter((s) => s.type !== "synthesize")
          .filter((s) => !plan.some((p, i) => i > idx && planKey(p) === s.key))
          .slice(0, Math.max(0, cap - plan.length));
        if (insertion.length) {
          const next = [...plan];
          const lastFinal =
            next.length && isFinalStep(next[next.length - 1].type) ? 1 : 0;
          const at = next.length - lastFinal;
          next.splice(
            at,
            0,
            ...insertion.map((s) => ({
              type: s.type,
              title: s.title,
              params: s.params,
              key: s.key,
              duplicate: s.duplicate,
            })),
          );
          updatedPlan = next;
        }
        replanned = insertion.length > 0;
      }
    }
    await touch(tid, {
      currentStep: idx + 1,
      findings,
      plan: updatedPlan,
      status: "executing",
    });
    if (replanned)
      await recorder.event("plan_update", {
        steps: updatedPlan.map((s) => ({ type: s.type, title: s.title })),
      });
    return {
      status: "executing",
      currentStep: idx + 1,
      stepResult: {
        index: idx,
        type: step.type,
        title: step.title,
        ok,
        ms,
        finding: findingText,
      },
      plan: updatedPlan,
    };
  } catch (e) {
    const ms = Date.now() - t0;
    const errMsg = String(e?.message ?? e).slice(0, 300);
    if (isFinalStep(step.type)) {
      const meta = buildMeta({
        started: t0,
        steps: stepsMeta(findings, {
          type: step.type,
          title: step.title,
          ms,
          ok: false,
        }),
        error: errMsg,
      });
      await recorder.event("error", { message: errMsg });
      try {
        await finishTurn(conv, "[ошибка: ответ не получен]", meta);
      } catch (_) {}
      await touch(tid, {
        status: "error",
        error: errMsg,
        findings: stepsMeta(findings, {
          type: step.type,
          title: step.title,
          ms,
          ok: false,
        }),
      });
      return {
        status: "error",
        error: errMsg,
        stepResult: { index: idx, type: step.type, ok: false, ms },
      };
    }
    findings.push({
      index: idx,
      type: step.type,
      title: step.title,
      ok: false,
      ms,
      text: `Инструмент «${step.type}» не сработал: ${errMsg}`,
    });
    await recorder.event("step_done", {
      index: idx,
      type: step.type,
      title: step.title,
      ok: false,
      ms,
      error: errMsg,
    });
    await touch(tid, { currentStep: idx + 1, findings });
    return {
      status: "executing",
      currentStep: idx + 1,
      stepResult: { index: idx, type: step.type, ok: false, ms, error: errMsg },
    };
  }
}
function keyParams(stepRow) {
  return stepRow?.params ?? {};
}
function stepsMeta(findings, finalStep) {
  return [
    ...findings.map((f) => ({
      type: f.type,
      title: f.title,
      ms: f.ms,
      ok: f.ok,
      finding: String(f.text ?? "").slice(0, 800),
    })),
    finalStep,
  ];
}
const SYNTH_CHUNK_TOKENS = 700;
const SYNTH_PERSIST_MS = 6e3;
export async function finishTurnSynthesis({ turnId, tgId }) {
  const tid = sanitizeTurnId(turnId);
  if (!tid) {
    const e = new Error("Некорректный turnId");
    e.code = "BAD_TURN";
    throw e;
  }
  const turn = await loadOwnedTurn(tid, tgId);
  if (!turn) {
    const e = new Error("Ход не найден");
    e.code = "TURN_NOT_FOUND";
    throw e;
  }
  if (turn.status === "done") return { status: "done", already: true };
  if (turn.status === "stopped") return { status: "stopped" };
  if (turn.status === "error") return { status: "error", error: turn.error };
  const conv = await getConversationById(turn.conversationId, tgId);
  if (!conv) {
    const e = new Error("Диалог не найден");
    e.code = "CONV_NOT_FOUND";
    throw e;
  }
  const agent = getAgentOrDefault(turn.agentId);
  const history = await getHistory(conv.id);
  const recorder = createRecorder({
    turnId: tid,
    conversationId: conv.id,
    tgId,
  });
  const findings = Array.isArray(turn.findings) ? turn.findings : [];
  if (turn.answerDone && turn.answerText) {
    const meta = buildMeta({
      started: Date.now(),
      steps: findings.map((f) => ({
        type: f.type,
        title: f.title,
        ms: f.ms,
        ok: f.ok,
      })),
    });
    const message = await finishTurn(
      conv,
      turn.answerText.trim() || "[пустой ответ]",
      meta,
    );
    await recorder.event("done", {
      messageId: message.id,
      content: message.content,
      meta,
    });
    await touch(tid, { status: "done", currentStep: findings.length + 1 });
    return {
      status: "done",
      message: { id: message.id, content: message.content, meta },
    };
  }
  await touch(tid, { status: "synthesizing" });
  const base = await buildLlmMessages(
    agent,
    historyWithoutTurnQuestion(history, turn.question),
  );
  const findingsText = findings.length
    ? findings
        .map(
          (
            f,
            i,
          ) => `[${i + 1}] ${f.title} (${f.type}, ${f.ok ? "успешно" : "не удалось"}):
${f.text}`,
        )
        .join("\n\n")
    : "(шаги не дали находок)";
  const acc = turn.answerText ?? "";
  base.push({
    role: "user",
    content: acc
      ? [
          `Вопрос пользователя: ${turn.question}`,
          `Результаты выполненных шагов хода:
${findingsText}`,
          "Ты уже начал писать ответ, но текст оборвался. Ниже — конец уже написанного. Продолжи ответ РОВНО с места обрыва: не повторяй написанное, не здоровайся, не начинай заново; если обрыв в середине предложения — продолжи со средины. Пиши сразу продолжение, без преамбул.",
          `Конец уже написанного текста:
…${acc.slice(-1500)}`,
        ].join("\n\n")
      : [
          `Вопрос пользователя: ${turn.question}`,
          "Результаты выполненных шагов хода:",
          findingsText,
          "Составь финальный ответ пользователю на основе находок. Если инструмент не сработал — скажи об этом честно и ответь тем, что есть. Отвечай на языке вопроса.",
        ].join("\n\n"),
  });
  const model = await resolveAnswerModel();
  const started = Date.now();
  let lastPersist = Date.now();
  let pendingContent = "";
  let pendingReasoning = "";
  let finish = null;
  let grew = 0;
  const persist = async () => {
    await touch(tid, { answerText: acc });
    lastPersist = Date.now();
  };
  const flushEvents = async (force = false) => {
    if (pendingContent && (force || pendingContent.length >= 300)) {
      await recorder.event("content", { text: pendingContent });
      pendingContent = "";
    }
    if (pendingReasoning && (force || pendingReasoning.length >= 350)) {
      await recorder.event("reasoning", { text: pendingReasoning });
      pendingReasoning = "";
    }
  };
  const t0 = Date.now();
  try {
    for await (const ev of streamChat(base, {
      model,
      maxTokens: SYNTH_CHUNK_TOKENS,
    })) {
      if (ev.reasoning) pendingReasoning += ev.reasoning;
      if (ev.delta) {
        acc += ev.delta;
        grew += ev.delta.length;
        pendingContent += ev.delta;
      }
      if (ev.finish) finish = ev.finish;
      if (pendingContent.length >= 300 || pendingReasoning.length >= 350)
        await flushEvents();
      if (Date.now() - lastPersist >= SYNTH_PERSIST_MS) await persist();
    }
    await flushEvents(true);
    await persist();
  } catch (e) {
    try {
      await flushEvents(true);
      await persist();
    } catch (_) {}
    if (grew > 0 || acc) {
      return {
        status: "synthesizing",
        partial: true,
        appended: grew,
        totalChars: acc.length,
      };
    }
    const errMsg = String(e?.message ?? e).slice(0, 300);
    const meta = buildMeta({
      started: t0,
      steps: findings.map((f) => ({
        type: f.type,
        title: f.title,
        ms: f.ms,
        ok: f.ok,
      })),
      error: errMsg,
    });
    await recorder.event("error", { message: errMsg });
    try {
      await finishTurn(conv, "[ошибка: ответ не получен]", meta);
    } catch (_) {}
    await touch(tid, { status: "error", error: errMsg });
    return { status: "error", error: errMsg };
  }
  if (finish === "stop" || finish == null) {
    const meta = buildMeta({
      started,
      model,
      steps: findings.map((f) => ({
        type: f.type,
        title: f.title,
        ms: f.ms,
        ok: f.ok,
      })),
    });
    const message = await finishTurn(
      conv,
      acc.trim() || "[пустой ответ]",
      meta,
    );
    await recorder.event("done", {
      messageId: message.id,
      content: message.content,
      meta,
    });
    await touch(tid, {
      status: "done",
      answerDone: true,
      answerText: acc,
      currentStep: findings.length + 1,
    });
    return {
      status: "done",
      message: { id: message.id, content: message.content, meta },
    };
  }
  await persist();
  return {
    status: "synthesizing",
    partial: true,
    appended: grew,
    totalChars: acc.length,
  };
}
export async function stopTurn({ turnId, tgId }) {
  const tid = sanitizeTurnId(turnId);
  if (!tid) {
    const e = new Error("Некорректный turnId");
    e.code = "BAD_TURN";
    throw e;
  }
  const turn = await loadOwnedTurn(tid, tgId);
  if (!turn) {
    const e = new Error("Ход не найден");
    e.code = "TURN_NOT_FOUND";
    throw e;
  }
  if (TERMINAL.includes(turn.status)) return { status: turn.status };
  const conv = await getConversationById(turn.conversationId, tgId);
  const findings = Array.isArray(turn.findings) ? turn.findings : [];
  const done = findings.filter((f) => f.ok);
  const failed = findings.filter((f) => !f.ok);
  const lines = ["⏹ Ход остановлен."];
  if (findings.length) {
    lines.push(
      `Шагов выполнено: ${done.length}${failed.length ? `, не удалось: ${failed.length}` : ""}.`,
    );
    lines.push(...done.slice(0, 6).map((f) => `• ${f.title || f.type}`));
    if (failed.length)
      lines.push(...failed.slice(0, 3).map((f) => `✕ ${f.title || f.type}`));
    if (done.some((f) => f.text)) {
      lines.push("");
      lines.push("Найдено к моменту остановки:");
      for (const f of done.filter((x) => x.text).slice(0, 4))
        lines.push(`— ${String(f.text).slice(0, 300)}`);
    }
  } else {
    lines.push("Ход остановлен до завершения шагов.");
  }
  if (conv) {
    try {
      await finishTurn(
        conv,
        lines.join("\n"),
        buildMeta({
          started: Date.now(),
          steps: findings.map((f) => ({
            type: f.type,
            title: f.title,
            ms: f.ms,
            ok: f.ok,
          })),
          error: "stopped by user",
        }),
      );
    } catch (_) {}
  }
  await touch(tid, { status: "stopped" });
  const recorder = createRecorder({
    turnId: tid,
    conversationId: turn.conversationId,
    tgId,
  });
  await recorder.event("stop", { steps: done.length });
  return {
    status: "stopped",
    stepsDone: done.length,
    summary: lines.join("\n"),
  };
}
export async function getTurn({ turnId, conversationId, tgId }) {
  if (turnId) {
    const row = await loadOwnedTurn(sanitizeTurnId(turnId) ?? "", tgId);
    return row ? turnView(row) : null;
  }
  const rows = await db
    .select()
    .from(turns)
    .where(
      and(
        eq(turns.conversationId, Number(conversationId) || 0),
        eq(turns.tgId, tgId),
      ),
    )
    .orderBy(desc(turns.createdAt))
    .limit(10)
    .all();
  const active = rows.find((r) => !TERMINAL.includes(r.status));
  return active ? turnView(active) : null;
}
function turnView(row) {
  return {
    turnId: row.turnId,
    conversationId: row.conversationId,
    status: row.status,
    question: row.question,
    plan: row.plan,
    currentStep: row.currentStep,
    findings: row.findings,
    error: row.error,
    createdAt: row.createdAt,
  };
}
