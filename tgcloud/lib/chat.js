import { db } from 'sdk';
import { eq, and, desc, gt } from 'sdk/db';
import { users, conversations, messages, files } from '../schema.js';
import { getAgentOrDefault } from './agents.js';
import { skillsToolFor, getSkill, skillsForAgent } from './skills/index.js';
import {
  MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS, REASONING_LEVELS,
  MAX_IMAGES_PER_REQUEST, MAX_IMAGE_BYTES, VISION_READER_PROMPT,
} from './config.js';
import { completeChat, streamChat, pickMainModel, getDefaultModel, getVisionModel } from './nvidia.js';
import { readFileBytes, bytesToBase64 } from './files.js';
import { createRecorder, sanitizeTurnId, cleanupConversationTurns } from './turnEvents.js';

export async function ensureUser(tgUser) {
  if (!tgUser || !tgUser.id) throw new Error('Нет пользователя Telegram');
  const existing = await db.select().from(users).where(eq(users.tgId, tgUser.id)).get();
  const now = new Date();
  if (existing) {
    const patch = { lastSeenAt: now };
    if (tgUser.first_name && tgUser.first_name !== existing.name) patch.name = tgUser.first_name;
    if (tgUser.username && tgUser.username !== existing.username) patch.username = tgUser.username;
    await db.update(users).set(patch).where(eq(users.id, existing.id));
    return { ...existing, ...patch };
  }
  const [row] = await db.insert(users).values({
    tgId: tgUser.id,
    name: tgUser.first_name ?? null,
    username: tgUser.username ?? null,
    agentId: 'chat',
    lastSeenAt: now,
  }).returning();
  return row;
}

export async function setAgent(tgId, agentId) {
  await db.update(users).set({ agentId }).where(eq(users.tgId, tgId));
}

export async function latestConversation(userRow, agentId) {
  const conds = [eq(conversations.tgId, userRow.tgId)];
  if (agentId) conds.push(eq(conversations.agentId, agentId));
  return db.select().from(conversations)
    .where(and(...conds))
    .orderBy(desc(conversations.updatedAt))
    .limit(1)
    .get();
}

export async function createConversation(userRow, agentId, title = null) {
  const [conv] = await db.insert(conversations).values({
    userId: userRow.id,
    tgId: userRow.tgId,
    agentId,
    title,
  }).returning();
  return conv;
}

export async function ensureConversation(userRow, agentId) {
  const existing = await latestConversation(userRow, agentId);
  return existing ?? createConversation(userRow, agentId);
}

export async function getConversationById(convId, tgId) {
  const conv = await db.select().from(conversations).where(eq(conversations.id, convId)).get();
  if (!conv || conv.tgId !== tgId) return null;
  return conv;
}

export async function appendMessage(conv, role, content, meta = null, attachments = null) {
  const [m] = await db.insert(messages).values({
    conversationId: conv.id,
    role,
    content,
    agentId: conv.agentId,
    ...(meta ? { meta } : {}),
    ...(attachments ? { attachments } : {}),
  }).returning();
  const patch = { updatedAt: new Date() };
  if (role === 'user' && (!conv.title || conv.title === 'Новый диалог')) patch.title = content.slice(0, 80);
  await db.update(conversations).set(patch).where(eq(conversations.id, conv.id));
  return m;
}

export async function setConversationReasoning(convId, reasoning) {
  await db.update(conversations).set({ reasoning }).where(eq(conversations.id, convId));
}

export async function getHistory(convId, limit = MAX_HISTORY_MESSAGES) {
  const rows = await db.select().from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(desc(messages.id))
    .limit(limit)
    .all();
  return rows.reverse();
}

// ── Vision-шаг агента: отдельное чтение изображений моделью-«зрителем» ──────
// Картинка НЕ скармливается основной модели. Ход агента явно делает шаг:
// ридер (settings.VISION_MODEL) описывает изображение, описание показывается
// в трассе и сохраняется в attachments сообщения — последующие ходы агента
// видят его как текстовый контекст, не перечитывая пиксели.
function collectImages(historyRows) {
  const lastUser = [...historyRows].reverse().find((r) => r.role === 'user');
  if (!lastUser) return { lastUserId: null, images: [] };
  const images = [];
  for (const att of lastUser.attachments ?? []) {
    if (images.length >= MAX_IMAGES_PER_REQUEST) break;
    const mime = String(att.mime ?? '').toLowerCase();
    if (!mime.startsWith('image/') || mime === 'image/svg+xml') continue;
    images.push(att); // ссылка на объект истории: vision попадёт в контекст этого же хода
  }
  return { lastUserId: lastUser.id, images };
}

