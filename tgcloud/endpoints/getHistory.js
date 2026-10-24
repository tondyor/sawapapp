import { db, EndpointError } from 'sdk';
import { getConversationById, getHistory, ensureUser, latestConversation } from '../lib/chat.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const userRow = await ensureUser(tgUser);

  let conv = null;
  if (input?.conversationId) {
    conv = await getConversationById(Number(input.conversationId), tgUser.id);
    if (!conv) throw new EndpointError('Диалог не найден', { code: 'NOT_FOUND' });
  } else {
    conv = await latestConversation(userRow, input?.agentId ?? null);
  }

  if (!conv) {
    return { conversationId: null, agentId: userRow.agentId, title: null, messages: [] };
  }

  const history = await getHistory(conv.id, 100);
  return {
    conversationId: conv.id,
    agentId: conv.agentId,
    title: conv.title,
    messages: history.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
  };
}
