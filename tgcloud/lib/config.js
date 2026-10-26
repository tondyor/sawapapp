export const ADMIN_TG_IDS = [1707415385];

export const ALLOWED_SETTING_KEYS = ['NVIDIA_API_KEY', 'VISION_MODEL', 'DEFAULT_MODEL'];

export const DEFAULT_MODEL = 'nvidia/nemotron-3.5-bolt-e4b';

// Модель для уровней рассуждений (light/medium/high/max): умеет thinking через
// chat_template_kwargs и возвращает reasoning_content. bolt-e4b это не умеет.
export const REASONING_MODEL = 'nvidia/nemotron-3.5-super-vl-120b-a12b';

// Модель-«зритель» для шага чтения изображений (vision step агента).
// Переопределяется через settings.VISION_MODEL (endpoints/adminSetSetting).
// Замеры на этом аккаунте (2026-10): nemotron-3.5-super-vl ~2.8с на картинку;
// deepseek-v4.1-flash — первый токен 35с+ (холодный старт), поэтому ридер по
// умолчанию — super-vl. DeepSeek можно включить одной настройкой.
export const VISION_MODEL = 'nvidia/nemotron-3.5-super-vl-120b-a12b';

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

export const REASONING_LEVELS = ['fast', 'light', 'medium', 'high', 'max'];

export const DEFAULT_REASONING = 'fast';

// Бюджет completion-токенов (включая размышления): у thinking-моделей
// reasoning_content входит в completion, поэтому уровни сильно больше MAX_OUTPUT_TOKENS.
export const REASONING_BUDGET = {
  light: 4096,
  medium: 8192,
  high: 16384,
  max: 28000,
};

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
