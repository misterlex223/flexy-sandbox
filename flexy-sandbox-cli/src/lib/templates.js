const fs = require('fs').promises;
const path = require('path');
const { TEMPLATES } = require('../utils/constants');
const Logger = require('../utils/logger');

class TemplateManager {
  constructor() {
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  /**
   * 載入模板
   * @param {string} templateName - 模板名稱
   * @returns {object} 模板內容
   */
  async loadTemplate(templateName) {
    if (!TEMPLATES.includes(templateName)) {
      throw new Error(`未知的模板: ${templateName}`);
    }

    const templatePath = path.join(this.templatesDir, `${templateName}.json`);

    try {
      const content = await fs.readFile(templatePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      Logger.error(`載入模板失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 取得所有模板
   * @returns {Array} 模板資訊陣列
   */
  async getAllTemplates() {
    const templates = [];

    for (const templateName of TEMPLATES) {
      try {
        const template = await this.loadTemplate(templateName);
        templates.push({
          name: templateName,
          displayName: template.name,
          description: template.description
        });
      } catch (error) {
        Logger.warning(`跳過模板 ${templateName}: ${error.message}`);
      }
    }

    return templates;
  }

  /**
   * 從模板建立配置
   * @param {string} templateName - 模板名稱
   * @param {object} overrides - 覆蓋的配置項
   * @returns {object} 完整配置
   */
  async createConfigFromTemplate(templateName, overrides = {}) {
    const template = await this.loadTemplate(templateName);

    // 深度合併配置
    const config = {
      ...template.config,
      ...overrides
    };

    // 合併 AI Windows
    if (overrides.aiWindows) {
      config.aiWindows = overrides.aiWindows;
    }

    // 合併 volumes
    if (overrides.volumes) {
      config.volumes = overrides.volumes;
    }

    // 合併環境變數
    if (overrides.environment) {
      config.environment = {
        ...template.config.environment,
        ...overrides.environment
      };
    }

    return config;
  }
}

module.exports = TemplateManager;
