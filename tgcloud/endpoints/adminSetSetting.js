import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { settings } from '../schema.js';
import { ADMIN_TG_IDS, ALLOWED_SETTING_KEYS } from '../lib/config.js';

export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) {
    throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  }
  const key = String(input?.key ?? '').trim();
  const value = input?.value == null ? '' : String(input.value);
  if (!ALLOWED_SETTING_KEYS.includes(key)) {
    throw new EndpointError('Недопустимый ключ настройки', { code: 'BAD_KEY' });
  }
  await db.insert(settings).values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } })
    .run();
  return { ok: true, key, length: value.length };
}
