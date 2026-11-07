# 06. Связка «бот + Mini App» — всё, что они могут делать вместе

Эта глава — про **совместные** возможности и про то, кто за что отвечает в связке. Конфигурация обеих половинок описана в [03](03-chat-bot-settings.md) и [04](04-miniapp-settings.md), API-поверхность Mini App — в [05](05-miniapp-api.md).

## 0. Принцип разделения ролей

| Вопрос | Ответ за чат-бота | Ответ за Mini App |
|---|---|---|
| Кто видит пользователя? | Бот знает chat_id/user (всегда 64-бит), может отправлять сообщения, уведомления, счета | До 52 бит во frontend-полях; канал общения — `initData` (сервер проверяет) |
| Кто держит состояние? | Ваш сервер/Serverless DB (у Telegram нет user DB) | Клиент хранит только UX-состояние; источник истины — сервер |
| Кто умеет сложный UI? | Кнопки, клавиатуры, списки, форум-топики | Полноценный web UI (любой JS) |
| Кто доставляет уведомления? | Бот (30/с бесплатно, до 1000/с платно) | Изоморфно: бот + `sendMessage` |
| Кто делает деньги? | Invoice/Stars/paid media/подарки через Bot API | Открыть invoice через `openInvoice`, подписки Stars, Gifts |
| Что может Mini App просить? | (просит у бота бизнес-логику) | Разрешения: писать пользователю, контакт, биометрия, локация, статус, ярлык на экран |
| Что умеет только Mini App | Рендер HTML/JS/WebGL, камера (сканер QR), сенсоры | — |
| Что умеет только бот | Писать пользователю первым (если он разрешил), рассылки, вебхуки, админ-функции | — |

## 1. Карта всех «швов» связки

```
              ┌──────────────── Telegram ────────────────┐
 Пользователь │                                          │
      │       │   ┌───────────┐      ┌───────────────┐   │
      ├───────┼──→│   ЧАТ      │←────→│  Logic/БД      │   │
      │       │   │  (Bot API) │      │  (Serverless)  │   │
      │       │   └────┬───┬──┘      └───────┬────────┘   │
      │       │        │   │                 │            │
      │       │   webhook/ │ Serverless      │            │
      │       │  getUpdates │ endpoints      │            │
      │       │        │   │                 ▼            │
      ├───────┼──→┌────┴───┴────┐      ┌─────────┐        │
      │       │   │   Mini App   │←────→│  Ваш     │        │
      │       │   │ (WebView+JS) │initData API фронт/бэкенд│
      │       │   └─────────────┘      └─────────┘        │
      └───────┼───────────────────────────────────────────┘
              └───────────────────────────────────────────┘
```

## 2. Пути внутрь Mini App (напоминание)

