// Скиллы маркетолога из БД (таблицы marketer_skills / marketer_skill_files).
// Источник пака — lib/skills/marketer/marketer-pack.js (сгенерирован из
// C:/Users/Dell/agents/marketer). Сид ленивый: при первом обращении в рамках
// изолята недостающие скиллы досоздаются из пака; после сида БД — источник
// истины таблица (правки скиллов подхватываются без деплоя).
// Кэш живёт в рамках изолята (одного вызова эндпоинта) — каждый шаг хода
// перечитывает таблицу одним SELECT'ом.
import { db } from 'sdk';
import { and, eq } from 'sdk/db';
import { marketerSkills, marketerSkillFiles } from '../../schema.js';
import { MARKETER_SKILL_PACK, MARKETER_SKILL_FILES } from './marketer/mPack.js';

export const MARKETER_AGENT_ID = 'marketer';

let cache = null; // [{ id, name, when, content }] — тёплый кэш текущего изолята

// Гарантирует, что скиллы маркетолога в БД и возвращает их список.
export async function ensureMarketerSkills() {
  if (cache) return cache;
  try {
    const rows = await db.select().from(marketerSkills).all();
    const have = new Set(rows.map((r) => r.skillId));
    const missing = MARKETER_SKILL_PACK.filter((s) => !have.has(s.id));
    for (const s of missing) {
      await db.insert(marketerSkills)
        .values({ skillId: s.id, name: s.name, useWhen: s.when, content: s.content, active: true })
        .onConflictDoNothing({ target: marketerSkills.skillId })
        .run();
    }
    cache = [
      ...rows
        .filter((r) => r.active !== false)
        .map((r) => ({ id: r.skillId, name: r.name, when: r.useWhen ?? '', content: r.content })),
      ...missing.map((s) => ({ id: s.id, name: s.name, when: s.when, content: s.content })),
    ].filter((s) => s.id && s.content);
    return cache;
  } catch (_) {
    return []; // таблиц ещё нет (миграция не применена) — ход не роняем
  }
}

// Синхронный доступ к тёплому кэшу (после ensureMarketerSkills).
export function marketerSkillsCached() {
  return cache ?? [];
}

// Файл скилла (references/*). Лениво кэшируется в БД из пака по запросу.
export async function getMarketerSkillFile(skillId, rawPath) {
  const path = normalizeFilePath(skillId, rawPath);
  if (!path) return null;
  try {
    const row = await db.select().from(marketerSkillFiles)
      .where(and(eq(marketerSkillFiles.skillId, skillId), eq(marketerSkillFiles.path, path)))
      .get();
    if (row) return row.content;
    const pack = MARKETER_SKILL_FILES.find((f) => f.skillId === skillId && f.path === path);
    if (!pack) return null;
    await db.insert(marketerSkillFiles).values({ skillId, path, content: pack.content }).run();
    return pack.content;
  } catch (_) {
    return MARKETER_SKILL_FILES.find((f) => f.skillId === skillId && f.path === path)?.content ?? null;
  }
}

// Модель может прислать «form.md», «references/form.md», «skills/cro/references/form.md»
function normalizeFilePath(skillId, rawPath) {
  let p = String(rawPath ?? '').trim().replace(/\\/g, '/');
  if (!p) return '';
  p = p.replace(/^\.?\//, '');
  const prefix = `skills/${skillId}/`;
  if (p.startsWith(prefix)) p = p.slice(prefix.length);
  return p;
}
