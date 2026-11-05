import { db } from 'sdk';
import { marketerSkills, marketerSkillFiles } from '../schema.js';
import { ADMIN_TG_IDS } from '../lib/config.js';
import { EndpointError } from 'sdk';
import { MARKETER_SKILL_PACK, MARKETER_SKILL_FILES } from '../lib/skills/marketer/mPack.js';
import { ensureMarketerSkills } from '../lib/skills/mSkills.js';

// Диагностика скиллов маркетолога: заодно триггерит ленивый сид из пака.
export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });

  const cache = await ensureMarketerSkills();
  const rows = await db.select().from(marketerSkills).all();
  const fileRows = await db.select().from(marketerSkillFiles).all();

  return {
    pack: { skills: MARKETER_SKILL_PACK.length, files: MARKETER_SKILL_FILES.length },
    cacheCount: cache.length,
    skills: rows
      .map((r) => ({ id: r.skillId, name: r.name, active: r.active !== false, chars: (r.content ?? '').length }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    filesCached: fileRows.length,
  };
}
