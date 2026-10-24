import { ensureUser, createConversation } from '../lib/chat.js';
import { getAgentOrDefault } from '../lib/agents.js';

export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const userRow = await ensureUser(tgUser);
  const agent = getAgentOrDefault(input?.agentId ?? userRow.agentId);
  const conv = await createConversation(userRow, agent.id, 'Новый диалог');
  return { conversationId: conv.id, agentId: agent.id };
}
