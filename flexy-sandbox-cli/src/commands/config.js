const inquirer = require('inquirer');
const ConfigManager = require('../lib/configManager');
const TemplateManager = require('../lib/templates');
const ConfigValidator = require('../lib/validator');
const Logger = require('../utils/logger');
const { AI_TYPES, MAX_AI_WINDOWS, DEFAULT_PORTS } = require('../utils/constants');

class ConfigCommand {
  constructor() {
    this.configManager = new ConfigManager();
    this.templateManager = new TemplateManager();
  }

  /**
   * 執行互動式配置流程
   */
  async run() {
    try {
      Logger.title('🔧 Flexy Sandbox 配置精靈');

      // 步驟 1: 選擇配置來源
      const { configSource } = await inquirer.prompt([
        {
          type: 'list',
          name: 'configSource',
          message: '請選擇配置方式:',
          choices: [
            { name: '使用預設模板', value: 'template' },
            { name: '自訂配置', value: 'custom' },
            { name: '載入已存在的配置', value: 'load' }
          ]
        }
      ]);

      let config;
      let configName;

      if (configSource === 'template') {
        ({ config, configName } = await this.configureFromTemplate());
      } else if (configSource === 'custom') {
        ({ config, configName } = await this.customConfigure());
      } else {
        ({ config, configName } = await this.loadExistingConfig());
      }

      // 驗證配置
      Logger.info('驗證配置...');
      const validation = ConfigValidator.validateConfig(config);

      if (!validation.valid) {
        Logger.error('配置驗證失敗:');
        validation.errors.forEach(error => Logger.error(`  • ${error}`));

        const { fixErrors } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'fixErrors',
            message: '是否修正錯誤?',
            default: true
          }
        ]);

