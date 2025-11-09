const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { CONFIG_DIR } = require('../utils/constants');
const Logger = require('../utils/logger');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), CONFIG_DIR);
  }

  /**
   * 確保配置目錄存在
   */
  async ensureConfigDir() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      Logger.error(`無法建立配置目錄: ${error.message}`);
      throw error;
    }
  }

  /**
   * 儲存配置
   * @param {string} name - 配置名稱
   * @param {object} config - 配置內容
   */
  async saveConfig(name, config) {
    await this.ensureConfigDir();

    const configPath = path.join(this.configDir, `${name}.json`);

    try {
      await fs.writeFile(
        configPath,
        JSON.stringify(config, null, 2),
        'utf8'
      );
      Logger.success(`配置已儲存至: ${configPath}`);
      return configPath;
    } catch (error) {
      Logger.error(`儲存配置失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 載入配置
   * @param {string} name - 配置名稱
   * @returns {object} 配置內容
   */
  async loadConfig(name) {
    const configPath = path.join(this.configDir, `${name}.json`);

    try {
      const content = await fs.readFile(configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        Logger.error(`配置不存在: ${name}`);
      } else {
        Logger.error(`載入配置失敗: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 列出所有配置
   * @returns {Array} 配置名稱列表
   */
  async listConfigs() {
    await this.ensureConfigDir();

    try {
      const files = await fs.readdir(this.configDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      Logger.error(`列出配置失敗: ${error.message}`);
      return [];
    }
  }

  /**
   * 刪除配置
   * @param {string} name - 配置名稱
   */
  async deleteConfig(name) {
    const configPath = path.join(this.configDir, `${name}.json`);

    try {
      await fs.unlink(configPath);
      Logger.success(`配置已刪除: ${name}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        Logger.warning(`配置不存在: ${name}`);
      } else {
        Logger.error(`刪除配置失敗: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * 檢查配置是否存在
   * @param {string} name - 配置名稱
   * @returns {boolean}
   */
  async configExists(name) {
    const configPath = path.join(this.configDir, `${name}.json`);

    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 取得配置路徑
   * @param {string} name - 配置名稱
   * @returns {string}
   */
  getConfigPath(name) {
    return path.join(this.configDir, `${name}.json`);
  }
}

module.exports = ConfigManager;
