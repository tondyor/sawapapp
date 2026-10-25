import { db } from 'sdk';
import { eq, and, desc, gt } from 'sdk/db';
import { users, conversations, messages } from '../schema.js';
import { getAgentOrDefault } from './agents.js';
import { skillsToolFor, getSkill, skillsForAgent } from './skills/index.js';
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS, REASONING_LEVELS } from './config.js';
import { completeChat, streamChat } from './nvidia.js';

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

export async function appendMessage(conv, role, content, meta = null) {
  const [m] = await db.insert(messages).values({
    conversationId: conv.id,
    role,
    content,
    agentId: conv.agentId,
    ...(meta ? { meta } : {}),
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

export function buildLlmMessages(agent, history) {
  const sysParts = [agent.systemPrompt];
  const skills = skillsForAgent(agent.id);
  if (skills.length) {
    sysParts.push(
      'Инструмент read_skill даёт доступ к подробным навыкам. Если запрос пользователя попадает в тематику любого навыка из списка ниже — ОБЯЗАТЕЛЬНО сначала вызови read_skill с его id, прочитай содержимое и строй ответ на его основе. Не вызывай навык только для приветствий и совсем коротких вопросов.',
      skills.map((s) => `- ${s.id}: ${s.name} — ${s.when}`).join('\n'),
    );
  }
  return [
    { role: 'system', content: sysParts.join('\n\n') },
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })),
  ];
}

export async function prepareTurn({ tgUser, agentId, text, reasoning, conversationId }) {
  if (!text || !text.trim()) throw new Error('Пустое сообщение');
  const clean = text.trim();
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
  await appendMessage(conv, 'user', clean);
  const history = await getHistory(conv.id);
  const llmMessages = buildLlmMessages(agent, history);
  return { user: userRow, agent, conv, llmMessages };
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

async function callWithSkills(agent, llmMessages, out, opts = {}) {
  const tool = skillsToolFor(agent);
  const msgs = [...llmMessages];
  let rounds = 0;
  for (;;) {
    const { content, reasoning, toolCalls, model, usage } = await completeChat(msgs, {
      reasoning: opts.reasoning,
      tools: tool ? [tool] : undefined,
    });
    if (model && !out.model) out.model = model;
    if (usage) out.usage = usage;
    if (reasoning) out.reasoningText = (out.reasoningText ?? '') + reasoning;
    const call = extractReadSkill(toolCalls);
    if (!call || rounds >= 2) {
      out.content = content;
      return;
    }
    rounds += 1;
    let skillId = '';
    try { skillId = String(JSON.parse(call.function.arguments || '{}').skill ?? ''); } catch (_) {}
    const skill = getSkill(skillId);
    msgs.push({
      role: 'assistant',
      ...(content ? { content } : {}),
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
    if (skill) out.skills.push({ id: skill.id, name: skill.name });
    out.steps.push({ type: 'skill_read', skill: skillId, ms: Date.now() - out.started });
  }
}

export async function* agentTurnStream({ agent, llmMessages, reasoning }, out) {
  const tool = skillsToolFor(agent);
  const msgs = [...llmMessages];
  let rounds = 0;
  let acc = '';
  for (;;) {
    let roundAcc = '';
    let pendingCalls = null;
    for await (const ev of streamChat(msgs, { reasoning, tools: tool ? [tool] : undefined })) {
      if (ev.model && !out.model) out.model = ev.model;
      if (ev.reasoning) {
        out.reasoningText = (out.reasoningText ?? '') + ev.reasoning;
        yield { type: 'reasoning', delta: ev.reasoning };
      }
      if (ev.delta) {
        acc += ev.delta;
        roundAcc += ev.delta;
        yield { type: 'delta', delta: ev.delta };
      }
      if (ev.toolCalls) pendingCalls = ev.toolCalls;
    }
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

export async function completeTurn({ tgUser, agentId, text, reasoning, conversationId }) {
  const { agent, conv, llmMessages } = await prepareTurn({ tgUser, agentId, text, reasoning, conversationId });
  const started = Date.now();
  const out = { started, skills: [], steps: [], model: null, usage: null, reasoningText: null, content: null };
  try {
    await callWithSkills(agent, llmMessages, out, { reasoning: conv.reasoning });
    const meta = buildMeta({
      started,
      model: out.model,
      usage: out.usage,
      reasoning: conv.reasoning,
      steps: out.steps,
      skills: out.skills,
      reasoningText: out.reasoningText,
    });
    const saved = await finishTurn(conv, (out.content ?? '').trim(), meta);
    return { agent, conv, reply: saved.content, meta };
  } catch (e) {
    const meta = buildMeta({ started, reasoning: conv.reasoning, steps: out.steps, skills: out.skills, error: e?.message ?? String(e) });
    try { await finishTurn(conv, '[ошибка: ответ не получен]', meta); } catch (_) {}
    throw e;
  }
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

export async function regenerateTurn({ tgUser, conversationId, reasoning }) {
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
  const llmMessages = buildLlmMessages(agent, history);
  const started = Date.now();
  const out = { started, skills: [], steps: [], model: null, usage: null, reasoningText: null, content: null };
  try {
    await callWithSkills(agent, llmMessages, out, { reasoning: conv.reasoning });
    const meta = buildMeta({
      started,
      model: out.model,
      usage: out.usage,
      reasoning: conv.reasoning,
      steps: out.steps,
      skills: out.skills,
      reasoningText: out.reasoningText,
    });
    const saved = await finishTurn(conv, (out.content ?? '').trim(), meta);
    return { agent, conv, reply: saved.content, meta };
  } catch (e) {
    const meta = buildMeta({ started, reasoning: conv.reasoning, steps: out.steps, skills: out.skills, error: e?.message ?? String(e) });
    try { await finishTurn(conv, '[ошибка: ответ не получен]', meta); } catch (_) {}
    throw e;
  }
}
