import { api } from 'sdk';
import { ensureUser, setAgent, createConversation } from '../lib/chat.js';
import { AGENTS, getAgent, getAgentOrDefault, DEFAULT_AGENT_ID } from '../lib/agents.js';
import { APP_URL } from '../lib/config.js';

// Ф4: бот-чат — точка входа и настройки. Вся агентская логика (ходы, стриминг,
// навыки) живёт в Mini App; текст сюда → приглашение с кнопкой приложения.
export default async function (message) {
  const chatId = message?.chat?.id;
  const from = message?.from;
  if (!chatId || !from) return;
  if (message.chat.type !== 'private') return;

  const text = (message.text ?? '').trim();

  if (!text) {
    if (message.photo || message.voice || message.document || message.video || message.audio) {
      await api.sendMessage({ chat_id: chatId, text: 'Файлы и фото принимают агенты в приложении.' });
    }
    return;
  }

  if (text.startsWith('/')) {
    await handleCommand(chatId, from, text);
    return;
  }

  await api.sendMessage({
    chat_id: chatId,
    text: 'Общение с агентами — в приложении: там ход с планом, шагами и трассой размышлений.',
    ...(APP_URL ? { reply_markup: appKeyboard() } : {}),
  });
}

function appKeyboard() {
  return { inline_keyboard: [[{ text: 'Открыть приложение', web_app: { url: APP_URL } }]] };
}

async function handleCommand(chatId, from, text) {
  const [rawCmd, ...rest] = text.split(/\s+/);
  const cmd = rawCmd.split('@')[0].toLowerCase();
  const arg = rest.join(' ').trim();

  switch (cmd) {
    case '/start': {
      const user = await ensureUser(from);
      const agent = getAgentOrDefault(user.agentId);
      await api.sendMessage({
        chat_id: chatId,
        text: welcomeText(agent),
        reply_markup: agentKeyboard(user.agentId),
      });
      return;
    }
    case '/agents': {
      const user = await ensureUser(from);
      await api.sendMessage({
        chat_id: chatId,
        text: agentsText(user.agentId),
        reply_markup: agentKeyboard(user.agentId),
      });
      return;
    }
    case '/agent': {
      const agent = getAgent(arg);
      if (!agent) {
        await api.sendMessage({ chat_id: chatId, text: `Нет такого агента. Доступны: ${AGENTS.map((a) => a.name).join(', ')}.`, reply_markup: agentKeyboard(null) });
        return;
      }
      await ensureUser(from);
      await setAgent(from.id, agent.id);
      await api.sendMessage({ chat_id: chatId, text: `Агент по умолчанию: ${agent.name}.`, reply_markup: agentKeyboard(agent.id) });
      return;
    }
    case '/new': {
      const user = await ensureUser(from);
      const agent = getAgentOrDefault(user.agentId);
      await createConversation(user, agent.id, 'Новый диалог');
      await api.sendMessage({ chat_id: chatId, text: `Начат новый диалог с агентом «${agent.name}» в приложении.`, reply_markup: agentKeyboard(agent.id) });
      return;
    }
    case '/help': {
      await api.sendMessage({
        chat_id: chatId,
        text: [
          'SawaPApp — чат с AI-агентами разных ролей.',
          '',
          'Команды:',
          '/agents — выбрать агента',
          '/new — начать новый диалог',
          '/agent <имя> — агент по умолчанию',
          '',
          'Общение — в приложении: план хода, шаги, трасса размышлений.',
        ].join('\n'),
        ...(APP_URL ? { reply_markup: appKeyboard() } : {}),
      });
      return;
    }
    default:
      await api.sendMessage({ chat_id: chatId, text: 'Неизвестная команда. Попробуй /help.' });
  }
}

function welcomeText(agent) {
  return [
    `Привет! Это SawaPApp — здесь ты общаешься с AI-агентами, каждый со своей специальностью.`,
    '',
    `Агент по умолчанию: «${agent.name}» — ${agent.tagline.toLowerCase()}.`,
    '',
    'Открой приложение и напиши ему там — с планом, шагами и трассой размышлений.',
  ].join('\n');
}

function agentsText(currentId) {
  const lines = ['Агенты SawaPApp:', ''];
  for (const a of AGENTS) {
    lines.push(`${a.id === currentId ? '•' : '–'} ${a.name} — ${a.description}`);
  }
  return lines.join('\n');
}

function agentKeyboard(currentId) {
  const rows = AGENTS.map((a) => [{
    text: (a.id === currentId ? '• ' : '') + a.name,
    callback_data: `agent:${a.id}`,
  }]);
  if (APP_URL) rows.push([{ text: 'Открыть приложение', web_app: { url: APP_URL } }]);
  return { inline_keyboard: rows };
}

export { DEFAULT_AGENT_ID };
