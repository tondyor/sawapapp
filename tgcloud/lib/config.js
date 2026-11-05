export const ADMIN_TG_IDS = [1707415385];

// Единственная модель проекта — deepseek-v4.1-flash: планировщик, сжатие,
// ответы всех агентов и зрение. Переопределяется через settings без деплоя.
// SERPER_API_KEY — ключ веб-поиска (Ф2); READER_MODE=jina|auto — ридер web_read.
export const ALLOWED_SETTING_KEYS = ['NVIDIA_API_KEY', 'VISION_MODEL', 'DEFAULT_MODEL', 'PLANNER_MODEL', 'COMPRESS_MODEL', 'SERPER_API_KEY', 'READER_MODE'];

export const DEFAULT_MODEL = 'deepseek-ai/deepseek-v4.1-flash';

// Замеры на этом аккаунте: planning-JSON у deepseek не бенчмаркался отдельно —
// строгость плана держится на детерминированном JSON-repair (pipeline.js).
// Старые замеры (2026-10): bolt-e4b TTFB 129-173мс; lightning-30b — 15.6с;
// glm-5.3-flash/gpt-oss-20b — холодный старт >30с; minimax-m3.1-flash — 29с.
export const PLANNER_MODEL = 'deepseek-ai/deepseek-v4.1-flash';
export const COMPRESS_MODEL = 'deepseek-ai/deepseek-v4.1-flash';

// Модель ответа ВСЕХ агентов: deepseek. Размышления идут отдельным каналом
// reasoning_content (в трассу хода, не в сообщение); thinking выключается
// флагом chat_template_kwargs (nvidia.js). Ответ генерится кусками
// (finishTurnSynthesis): изолят платформы живёт ~30с, кусок ~700 токенов.
export const ANSWER_MODEL = 'deepseek-ai/deepseek-v4.1-flash';

// Модель-«зритель» для шага чтения изображений (vision step агента).
// Переопределяется через settings.VISION_MODEL (endpoints/adminSetSetting).
// Замер (2026-10): первый токен deepseek на большом промпте — 35с+ (холодный
// старт). Если deepseek не примет image_url, vision-шаг честно отчитается
// об ошибке инструмента — тогда картинку не увидит ни один агент.
export const VISION_MODEL = 'deepseek-ai/deepseek-v4.1-flash';

// Системный промпт шага чтения изображения: описание для текстовой модели.
export const VISION_READER_PROMPT = [
  'Ты — модуль компьютерного зрения внутри AI-агента. Твоя задача — исчерпывающе и точно описать изображение для текстовой модели, которая его НЕ видит.',
  'Опиши: тип изображения (фото/скриншот/документ/диаграмма/рисунок), все объекты и людей, цвета, расположение элементов, надписи и числа ДОСЛОВНО, таблицы — построчно.',
  'Только факты с картинки. Ничего не додумывай. Без вступлений и выводов — только описание, 2-6 предложений.',
].join('\n');

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export const KEY_SETTING = 'NVIDIA_API_KEY';

export const MAX_HISTORY_MESSAGES = 20;

export const MAX_MESSAGE_CHARS = 6000;

export const MAX_OUTPUT_TOKENS = 2048;

export const TEMPERATURE = 0.7;

// Встраиваем в промпт не больше этого числа картинок и не больше этого размера.
export const MAX_IMAGES_PER_REQUEST = 4;
export const MAX_IMAGE_BYTES = 3 * 1000 * 1000;

export const APP_URL = 'https://app8872967138.tgcloud.ai/';

export const BOT_COMMANDS = [
  { command: 'start', description: 'Запуск и выбор агента' },
  { command: 'agents', description: 'Список агентов' },
  { command: 'new', description: 'Новый диалог' },
  { command: 'help', description: 'Помощь' },
];
