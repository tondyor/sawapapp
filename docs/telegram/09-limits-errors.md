# 09. Лимиты и ошибки — сводная таблица

Все численные ограничения платформы в одном месте + коды ошибок и как их обрабатывать. Каждое значение сверено с официальной документацией 2026-11-06; ссылки в тексте.

## 1. Лимиты на отправку и доставку

| Лимит | Значение | Источник |
|---|---|---|
| Частота `getUpdates` | ваш сервер опрашивает сам; ответы хранятся ≤ **24 ч** | [api.md](https://core.telegram.org/bots/api.md#getting-updates) |
| Апдейтов за раз `getUpdates` | до **100** (`offset` — подтверждение) | [faq.md](https://core.telegram.org/bots/faq.md) |
| Доставка webhook | 1 апдейт на запрос; уровень 40 по умолчанию; `max_connections` **1–100** (local server: до 100 000) | [setWebhook](https://core.telegram.org/bots/api/methods/setwebhook.md) |
| Сообщения в секунду (broadcast) | ~**30/с** всем ботам (0.1 Star/msg сверх при включенных платных рассылках) | [faq.md](https://core.telegram.org/bots/faq.md#how-can-i-message-all-of-my-bot-39s-subscribers-at-once) |
| Сообщения в один чат | не более **1/с** (короткие всплески возможны, потом 429) | [faq.md](https://core.telegram.org/bots/faq.md#my-bot-is-hitting-limits-how-do-i-avoid-this) |
| Сообщения в группу | не более **20/мин** | [faq.md](https://core.telegram.org/bots/faq.md) |
| Платные рассылки (входной порог) | faq.md: **100 000 Stars + 100 000 MAU** против api.md/features.md: **10 000 Stars** — противоречие, см. BotFather | [Faq/Issues](https://core.telegram.org/bots/faq.md#how-can-i-message-all-of-my-bot-39s-subscribers-at-once), [api.md](https://core.telegram.org/bots/api.md#paid-broadcasts) |
| Stars за сообщение сверх 30/с | **0.1** (только успешно доставленные) | [api.md](https://core.telegram.org/bots/api.md#paid-broadcasts) |
| Платные рассылки максимум | **1000 msg/s** | [faq.md](https://core.telegram.org/bots/faq.md) |
| Эфемерные сообщения (обычные боты, без callback_query/reply-эфемерного) | **15 секунд** после вызвавшего события; админы — в любое время | [api.md](https://core.telegram.org/bots/api.md#ephemeral-messages-and-commands) |
| `answerPreCheckoutQuery` | **10 секунд**, иначе транзакция отменена | [payments*.md](https://core.telegram.org/bots/payments-stars.md#3-pre-checkout) |
| `callback_query` (ответ) | «стрелочка» на кнопке пока не ответите; времени жёстко не задано, но отвечают «сразу» | практика/docs |
| `stopMessageLiveLocation` | live location редактир. до expire | — |
| Длина сообщения | **1–4096** символов (sendMessage) | [sendMessage](https://core.telegram.org/bots/api/methods/sendmessage.md) |
| Длина подписи к медиа | ≤ **1024** символов | практика API |
| `callback_data` | ≤ **64 байт** | [InlineKeyboardButton](https://core.telegram.org/bots/api/types/inlinekeyboardbutton.md) |
| Кнопки popup (`showPopup`) | 1–3 | [webapps.md](https://core.telegram.org/bots/webapps.md#popupparams) |
| Inline results | ≤ **50** на `answerInlineQuery` | [answerInlineQuery](https://core.telegram.org/bots/api/methods/answerinlinequery.md) |
| Варианты в опросе | до **12** (минимум 1) | [poll](https://core.telegram.org/bots/api/types/poll.md) |
| Вопрос опроса | ≤ **300** символов (Bot API 5.0+) | changelog |
| Rich message | ≤ **32 768** UTF-8 симв., **500** блоков, **16** уровней, **50** медиа, **20** колонок | [rich-messages.md](https://core.telegram.org/bots/api/rich-messages.md#rich-message-limits) |
| Уровни вложенности форматирования (обычный текст) | смежные правила в [formatting.md](https://core.telegram.org/bots/api/formatting.md) | — |

## 2. Лимиты файлов

| Лимит | Значение | Источник |
|---|---|---|
| Загрузка multipart (официальный Bot API) | фото ≤ **10 MB**; прочие ≤ **50 MB** | [api.md](https://core.telegram.org/bots/api.md#sending-files) |
| Оправка по URL | фото ≤ **5 MB**; прочие ≤ **20 MB**; mime обязателен; PDF/ZIP для документов; voice — только ogg ≤ 1 MB | [api.md](https://core.telegram.org/bots/api.md#sending-files) |
| Скачивание `getFile` | ≤ **20 MB** (без лимита в Local Bot API Server) | [faq.md](https://core.telegram.org/bots/faq.md) |
| Отправка по `file_id` | **без лимита** | [api.md](https://core.telegram.org/bots/api.md#sending-files) |
| Отправка по URL для sendDocument | только **.PDF/.ZIP** | [api.md](https://core.telegram.org/bots/api.md#sending-files) |
| Local Bot API Server | upload ≤ **2000 MB**; любой порт; HTTP webhook; 100k connections | [api.md](https://core.telegram.org/bots/api.md#using-a-local-bot-api-server) |
| Видео-кружок | ≤ 1 минуты | [sendVideoNote](https://core.telegram.org/bots/api/methods/sendvideonote.md) |
| Voice note | ogg/opus ≤ 1 MB; 1–20 MB будут отправлены как файлы | [api.md](https://core.telegram.org/bots/api.md#sending-files) |
| `file_id` | уникален **на бота**; между ботами не переносится; у одного файла может быть несколько id | [api.md](https://core.telegram.org/bots/api.md#sending-files) |
| `file_unique_id` | стабилен между ботами, но не годится для скачивания | [api.md](https://core.telegram.org/bots/api.md#sending-files) |
| Video > большой чат | может уходить с `message_id=0` и отложенной отправкой до перекодирования (с 01.12.2024) | [7.11 warning](https://core.telegram.org/bots/api-changelog.md) |

## 3. Лимиты хранилищ Mini App

| Хранилище | Лимит |
|---|---|
| CloudStorage | 1024 ключа; ключ 1–128 симв. `[A-Za-z0-9_-]`; value ≤ 4096 симв. |
| DeviceStorage | 5 MB/user |
| SecureStorage | 10 элементов/user |
| `localStorage` в WebView | зависит от клиента (не используйте без нужды) |
| `initData.user.id` | ≤ 52 значащих бита (64-bit int / double) |

## 4. Ограничения на входящие

| Ограничение | Значение |
|---|---|
| Апдейты на любого бота | все сообщения живут ≤ **24 ч** |
| Privacy mode ВКЛ | только: команды для него; общие команды если он последний писал; inline; ответы на его сообщения; **всегда**: сервисные + приватка + каналы |
| Privacy-disabled | все сообщения, кроме ботов-ботов |
| Гостевой бот | только конкретный триггер (тег/ответ); ответ **один раз**; до **3** ботов в сообщении; нет истории |
| Бот-to-бот в личке | только при включённом Bot-to-Bot Mode на **обеих** сторонах |
| Ответ за **бизнес** | private chats с incoming ≤ 24 ч (`can_reply`); `business_connection_id` обязателен |
| Собеседник для join requests | guard-бот с правом `can_invite_users` |
| Пользователи mini app | `WebAppInitData` подпись — HMAC-SHA-256 (порядок!) |

## 5. Сети и порты (webhook)

| Параметр | Значение |
|---|---|
| IPv6 | не поддерживается (только IPv4) |
| Порты | **443, 80, 88, 8443** |
| TLS | 1.2+; SSL/и ранний 1.0 — нет |
| Сертификат | CN = ваш домен (или SAN); self-signed: файл `certificate` + PEM pubkey; wildcard может не поддерживаться; redirects — нет |
| IP-диапазоны Telegram | `149.154.160.0/20`, `91.108.4.0/22` (могут меняться) |
| CN и self-signed | CN может быть IP |
| 410 Gone | если сервер отвечает 410 > 23 ч — webhook удаляется |
| `Retry-After` | Telegram учитывает заголовок при повторе |
| Ограничение доступа | firewall allowlist на указанные подсети |

## 6. Коды ошибок Bot API

Конверт: `{ok:false, error_code: N, description: "...", parameters?: {...}}`. `parameters` бывают: `retry_after` (429), `migrate_to_chat_id` (группа→супергруппа), `business_connection_id`.

| Код | Типовые случаи и реакция |
|---|---|
| **400** | `chat not found` (бот не видит чат), `message text must contain non-empty text`, `message is too long`, `can't parse entities` (неверный HTML/MarkdownV2 эскейпинг), `QUERY_ID_INVALID` (устарел/чужой/уже использован), `message to edit not found`, `message is not modified`, `can't find message` (удалено), `wrong file type`, `FILE_REFERENCE_EXPIRED` (перекачать getFile), `can't parse reply keyboard markup`, `chat_join request query ... expired` → логировать, не ретраить как есть |
| **401** | `Unauthorized` — неверный токен, отозван, опечатка; **не ретраить** |
| **403** | `bot was blocked by the user`, `bot was kicked` / `kicked from group`, `can't send messages to bots` (B2B без mode), `need administrator rights`, `user is deactivated`, `have no rights to send a message` → обработчик обязан трактовать как «недоступен» и прекратить попытки |
| **404** | Метод не найден/устарел (редкость) |
| **409** | `Conflict: can't use getUpdates and webhook simultaneously` — порядок: `logOut` при переходе на local; не запускать два поллера |
| **429** | `Too Many Requests: retry after N` — **обязательно** ждать `retry_after` секунд; не захардкоживать лимиты; экспоненциальный backoff + jitter |
| **5xx** | Внутренняя ошибка Telegram — ретрай с backoff (например, 1/2/4/8 c, jitter), алертинг при долгая > 5 мин |

### parameters

- `retry_after` — пауза в секундах (число), приходит с 429;
- `migrate_to_chat_id` — новый id чата после миграции; сохраните маппинг;
- `business_connection_id` — для ошибок, специфичных бизнес-подключения.

### Стратегия ретраев (рекомендованный паттерн)

1. Идемпотентность: `update_id` как ключ; для send-операций — свой `client_message_id` в payload'е.
2. 429 → `sleep(retry_after)`; 5xx → backoff; 400/401/403 → в DLQ и алерт.
3. Сотовый метод `answerCallbackQuery` должен отвечать всегда — даже в ошибке (иначе UX).

## 7. Состояния и измерения (что мониторить)

- `pending_update_count`, `last_error_date`, `last_error_message`, `last_synchronization_error_date`, `ip_address` — из `getWebhookInfo` (проверяйте раз в минуту/health-check);
- request/response conversion (ответы на сообщения, inline answer rate, callback answer rate) — BotFather шлёт alerts популярным ботам (~300 rpm);
- `message_id == 0` у «отложенных» видео-сообщений — не выбирать ответы по нему;
- `file_reference` в ответах getFile **протухает** (обычно ~1 ч) — перекачать;

## 8. Гарантии и их отсутствие

| Гарантия | Есть? |
|---|---|
| Доставить апдейт хотя бы раз (at-least-once) | да (пока ≤ 24 ч) |
| Ровно один раз (exactly-once) | нет — зашивайте дедупликацию |
| Порядок апдейтов | `update_id` монотонен, но параллельный webhook-обработчик может нарушить порядок |
| Доставить ответ пользователю | нет (блок/отписка/удалён чат) |
| Сохранить файлы | нет (старые сообщения могут быть вытеснены) |
| Конфиденциальность бизнес-данных | на вас: rights, минимальный доступ, шифрование |
