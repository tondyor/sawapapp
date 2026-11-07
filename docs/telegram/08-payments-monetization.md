# 08. Платежи и монетизация на Telegram

> Источники: [payments-stars.md](https://core.telegram.org/bots/payments-stars.md), [payments.md](https://core.telegram.org/bots/payments.md), [api.md](https://core.telegram.org/bots/api.md#payments), [faq.md](https://core.telegram.org/bots/faq.md), [api-changelog.md](https://core.telegram.org/bots/api-changelog.md), TOS: [bot-developers](https://telegram.org/tos/bot-developers), [#6-2-digital-goods-and-services](https://telegram.org/tos/bot-developers#6-2-digital-goods-and-services).
> Информация носит справочный характер: комиссии, лимиты и доступность провайдеров — по актуальным данным на сайте/в BotFather.

## 1. Два маршрута платежей

| Что продаёте | Рельсы | Валюта | `provider_token` |
|---|---|---|---|
| Цифровые товары и услуги (доступ к боту, контент, курсы, игры, подписки, кредиты ИИ) | **Telegram Stars** | `XTR` | **пусто** |
| Физические товары и услуги (доставка) | Сторонние провайдеры (Stripe и др.) | ISO-4217 | обязателен |
| Крипто внутри Telegram Mini Apps | **запрещено** для digital (только Stars). Mini App может интегрировать блокчейн только по TON-правилам для активов (не для продажи digital-услуг) | — | — |

**Почему так**: правила Apple/Google. Продажа digital через любые другие рельсы приведёт к скрытию приложения из mobile (официальная формулировка [payments-stars.md](https://core.telegram.org/bots/payments-stars.md#q-why-cant-i-use-a-different-currency-or-payment-provider)). Свой вебсайт/внешние ссылки на внешнюю оплату digital — тоже не соответствуют политикам магазинов; Stars обязательны **внутри** Telegram.

## 2. Telegram Stars (XTR) — полный цикл

### 2.1. Поток

```
sendInvoice(XTR) → pre_checkout_query → answerPreCheckoutQuery (≤ 10 c!) → successful_payment → выдать товар
```

### 2.2. Методы и объекты

| Метод/тип | Смысл |
|---|---|
| [sendInvoice](https://core.telegram.org/bots/api/methods/sendinvoice.md) | Счёт в любой тип чата (личка, группа, канал); `start_parameter` определяет одно-/многоразовость |
| [createInvoiceLink](https://core.telegram.org/bots/api/methods/createinvoicelink.md) | Ссылка-счёт; `subscription_period` — для подписки (месяцы) |
| [answerShippingQuery](https://core.telegram.org/bots/api/methods/answershippingquery.md) | Только физтовары (нужна `is_flexible`) |
| [answerPreCheckoutQuery](https://core.telegram.org/bots/api/methods/answerprecheckoutquery.md) | Подтвердить/отклонить (≤ **10 секунд**) |
| [getMyStarBalance](https://core.telegram.org/bots/api/methods/getmystarbalance.md) | Баланс звёзд бота |
| [getStarTransactions](https://core.telegram.org/bots/api/methods/getstartransactions.md) | История (хронологически, offset) |
| [refundStarPayment](https://core.telegram.org/bots/api/methods/refundstarpayment.md) | Возврат (по `telegram_payment_charge_id`) |
| [editUserStarSubscription](https://core.telegram.org/bots/api/methods/edituserstarsubscription.md) | Вкл/выкл автопродление подписки пользователя |
| [SuccessfulPayment](https://core.telegram.org/bots/api/types/successfulpayment.md) | `currency="XTR"`, `total_amount` (целое), `invoice_payload`, `subscription_expiration_date`, `is_recurring`, `is_first_recurring`, `telegram_payment_charge_id` (хранить!) |
| [TransactionPartnerUser/Chat/…](https://core.telegram.org/bots/api/types/transactionpartner.md) | Источник/получатель транзакции |
| [StarTransaction](https://core.telegram.org/bots/api/types/startransaction.md) | `nanostar_amount` (дробные звёзды) |

### 2.3. Важные правила

1. **Обещание pre_checkout ≠ оплата**. Товар выдавать только по `successful_payment`.
2. `telegram_payment_charge_id` сохраняйте forever — без него не вернуть.
3. Customer disputes и возвраты — полностью ваша зона; Telegram не посредник.
4. Multi-chat invoice (пересланные счета с кнопкой Pay) → несколько успешных `successful_payment` с **одним** `invoice_payload` — защита от двойной выдачи (идемпотентность!).
5. Small print: `XTR` amounts — integer, минимальное значение напрямую не задано; клиент покупает звёзды у Telegram (Apple/Google IAP или @PremiumBot).
6. Telegram не берёт комиссию за платежи; Apple/Google — берут с покупки Stars пользователем; ваш доход в Stars конвертируется в [TON через Fragment](https://fragment.com) или тратите на рекламу/подарки/бусты (см. ниже).

## 3. Платные рассылки (Paid Broadcasts)

([api.md](https://core.telegram.org/bots/api.md#paid-broadcasts), [faq.md](https://core.telegram.org/bots/faq.md#how-can-i-message-all-of-my-bot-39s-subscribers-at-once))

- Без включения: ~**30 msg/s** на всех ботов; 1 msg/s на чат; 20 msg/min на группу.
- С включением: до **1000 msg/s**; каждая доставленная сверх 30 стоит **0.1 Star** (только успешно доставленные); неоплаченные не списываются.
- **Включение в BotFather → Bot Settings → Paid Broadcasts.** Про «входной порог» официальные страницы **противоречат друг другу**: в `faq.md` — ≥ **100 000 Stars** на балансе и ≥ **100 000 MAU**; в `api.md`/`features.md` — ≥ **10 000 Stars**. Используйте BotFather как источник истины на текущий момент.
- В коде: `allow_paid_broadcast=true` в send*/copyMessage методах.

## 4. Платный контент и подписки

| Инструмент | Что делает | Где |
|---|---|---|
| **Paid Media** (`sendPaidMedia`) | платные фото/видео/альбомы — просмотр после оплаты | любые чаты с правом писать |
| **Paid Posts в Direct Messages каналов** | пост с ценой за одобрение поста (`suggested_post_parameters`, `is_paid_post`) | direct messages канала |
| **Star Subscriptions для бота** | `subscription_period` в `createInvoiceLink`; tiers контента/фич | цифровой контент |
| **Subscription invite links** (каналы) | ссылки с ежемесячным платежом Stars | каналы (пользователи платят за доступ) |
| **Gifts** | `getAvailableGifts` → `sendGift(user_id|chat_id)` (+ `pay_for_upgrade`) | награды/UGC/вирусность |
| **Gift Premium** | `giftPremiumSubscription` — Premium подписка за звёзды | награды |
| **Revenue share от Telegram Ads** | 50% дохода от рекламы в чате с ботом | когда бот популярен |
| **Affiliate Programs** | звёзды за рефералов Mini App (и за их покупки) | [affiliate-programs-ai-sticker-search](https://telegram.org/blog/affiliate-programs-ai-sticker-search) |
| **Paid Message Stars** (чаты) | `paid_message_star_count` — пользователи платят, чтобы написать в чат/канал | чаты/каналы с настройкой |

## 5. Физические товары (провайдеры)

1. BotFather → `/mybots` → бот → **Bot Settings → Payments** → выбрать провайдера (или **"Stripe TEST MODE"** для тестов, карта `4242 4242 4242 4242`).
2. Получить **provider token** (`123:LIVE:XXXX` в проде).
3. `sendInvoice` с `provider_token`, `prices[]`, `max_tip_amount`, `suggested_tip_amounts`, `need_name/phone_number/email/shipping_address`, `is_flexible=true` (если нужны варианты доставки).
4. `shipping_query` → `answerShippingQuery(options[] | error)`.
5. `pre_checkout_query` → `answerPreCheckoutQuery` (≤ 10 c).
6. `successful_payment` → доставка.
7. Инвойсы можно пересылать/использовать несколькими покупателями; single-chat вариант (`start_parameter` с коротким кодом) — всегда один плательщик.
8. Провайдеры берут свою комиссию (Stripe US: 2.9% + 30¢) — Telegram ничего не берёт.
9. Список ~140 валют с min/max: [currencies.json](https://core.telegram.org/bots/payments/currencies.json); ~US$1–10 000 ≈, 12 цифр max.
10. Для iOS digital-ограничения действовали до [изменения правил Apple 2024](https://developer.apple.com/news/?id=f1v8pyay) — сейчас всё digital идёт только через Stars.

## 6. Обязанности мерчанта (обязательные!)

По Telegram Bot Platform Developer Terms §§:

- **«/terms»** — доступ к Terms понятным языком; согласие пользователя до покупки;
- **«/support»** / `/paysupport` — своевременная обработка обращений по платежам; предупредить, что Telegram не поможет;
- **бэкапы** данных о платежах;
- **споры и chargebacks** — на вас и провайдере;
- **2FA** на аккаунте-владельце бота;
- **отказ** от мульти-платежа, если заказ нельзя исполнить (проверять наличие товара в shipping_query);
- **валюты digital** — только Stars (§6.2);
- **возраст**: соблюдать возрастные ограничения и санкционные правила юрисдикций (§9);
- если бот продаёт **подписки** — понятные условия и лёгкий способ отменить.

## 7. Вывод средств и экономика Stars

| Путь | Как |
|---|---|
| Вывод в токен | Вознаграждение Stars за платформу (фрагмент; опции вывода только через официальный интерфейс) |
| Траты внутри Telegram | Реклама (Telegram Ads), подарки пользователям (`sendGift`), бусты, Premium-подарки |
| Перевод на бизнес-аккаунт | `transferBusinessAccountStars` (от бизнес-аккаунта боту для вывода) |
| Платные рассылки (увеличение лимита) | трата Stars |
| Подарки → звёзды | `convertGiftToStars`, `upgradeGift` (платный апгрейд) |

## 8. Быстрый чеклист монетизации

- [ ] Цифровое → только XTR; физическое → provider_token
- [ ] `answerPreCheckoutQuery` во все пути, включая ошибки (≤ 10 c)
- [ ] `telegram_payment_charge_id` сохранён; идемпотентность по `payload+chat+user`
- [ ] `/terms`, `/paysupport` работают; в условиях указана политика возвратов
- [ ] 2FA владельца; токен в секретах; бэкапы
- [ ] Для подписок — цена/период/отмена задокументированы
- [ ] Для paid media вперёд — `can_send_paid_media` в `ChatFullInfo`
- [ ] Тесты на test environment; refundStarPayment проверен
- [ ] Потоки Apple/Google соблюдены (никаких «купите у нас на сайте» для digital)
