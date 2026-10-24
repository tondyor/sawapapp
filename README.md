# SawaPApp

Telegram Mini App + бот на **Telegram Serverless**, в котором пользователи общаются с AI-агентами разных ролей: каждый агент — отдельная «специальность» со своим системным промптом, инструкциями и набором навыков (skills). Все диалоги хранятся в базе данных Telegram, генерация — через **NVIDIA LLM API**.

## Основная идея

1. Пользователь открывает Mini App прямо в Telegram (`https://app<id>.tgcloud.ai/`) или пишет боту в чат.
2. Выбирает агента-роли (например: юрист, маркетолог, разработчик, переводчик — набор растёт).
3. Общается с агентом; история диалогов персистентна и привязана к пользователю.
4. Агент = системный промпт + инструкции + skills (специализированные шаги/инструменты для своей специальности).

## Архитектура

| Слой | Технология | Где живёт |
|---|---|---|
| Backend (handlers, endpoints, lib, schema) | Telegram Serverless (JS-модули в V8-песочнице) | Облако Telegram |
| База данных | SQLite через SDK `db` (Telegram) | Облако Telegram |
| Mini App (фронтенд) | Vite + React, хостинг tgcloud.ai | Облако Telegram |
| LLM | NVIDIA API (`integrate.api.nvidia.com/v1`, OpenAI-совместимый) | Вызов из `lib/` через `fetch` SDK |
| Управление деплоем | `@tgcloud/cli` (`npx tgcloud push / migrate / run`) | Локально |

### Ограничения платформы (важно учитывать)

- В рантайме **нет npm-пакетов**, `process.env`, файловой системы — только `sdk` (`db`, `api`, `fetch`) и свои модули.
- Деплоятся **только `.js`** внутри `tgcloud/` (`schema.js`, `lib/`, `handlers/`, `endpoints/`) — `.md`-инструкции агентов храним как JS-модули (`lib/agents/*.js`) или в БД.
- В БД **нет foreign keys** — целостность на стороне кода.
- Ответ внешнего HTTP ≤ 30 МБ; стриминг LLM — через `res.body`.
- Deploy кода (`push`) и миграции БД (`migrate`) — всегда отдельные шаги.

## Живой бот

- Бот: **@sawapapp** (приватный чат: команды `/start`, `/agents`, `/new`, `/help`)
- Mini App: `https://app8872967138.tgcloud.ai/` (кнопка «Открыть приложение» у бота, меню-кнопка установлена)
- Модель по умолчанию: `nvidia/nemotron-3.5-bolt-e4b`
- Агенты: Общение · Правовед · Маркетолог · Дизайнер · Копирайтер

## Структура репозитория

```
sawapapp/
├─ tgcloud/            # всё, что деплоится в Telegram Serverless
│  ├─ handlers/        # обработчики апдейтов Telegram (message, ...)
│  ├─ endpoints/       # функции, которые вызывает Mini App
│  ├─ lib/             # общий код: клиенты NVIDIA, роли агентов, skills
│  └─ schema.js        # таблицы: users, agents, conversations, messages, settings
├─ src/                # фронтенд Mini App (Vite + React)
├─ docs/               # документация
├─ .env                # СЕКРЕТЫ — в git НЕ входит
├─ .env.example        # шаблон секретов (без значений)
├─ tgcloud.jsonc       # конфиг хостинга Mini App
└─ README.md
```

## Roadmap

- [x] Репозиторий, правила секретов, документация
- [x] Включить Serverless в @BotFather, получить CLI-токен
- [x] Скаффолд `tgcloud/` (`npm create @tgcloud/bot .`)
- [x] Схема БД + обработчик `message` (эхо)
- [x] Роли агентов: модель данных + `lib/agents/*`
- [x] `endpoints/chat` + стриминг ответов NVIDIA
- [x] Mini App: чат-интерфейс, выбор агента
- [ ] Skills агентов (инструменты по специальностям)
- [ ] MCP-серверы по HTTP (Streamable HTTP transport) через `sdk fetch` + таблица `mcp_servers`
- [ ] Веб-доступ вне Telegram (отдельный сайт / приложение, своя auth-схема)

## Структура

