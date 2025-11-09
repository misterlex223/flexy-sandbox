const Docker = require('dockerode');
const path = require('path');
const os = require('os');
const {
  DOCKER_IMAGE,
  CONTAINER_PREFIX,
  AI_ENV_MAP
} = require('../utils/constants');
const Logger = require('../utils/logger');

class DockerManager {
  constructor() {
    this.docker = new Docker();
  }

  /**
   * 檢查 Docker 是否運行
   */
  async checkDocker() {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      Logger.error('Docker 未運行或無法連線');
      return false;
    }
  }

  /**
   * 檢查映像是否存在
   */
  async checkImage() {
    try {
      await this.docker.getImage(DOCKER_IMAGE).inspect();
      return true;
    } catch (error) {
      Logger.warning(`映像 ${DOCKER_IMAGE} 不存在`);
      return false;
    }
  }

  /**
   * 建立並啟動容器
   * @param {string} name - 容器名稱
   * @param {object} config - 配置物件
   * @returns {object} 容器資訊
   */
  async createContainer(name, config) {
    const containerName = `${CONTAINER_PREFIX}${name}`;

    // 建立環境變數陣列
    const env = this.buildEnvironmentVars(config);

    // 建立 volume 掛載
    const binds = this.buildVolumes(config);

    // 建立 port 映射
    const portBindings = this.buildPortBindings(config);
    const exposedPorts = this.buildExposedPorts(config);

    try {
      const container = await this.docker.createContainer({
        name: containerName,
        Image: DOCKER_IMAGE,
        Env: env,
        HostConfig: {
          Binds: binds,
          PortBindings: portBindings
        },
        ExposedPorts: exposedPorts,
        WorkingDir: '/home/flexy/workspace',
        Tty: true,
        OpenStdin: true
      });

      Logger.success(`容器已建立: ${containerName}`);

      // 啟動容器
      await container.start();
      Logger.success(`容器已啟動: ${containerName}`);

      return {
        id: container.id,
        name: containerName
      };
    } catch (error) {
      Logger.error(`建立容器失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 建立環境變數陣列
   */
  buildEnvironmentVars(config) {
    const env = [];

    // WebTTY
    if (config.enableWebtty) {
      env.push('ENABLE_WEBTTY=true');
    }

    // CoSpec Port
    if (config.cospecPort) {
      env.push(`COSPEC_PORT=${config.cospecPort}`);
    }

    // AI Windows
    if (config.aiWindows && Array.isArray(config.aiWindows)) {
      config.aiWindows.forEach(window => {
        const prefix = `AI_WINDOW_${window.window}`;
        env.push(`${prefix}_TYPE=${window.type}`);
        env.push(`${prefix}_API_KEY=${window.apiKey}`);

        if (window.model) {
          env.push(`${prefix}_MODEL=${window.model}`);
        }

        if (window.baseUrl) {
          env.push(`${prefix}_BASE_URL=${window.baseUrl}`);
        }

        // 同時設定對應的全域環境變數（向後相容）
        const envMap = AI_ENV_MAP[window.type];
        if (envMap) {
          env.push(`${envMap.apiKey}=${window.apiKey}`);
          if (window.model) {
            env.push(`${envMap.model}=${window.model}`);
          }
          if (window.baseUrl) {
            env.push(`${envMap.baseUrl}=${window.baseUrl}`);
          }
        }
      });
    }

    // 其他環境變數
    if (config.environment) {
      Object.entries(config.environment).forEach(([key, value]) => {
        if (value) {
          env.push(`${key}=${value}`);
        }
      });
    }

    return env;
  }

  /**
   * 建立 volume 掛載
   */
  buildVolumes(config) {
    const binds = [];

    if (config.volumes && Array.isArray(config.volumes)) {
      config.volumes.forEach(volume => {
        let hostPath = volume.host;

        // 處理 ~ 和 $(pwd)
        hostPath = hostPath.replace(/^~/, os.homedir());
        hostPath = hostPath.replace(/\$\(pwd\)/, process.cwd());

        // 確保是絕對路徑
        if (!path.isAbsolute(hostPath)) {
          hostPath = path.resolve(process.cwd(), hostPath);
        }

        const bind = volume.readOnly
          ? `${hostPath}:${volume.container}:ro`
          : `${hostPath}:${volume.container}`;

        binds.push(bind);
      });
    }

    return binds;
  }

  /**
   * 建立端口綁定
   */
  buildPortBindings(config) {
    const portBindings = {};

    if (config.enableWebtty && config.webttyPort) {
      portBindings['9681/tcp'] = [{ HostPort: String(config.webttyPort) }];
    }

    if (config.cospecPort) {
      portBindings['9280/tcp'] = [{ HostPort: String(config.cospecPort) }];
    }

    return portBindings;
  }

  /**
   * 建立暴露端口
   */
  buildExposedPorts(config) {
    const exposedPorts = {};

    if (config.enableWebtty) {
      exposedPorts['9681/tcp'] = {};
    }

    exposedPorts['9280/tcp'] = {};

    return exposedPorts;
  }

  /**
   * 啟動容器
   */
  async startContainer(name) {
    const containerName = `${CONTAINER_PREFIX}${name}`;

    try {
      const container = this.docker.getContainer(containerName);
      await container.start();
      Logger.success(`容器已啟動: ${containerName}`);
    } catch (error) {
      Logger.error(`啟動容器失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 停止容器
   */
  async stopContainer(name) {
    const containerName = `${CONTAINER_PREFIX}${name}`;

    try {
      const container = this.docker.getContainer(containerName);
      await container.stop();
      Logger.success(`容器已停止: ${containerName}`);
    } catch (error) {
      Logger.error(`停止容器失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 暫停容器
   */
  async pauseContainer(name) {
    const containerName = `${CONTAINER_PREFIX}${name}`;

    try {
      const container = this.docker.getContainer(containerName);
      await container.pause();
      Logger.success(`容器已暫停: ${containerName}`);
    } catch (error) {
      Logger.error(`暫停容器失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 恢復容器
   */
  async unpauseContainer(name) {
    const containerName = `${CONTAINER_PREFIX}${name}`;

    try {
      const container = this.docker.getContainer(containerName);
      await container.unpause();
      Logger.success(`容器已恢復: ${containerName}`);
    } catch (error) {
      Logger.error(`恢復容器失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 刪除容器
   */
  async deleteContainer(name, force = false) {
    const containerName = `${CONTAINER_PREFIX}${name}`;

    try {
      const container = this.docker.getContainer(containerName);
      await container.remove({ force });
      Logger.success(`容器已刪除: ${containerName}`);
    } catch (error) {
      Logger.error(`刪除容器失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 列出所有 Flexy 容器
   */
  async listContainers() {
    try {
      const containers = await this.docker.listContainers({ all: true });

      return containers
        .filter(container => {
          return container.Names.some(name =>
            name.startsWith(`/${CONTAINER_PREFIX}`)
          );
        })
        .map(container => {
          const name = container.Names[0].replace(`/${CONTAINER_PREFIX}`, '');
          return {
            name,
            id: container.Id.substring(0, 12),
            state: container.State,
            status: container.Status,
            image: container.Image,
            ports: this.formatPorts(container.Ports)
          };
        });
    } catch (error) {
      Logger.error(`列出容器失敗: ${error.message}`);
      return [];
    }
  }

  /**
   * 格式化端口資訊
   */
  formatPorts(ports) {
    if (!ports || ports.length === 0) {
      return '-';
    }

    return ports
      .filter(p => p.PublicPort)
      .map(p => `${p.PublicPort}:${p.PrivatePort}`)
      .join(', ');
  }

  /**
   * 取得容器日誌
   */
  async getContainerLogs(name, tail = 100) {
    const containerName = `${CONTAINER_PREFIX}${name}`;

    try {
      const container = this.docker.getContainer(containerName);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true
      });

      return logs.toString('utf8');
    } catch (error) {
      Logger.error(`取得日誌失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 執行進入容器 shell 的命令
   */
  getShellCommand(name) {
    const containerName = `${CONTAINER_PREFIX}${name}`;
    return `docker exec -it ${containerName} /bin/bash`;
  }
}

module.exports = DockerManager;