        if (fixErrors) {
          // 簡單修正：移除問題項目
          Logger.warning('自動移除有問題的配置項目');
        } else {
          Logger.warning('配置未儲存');
          return;
        }
      }

      // 儲存配置
      const { shouldSave } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldSave',
          message: '是否儲存配置?',
          default: true
        }
      ]);

      if (shouldSave) {
        await this.configManager.saveConfig(configName, config);
        Logger.success(`配置已儲存: ${configName}`);
        Logger.info(`\n使用以下命令建立容器:`);
        Logger.info(`  flexy-sandbox create ${configName}`);
      }
    } catch (error) {
      Logger.error(`配置失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 從模板建立配置
   */
  async configureFromTemplate() {
    const templates = await this.templateManager.getAllTemplates();

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: '選擇配置模板:',
        choices: templates.map(t => ({
          name: `${t.displayName} - ${t.description}`,
          value: t.name
        }))
      }
    ]);

    const template = await this.templateManager.loadTemplate(templateName);
    const config = template.config;

    // 詢問配置名稱
    const { configName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'configName',
        message: '配置名稱:',
        default: templateName,
        validate: input => {
          if (!input || input.trim() === '') {
            return '配置名稱不可為空';
          }
          if (!ConfigValidator.validateContainerName(input)) {
            return '配置名稱只能包含字母、數字、底線、點和連字號';
          }
          return true;
        }
      }
    ]);

    // 填入 API Keys
    if (config.aiWindows && config.aiWindows.length > 0) {
      Logger.info('\n請填入 AI 工具的 API Keys:');

      for (let i = 0; i < config.aiWindows.length; i++) {
        const window = config.aiWindows[i];
        const { apiKey } = await inquirer.prompt([
          {
            type: 'password',
            name: 'apiKey',
            message: `${window.type.toUpperCase()} API Key (Window ${window.window}):`,
            mask: '*'
          }
        ]);

        config.aiWindows[i].apiKey = apiKey;
      }
    }

    // 填入其他需要的環境變數
    if (config.environment && config.environment.GITHUB_TOKEN !== undefined) {
      const { githubToken } = await inquirer.prompt([
        {
          type: 'password',
          name: 'githubToken',
          message: 'GitHub Token (可選):',
          mask: '*'
        }
      ]);

      if (githubToken) {
        config.environment.GITHUB_TOKEN = githubToken;
      }
    }

    return { config, configName };
  }

  /**
   * 自訂配置
   */
  async customConfigure() {
    const { configName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'configName',
        message: '配置名稱:',
        validate: input => {
          if (!input || input.trim() === '') {
            return '配置名稱不可為空';
          }
          if (!ConfigValidator.validateContainerName(input)) {
            return '配置名稱只能包含字母、數字、底線、點和連字號';
          }
          return true;
        }
      }
    ]);

    // 基本設定
    const basicConfig = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableWebtty',
        message: '啟用 WebTTY (網頁終端)?',
        default: true
      },
      {
        type: 'number',
        name: 'webttyPort',
        message: 'WebTTY 端口:',
        default: DEFAULT_PORTS.WEBTTY,
        when: answers => answers.enableWebtty
      },
      {
        type: 'number',
        name: 'cospecPort',
        message: 'CoSpec Markdown Editor 端口:',
        default: DEFAULT_PORTS.COSPEC
      }
    ]);

    // AI Windows 配置
    const { aiWindowCount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'aiWindowCount',
        message: '需要幾個 AI 工具? (0-5)',
        default: 1,
        validate: input => {
          if (input < 0 || input > 5) {
            return '必須在 0-5 之間';
          }
          return true;
        }
      }
    ]);

    const aiWindows = [];
    for (let i = 1; i <= aiWindowCount; i++) {
      Logger.info(`\n配置 AI Window ${i}:`);

      const windowConfig = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'AI 工具類型:',
          choices: Object.values(AI_TYPES)
        },
        {
          type: 'password',
          name: 'apiKey',
          message: 'API Key:',
          mask: '*'
        },
        {
          type: 'input',
          name: 'model',
          message: '模型名稱 (可選):',
          default: ''
        },
        {
          type: 'input',
          name: 'baseUrl',
          message: 'API Base URL (可選):',
          default: ''
        }
      ]);

      aiWindows.push({
        window: i,
        ...windowConfig
      });
    }

    // Volume 配置
    const { workspaceVolume } = await inquirer.prompt([
      {
        type: 'input',
        name: 'workspaceVolume',
        message: '工作目錄路徑 (host):',
        default: '$(pwd)'
      }
    ]);

    const volumes = [
      {
        host: workspaceVolume,
        container: '/home/flexy/workspace'
      }
    ];

    const config = {
      ...basicConfig,
      aiWindows,
      volumes,
      environment: {
        CLAUDE_LANGUAGE: '繁體中文',
        CLAUDE_NOTIFICATION_ENABLED: 'true'
      }
    };

    return { config, configName };
  }

  /**
   * 載入已存在的配置
   */
  async loadExistingConfig() {
    const configs = await this.configManager.listConfigs();

    if (configs.length === 0) {
      Logger.error('沒有已存在的配置');
      throw new Error('沒有可載入的配置');
    }

    const { configName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'configName',
        message: '選擇配置:',
        choices: configs
      }
    ]);

    const config = await this.configManager.loadConfig(configName);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '選擇操作:',
        choices: [
          { name: '檢視配置', value: 'view' },
          { name: '編輯配置', value: 'edit' },
          { name: '使用配置', value: 'use' }
        ]
      }
    ]);

    if (action === 'view') {
      Logger.info('\n配置內容:');
      console.log(JSON.stringify(config, null, 2));
      process.exit(0);
    } else if (action === 'edit') {
      const editedConfig = await this.editConfig(config, configName);
      return { config: editedConfig, configName };
    }

    return { config, configName };
  }

  /**
   * 編輯已存在的配置
   */
  async editConfig(config, configName) {
    Logger.title('✏️  編輯配置');

    const { editSection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'editSection',
        message: '選擇要編輯的項目:',
        choices: [
          { name: '基本設定 (WebTTY, 端口)', value: 'basic' },
          { name: 'AI Windows', value: 'aiWindows' },
          { name: 'Volume 掛載', value: 'volumes' },
          { name: '環境變數', value: 'environment' },
          { name: '完成編輯', value: 'done' }
        ]
      }
    ]);

    if (editSection === 'done') {
      return config;
    }

    if (editSection === 'basic') {
      config = await this.editBasicSettings(config);
    } else if (editSection === 'aiWindows') {
      config = await this.editAIWindows(config);
    } else if (editSection === 'volumes') {
      config = await this.editVolumes(config);
    } else if (editSection === 'environment') {
      config = await this.editEnvironment(config);
    }

    // 遞迴繼續編輯，直到使用者選擇完成
    return this.editConfig(config, configName);
  }

  /**
   * 編輯基本設定
   */
  async editBasicSettings(config) {
    Logger.info('\n目前設定:');
    Logger.info(`  WebTTY: ${config.enableWebtty ? '啟用' : '停用'}`);
    Logger.info(`  WebTTY 端口: ${config.webttyPort || 'N/A'}`);
    Logger.info(`  CoSpec 端口: ${config.cospecPort || 9280}`);

    const basicConfig = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableWebtty',
        message: '啟用 WebTTY?',
        default: config.enableWebtty || false
      },
      {
        type: 'number',
        name: 'webttyPort',
        message: 'WebTTY 端口:',
        default: config.webttyPort || DEFAULT_PORTS.WEBTTY,
        when: answers => answers.enableWebtty
      },
      {
        type: 'number',
        name: 'cospecPort',
        message: 'CoSpec 端口:',
        default: config.cospecPort || DEFAULT_PORTS.COSPEC
      }
    ]);

    return {
      ...config,
      ...basicConfig
    };
  }

  /**
   * 編輯 AI Windows
   */
  async editAIWindows(config) {
    Logger.info(`\n目前有 ${config.aiWindows?.length || 0} 個 AI Windows`);

    const { aiWindowAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'aiWindowAction',
        message: '選擇操作:',
        choices: [
          { name: '查看所有 AI Windows', value: 'view' },
          { name: '新增 AI Window', value: 'add' },
          { name: '編輯 AI Window', value: 'edit' },
          { name: '刪除 AI Window', value: 'delete' },
          { name: '返回', value: 'back' }
        ]
      }
    ]);

    if (aiWindowAction === 'back') {
      return config;
    }

    if (aiWindowAction === 'view') {
      Logger.info('\nAI Windows:');
      config.aiWindows?.forEach((window, index) => {
        Logger.info(`  [${index}] Window ${window.window}: ${window.type} (${window.model || 'default model'})`);
      });
      return config;
    }

    if (aiWindowAction === 'add') {
      const nextWindow = config.aiWindows?.length + 1 || 1;
      if (nextWindow > MAX_AI_WINDOWS) {
        Logger.error(`已達最大 AI Windows 數量 (${MAX_AI_WINDOWS})`);
        return config;
      }

      Logger.info(`\n新增 AI Window ${nextWindow}:`);

      const windowConfig = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'AI 工具類型:',
          choices: Object.values(AI_TYPES)
        },
        {
          type: 'password',
          name: 'apiKey',
          message: 'API Key:',
          mask: '*'
        },
        {
          type: 'input',
          name: 'model',
          message: '模型名稱 (可選):',
          default: ''
        },
        {
          type: 'input',
          name: 'baseUrl',
          message: 'API Base URL (可選):',
          default: ''
        }
      ]);

      const aiWindows = config.aiWindows || [];
      aiWindows.push({
        window: nextWindow,
        ...windowConfig
      });

      return {
        ...config,
        aiWindows
      };
    }

    if (aiWindowAction === 'edit') {
      if (!config.aiWindows || config.aiWindows.length === 0) {
        Logger.error('沒有 AI Windows 可編輯');
        return config;
      }

      const { windowIndex } = await inquirer.prompt([
        {
          type: 'list',
          name: 'windowIndex',
          message: '選擇要編輯的 Window:',
          choices: config.aiWindows.map((window, index) => ({
            name: `Window ${window.window}: ${window.type}`,
            value: index + 1
          }))
        }
      ]);

      const window = config.aiWindows[windowIndex];
      Logger.info(`\n編輯 Window ${window.window} (${window.type}):`);

      const { editField } = await inquirer.prompt([
        {
          type: 'list',
          name: 'editField',
          message: '選擇要編輯的欄位:',
          choices: [
            { name: 'API Key', value: 'apiKey' },
            { name: '模型名稱', value: 'model' },
            { name: 'Base URL', value: 'baseUrl' },
            { name: '取消', value: 'cancel' }
          ]
        }
      ]);

      if (editField === 'cancel') {
        return config;
      }

      const { newValue } = await inquirer.prompt([
        {
          type: editField === 'apiKey' ? 'password' : 'input',
          name: 'newValue',
          message: `新的${editField === 'apiKey' ? 'API Key' : editField === 'model' ? '模型名稱' : 'Base URL'}:`,
          default: window[editField] || '',
          mask: editField === 'apiKey' ? '*' : undefined
        }
      ]);

      config.aiWindows[windowIndex][editField] = newValue;
      Logger.success('已更新');

      return config;
    }

    if (aiWindowAction === 'delete') {
      if (!config.aiWindows || config.aiWindows.length === 0) {
        Logger.error('沒有 AI Windows 可刪除');
        return config;
      }

      const { windowIndex } = await inquirer.prompt([
        {
          type: 'list',
          name: 'windowIndex',
          message: '選擇要刪除的 Window:',
          choices: config.aiWindows.map((window, index) => ({
            name: `Window ${window.window}: ${window.type}`,
            value: index
          }))
        }
      ]);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `確定要刪除 Window ${config.aiWindows[windowIndex].window}?`,
          default: false
        }
      ]);

      if (confirm) {
        config.aiWindows.splice(windowIndex, 1);
        // 重新編號 windows
        config.aiWindows.forEach((window, index) => {
          window.window = index + 1;
        });
        Logger.success('已刪除');
      }

      return config;
    }

    return config;
  }

  /**
   * 編輯 Volumes
   */
  async editVolumes(config) {
    Logger.info(`\n目前有 ${config.volumes?.length || 0} 個 Volumes`);

    const { volumeAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'volumeAction',
        message: '選擇操作:',
        choices: [
          { name: '查看所有 Volumes', value: 'view' },
          { name: '新增 Volume', value: 'add' },
          { name: '刪除 Volume', value: 'delete' },
          { name: '返回', value: 'back' }
        ]
      }
    ]);

    if (volumeAction === 'back') {
      return config;
    }

    if (volumeAction === 'view') {
      Logger.info('\nVolumes:');
      config.volumes?.forEach((volume, index) => {
        Logger.info(`  [${index}] ${volume.host} → ${volume.container}${volume.readOnly ? ' (只讀)' : ''}`);
      });
      return config;
    }

    if (volumeAction === 'add') {
      const volumeConfig = await inquirer.prompt([
        {
          type: 'input',
          name: 'host',
          message: 'Host 路徑:',
          default: '$(pwd)'
        },
        {
          type: 'input',
          name: 'container',
          message: 'Container 路徑:',
          default: '/home/flexy/workspace'
        },
        {
          type: 'confirm',
          name: 'readOnly',
          message: '只讀模式?',
          default: false
        }
      ]);

      const volumes = config.volumes || [];
      volumes.push(volumeConfig);

      return {
        ...config,
        volumes
      };
    }

    if (volumeAction === 'delete') {
      if (!config.volumes || config.volumes.length === 0) {
        Logger.error('沒有 Volumes 可刪除');
        return config;
      }

      const { volumeIndex } = await inquirer.prompt([
        {
          type: 'list',
          name: 'volumeIndex',
          message: '選擇要刪除的 Volume:',
          choices: config.volumes.map((volume, index) => ({
            name: `${volume.host} → ${volume.container}`,
            value: index
          }))
        }
      ]);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '確定要刪除?',
          default: false
        }
      ]);

      if (confirm) {
        config.volumes.splice(volumeIndex, 1);
        Logger.success('已刪除');
      }

      return config;
    }

    return config;
  }

  /**
   * 編輯環境變數
   */
  async editEnvironment(config) {
    const envKeys = config.environment ? Object.keys(config.environment) : [];
    Logger.info(`\n目前有 ${envKeys.length} 個環境變數`);

    const { envAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'envAction',
        message: '選擇操作:',
        choices: [
          { name: '查看所有環境變數', value: 'view' },
          { name: '新增環境變數', value: 'add' },
          { name: '編輯環境變數', value: 'edit' },
          { name: '刪除環境變數', value: 'delete' },
          { name: '返回', value: 'back' }
        ]
      }
    ]);

    if (envAction === 'back') {
      return config;
    }

    if (envAction === 'view') {
      Logger.info('\n環境變數:');
      if (config.environment) {
        Object.entries(config.environment).forEach(([key, value]) => {
          Logger.info(`  ${key}=${value}`);
        });
      } else {
        Logger.info('  (無)');
      }
      return config;
    }

    if (envAction === 'add') {
      const { key, value } = await inquirer.prompt([
        {
          type: 'input',
          name: 'key',
          message: '環境變數名稱:',
          validate: input => {
            if (!input || input.trim() === '') {
              return '名稱不可為空';
            }
            if (!/^[A-Z_][A-Z0-9_]*$/.test(input)) {
              return '名稱只能包含大寫字母、數字和底線，且不能以數字開頭';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'value',
          message: '值:'
        }
      ]);

      const environment = config.environment || {};
      environment[key] = value;

      return {
        ...config,
        environment
      };
    }

    if (envAction === 'edit') {
      if (!config.environment || Object.keys(config.environment).length === 0) {
        Logger.error('沒有環境變數可編輯');
        return config;
      }

      const { key } = await inquirer.prompt([
        {
          type: 'list',
          name: 'key',
          message: '選擇要編輯的環境變數:',
          choices: Object.keys(config.environment)
        }
      ]);

      const { value } = await inquirer.prompt([
        {
          type: 'input',
          name: 'value',
          message: `${key} 的新值:`,
          default: config.environment[key]
        }
      ]);

      config.environment[key] = value;
      Logger.success('已更新');

      return config;
    }

    if (envAction === 'delete') {
      if (!config.environment || Object.keys(config.environment).length === 0) {
        Logger.error('沒有環境變數可刪除');
        return config;
      }

      const { key } = await inquirer.prompt([
        {
          type: 'list',
          name: 'key',
          message: '選擇要刪除的環境變數:',
          choices: Object.keys(config.environment)
        }
      ]);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `確定要刪除 ${key}?`,
          default: false
        }
      ]);

      if (confirm) {
        delete config.environment[key];
        Logger.success('已刪除');
      }

      return config;
    }

    return config;
  }
}

module.exports = ConfigCommand;