async function describeImage(img) {
  const row = await db.select().from(files).where(eq(files.id, img.fileId)).get();
  if (!row || (row.size ?? 0) > MAX_IMAGE_BYTES) {
    throw new Error('Изображение слишком большое для анализа (максимум 3 МБ). Сожмите картинку и отправьте снова.');
  }
  const bytes = await readFileBytes(row);
  if (!bytes || !bytes.length || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error('Файл изображения недоступен');
  }
  const url = `data:${row.mime};base64,${bytesToBase64(bytes)}`;
  const reader = await getVisionModel();
  const r = await completeChat(
    [
      { role: 'system', content: VISION_READER_PROMPT },
      { role: 'user', content: [
        { type: 'text', text: 'Прочитай изображение и дай описание.' },
        { type: 'image_url', image_url: { url } },
      ] },
    ],
    { model: reader, reasoning: 'fast', temperature: 0.2, maxTokens: 1024 },
  );
  const desc = (r.content ?? '').trim();
  if (!desc) throw new Error('Vision-модель вернула пустое описание');
  return desc;
}

// Читает изображения последнего сообщения (уже описанные — берёт из кэша),
// сохраняет описания в attachments сообщения. Бросает ошибку при неудаче чтения.
export async function runVisionStep({ history, recorder, out }) {
  const { lastUserId, images } = collectImages(history);
  if (!images.length) return history;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const t0 = Date.now();
    let desc = img.vision ?? null;
    const cached = Boolean(desc);
    if (!desc) desc = await describeImage(img);
    out.steps.push({ type: 'image_read', name: img.name, ms: Date.now() - t0, desc: desc.slice(0, 800) });
    if (recorder) {
      await recorder.event('image', { index: i, name: img.name, description: desc, cached });
    }
    img.vision = desc;
  }
  // Persist: последующие ходы используют описания как контекст.
  const lastRow = history.find((r) => r.id === lastUserId);
  await db.update(messages).set({ attachments: lastRow.attachments ?? [] }).where(eq(messages.id, lastUserId));
  return history;
}

function messageTextForModel(row) {
  const atts = row.attachments ?? [];
  let text = row.content ?? '';
  if (atts.length && text && atts.some((a) => a.name === text)) text = ''; // имя файла вместо текста
  const fileNotes = atts
    .filter((a) => !String(a.mime ?? '').toLowerCase().startsWith('image/'))
    .map((a) => `(пользователь приложил файл: ${a.name}, ${a.mime})`);
  const visionNotes = atts
    .filter((a) => a.vision)
    .map((a) => `Результат vision-анализа изображения «${a.name}»:\n${a.vision}`);
  const parts = [text, ...fileNotes, ...visionNotes].filter(Boolean);
  if (parts.length) return parts.join('\n\n');
  return atts.some((a) => String(a.mime ?? '').toLowerCase().startsWith('image/')) ? '(изображение приложено)' : '';
}

export function buildLlmMessages(agent, history) {
  const sysParts = [agent.systemPrompt];
  const skills = skillsForAgent(agent.id);
  if (skills.length) {
    sysParts.push(
      'Инструмент read_skill даёт доступ к подробным навыкам. Если запрос пользователя попадает в тематику любого навыка из списка ниже — ОБЯЗАТЕЛЬНО сначала вызови read_skill с его id, прочитай содержимое и строй ответ на его основе. Не вызывай навык только для приветствий и совсем коротких вопросов.',
      skills.map((s) => `- ${s.id}: ${s.name} — ${s.when}`).join('\n'),
    );
  }
  const out = [{ role: 'system', content: sysParts.join('\n\n') }];
  for (const m of history) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    out.push({ role: m.role, content: messageTextForModel(m) });
  }
  return out;
}

