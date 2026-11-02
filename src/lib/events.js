// Логгер продуктовых событий (09-metrics §4). Пишет в таблицу events на сервере.
// Best-effort: аналитика не имеет права ломать UX — ошибки глотаются всегда,
// в обычном браузере (вне Telegram) SDK просто недоступен и вызов тихо падает.
import { callEndpoint } from './tg.js';

export function logEvent(name, meta = null) {
  callEndpoint(
    'logEvent',
    meta ? { name, meta } : { name },
    { timeoutMs: 5000 },
  ).catch(() => {});
}
