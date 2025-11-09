// Constants for Flexy Sandbox CLI

module.exports = {
  // AI 工具類型
  AI_TYPES: {
    QWEN: 'qwen',
    CLAUDE: 'claude',
    GEMINI: 'gemini',
    CODEX: 'codex'
  },

  // AI 工具對應的 npm 套件
  AI_PACKAGES: {
    qwen: '@qwen-code/qwen-code@latest',
    claude: '@anthropic-ai/claude-code',
    gemini: '@google/gemini-cli',
    codex: '@openai/codex'
  },

  // AI 工具環境變數映射
  AI_ENV_MAP: {
    qwen: {
      apiKey: 'QWEN_API_KEY',
      model: 'QWEN_MODEL',
      baseUrl: 'QWEN_BASE_URL'
    },
    claude: {
      apiKey: 'ANTHROPIC_AUTH_TOKEN',
      model: 'ANTHROPIC_MODEL',
      baseUrl: 'ANTHROPIC_BASE_URL'
    },
    gemini: {
      apiKey: 'GEMINI_API_KEY',
      model: 'GEMINI_MODEL',
      baseUrl: 'GEMINI_BASE_URL'
    },
    codex: {
      apiKey: 'OPENAI_API_KEY',
      model: 'OPENAI_MODEL',
      baseUrl: 'OPENAI_BASE_URL'
    }
  },

  // 預設端口
  DEFAULT_PORTS: {
    WEBTTY: 9681,
    COSPEC: 9280
  },

  // Docker 映像名稱
  DOCKER_IMAGE: 'flexy-dev-sandbox:latest',

  // 配置檔案路徑
  CONFIG_DIR: '.flexy-sandbox',

  // 容器名稱前綴
  CONTAINER_PREFIX: 'flexy-',

  // tmux window 數量
  MAX_AI_WINDOWS: 5,

  // 配置模板
  TEMPLATES: ['dev', 'multi-ai', 'team', 'minimal']
};
