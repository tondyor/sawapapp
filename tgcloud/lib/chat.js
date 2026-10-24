import { db } from 'sdk';
import { eq, and, desc } from 'sdk/db';
import { users, conversations, messages } from '../schema.js';
import { getAgentOrDefault } from './agents.js';
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS } from './config.js';
import { completeChat } from './nvidia.js';

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

export async function appendMessage(conv, role, content) {
  const [m] = await db.insert(messages).values({
    conversationId: conv.id,
    role,
    content,
    agentId: conv.agentId,
  }).returning();
  const patch = { updatedAt: new Date() };
  if (role === 'user' && !conv.title) patch.title = content.slice(0, 80);
  await db.update(conversations).set(patch).where(eq(conversations.id, conv.id));
  return m;
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
  return [
    { role: 'system', content: agent.systemPrompt },
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })),
  ];
}

export async function prepareTurn({ tgUser, agentId, text }) {
  if (!text || !text.trim()) throw new Error('Пустое сообщение');
  const clean = text.trim();
  if (clean.length > MAX_MESSAGE_CHARS) {
    throw new Error(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов)`);
  }
  const userRow = await ensureUser(tgUser);
  const agent = getAgentOrDefault(agentId ?? userRow.agentId);
  const conv = await ensureConversation(userRow, agent.id);
  await appendMessage(conv, 'user', clean);
  const history = await getHistory(conv.id);
  const llmMessages = buildLlmMessages(agent, history);
  return { user: userRow, agent, conv, llmMessages };
}

export async function finishTurn(conv, replyText) {
  return appendMessage(conv, 'assistant', replyText);
}

export async function completeTurn({ tgUser, agentId, text }) {
  const { agent, conv, llmMessages } = await prepareTurn({ tgUser, agentId, text });
  const { content } = await completeChat(llmMessages, { model: undefined });
  const saved = await finishTurn(conv, content.trim());
  return { agent, conv, reply: saved.content, messageId: saved.id };
}
