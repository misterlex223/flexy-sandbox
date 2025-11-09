const Table = require('cli-table3');
const { spawn } = require('child_process');
const DockerManager = require('../lib/dockerManager');
const Logger = require('../utils/logger');
const chalk = require('chalk');

class QueryCommand {
  constructor() {
    this.dockerManager = new DockerManager();
  }

  /**
   * 列出所有容器
   */
  async list() {
    try {
      const containers = await this.dockerManager.listContainers();

      if (containers.length === 0) {
        Logger.info('沒有 Flexy 容器');
        return;
      }

      const table = new Table({
        head: [
          chalk.cyan('名稱'),
          chalk.cyan('ID'),
          chalk.cyan('狀態'),
          chalk.cyan('端口'),
          chalk.cyan('映像')
        ],
        colWidths: [20, 15, 15, 25, 30]
      });

      containers.forEach(container => {
        const stateColor = container.state === 'running' ? chalk.green : chalk.gray;

        table.push([
          container.name,
          container.id,
          stateColor(container.state),
          container.ports,
          container.image
        ]);
      });

      console.log(table.toString());

      Logger.info(`\n總共 ${containers.length} 個容器`);
    } catch (error) {
      Logger.error(`列出容器失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 查看容器日誌
   */
  async logs(name, options = {}) {
    try {
      const tail = options.tail || 100;
      const follow = options.follow || false;

      if (follow) {
        // 使用 docker logs -f 實時追蹤
        Logger.info(`追蹤容器日誌: ${name} (按 Ctrl+C 停止)`);
        Logger.separator();

        const containerName = `flexy-${name}`;
        const dockerLogs = spawn('docker', ['logs', '-f', '--tail', String(tail), containerName], {
          stdio: 'inherit'
        });

        dockerLogs.on('error', error => {
          Logger.error(`執行 docker logs 失敗: ${error.message}`);
        });
      } else {
        const logs = await this.dockerManager.getContainerLogs(name, tail);

        Logger.info(`容器日誌: ${name} (最後 ${tail} 行)`);
        Logger.separator();
        console.log(logs);
        Logger.separator();
      }
    } catch (error) {
      Logger.error(`查看日誌失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 進入容器 shell
   */
  async shell(name) {
    try {
      const command = this.dockerManager.getShellCommand(name);

      Logger.info(`進入容器 shell: ${name}`);
      Logger.info(`執行命令: ${command}`);
      Logger.separator();

      // 使用 spawn 執行互動式 shell
      const shell = spawn('docker', ['exec', '-it', `flexy-${name}`, '/bin/bash'], {
        stdio: 'inherit'
      });

      shell.on('error', error => {
        Logger.error(`執行 shell 失敗: ${error.message}`);
      });

      shell.on('exit', code => {
        if (code !== 0) {
          Logger.warning(`Shell 退出碼: ${code}`);
        }
      });
    } catch (error) {
      Logger.error(`進入 shell 失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 顯示容器詳細資訊
   */
  async inspect(name) {
    try {
      const containerName = `flexy-${name}`;
      const { spawn } = require('child_process');

      Logger.info(`容器詳細資訊: ${name}`);
      Logger.separator();

      const inspect = spawn('docker', ['inspect', containerName], {
        stdio: 'inherit'
      });

      inspect.on('error', error => {
        Logger.error(`執行 docker inspect 失敗: ${error.message}`);
      });
    } catch (error) {
      Logger.error(`查看詳細資訊失敗: ${error.message}`);
      throw error;
    }
  }
}

module.exports = QueryCommand;
