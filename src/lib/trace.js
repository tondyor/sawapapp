// meta сохранённого сообщения → псевдо-события трассы для ReasoningTrace.
// Две формы meta: legacy (image_read/skill_read) и пайплайн (шаги автомата:
// vision/search/read_url/reason/direct_answer/synthesize с finding/ms/ok).
export function eventsFromMeta(meta) {
  if (!meta) return [];
  const evs = [{ id: 's', type: 'start', payload: { model: meta.model, reasoning: meta.reasoning } }];
  for (const s of meta.steps ?? []) {
    if (s.type === 'image_read') {
      evs.push({ id: 'i' + s.name, type: 'image', payload: { name: s.name, description: s.desc ?? '' } });
      continue;
    }
    if (s.type === 'skill_read') {
      const known = (meta.skills ?? []).find((k) => k.id === s.skill);
      evs.push({ id: 'k' + s.skill, type: 'skill', payload: { id: s.skill, name: known?.name ?? s.skill } });
      continue;
    }
    // шаг пайплайна (в т.ч. vision из нового пути)
    evs.push({
      id: 'p' + s.type + (s.title ?? '') + (s.ms ?? ''),
      type: 'step',
      payload: { stepType: s.type, title: s.title ?? s.type, ok: s.ok ?? true, ms: s.ms ?? null, finding: s.finding ?? null, error: s.error ?? null },
    });
  }
  if (meta.reasoningText) evs.push({ id: 'r', type: 'reasoning', payload: { text: meta.reasoningText } });
  if (meta.error) evs.push({ id: 'e', type: 'error', payload: { message: meta.error } });
  evs.push({ id: 'd', type: 'done', payload: { meta } });
  return evs;
}
