// Веб-инструменты агента (Ф2): web_search через Serper.dev, web_read страниц.
// Ключ SERPER_API_KEY живёт в settings (тот же механизм, что NVIDIA_API_KEY):
// без ключа планировщик исключает search/read_url, ход работает без поиска.
import { fetch } from 'sdk';
import { getSettingOr } from '../nvidia.js';

const SERPER_URL = 'https://google.serper.dev/search';
const JINA_READER = 'https://r.jina.ai/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export async function searchKeyAvailable() {
  return Boolean(await getSettingOr('SERPER_API_KEY', ''));
}

// ≤10 результатов {title, link, snippet}; raw — готовый текст для сжимателя находок.
export async function webSearch(query, { num = 8 } = {}) {
  const key = await getSettingOr('SERPER_API_KEY', '');
  if (!key) throw new Error('Поиск недоступен: не задан ключ SERPER_API_KEY');
  const q = String(query ?? '').trim();
  if (!q) throw new Error('Пустой поисковый запрос');
  const res = await fetch(SERPER_URL, {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, num: Math.min(Math.max(num, 1), 10), hl: 'ru' }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Serper ${res.status}: ${text.slice(0, 160)}`);
  let data;
  try { data = JSON.parse(text); } catch (_) { throw new Error('Serper: некорректный JSON ответа'); }
  const items = [];
  const kg = data.knowledgeGraph;
  if (kg?.title) items.push({ title: kg.title, link: kg.websiteUrl ?? '', snippet: [kg.type, kg.description].filter(Boolean).join(' — ') });
  const ab = data.answerBox;
  if (ab?.answer ?? ab?.snippet ?? ab?.title) items.push({ title: 'Прямой ответ Google', link: ab.link ?? '', snippet: String(ab.answer ?? ab.snippet ?? ab.title ?? '').slice(0, 400) });
  for (const r of data.organic ?? []) {
    if (items.length >= 10) break;
    items.push({ title: String(r.title ?? '').slice(0, 200), link: String(r.link ?? ''), snippet: String(r.snippet ?? '').slice(0, 400) });
  }
  if (!items.length) throw new Error('Serper: результатов не найдено');
  const raw = items.map((it, i) => `${i + 1}. ${it.title}${it.link ? ` (${it.link})` : ''}\n${it.snippet}`).join('\n\n');
  return { items, raw, count: items.length };
}

// ── Извлечение читабельного текста из HTML без DOM (изолят без npm) ────────
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·', times: '×', deg: '°', euro: '€', rub: '₽', copy: '©', reg: '®', trade: '™' };

function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    const e = ENTITIES[body.toLowerCase()];
    return e ?? m;
  });
}

export function htmlToText(html) {
  let s = String(html ?? '');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<(script|style|noscript|svg|head|iframe|nav|footer|form)[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/section|\/article|\/header)[^>]*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n\s*\n\s*/g, '\n');
  s = s.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  return s.trim();
}

// Чтение страницы: сначала прямой fetch (текст ≤15К), при неудаче — ридер
// r.jina.ai (готовый markdown). Переключается настройкой READER_MODE=jina|auto.
export async function webRead(url, { maxChars = 15000 } = {}) {
  const u = String(url ?? '').trim();
  if (!/^https?:\/\//i.test(u)) throw new Error('read_url: ожидается http(s)-ссылка');
  const mode = await getSettingOr('READER_MODE', 'auto');
  if (mode !== 'jina') {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
      if (res.ok) {
        const ct = String(res.headers?.get?.('content-type') ?? '');
        const body = await res.text();
        const text = ct.includes('html') ? htmlToText(body) : String(body).trim();
        if (text.length >= 500) return { text: text.slice(0, maxChars), via: 'direct', url: u };
      }
    } catch (_) { /* падаем на ридер */ }
  }
  const jres = await fetch(JINA_READER + u, { headers: { 'User-Agent': UA } });
  if (!jres.ok) throw new Error(`Страница недоступна (reader ${jres.status})`);
  const md = await jres.text();
  if (!md.trim()) throw new Error('Страница недоступна (пустой текст ридера)');
  return { text: md.slice(0, maxChars), via: 'jina', url: u };
}
