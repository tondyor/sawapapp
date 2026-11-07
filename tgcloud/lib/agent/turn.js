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
import { streamChat, resolveAnswerModel, generateActionStatus } from "../nvidia.js";
import { getAgentOrDefault } from "../agents.js";
import { planTurn, fallbackPlan, planKey, MAX_PLAN_STEPS, fastPathPlan } from "./pipeline.js";
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
  const [row] = await db
    .insert(turns)
    .values({
      turnId,
      conversationId: conv.id,
      tgId: conv.tgId,
      agentId: agent.id,
      status: "planning",
      question,
      plan: null,
      currentStep: 0,
      findings: [],
      stepText: "",
      stepDone: false,
      stepAttempts: 0,
    })
    .returning();
  await recorder.event("plan_wait", { hasImages });
  return {
    turnId: row.turnId,
    conversationId: conv.id,
    agentId: agent.id,
    agentName: agent.name,
    status: row.status,
    plan: row.plan,
    planMeta: { ok: true, pending: true },
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
  if (turn.status === "planning") {
    const turnConv = await getConversationById(turn.conversationId, tgId);
    if (!turnConv) {
      const e = new Error("Диалог не найден");
      e.code = "CONV_NOT_FOUND";
      throw e;
    }
    const turnAgent = getAgentOrDefault(turn.agentId);
    const turnHistory = await getHistory(turnConv.id);
    const turnRecorder = createRecorder({
      turnId: tid,
      conversationId: turnConv.id,
      tgId,
    });
    const turnImages = lastUserImages(turnHistory);
    const turnHasImages = turnImages.length > 0;
    const attemptsPlan = (turn.stepAttempts ?? 0) + 1;
    const fastPlan = fastPathPlan({
      question: turn.question,
      history: turnHistory,
      hasImages: turnHasImages,
    });
    let plan;
    let planMeta = {
      ok: true,
      repaired: false,
      model: null,
      latencyMs: 0,
      fastPath: false,
      planAttempts: attemptsPlan,
    };
    if (fastPlan) {
      plan = fastPlan;
      planMeta.fastPath = true;
    } else if (attemptsPlan >= 3) {
      plan = fallbackPlan({ hasImages: turnHasImages, agentId: turn.agentId });
      planMeta.fallback = true;
      await turnRecorder.event("plan", {
        steps: plan.map((s) => ({ type: s.type, title: s.title })),
        ...planMeta,
      });
    } else {
      await touch(tid, { stepAttempts: attemptsPlan });
      const boltPlanStatus = await generateActionStatus({
        action: "составляю план действий",
        question: turn.question,
      });
      if (boltPlanStatus) {
        await turnRecorder.event("status", { text: boltPlanStatus });
      }
      const res = await planTurn({
        question: turn.question,
        history: turnHistory,
        hasImages: turnHasImages,
        skills:
          turn.agentId === MARKETER_AGENT_ID
            ? await ensureMarketerSkills()
            : [],
        recorder: turnRecorder,
        checkpoint: turnConv.checkpoint ?? null,
      });
      plan = res.steps;
      planMeta = {
        ok: res.ok,
        repaired: res.repaired,
        model: res.model,
        latencyMs: res.latencyMs,
        error: res.error ?? null,
        fastPath: false,
        planAttempts: attemptsPlan,
      };
    }
    if (!plan.length)
      plan = fallbackPlan({ hasImages: turnHasImages, agentId: turn.agentId });
    const planRows = [...plan, ...(plan.some((s) => s.type === "synthesize") ? [] : [{ type: "synthesize", title: "Финальный ответ", params: {} }])].map((s) => ({
      type: s.type,
      title: s.title,
      params: s.params,
      key: s.key,
      duplicate: s.duplicate,
    }));
    const [updatedRow] = await db
      .update(turns)
      .set({
        status: "executing",
        plan: planRows,
        currentStep: 0,
        updatedAt: new Date(),
        stepAttempts: 0,
      })
      .where(eq(turns.turnId, tid))
      .returning();
    await turnRecorder.event("plan", {
      steps: plan.map((s) => ({ type: s.type, title: s.title })),
      ...planMeta,
    });
    return {
      status: "executing",
      currentStep: 0,
      plan: updatedRow.plan,
      findings: [],
      planMeta,
    };
  }
  const idx = Number(turn.currentStep ?? 0);
  const plan = Array.isArray(turn.plan) ? turn.plan : [];
  if (plan.length === 0) {
    return { status: "synthesizing", currentStep: idx, plan: [], findings: [] };
  }
  const conv = await getConversationById(turn.conversationId, tgId);  if (!conv) {
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
  const boltSynthStatus = await generateActionStatus({
    action: "формулирую итоговый ответ",
    question: turn.question,
  });
  if (boltSynthStatus) {
    await recorder.event("status", { text: boltSynthStatus });
  }
    return { status: "synthesizing", currentStep: idx, plan, findings };
  }
  const boltStepStatus = await generateActionStatus({
    step,
    question: turn.question,
  });
  if (boltStepStatus) {
    await recorder.event("status", { text: boltStepStatus });
  }
  await recorder.event("step_start", {
    index: idx,
    type: step.type,
    title: boltStepStatus || step.title,
    rawTitle: step.title,
  });
  const t0 = Date.now();
  if (isFinalStep(step.type) && !step.duplicate) {
    await touch(tid, { status: "synthesizing" });
  const boltSynthStatus = await generateActionStatus({
    action: "формулирую итоговый ответ",
    question: turn.question,
  });
  if (boltSynthStatus) {
    await recorder.event("status", { text: boltSynthStatus });
  }
    return { status: "synthesizing", currentStep: idx, plan, findings };
  }
  if (step.type === "reason" && !step.duplicate) {
    return await runReasonChunk({
      tid,
      turn,
      step,
      ctx: {
        agent,
        conv,
        history,
        question: turn.question,
        findings,
        recorder,
        stepIndex: idx,
      },
      idx,
      t0,
    });
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
    await touch(tid, {
      currentStep: idx + 1,
      findings,
      status: "executing",
    });
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
        recorder,
        checkpoint: conv.checkpoint ?? null,
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
const REASON_CHUNK_TOKENS = 700;
const REASON_PERSIST_MS = 6e3;
const SOFT_DEADLINE_MS = 25e3;
async function runReasonChunk({ tid, turn, step, ctx, idx, t0 }) {
  const { agent, conv, history, question, findings, recorder } = ctx;
  const findingsText = findings.length
    ? `Находки предыдущих шагов:
${findings.map((f, i) => `${i + 1}. (${f.type}) ${f.title}: ${f.text}`).join("\n")}`
    : "Находок пока нет.";
  const task = String(step.params?.task ?? step.title ?? "проанализируй вопрос");
  const base = await buildLlmMessages(
    agent,
    historyWithoutTurnQuestion(history, question),
    { checkpoint: ctx.conv?.checkpoint ?? null },
  );
  const acc = turn.stepText ?? "";
  base.push({
    role: "user",
    content: acc
      ? [
          "Ты — внутренний модуль анализа AI-агента. Это служебный шаг хода, не диалог с пользователем: не приветствуй и не обращайся к пользователю.",
          `Вопрос пользователя: ${question}`,
          `Подзадача шага: ${task}`,
          findingsText,
          "Ты уже начал писать результат анализа, но текст оборвался. Ниже — конец уже написанного. Продолжи РОВНО с места обрыва: не повторяй написанное, не начинай заново. Пиши сразу продолжение.",
          `Конец уже написанного текста:
…${acc.slice(-1500)}`,
        ].join("\n\n")
      : [
          "Ты — внутренний модуль анализа AI-агента. Это служебный шаг хода, не диалог с пользователем: не приветствуй и не обращайся к пользователю.",
          `Вопрос пользователя: ${question}`,
          `Подзадача шага: ${task}`,
          findingsText,
          "Верни РЕЗУЛЬТАТ анализа: выводы, факты, числа. Он пойдёт планировщику и финальному ответу.",
        ].join("\n\n"),
  });
  const model = await resolveAnswerModel();
  let lastPersist = Date.now();
  let pendingReasoning = "";
  let pendingContent = "";
  let finish = null;
  let grew = 0;
  const flushEvents = async (force = false) => {
    if (pendingReasoning && (force || pendingReasoning.length >= 350)) {
      await recorder.event("reasoning", { text: pendingReasoning });
      pendingReasoning = "";
    }
    if (pendingContent && (force || pendingContent.length >= 300)) {
      await recorder.event("content", { text: pendingContent });
      pendingContent = "";
    }
  };
  let accReason = acc;
  let deadlineHit = false;
  try {
    for await (const ev of streamChat(base, {
      model,
      maxTokens: REASON_CHUNK_TOKENS,
    })) {
      if (Date.now() - t0 > SOFT_DEADLINE_MS) {
        deadlineHit = true;
        break;
      }
      if (ev.reasoning) {
        pendingReasoning += ev.reasoning;
        accReason += ev.reasoning;
      }
      if (ev.delta) {
        accReason += ev.delta;
        grew += ev.delta.length;
        pendingContent += ev.delta;
      }
      if (ev.finish) finish = ev.finish;
      if (
        pendingReasoning.length >= 350 ||
        pendingContent.length >= 300 ||
        Date.now() - lastPersist >= REASON_PERSIST_MS
      )
        await flushEvents();
    }
    await flushEvents(true);
  } catch (e) {
    try {
      await flushEvents(true);
    } catch (_) {}
  }
  await touch(tid, { stepText: accReason });
  if (deadlineHit || finish === "length") {
    return {
      status: "executing",
      currentStep: idx,
      stepResult: {
        index: idx,
        type: "reason",
        title: step.title,
        ok: true,
        partial: true,
        appended: grew,
        ms: Date.now() - t0,
      },
    };
  }
  if (!accReason) {
    const attempts = (turn.stepAttempts ?? 0) + 1;
    if (attempts < 4) {
      await touch(tid, { stepAttempts: attempts });
      return {
        status: "executing",
        currentStep: idx,
        stepResult: {
          index: idx,
          type: "reason",
          ok: false,
          partial: true,
          retry: true,
          attempts,
        },
      };
    }
    findings.push({
      index: idx,
      type: step.type,
      title: step.title,
      ok: false,
      ms: Date.now() - t0,
      text: "Шаг reason не дал результата за 4 попытки — продолжено без него.",
    });
    await recorder.event("step_done", {
      index: idx,
      type: step.type,
      title: step.title,
      ok: false,
      ms: Date.now() - t0,
    });
    await touch(tid, {
      currentStep: idx + 1,
      findings,
      stepText: "",
      stepDone: false,
      stepAttempts: 0,
    });
    return {
      status: "executing",
      currentStep: idx + 1,
      stepResult: {
        index: idx,
        type: step.type,
        ok: false,
        ms: Date.now() - t0,
      },
    };
  }
  findings.push({
    index: idx,
    type: step.type,
    title: step.title,
    ok: true,
    ms: Date.now() - t0,
    text: accReason.slice(0, 2e3),
  });
  await recorder.event("step_done", {
    index: idx,
    type: step.type,
    title: step.title,
    ok: true,
    ms: Date.now() - t0,
  });
  await touch(tid, {
    currentStep: idx + 1,
    findings,
    stepText: "",
    stepDone: true,
    stepAttempts: 0,
  });
  return {
    status: "executing",
    currentStep: idx + 1,
    stepResult: {
      index: idx,
      type: step.type,
      title: step.title,
      ok: true,
      ms: Date.now() - t0,
    },
  };
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
const SYNTH_CHUNK_TOKENS = 1800;
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
      reasoningText: turn.stepText ?? null,
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
  const boltSynthStatus = await generateActionStatus({
    action: "формулирую итоговый ответ",
    question: turn.question,
  });
  if (boltSynthStatus) {
    await recorder.event("status", { text: boltSynthStatus });
  }
  const base = await buildLlmMessages(
    agent,
    historyWithoutTurnQuestion(history, turn.question),
    { checkpoint: conv?.checkpoint ?? null },
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
  let acc = turn.answerText ?? "";
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
  let accReasoning = turn.stepText ?? "";
  let finish = null;
  let grew = 0;
  const persist = async () => {
    await touch(tid, { answerText: acc, stepText: accReasoning });
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
  let deadlineHit = false;
  try {
    for await (const ev of streamChat(base, {
      model,
      maxTokens: SYNTH_CHUNK_TOKENS,
    })) {
      if (Date.now() - t0 > SOFT_DEADLINE_MS) {
        deadlineHit = true;
        break;
      }
      if (ev.reasoning) {
        pendingReasoning += ev.reasoning;
        accReasoning += ev.reasoning;
      }
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
      reasoningText: accReasoning || null,
      error: errMsg,
    });
    await recorder.event("error", { message: errMsg });
    try {
      await finishTurn(conv, "[ошибка: ответ не получен]", meta);
    } catch (_) {}
    await touch(tid, { status: "error", error: errMsg });
    return { status: "error", error: errMsg };
  }
  if (deadlineHit && finish !== "stop") {
    return {
      status: "synthesizing",
      partial: true,
      appended: grew,
      totalChars: acc.length,
    };
  }
  if (!acc.trim() && accReasoning && !deadlineHit && (turn.stepAttempts ?? 0) < 3) {
    await touch(tid, { stepAttempts: (turn.stepAttempts ?? 0) + 1 });
    return {
      status: "synthesizing",
      partial: true,
      appended: 0,
      totalChars: 0,
    };
  }
  if (finish === "stop" || finish == null || acc.trim()) {
    const meta = buildMeta({
      started,
      model,
      steps: findings.map((f) => ({
        type: f.type,
        title: f.title,
        ms: f.ms,
        ok: f.ok,
      })),
      reasoningText: accReasoning || null,
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
