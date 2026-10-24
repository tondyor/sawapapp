import { listAgentMeta } from '../lib/agents.js';

export default async function () {
  return { agents: listAgentMeta() };
}
