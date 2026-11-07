# 03. Настройки бота при работе непосредственно через чат

Всё, что настраивает Telegram-бот как собеседник в личке, группе или канале — через BotFather и Bot API. Настройки исключительно для Mini App лежат в [04-miniapp-settings.md](04-miniapp-settings.md).

> Источники: [features.md](https://core.telegram.org/bots/features.md), [bots.md](https://core.telegram.org/bots.md), [faq.md](https://core.telegram.org/bots/faq.md), [api.md](https://core.telegram.org/bots/api.md), [payments*.md](https://core.telegram.org/bots/payments-stars.md).

## 0. Чеклист «создать бота за 10 минут»

1. Написать [@BotFather](https://t.me/botfather) → `/newbot` → указать **имя** и **юзернейм**. Получите токен.
2. `/setdescription` — что делает бот (≤ 512 символов, это «What can this bot do?»). Можно прикрепить фото/видео к этому полю (BotFather → Edit Description Picture).
3. `/setabouttext` — короткое био профиля (≤ 120 символов); уходит вместе со ссылкой при шеринге.
4. `/setuserpic` — аватарку; `/setmyprofilephoto` через API — статика/анимация.
5. `/setcommands` (или API `setMyCommands`) — список команд + описания.
6. Реализовать `/start` (+`/help`, `/settings` при настройках).
7. Выбрать способ доставки апдейтов: long polling (разработка) / webhook (продакшн).
8. Обеспечить обработку дубликатов (`update_id`) и всех типов апдейтов, которые включили в `allowed_updates`.
9. Для запуска в проде: 2FA на аккаунте-владельце, токен в секретах, бэкапы, мониторинг.

## 1. Идентичность бота

| Пункт | Правила / команды |
|---|---|
| Имя (name) | Отображается в контактах; можно менять `/setname` / `setMyName` (с языком) |
| Юзернейм | 5–32 символа; Latin, цифры, `_`; **должен оканчиваться на `bot`** (исключения — отдельные известные боты типа @wiki); **сменить нельзя**; нечувствителен к регистру; можно купить дополнительный collectible-юзернейм на [Fragment](https://fragment.com) |
| Токен | Формат `123456:ABC…`; выдали при создании; компроментация = полный контроль; обновить: `/token`. Никогда не публиковать |
| Аватар | `/setuserpic` / API `setMyProfilePhoto` (статика и анимация) |
| Видео профиля | Редактируется прямо со страницы бота в официальных клиентах |
| Описание | `/setdescription` ≤ 512; API `setMyDescription` (+ `language_code`) |
| About | `/setabouttext` ≤ 120; API `setMyShortDescription` |
| Удаление | `/deletebot` — необратимо, username освобождается |
| Передача владения | `/mybots` → выбрать бота → *Transfer ownership*; только пользователям, кто бота запускал; необратимо |
| Локализация | name/description/short_description/команды — каждое можно задать с `language_code`; при отсутствии — показывается дефолт; `language_code` в апдейте может отсутствовать → fallback: последний записанный → English |
| Права в чатах по умолчанию | `setMyDefaultAdministratorRights` (при добавлении админом группы/канала) |
| Верификация ботом от имени организации | `verifyUser` / `verifyChat` / `remove*Verification` — для организаций, которых представляет бот (см. [verify](https://telegram.org/verify)) |

## 2. Команды

Формат: `/keyword` ≤ **32 символа**; Latin, цифры, подчёркивание. Клиент: подсвечивает, показывает список при наборе `/` (если список задан), добавляет ярлык в меню.

Обязательные глобальные команды (мы требуем со всех разработчиков):

- `/start` — начать взаимодействие (с Deep Linking параметром);
- `/help` — справка;
- `/settings` — настройки (если применимо).

Управление:

- BotFather: `/setcommands` (через запятую с описаниями) и/или `/mybots → Edit Bot → Edit Commands`;
- API: `setMyCommands([{command, description}], scope?, language_code?)` / `getMyCommands` / `deleteMyCommands`.

### 2.1. Scopes команд

Порядок приоритета для приватного чата: `Chat+lang` → `Chat` → `AllPrivateChats+lang` → `AllPrivateChats` → `Default+lang` → `Default`.
Для групп/супергрупп: `ChatMember+lang` → `ChatMember` → `ChatAdministrators+lang` → `ChatAdministrators` → `Chat+lang` → `Chat` → `AllChatAdministrators+lang` → `AllChatAdministrators` → `AllGroupChats+lang` → `AllGroupChats` → `Default+lang` → `Default`.

Важно: **апдейт не содержит информации об scope**, а может вообще не содержать зарегистрированную команду — всегда валидируйте и авторизуйтесь на бэкенде, даже если «вроде бы команда только для админа».

### 2.2. Эфемерные команды (Bot API 10.2+)

Поле `is_ephemeral: true` в `BotCommand`. Пользователь шлёт команду в группе; она **невидима** остальным и другим ботам; бот отвечает `sendMessage(..., ephemeral_message_parameters=…)`. Идеально для `/summary`, `/help`, `/wip` в публичном чате.

## 3. Клавиатуры

### 3.1. Reply-клавиатура (`ReplyKeyboardMarkup`)

Заменяет системную клавиатуру; кнопки-тексты отправляются как сообщения; кнопки могут: запрашивать пользователя/чат/локацию/контакт/опрос или открывать Mini App (`web_app`).

Полезные поля: `is_persistent`, `resize_keyboard`, `one_time_keyboard`, `input_field_placeholder`, `selective`, `force_reply` (BOT API 10.3, Markup с force_reply). Кнопки могут показывать custom emoji (`icon_custom_emoji_id`) и цвет (`style` — Bot API 9.4).

Типы кнопок (`KeyboardButton`): `text`, `request_users` (`KeyboardButtonRequestUsers` — до 10 пользователей, критерии `request_is_bot`/`request_is_premium`/…, `request_name`/`request_username`/`request_photo`), `request_chat` (`KeyboardButtonRequestChat` — права, типы, members…), `request_contact`, `request_location`, `request_poll` (+`type`: regular/quiz), `web_app` (`WebAppInfo`), `request_managed_bot` (`KeyboardButtonRequestManagedBot`, Bot API 9.6).

### 3.2. Inline-кнопки (`InlineKeyboardMarkup`)

Под сообщением; **не** отправляют сообщения в чат. Виды `InlineKeyboardButton`:

- `callback_data` — до 64 байт; обработчик → ваш сервер; **всегда** `answerCallbackQuery`;
- `url` — открыть ссылку (https/tg://);
- `login_url` (`LoginUrl`) — seamless authorization на сайте (нужен `/setdomain` и HTTPS);
- `switch_inline_query` / `_current_chat` / `switch_inline_query_chosen_chat` (с типами чата);
- `callback_game` — кнопка запуска игры (первая в первом ряду);
- `pay` — кнопка оплаты (только для invoice-сообщений, параметр в кнопку выставляется автоматически);
- `web_app` — открыть Mini App (inline);
- `copy_text` (`CopyTextButton`) — скопировать текст;
- `disabled` — отключённая кнопка (Bot API 10.3);
- кастомные стили/иконки: `style`, `icon_custom_emoji_id` (Bot API 9.4).

Паттерны: навигация по «страницам» через один `callback_data` + `editMessageReplyMarkup`/`editMessageText`; подтверждения через callback; ярлыки для «открытых» действий.

### 3.3. Menu Button

Кнопка слева в поле ввода в личном чате с ботом. Варианты: список команд (по умолчанию), кастомный текст, **запуск Mini App** (`MenuButtonWebApp`). Настройка: глобально — BotFather (`/setmenubutton` или Bot Settings → Menu Button) или `setChatMenuButton` через API (можно разные меню разным пользователям). См. также [04](04-miniapp-settings.md#2-menu-button).

## 4. Deep Linking

| Ссылка | Эффект в личке | Эффект в группе | Mini App |
|---|---|---|---|
| `https://t.me/<bot>?start=<param>` | `/start <param>` | — | — |
| `https://t.me/<bot>?startgroup=<param>` | — | приглашение добавить бота; бот получает `/start@<bot> <param>` | — |
| `https://t.me/<bot>?startattach=<param>` | приглашение в attachment menu | то же | стартует `start_param` |
| `https://t.me/<bot>?startapp=<param>` | запускает **Main Mini App** | запускает Main Mini App (с `chat_type`, `chat_instance`) | `start_param` ≤ 512 символов |
| `https://t.me/<bot>/<appname>?startapp=...` | **Direct Link Mini App** | то же | см. [04](04-miniapp-settings.md#3-direct-link-mini-app) |

Параметр: A-Za-z0-9_-, **≤ 64 символа** (для `start`), ≤ 512 (для `startapp`, Bot API 6.8). Баз64/url-safe; параметр — пользовательский ввод, никогда ему не доверяйте. Источник: [features.md Deep Linking](https://core.telegram.org/bots/features.md#deep-linking).

## 5. Группы: что бот видит

### 5.1. Всегда (независимо от privacy mode)

- все **сервисные сообщения**;
- все сообщения из **приватных чатов** с пользователями;
- все сообщения из **каналов**, где бот — участник.

### 5.2. Администраторы и privacy-disabled

Бот-админ и privacy-disabled бот получают **все сообщения**, кроме написанных **другими ботами** (см. 5.4). Админы всегда видят всё.

### 5.3. Privacy Mode (по умолчанию ВКЛ)

Видит:

- команды, явно адресованные ему (`/command@this_bot`);
- общие команды (`/start`), если он был **последним ботом**, написавшим в группу;
- сообщения, отправленные через него (inline);
- ответы на любые его сообщения.

Дополнительно: когда сообщение одновременно содержит явную команду для другого бота **и** ответ приват-боту — получит только приват-бот; ответы имеют высший приоритет. Privacy-ботов видит пользователь (строка в списке участников). Отключение режима требует **перезалить бота в группу**; рекомендуем вместо этого `force_reply`.

Источник: [features.md Privacy Mode](https://core.telegram.org/bots/features.md#privacy-mode), [faq.md](https://core.telegram.org/bots/faq.md#what-messages-will-my-bot-get).

### 5.4. Боты и другие боты

По умолчанию боты **не видят** сообщения от других ботов, чтобы не было петель. Исключения (только если у бота включён **Bot-to-Bot Communication Mode** в BotFather):

- в группах: `/command@OtherBot` и reply на сообщение бота; если privacy-disabled или бот админ — видит все сообщения ботов;
- в личке: сообщение другому боту по `@username` в `sendMessage` (нужно, чтобы режим был у обоих);
- через бизнес-подключение: бот может слать сообщения ботам своего бизнес-аккаунта (нужно B2B Bot-to-Bot у отправителя).

Обязательны меры против бесконечных петель: дедупликация, rate limiting, максимальная глубина/таймаут диалога. См. [07-ai.md](07-ai.md#4-bot-to-bot-communication-mode) и [features.md](https://core.telegram.org/bots/features.md#bot-to-bot-communication).

## 6. Secretary Mode (Telegram Business)

Бот подключается пользователем к его личному (бизнес) аккаунту и **отвечает от его имени** ([features.md Business Bots](https://core.telegram.org/bots/features.md#business-bots)).

- BotFather: включить **Secretary Mode** для бота.
- Обработчик: апдейты `business_connection` (подключение/изменение/отключение), `business_message`, `edited_business_message`, `deleted_business_messages`.
- Права приходят в `BusinessConnection.rights` (`BusinessBotRights`): `can_read_messages`, `can_reply` (писать/редактировать **в приватных чатах с входящими за последние 24 ч**), `can_delete_outgoing_messages`, `can_delete_all_messages`, `can_edit_name`, `can_edit_bio`, `can_edit_profile_photo`, `can_edit_username`, `can_edit_gift_settings`, `can_change_info`? (полный список — [BusinessBotRights](https://core.telegram.org/bots/api/types/businessbotrights.md)). Всегда проверяйте **последние** права перед действием.
- Отправка от имени: передавайте `business_connection_id` в `sendMessage`, `sendChatAction` и др. (и в `sendInvoice` через `createInvoiceLink(..., business_connection_id=…)`).
- Пользователь получает quick action bar вверху каждого управляемого чата; по кнопке «Manage Bot» бот получает `/start bizChat<user_chat_id>`.
- Учётная запись-владелец бота попадает под [Business TOS §5.4](https://telegram.org/tos/bot-developers#5-4-telegram-business); с 10.0 **Premium не обязателен** для управления аккаунтом бизнес-ботом.

## 7. Guest Mode (гостевой бот)

**BotFather → Bot Settings → Guest Mode** ([features.md Guest Bots](https://core.telegram.org/bots/features.md#guest-bots)).

- Пользователь тегает `@guest_bot` или отвечает на его сообщение в **любом** чате (private/group/supergroup), даже если бот не участник.
- Бот получает выделенный апдейт `guest_message` (`Message` с `guest_bot_caller_user`, `guest_bot_caller_chat`, `guest_query_id`) и может дать **один** ответ: `answerGuestQuery(query_id, result|message)`.
- **Нет доступа** к истории и списку участников; нет будущих апдейтов чата.
- До **3** гостевых ботов в одном сообщении.
- Отлично подходит для ИИ-ассистентов, которые «зовут по имени» (см. [07-ai.md](07-ai.md#2-гостевой-режим-guest-bots)).

## 8. Managed Bots (бот создаёт ботов)

([features.md Managed Bots](https://core.telegram.org/bots/features.md#managed-bots), Bot API 9.6+)

- BotFather (Mini App): у вашего бота включить **Bot Management Mode**.
- Ссылка для пользователя: `https://t.me/newbot/{manager_bot_username}/{suggested_bot_username}?name={Достаточно+места}` — пользователь подтверждает → его создаётся бот.
- Вы, менеджер-бот, получаете `managed_bot` апдейт (`ManagedBotUpdated`: созданный бот, его владелец, действие); дальше — API: `getManagedBotToken`, `replaceManagedBotToken`, `getManagedBotAccessSettings`/`setManagedBotAccessSettings`.
- Кнопка в обычной клавиатуре: `request_managed_bot` (`KeyboardButtonRequestManagedBot`).
- Применение: «личный AI-агент для каждого пользователя без кода» (см. [07-ai.md](07-ai.md#6-managed-bots-бот-создаёт-бота)).

## 9. Inline mode

([inline.md](https://core.telegram.org/bots/inline.md), [features.md](https://core.telegram.org/bots/features.md#inline-requests))

- BotFather: `/setinline` (+ placeholder), `/setinlinegeo`, `/setinlinefeedback` (1/10, 1/100, 1/1000 — нагрузка!).
- Бот получает `inline_query` (запрос, `offset`, `chat_type`, `location` при /setinlinegeo) → отвечает `answerInlineQuery` (до **50** результатов; cached/→ url-based).
- Типы контента — 20 (article/photo/gif/video/audio/voice/document/location/venue/contact/game/invoice/…); вертикальная/горизонтальная прокрутка выбирается клиентом.
- Кнопка «Switch to PM» (`switch_pm_text` deprecated → `InlineQueryResultsButton` с mini app/url) для «подключить/логин» сценариев.
- Inline-бот видит свой username в сообщении, отправленном через него — хороший источник органики.
- Сообщения из inline попадают получателю в чаты разных типов; **`via_bot`** указывает вашего бота — можно учитывать в атрибуции.

## 10. Платные рассылки (Paid Broadcasts)

Базовый лимит: ~30 msg/s на бота. Увеличенный: **до 1000 msg/s** ([api.md Paid Broadcasts](https://core.telegram.org/bots/api.md#paid-broadcasts), [faq.md](https://core.telegram.org/bots/faq.md#how-can-i-message-all-of-my-bot-39s-subscribers-at-once)):

- включается в BotFather (`/mybots → Bot Settings → Paid Broadcasts` — по словам faq.md: нужно ≥ **100 000 Stars** на балансе **и ≥ 100 000 MAU**; по разделам api.md/features.md — ≥ **10 000 Stars**; официальные страницы **противоречат друг другу** — всегда сверяйтесь с текущим BotFather);
- сверх бесплатных 30/s каждая успешно доставленная рассылка стоит **0.1 Star** (списывается с баланса бота);
- сообщения можно пометить `allow_paid_broadcast=true` в send* методах;
- бесплатные сообщения в **один чат** — не более 1/s, в **группу** — не более 20/мин.

## 11. Статус-алерты (BotFather)

Если популярный бот (~300 rpm) перестаёт отвечать на сообщения/инлайн/callback — BotFather пишет владельцу: «Too few private messages», «Too few replies to incoming private messages», «Too few answers to inline queries», «Too few answers to callback queries», «Too few answers to callback game queries».
Кнопки в алерте: **Fixed** (возобновить частые проверки), **Support** (@BotSupport), **Mute for 8h/1w** (не рекомендуется). Один алерт на бота в час. Источник: [features.md Status Alerts](https://core.telegram.org/bots/features.md#status-alerts).

## 12. Языки и локализация

- `language_code` — IETF-тег (может отсутствовать!) в каждом апдейте у `User`;
- name/description/short_description/команды можно задать по языкам;
- интерфейсы, inline-результаты и Mini App должны адаптироваться автоматически (см. `language_code` во всех релевантных апдейтах и в `WebAppInitData.user.language_code`).

## 13. Web Login (через чат-бота)

Чтобы логиниться на сайте «через Telegram» без BotFather Mini App:

1. `/setdomain` — привязать домен к боту;
2. Сам сайт может использовать [Login Widget](https://core.telegram.org/widgets/login.md) — это HTML+JS, данные приходят в callback/redirect; **обязательно** проверяйте подпись SHA256-HMAC (ключ = SHA256(token));
3. Альтернатива — `login_url` кнопка (seamless auth на inline URL-кнопке).

## 14. Через какие UI открыт бот в чате (схема)

```
User → Нажал Start → глубокая ссылка или поиск
   │
   ├─ Публичный диалог: текст, клавиатуры, inline, файлы, опросы, платежи, callback,
   │   эфемерные сообщения, стрим-черновики, темы (личный диалог с ботом)
   ├─ Группа/супергруппа/канал: privacy-ограничения, админ-функции, топики,
   │   директы каналов, suggested posts, my_chat_member/chat_member (нужны права)
   ├─ Бизнес: бот отвечает от имени владельца (передаём business_connection_id)
   └─ Гостевой режим: бот участвует по тегу, не будучи участником
```

## 15. Краткий «боевой» чеклист

- [ ] `/start`, `/help`, `/settings` реализованы; команды заданы с scope и языками
- [ ] Все callback_query → `answerCallbackQuery` (включая ошибки)
- [ ] Дедупликация по `update_id`; idempotent handlers
- [ ] Long polling XOR webhook; у webhook — `secret_token`, проверка заголовка, `max_connections` продуман
- [ ] Обработка `migrate_to_chat_id` (переезд группы в супергруппу)
- [ ] 429 + `retry_after` → backoff; 5xx Telegram → retry
- [ ] Файлы: `file_id` для повторной отправки; загрузка ≤ 10/50 MB
- [ ] 2FA владельца; токен в секретах; логи без токена
- [ ] /terms, /paysupport — если берёте деньги (Физтовары/звёзды)
- [ ] Бот-админ в группе: `is_anonymous`-особенности; права по минимуму
- [ ] Прод-тест на test-окружении перед релизом; канал @BotNews отслеживается
