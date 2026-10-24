import { callEndpoint } from './tg.js';

export async function fetchAgents() {
  const res = await callEndpoint('listAgents');
  return res.agents ?? [];
}

export async function fetchHistory(agentId = null, conversationId = null) {
  return callEndpoint('getHistory', { agentId, conversationId });
}

export async function sendUserMessage({ text, agentId, conversationId }) {
  return callEndpoint('sendMessage', { text, agentId, conversationId });
}

export async function startConversation(agentId) {
  return callEndpoint('newConversation', { agentId });
}

export function errorText(err) {
  if (!err) return 'Неизвестная ошибка';
  if (err.type === 'UNAUTHORIZED') return 'Открой приложение через Telegram';
  if (err.type === 'NO_SDK') return err.message;
  return err.message || 'Ошибка соединения, попробуй ещё раз';
}
