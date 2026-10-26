// Раннер конечного автомата хода (Ф1.4). Состояние хода живёт в таблице turns,
// каждый шаг = отдельный вызов эндпоинта = свежий изолят (сброс memory/времени).
// Статусы: executing -> synthesizing -> done | error | stopped.
// Возобновление: клиент делает getTurn и продолжает runTurnStep с currentStep.
import { db } from 'sdk';
import { eq, and, desc } from 'sdk/db';
import { turns, files } from '../../schema.js';
import { REASONING_LEVELS, MAX_MESSAGE_CHARS } from '../config.js';
import { sanitizeTurnId, createRecorder, cleanupConversationTurns } from '../turnEvents.js';
import { prepareTurn, getHistory, finishTurn, buildMeta, getConversationById } from '../chat.js';
import { getAgentOrDefault } from '../agents.js';
import { planTurn, heuristicPlan, needsPlanner, planKey, EFFORT_CAP } from './pipeline.js';
import { EXECUTORS, hasExecutor, isFinalStep, compressFinding } from './executors.js';

const TERMINAL = ['done', 'error', 'stopped'];

function genTurnId() {
  return sanitizeTurnId(`a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)
    ?? `a-${Date.now().toString(36)}x`;
}

function lastUserImages(history) {
  const lastUser = [...(history ?? [])].reverse().find((m) => m.role === 'user');
  return (lastUser?.attachments ?? []).filter((a) => {
    const mime = String(a.mime ?? '').toLowerCase();
    return mime.startsWith('image/') && mime !== 'image/svg+xml';
  });
}

async function touch(turnId, patch) {
  await db.update(turns).set({ ...patch, updatedAt: new Date() }).where(eq(turns.turnId, turnId));
}

async function loadOwnedTurn(turnId, tgId) {
  const row = await db.select().from(turns).where(eq(turns.turnId, turnId)).get();
  if (!row || row.tgId !== tgId) return null;
  return row;
}

// ── startTurn: создать ход, спланировать, вернуть план ─────────────────────
export async function startTurn({ tgUser, agentId, text, reasoning, conversationId, attachmentIds }) {
  if ((!text || !String(text).trim()) && !(attachmentIds && attachmentIds.length)) {
    const e = new Error('Пустое сообщение'); e.code = 'EMPTY_MESSAGE'; throw e;
  }
  if (String(text ?? '').length > MAX_MESSAGE_CHARS) {
    const e = new Error(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`); e.code = 'TOO_LONG'; throw e;
  }
  const level = REASONING_LEVELS.includes(reasoning) ? reasoning : undefined;

  // prepareTurn: юзер/агент/диалог + запись user-сообщения + история
  const prepared = await prepareTurn({
    tgUser, agentId, text, reasoning: level, conversationId, attachments: attachmentIds ? await resolveAttachments(tgUser.id, attachmentIds) : null,
  });
  const { agent, conv, history } = prepared;
  const question = String(text ?? '').trim() || (attachmentIds?.length ? 'изображение' : '');
  const images = lastUserImages(history);
  const hasImages = images.length > 0;
  const effort = conv.reasoning ?? 'fast';

  const turnId = genTurnId();
  const recorder = createRecorder({ turnId, conversationId: conv.id, tgId: conv.tgId });
  await cleanupConversationTurns(conv.id, turnId);
  await recorder.event('start', { model: null, reasoning: effort, agentId: agent.id, agentName: agent.name, pipeline: true });

  let plan;
  let planMeta = { ok: true, repaired: false, model: null, latencyMs: 0 };
  if (needsPlanner(effort)) {
    const res = await planTurn({ question, history, effort, hasImages });
    plan = res.steps;
    planMeta = { ok: res.ok, repaired: res.repaired, model: res.model, latencyMs: res.latencyMs, error: res.error ?? null };
  } else {
    plan = heuristicPlan({ reasoning: effort, hasImages });
  }
  if (!plan.length) plan = heuristicPlan({ reasoning: 'medium', hasImages });

  const [row] = await db.insert(turns).values({
    turnId,
    conversationId: conv.id,
    tgId: conv.tgId,
    agentId: agent.id,
    status: 'executing',
    question,
    plan: plan.map((s) => ({ type: s.type, title: s.title, params: s.params, key: s.key, duplicate: s.duplicate })),
    currentStep: 0,
    findings: [],
    reasoningLevel: effort,
  }).returning();

  await recorder.event('plan', { steps: plan.map((s) => ({ type: s.type, title: s.title })), ...planMeta });

  return {
    turnId: row.turnId,
    conversationId: conv.id,
    agentId: agent.id,
    agentName: agent.name,
    status: row.status,
    plan: row.plan,
    planMeta,
    reasoning: effort,
  };
}

