// meta сохранённого сообщения → псевдо-события трассы для ReasoningTrace
export function eventsFromMeta(meta) {
  if (!meta) return [];
  const evs = [{ id: 's', type: 'start', payload: { model: meta.model, reasoning: meta.reasoning } }];
  for (const s of meta.steps ?? []) {
    if (s.type === 'image_read') {
      evs.push({ id: 'i' + s.name, type: 'image', payload: { name: s.name, description: s.desc ?? '' } });
    }
  }
  if (meta.reasoningText) evs.push({ id: 'r', type: 'reasoning', payload: { text: meta.reasoningText } });
  for (const s of meta.steps ?? []) {
    if (s.type === 'skill_read') {
      const known = (meta.skills ?? []).find((k) => k.id === s.skill);
      evs.push({ id: 'k' + s.skill, type: 'skill', payload: { id: s.skill, name: known?.name ?? s.skill } });
    }
  }
  if (meta.error) evs.push({ id: 'e', type: 'error', payload: { message: meta.error } });
  evs.push({ id: 'd', type: 'done', payload: { meta } });
  return evs;
}
