export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export function initTelegram() {
  if (!tg) return;
  try { tg.ready(); } catch (_) {}
  try { tg.expand(); } catch (_) {}
  try { tg.disableVerticalSwipes?.(); } catch (_) {}
  try { tg.setHeaderColor('#070a12'); } catch (_) {}
  try { tg.setBackgroundColor('#070a12'); } catch (_) {}
}

export function callEndpoint(name, input = {}) {
  return new Promise((resolve, reject) => {
    if (!tg?.Serverless?.call) {
      reject({ type: 'NO_SDK', message: 'Telegram Mini App SDK недоступен' });
      return;
    }
    tg.Serverless.call(name, input, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function haptic(kind = 'light') {
  try {
    tg?.HapticFeedback?.impactOccurred(kind);
  } catch (_) {}
}

export function isTelegram() {
  return Boolean(tg && tg.initData);
}
