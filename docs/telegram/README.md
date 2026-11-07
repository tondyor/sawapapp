# Telegram Bot Platform — полные возможности, спецификация и ограничения

**Дата сборки:** 2026-11-06 · **Актуальный Bot API:** 10.3 (24.08.2026) · **Mini Apps (WebApp) API:** Bot API 10.1+ поле `chat_join_request_query_id`

Этот каталог — полный конспект платформы ботов Telegram: архитектура, все методы и типы Bot API, все настройки BotFather / сервера, отдельно для работы **через чат** и **через Mini App**, конфигурирование связки **бот + Mini App** и всего, что Telegram позволяет делать с **AI**.

Каждый файл — завершённая тема. Все утверждения опираются на официальную документацию; ссылки — внутри текста и сводно в [10-sources.md](10-sources.md). Документы, помеченные «неофициальный источник», так и обозначены.

> ⚠️ Платформа — живая. Перед принятием решений по проду сверяйтесь с актуальной версией страниц на [core.telegram.org](https://core.telegram.org/bots) и с [@BotNews](https://t.me/botnews). Расхождения официальных страниц между собой отмечаются по месту.

## Как читать

| Файл | Что внутри |
|---|---|
| [01-architecture.md](01-architecture.md) | Архитектура платформы: Bot API vs MTProto/TDLib, HTTP-транспорт, JSON-конверты, все способы доставки апдейтов (getUpdates / webhook), Local Bot API Server, Telegram Serverless, модель аккаунта-бота, privacy mode, время жизни апдейтов |
| [02-bot-api-reference.md](02-bot-api-reference.md) | **Полная спецификация Bot API**: транспорт, способы передачи параметров, все ~250 методов по разделам (с назначением каждого и ссылкой), полный перечень типов, формулы/краевые случаи (file_id, URL, multipart), форматирование сообщений (MarkdownV2/HTML/Rich) |
| [03-chat-bot-settings.md](03-chat-bot-settings.md) | **Настройки для работы бота непосредственно через чат**: BotFather от А до Я, scopes команд, privacy mode, меню, глобальные команды, бизнес/секретарь, гостевые боты, managed bots, bot-to-bot, топики в личке, платные рассылки, статус-алерты, верификация, мини-чеклист на запуск |
| [04-miniapp-settings.md](04-miniapp-settings.md) | **Настройки работы через Mini App**: BotFather (Configure Mini App / Main Mini App / splash screen / partners), deep links, menu button, tgcloud.jsonc, домены, HTTPS/HTTP в test env, валидация initData (HMAC-SHA-256 и Ed25519), чеклист на запуск |
| [05-miniapp-api.md](05-miniapp-api.md) | **Полный справочник Mini Apps**: все 8 способов запуска, объект `window.Telegram.WebApp` со всеми полями и методами, `ThemeParams`, storage (Cloud/Device/Secure), кнопки, haptics, биометрия, сенсоры, LocationManager, все 44 события, `WebAppInitData`, скриншоты ограничений |
| [06-bot-miniapp-combo.md](06-bot-miniapp-combo.md) | **Связка «бот + Mini App»**: кто что умеет, все точки входа и обратные каналы связи (sendData, answerWebAppQuery, shareMessage, requestChat, Serverless.call), авторизация, платежи, инлайн, business, stories, уведомления о готовности, референс-архитектуры |
| [07-ai.md](07-ai.md) | **Всё про AI на Telegram**: встроенный AI Telegram (Cocoon Network), AI-редактор и стили, AI-Guardians, автоответы в профиле, гостевой режим, bot-to-bot, стрим-ответы, rich messages для AI, темы в личке, managed bots, эфемерные сообщения; рецепты архитектуры AI-агента; ограничения и правила (TOS 4.3, loops) |
| [08-payments-monetization.md](08-payments-monetization.md) | Деньги: Telegram Stars (XTR), физтовары через провайдеров, подписки Stars, paid media, gifts, платные рассылки, реф-программа (Affiliate), Revenue Share от рекламы, TON через Fragment; обязательства мерчанта; расхождение цифр в лимитах |
| [09-limits-errors.md](09-limits-errors.md) | **Все лимиты и коды ошибок в одном месте**: 30 msg/s, 20 msg/min в группе, 429 + retry_after, Ephemeral 15 с, pre_checkout 10 с, file_id/размеры/IP/порты/TLS, 24 ч хранения апдейтов, privacy mode, retries для webhook, 410 Gone |
| [10-sources.md](10-sources.md) | **Полный перечень источников** (официальная документация, блог Telegram 2022–2026, примеры библиотек) с датой обращения 2026-11-06 |

## Сводка платформы на 2026-11-06

| Параметр | Значение |
|---|---|
| Актуальная версия Bot API | **10.3** (24.08.2026) |
| Как обращаться к API | HTTPS `https://api.telegram.org/bot<token>/<METHOD>` (case-insensitive) |
| Формат ответа | Всегда JSON: `{ok: bool, result?: …, error_code?: int, description?: string, parameters?: ResponseParameters}` |
| Доставка апдейтов | `getUpdates` (long polling) **или** webhook — взаимоисключительно; апдейты хранятся ≤ 24 ч |
| Запуск Mini App | 7 способов ([05, раздел 1](05-miniapp-api.md#1-все-способы-запуска-мини-приложений)) + сценарий chat join request с guard-ботом |
| Встроенный AI Telegram | Cocoon Network (AI Editor, AI Styles, AI sticker/GIF search, AI Guardians, Rich Text Editor) — см. [07-ai.md](07-ai.md#часть-1--встроенный-ai-telegram-cocoon-network) |
| Деньги | Telegram Stars (XTR) — только для digital; физтовары — сторонние провайдеры; USD-эквиваленты см. в [08](08-payments-monetization.md) |
| Боты на платформе | 10+ млн (по заявлению [core.telegram.org/bots](https://core.telegram.org/bots)), 500M+ пользователей используют Mini Apps ежемесячно (по заявлению [features](https://core.telegram.org/bots/features.md)) |

## Легенда обозначений

- `Bot API x.y` — версия, в которой возможность появилась (из официального changelog).
- «Официальный источник:» + ссылка — страница, существование/содержание которой проверено при сборке (открыта целиком 2026-11-06).
- «Неофициально» — внешние проекты/блоги; использовать с оговорками.
- Разделы «Известные расхождения» показывают места, где официальные страницы противоречат друг другу.
