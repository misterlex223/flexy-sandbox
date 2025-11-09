const ora = require('ora');
const inquirer = require('inquirer');
const DockerManager = require('../lib/dockerManager');
const ConfigManager = require('../lib/configManager');
const Logger = require('../utils/logger');

class LifecycleCommand {
  constructor() {
    this.dockerManager = new DockerManager();
    this.configManager = new ConfigManager();
  }

  /**
   * 建立並啟動容器
   */
  async create(configName) {
    const spinner = ora('檢查 Docker...').start();

    try {
      // 檢查 Docker
      const dockerRunning = await this.dockerManager.checkDocker();
      if (!dockerRunning) {
        spinner.fail('Docker 未運行');
        return;
      }
      spinner.succeed('Docker 運行正常');

      // 檢查映像
      spinner.start('檢查 Docker 映像...');
      const imageExists = await this.dockerManager.checkImage();
      if (!imageExists) {
        spinner.fail('Docker 映像不存在');
        Logger.error('請先建置 Flexy Sandbox 映像');
        Logger.info('執行: docker build -t flexy-dev-sandbox:latest .');
        return;
      }
      spinner.succeed('Docker 映像存在');

      // 載入配置
      spinner.start('載入配置...');
      const config = await this.configManager.loadConfig(configName);
      spinner.succeed('配置載入成功');

      // 建立容器
      spinner.start('建立並啟動容器...');
      const container = await this.dockerManager.createContainer(configName, config);
      spinner.succeed('容器建立成功');

      // 顯示容器資訊
      Logger.separator();
      Logger.success(`容器名稱: ${container.name}`);
      Logger.info(`容器 ID: ${container.id}`);

      if (config.enableWebtty) {
        Logger.info(`WebTTY: http://localhost:${config.webttyPort}`);
      }

      Logger.info(`CoSpec Markdown Editor: http://localhost:${config.cospecPort}`);
      Logger.separator();

      Logger.info('\n可用命令:');
      Logger.info(`  flexy-sandbox shell ${configName}  - 進入容器 shell`);
      Logger.info(`  flexy-sandbox logs ${configName}   - 查看容器日誌`);
      Logger.info(`  flexy-sandbox stop ${configName}   - 停止容器`);
    } catch (error) {
      spinner.fail('建立容器失敗');
      throw error;
    }
  }

  /**
   * 啟動容器
   */
  async start(name) {
    const spinner = ora(`啟動容器 ${name}...`).start();

    try {
      await this.dockerManager.startContainer(name);
      spinner.succeed(`容器已啟動: ${name}`);
    } catch (error) {
      spinner.fail('啟動容器失敗');
      throw error;
    }
  }

  /**
   * 停止容器
   */
  async stop(name) {
    const spinner = ora(`停止容器 ${name}...`).start();

    try {
      await this.dockerManager.stopContainer(name);
      spinner.succeed(`容器已停止: ${name}`);
    } catch (error) {
      spinner.fail('停止容器失敗');
      throw error;
    }
  }

  /**
   * 暫停容器
   */
  async pause(name) {
    const spinner = ora(`暫停容器 ${name}...`).start();

    try {
      await this.dockerManager.pauseContainer(name);
      spinner.succeed(`容器已暫停: ${name}`);
    } catch (error) {
      spinner.fail('暫停容器失敗');
      throw error;
    }
  }

  /**
   * 恢復容器
   */
  async unpause(name) {
    const spinner = ora(`恢復容器 ${name}...`).start();

    try {
      await this.dockerManager.unpauseContainer(name);
      spinner.succeed(`容器已恢復: ${name}`);
    } catch (error) {
      spinner.fail('恢復容器失敗');
      throw error;
    }
  }

  /**
   * 刪除容器
   */
  async delete(name, options = {}) {
    // 確認刪除
    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `確定要刪除容器 ${name}?`,
          default: false
        }
      ]);

      if (!confirm) {
        Logger.info('取消刪除');
        return;
      }
    }

    const spinner = ora(`刪除容器 ${name}...`).start();

    try {
      await this.dockerManager.deleteContainer(name, true);
      spinner.succeed(`容器已刪除: ${name}`);

      // 詢問是否刪除配置
      const { deleteConfig } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'deleteConfig',
          message: '是否同時刪除配置檔案?',
          default: false
        }
      ]);

      if (deleteConfig) {
        await this.configManager.deleteConfig(name);
      }
    } catch (error) {
      spinner.fail('刪除容器失敗');
      throw error;
    }
  }
}

module.exports = LifecycleCommand;
