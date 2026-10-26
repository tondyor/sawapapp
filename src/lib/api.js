import { callEndpoint } from './tg.js';

export async function fetchAgents() {
  const res = await callEndpoint('listAgents');
  return res.agents ?? [];
}

export async function fetchHistory(agentId = null, conversationId = null) {
  return callEndpoint('getHistory', { agentId, conversationId });
}

// Ходы агента (отправка/редактирование) на reasoning-уровнях идут минуты.
// Таймаут 180с: если сервер не ответил (изолят убит платформой и т.п.), промис
// отклоняется с понятной ошибкой — ход при этом мог дойти до конца, ответ
// придёт через события хода (getTurnEvents) даже после отклонения этого вызова.
export const TURN_TIMEOUT_MS = 180000;

export async function sendUserMessage({ text, agentId, conversationId, reasoning, attachmentIds, turnId }) {
  return callEndpoint('sendMessage', { text, agentId, conversationId, reasoning, attachmentIds, turnId }, { timeoutMs: TURN_TIMEOUT_MS });
}

export async function getTurnEvents(turnId, afterId = 0) {
  return callEndpoint('getTurnEvents', { turnId, afterId }, { timeoutMs: 15000 });
}

// ── Пайплайн хода (конечный автомат в БД) ──────────────────────────────────
export async function startTurn({ text, agentId, conversationId, reasoning, attachmentIds }) {
  return callEndpoint('startTurn', { text, agentId, conversationId, reasoning, attachmentIds }, { timeoutMs: 45000 });
}

export async function runTurnStep(turnId) {
  return callEndpoint('runTurnStep', { turnId }, { timeoutMs: TURN_TIMEOUT_MS });
}

export async function finishTurn(turnId) {
  return callEndpoint('finishTurn', { turnId }, { timeoutMs: TURN_TIMEOUT_MS });
}

// Состояние хода: с turnId — конкретный, без — последний активный ход диалога.
export async function getTurnState({ turnId, conversationId }) {
  return callEndpoint('getTurn', { turnId, conversationId }, { timeoutMs: 15000 });
}

export async function stopTurn(turnId) {
  return callEndpoint('stopTurn', { turnId }, { timeoutMs: 30000 });
}

export async function editMessage({ messageId, content, reasoning, turnId }) {
  return callEndpoint('editMessage', { messageId, content, reasoning, turnId }, { timeoutMs: TURN_TIMEOUT_MS });
}export async function uploadFileChunk({ uploadId, idx, dataBase64 }) {
  return callEndpoint('uploadFileChunk', { uploadId, idx, dataBase64 });
}

export async function uploadFileFinish({ uploadId, conversationId, name, mime }) {
  return callEndpoint('uploadFileFinish', { uploadId, conversationId, name, mime });
}

const CHUNK_SIZE = 700000;

export async function fetchFileDataUrl(fileId, onProgress) {
  const first = await callEndpoint('getFileChunk', { fileId, chunkIndex: 0 });
  let b64 = first.dataBase64;
  const total = first.size;
  if (onProgress) onProgress(1, first.chunkCount);
  for (let i = 1; i < first.chunkCount; i++) {
    const part = await callEndpoint('getFileChunk', { fileId, chunkIndex: i });
    b64 += part.dataBase64;
    if (onProgress) onProgress(i + 1, first.chunkCount);
  }
  return { url: `data:${first.mime};base64,${b64}`, name: first.name, mime: first.mime, size: total };
}

export function readFileSliceAsBase64(file, start, end) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? '');
      const idx = s.indexOf(',');
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file.slice(start, end));
  });
}

export async function startConversation(agentId) {
  return callEndpoint('newConversation', { agentId });
}

export async function fetchConversations() {
  return callEndpoint('listConversations');
}

export async function deleteConversation(conversationId) {
  return callEndpoint('deleteConversation', { conversationId });
}

export async function forkConversation(conversationId, upToMessageId = null) {
  return callEndpoint('forkConversation', { conversationId, upToMessageId });
}

export function errorText(err) {
  if (!err) return 'Неизвестная ошибка';
  if (err.type === 'UNAUTHORIZED') return 'Открой приложение через Telegram';
  if (err.type === 'NO_SDK') return err.message;
  if (err.type === 'TIMEOUT') return err.message;
  // Документированное поведение Serverless.call: status 0 = «запрос не смог завершиться»
  if (err.status === 0) return 'Соединение с сервером прервалось — попробуй ещё раз.';
  if (err.type && err.type !== 'ENDPOINT_ERROR' && !err.message) {
    return 'Сервер вернул ошибку без описания — попробуй ещё раз.';
  }
  return err.message || 'Ошибка соединения, попробуй ещё раз';
}
