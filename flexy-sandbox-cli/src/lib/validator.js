const validator = require('validator');
const { AI_TYPES, MAX_AI_WINDOWS } = require('../utils/constants');

class ConfigValidator {
  /**
   * 驗證完整配置
   * @param {object} config - 配置物件
   * @returns {object} { valid: boolean, errors: string[] }
   */
  static validateConfig(config) {
    const errors = [];

    // 驗證 AI Windows
    if (config.aiWindows && Array.isArray(config.aiWindows)) {
      if (config.aiWindows.length > MAX_AI_WINDOWS) {
        errors.push(`AI Windows 數量不可超過 ${MAX_AI_WINDOWS}`);
      }

      config.aiWindows.forEach((window, index) => {
        const windowErrors = this.validateAIWindow(window);
        if (windowErrors.length > 0) {
          errors.push(`Window ${index}: ${windowErrors.join(', ')}`);
        }
      });
    }

    // 驗證端口
    if (config.webttyPort) {
      const portError = this.validatePort(config.webttyPort);
      if (portError) errors.push(`WebTTY Port: ${portError}`);
    }

    if (config.cospecPort) {
      const portError = this.validatePort(config.cospecPort);
      if (portError) errors.push(`CoSpec Port: ${portError}`);
    }

    // 驗證 volumes
    if (config.volumes && Array.isArray(config.volumes)) {
      config.volumes.forEach((volume, index) => {
        if (!volume.host || !volume.container) {
          errors.push(`Volume ${index}: 必須包含 host 和 container 路徑`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 驗證 AI Window 配置
   * @param {object} window - Window 配置
   * @returns {string[]} 錯誤訊息陣列
   */
  static validateAIWindow(window) {
    const errors = [];

    // 驗證 window number
    if (typeof window.window !== 'number' || window.window < 1 || window.window > MAX_AI_WINDOWS) {
      errors.push(`window 必須是 1-${MAX_AI_WINDOWS} 之間的數字`);
    }

    // 驗證 AI type
    if (!Object.values(AI_TYPES).includes(window.type)) {
      errors.push(`type 必須是 ${Object.values(AI_TYPES).join(', ')} 之一`);
    }

    // 驗證 API key
    if (!window.apiKey || window.apiKey.trim() === '') {
      errors.push('apiKey 不可為空');
    }

    // 驗證 base URL（如果提供）
    if (window.baseUrl && window.baseUrl.trim() !== '') {
      if (!validator.isURL(window.baseUrl, { require_protocol: true })) {
        errors.push('baseUrl 必須是有效的 URL');
      }
    }

    return errors;
  }

  /**
   * 驗證端口號
   * @param {number} port - 端口號
   * @returns {string|null} 錯誤訊息或 null
   */
  static validatePort(port) {
    if (typeof port !== 'number') {
      return '必須是數字';
    }

    if (!validator.isPort(String(port))) {
      return '必須是有效的端口號 (1-65535)';
    }

    return null;
  }

  /**
   * 驗證 API Key 格式
   * @param {string} type - AI 類型
   * @param {string} apiKey - API Key
   * @returns {boolean}
   */
  static validateApiKeyFormat(type, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }

    // 基本格式驗證
    const patterns = {
      [AI_TYPES.QWEN]: /^sk-/,
      [AI_TYPES.CLAUDE]: /^sk-ant-/,
      [AI_TYPES.GEMINI]: /^AIza/,
      [AI_TYPES.CODEX]: /^sk-/
    };

    const pattern = patterns[type];
    return pattern ? pattern.test(apiKey) : true;
  }

  /**
   * 驗證容器名稱
   * @param {string} name - 容器名稱
   * @returns {boolean}
   */
  static validateContainerName(name) {
    // Docker 容器名稱規則：只能包含 [a-zA-Z0-9][a-zA-Z0-9_.-]
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
    return pattern.test(name);
  }
}

module.exports = ConfigValidator;
