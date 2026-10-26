import { getPlannerModel, completeChat, getSettingOr } from '../nvidia.js';

// ── JSON-repair: малые модели стабильно ломают JSON (лишняя "}", оборванный
// хвост, висячая запятая). Ремонт детерминированный — доказан в Ф0 (5/5).
function repairJson(text) {
  const t = String(text ?? '').replace(/```(?:json)?/gi, '').trim();
  const start = Math.min(...['[', '{'].map((c) => { const i = t.indexOf(c); return i === -1 ? Infinity : i; }));
  if (!isFinite(start)) return null;
  const stack = [];
  let inStr = false;
  let esc = false;
  let out = '';
  for (const ch of t.slice(start)) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr) { out += ch; continue; }
    if (ch === '[' || ch === '{') { stack.push(ch === '[' ? ']' : '}'); out += ch; continue; }
    if (ch === ']' || ch === '}') {
      if (stack[stack.length - 1] === ch) { stack.pop(); out += ch; } // лишние закрывающие — выбрасываем
      continue;
    }
    out += ch;
  }
  let fixed = out;
  if (inStr) fixed += '"';
  while (fixed.length && /[,:[\s]$/.test(fixed)) fixed = fixed.slice(0, -1);
  fixed = fixed.replace(/,+$/, '');
  while (stack.length) fixed += stack.pop();
  return fixed;
}

function tryParse(text) {
  try { return { ok: true, value: JSON.parse(text) }; } catch (e) { return { ok: false, why: String(e?.message ?? e) }; }
}

export function extractPlanJson(text) {
  const raw = tryParse(String(text ?? '').replace(/```(?:json)?/gi, '').trim());
  if (raw.ok) return { value: raw.value, repaired: false };
  const fixed = repairJson(text);
  if (fixed === null) return { value: null, repaired: false };
  const v = tryParse(fixed);
  return v.ok ? { value: v.value, repaired: true } : { value: null, repaired: true };
}

export async function probe() {
  const model = await getPlannerModel();
  return { model, available: Boolean(await getSettingOr('SERPER_API_KEY', '')) };
}

export const UNUSED = completeChat;