См. полный разбор в [05, §1](05-miniapp-api.md#1-все-способы-запуска-мини-приложений). Поведение связки по поверхностям:

| Поверхность | Открыл по кнопке | Данные, которые Mini App видит | Как вернуть результат в чат |
|---|---|---|---|
| Keyboard button | Пользователь | `initData` (без `query_id`) | `sendData` → сервисное сообщение `web_app_data` → бот продолжает диалог |
| Inline button | Пользователь под сообщением | `initData` + `query_id` | `answerWebAppQuery` → сообщение в чат от имени пользователя |
| Menu button | Пользователь (всегда доступно) | как inline button | `answerWebAppQuery` |
| Main Mini App | Пользователь в профиле | `start_param`, `chat_type`, `chat_instance` | сообщение только через inline mode (switchInlineQuery) |
| Inline results button | Пользователь в любом чате | без чата | `switchInlineQuery` |
| Direct link | Клик по ссылке | `start_param`, `chat_type`, `chat_instance` | `switchInlineQuery` |
| Chat join request (guard-бот) | Пользователь подаёт заявку | + `chat_join_request_query_id`, user+photo, chat+title | `answerChatJoinRequestQuery` |
| Attachment menu | Меню скрепки в любом чате | `query_id`, `receiver` или `chat`, `start_param` | `answerWebAppQuery` (любое сообщение) |

## 3. Обратные каналы (Mini App → бот → чат)

### 3.1. `sendData` (keyboard-кнопка)

Только из keyboard-кнопки; ≤ 4096 байт; Mini App закрывается; бот получает сервисное сообщение с `web_app_data`. Онбординг «сборки формы»: пользователь заполняет, вы сохраняете на сервере по идентификатору сессии, далее сценарий продолжается кнопками.

### 3.2. `answerWebAppQuery` (inline/menu/attachment)

```
Mini App → initData + query_id → ваш сервер
Ваш сервер: проверка initData ([04, §6](04-miniapp-settings.md#6-валидация-initdata-обязательный-шаг))
→ Bot API: answerWebAppQuery(query_id, result=InputInlineQueryResult…)
→ пользователь видит сообщение в чате (от своего имени, «via @your_bot»)
```

`result` — тот же `InputInlineQueryResult`, что и у inline-запроса (статья/фото/voice/invoice/…). Характерные сценарии: «оформить заказ и отправить чек в чат», «выбрать ресторан и отправить адрес», «запустить мини-игру и вернуться».

### 3.3. `shareMessage` + `savePreparedInlineMessage` (8.0+)

Бот готовит сообщение (`savePreparedInlineMessage`) → получает `prepared_message_id` → Mini App получает его «снаружи» (`msg_id`) → `Telegram.WebApp.shareMessage(msg_id)` → нативный диалог шеринга в любой чат.

Идеально для реферальных/приглашательных потоков, генерации «персональных открыток», выдачи квитанций. Бот при этом сохраняет полный контроль над содержимым сообщения.

### 3.4. `requestContact` и `requestWriteAccess` (6.9+)

- `requestWriteAccess()` → пользователь разрешает боту **писать первым** (до 6.9 бот мог писать только после первого контакта в личке); колбэк/событие `writeAccessRequested`;
- `requestContact()` → поделиться номером телефона; `contactRequested`.

### 3.5. Invoice: `openInvoice` / `invoiceClosed` / `successful_payment`

```
Mini App: товар → ваш сервер → Bot API sendInvoice / createInvoiceLink (XTR)
→ ссылка/url → Telegram.WebApp.openInvoice(url)
→ событие invoiceClosed({ status })
→ БОТ получает successful_payment → подтверждает → выдаёт товар
```

**Никогда** не выдавайте товар по `invoiceClosed.status=paid` — только после `successful_payment` в вашем бэкенде (UX-подсказка ≠ квитанция).

### 3.6. Emoji-Status & Home-screen & Stories

- `requestEmojiStatusAccess` → право `setUserEmojiStatus` (персональный emoji-статус приложения);
- `setEmojiStatus` — разовый диалог подтверждения;
- `addToHomeScreen` / `checkHomeScreenStatus` — ярлык на главный экран (1-тап возврат в игру/сервис);
- `shareToStory(media_url, { text, widget_link })` — нативный story-редактор с готовым медиа/ссылкой;
- истории от имени бизнес-аккаунта — Bot API `postStory/editStory/repostStory/deleteStory`.

### 3.7. `switchInlineQuery`

Из Mini App пользователя возвращают в inline: `switchInlineQuery('query', ['users','groups','channels'])` → поле ввода переключится на `@your_bot query` в выбранном чате. Ключевой паттерн для прямых ссылок и Main Mini App («Поделиться в чат → выберите чат»).

### 3.8. Игры: `callback_game` + HTML5 game

Mini App ≈ HTML5-игра самой продвинутой формы: высокая частота кадров, WebGL, акселерометр, gyroscope — чего `callback_game` не умеет нативно (она открывается во встроенном браузере, как обычная веб-страница).

## 4. Авторизация и идентичность в связке

| Слой | Что подписать/проверить |
|---|---|
| initData поступает на ваш сервер | HMAC-SHA-256 (bot token); Ed25519 для third parties; сверяйте `auth_date` |
| `query_id` | одноразовый; проверяйте принадлежность вашему боту (иначе чужие query_id) |
| Веб-сессия пользователя | cookie/JWS от вашего бэкенда после проверки initData |
| Права доступа Mini App | `isVersionAtLeast`, события `settingsButtonClicked` (настройки) |
| Защита от replay | `auth_date` + TTL (например, 1–24 ч) + сравнение `hash` |

## 5. Платежи и виральность в связке

- Счёт через бота → ссылка → `openInvoice` в Mini App: самый короткий путь покупки цифрового товара;
- подписки Stars через `createInvoiceLink(subscription_period)` — регулярные tier'ы внутри Mini App;
- paid media в превью внутри Mini App + `sendPaidMedia` в чат;
- реферальная механика: deep link `?startapp=ref_<code>` + кнопка-«Share» с `shareMessage`;
- аффилиат-программы (Stars-комиссия за рефералов) подключаются через [Affiliate Programs](https://telegram.org/blog/affiliate-programs-ai-sticker-search) — доступны mini app-разработчикам;
- revenue share от Telegram Ads — 50% вместо платных рассылок;
- Gifts (подарки за звёзды из вашего Stars-баланса) — `getAvailableGifts`/`sendGift` из чат-бота; `sendGift` также из Mini App-сценариев через сервер.

## 6. Бизнес-связки (Secretary + ваше приложение)

- Пользователь подключает вашего бота к бизнес-аккаунту (`business_connection` апдейт);
- Mini App = пульт управления секретарём: статус подключения, лимиты, что можно делать;
- Ваш бэкенд от имени бизнес-аккаунта: читает (`business_message`), отвечает (`sendMessage(..., business_connection_id=…)`), удаляет, читает прочитанное, управляет названием/профильной/bio/подарками/звёздами (`setBusinessAccount*`, `transferBusinessAccountStars`);
- Типичный AI-сценарий: пользователь пишет клиенту → ваш ИИ-агент в Mini App просматривает контекст → генерирует черновик → шлет как бизнес-ответ (с `can_reply` right).

## 7. Telegram Serverless — бэкенд на стороне Telegram

([serverless.md](https://core.telegram.org/bots/serverless.md); статус на 06.10.2026: CLI 0.2.0, young product)

- Болт и Mini App — в одном Git-проекте; `tgcloud/` с `handlers/*.js`, `endpoints/*.js`, `lib/`, `schema.js`;
- Endpoints Mini App вызывает без токена: платформа проверяет `initData` до вызова; endpoint знает `ctx.initData.user`;
- БД SQLite (Drizzle-DSL), без foreign keys; миграции двухфазно (`push` ≠ `migrate`);
- `fetch` умеет стримить ответы (SSE/token-by-token от AI API!) — идеально для AI-ботов;
- Фронт хостится на `https://app<app_id>.tgcloud.ai/`;
- Единственный AI-дружественный путь: `AGENTS.md` + `docs/tgcloud-sdk.md` в каждом скелете проекта;
- В проде — отдельный CLI-токен из BotFather (не путать с API-токеном).

### 7.1. Мини-пример связки на Serverless

```
tgcloud/handlers/message.js         → /start, /help → api.sendMessage
tgcloud/endpoints/getState.js       → агрегированное состояние для Mini App
tgcloud/endpoints/placeOrder.js     → серверная валидация + БД + api.sendInvoice(…)
app/ (фронт Mini App)               → Telegram.WebApp.* + Serverless.call('getState')
```

## 8. Уведомления и «присутствие»

| Канал | Когда уместен | Ограничение |
|---|---|---|
| Обычный `sendMessage` от бота | ответы его пользователям | 30/с (1/с на чат, 20/мин на группу) |
| Платные рассылки | маркетинг/новости для > 30 чел/с | до 1000/с; 0.1 Star за msg сверх 30 |
| Mini App (уже открытый) | real-time UX | нет |
| Бизнес-бот | писать от имени человека | только приватные чаты с incoming ≤ 24 ч |
| Stories от бизнес-аккаунта | контент на аудиторию | от имени бизнеса; права через `rights` |
| Топики в личке с ботом | «длинные» AI-диалоги/проекты | включить topics у бота |
| Эфемерные сообщения | ответы «только этому пользователю» в группе | ≤ 15 сек от события (админы — без ограничения) |

## 9. Типовые архитектуры

### 9.1. Магазин / e-commerce

Бот = каталог/корзина/оплата; Mini App = полка с фильтрами, корзина, checkout. `sendInvoice` (XTR) или сторонний провайдер (физтовары). Успешная оплата → `successful_payment` → выдача цифрового товара через бота. Рассылки — после согласия; оплата подписки Stars — `subscription_period`.

### 9.2. Игра

Mini App (fullscreen, акселерометр) + бот (регистрация, лидерборд, вызовы). `callback_game` если хочется «одна кнопка Play»; полноценная игра — на Mini App. Счёт: client → ваш сервер → `setGameScore` (если используете HTML5 Games) или своя таблица.

### 9.3. AI-ассистент (sm. [07-ai.md](07-ai.md))

Бот принимает текст/голос → очередь → LLM → стримит `sendMessageDraft` → финал `sendRichMessage`. Mini App = история диалога, настройки «персонажа», файлы. Вариант без своего сервера — Telegram Serverless + `fetch` + OpenAI-совместимый API.

### 9.4. Бизнес-секретарь

Mini App = панель «что бот может делать»; бот — полномочия через `BusinessConnection.rights`; ответ пишется только черновиком, чтобы проверил человек; при включённом `can_reply` — автоотправка.

### 9.5. Ивент/мероприятие

Direct link `?startapp=event<id>` + `chat_instance` для кооперативного экрана (голосования в мини-приложении, результаты в реальном времени через WebSocket ваш сервером).

## 10. Матрица решений

| Задача | Чат-бот | Mini App | Вместе |
|---|---|---|---|
| Вопрос-ответ | ✅ `sendMessage` | ⚠ перебор | ⚠ |
| Сложная форма | ⚠ цепочка клавиатур | ✅ нативные инпуты | Mini App шлёт, бот подтверждает |
| Счёт/покупка | ✅ `sendInvoice` | ✅ `openInvoice` | ✅ в связке лучше |
| Уведомление | ✅ | ❌ (нет push в закрытый Mini App) | бот |
| 3D-графика/игра | ❌ | ✅ | бот — метки/аккаунт |
| Одноразовая утилита | inline mode | direct link | ✅ |
| Заявка в чат/группу | join request | guard-бот + Mini App-анкета | ✅ |
| Stories/статус | `postStory` | `shareToStory`/`setEmojiStatus` | ✅ |

## 11. Краткий чеклист качества связки

- [ ] Все ответы бота idempotent (`update_id`-дедупликация, TTL)
- [ ] `initData` проверяется на каждом серверном вызове Mini App
- [ ] Товар выдаётся только по `successful_payment`, не по `invoiceClosed`
- [ ] `sendData` ≤ 4096 байт и только keyboard-кнопка
- [ ] `answerWebAppQuery` вызывается ровно один раз (иначе «крутилка» или ошибка)
- [ ] Долгие операции в Mini App — с прогрессом (`showProgress`) и отменой
- [ ] Логика прав (can_reply, can_read_messages, …) читается из **последних** `rights`
- [ ] Для партнёрских интеграций initData проверяется через Ed25519, токен бота третьей стороне не передаётся
- [ ] `tgcloud push` выполняется после `npm run build`
- [ ] Тесты: test environment + Debug Mini App на реальных iOS/Android
