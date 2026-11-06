import { db } from "sdk";
import { and, eq } from "sdk/db";
import { marketerSkills, marketerSkillFiles } from "../../schema.js";
import { MARKETER_SKILL_PACK, MARKETER_SKILL_FILES } from "./marketer/mPack.js";
export const MARKETER_AGENT_ID = "marketer";
let cache = null;
export async function ensureMarketerSkills() {
  if (cache) return cache;
  cache = MARKETER_SKILL_PACK.map((s) => ({
    id: s.id,
    name: s.name,
    when: s.when,
    content: s.content,
  }));
  return cache;
}
export function marketerSkillsCached() {
  return cache ?? [];
}
export async function getMarketerSkillFile(skillId, rawPath) {
  const path = normalizeFilePath(skillId, rawPath);
  if (!path) return null;
  try {
    const row = await db
      .select()
      .from(marketerSkillFiles)
      .where(
        and(
          eq(marketerSkillFiles.skillId, skillId),
          eq(marketerSkillFiles.path, path),
        ),
      )
      .get();
    if (row) return row.content;
    const pack = MARKETER_SKILL_FILES.find(
      (f) => f.skillId === skillId && f.path === path,
    );
    if (!pack) return null;
    await db
      .insert(marketerSkillFiles)
      .values({ skillId, path, content: pack.content })
      .run();
    return pack.content;
  } catch (_) {
    return (
      MARKETER_SKILL_FILES.find((f) => f.skillId === skillId && f.path === path)
        ?.content ?? null
    );
  }
}
function normalizeFilePath(skillId, rawPath) {
  let p = String(rawPath ?? "")
    .trim()
    .replace(/\\/g, "/");
  if (!p) return "";
  p = p.replace(/^\.?\//, "");
  const prefix = `skills/${skillId}/`;
  if (p.startsWith(prefix)) p = p.slice(prefix.length);
  return p;
}