async function resolveAttachments(tgId, ids) {
  const out = [];
  for (const fid of ids.slice(0, 4).map(Number).filter(Boolean)) {
    const row = await db.select().from(files).where(eq(files.id, fid)).get();
    if (!row || row.tgId !== tgId) {
      const e = new Error('Вложение не найдено'); e.code = 'FILE_NOT_FOUND'; throw e;
    }
    out.push({ fileId: row.id, name: row.name, mime: row.mime, size: row.size });
  }
  return out;
}

// ── runTurnStep: исполнить ОДИН следующий шаг → находка → advance ──────────
export async function runTurnStep({ turnId, tgId }) {
  const tid = sanitizeTurnId(turnId);
  if (!tid) { const e = new Error('Некорректный turnId'); e.code = 'BAD_TURN'; throw e; }
  const turn = await loadOwnedTurn(tid, tgId);
  if (!turn) { const e = new Error('Ход не найден'); e.code = 'TURN_NOT_FOUND'; throw e; }
  if (TERMINAL.includes(turn.status) || turn.status === 'synthesizing') {
    return { status: turn.status, currentStep: turn.currentStep, plan: turn.plan, findings: turn.findings };
  }

  const plan = Array.isArray(turn.plan) ? turn.plan : [];
  const idx = Number(turn.currentStep ?? 0);
  const conv = await getConversationById(turn.conversationId, tgId);
  if (!conv) { const e = new Error('Диалог не найден'); e.code = 'CONV_NOT_FOUND'; throw e; }
  const agent = getAgentOrDefault(turn.agentId);
  const history = await getHistory(conv.id);
  const recorder = createRecorder({ turnId: tid, conversationId: conv.id, tgId });
  const findings = Array.isArray(turn.findings) ? [...turn.findings] : [];

  const step = plan[idx];
  if (!step) {
    // шагов не осталось — к синтезу
    await touch(tid, { status: 'synthesizing' });
    return { status: 'synthesizing', currentStep: idx, plan, findings };
  }

  await recorder.event('step_start', { index: idx, type: step.type, title: step.title });
  const t0 = Date.now();

  // Дубль не исполняем — планировщик пометил; пропускаем как находку.
  if (step.duplicate) {
    findings.push({ index: idx, type: step.type, title: step.title, ok: true, ms: 0, text: 'Шаг с таким же запросом уже выполнялся ранее — пропущен.' });
    await recorder.event('step_done', { index: idx, type: step.type, title: step.title, ok: true, duplicate: true, ms: 0 });
    await touch(tid, { currentStep: idx + 1, findings });
    return { status: 'executing', currentStep: idx + 1, stepResult: { index: idx, type: step.type, title: step.title, ok: true, duplicate: true, ms: 0 } };
  }

  if (!hasExecutor(step.type)) {
    findings.push({ index: idx, type: step.type, title: step.title, ok: false, ms: 0, text: `Неизвестный тип шага «${step.type}» — пропущен.` });
    await recorder.event('step_done', { index: idx, type: step.type, title: step.title, ok: false, ms: 0 });
    await touch(tid, { currentStep: idx + 1, findings });
    return { status: 'executing', currentStep: idx + 1, stepResult: { index: idx, type: step.type, ok: false } };
  }

  const ctx = {
    agent, conv, history, question: turn.question,
    findings, reasoning: turn.reasoningLevel ?? conv.reasoning ?? 'fast',
    recorder, stepIndex: idx,
  };

  try {
    const result = await EXECUTORS[step.type](step, ctx);
    const ms = Date.now() - t0;

    // Гонка со «Стоп»: пока шаг исполнялся, ход могли остановить —
    // тогда не пишем ответ и не трогаем статус (резюме уже в чате).
    const fresh = await db.select().from(turns).where(eq(turns.turnId, tid)).get();
    if (fresh && fresh.status === 'stopped') {
      return { status: 'stopped', currentStep: idx, stepResult: { index: idx, type: step.type, ok: false, stopped: true } };
    }

    // Финальный шаг: ответ пишется в чат, ход завершается.
    if (isFinalStep(step.type)) {
      const meta = buildMeta({
        started: t0,
        model: result.stream?.model ?? null,
        usage: result.stream?.usage ?? null,
        reasoning: turn.reasoningLevel,
        steps: stepsMeta(findings, { type: step.type, title: step.title, ms, ok: true }),
        skills: result.stream?.skills ?? [],
        reasoningText: result.stream?.reasoningText ?? null,
      });
      const message = await finishTurn(conv, (result.content ?? '').trim() || '[пустой ответ]', meta);
      await recorder.event('done', { messageId: message.id, content: message.content, meta });
      await touch(tid, { status: 'done', currentStep: idx + 1, findings: stepsMeta(findings, { type: step.type, title: step.title, ms, ok: true }) });
      return { status: 'done', message: { id: message.id, content: message.content, meta }, stepResult: { index: idx, type: step.type, ok: true, ms } };
    }

    // Обычный шаг: находка (сжатие ≤2000) → advance → re-plan.
    let findingText;
    let eventPayload = null;
    if (result.finding !== null && result.finding !== undefined) {
      findingText = result.finding;
      eventPayload = result.event ?? null;
    } else {
      findingText = await compressFinding(result.raw ?? '');
    }
    const ok = true;
    findings.push({ index: idx, type: step.type, title: step.title, ok, ms, text: findingText });
    await recorder.event('step_done', { index: idx, type: step.type, title: step.title, ok, ms });
    if (eventPayload) await recorder.event(step.type, eventPayload);

    // Re-plan: планировщик видит находки и достраивает/объявляет готовность.
    let updatedPlan = plan;
    let replanned = false;
    if (needsPlanner(turn.reasoningLevel ?? 'medium')) {
      const rp = await planTurn({
        question: turn.question, history, effort: turn.reasoningLevel ?? 'medium',
        hasImages: lastUserImages(history).length > 0,
        priorSteps: plan.map((s, i) => ({ ...s, executed: i <= idx })),
        findings: findings.map((f) => ({ type: f.type, title: f.title, text: f.text })),
        executedKeys: findings.map((f) => planKey({ type: f.type, params: keyParams(plan[f.index]) })),
      });
      if (rp.ok && rp.steps.length) {
        const cap = (EFFORT_CAP[turn.reasoningLevel] ?? 5) + 1;
        const insertion = rp.steps
          .filter((s) => s.type !== 'synthesize')
          .filter((s) => !plan.some((p, i) => i > idx && planKey(p) === s.key))
          .slice(0, Math.max(0, cap - plan.length));
        if (insertion.length) {
          const next = [...plan];
          const lastFinal = next.length && isFinalStep(next[next.length - 1].type) ? 1 : 0;
          const at = next.length - lastFinal;
          next.splice(at, 0, ...insertion.map((s) => ({ type: s.type, title: s.title, params: s.params, key: s.key, duplicate: s.duplicate })));
          updatedPlan = next;
        }
        replanned = insertion.length > 0;
      }
    }

    await touch(tid, { currentStep: idx + 1, findings, plan: updatedPlan, status: 'executing' });
    if (replanned) await recorder.event('plan_update', { steps: updatedPlan.map((s) => ({ type: s.type, title: s.title })) });
    return {
      status: 'executing',
      currentStep: idx + 1,
      stepResult: { index: idx, type: step.type, title: step.title, ok, ms, finding: findingText },
      plan: updatedPlan,
    };
  } catch (e) {
    const ms = Date.now() - t0;
    const errMsg = String(e?.message ?? e).slice(0, 300);
    if (isFinalStep(step.type)) {
      // финальный шаг упал — ход в ошибку (как текущий runTurn)
      const meta = buildMeta({ started: t0, reasoning: turn.reasoningLevel, steps: stepsMeta(findings, { type: step.type, title: step.title, ms, ok: false }), error: errMsg });
      await recorder.event('error', { message: errMsg });
      try { await finishTurn(conv, '[ошибка: ответ не получен]', meta); } catch (_) {}
      await touch(tid, { status: 'error', error: errMsg, findings: stepsMeta(findings, { type: step.type, title: step.title, ms, ok: false }) });
      return { status: 'error', error: errMsg, stepResult: { index: idx, type: step.type, ok: false, ms } };
    }
    // Отказ инструмента изолируется: находка «не сработал» → ход продолжается.
    findings.push({ index: idx, type: step.type, title: step.title, ok: false, ms, text: `Инструмент «${step.type}» не сработал: ${errMsg}` });
    await recorder.event('step_done', { index: idx, type: step.type, title: step.title, ok: false, ms, error: errMsg });
    await touch(tid, { currentStep: idx + 1, findings });
    return { status: 'executing', currentStep: idx + 1, stepResult: { index: idx, type: step.type, ok: false, ms, error: errMsg } };
  }
}

