import { api, EndpointError } from 'sdk';
import { ADMIN_TG_IDS, APP_URL, BOT_COMMANDS } from '../lib/config.js';

export default async function (input, ctx) {
  const uid = ctx.initData.user?.id;
  if (!ADMIN_TG_IDS.includes(uid)) {
    throw new EndpointError('Доступ запрещён', { code: 'FORBIDDEN' });
  }
  const done = [];
  await api.setMyCommands({ commands: BOT_COMMANDS });
  done.push('commands');
  if (APP_URL) {
    await api.setChatMenuButton({
      menu_button: { type: 'web_app', text: 'Открыть', web_app: { url: APP_URL } },
    });
    done.push('menu_button');
  }
  return { ok: true, done, appUrl: APP_URL || null };
}
