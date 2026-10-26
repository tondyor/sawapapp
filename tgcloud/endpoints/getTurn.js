import { EndpointError } from 'sdk';
import { getTurn } from '../lib/agent/turn.js';

// Состояние хода для возобновления: с turnId — конкретный ход, без — последний
// активный ход диалога (баннер «Ход не завершён — продолжить?»).
export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const turnId = input?.turnId ? String(input.turnId) : null;
  const conversationId = input?.conversationId ? Number(input.conversationId) : null;
  if (!turnId && !conversationId) throw new EndpointError('turnId или conversationId обязателен', { code: 'BAD_INPUT' });
  try {
    const row = await getTurn({ turnId, conversationId, tgId: tgUser.id });
    return { turn: row };
  } catch (e) {
    const m = String(e?.message ?? e);
    if (e?.code) throw new EndpointError(m, { code: e.code });
    throw e;
  }
}