function keyParams(stepRow) {
  return stepRow?.params ?? {};
}

function stepsMeta(findings, finalStep) {
  return [...findings.map((f) => ({ type: f.type, title: f.title, ms: f.ms, ok: f.ok, finding: String(f.text ?? '').slice(0, 800) })), finalStep];
}

// ── finishTurn: синтез → запись assistant-сообщения в чат ──────────────────
export async function finishTurnSynthesis({ turnId, tgId }) {
  const tid = sanitizeTurnId(turnId);
  if (!tid) { const e = new Error('Некорректный turnId'); e.code = 'BAD_TURN'; throw e; }
  const turn = await loadOwnedTurn(tid, tgId);
  if (!turn) { const e = new Error('Ход не найден'); e.code = 'TURN_NOT_FOUND'; throw e; }
  if (turn.status === 'done') return { status: 'done', already: true };
  if (turn.status === 'stopped') return { status: 'stopped' };
  if (turn.status === 'error') return { status: 'error', error: turn.error };

  const conv = await getConversationById(turn.conversationId, tgId);
  if (!conv) { const e = new Error('Диалог не найден'); e.code = 'CONV_NOT_FOUND'; throw e; }
  const agent = getAgentOrDefault(turn.agentId);
  const history = await getHistory(conv.id);
  const recorder = createRecorder({ turnId: tid, conversationId: conv.id, tgId });
  const findings = Array.isArray(turn.findings) ? turn.findings : [];

  await touch(tid, { status: 'synthesizing' });
  const step = { type: 'synthesize', title: 'Финальный ответ', params: {} };
  const ctx = {
    agent, conv, history, question: turn.question,
    findings, reasoning: turn.reasoningLevel ?? conv.reasoning ?? 'fast',
    recorder, stepIndex: findings.length,
  };
  const t0 = Date.now();
  try {
    const result = await EXECUTORS.synthesize(step, ctx);
    const meta = buildMeta({
      started: t0,
      model: result.stream?.model ?? null,
      usage: result.stream?.usage ?? null,
      reasoning: turn.reasoningLevel,
      steps: stepsMeta(findings, { type: 'synthesize', title: step.title, ms: Date.now() - t0, ok: true }),
      skills: result.stream?.skills ?? [],
      reasoningText: result.stream?.reasoningText ?? null,
    });
    const message = await finishTurn(conv, (result.content ?? '').trim() || '[пустой ответ]', meta);
    await recorder.event('done', { messageId: message.id, content: message.content, meta });
    await touch(tid, { status: 'done', currentStep: findings.length + 1 });
    return { status: 'done', message: { id: message.id, content: message.content, meta } };
  } catch (e) {
    const errMsg = String(e?.message ?? e).slice(0, 300);
    const meta = buildMeta({ started: t0, reasoning: turn.reasoningLevel, steps: stepsMeta(findings, { type: 'synthesize', title: step.title, ms: Date.now() - t0, ok: false }), error: errMsg });
    await recorder.event('error', { message: errMsg });
    try { await finishTurn(conv, '[ошибка: ответ не получен]', meta); } catch (_) {}
    await touch(tid, { status: 'error', error: errMsg });
    return { status: 'error', error: errMsg };
  }
}

