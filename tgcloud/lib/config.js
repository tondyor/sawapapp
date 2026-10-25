export const ADMIN_TG_IDS = [1707415385];

export const ALLOWED_SETTING_KEYS = ['NVIDIA_API_KEY'];

export const DEFAULT_MODEL = 'nvidia/nemotron-3.5-bolt-e4b';

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export const KEY_SETTING = 'NVIDIA_API_KEY';

export const MAX_HISTORY_MESSAGES = 20;

export const MAX_MESSAGE_CHARS = 6000;

export const MAX_OUTPUT_TOKENS = 2048;

export const TEMPERATURE = 0.7;

export const REASONING_LEVELS = ['fast', 'light', 'medium', 'high', 'max'];

export const DEFAULT_REASONING = 'fast';

export const REASONING_BUDGET = {
  light: 1500,
  medium: 3000,
  high: 6000,
  max: 12000,
};

export const APP_URL = 'https://app8872967138.tgcloud.ai/';

export const BOT_COMMANDS = [
  { command: 'start', description: 'Запуск и выбор агента' },
  { command: 'agents', description: 'Список агентов' },
  { command: 'new', description: 'Новый диалог' },
  { command: 'help', description: 'Помощь' },
];
