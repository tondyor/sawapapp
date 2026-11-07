import { api } from "sdk";
export function draftIdFor(turnId) {
  let h = 7;
  const s = String(turnId ?? "x");
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return (h % 1e9) + 1;
}
function escapeHtml(text) {
  return String(text ?? "")
    .slice(-1500)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function richTruncate(text) {
  return String(text ?? "").slice(0, 32e3);
}
function textTruncate(text) {
  return String(text ?? "").slice(0, 4095);
}
export async function sendThinkingDraft({ tgId, turnId, recorder, thinking = "" }) {
  const draftId = draftIdFor(turnId);
  const thinkingHtml = thinking
    ? `<tg-thinking>${escapeHtml(thinking)}</tg-thinking>`
    : "<tg-thinking>Thinking...</tg-thinking>";
  for (const payload of [
    { rich_message: { html: thinkingHtml } },
    { rich_message: { markdown: "Thinking..." } },
    { text: "" },
  ]) {
    try {
      if (payload.text !== undefined) {
        await api.sendMessageDraft({
          chat_id: tgId,
          draft_id: draftId,
          text: payload.text,
          can_stop: true,
        });
      } else {
        await api.sendRichMessageDraft({
          chat_id: tgId,
          draft_id: draftId,
          ...payload,
          can_stop: true,
        });
      }
      recorder?.event("draft", { ok: true, phase: "thinking", chars: thinkingHtml.length });
      return true;
    } catch (_) {
      continue;
    }
  }
  recorder?.event("draft", { ok: false, phase: "thinking" });
  return false;
}
export async function sendDraft({ tgId, turnId, text, recorder }) {
  const draftId = draftIdFor(turnId);
  const chars = String(text ?? "").length;
  for (const payload of [
    { rich_message: { markdown: richTruncate(text) } },
    { text: textTruncate(text) },
  ]) {
    try {
      if (payload.text !== undefined) {
        await api.sendMessageDraft({
          chat_id: tgId,
          draft_id: draftId,
          text: payload.text,
          can_stop: true,
        });
      } else {
        await api.sendRichMessageDraft({
          chat_id: tgId,
          draft_id: draftId,
          ...payload,
          can_stop: true,
        });
      }
      recorder?.event("draft", { ok: true, phase: "stream", chars });
      return true;
    } catch (_) {
      continue;
    }
  }
  recorder?.event("draft", { ok: false, phase: "stream", chars });
  return false;
}
export async function sendFinal({ tgId, turnId, text, recorder }) {
  const chars = String(text ?? "").length;
  for (const attempt of [
    async () =>
      api
        .sendRichMessage({
          chat_id: tgId,
          rich_message: { markdown: richTruncate(text) },
        })
        .then(() => "rich"),
    async () =>
      api.sendMessage({
        chat_id: tgId,
        text: textTruncate(text),
      }).then(() => "text"),
  ]) {
    try {
      const method = await attempt();
      recorder?.event("draft", { ok: true, phase: "final", method, chars });
      return true;
    } catch (_) {
      continue;
    }
  }
  recorder?.event("draft", { ok: false, phase: "final", chars });
  return false;
}