// ── stopTurn: кнопка «Стоп» → статус stopped + резюме в чат ────────────────
export async function stopTurn({ turnId, tgId }) {
  const tid = sanitizeTurnId(turnId);
  if (!tid) { const e = new Error('Некорректный turnId'); e.code = 'BAD_TURN'; throw e; }
  const turn = await loadOwnedTurn(tid, tgId);
  if (!turn) { const e = new Error('Ход не найден'); e.code = 'TURN_NOT_FOUND'; throw e; }
  if (TERMINAL.includes(turn.status)) return { status: turn.status };

  const conv = await getConversationById(turn.conversationId, tgId);
  const findings = Array.isArray(turn.findings) ? turn.findings : [];
  const done = findings.filter((f) => f.ok);
  const failed = findings.filter((f) => !f.ok);
  const lines = ['⏹ Ход остановлен.'];
  if (findings.length) {
    lines.push(`Шагов выполнено: ${done.length}${failed.length ? `, не удалось: ${failed.length}` : ''}.`);
    lines.push(...done.slice(0, 6).map((f) => `• ${f.title || f.type}`));
    if (failed.length) lines.push(...failed.slice(0, 3).map((f) => `✕ ${f.title || f.type}`));
    if (done.some((f) => f.text)) {
      lines.push('');
      lines.push('Найдено к моменту остановки:');
      for (const f of done.filter((x) => x.text).slice(0, 4)) lines.push(`— ${String(f.text).slice(0, 300)}`);
    }
  } else {
    lines.push('Ход остановлен до завершения шагов.');
  }
  if (conv) {
    try {
      await finishTurn(conv, lines.join('\n'), buildMeta({
        started: Date.now(),
        reasoning: turn.reasoningLevel,
        steps: findings.map((f) => ({ type: f.type, title: f.title, ms: f.ms, ok: f.ok })),
        error: 'stopped by user',
      }));
    } catch (_) {}
  }
  await touch(tid, { status: 'stopped' });
  const recorder = createRecorder({ turnId: tid, conversationId: turn.conversationId, tgId });
  await recorder.event('stop', { steps: done.length });
  return { status: 'stopped', stepsDone: done.length, summary: lines.join('\n') };
}

// ── getTurn: состояние для возобновления ───────────────────────────────────
export async function getTurn({ turnId, conversationId, tgId }) {
  if (turnId) {
    const row = await loadOwnedTurn(sanitizeTurnId(turnId) ?? '', tgId);
    return row ? turnView(row) : null;
  }
  // последний активный ход диалога (для баннера возобновления)
  const rows = await db.select().from(turns)
    .where(and(eq(turns.conversationId, Number(conversationId) || 0), eq(turns.tgId, tgId)))
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
    reasoningLevel: row.reasoningLevel,
    error: row.error,
    createdAt: row.createdAt,
  };
}
