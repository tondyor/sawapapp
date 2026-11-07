# 01. Архитектура платформы Telegram Bots

> Источники (открыты целиком 2026-11-06): [bots.md](https://core.telegram.org/bots.md), [api.md](https://core.telegram.org/bots/api.md), [faq.md](https://core.telegram.org/bots/faq.md), [webhooks.md](https://core.telegram.org/bots/webhooks.md), [features.md](https://core.telegram.org/bots/features.md), [serverless.md](https://core.telegram.org/bots/serverless.md), [api-changelog.md](https://core.telegram.org/bots/api-changelog.md).

## 1. Три уровня «разговора с Telegram»

| Уровень | Для кого | Что это | Чем документировано |
|---|---|---|---|
| **Bot API** | Все, кто делает ботов | Упрощённый HTTPS-интерфейс поверх Telegram API. JSON-ответы, методы `bot<token>/<METHOD>` | [core.telegram.org/bots/api.md](https://core.telegram.org/bots/api.md) |
| **MTProto API** | Разработчики клиентов (имплементации Telegram), продвинутые интеграции | Полный низкоуровневый протокол Telegram | [core.telegram.org/api](https://core.telegram.org/api) |
| **TDLib** | Промышленные клиенты/сервисы поверх полного API | Официальная библиотека-клиент поверх MTProto | [core.telegram.org/tdlib](https://core.telegram.org/tdlib) |

Бот — это обычный (особый) аккаунт Telegram без номера телефона, привязанный к **вашему** серверу. Telegram выступает посредником: принимает входящие сообщения/действия, делает с ними ровно то, что описано в Bot API, и доставляет их вам. Шифрование и доставка до серверов Telegram — забота платформы; шифрование данных внутри вашей инфраструктуры — ваша.

### Отличия бота от обычного аккаунта (официально, [bots.md](https://core.telegram.org/bots.md#how-are-bots-different-from-users))

- нет статуса «был в сети» — вместо него бейдж `BOT`;
- **ограниченное облачное хранилище**: старые сообщения могут быть удалены сервером вскоре после обработки;
- **бот не может сам начать разговор**: пользователь должен первым написать боту или добавить его в чат/группу;
- при добавлении в группу бот видит только **релевантные** сообщения (privacy mode, см. [03, раздел 5.3](03-chat-bot-settings.md#53-privacy-mode-по-умолчанию-вкл));
- бот — не человек: он не ест, не спит и не жалуется.

## 2. Транспорт Bot API

- Схема вызова: `https://api.telegram.org/bot<token>/<METHOD_NAME>`. Методы **case-insensitive**.
- HTTP-методы: **GET** и **POST**. UTF-8.
- Способы передачи параметров (любые из четырёх):
  1. query string (`?chat_id=…&text=…`);
  2. `application/x-www-form-urlencoded`;
  3. `application/json` (**кроме загрузки файлов**);
  4. `multipart/form-data` (**для файлов**).
- Ответ всегда JSON: `{ "ok": true, "result": … }` либо `{ "ok": false, "error_code": N, "description": "…", "parameters": { … }? }`.
  - `parameters.retry_after` — за сколько секунд повторить (при 429);
  - `parameters.migrate_to_chat_id` — куда переехал чат (группа → супергруппа);
  - `parameters.business_connection_id` — если ошибка относится к бизнес-подключению.
- Ошибки непредсказуемо меняются во времени по содержимому `description`; код `error_code` — subject to change. Стройте обработку на `error_code`, а не на тексте.
- Целочисленные поля можно хранить в **32-bit signed integer**, но `id` пользователя/чата и некоторые даты/счётчики могут превышать это: используйте **64-bit** (или double); пользовательским id нужно до **52 значащих бит**.
- Источник: [api.md «Making requests»](https://core.telegram.org/bots/api.md#making-requests).

### Ответ на апдейт (webhook-режим)

При получении апдейта через webhook можно тут же ответить вызовом метода, вернув его в теле ответа: в `application/json`, `application/x-www-form-urlencoded` или `multipart/form-data` указывается параметр `method` с именем метода. Узнать результат или факт успеха **нельзя**. Либо после апдейта сделать обычный POST в `api.telegram.org`. Подробности: [faq.md «How can I make requests in response to updates?»](https://core.telegram.org/bots/faq.md#how-can-i-make-requests-in-response-to-updates).

## 3. Доставка апдейтов: getUpdates против webhook

Оба способа взаимоисключающие: пока установлен webhook, long polling не работает (и наоборот). Апдейты хранятся на сервере **не более 24 часов** независимо от способа. Гарантия доставки — «хотя бы раз»: **обрабатывайте дубликаты** (дедупликация по `update_id`).

| | getUpdates (long polling) | setWebhook (push) |
|---|---|---|
| Механика | Ваш сервер спрашивает `getUpdates?offset=<last+1>&timeout=25` | Telegram сам POST-ит каждый апдейт на ваш HTTPS-URL |
| Подтверждение | Параметр `offset` = `update_id последнего` + 1; всё ≤ offset считается подтверждённым | Ответом 200 OK (иначе Telegram повторяет; см. также `Retry-After`) |
| Пакет | До **100** апдейтов за вызов | 1 апдейт на запрос |
| Требования | Ничего, кроме токена | Публичный IPv4-хост, TLS 1.2+, допустимые порты, валидный сертификат (CN/SAN совпадает с доменом) |
| Подходит для | Разработки, простых ботов, сред с непредсказуемым входом | Продакшна, высокой нагрузки |
| Частота запросов | Активное ожидание 25 с ≈ почти нулевой трафик | Нет опроса вообще |

Источники: [api.md «Getting updates»](https://core.telegram.org/bots/api.md#getting-updates), [webhooks.md](https://core.telegram.org/bots/webhooks.md), [faq.md](https://core.telegram.org/bots/faq.md#how-do-i-get-updates).

### 3.1. Webhook — жёсткие требования

Официальный минимум ([webhooks.md](https://core.telegram.org/bots/webhooks.md#the-short-version)):

- сервер поддерживает **IPv4** (IPv6 сейчас не поддерживается);
- принимает входящие POST от подсетей **`149.154.160.0/20`** и **`91.108.4.0/22`** на порты **443, 80, 88, 8443**;
- TLS 1.2+ (SSL/старые TLS не поддерживаются);
- сертификат: проверенный или self-signed; CN или SAN должен **точно** совпадать с доменом webhook;
- цепочка сертификатов должна быть полной (intermediate в комплекте);
- redirects не поддерживаются; wildcard-сертификаты могут не работать;
- при смене хоста — проверяйте [IF-range](https://core.telegram.org/bots/webhooks.md) (он может меняться).

Дополнительно (по [setWebhook](https://core.telegram.org/bots/api/methods/setwebhook.md) и практике):

- порт можно указать в URL (`https://host:88/path`);
- `secret_token` — произвольная строка 1–256 символов `A-Za-z0-9_-`; Telegram добавляет её в заголовок `X-Telegram-Bot-Api-Secret-Token` — проверяйте на входе, чтобы отличать настоящий webhook от чужих POST;
- `max_connections` — от **1 до 100** (по умолчанию 40);
- `allowed_updates` — список полей `Update`, которые вы хотите получать (пусто = все, кроме `chat_member`, `message_reaction`, `message_reaction_count`, `poll_option` — эти нужно просить явно);
- получив `Retry-After` в вебхуховом запросе, Telegram подождёт указанное время; если ваш endpoint отвечает **410 Gone** на протяжении > 23 часов подряд, webhook может быть **автоматически удалён**;
- при ошибках доставки бот видит их в `getWebhookInfo` (`last_error_date`, `last_error_message`, `last_synchronization_error_date`).

### 3.2. Dedicated test environment

Полностью отдельная среда для тестов ([features.md «Testing your bot»](https://core.telegram.org/bots/features.md#testing-your-bot)):

- нужен **новый аккаунт** и **новый бот**;
- URL вида `https://api.telegram.org/bot<token>/test/<METHOD_NAME>`;
- допускаются **HTTP**-ссылки без TLS для `LoginUrl` и `WebAppInfo`;
- **flood limits не повышены** и могут быть строже — не зашивайте в код конкретные значения, используйте retry_policy;
- вход: iOS — тапнуть 10 раз по иконке «Настройки» → **Accounts → Login to another account → Test**; Linux/Windows Desktop — ☰ Settings → Shift+Alt+правый клик «Add Account» → **Test Server**; macOS — 10 тапов по иконке настроек (Debug Menu) → ⌘+click «Add Account».

### 3.3. Local Bot API Server (`tdlib/telegram-bot-api`)

Открытый исходный код сервера: <https://github.com/tdlib/telegram-bot-api>. Ваши запросы идут на ваш экземпляр вместо `api.telegram.org`. Перед переключением **обязательно** вызовите `logOut` для бота.

| | Официальный сервер | Локальный сервер |
|---|---|---|
| Скачивание файлов | до 20 MB | без лимита |
| Загрузка файлов | до 50 MB (фото — 10 MB) | до **2000 MB** |
| Загрузка по URL | 5 MB фото / 20 MB прочие | те же |
| Загрузка по локальному пути / file:// URI | нет | **да** |
| Webhook: URL | только HTTPS | **HTTP разрешён** |
| Webhook: порт | 443, 80, 88, 8443 | любой |
| Webhook: max_connections | 1–100 | 1–100 000 |
| `getFile` отдаёт | file_path для скачивания | **абсолютный локальный путь** файла |
| Передача файлов между ботами | `file_id` уникален на одного бота — нельзя | то же (file_id привязан к боту) |

Источники: [api.md «Using a Local Bot API Server»](https://core.telegram.org/bots/api.md#using-a-local-bot-api-server), [features.md «Local Bot API»](https://core.telegram.org/bots/features.md#local-bot-api), [faq.md](https://core.telegram.org/bots/faq.md#how-do-i-download-files).

### 3.4. Telegram Serverless (новый путь, 2025—2026)

Telegram исполняет ваш код сам — «бот и Mini App на инфраструктуре Telegram» ([serverless.md](https://core.telegram.org/bots/serverless.md)):

- код — обычные JS-модули в V8-песочнице рядом с Bot API и SQLite-базой;
- размещается командой `npx tgcloud push`, миграции — `npx tgcloud migrate` (двухфазно: push не трогает БД);
- ограничения рантайма: нет npm-пакетов, нет файловой системы, нет сети кроме SDK `fetch`, нет `Buffer` (только `Uint8Array`); SDK: `db`, `api` (весь Bot API), `fetch`, `InputFile`, `EndpointError`, `BotApiError`;
- хендлеры `handlers/<update_type>.js` (только если файл существует и не пуст — апдейты нужных типов не будут будить ваш код), эндпоинты `endpoints/*.js` для Mini App (initData **проверяется платформой до вызова**), общие модули в `lib/`, схема БД в `schema.js` (Drizzle-подобный DSL, внешних ключей нет);
- фронтенд Mini App собирается и хостится вместе с ботом на `https://app<app_id>.tgcloud.ai/`;
- Build with AI: каждый проект скелетирован с `AGENTS.md` и `docs/tgcloud-sdk.md` для ИИ-агентов.
- Статус: молодой продукт (docs от 06.10.2026, CLI 0.2.0). Считайте `core.telegram.org/bots/serverless.md` источником истины; `npx tgcloud --help` авторитетен для установленной версии.

Подробнее про связку бот+Mini App на Serverless — [06-bot-miniapp-combo.md](06-bot-miniapp-combo.md#7-telegram-serverless--бэкенд-на-стороне-telegram).

## 4. Жизненный цикл апдейта

1. Пользователь/система делает действие в Telegram (сообщение, клик по кнопке, голосование, join request, бизнес-событие…).
2. Telegram формирует объект `Update` с монотонно растущим `update_id` и одним из полей: `message`, `callback_query`, `inline_query`, `business_message`, `chat_join_request`, `pre_checkout_query`, `poll`, `my_chat_member`, `managed_bot`, `guest_message`, `message_generation_stopped` и т. д. Полный список полей — в [Bot API types: Update](https://core.telegram.org/bots/api/types/update.md).
3. Доставка: `getUpdates` вернёт апдейт (до его подтверждения через `offset`) **или** `POST`-ится на webhook (повторяется до успешной обработки).
4. Апдейт хранится ≤ **24 часов**; после истечения срока он теряется.
5. Ваш бэкенд: проверка подлинности (секрет webhook), дедупликация по `update_id`, авторизация, бизнес-логика, по возможности быстрый ответ; тяжёлую работу — в очередь.
6. Ответ пользователю — обычные методы `send*` / `editMessage*`. Для callback_query — **всегда** вызывайте `answerCallbackQuery`, иначе пользователь видит «крутилку».

## 5. Идентификаторы и файловые ссылки

- `file_id` — уникален **на одного бота** и не передаётся между ботами; сам факт «один и тот же файл» не гарантирует один и тот же `file_id` (у одного файла может быть несколько валидных `file_id` для одного бота).
- `file_id` персистентен (можно хранить в БД и использовать повторно).
- Качать файл: `getFile` → `https://api.telegram.org/file/bot<token>/<file_path>`; лимит 20 MB.
- Отправка файла: (1) по `file_id` — без лимитов; (2) по URL — 5 MB (фото) / 20 MB (прочие), корректный MIME обязателен; voice — только audio/ogg ≤ 1 MB (иначе станет документом); (3) multipart upload — 10 MB фото / 50 MB прочие.
- `file_unique_id` стабильный между ботами, но не пригоден для скачивания.

Источник: [api.md «Sending files»](https://core.telegram.org/bots/api.md#sending-files).

## 6. Что Telegram делает для вас автоматически (и чего не делает)

**Делает:** транспорт и шифрование, хранение апдейтов (24 ч), подтверждение через offset, подписи (HMAC/Ed25519) данных Mini App (`initData` — вы только проверяете), расчёт highscore для игр, отправка апдейта в обеих средах, платежи-посредничество (Telegram не хранит карты).

**НЕ делает:** не хранит вашу базу пользователей/чаты (БД — ваша забота); не гарантирует exactly-once доставку (зашита идемпотентность); не ограничивает бизнес-логику; не предоставляет LLM (модели — ваши); не гарантирует доставку сообщений (пользователь мог заблокировать бота, удалить чат, быть в недоступном регионе); не обрабатывает споры по платежам (это вы и провайдер).

## 7. Карта «что где живёт»

```
Пользователь / Группа / Канал / Бизнес-аккаунт / Гостий-бот
        │  действия (messages, clicks, payments…)
        ▼
   Telegram (MTProto, зашифровано)
        │  Update → Bot API
        ▼
  ┌──────────────┬─────────────────────┬──────────────────────┐
  │ getUpdates   │ webhook (ваш HTTPS) │ Telegram Serverless  │
  │ (pull)       │ (push, порт 443…)   │ (V8 sandbox + SQLite)│
  └──────┬───────┴─────────┬───────────┴───────────┬──────────┘
         ▼                 ▼                       ▼
   Ваш бэкенд → Bot API methods → Telegram → пользователю
                                   │
                                   ├── Bot API Server (свой, без лимитов файлов)
                                   └── MTProto/TDLib — только если вы делаете клиент
```

Дополнительные точки входа — Mini App (JS в WebView, см. [05](05-miniapp-api.md)), Inline mode (запрос из поля ввода, см. [03, раздел 9](03-chat-bot-settings.md#9-inline-mode)), HTML5 Games (см. [02, раздел 18](02-bot-api-reference.md#18-игры-html5-games--callbackgame) и [05](05-miniapp-api.md)).

## 8. Известные особенности и подводные камни

1. **Один privacy-enabled бот на сообщение**, если в ответе боту одновременно есть явная команда другому боту/отправка через другого бота — апдейт получит только бот с приоритетом (reply > command).
2. **Ответ реплаем** на сообщение privacy-боту прокидывает сообщение даже вне privacy (это официально задокументировано).
3. **Chat migrate**: группа может превратиться в супергруппу; `migrate_to_chat_id` надо обработать и переучить id.
4. **`update_id` — курсор**: подтверждать только после завершённой обработки.
5. **Long poll 100 апдейтов**; на больших ботах — батчинг/очередь; тайм-ауты.
6. **webhook 1–100 соединений** (100 000 в локальном сервере).
7. **Тестовые среды флудят так же**, как прод — иногда строже.
8. **Время сервера** у вас и Telegram может различаться — проверяйте `auth_date` с небольшой допустимой дельтой.
9. **`file_id` между средами** (prod/test) не переносим.
10. **video в больших чатах** после 1 декабря 2024 может отправляться с `message_id = 0` и автоматической отсрочкой до перекодирования ([api-changelog.md, 14.11.2024](https://core.telegram.org/bots/api-changelog.md), [7.11](https://core.telegram.org/bots/api-changelog.md#october-31-2024)).
