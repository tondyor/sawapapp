# 05. Mini Apps — полный справочник

> Источник, прочитан целиком 2026-11-06: [webapps.md](https://core.telegram.org/bots/webapps.md) (Telegram Mini Apps). Версия раздела: Bot API **10.1** (июнь 2026, `chat_join_request_query_id`). «Mini App» = «Web Apps» (терминология сохранена для обратной совместимости; поля и методы по-прежнему `web_app*`).

## 1. Все способы запуска мини-приложений

Telegram поддерживает **восемь** исполнений запуска Mini App: семь официальных поверхностей (keyboard button, inline button, menu button, Main Mini App, inline mode, direct link, attachment menu) плюс отдельный сценарий **chat join request** с guard-ботом.

| # | Поверхность | Как настраивается | Что получает Mini App | Как «отвечает» |
|---|---|---|---|---|
| 1 | **Keyboard Button Mini Apps** | `KeyboardButton.web_app` | `initData` + `themeParams`… (см. `initDataUnsafe`) | `Telegram.WebApp.sendData(data)` → сервисное сообщение боту; **только** эта поверхность; ≤ **4096 байт**; Mini App закрывается |
| 1.2 | **Inline Button Mini Apps** | `InlineKeyboardButton.web_app` | + `query_id` | `answerWebAppQuery` → отправить сообщение от имени пользователя в чат и закрыть Mini App |
| 1.3 | **Menu Button Mini Apps** | BotFather `/setmenubutton` или `setChatMenuButton` | как у inline button | то же |
| 1.4 | **Main Mini App** | BotFather → Configure Mini App → Main Mini App; ссылка `t.me/<bot>?startapp` | `start_param`, `chat_type`, `chat_instance`; без доступа к чату | бот через Bot API |
| 1.5 | **Inline Mode Mini Apps** | `answerInlineQuery.button` (`InlineQueryResultsButton`) | **нет доступа к чату** | `Telegram.WebApp.switchInlineQuery(query, [types])` — вернуть в inline |
| 1.6 | **Direct Link Mini Apps** | `t.me/<bot>/<appname>?startapp=<param>` | `start_param`, `chat_type`, `chat_instance`; без доступа к чату | `switchInlineQuery` |
| 1.7 | **Chat join request** (guard-бот) | BotFather: бот = guard chat; `chat_join_request` апдейт | + `user` (с фото), `chat` (id/type/title/username/photo), `chat_join_request_query_id` | `answerChatJoinRequestQuery` |
| 1.8 | **Attachment Menu Mini Apps** | `/setattach` (BotFather) — только крупные рекламодатели; на test server — всем | + `receiver` (приватные чаты), `chat` (supergroup/channel/group), `query_id`, `start_param` | `answerWebAppQuery` (отправить любой тип сообщения) |

**`initData` при пустом контексте:** для Mini App из keyboard button и inline mode поле `initData` пустое (`initData` пустой String). Полноценная подпись приходит во всех остальных поверхностях.

### 1.1. Keyboard Button Mini Apps

`ReplyKeyboardMarkup` + `KeyboardButton{ text, web_app: { url } }` → пользователь нажимает → открывается Mini App. Прекрасно для кастомных форм ввода данных, каталогов с поиском, рандомайзеров, опросов. **Без** `query_id` — Mini App не может отправить сообщение «от имени пользователя» в чат, но может отправить данные через `sendData` (это не сообщение в чат, а сервисное сообщение боту `web_app_data`).

### 1.2. Inline Button Mini Apps

`InlineKeyboardMarkup` + `InlineKeyboardButton{ text, web_app: { url } }` под сообщением бота → открывается Mini App с `initData`, `themeParams`, базовой информацией и `query_id`. Бот завершает сценарий вызовом `answerWebAppQuery(query_id, result)` — пользователь получает сообщение (как результат inline-запроса) в чат. Идеально для полноценных сервисов.

### 1.3. Menu Button Mini Apps

Кнопка рядом с полем ввода. Поведение — как у Inline Button (см. выше). Идеально как «всегда под рукой» запуск сервиса в чате с ботом.

### 1.4. Launching the main Mini App

Включается в BotFather; выдаёт кнопку **Launch app** в профиле + появление в *Apps* в поиске. Deep-link: `https://t.me/<bot>?startapp[=<param>][&mode=compact]`. По умолчанию full-screen (уменьшить можно `mode=compact`). Контекст `chat_type` ∈ `sender|private|group|supergroup|channel`; `chat_instance` — идентификатор для «совместного» использования несколькими пользователями (белый/общий блокнот, совместные заказы, мультиплеер). **Нет доступа к чату** — только `initData` + контекст; для отправки сообщения нужен редирект пользователя в inline mode.

### 1.5. Inline Mode Mini Apps

Выдача результатов inline-запроса с кнопкой: `InlineQueryResultsButton{ text, web_app: { url } }`. Запускает Mini App хоть из любого чата, где вызывается inline. Контекст чата отсутствует; возврат в inline через `switchInlineQuery('query', ['users'|'bots'|'groups'|'channels'])`.

### 1.6. Direct Link Mini Apps

`https://t.me/<bot>/<appname>?startapp=<param>[&mode=compact]` — именованные прямые ссылки на Mini App. `appname` — имя, заданное для этой ссылки в BotFather. `start_param` в `initData` + `tgWebAppStartParam` GET-параметр (до загрузки). Идеален для deeplink-маркетинга, рефералок, запуска из чужих приложений. По умолчанию full-screen (Bot API 7.6+); `mode=compact` — иначе.

### 1.7. Launching Mini Apps on chat join requests

Guard-бот чата получает апдейт `chat_join_request`, если записан guard-ботом для чата (нужны права `can_invite_users` и `supports_join_request_queries` у пользователя… Примечание: guard-бот устанавливается в настройках чата). Способ:

1. Endpoint или хендлер → `sendChatJoinRequestWebApp(chat_join_request_query_id?)` — фактически `query_id` из `ChatJoinRequest` (Bot API 10.1: `ChatJoinRequest.query_id`);
2. Пользователь взаимодействует с Mini App (анкеты, IQ-тесты, капчи);
3. Бот вызывает `answerChatJoinRequestQuery(query_id, …)` — одобрить/отклонить или ничего не решать.

Полный набор данных: user (+ photo), chat (+ title/photo), `chat_join_request_query_id`, theme. Прекрасный инструмент «фильтр от ботов»/«AI Guardian» (см. [07-ai.md](07-ai.md#7-ai-guardians-join-request-фильтры)).

### 1.8. Launching Mini Apps from the Attachment Menu

`/setattach` в BotFather (только крупные рекламодатели; у всех — на test server). Открывается из меню скрепки в **любом** типе чата. Получает: user info (+photo), **`receiver`** (приватный чат партньора) или **`chat`** (supergroup/channel/group), `query_id`, `start_param` — `tgWebAppStartParam`. `answerWebAppQuery` шлёт **любое** inline-сообщение в этот чат (от имени пользователя). Дополнительные ссылки: `?startattach=<param>&choose=users+bots` — выбор чата, в который писать.

## 2. Инициализация и `window.Telegram.WebApp`

Первым скриптом в `<head>`:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 2.1. Поля объекта WebApp

| Поле | Тип | Назначение |
|---|---|---|
| `initData` | String | Подписанная строка параметров запуска (валидация — [04, §6](04-miniapp-settings.md#6-валидация-initdata-обязательный-шаг)) |
| `initDataUnsafe` | WebAppInitData | Распарсенный initData **без проверки**; только для отрисовки |
| `version` | String | Версия Bot API в клиенте пользователя |
| `platform` | String | Платформа клиента (позиция 6.4+) |
| `colorScheme` | "light" \| "dark" | Схема Telegram; CSS-переменная `var(--tg-color-scheme)` |
| `themeParams` | ThemeParams | Текущие цвета темы (см. §4) |
| `isActive` | Bool | Mini App активен (не свёрнут) — Bot API 8.0+ |
| `isExpanded` | Bool | На весь доступный экран |
| `viewportHeight` | Float | Видимая высота (меняется вживую, ~без 60 fps) |
| `viewportStableHeight` | Float | Высота в «устойчивой» фазе; CSS `var(--tg-viewport-stable-height)` |
| `headerColor` / `backgroundColor` / `bottomBarColor` | String #RRGGBB | Цвета шапки/фона/нижней зоны |
| `isClosingConfirmationEnabled` | Bool | Запрашивать подтверждение при закрытии |
| `isVerticalSwipesEnabled` | Bool | Вертикальные свайпы (сворачивание/закрытие) — 7.7+ |
| `isFullscreen` | Bool | Fullscreen (8.0+) |
| `isOrientationLocked` | Bool | Ориентация зафиксирована (8.0+) |
| `safeAreaInset` | SafeAreaInset | Системные отступы (вырезы) |
| `contentSafeAreaInset` | ContentSafeAreaInset | Отступы «телеграма» (поверх интерфейса) |
| `BackButton` | BackButton | Кнопка «Назад» в шапке |
| `MainButton` / `SecondaryButton` | BottomButton | Нижние кнопки «Продолжить»/«Отмена» |
| `SettingsButton` | SettingsButton | Пункт «Настройки» в контекстном меню |
| `HapticFeedback` | HapticFeedback | Вибрация |
| `CloudStorage` | CloudStorage | Облачное хранилище на серверах Telegram |
| `BiometricManager` | BiometricManager | Биометрия устройства |
| `Accelerometer` / `DeviceOrientation` / `Gyroscope` | objects | Микродатчики (8.0+) |
| `LocationManager` | LocationManager | Геолокация (8.0+) |
| `DeviceStorage` | DeviceStorage | Локальное хранилище устройства (9.0+) |
| `SecureStorage` | SecureStorage | Безопасное хранилище (Keychain/Keystore) (9.0+) |
| `Serverless` | Serverless | Вызов endpoints Telegram Serverless (2026) |
| `isVersionAtLeast(v)` | Function | Проверка версии API клиента |

## 3. Прямые методы объекта WebApp

| Метод | Bot API | Назначение |
|---|---|---|
| `setHeaderColor(color)` | 6.1 | Цвет шапки: `#RRGGBB` или `bg_color`/`secondary_bg_color` (6.9+ любые) |
| `setBackgroundColor(color)` | 6.1 | Цвет фона |
| `setBottomBarColor(color)` | 7.10 | Цвет нижнего бара |
| `enableClosingConfirmation()` / `disableClosingConfirmation()` | 6.2 | Подтверждать закрытие |
| `enableVerticalSwipes()` / `disableVerticalSwipes()` | 7.7 | Свайпы на закрытие |
| `requestFullscreen()` / `exitFullscreen()` | 8.0 | Full-screen режим |
| `lockOrientation()` / `unlockOrientation()` | 8.0 | Фиксация ориентации |
| `addToHomeScreen()` / `checkHomeScreenStatus([cb])` | 8.0 | Ярлык на домашний экран |
| `onEvent(ev, cb)` / `offEvent(ev, cb)` | — | Подписка/отписка на события (список — §9) |
| `ready()` | — | Страница готова → убрать заглушку (вызывать как можно раньше) |
| `expand()` | — | Развернуть на максимум |
| `close()` | — | Закрыть Mini App |
| `sendData(data)` | — | Сервисное сообщение `web_app_data` боту; ≤ **4096 байт**; **только** keyboard-button |
| `switchInlineQuery(query[, types])` | 6.7 | Вставить `@bot query` в поле ввода / переключить в inline в другом чате |
| `openLink(url[, {try_instant_view}])` | 6.1/6.4 | Внешний браузер; Mini App не закрывается; только по действию пользователя |
| `openTelegramLink(url)` | 6.1 | tg:// или t.me ссылка внутри Telegram (с 7.0 Mini App не закрывается) |
| `openInvoice(url[, cb])` | 6.1 | Открыть инвойс (cb/ event `invoiceClosed`) |
| `shareToStory(media_url[, params])` | 7.8 | Изображение/видео в нативный редактор историй |
| `shareMessage(msg_id[, cb])` | 8.0 | Поделиться сообщением (PreparedInlineMessage от `savePreparedInlineMessage`) |
| `setEmojiStatus(custom_emoji_id[, params, cb])` | 8.0 | Диалог установки emoji-статуса (только по воле пользователя) |
| `requestEmojiStatusAccess([cb])` | 8.0 | Запросить право ставить статус программно (→ Bot API `setUserEmojiStatus`) |
| `downloadFile(params[, cb])` | 8.0 | Попап скачивания (нужен `Content-Disposition` + `Access-Control-Allow-Origin: https://web.telegram.org`) |
| `hideKeyboard()` | 9.1 | Скрыть экранную клавиатуру |
| `showPopup(params[, cb])` | 6.2 | Нативный попап (1–3 кнопки: default/ok/close/cancel/destructive) |
| `showAlert(message[, cb])` | 6.2 | Простое окно |
| `showConfirm(message[, cb])` | 6.2 | Подтверждение OK/Cancel |
| `showScanQrPopup(params[, cb])` | 6.4 | Нативный сканер QR |
| `closeScanQrPopup()` | 6.4 | Закрыть сканер |
| `readTextFromClipboard([cb])` | 6.4 | Чтение буфера (**только** attachment-menu + в ответ на действие пользователя) |
| `requestWriteAccess([cb])` | 6.9 | Запрос разрешения писать пользователю (без него бот не может первым написать) |
| `requestContact([cb])` | 6.9 | Запрос номера телефона |
| `requestChat(req_id[, cb])` | 9.6 | Диалог выбора/создания чата (требует PreparedKeyboardButton от `savePreparedKeyboardButton`) |

## 4. ThemeParams

| Поле | Тип | CSS-переменная |
|---|---|---|
| `bg_color` | #RRGGBB | `--tg-theme-bg-color` |
| `text_color` | | `--tg-theme-text-color` |
| `hint_color` | | `--tg-theme-hint-color` |
| `link_color` | | `--tg-theme-link-color` |
| `button_color` | | `--tg-theme-button-color` |
| `button_text_color` | | `--tg-theme-button-text-color` |
| `secondary_bg_color` (6.1+) | | `--tg-theme-secondary-bg-color` |
| `header_bg_color` (7.0+) | | `--tg-theme-header-bg-color` |
| `bottom_bar_bg_color` (7.10+) | | `--tg-theme-bottom-bar-bg-color` |
| `accent_text_color` (7.0+) | | `--tg-theme-accent-text-color` |
| `section_bg_color` (7.0+) | | `--tg-theme-section-bg-color` |
| `section_header_text_color` (7.0+) | | `--tg-theme-section-header-text-color` |
| `section_separator_color` (7.6+) | | `--tg-theme-section-separator-color` |
| `subtitle_text_color` (7.0+) | | `--tg-theme-subtitle-text-color` |
| `destructive_text_color` (7.0+) | | `--tg-theme-destructive-text-color` |

Событие `themeChanged` при смене темы (читать `this.colorScheme`, `this.themeParams`).

## 5. Кнопки и HapticFeedback

**BackButton:** `isVisible` · `onClick(cb)` · `offClick(cb)` · `show()` · `hide()` (цепочка). Действие — ваш код (например, закрыть текущий экран).

**BottomButton** (Main/Secondary): `type` (`main|secondary`), `iconCustomEmojiId` (9.5+), `text` (main: «Continue»; secondary: «Cancel»), `color`, `textColor` (вторичная по умолчанию `bottom_bar_bg_color` / `button_color`), `isVisible`, `isActive`, `hasShineEffect` (7.10), `position` (secondary: left/right/top/bottom), `isProgressVisible` (readonly), `setText`, `onClick/offClick`, `show/hide`, `enable/disable`, `showProgress(leaveActive)`, `hideProgress()`, `setParams({ text?, color?, text_color?, icon_custom_emoji_id?, has_shine_effect?, position?, is_active?, is_visible? })`.

> Bot API 7.10: класс MainButton переименован в BottomButton; добавлен SecondaryButton.

**SettingsButton:** `isVisible` / `onClick` / `offClick` / `show` / `hide`. Показывает пункт «Настройки» в контекстном меню (Fluently как у Main Mini App) → событие `settingsButtonClicked`.

**HapticFeedback:** `impactOccurred(light|medium|heavy|rigid|soft)`, `notificationOccurred(error|success|warning)`, `selectionChanged()`. Все возвращают объект (цепочки).

## 6. Хранилища

| Хранилище | Где | Лимит | Ключевые методы |
|---|---|---|---|
| **CloudStorage** (6.9+) | серверы Telegram (per бота + per user) | 1024 ключа; ключ 1–128 симв. `[A-Za-z0-9_-]`; value ≤ 4096 симв. | `setItem/getItem/getItems/removeItem/removeItems/getKeys` |
| **DeviceStorage** (9.0+) | устройство, локально (per bot) | 5 MB/user | `setItem/getItem/removeItem/clear` |
| **SecureStorage** (9.0+) | iOS Keychain / Android Keystore | 10 элементов/user | `setItem/getItem/restoreItem/removeItem/clear`. Для `deviceId` есть идентификатор устройства |
| Browser localStorage | origin в WebView | зависит от клиента | использовать только если Telegram API не подходит |

**Правило:** source of truth для заказов/подписок/оплат — только ваш сервер. Хранилища Telegram — кэш/UX-состояние.

## 7. Датчики и устройства (8.0+)

**Accelerometer:** `isStarted`, `x/y/z` (m/s²); `start({refresh_rate: 20–1000})`, `stop()`; события `accelerometerStarted/Stopped/Changed/Failed`.
**DeviceOrientation:** `isStarted`, `absolute`, `alpha/beta/gamma` (rad); `start({refresh_rate, need_absolute})`, `stop()`; события `deviceOrientationStarted/Stopped/Changed/Failed`.
**Gyroscope:** `isStarted`, `x/y/z` (rad/s); `start`, `stop`; события `gyroscopeStarted/Stopped/Changed/Failed`.
**LocationManager:** `isInited`, `isLocationAvailable`, `isAccessRequested`, `isAccessGranted`; `init()`, `getLocation(cb)` → LocationData, `openSettings()`; события `locationManagerUpdated`, `locationRequested`.

## 8. Типы данных

### 8.1. WebAppInitData (поля)

`query_id?` · `chat_join_request_query_id?` (10.1) · `user?` (WebAppUser) · `receiver?` (только attachment menu в приватных чатах) · `chat?` (WebAppChat; supergroup/channel/group через attachment menu / join request) · `chat_type?` (`sender|private|group|supergroup|channel`; только direct links) · `chat_instance?` (то же) · `start_param?` (из ссылки; ≤ 512) · `can_send_after?` (сек) · `auth_date` (unixtime) · `hash` (HMAC-SHA256 hex, валидация — [04, §6](04-miniapp-settings.md#6-валидация-initdata-обязательный-шаг)) · `signature` (Ed25519, base64url; для third parties).

### 8.2. WebAppUser

`id` (до 52 бит!) · `is_bot?` · `first_name` · `last_name?` · `username?` · `language_code?` (только в user-поле) · `is_premium?` · `added_to_attachment_menu?` · `allows_write_to_pm?` · `photo_url?` (`.jpeg`/`.svg`).

### 8.3. WebAppChat

`id` (64-бит) · `type` (`group|supergroup|channel`) · `title` · `username?` · `photo_url?` (только attachment menu).

### 8.4. WebAppInitData и WebAppUser / WebAppChat

Сводная таблица полей — см. раздел [§8.1](#81-webappinitdata-поля)–[§8.3](#83-webappchat). Публичные ключи для валидации Ed25519: prod `e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d`, test `40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec`.

### 8.5. Остальные объекты

PopupParams(`title`, `message`, `buttons[1..3]`) · PopupButton(`id`, `type`, `text`) · ScanQrPopupParams(`text ≤ 64`) · EmojiStatusParams(`duration`) · DownloadFileParams(`url`, `file_name`) · StoryShareParams(`text ≤ 200` (premium 2048), `widget_link`) · StoryWidgetLink(`url`, `name ≤ 48`) · SafeAreaInset · ContentSafeAreaInset · LocationData(`latitude/longitude/altitude/course/speed/horizontal_accuracy/vertical_accuracy/course_accuracy/speed_accuracy`) · AccelerometerStartParams · DeviceOrientationStartParams(`need_absolute`) · GyroscopeStartParams · BiometricRequestAccessParams(`reason ≤ 128`) · BiometricAuthenticateParams(`reason ≤ 128`) · DeviceStorage · SecureStorage.

## 9. События (44)

| Событие | Когда | Доп. данные |
|---|---|---|
| `activated` / `deactivated` (8.0+) | Mini App стал активен/скрыт | — |
| `themeChanged` | Сменилась тема | `this.themeParams`, `this.colorScheme` |
| `viewportChanged` | Ресайз | `{ isStateStable }` |
| `safeAreaChanged` / `contentSafeAreaChanged` (8.0+) | Изменился safe area | `this.safeAreaInset` / `this.contentSafeAreaInset` |
| `mainButtonClicked` / `secondaryButtonClicked` (7.10+) | Нажаты нижние кнопки | — |
| `backButtonClicked` (6.1+) | «Назад» | — |
| `settingsButtonClicked` (6.1+) | Настройки в контексте | — |
| `invoiceClosed` (6.1+) | Инвойс закрыт | `{ url, status: paid|cancelled|failed|pending }` |
| `popupClosed` (6.2+) | Попап закрыт | `{ button_id }` |
| `qrTextReceived` (6.4+) | Сканер QR | `{ data }` |
| `scanQrPopupClosed` (7.7+) | Сканер закрыт | — |
| `clipboardTextReceived` (6.4+) | Чтен буфер | `{ data }` |
| `writeAccessRequested` (6.9+) | Запрошен доступ написать | `{ status: allowed|cancelled }` |
| `contactRequested` (6.9+) | Запрошен контакт | `{ status: sent|cancelled }` |
| `biometricManagerUpdated` (7.2+) | BiometricManager изменился | — |
| `biometricAuthRequested` (7.2+) | Биометрия | `{ isAuthenticated, biometricToken? }` |
| `biometricTokenUpdated` (7.2+) | Токен обновлён | `{ isUpdated }` |
| `fullscreenChanged` / `fullscreenFailed` (8.0+) | Full-screen | `this.isFullscreen` / `{ error }` |
| `homeScreenAdded` / `homeScreenChecked` (8.0+) | Ярлык на главный экран | `{ status: unsupported|unknown|added|missed }` |
| `accelerometerStarted/Stopped/Changed/Failed` (8.0+) | Акселерометр | `x/y/z`, `{ error }` |
| `deviceOrientationStarted/Stopped/Changed/Failed` (8.0+) | Ориентация | `alpha/beta/gamma`, `{ error }` |
| `gyroscopeStarted/Stopped/Changed/Failed` (8.0+) | Гироскоп | `x/y/z`, `{ error }` |
| `locationManagerUpdated` / `locationRequested` (8.0+) | Геолокация | `{ locationData }` |
| `shareMessageSent` / `shareMessageFailed` (8.0+) | Шеринг сообщения | `{ error }` |
| `emojiStatusSet` / `emojiStatusFailed` / `emojiStatusAccessRequested` (8.0+) | Emoji-статус | `{ error }` / `{ status }` |
| `fileDownloadRequested` (8.0+) | Скачивание | `{ status: downloading|cancelled }` |

Все обработчики ставятся через `onEvent`; внутри handler `this` = `Telegram.WebApp`.

## 10. Тестирование и отладка

Тестовое окружение (отдельный аккаунт и бот; HTTP без TLS разрешён):

- iOS: 10 тапов по иконке Settings → Accounts → Login to another account → Test;
- Desktop (Windows/Linux): ☰ Settings → Shift+Alt+Right click «Add Account» → Test Server;
- macOS: 10 тапов по Settings → Debug Menu → ⌘+click «Add Account».

API-запросы: `https://api.telegram.org/bot<token>/test/<METHOD>`. Flood limits не повышены (могут быть строже).

Debug Mini App:

- **iOS**: 10 тапов по Settings → *Allow Web View Inspection*; USB; Safari → Develop → устройство → приложение;
- **Android**: включить USB debugging; в Telegram 7 тапов по номеру версии → Debug Settings → *Enable WebView Debug*; `chrome://inspect/#devices`;
- **Telegram Desktop (Win/Linux)**: [Beta](https://desktop.telegram.org/changelog#beta-version) → Settings → Advanced → Experimental settings → *Enable webview inspection*; ПКМ → Inspect;
- **Telegram macOS**: [Beta](https://telegram.org/dl/macos/beta); 5 тапов по Settings → включить Debug Mini Apps; ПКМ → Inspect Element.

## 11. Cross-platform данные (Android User-Agent)

```
Telegram-Android/{app_version} ({manufacturer} {model}; Android {android_version}; SDK {sdk_version}; {performance_class})
```

Например: `Telegram-Android/11.3.3 (Google sdk_gphone64_arm64; Android 14; SDK 34; LOW)`. Класс: `LOW | AVERAGE | HIGH` — снижайте сложность графики на `LOW`.

## 12. Serverless(объект) — вызов endpoints Telegram Serverless

```js
Telegram.WebApp.Serverless.call('getProfile', { lang: 'en' }, cb)
```

- `err.message` — описание; `err.type` = `ENDPOINT_ERROR` (ваш `EndpointError`) | `UNAUTHORIZED` (initData невалиден) | прочее от платформы; `err.status` — HTTP-статус (или 0); `err.parameters` — дополнительные данные из `EndpointError`;
- initData **проверяется платформой до вызова** — сервер знает, кто открыл Mini App; публичного API для защиты не требуется.

## 13. Ограничения и частые ошибки

1. `sendData` — ≤ **4096 байт**, только keyboard-кнопка, Mini App **закрывается**.
2. `initData` пуст у keyboard-кнопок и inline mode.
3. `initDataUnsafe` без серверной проверки — уязвимость.
4. `viewportHeight` — «живая», для пиннинга кнопок — `viewportStableHeight`.
5. `user.id`/`chat.id` — 52 бита; не используйте 32-битные int.
6. `openLink` — только по явному действию; `openTelegramLink` не закрывает Mini App (с 7.0).
7. `readTextFromClipboard` — только attachment menu + по действию пользователя.
8. `safeAreaInset` ≠ `contentSafeAreaInset`: первое — системные области (вырезы), второе — перекрытие Telegram UI (шапки/кнопки).
9. `isVersionAtLeast('8.0')` перед использованием новых полей (BiometricManager требует `init()`).
10. `downloadFile` — только с корректными HTTP-заголовками (см. §3).
11. Остановка загрузки/экрана — событие `viewportChanged` для `isStateStable`, не полагайтесь на `viewportHeight`.

## 14. Дизайн-гайдлайны и вкусы Telegram

Источник: [webapps.md Design Guidelines](https://core.telegram.org/bots/webapps.md#design-guidelines).

- Mobile-first, всё должно читаться на маленьком экране; семантические HTML-теги и alt-тексты;
- Интерактив похож на Telegram UI (канонические цвета из ThemeParams, нативные диалоги);
- Анимации ≤ 16ms (60fps), на LOW Android — отключайте тяжёлые эффекты;
- Цвета — только через `themeParams`/CSS-переменные, не хардкод;
- Safe areas — обязательны (особенно fullscreen/notch-телефоны);
- Не дублируйте нативные кнопки (MainButton/BackButton) собственной вёрсткой;
- Любой интерактив должен иметь доступную метку (accessibility label).
