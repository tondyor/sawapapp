import { api } from 'sdk';
import { ensureUser, setAgent } from '../lib/chat.js';
import { getAgent } from '../lib/agents.js';

export default async function (callbackQuery) {
  if (!callbackQuery) return;
  const data = callbackQuery.data ?? '';
  const from = callbackQuery.from;
  const msg = callbackQuery.message;

  if (!data.startsWith('agent:')) {
    await api.answerCallbackQuery({ callback_query_id: callbackQuery.id });
    return;
  }

  const agentId = data.slice('agent:'.length);
  const agent = getAgent(agentId);
  if (!agent) {
    await api.answerCallbackQuery({ callback_query_id: callbackQuery.id, text: 'Неизвестный агент' });
    return;
  }

  await ensureUser(from);
  await setAgent(from.id, agent.id);

  await api.answerCallbackQuery({ callback_query_id: callbackQuery.id, text: `Агент: ${agent.name}` });

  const text = `Агент выбран: «${agent.name}» — ${agent.tagline.toLowerCase()}. Напиши сообщение, чтобы начать новый диалог с ним.`;
  if (msg?.chat?.id && msg?.message_id) {
    try {
      await api.editMessageText({ chat_id: msg.chat.id, message_id: msg.message_id, text });
    } catch (_) {
      await api.sendMessage({ chat_id: msg.chat.id, text });
    }
  } else {
    await api.sendMessage({ chat_id: from.id, text });
  }
}
