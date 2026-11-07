# 02. Bot API — полная спецификация

> Источники: [api.md](https://core.telegram.org/bots/api.md), [types.md](https://core.telegram.org/bots/api/types.md), [inline.md](https://core.telegram.org/bots/inline.md), [games.md](https://core.telegram.org/bots/games.md), [formatting.md](https://core.telegram.org/bots/api/formatting.md), [rich-messages.md](https://core.telegram.org/bots/api/rich-messages.md), [payments.md](https://core.telegram.org/bots/payments.md), [payments-stars.md](https://core.telegram.org/bots/payments-stars.md). Прочитано целиком 2026-11-06.
> `Bot API 10.3` (24.08.2026) — последняя документированная версия. Методы case-insensitive.

## 0. Транспорт и конверт (краткая справка)

- `https://api.telegram.org/bot<token>/<METHOD_NAME>` · GET и POST · UTF-8.
- Передача параметров: query string · x-www-form-urlencoded · application/json (без файлов) · multipart/form-data (с файлами).
- Ответ: `{ok: true, result: …}` или `{ok: false, error_code, description, parameters?}`.
- Методы case-insensitive; все запросы — UTF-8; целочисленные поля — в 32 бита, id сущностей — 64 бита.
- В webhook-режиме метод можно передать в теле ответа (`method`), но результат не узнать (см. [01, раздел 2](01-architecture.md#2-транспорт-bot-api)).
- Проверить подлинность вызова Bot API → ResponseParameters (`retry_after`, `migrate_to_chat_id`, …).

## 1. Авторизация и тестирование токена

| Метод | Назначение |
|---|---|
| [getMe](https://core.telegram.org/bots/api/methods/getme.md) | Простая проверка токена; возвращает объект User + служебные поля (`can_join_groups`, `can_read_all_group_messages`, `supports_inline_queries`, `can_manage_bots`, `can_connect_to_business`, `has_main_web_app`) |
| [logOut](https://core.telegram.org/bots/api/methods/logout.md) | Выйти с облачного Bot API сервера перед запуском локального (обязательно!) |
| [close](https://core.telegram.org/bots/api/methods/close.md) | Закрыть экземпляр бота перед переносом на другой локальный сервер |

## 2. Доставка апдейтов

| Метод | Назначение |
|---|---|
| [getUpdates](https://core.telegram.org/bots/api/methods/getupdates.md) | Long polling. Возвращает до 100 самых старых неподтверждённых апдейтов; подтверждение — `offset` (последний `update_id` + 1) |
| [setWebhook](https://core.telegram.org/bots/api/methods/setwebhook.md) | Установить webhook URL (HTTPS, допустимые порты, TLS 1.2+, CN/SAN = домен). Параметры: `url`, `certificate` (InputFile для self-signed), `ip_address`, `max_connections` (1–100), `allowed_updates`, `drop_pending_updates`, `secret_token` |
| [deleteWebhook](https://core.telegram.org/bots/api/methods/deletewebhook.md) | Снять webhook (+ `drop_pending_updates`) |
| [getWebhookInfo](https://core.telegram.org/bots/api/methods/getwebhookinfo.md) | Статус webhook: url, allowed_updates, pending_update_count, last_error_date/message, last_synchronization_error_date, max_connections, ip_address |

## 3. Отправка сообщений и работа с историей

| Метод | Назначение |
|---|---|
| [sendMessage](https://core.telegram.org/bots/api/methods/sendmessage.md) | Текст 1–4096 символов; `parse_mode` MarkdownV2/HTML; `entities`; `link_preview_options`; `reply_parameters` (+`ephemeral_message_id`); `message_thread_id`; `business_connection_id`; `direct_messages_topic_id`; `suggested_post_parameters`; `ephemeral_message_parameters` (Bot API 10.2+, заменяет `receiver_user_id`/`callback_query_id`) |
| [sendMessageDraft](https://core.telegram.org/bots/api/methods/sendmessagedraft.md) | **Стриминг** черновика ответа в приватный чат (можно пустой текст = «Thinking…»; `can_stop`, `keep_on_stop` — Bot API 10.3). Bot API 9.3+ |
| [sendRichMessage](https://core.telegram.org/bots/api/methods/sendrichmessage.md) | Отправить **rich message** (структурное форматирование: заголовки, таблицы, LaTeX, медиа, кнопки). Bot API 10.1+ |
| [sendRichMessageDraft](https://core.telegram.org/bots/api/methods/sendrichmessagedraft.md) | Стримить частичный rich message; `<tg-thinking>`; `can_stop`/`keep_on_stop`. Bot API 10.1+ |
| [forwardMessage](https://core.telegram.org/bots/api/methods/forwardmessage.md) | Переслать сообщение |
| [forwardMessages](https://core.telegram.org/bots/api/methods/forwardmessages.md) | Переслать несколько сообщений одним запросом (Bot API 7.0+) |
| [copyMessage](https://core.telegram.org/bots/api/methods/copymessage.md) | Копировать сообщение (без референса на оригинал). Не для paid media |
| [copyMessages](https://core.telegram.org/bots/api/methods/copymessages.md) | Копировать несколько сообщений |
| [sendPhoto](https://core.telegram.org/bots/api/methods/sendphoto.md) | Фото (multipart ≤ 10 MB; по URL ≤ 5 MB; `file_id` без лимитов); `caption` с форматированием; `has_spoiler`; `show_caption_above_media` |
| [sendLivePhoto](https://core.telegram.org/bots/api/methods/sendlivephoto.md) | Live Photo (фото + короткое видео). Bot API 10.0+ |
| [sendAudio](https://core.telegram.org/bots/api/methods/sendaudio.md) | Аудио «как музыка» (mp3/m4a, видно длительность) |
| [sendDocument](https://core.telegram.org/bots/api/methods/senddocument.md) | Документ (multipart ≤ 50 MB; URL — только PDF/ZIP) |
| [sendVideo](https://core.telegram.org/bots/api/methods/sendvideo.md) | Видео MPEG4 (иначе — как document); `supports_streaming`; `cover`; `start_timestamp` |
| [sendAnimation](https://core.telegram.org/bots/api/methods/sendanimation.md) | GIF или H.264-без звука |
| [sendVoice](https://core.telegram.org/bots/api/methods/sendvoice.md) | Голосовое (ogg/opus ≤ 1 MB, иначе — как файл) |
| [sendVideoNote](https://core.telegram.org/bots/api/methods/sendvideonote.md) | Круглое видео ≤ 1 мин |
| [sendPaidMedia](https://core.telegram.org/bots/api/methods/sendpaidmedia.md) | **Платный контент** (фото/видео/альбомы) — просмотр за звёзды; payload/звёзды ≤ 25000 (9.3), ранее 10000 (9.0). Bot API 7.6+ |
| [sendMediaGroup](https://core.telegram.org/bots/api/methods/sendmediagroup.md) | Альбом фото/видео/документов/аудио/live photos (2–10 элементов) |
| [sendLocation](https://core.telegram.org/bots/api/methods/sendlocation.md) | Точка на карте; live location; proximity alerts; heading; horizontal_accuracy |
| [sendVenue](https://core.telegram.org/bots/api/methods/sendvenue.md) | Площадка (адрес, foursquare_id/type, google_place_id/type) |
| [sendContact](https://core.telegram.org/bots/api/methods/sendcontact.md) | Контакт (имя, телефон, vCard) |
| [sendPoll](https://core.telegram.org/bots/api/methods/sendpoll.md) | Нативный опрос/квиз (до 12 вариантов; мульти-ответы в квизах; `members_only`, `country_codes`, media в вопросе/вариантах/объяснении, `allows_revoting`, `shuffle_options`, `hide_results_until_closes`, `description`). Bot API 5.0/9.6/10.0 |
| [sendChecklist](https://core.telegram.org/bots/api/methods/sendchecklist.md) | Чеклист **от имени бизнес-аккаунта**. Bot API 9.1+ |
| [sendDice](https://core.telegram.org/bots/api/methods/senddice.md) | Анимированная игра (dice/darts/basketball/football/bowling/slot machine) |
| [sendChatAction](https://core.telegram.org/bots/api/methods/sendchataction.md) | Индикаторы «печатает/загружает/записывает…» |
| [setMessageReaction](https://core.telegram.org/bots/api/methods/setmessagereaction.md) | Установить свою реакцию на сообщение (emoji/custom/paid) |
| [getUserProfilePhotos](https://core.telegram.org/bots/api/methods/getuserprofilephotos.md) | Профильные фото пользователя |
| [getUserProfileAudios](https://core.telegram.org/bots/api/methods/getuserprofileaudios.md) | Аудио в профиле пользователя. Bot API 9.4+ |
| [setUserEmojiStatus](https://core.telegram.org/bots/api/methods/setuseremojistatus.md) | Поставить emoji-статус (только после права, полученного через Mini App `requestEmojiStatusAccess`). Bot API 8.0+ |
| [getFile](https://core.telegram.org/bots/api/methods/getfile.md) | Подготовить файл на сервере; `file_path` (до 20 MB) |

## 4. Администрирование групп и каналов

| Метод | Назначение |
|---|---|
| [banChatMember](https://core.telegram.org/bots/api/methods/banchatmember.md) | Банить пользователя (до 366 дней или 0 = навсегда) |
| [unbanChatMember](https://core.telegram.org/bots/api/methods/unbanchatmember.md) | Разбанить (+ `only_if_banned`) |
| [restrictChatMember](https://core.telegram.org/bots/api/methods/restrictchatmember.md) | Ограничить права (send, media types по отдельности, until_date) |
| [promoteChatMember](https://core.telegram.org/bots/api/methods/promotechatmember.md) | Выдать/снять права администратора |
| [setChatAdministratorCustomTitle](https://core.telegram.org/bots/api/methods/setchatadministratorcustomtitle.md) | Кастомный титул админа (16 симв., требует is_anonymous-право) |
| [setChatMemberTag](https://core.telegram.org/bots/api/methods/setchatmembertag.md) | Тег обычного участника. Bot API 9.5+ |
| [banChatSenderChat](https://core.telegram.org/bots/api/methods/banchatsenderchat.md) | Запретить каналу писать (supergroup/channel) |
| [unbanChatSenderChat](https://core.telegram.org/bots/api/methods/unbanchatsenderchat.md) | Разрешить каналу писать |
| [setChatPermissions](https://core.telegram.org/bots/api/methods/setchatpermissions.md) | Права по умолчанию для всех участников |
| [exportChatInviteLink](https://core.telegram.org/bots/api/methods/exportchatinvitelink.md) | Новая основная ссылка-приглашение |
| [createChatInviteLink](https://core.telegram.org/bots/api/methods/createchatinvitelink.md) | Дополнительная ссылка (member_limit, expire_date, creates_join_request) |
| [editChatInviteLink](https://core.telegram.org/bots/api/methods/editchatinvitelink.md) | Изменить дополнительную/подписочную ссылку |
| [createChatSubscriptionInviteLink](https://core.telegram.org/bots/api/methods/createchatsubscriptioninvitelink.md) | Подписочная ссылка (Stars в месяц; каналы). Bot API 7.9+ |
| [editChatSubscriptionInviteLink](https://core.telegram.org/bots/api/methods/editchatsubscriptioninvitelink.md) | Изменить название подписочной ссылки |
| [revokeChatInviteLink](https://core.telegram.org/bots/api/methods/revokechatinvitelink.md) | Отозвать ссылку бота |
| [approveChatJoinRequest](https://core.telegram.org/bots/api/methods/approvechatjoinrequest.md) | Одобрить заявку на вступление |
| [declineChatJoinRequest](https://core.telegram.org/bots/api/methods/declinechatjoinrequest.md) | Отклонить заявку |
| [answerChatJoinRequestQuery](https://core.telegram.org/bots/api/methods/answerchatjoinrequestquery.md) | Обработать query join-request (approve/deny + текст/url). Bot API 10.1+ |
| [sendChatJoinRequestWebApp](https://core.telegram.org/bots/api/methods/sendchatjoinrequestwebapp.md) | Показать Mini App в guard-боте до решения. Bot API 10.1+ |
| [setChatPhoto](https://core.telegram.org/bots/api/methods/setchatphoto.md) · [deleteChatPhoto](https://core.telegram.org/bots/api/methods/deletechatphoto.md) · [setChatTitle](https://core.telegram.org/bots/api/methods/setchattitle.md) · [setChatDescription](https://core.telegram.org/bots/api/methods/setchatdescription.md) | Фото/название/описание |
| [pinChatMessage](https://core.telegram.org/bots/api/methods/pinchatmessage.md) · [unpinChatMessage](https://core.telegram.org/bots/api/methods/unpinchatmessage.md) · [unpinAllChatMessages](https://core.telegram.org/bots/api/methods/unpinallchatmessages.md) | Закрепление сообщений (unpinAll — кроме General-форумных) |
| [leaveChat](https://core.telegram.org/bots/api/methods/leavechat.md) | Выйти из чата |
| [getChat](https://core.telegram.org/bots/api/methods/getchat.md) | Полный ChatFullInfo (bio, linked_chat_id, permissions, …) |
| [getChatAdministrators](https://core.telegram.org/bots/api/methods/getchatadministrators.md) | Список администраторов (`return_bots` — 10.0) |
| [getChatMemberCount](https://core.telegram.org/bots/api/methods/getchatmembercount.md) | Число участников |
| [getChatMember](https://core.telegram.org/bots/api/methods/getchatmember.md) | Информация об участнике |
| [getUserPersonalChatMessages](https://core.telegram.org/bots/api/methods/getuserpersonalchatmessages.md) | Последние сообщения персонального чата пользователя. Bot API 10.0+ |
| [setChatStickerSet](https://core.telegram.org/bots/api/methods/setchatstickerset.md) · [deleteChatStickerSet](https://core.telegram.org/bots/api/methods/deletechatstickerset.md) | Стикерсет супергруппы |

## 5. Темы/топики (форумы в группах и теперь — в личке)

| Метод | Назначение |
|---|---|
| [getForumTopicIconStickers](https://core.telegram.org/bots/api/methods/getforumtopiciconstickers.md) | Доступные custom-emoji для иконок топиков |
| [createForumTopic](https://core.telegram.org/bots/api/methods/createforumtopic.md) | Создать тему (супергруппа или **личка с пользователем**, Bot API 9.4+) |
| [editForumTopic](https://core.telegram.org/bots/api/methods/editforumtopic.md) | Изменить имя/иконку темы |
| [closeForumTopic](https://core.telegram.org/bots/api/methods/closeforumtopic.md) · [reopenForumTopic](https://core.telegram.org/bots/api/methods/reopenforumtopic.md) | Закрыть/открыть тему |
| [deleteForumTopic](https://core.telegram.org/bots/api/methods/deleteforumtopic.md) | Удалить тему и её сообщения |
| [unpinAllForumTopicMessages](https://core.telegram.org/bots/api/methods/unpinallforumtopicmessages.md) | Открепить все в теме |
| [editGeneralForumTopic](https://core.telegram.org/bots/api/methods/editgeneralforumtopic.md) · [closeGeneralForumTopic](https://core.telegram.org/bots/api/methods/closegeneralforumtopic.md) · [reopenGeneralForumTopic](https://core.telegram.org/bots/api/methods/reopengeneralforumtopic.md) · [hideGeneralForumTopic](https://core.telegram.org/bots/api/methods/hidegeneralforumtopic.md) · [unhideGeneralForumTopic](https://core.telegram.org/bots/api/methods/unhidegeneralforumtopic.md) · [unpinAllGeneralForumTopicMessages](https://core.telegram.org/bots/api/methods/unpinallgeneralforumtopicmessages.md) | Управление темой «General» |

## 6. Callback queries, guests и boosts

| Метод | Назначение |
|---|---|
| [answerCallbackQuery](https://core.telegram.org/bots/api/methods/answercallbackquery.md) | Ответить на callback (текст, show_alert, url для игры, cache_time) |
| [answerGuestQuery](https://core.telegram.org/bots/api/methods/answerguestquery.md) | Ответ гостевого бота: отправить сообщение в чат, где бота позвали. Bot API 10.0+ |
| [getUserChatBoosts](https://core.telegram.org/bots/api/methods/getuserchatboosts.md) | Бусты, добавленные пользователем (Bot API 7.0+) |

## 7. Бизнес-подключения (Secretary Mode)

| Метод | Назначение |
|---|---|
| [getBusinessConnection](https://core.telegram.org/bots/api/methods/getbusinessconnection.md) | Состояние подключения бота к бизнес-аккаунту |
| [readBusinessMessage](https://core.telegram.org/bots/api/methods/readbusinessmessage.md) | Отметить прочитанным |
| [deleteBusinessMessages](https://core.telegram.org/bots/api/methods/deletebusinessmessages.md) | Удалить сообщения |
| [setBusinessAccountName](https://core.telegram.org/bots/api/methods/setbusinessaccountname.md) · [setBusinessAccountUsername](https://core.telegram.org/bots/api/methods/setbusinessaccountusername.md) · [setBusinessAccountBio](https://core.telegram.org/bots/api/methods/setbusinessaccountbio.md) | Имя/username/bio бизнес-аккаунта |
| [setBusinessAccountProfilePhoto](https://core.telegram.org/bots/api/methods/setbusinessaccountprofilephoto.md) · [removeBusinessAccountProfilePhoto](https://core.telegram.org/bots/api/methods/removebusinessaccountprofilephoto.md) | Фото профиля |
| [setBusinessAccountGiftSettings](https://core.telegram.org/bots/api/methods/setbusinessaccountgiftsettings.md) | Настройки приёма подарков бизнесом |
| [getBusinessAccountStarBalance](https://core.telegram.org/bots/api/methods/getbusinessaccountstarbalance.md) | Баланс звёзд бизнес-аккаунта |
| [transferBusinessAccountStars](https://core.telegram.org/bots/api/methods/transferbusinessaccountstars.md) | Перевести звёзды бизнес-аккаунта на баланс бота |
| [getBusinessAccountGifts](https://core.telegram.org/bots/api/methods/getbusinessaccountgifts.md) | Подарки бизнес-аккаунта |
| [getUserGifts](https://core.telegram.org/bots/api/methods/getusergifts.md) · [getChatGifts](https://core.telegram.org/bots/api/methods/getchatgifts.md) | Подарки пользователя/чата. Bot API 9.3+ |
| [convertGiftToStars](https://core.telegram.org/bots/api/methods/convertgifttostars.md) | Обменять подарок на звёзды |
| [upgradeGift](https://core.telegram.org/bots/api/methods/upgradegift.md) | Апгрейд обычного подарка до уникального |
| [transferGift](https://core.telegram.org/bots/api/methods/transfergift.md) | Передать уникальный подарок |
| [postStory](https://core.telegram.org/bots/api/methods/poststory.md) · [repostStory](https://core.telegram.org/bots/api/methods/repoststory.md) · [editStory](https://core.telegram.org/bots/api/methods/editstory.md) · [deleteStory](https://core.telegram.org/bots/api/methods/deletestory.md) | Истории от имени бизнес-аккаунта (Bot API 9.0+) |

## 8. Управление ботом и его меню

| Метод | Назначение |
|---|---|
| [setMyCommands](https://core.telegram.org/bots/api/methods/setmycommands.md) · [deleteMyCommands](https://core.telegram.org/bots/api/methods/deletemycommands.md) · [getMyCommands](https://core.telegram.org/bots/api/methods/getmycommands.md) | Список команд (scope + language_code) |
| [setMyName](https://core.telegram.org/bots/api/methods/setmyname.md) · [getMyName](https://core.telegram.org/bots/api/methods/getmyname.md) | Имя (локализованное) |
| [setMyDescription](https://core.telegram.org/bots/api/methods/setmydescription.md) · [getMyDescription](https://core.telegram.org/bots/api/methods/getmydescription.md) | Описание «What can this bot do?» (≤ 512) |
| [setMyShortDescription](https://core.telegram.org/bots/api/methods/setmyshortdescription.md) · [getMyShortDescription](https://core.telegram.org/bots/api/methods/getmyshortdescription.md) | Short-описание в профиле (≤ 120) |
| [setMyProfilePhoto](https://core.telegram.org/bots/api/methods/setmyprofilephoto.md) · [removeMyProfilePhoto](https://core.telegram.org/bots/api/methods/removemyprofilephoto.md) | Аватар (static/animated). Bot API 9.4+ |
| [setChatMenuButton](https://core.telegram.org/bots/api/methods/setchatmenubutton.md) · [getChatMenuButton](https://core.telegram.org/bots/api/methods/getchatmenubutton.md) | Кнопка меню/запуска Mini App (для всех или chat_id) |
| [setMyDefaultAdministratorRights](https://core.telegram.org/bots/api/methods/setmydefaultadministratorrights.md) · [getMyDefaultAdministratorRights](https://core.telegram.org/bots/api/methods/getmydefaultadministratorrights.md) | Права по умолчанию при добавлении админом |

## 9. Подарки и премиум

| Метод | Назначение |
|---|---|
| [getAvailableGifts](https://core.telegram.org/bots/api/methods/getavailablegifts.md) | Список подарков, доступных для отправки ботом |
| [sendGift](https://core.telegram.org/bots/api/methods/sendgift.md) | Отправить подарок пользователю/каналу (+ `pay_for_upgrade`, `gift_id`) |
| [giftPremiumSubscription](https://core.telegram.org/bots/api/methods/giftpremiumsubscription.md) | Подарить Telegram Premium за звёзды |

## 10. Верификация от имени организации

| Метод | Назначение |
|---|---|
| [verifyUser](https://core.telegram.org/bots/api/methods/verifyuser.md) · [verifyChat](https://core.telegram.org/bots/api/methods/verifychat.md) | Верифицировать пользователя/чат от имени организации-бот-владельца |
| [removeUserVerification](https://core.telegram.org/bots/api/methods/removeuserverification.md) · [removeChatVerification](https://core.telegram.org/bots/api/methods/removechatverification.md) | Снять верификацию |

## 11. Mini App / Web App и inline-сообщения

| Метод | Назначение |
|---|---|
| [answerWebAppQuery](https://core.telegram.org/bots/api/methods/answerwebappquery.md) | Установить результат взаимодействия с Web App: отправить сообщение от имени пользователя из inline-кнопки/Menu Button Mini App в чат и закрыть Mini App |
| [answerInlineQuery](https://core.telegram.org/bots/api/methods/answerinlinequery.md) | Выдать результаты inline-запроса (+ `button` → Mini App/URL; `is_personal`; `next_offset`; `cache_time`) |
| [savePreparedInlineMessage](https://core.telegram.org/bots/api/methods/savepreparedinlinemessage.md) | Сохранить сообщение, которое пользователь сможет отправить из Mini App через `shareMessage()` (готовит `PreparedInlineMessage`) |
| [savePreparedKeyboardButton](https://core.telegram.org/bots/api/methods/savepreparedkeyboardbutton.md) | Сохранить клавиатурную кнопку для использования пользователем в Mini App (request users/chat/managed bot) |
| [getManagedBotToken](https://core.telegram.org/bots/api/methods/getmanagedbottoken.md) · [replaceManagedBotToken](https://core.telegram.org/bots/api/methods/replacemanagedbottoken.md) · [getManagedBotAccessSettings](https://core.telegram.org/bots/api/methods/getmanagedbotaccesssettings.md) · [setManagedBotAccessSettings](https://core.telegram.org/bots/api/methods/setmanagedbotaccesssettings.md) | Управление managed-ботами (Bot API 9.6+) |

## 12. Обновление и удаление сообщений

| Метод | Назначение |
|---|---|
| [editMessageText](https://core.telegram.org/bots/api/methods/editmessagetext.md) · [editMessageCaption](https://core.telegram.org/bots/api/methods/editmessagecaption.md) · [editMessageMedia](https://core.telegram.org/bots/api/methods/editmessagemedia.md) · [editMessageLiveLocation](https://core.telegram.org/bots/api/methods/editmessagelivelocation.md) · [editMessageChecklist](https://core.telegram.org/bots/api/methods/editmessagechecklist.md) · [editMessageReplyMarkup](https://core.telegram.org/bots/api/methods/editmessagereplymarkup.md) | Редактирование отправленного ботом/админом сообщения (+ `business_connection_id`; `rich_message` в editMessageText) |
| [stopMessageLiveLocation](https://core.telegram.org/bots/api/methods/stopmessagelivelocation.md) | Остановить live-локацию досрочно |
| [stopPoll](https://core.telegram.org/bots/api/methods/stoppoll.md) | Закрыть опрос |
| [editEphemeralMessageText](https://core.telegram.org/bots/api/methods/editephemeralmessagetext.md) · [editEphemeralMessageMedia](https://core.telegram.org/bots/api/methods/editephemeralmessagemedia.md) · [editEphemeralMessageCaption](https://core.telegram.org/bots/api/methods/editephemeralmessagecaption.md) · [editEphemeralMessageReplyMarkup](https://core.telegram.org/bots/api/methods/editephemeralmessagereplymarkup.md) | Редактирование эфемерных сообщений (Bot API 10.2+) |
| [approveSuggestedPost](https://core.telegram.org/bots/api/methods/approvesuggestedpost.md) · [declineSuggestedPost](https://core.telegram.org/bots/api/methods/declinesuggestedpost.md) | Модерация предложенных постов в каналах/директах (Bot API 9.2+) |
| [deleteMessage](https://core.telegram.org/bots/api/methods/deletemessage.md) | Удалить сообщение (ограничения: 48 ч — для чужих в приватке; сервисные топики удалить нельзя) |
| [deleteMessages](https://core.telegram.org/bots/api/methods/deletemessages.md) | Батч-удаление |
| [deleteEphemeralMessage](https://core.telegram.org/bots/api/methods/deleteephemeralmessage.md) | Удалить эфемерное сообщение. Bot API 10.2+ |
| [deleteMessageReaction](https://core.telegram.org/bots/api/methods/deletemessagereaction.md) · [deleteAllMessageReactions](https://core.telegram.org/bots/api/methods/deleteallmessagereactions.md) | Очистка реакций (модерация; Bot API 10.0+) |

## 13. Стикеры и кастомные эмодзи

| Метод | Назначение |
|---|---|
| [sendSticker](https://core.telegram.org/bots/api/methods/sendsticker.md) | Отправить стикер (.WEBP статика / .TGS анимация / .WEBM видео) |
| [getStickerSet](https://core.telegram.org/bots/api/methods/getstickerset.md) · [getCustomEmojiStickers](https://core.telegram.org/bots/api/methods/getcustomemojistickers.md) | Набор; информация о custom-emoji по id |
| [uploadStickerFile](https://core.telegram.org/bots/api/methods/uploadstickerfile.md) | Загрузить файл заранее (многоразовое использование) |
| [createNewStickerSet](https://core.telegram.org/bots/api/methods/createnewstickerset.md) · [addStickerToSet](https://core.telegram.org/bots/api/methods/addstickertoset.md) · [setStickerPositionInSet](https://core.telegram.org/bots/api/methods/setstickerpositioninset.md) · [deleteStickerFromSet](https://core.telegram.org/bots/api/methods/deletestickerfromset.md) | Полный цикл набора |
| [replaceStickerInSet](https://core.telegram.org/bots/api/methods/replacestickerinset.md) | Заменить стикер в наборе |
| [setStickerEmojiList](https://core.telegram.org/bots/api/methods/setstickeremojilist.md) · [setStickerKeywords](https://core.telegram.org/bots/api/methods/setstickerkeywords.md) · [setStickerMaskPosition](https://core.telegram.org/bots/api/methods/setstickermaskposition.md) | Emoji-привязка, ключевые слова, маска |
| [setStickerSetTitle](https://core.telegram.org/bots/api/methods/setstickersettitle.md) · [setStickerSetThumbnail](https://core.telegram.org/bots/api/methods/setstickersetthumbnail.md) · [setCustomEmojiStickerSetThumbnail](https://core.telegram.org/bots/api/methods/setcustomemojistickersetthumbnail.md) · [deleteStickerSet](https://core.telegram.org/bots/api/methods/deletestickerset.md) | Название/превью/удаление набора |

> Все методы цикла работают только с наборами, созданными **этим** ботом. Регулярные и mask-наборы — до 120 стикеров; custom-emoji — см. актуальный changelog.

## 14. Rich Messages (Bot API 10.1 — основа AI-ответов)

Методы: [sendRichMessage](https://core.telegram.org/bots/api/methods/sendrichmessage.md), [sendRichMessageDraft](https://core.telegram.org/bots/api/methods/sendrichmessagedraft.md); редактирование — через [editMessageText](https://core.telegram.org/bots/api/methods/editmessagetext.md) (`rich_message`), [editEphemeralMessageText](https://core.telegram.org/bots/api/methods/editephemeralmessagetext.md).
Форматирование: [Rich Markdown](https://core.telegram.org/bots/api/rich-messages.md#rich-markdown-style) (GFM + встроенные HTML-теги) и [Rich HTML](https://core.telegram.org/bots/api/rich-messages.md#rich-html-style).

Лимиты rich message ([rich-messages.md](https://core.telegram.org/bots/api/rich-messages.md#rich-message-limits)):

| Параметр | Лимит |
|---|---|
| Длина текста | ≤ **32768** UTF-8 символов (альты custom-emoji и LaTeX в счёт включены) |
| Блоки | ≤ **500** (вложенные + list items + table rows + quotes + details) |
| Уровни вложенности | ≤ **16** |
| Медиа-вложений | ≤ **50** |
| Колонки в таблице | ≤ **20** |

Возможности: заголовки H1–H6, списки (в т. ч. task lists), таблицы (col/rowspan, striped/bordered/compact, caption), LaTeX inline (`$...$`) и block (`$$...$$`), collage/slideshow, details (раскрывашки), pull quotes, footnotes, anchor-ссылки внутри документа, кнопки (до 12 стилей: url/callback_data/web_app/login_url/switch_inline_query* /copy_text/disabled), встроенные медиа через URL или `tg://` file ids, карта `<tg-map>`, радиокнопки посредством чекбоксов `<input type="checkbox">`. Отображение до 8 000 символов с кнопкой «Show more» в новых клиентах (клиентская деталь, см. блог).

## 15. Inline mode

| Метод | Назначение |
|---|---|
| [answerInlineQuery](https://core.telegram.org/bots/api/methods/answerinlinequery.md) | Выдать до 50 результатов: статьи/фото/gif/видео/аудио/голос/документы/локации/venue/контакты/игры/товары/cached-*; `is_personal`, `cache_time`, `next_offset`, `button` (InlineQueryResultsButton для запуска Mini App/URL) |

Порядок: `/setinline` в BotFather (+ `/setinlineplaceholder`); для гео — `/setinlinegeo`; для статистики выбора — `/setinlinefeedback` (1/10, 1/100, 1/1000). Результаты — 20 типов контента. Подробнее: [inline.md](https://core.telegram.org/bots/inline.md).

## 16. Платежи

| Метод | Назначение |
|---|---|
| [sendInvoice](https://core.telegram.org/bots/api/methods/sendinvoice.md) | Счёт (XTR → цифровое, без provider_token; ISO-4217 → физтовары, provider_token нужен) |
| [createInvoiceLink](https://core.telegram.org/bots/api/methods/createinvoicelink.md) | Ссылка-счёт (+ `subscription_period` — подписка за звёзды) |
| [answerShippingQuery](https://core.telegram.org/bots/api/methods/answershippingquery.md) | Варианты доставки (только для is_flexible у физтоваров) |
| [answerPreCheckoutQuery](https://core.telegram.org/bots/api/methods/answerprecheckoutquery.md) | Подтверждение заказа (**≤ 10 секунд**, иначе транзакция отменяется) |
| [getMyStarBalance](https://core.telegram.org/bots/api/methods/getmystarbalance.md) | Баланс звёзд бота |
| [getStarTransactions](https://core.telegram.org/bots/api/methods/getstartransactions.md) | История транзакций (хронологически, `offset`) |
| [refundStarPayment](https://core.telegram.org/bots/api/methods/refundstarpayment.md) | Возврат звёзд по `telegram_payment_charge_id` |
| [editUserStarSubscription](https://core.telegram.org/bots/api/methods/edituserstarsubscription.md) | Включить/отключить автопродление подписки пользователя |

## 17. Telegram Passport (устаревший, но в API)

[setPassportDataErrors](https://core.telegram.org/bots/api/methods/setpassportdataerrors.md) — единственный метод; типы: PassportData, PassportFile, EncryptedPassportElement, EncryptedCredentials, PassportElementError*. См. [passport.md](https://core.telegram.org/passport.md).

## 18. Игры (HTML5 Games / CallbackGame)

| Метод | Назначение |
|---|---|
| [sendGame](https://core.telegram.org/bots/api/methods/sendgame.md) | Отправить игру (BotFather: `/newgame`); Play-кнопка/callback_game |
| [setGameScore](https://core.telegram.org/bots/api/methods/setgamescore.md) | Сохранить счёт; чат получает сервисное сообщение о новом рекорде |
| [getGameHighScores](https://core.telegram.org/bots/api/methods/getgamehighscores.md) | Турнирная таблица |

Правила: первая кнопка первого ряда = запуск игры (`callback_game: {}`); BotFather: /newgame, /listgames, /editgame, /deletegame. Игра открывается во встроенном браузере. Шаринг счёт в пределах чата — через кнопку и `games.js` + `TelegramGameProxy.shareScore()`. См. [games.md](https://core.telegram.org/bots/games.md).

## 19. Полный перечень типов (по разделам [types.md](https://core.telegram.org/bots/api/types.md))

**Getting updates:** Update · WebhookInfo

**Available types (часть 1 — сообщение/пользователь/чат):**
User · Chat · ChatFullInfo · Message · MessageId · InaccessibleMessage · MaybeInaccessibleMessage · MessageEntity · TextQuote · ExternalReplyInfo · ReplyParameters · EphemeralMessageParameters · MessageOrigin(+User/HiddenUser/Chat/Channel) · PhotoSize · Animation · Audio · Document · LivePhoto · Story · VideoQuality · Video · VideoNote · Voice · PaidMediaInfo · PaidMedia(+LivePhoto/Photo/Preview/Video) · Contact · Dice · Link · PollMedia · InputPollMedia · InputPollOptionMedia · PollOption · InputPollOption · PollAnswer · Poll · ChecklistTask · Checklist · InputChecklistTask · InputChecklist · Location · Venue · WebAppData · ProximityAlertTriggered · MessageAutoDeleteTimerChanged · ManagedBotCreated · ManagedBotUpdated · BotSubscriptionUpdated · MessageGenerationStopped · PollOptionAdded · PollOptionDeleted · ChatBoostAdded · BackgroundFill(+Solid/Gradient/FreeformGradient) · BackgroundType(+Fill/Wallpaper/Pattern/ChatTheme) · ChatBackground · ChecklistTasksDone · ChecklistTasksAdded · CommunityChatAdded · CommunityChatJoined · CommunityChatRemoved · ForumTopicCreated/Closed/Edited/Reopened · GeneralForumTopicHidden/Unhidden · SharedUser · UsersShared · ChatShared · WriteAccessAllowed · VideoChatScheduled/Started/Ended/ParticipantsInvited · PaidMessagePriceChanged · DirectMessagePriceChanged · SuggestedPostApproved/ApprovalFailed/Declined/Paid/Refunded · GiveawayCreated/Giveaway/GiveawayWinners/GiveawayCompleted · LinkPreviewOptions · SuggestedPostPrice/Info/Parameters · DirectMessagesTopic · UserProfilePhotos/Audios · File · WebAppInfo ·

**Inline keyboards/кнопки:**
ReplyKeyboardMarkup · KeyboardButton · KeyboardButtonRequestUsers/Chat/ManagedBot · KeyboardButtonPollType · ReplyKeyboardRemove · InlineKeyboardMarkup · InlineKeyboardButton · LoginUrl · SwitchInlineQueryChosenChat · CopyTextButton · DisabledButton · CallbackQuery · ForceReply · Community · ChatPhoto · ChatInviteLink · ChatAdministratorRights · ChatMemberUpdated · ChatMember(+Owner/Administrator/Member/Restricted/Left/Banned) · ChatJoinRequest · ChatPermissions · Birthdate · BusinessIntro/Location/OpeningHoursInterval/OpeningHours · UserRating · StoryAreaPosition · LocationAddress · StoryAreaType(+Location/SuggestedReaction/Link/Weather/UniqueGift) · StoryArea · ChatLocation · ReactionType(+Emoji/CustomEmoji/Paid) · ReactionCount · MessageReactionUpdated · MessageReactionCountUpdated · ForumTopic · GiftBackground · Gift · Gifts · UniqueGiftModel/Symbol/BackdropColors/Backdrop/Colors/UniqueGift · GiftInfo · UniqueGiftInfo · OwnedGift(+Regular/Unique) · OwnedGifts · BotAccessSettings · AcceptedGiftTypes · StarAmount · BotCommand · BotCommandScope(+Default/AllPrivateChats/AllGroupChats/AllChatAdministrators/Chat/ChatAdministrators/ChatMember) · BotName · BotDescription · BotShortDescription · MenuButton(+Commands/WebApp/Default) · ChatBoostSource(+Premium/GiftCode/Giveaway) · ChatBoost · ChatBoostUpdated/Removed · ChatOwnerLeft/Changed · UserChatBoosts · BusinessBotRights · BusinessConnection · BusinessMessagesDeleted · SentWebAppMessage · SentGuestMessage · PreparedInlineMessage · PreparedKeyboardButton · ResponseParameters ·

**InputMedia/файлы:**
InputMedia(+Animation/Audio/Document/Link/LivePhoto/Location/Photo/Sticker/Venue/Video/VoiceNote) · InputFile · InputPaidMedia(+LivePhoto/Photo/Video) · InputProfilePhoto(+Static/Animated) · InputStoryContent(+Photo/Video) ·

**Stickers:** Sticker · StickerSet · MaskPosition · InputSticker

**Inline mode:** InlineQuery · InlineQueryResultsButton · InlineQueryResult(+Article/Photo/Gif/Mpeg4Gif/Video/Audio/Voice/Document/Location/Venue/Contact/Game/CachedPhoto/CachedGif/CachedMpeg4Gif/CachedSticker/CachedDocument/CachedVideo/CachedVoice/CachedAudio) · InputMessageContent(+TextMessageContent/RichMessageContent/LocationMessageContent/VenueMessageContent/ContactMessageContent/InvoiceMessageContent) · ChosenInlineResult

**Payments:** LabeledPrice · Invoice · ShippingAddress · OrderInfo · ShippingOption · SuccessfulPayment · RefundedPayment · ShippingQuery · PreCheckoutQuery · PaidMediaPurchased · RevenueWithdrawalState(+Pending/Succeeded/Failed) · AffiliateInfo · TransactionPartner(+User/Chat/AffiliateProgram/Fragment/TelegramAds/TelegramApi/Other) · StarTransaction · StarTransactions

**Telegram Passport:** PassportData · PassportFile · EncryptedPassportElement · EncryptedCredentials · PassportElementError(+DataField/FrontSide/ReverseSide/Selfie/File/Files/TranslationFile/TranslationFiles/Unspecified)

**Games:** Game · CallbackGame · GameHighScore

Каждый тип задокументирован отдельной страницей вида `https://core.telegram.org/bots/api/types/<lowercase_name>.md`.

## 20. Как устроено форматирование

- **Обычный текст** (`parse_mode`): HTML (`<b><i><u><s><span class="tg-spoiler"><code><pre><a><blockquote>`), MarkdownV2 (экранирование `\_*\[\]()~\`>#+\-=|{}.!`), legacy Markdown (не рекомендован). Обязательные правила экранирования — [formatting.md](https://core.telegram.org/bots/api/formatting.md). Вложенность: «смежные» стили можно вкладывать, `pre`/`code` — нельзя; `blockquote` не вкладывается.
- **Rich messages**: [Rich Markdown](https://core.telegram.org/bots/api/rich-messages.md#rich-markdown-style) / [Rich HTML](https://core.telegram.org/bots/api/rich-messages.md#rich-html-style) — см. раздел 14 выше. Кнопки — типы `url/callback_data/web_app/login_url/switch_inline_query[_current_chat|chosen_chat]/copy_text/disabled`.
- **Date-time сущности** (`date_time`, Bot API 9.5): формат `r|w?[dD]?[tT]?` — например `![22:45](tg://time?unix=1647531900&format=wDT)`.
- **tg://-ссылки** в обычном тексте: только inline URL/кнопки (`tg://user?id=`, `tg://time?`, `tg://emoji?id=`); в rich — медиа по file_id/URL.
- **Custom emoji в сообщениях бота**: только если владелец бота — Telegram Premium, или у бота куплены доп. username на [Fragment](https://fragment.com) (иначе clients не отрисуют).

## 21. Проверка подлинности апдейтов (практика)

- webhook: проверяйте заголовок `X-Telegram-Bot-Api-Secret-Token` (параметр `secret_token` в setWebhook);
- длинные опросы: проверяйте, что `update_id` монотонно растёт;
- никогда не доверяйте полям `from`/`user` как «доказанной» личности без привязки к контексту (вход через бота — это «тот, кто пишет боту», не более);
- mini app: см. [04, раздел 6](04-miniapp-settings.md#6-валидация-initdata-обязательный-шаг).

## 22. Мини-шпаргалка по самым используемым параметрам

| Параметр | Где | Смысл |
|---|---|---|
| `business_connection_id` | все send*/edit* | Ответ от имени бизнес-аккаунта |
| `message_thread_id` | send*/edit* | В какой топик отправить |
| `direct_messages_topic_id` | send*/edit* | В тему директов канала |
| `link_preview_options` | sendMessage | Превью ссылки (url, prefer_large_media, …) |
| `reply_parameters` | send*/copy* | Цитата/thread_id/ephemeral_message_id/poll_option_id |
| `ephemeral_message_parameters` | send*/editEphemeral* | Опции эфемерного сообщения (replace_callback_query_message) |
| `protect_content` | send*/forward* | Запретить копирование/пересылку |
| `allow_paid_broadcast` | send*/forward/copy | Платная рассылка > 30 msg/s (см. [08](08-payments-monetization.md#3-платные-рассылки-paid-broadcasts)) |
| `message_effect_id` | send*/forward/copy | Эффект сообщения (только private) |
| `suggested_post_parameters` | send* | Предложенный пост в direct messages каналов |
