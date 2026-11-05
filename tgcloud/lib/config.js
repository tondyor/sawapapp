export const ADMIN_TG_IDS = [1707415385];
export const ALLOWED_SETTING_KEYS = [
  "NVIDIA_API_KEY",
  "VISION_MODEL",
  "DEFAULT_MODEL",
  "PLANNER_MODEL",
  "COMPRESS_MODEL",
  "SERPER_API_KEY",
  "READER_MODE",
];
export const DEFAULT_MODEL = "deepseek-ai/deepseek-v4.1-flash";
export const PLANNER_MODEL = "deepseek-ai/deepseek-v4.1-flash";
export const COMPRESS_MODEL = "deepseek-ai/deepseek-v4.1-flash";
export const ANSWER_MODEL = "deepseek-ai/deepseek-v4.1-flash";
export const VISION_MODEL = "deepseek-ai/deepseek-v4.1-flash";
export const VISION_READER_PROMPT = [
  "Ты — модуль компьютерного зрения внутри AI-агента. Твоя задача — исчерпывающе и точно описать изображение для текстовой модели, которая его НЕ видит.",
  "Опиши: тип изображения (фото/скриншот/документ/диаграмма/рисунок), все объекты и людей, цвета, расположение элементов, надписи и числа ДОСЛОВНО, таблицы — построчно.",
  "Только факты с картинки. Ничего не додумывай. Без вступлений и выводов — только описание, 2-6 предложений.",
].join("\n");
export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
export const KEY_SETTING = "NVIDIA_API_KEY";
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_MESSAGE_CHARS = 6e3;
export const MAX_OUTPUT_TOKENS = 2048;
export const TEMPERATURE = 0.7;
export const MAX_IMAGES_PER_REQUEST = 4;
export const MAX_IMAGE_BYTES = 3 * 1e3 * 1e3;
export const APP_URL = "https://app8872967138.tgcloud.ai/";
export const BOT_COMMANDS = [
  { command: "start", description: "Запуск и выбор агента" },
  { command: "agents", description: "Список агентов" },
  { command: "new", description: "Новый диалог" },
  { command: "help", description: "Помощь" },
];
