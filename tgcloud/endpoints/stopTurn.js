import { EndpointError } from "sdk";
import { stopTurn } from "../lib/agent/turn.js";
export default async function (input, ctx) {
  const tgUser = ctx.initData.user;
  const turnId = String(input?.turnId ?? "");
  if (!turnId)
    throw new EndpointError("turnId обязателен", { code: "BAD_TURN" });
  try {
    return await stopTurn({ turnId, tgId: tgUser.id });
  } catch (e) {
    const m = String(e?.message ?? e);
    if (e?.code) throw new EndpointError(m, { code: e.code });
    throw e;
  }
}
