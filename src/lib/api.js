import { callEndpoint } from './tg.js';

export async function fetchAgents() {
  const res = await callEndpoint('listAgents');
  return res.agents ?? [];
}

export async function fetchHistory(agentId = null, conversationId = null) {
  return callEndpoint('getHistory', { agentId, conversationId });
}

export async function sendUserMessage({ text, agentId, conversationId, reasoning, attachmentIds }) {
  return callEndpoint('sendMessage', { text, agentId, conversationId, reasoning, attachmentIds });
}

export async function uploadFileChunk({ uploadId, idx, dataBase64 }) {
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

export async function editMessage({ messageId, content, reasoning }) {
  return callEndpoint('editMessage', { messageId, content, reasoning });
}

export function errorText(err) {
  if (!err) return 'Неизвестная ошибка';
  if (err.type === 'UNAUTHORIZED') return 'Открой приложение через Telegram';
  if (err.type === 'NO_SDK') return err.message;
  return err.message || 'Ошибка соединения, попробуй ещё раз';
}