export async function prepareTurn({ tgUser, agentId, text, reasoning, conversationId, attachments }) {
  if ((!text || !text.trim()) && !(attachments && attachments.length)) throw new Error('Пустое сообщение');
  const clean = (text ?? '').trim();
  if (clean.length > MAX_MESSAGE_CHARS) {
    throw new Error(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`);
  }
  const userRow = await ensureUser(tgUser);
  const agent = getAgentOrDefault(agentId ?? userRow.agentId);
  let conv = null;
  if (conversationId) {
    conv = await getConversationById(Number(conversationId), tgUser.id);
  }
  if (!conv) {
    conv = await ensureConversation(userRow, agent.id);
  }
  if (conv.agentId !== agent.id) {
    await db.update(conversations).set({ agentId: agent.id }).where(eq(conversations.id, conv.id));
    conv.agentId = agent.id;
  }
  if (reasoning && REASONING_LEVELS.includes(reasoning) && reasoning !== conv.reasoning) {
    await setConversationReasoning(conv.id, reasoning);
    conv.reasoning = reasoning;
  }
  const contentForDb = clean || (attachments && attachments.length ? attachments[0].name : '');
  await appendMessage(conv, 'user', contentForDb, null, attachments ?? null);
  const history = await getHistory(conv.id);
  const model = await pickMainModel({ reasoning: conv.reasoning, defaultModel: await getDefaultModel() });
  return { user: userRow, agent, conv, history, model };
}

export async function finishTurn(conv, replyText, meta = null) {
  return appendMessage(conv, 'assistant', replyText, meta);
}

export function buildMeta({ started, model, usage, reasoning, steps = [], skills = [], reasoningText = null, error = null }) {
  return {
    model: model ?? null,
    reasoning: reasoning ?? 'fast',
    latencyMs: Date.now() - started,
    tokens: usage
      ? {
          prompt: usage.prompt_tokens ?? null,
          completion: usage.completion_tokens ?? null,
          total: usage.total_tokens ?? null,
        }
      : null,
    skills,
    steps,
    reasoningText: reasoningText ? String(reasoningText).slice(0, 20000) : null,
    error: error ? String(error).slice(0, 400) : null,
  };
}

function extractReadSkill(toolCalls) {
  if (!Array.isArray(toolCalls)) return null;
  return toolCalls.find((c) => c?.function?.name === 'read_skill') ?? null;
}

// ── Стриминговый ход агента: дельты ответа/размышлений + цикл read_skill ─────
// recorder (turnEvents) опционален: Mini App передаёт recorder для realtime,
// бот-чат вызывает без него. Батчинг событий по символам — таймеров в рантайме нет.
async function* streamRounds({ agent, llmMessages, reasoning, model }, out, recorder = null) {
  const tool = skillsToolFor(agent);
  const msgs = [...llmMessages];
  let rounds = 0;
  let acc = '';
  const flushReasoning = (() => {
    let pending = '';
    return async (text, force = false) => {
      if (text) pending += text;
      if (recorder && pending && (force || pending.length >= 350)) {
        await recorder.event('reasoning', { text: pending });
        pending = '';
      }
    };
  })();
  const flushContent = (() => {
    let pending = '';
    return async (text, force = false) => {
      if (text) pending += text;
      if (recorder && pending && (force || pending.length >= 900)) {
        await recorder.event('content', { text: pending });
        pending = '';
      }
    };
  })();
  for (;;) {
    let roundAcc = '';
    let pendingCalls = null;
    for await (const ev of streamChat(msgs, { model, reasoning, tools: tool ? [tool] : undefined })) {
      if (ev.model && !out.model) out.model = ev.model;
      if (ev.usage) out.usage = ev.usage;
      if (ev.reasoning) {
        out.reasoningText = (out.reasoningText ?? '') + ev.reasoning;
        await flushReasoning(ev.reasoning);
        yield { type: 'reasoning', delta: ev.reasoning };
      }
      if (ev.delta) {
        acc += ev.delta;
        roundAcc += ev.delta;
        await flushContent(ev.delta);
        yield { type: 'delta', delta: ev.delta };
      }
      if (ev.toolCalls) pendingCalls = ev.toolCalls;
    }
    await flushReasoning('', true);
    await flushContent('', true);
    const call = extractReadSkill(pendingCalls);
    if (!call || rounds >= 2) {
      out.content = acc;
      return;
    }
    rounds += 1;
    let skillId = '';
    try { skillId = String(JSON.parse(call.function.arguments || '{}').skill ?? ''); } catch (_) {}
    const skill = getSkill(skillId);
    if (skill) out.skills.push({ id: skill.id, name: skill.name });
    out.steps.push({ type: 'skill_read', skill: skillId, ms: Date.now() - out.started });
    if (recorder) await recorder.event('skill', { id: skillId, name: skill?.name ?? skillId });
    yield { type: 'skill', id: skillId, name: skill?.name ?? skillId };
    msgs.push({
      role: 'assistant',
      ...(roundAcc ? { content: roundAcc } : {}),
      tool_calls: [{
        id: call.id ?? `call_${rounds}`,
        type: 'function',
        function: { name: 'read_skill', arguments: call.function.arguments ?? '{}' },
      }],
    });
    msgs.push({
      role: 'tool',
      tool_call_id: call.id ?? `call_${rounds}`,
      content: skill ? skill.content : `Навык «${skillId}» не найден. Отвечай без него, используя свои знания.`,
    });
  }
}

// Публичный API для handlers/message (бот-чат): без записи событий.
export async function* agentTurnStream({ agent, history, reasoning, model }, out) {
  await runVisionStep({ history, recorder: null, out });
  const llmMessages = buildLlmMessages(agent, history);
  yield* streamRounds({ agent, llmMessages, reasoning, model }, out, null);
}

async function finalizeTurn({ conv, agent, out, started, recorder, saved }) {
  const meta = buildMeta({
    started,
    model: out.model,
    usage: out.usage,
    reasoning: conv.reasoning,
    steps: out.steps,
    skills: out.skills,
    reasoningText: out.reasoningText,
  });
  const message = saved ?? await finishTurn(conv, (out.content ?? '').trim(), meta);
  if (recorder) {
    await recorder.event('done', {
      messageId: message.id,
      content: message.content,
      meta,
    });
  }
  return message;
}

// Единый ход для Mini App: vision-шаг → стрим ответа → события прогресса → done.
async function runTurn({ agent, conv, history, model }, turnId) {
  const started = Date.now();
  const out = { started, skills: [], steps: [], model: null, usage: null, reasoningText: null, content: null };
  const tid = sanitizeTurnId(turnId);
  const recorder = tid ? createRecorder({ turnId: tid, conversationId: conv.id, tgId: conv.tgId }) : null;
  if (recorder) {
    await cleanupConversationTurns(conv.id, tid);
    await recorder.event('start', { model, reasoning: conv.reasoning, agentId: agent.id, agentName: agent.name });
  }
  try {
    await runVisionStep({ history, recorder, out });
    const llmMessages = buildLlmMessages(agent, history);
    for await (const _ev of streamRounds({ agent, llmMessages, reasoning: conv.reasoning, model }, out, recorder)) { /* consume */ }
    const message = await finalizeTurn({ conv, agent, out, started, recorder });
    return { agent, conv, reply: message.content, meta: message.meta, message };
  } catch (e) {
    const meta = buildMeta({ started, reasoning: conv.reasoning, steps: out.steps, skills: out.skills, reasoningText: out.reasoningText, error: e?.message ?? String(e) });
    if (recorder) await recorder.event('error', { message: String(e?.message ?? e).slice(0, 400) });
    try { await finishTurn(conv, '[ошибка: ответ не получен]', meta); } catch (_) {}
    throw e;
  }
}

export async function completeTurn({ tgUser, agentId, text, reasoning, conversationId, attachments, turnId }) {
  const prepared = await prepareTurn({ tgUser, agentId, text, reasoning, conversationId, attachments });
  return runTurn(prepared, turnId);
}

async function lastUserMessage(convId) {
  return db.select().from(messages)
    .where(and(eq(messages.conversationId, convId), eq(messages.role, 'user')))
    .orderBy(desc(messages.id))
    .limit(1)
    .get();
}

export async function deleteMessagesAfter(convId, messageId) {
  await db.delete(messages).where(and(eq(messages.conversationId, convId), gt(messages.id, messageId)));
}

export async function regenerateTurn({ tgUser, conversationId, reasoning, turnId }) {
  const userRow = await ensureUser(tgUser);
  const conv = await getConversationById(Number(conversationId), tgUser.id);
  if (!conv) throw new Error('Диалог не найден');
  const lastUser = await lastUserMessage(conv.id);
  if (!lastUser) throw new Error('Нечего перегенерировать: в диалоге нет сообщений');
  await deleteMessagesAfter(conv.id, lastUser.id);
  if (reasoning && REASONING_LEVELS.includes(reasoning) && reasoning !== conv.reasoning) {
    await setConversationReasoning(conv.id, reasoning);
    conv.reasoning = reasoning;
  }
  const agent = getAgentOrDefault(conv.agentId);
  const history = await getHistory(conv.id);
  const model = await pickMainModel({ reasoning: conv.reasoning, defaultModel: await getDefaultModel() });
  return runTurn({ user: userRow, agent, conv, history, model }, turnId);
}
