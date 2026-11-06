import { listAgentMeta } from "../lib/agents.js";
import { ensureUser } from "../lib/chat.js";

export default async function (input, ctx) {
  if (ctx?.initData?.user) {
    try {
      await ensureUser(ctx.initData.user);
    } catch (_) {}
  }
  return { agents: listAgentMeta() };
}
