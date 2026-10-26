import { EndpointError } from 'sdk';
import { webSearch, webRead } from '../lib/agent/websearch.js';
import { ADMIN_TG_IDS } from '../lib/config.js';

// Ф2-пробник: web_search (Serper) и web_read (direct + jina fallback).
// search: { mode:'search', query } ; read: { mode:'read', url }
export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  const mode = input?.mode ?? 'read';
  if (mode === 'search') {
    try {
      const r = await webSearch(String(input.query ?? 'тест'), { num: 5 });
      return { ok: true, count: r.count, items: r.items.slice(0, 3), rawLen: r.raw.length };
    } catch (e) {
      return { ok: false, error: String(e?.message ?? e).slice(0, 200) };
    }
  }
  if (mode === 'read') {
    try {
      const r = await webRead(String(input.url ?? 'https://ru.wikipedia.org/wiki/Telegram'), {});
      return { ok: true, via: r.via, chars: r.text.length, preview: r.text.slice(0, 300) };
    } catch (e) {
      return { ok: false, error: String(e?.message ?? e).slice(0, 200) };
    }
  }
  throw new EndpointError('mode: search|read', { code: 'BAD_INPUT' });
}
