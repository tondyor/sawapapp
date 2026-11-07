# 10. Источники

Все страницы ниже **открыты целиком** 2026-11-06 при сборке этого набора документов. В тексте файлов на них есть ссылки по месту; здесь — единый перечень с назначением.

Приоритет: **официальная документация `core.telegram.org`** → **официальный блог Telegram** → **офиц. GitHub** → стороннее (только с оговорками в тексте).

## 1. Главные справочники (official, core.telegram.org)

| Документ | Что внутри |
|---|---|
| [bots.md — Introduction for developers](https://core.telegram.org/bots.md) | Платформа обзор; чем боты отличаются от аккаунтов; права; BotFather; Mini Apps список; AI Agents анонс; 10+ млн ботов |
| [features.md — Detailed Guide to Bot Features](https://core.telegram.org/bots/features.md) | Все фичи: commands, keyboards, inline, deep linking, attachment menu, ephemeral, streaming, topics, AI agents, media, polls, checklists, games, Mini Apps, business, managed, bot-to-bot, guest, monetization, rich messages, languages, privacy, testing, status alerts, BotFather guide |
| [api.md — Full API Reference](https://core.telegram.org/bots/api.md) | Транспорт, способы передачи параметров, формат ответа, Local Bot API Server, command scopes algorithm, sending files, все ~250 методов Bot API 10.3 с назначением, Paid Broadcasts, ephemeral, форматирование |
| [api/types.md — Types index](https://core.telegram.org/bots/api/types.md) | Полный перечень всех типов с описаниями (доступна для поимённой проверки) |
| [api/rich-messages.md — Rich messages](https://core.telegram.org/bots/api/rich-messages.md) | Rich-форматирование: Markdown/HTML стили, лимиты (32768/500/16/50/20), все блоки и inline-кнопки, `<tg-thinking>` |
| [api/formatting.md — Formatting options](https://core.telegram.org/bots/api/formatting.md) | MarkdownV2/HTML/Markdown, date-time сущности, правила экранирования |
| [webapps.md — Mini Apps](https://core.telegram.org/bots/webapps.md) | Полная спецификация Mini Apps: 8 запусков, все методы/поля WebApp, HapticFeedback, storages (Cloud/Device/Secure), sensors, LocationManager, все 44 события, валидация initData (HMAC + Ed25519), User-Agent на Android, debug mode, attachment menu |
| [webhooks.md — Marvin's Marvellous Guide to All Things Webhook](https://core.telegram.org/bots/webhooks.md) | Полный webhook-гайд: IP-диапазоны, порты, TLS, сертификаты (verified/self-signed/intermediate/untrusted root), curl-примеры установки и тестовые апдейты |
| [faq.md — Bot FAQ](https://core.telegram.org/bots/faq.md) | Общие вопросы: privacy, отправка файлов, broadcast limits, paid broadcasts (входной порог), self-signed cert, канал для багов |
| [inline.md — Inline bots](https://core.telegram.org/bots/inline.md) | Inline-режим: результаты, Switch-PM, гео, feedback, `/setinline*` |
| [games.md — Games](https://core.telegram.org/bots/games.md) | HTML5 Games: создание через BotFather, запуск, highscores, share |
| [tutorial.md — Hello World](https://core.telegram.org/bots/tutorial.md) | Базовый туториал (Java-примеры); полезно для последовательности первых шагов |
| [samples.md — Library examples](https://core.telegram.org/bots/samples.md) | Официально рекомендованные open-source библиотеки по языкам |
| [api-changelog.md — Bot API changelog](https://core.telegram.org/bots/api-changelog.md) | Полная история версий Bot API 3.0 → 10.3 (включая все упомянутые в этой документации AI-релизы) |
| [serverless.md — Telegram Serverless](https://core.telegram.org/bots/serverless.md) | Запуск бэкенда на инфраструктуре Telegram: tgcloud CLI, handlers/endpoints/schema, SQLite, секреты, CI |
| [payments-stars.md — Digital goods](https://core.telegram.org/bots/payments-stars.md) | Stars flow: Pre-checkout, успешная оплата, refunds, disputes, live checklist |
| [payments.md — Physical goods](https://core.telegram.org/bots/payments.md) | Физические: провайдеры, токены, Stripe TEST MODE, shipping, списки валют |
| [payments/currencies.json](https://core.telegram.org/bots/payments/currencies.json) | ~140 валют с min/max amounts |
| [blockchain-guidelines.md](https://core.telegram.org/bots/blockchain-guidelines.md) | TON-only блокчейн; TON Connect; даты миграции (01/02/21.02.2025); примеры permitted/not permitted |
| [passport.md — Telegram Passport](https://core.telegram.org/passport.md) | Паспортные типы и `setPassportDataErrors` |
| [widgets/login.md](https://core.telegram.org/widgets/login.md) | Login Widget для сайтов; подпись данных; `/setdomain` |
| [self-signed.md](https://core.telegram.org/bots/self-signed.md) | Как выпустить self-signed cert (OpenSSL/keytool/Windows) |
| [api/index methods (пример)](https://core.telegram.org/bots/api/methods/sendmessage.md) | Любой метод: `…/api/methods/<name>.md` |
| [api/types (пример)](https://core.telegram.org/bots/api/types/user.md) | Любой тип: `…/api/types/<name>.md` |

## 2. Официальные блоги Telegram (blog.telegram.org / telegram.org/blog)

| Дата | Пост | Что в нём |
|---|---|---|
| 2024-02? | [notifications-bots](https://telegram.org/blog/notifications-bots) | Анонс Web Apps / Bot Revolution (Mini Apps launch) |
| 2024-12-04 | [affiliate-programs-ai-sticker-search](https://telegram.org/blog/affiliate-programs-ai-sticker-search) | **AI sticker search** (40 000 стикеров, десятки языков); **Affiliate Programs** для Mini Apps |
| 2024-11-17 | [fullscreen-miniapps-and-more](https://telegram.org/blog/fullscreen-miniapps-and-more) | Mini Apps 8.0: fullscreen, подписки Stars, ярлыки home, emoji-status, share stories |
| 2025-10-31 | [dynamic-video-quality-and-more](https://telegram.org/blog/dynamic-video-quality-and-more) | Увеличенные лимиты платных рассылок (упоминается в api.md); приоритеты видео |
| 2026-03-31 | [ai-editor-mighty-polls-and-more](https://telegram.org/blog/ai-editor-mighty-polls-and-more) | **AI Text Editor** (Cocoon), Managed bots, Live Photos, polls 2.0 |
| 2026-05-07 | [ai-bot-revolution-11-new-features](https://telegram.org/blog/ai-bot-revolution-11-new-features) | **Guest AI bots, Bot-to-Bot, Streaming, Chat Automation, Custom AI Styles, 100M+ sticker search, AI Guardians, poll limits, silent scheduled** |
| 2026-06-11 | [watch-apps-and-more](https://telegram.org/blog/watch-apps-and-more) | Rich Text for Bots, **AI Guardians**, Apple Watch/Wear OS, links in poll options, .md viewer |
| 2026-07-14 | [communities-editor-invisible-messages](https://telegram.org/blog/communities-editor-invisible-messages) | **Rich Text Editor (Premium), Communities, Ephemeral Messages, AI GIF search (350M)** |
| 2026-08-25 | [welcome-messages-buttons-TG-13](https://telegram.org/blog/welcome-messages-buttons-TG-13) | Welcome messages, кнопки в сообщениях (упоминается в этой документации?) — часть клиента |
| 2025-07? | [fullscreen-miniapps-and-more#subscription-plans](https://telegram.org/blog/fullscreen-miniapps-and-more#subscription-plans) | Подробности подписок Stars |
| 2023-10-11 | [payments-2-0-scheduled-voice-chats](https://telegram.org/blog/payments-2-0-scheduled-voice-chats) | Payments 2.0 (физические товары) |
| 2024-06-27 | [superchannels-star-reactions-subscriptions](https://telegram.org/blog/superchannels-star-reactions-subscriptions) | Star reactions, подписки каналов, paid media |
| 2024-11-29? | [w3-browser-mini-app-store](https://telegram.org/blog/w3-browser-mini-app-store) | Mini App Store, share to stories |
| 2024-11-17? | [monetization-for-channels](https://telegram.org/blog/monetization-for-channels) | Revenue share от Telegram Ads (50%) |

## 3. Условия (terms of service)

| Документ | Релевантные разделы |
|---|---|
| [Bot Developer Terms of Service](https://telegram.org/tos/bot-developers) | §4.3 Data Scraping; §5.4 Telegram Business; §6.2 Digital Goods & Services; §6.2.1 Payment Disputes; §6.2.3 Ads; §7 Blockchain Integration; §9 Compliance with Laws |
| [Telegram Terms of Service](https://telegram.org/tos) | Общие условия платформы |
| [Privacy Policy](https://telegram.org/privacy) | §7 Third-Party Payment Services |

## 4. Репозитории и внешние инструменты (офиц./primary)

| Проект | Назначение |
|---|---|
| [github.com/tdlib/telegram-bot-api](https://github.com/tdlib/telegram-bot-api) | Исходный код Local Bot API Server |
| [core.telegram.org/tdlib](https://core.telegram.org/tdlib) | TDLib — библиотека клиента Telegram |
| [core.telegram.org/api](https://core.telegram.org/api) | MTProto — полное API Telegram |
| [core.telegram.org/api/payments](https://core.telegram.org/api/payments) | MTProto Payments (для сторонних приложений) |
| [core.telegram.org/api/url-authorization](https://core.telegram.org/api/url-authorization) | Seamless authorization (Login) |
| [@BotFather](https://t.me/botfather) | Создание/управление ботами |
| [@BotFather Mini App](https://t.me/BotFather?startapp) | То же через Mini App |
| [@BotNews](https://t.me/botnews) | Официальные анонсы Bot API |
| [@BotTalk](https://t.me/bottalk) | Обсуждение |
| [@BotSupport](https://t.me/botsupport) | Поддержка |
| [@CanOfWormsBot](https://t.me/canofwormsbot) | Проверка цепочки сертификатов webhook |
| [@RichTextDemoBot](https://t.me/richtextdemobot) | Интерактивный демо rich-форматирования |
| [@DurgerKingBot](https://t.me/durgerkingbot) · [@ShopBot](https://t.me/shopbot) · [@gamebot](https://t.me/gamebot) · [@gamee](https://t.me/gamee) · [@TutorialBot](https://t.me/tutorialbot) | Живые примеры Mini App / платежей / игр / туториала |
| [Fragment](https://fragment.com) | Collectible usernames; вознаграждение Stars в TON |

## 5. Окружение, в котором выполнялась сборка

- Дата: 2026-11-06; окружение: OpenCode (Windows 11), git-репозиторий `sawapapp`.
- Сырые выгрузки страниц (raw markdown) хранились локально в `%TEMP%/opencode/tg-docs/` во время работы и **не** копируются в репозиторий (это живые документы — ссылки актуальнее копий).
- Веб-поиск (Serper и т. п.) был **недоступен** (HTTP 402); поэтому всё опирается на документацию и блог, скачанные напрямую и прочитанные целиком.
- Пункты, где официальные страницы **противоречат друг другу**, явно помечены по месту (пример: входной порог Paid Broadcasts — 10 000 Stars в `api.md`/`features.md` против 100 000 Stars + 100 000 MAU в `faq.md`).

## 6. Что сознательно НЕ включено

- Детальные лицензии/условия SDK конкретных языков (библиотеки не вендорятся; их актуальный список — в [samples.md](https://core.telegram.org/bots/samples.md)).
- Компания-специфичные политики (Stripe prohibited businesses и т. п.) — ссылка на первоисточник в [08-payments-monetization.md](08-payments-monetization.md).
- Условия Apple/Google IAP — первично: [App Store guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play payments](https://support.google.com/googleplay/android-developer/answer/9858738).
