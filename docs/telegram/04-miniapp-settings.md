# 04. Настройки бота при работе через Mini App

Всё, что нужно настроить, если бот — это Mini App (а также всё, что настраивается отдельно от чат-сценария): BotFather, ссылки, домены, хостинг, валидация `initData`. Сами API-возможности Mini App — в [05-miniapp-api.md](05-miniapp-api.md); связка с ботом — в [06-bot-miniapp-combo.md](06-bot-miniapp-combo.md).

> Источники: [webapps.md](https://core.telegram.org/bots/webapps.md), [features.md](https://core.telegram.org/bots/features.md), [payments-stars.md](https://core.telegram.org/bots/payments-stars.md), [serverless.md](https://core.telegram.org/bots/serverless.md).

## 1. BotFather: Configure Mini App (включить и оформить)

Путь: [@BotFather](https://t.me/BotFather) → `/mybots` → ваш бот → **Bot Settings → Configure Mini App** → **Enable Mini App** (Bot API 6.0+; см. changelog [April 2022](https://core.telegram.org/bots/api-changelog.md#april-16-2022)).

Что там настраивается:

| Пункт | Что это |
|---|---|
| URL Mini App | Публичная HTTPS-ссылка на вашу страницу |
| **Loading Screen / Splash Screen** | Иконка и цвета (light/dark) для экрана загрузки Mini App; Bot API 8.0+; можно посмотреть *Open Splash Screen Preview* |
| **Main Mini App** (Bot API 7.8+) | Кнопка **Launch app** в профиле бота, показ в *Apps* в поиске, возможность **Mini App Store**; см. раздел 4 ниже |
| **Attachment Menu** | `/setattach` — показывать бота в меню скрепки (только крупные рекламодатели [Telegram Ad Platform](https://promote.telegram.org/basics); на test server доступно всем ботам) |
| **Previews** | Загрузка скриншотов и видео-демо (можно несколько языков) — показывается на странице бота/в Mini App Store |
| Настройки пользовательских тем | «Позволять пользователям создавать темы (topics) в личном чате с ботом» — тумблер появился в BotFather Mini App (Bot API 9.4) |
| Подключение **Serverless** (опционально) | Отдельный токен CLI Access, Git-проект на инфраструктуре Telegram; см. [serverless.md](https://core.telegram.org/bots/serverless.md) |
| Bot-to-Bot / Secretary / Guest / Management Mode | Тумблеры режимов — влияют и на Mini App сценарии |

> Альтернатива: тот же функционал в [@BotFather Mini App](https://t.me/BotFather?startapp) — более современный UI, эквивалентные возможности.

## 2. Menu Button

Варианты кнопки слева от поля ввода в приватном чате:

- **Commands** (по умолчанию) — кнопка открывает меню команд;
- **Web App / Mini App** — кнопка запускает Mini App с заданным URL (`MenuButtonWebApp { text, web_app: { url } }`).

Настройка:

- глобально для всех пользователей: BotFather `/setmenubutton` (или Bot Settings → Menu Button);
- персонально/динамически: Bot API `setChatMenuButton(chat_id?, menu_button?)` / `getChatMenuButton(chat_id?)` (без chat_id — дефолтное). Пример: менять текст кнопки по языкам.

Поведение открытого Mini App из меню идентично [inline button](05-miniapp-api.md#12-inline-button-mini-apps): получит `initData`, `themeParams`, `query_id`. См. [05, раздел 1](05-miniapp-api.md#1-все-способы-запуска-мини-приложений).

## 3. Direct Link Mini App

| Формат | Путь | `startapp` | Семантика |
|---|---|---|---|
| Main Mini App | `https://t.me/<bot>?startapp` `...&mode=compact` | → `start_param` + `tgWebAppStartParam` (GET) | Открыть Main Mini App в текущем чате; контекст чата `chat_type`/`chat_instance`; пользователь не может уменьшить (кроме `mode=compact`) |
| Direct Link Mini App (named) | `https://t.me/<bot>/<appname>?startapp=<param>&mode=compact` | то же | После Bot API 7.6 по умолчанию full-screen; **нет доступа к чату**; без чата — отправка через inline |
| Attachment link | `https://t.me/<bot>?startattach` / `&choose=users+bots` / `?attach=<bot>&startattach=` | то же | Открыть Mini App в attachment menu конкретного чата (с выбором типов чатов) |
| Start link | `https://t.me/<bot>?start=<param>` | — | `/start <param>` (чат, не Mini App) |
| Game link | `t.me/<bot>?game=<short_name>` | — | HTML5 игра |

Параметр `startapp`: **A-Za-z0-9_-**, **≤ 512 символов** (Bot API 6.8+); `tgWebAppStartParam` доступен как GET-параметр до загрузки страницы; `start_param` — в `initDataUnsafe`. Mini App видит `chat_type`: `sender|private|group|supergroup|channel` и `chat_instance` (идентификатор контекста для мультиплеера) только у Main/Direct Link запусков.

## 4. Main Mini App и Mini App Store

Main Mini App (Bot API 7.8, [July 2024](https://core.telegram.org/bots/api-changelog.md#july-31-2024)):

- Профиль бота получает кнопку **Launch app**;
- бот показывается в разделе *Apps* поиска для тех, кто его запускал;
- можно загрузить **media preview demos** (несколько языков) — видно в профиле и в *Mini App Store*;
- режим открытия: full-screen по умолчанию (уменьшить можно только через `mode=compact`);
- **Mini App Store**: ежемесячно 500M+ пользователей Mini Apps по данным Telegram; featured выбираются по принципу «обогатить экосистему»: нужен Main Mini App + платежи в Telegram Stars + качественные превью + соблюдение [design guidelines](https://core.telegram.org/bots/webapps.md#design-guidelines).

Источники: [features.md Mini App Store](https://core.telegram.org/bots/features.md#mini-app-store), [webapps.md Launching the main Mini App](https://core.telegram.org/bots/webapps.md#launching-the-main-mini-app).

## 5. Требования к хостингу и URL

- URL Mini App — **HTTPS**, публично доступен (кроме test-окружения, где допустим HTTP);
- `login_url` (seamless auth) — только **HTTPS** (исключение — test environment);
- скрипт `telegram-web-app.js` — **первым** в `<head>`;
- заголовки: нельзя `X-Frame-Options` / жёсткий `frame-ancestors` (Mini App открывается в iframe в Telegram Web);
- домен не обязан совпадать с доменом webhook — это разные URL;
- `Content-Disposition: attachment; filename="…"` + `Access-Control-Allow-Origin: https://web.telegram.org` для `downloadFile`;
- мини-чеклист cache-busting: хэши в именах ассетов (Vite `/assets/*`) — при `tgcloud.jsonc` ключ `immutable`.

### 5.1. Telegram Serverless (`app<id>.tgcloud.ai`)

Если фронт деплоится вместе с ботом через `tgcloud`:

```jsonc
{
  "$schema": "./node_modules/@tgcloud/cli/schema/tgcloud.json",
  "static": {
    "source": "dist",           // Vite → dist; Next/Nuxt → static export
    "spa": true,                // index.html на неизвестные пути без расширения
    "immutable": ["/assets/*"], // только для content-hashed файлов
    "headers": [{ "path": "/*", "set": { "Referrer-Policy": "no-referrer" } }],
    "redirects": [{ "from": "/old", "to": "/new", "status": 301 }]
  }
}
```

- `push` **не собирает** фронт — нужен `npm run build` (или `npm run deploy`);
- запрещается свой код под `/api/` (там Serverless endpoints);
- `static: false` — удалить сайт на следующем push; удаление ключа — просто перестать им управлять;
- файл `tgcloud.jsonc` в корне; `.tgcloud/` — в `.gitignore`;
- либо `"static": "dist"` — сокращение для `{ "source": "dist" }`.

Полный контракт: [serverless.md](https://core.telegram.org/bots/serverless.md).

## 6. Валидация initData (обязательный шаг)

`initData` — подписанная строка параметров запуска Mini App. Проверяйте **на сервере** до использования любых полей. `initDataUnsafe` — только для отрисовки интерфейса до ответа сервера.

**Алгоритм (ботовой токен известен):**

```
data_check_string = concat строк `key=value` по ВСЕМ полям (кроме hash и signature),
                     отсортированным по ключу, разделённые '\n' (0x0A)
secret_key        = HMAC_SHA256(key = "WebAppData", data = bot_token)
hash              = hex(HMAC_SHA256(key = secret_key, data = data_check_string))
сравнить hash со значением поля hash (побайтно/const-time)
```

**Третья сторона (без bot_token):** поле `signature` — base64url Ed25519-подпись над строкой:

```
data_check_string = "<bot_id>:WebAppData\n" + сортированные key=value (кроме hash, signature)
public_key = "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d"  (prod)
           = "40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec"  (test)
Ed25519_verify(public_key, data_check_string, base64url_decode(signature))
```

**Дополнительно:** сверяйте `auth_date` (unixtime формирования) с допустимой дельтой (например, ≤ 24 ч). Complex-значения (`user`, `chat`, …) — JSON-строки; `user.id` до 52 значащих бит (64-бит / double).

Поля `initData`: `query_id`, `chat_join_request_query_id`, `user`, `receiver`, `chat`, `chat_type`, `chat_instance`, `start_param`, `can_send_after`, `auth_date`, `hash`, `signature`. Полные поля `WebAppUser`/`WebAppChat` — в [05](05-miniapp-api.md#84-webappinitdata-и-webappuser--webappchat).

Ошибки валидации: рассинхрон часов (auth_date), неверный `data_check_string` (порядок/лишние поля), не тем ключом подписано — используйте готовые библиотеки (php: `tgWebValid`, java: telegrambots, js: `@telegram-apps/sdk` и т. п. — это неофициальные SDK).

## 7. Безопасность Mini App (что включить/проверить)

- **Origin-ограничение (Bot API 10.2, июль 2026):** методы Mini App доступны только с того же origin, что и сама Mini App. Включается автоматически для всех приложений с ~20.07.2026; opt-out — через BotFather Mini App (и тогда ответственность — на боте).
- `initDataUnsafe` без проверки — никогда.
- Всегда проверяйте `auth_date`.
- Кнопки Telegram (MainButton/BackButton и пр.) не дублируйте нативной вёрсткой — UX-шов виден сразу.
- Никаких токенов в `localStorage` — для секретов только **SecureStorage** (iOS Keychain / Android Keystore).
- Официальная документация говорит: Mini Apps «не должны включать ссылки на недоверенные сайты» (ToS).
- `downloadFile` — нужны заголовки `Content-Disposition` и `Access-Control-Allow-Origin: https://web.telegram.org`.
- Внешние SDK/билдеры проверяйте через **Ed25519-flow** (без передачи bot_token третьей стороне).

## 8. BotFather: Complete List of Mini App Settings (краткая карта)

| Где | Что настраивается |
|---|---|
| `/mybots → Bot Settings → Configure Mini App` | URL, splash screen (иконка/цвета), Main Mini App toggle + previews (языки), attachment menu, домен |
| `/setmenubutton` | Текст и URL кнопки меню; или через API |
| `/setdomain` | Домен для [Telegram Login Widget](https://core.telegram.org/widgets/login.md) и `login_url` |
| `/setcommands` | Команды (если меню-команды) |
| BotFather → Serverless | Включить Serverless; **CLI Access → Access token** (`app<id>:<secret>`); удалённое редактирование handlers/endpoints/lib/БД/files |
| BotFather → Bot Settings → Configure Attachment Menu (`/setattach`) | URL Mini App для скрепки; типы чатов (private/group/supergroup/channel); test server — доступно всем |
| BotFather Mini App (t.me/BotFather?startapp) | То же через Mini App-интерфейс + тумблеры Guest Mode / Secretary Mode / Bot-to-Bot / Management Mode / темы в личке |
| Splash Screen Preview | Проверка итогового экрана загрузки |

## 9. Чеклист Mini App перед запуском

- [ ] HTTPS (кроме test env), страница отвечает 200, без X-Frame-Options
- [ ] `telegram-web-app.js` — первый в `<head>`; `ready()` вызывается после отрисовки критического UI
- [ ] `initData` валидируется на сервере (алгоритм из раздела 6); `auth_date` проверяется
- [ ] `initDataUnsafe` не используется как источник истины
- [ ] `user.id` хранится в 64 бита
- [ ] Кнопки/меню/splash соответствуют Telegram UI (`isVersionAtLeast` для новых фич)
- [ ] `setHeaderColor`/`setBackgroundColor` синхронизированы с `themeParams` (dynamic theming)
- [ ] Safe area / content safe area учитываются (особенно fullscreen)
- [ ] `isOrientationLocked`, `isFullscreen`, `isActive` обрабатываются корректно
- [ ] HapticFeedback используется вместо кликов; закрытие с подтверждением там, где нужно (`enableClosingConfirmation`)
- [ ] Валюта цифровых товаров — **только Stars (XTR)**; физтовары — провайдеры с `/setdomain`-подобным онбордингом
- [ ] `successful_payment` — единственный триггер выдачи товара
- [ ] Mini App Store критерии (если целитесь попасть): Main Mini App + Stars + превью + качество
- [ ] `tgcloud push` не запускает сборку — фронт собран до деплоя (или `npm run deploy`)
- [ ] Отлажено на реальных устройствах (iOS Safari / Android WebView / Desktop через debug mode, см. [05 §10](05-miniapp-api.md#10-тестирование-и-отладка))