```
sawapapp/
├─ tgcloud/                  # всё, что деплоится в Telegram Serverless
│  ├─ handlers/
│  │  ├─ message.js          # команды, диалог в чате, стриминг ответа
│  │  └─ callback_query.js   # выбор агента кнопками
│  ├─ endpoints/             # серверная сторона Mini App
│  │  ├─ listAgents.js       #   метаданные 5 агентов
│  │  ├─ sendMessage.js      #   отправка сообщения → ответ агента
│  │  ├─ getHistory.js       #   история диалога
│  │  ├─ newConversation.js  #   новый диалог
│  │  ├─ adminSetSetting.js  #   [админ] запись в settings (ключ NVIDIA)
│  │  ├─ adminSetup.js       #   [админ] команды и кнопка меню бота
│  │  └─ adminPing.js        #   [админ] проверка модели и стриминга
│  ├─ lib/
│  │  ├─ agents.js           # реестр 5 агентов с системными промптами
│  │  ├─ nvidia.js           # клиент integrate.api.nvidia.com (+ SSE-стриминг)
│  │  ├─ chat.js             # сценарий диалога: юзеры, диалоги, история
│  │  ├─ config.js           # модель, лимиты, APP_URL, админы
│  │  └─ internal/           # вложенные модули
│  └─ schema.js              # users, conversations, messages, settings, mcp_servers
├─ src/                      # фронтенд Mini App (Vite + React, SVG-интерфейс)
├─ scripts/patch-tgcloud-cli.ps1
└─ tgcloud.jsonc             # static: dist, spa
```

## Команды

```powershell
# после npm install — патч бага CLI 0.2.0 на Windows (см. «Известные проблемы»)
powershell -File scripts\patch-tgcloud-cli.ps1

# переменные окружения для CLI (TGCLOUD_TOKEN из .env)
$env:TGCLOUD_TOKEN = ((Get-Content .env | Where-Object { $_ -match '^TGCLOUD_TOKEN=' }) -replace '^TGCLOUD_TOKEN=','').Trim()

npx tgcloud status          # что изменилось локально vs облако
npm run build               # сборка Mini App → dist/
npx tgcloud push            # деплой модулей (+ dist, если собран)
npx tgcloud migrate --safe  # применить безопасные изменения схемы
npx tgcloud fetch           # обновить локальный снапшот облака (после точечных push)
npx tgcloud run handlers/message '{ chat: { id: 1 }, from: { id: 1 }, text: "/start" }'
```

Аргументы для `tgcloud run` в PowerShell передавай в **двойных кавычках с одинарными внутри** (JSON5): `"{ text: 'привет' }"` — двойные кавычки внутри аргумента Windows-оболочки съедаются.

## Известные проблемы

- **CLI 0.2.0, Windows:** точечный `push` отдельного файла падал с `ERR_INVALID_ARG_TYPE` (сервер отдаёт `false` вместо контента для неизменённых модулей) и портит локальный снапшот. Патч: `scripts/patch-tgcloud-cli.ps1`; после точечного пуша, если `status` показывает лишнее — `npx tgcloud fetch`.

## 🔐 Правила работы с ключами и GitHub

Проект **open source** — в репозитории не должно быть никаких секретов, когда-либо.

### Что где хранится

| Секрет | Где хранится | В git? |
|---|---|---|
| API-токен бота (`TELEGRAM_BOT_TOKEN`) | `.env` | ❌ никогда |
| Serverless CLI-токен (`TGCLOUD_TOKEN`, `app<id>:<secret>`) | `.env` / `TGCLOUD_TOKEN` env | ❌ никогда |
| NVIDIA API-ключ (`NVIDIA_API_KEY`) | `.env` локально; в рантайме — таблица `settings` в БД Telegram (сидируется через `endpoints/adminSetSetting`, доступ только у админа) | ❌ никогда |
| Состояние CLI с кредами (`.tgcloud/`) | локальная папка | ❌ никогда |

### Правила (обязательные)

1. **Любой новый секрет** — только в `.env`. В коммитах — только плейсхолдеры в `.env.example`.
2. **Перед каждым `git push`**: `git status` + `git diff --staged` — глазами проверить, что нет ключей, токенов, ссылок на приватные ресурсы.
3. **Никогда** не читать/писать `.tgcloud/` вручную — это состояние CLI с кредами; он в `.gitignore`.
4. Если секрет случайно попал в коммит: **сразу ротировать** (BotFather `/revoke` для API-токена, Serverless → CLI Access → Regenerate, NVIDIA — перевыпустить ключ), затем вычищать историю.
5. Имена файлов-секретов держат префикс/паттерн в `.gitignore` (`.env*`, `*.local`, `secrets/`) — новые секретные файлы называть по этому правилу.
6. В логах, issue, PR и промптах ключи не вставлять целиком — только первые/последние 4 символа (`nvai-…9f2c`).

### Проверка перед пушем

```powershell
git check-ignore -v .env          # должно показать: .gitignore (файл игнорируется)
git status --porcelain            # .env и .tgcloud/ должны отсутствовать
git log -p | Select-String -Pattern "nvai-|app\d+:[A-Za-z0-9]{20,}"   # поиск утечек в истории
```
