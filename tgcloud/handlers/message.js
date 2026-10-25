import { api, BotApiError } from 'sdk';
import { prepareTurn, finishTurn, ensureUser, setAgent, createConversation, agentTurnStream, buildMeta } from '../lib/chat.js';
import { AGENTS, getAgent, getAgentOrDefault, DEFAULT_AGENT_ID } from '../lib/agents.js';
import { APP_URL, MAX_MESSAGE_CHARS } from '../lib/config.js';

export default async function (message) {
  const chatId = message?.chat?.id;
  const from = message?.from;
  if (!chatId || !from) return;
  if (message.chat.type !== 'private') return;

  const text = (message.text ?? '').trim();

  if (!text) {
    if (message.photo || message.voice || message.document || message.video || message.audio) {
      await api.sendMessage({ chat_id: chatId, text: 'Пока я понимаю только текст. Напиши сообщение — или открой приложение.' });
    }
    return;
  }

  if (text.startsWith('/')) {
    await handleCommand(chatId, from, text);
    return;
  }

  await runTurn(chatId, from, null, text);
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
      await api.sendMessage({ chat_id: chatId, text: `Агент выбран: ${agent.name}. Напиши сообщение — начнём диалог.`, reply_markup: agentKeyboard(agent.id) });
      return;
    }
    case '/new': {
      const user = await ensureUser(from);
      const agent = getAgentOrDefault(user.agentId);
      await createConversation(user, agent.id, 'Новый диалог');
      await api.sendMessage({ chat_id: chatId, text: `Начат новый диалог с агентом «${agent.name}». История предыдущего сохранена.`, reply_markup: agentKeyboard(agent.id) });
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
          '/agent <имя> — выбрать агента по имени',
          '',
          'Или открой приложение: там удобнее.',
        ].join('\n'),
        ...(APP_URL ? { reply_markup: { inline_keyboard: [[{ text: 'Открыть приложение', web_app: { url: APP_URL } }]] } } : {}),
      });
      return;
    }
    default:
      await api.sendMessage({ chat_id: chatId, text: 'Неизвестная команда. Попробуй /help.' });
  }
}

async function runTurn(chatId, from, agentId, text) {
  if (text.length > MAX_MESSAGE_CHARS) {
    await api.sendMessage({ chat_id: chatId, text: `Сообщение слишком длинное (максимум ${MAX_MESSAGE_CHARS} символов).` });
    return;
  }

  const prepared = await prepareTurn({ tgUser: from, agentId, text });
  const { agent, conv, llmMessages } = prepared;
  const started = Date.now();
  const out = { started, skills: [], steps: [], model: null, reasoningText: null, content: null };

  try { await api.sendChatAction({ chat_id: chatId, action: 'typing' }); } catch (_) {}

  const placeholder = await api.sendMessage({ chat_id: chatId, text: `${agent.name} печатает…` });
  const messageId = placeholder.message_id;

  let acc = '';
  let lastEdit = Date.now();
  try {
    for await (const ev of agentTurnStream({ agent, llmMessages, reasoning: conv.reasoning }, out)) {
      if (ev.type === 'delta') {
        acc += ev.delta;
        const now = Date.now();
        if (now - lastEdit > 1500 && acc.trim()) {
          lastEdit = now;
          await safeEdit(chatId, messageId, `${acc.trim()} ▌`);
          try { await api.sendChatAction({ chat_id: chatId, action: 'typing' }); } catch (_) {}
        }
      } else if (ev.type === 'skill') {
        try { await api.sendChatAction({ chat_id: chatId, action: 'typing' }); } catch (_) {}
      }
    }
    const finalText = (out.content ?? acc).trim() || 'Модель вернула пустой ответ. Попробуй переформулировать вопрос.';
    const footer = out.skills.length ? `\n\n— использован навык: ${out.skills.map((s) => s.name).join(', ')}` : '';
    await safeEdit(chatId, messageId, finalText.slice(0, 4000 - footer.length) + footer);
    if (finalText.length > 4000) {
      for (const chunk of splitLong(finalText, 4000).slice(1)) {
        await api.sendMessage({ chat_id: chatId, text: chunk });
      }
    }
    const meta = buildMeta({
      started,
      model: out.model,
      reasoning: conv.reasoning,
      steps: out.steps,
      skills: out.skills,
      reasoningText: out.reasoningText,
    });
    await finishTurn(conv, finalText, meta);
  } catch (e) {
    console.error('turn failed', e);
    const meta = buildMeta({
      started,
      reasoning: conv.reasoning,
      steps: out.steps,
      skills: out.skills,
      reasoningText: out.reasoningText,
      error: e?.message ?? String(e),
    });
    const msg = acc.trim()
      ? `${acc.trim()}\n\n(ответ прерван из-за ошибки, попробуй ещё раз)`
      : 'Не получилось получить ответ от модели. Попробуй ещё раз через минуту.';
    await safeEdit(chatId, messageId, msg);
    await finishTurn(conv, acc.trim() || '[ошибка: ответ не получен]', meta);
  }
}

async function safeEdit(chatId, messageId, text) {
  try {
    await api.editMessageText({ chat_id: chatId, message_id: messageId, text: text.slice(0, 4000) });
  } catch (e) {
    if (e instanceof BotApiError) {
      if (e.code === 429) {
        const after = e.parameters?.retry_after ?? 1;
        await new Promise((r) => setTimeout(r, after * 1000));
        try { await api.editMessageText({ chat_id: chatId, message_id: messageId, text: text.slice(0, 4000) }); } catch (_) {}
        return;
      }
      if (e.code === 400) return;
    }
    console.warn('edit failed', e?.description ?? String(e));
  }
}

function splitLong(text, size) {
  const parts = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf('\n', size);
    if (cut < size * 0.5) cut = size;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

function welcomeText(agent) {
  return [
    `Привет! Это SawaPApp — здесь ты общаешься с AI-агентами, каждый со своей специальностью.`,
    '',
    `Текущий агент: «${agent.name}» — ${agent.tagline.toLowerCase()}.`,
    '',
    'Выбери агента кнопкой ниже, напиши сообщение прямо в чат — или открой приложение.',
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
