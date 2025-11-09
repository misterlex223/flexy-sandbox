#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ConfigCommand = require('../src/commands/config');
const LifecycleCommand = require('../src/commands/lifecycle');
const QueryCommand = require('../src/commands/query');
const Logger = require('../src/utils/logger');
const packageJson = require('../package.json');

const program = new Command();

// 設定程式資訊
program
  .name('flexy-sandbox')
  .description('互動式 CLI 工具，用於管理 Flexy Sandbox 容器')
  .version(packageJson.version);

// ===== 配置命令 =====
program
  .command('config')
  .description('建立或修改配置')
  .action(async () => {
    try {
      const configCmd = new ConfigCommand();
      await configCmd.run();
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// ===== 容器生命週期命令 =====

// create - 建立並啟動容器
program
  .command('create <config-name>')
  .description('根據配置建立並啟動容器')
  .action(async (configName) => {
    try {
      const lifecycleCmd = new LifecycleCommand();
      await lifecycleCmd.create(configName);
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// start - 啟動容器
program
  .command('start <name>')
  .description('啟動已存在的容器')
  .action(async (name) => {
    try {
      const lifecycleCmd = new LifecycleCommand();
      await lifecycleCmd.start(name);
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// stop - 停止容器
program
  .command('stop <name>')
  .description('停止運行中的容器')
  .action(async (name) => {
    try {
      const lifecycleCmd = new LifecycleCommand();
      await lifecycleCmd.stop(name);
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// pause - 暫停容器
program
  .command('pause <name>')
  .description('暫停運行中的容器')
  .action(async (name) => {
    try {
      const lifecycleCmd = new LifecycleCommand();
      await lifecycleCmd.pause(name);
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// unpause - 恢復容器
program
  .command('unpause <name>')
  .description('恢復已暫停的容器')
  .action(async (name) => {
    try {
      const lifecycleCmd = new LifecycleCommand();
      await lifecycleCmd.unpause(name);
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// delete - 刪除容器
program
  .command('delete <name>')
  .description('刪除容器')
  .option('-f, --force', '強制刪除，不詢問確認')
  .action(async (name, options) => {
    try {
      const lifecycleCmd = new LifecycleCommand();
      await lifecycleCmd.delete(name, options);
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// ===== 容器查詢命令 =====

// list - 列出所有容器
program
  .command('list')
  .alias('ls')
  .description('列出所有 Flexy 容器')
  .action(async () => {
    try {
      const queryCmd = new QueryCommand();
      await queryCmd.list();
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// logs - 查看容器日誌
program
  .command('logs <name>')
  .description('查看容器日誌')
  .option('-f, --follow', '持續追蹤日誌')
  .option('-n, --tail <lines>', '顯示最後 N 行', '100')
  .action(async (name, options) => {
    try {
      const queryCmd = new QueryCommand();
      await queryCmd.logs(name, {
        follow: options.follow,
        tail: parseInt(options.tail, 10)
      });
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// shell - 進入容器 shell
program
  .command('shell <name>')
  .alias('sh')
  .description('進入容器的 shell')
  .action(async (name) => {
    try {
      const queryCmd = new QueryCommand();
      await queryCmd.shell(name);
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// inspect - 查看容器詳細資訊
program
  .command('inspect <name>')
  .description('查看容器詳細資訊')
  .action(async (name) => {
    try {
      const queryCmd = new QueryCommand();
      await queryCmd.inspect(name);
    } catch (error) {
      Logger.error(error.message);
      process.exit(1);
    }
  });

// ===== 說明和錯誤處理 =====

program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('範例:'));
  console.log('  $ flexy-sandbox config                    # 建立新配置');
  console.log('  $ flexy-sandbox create my-dev             # 建立容器');
  console.log('  $ flexy-sandbox list                      # 列出所有容器');
  console.log('  $ flexy-sandbox shell my-dev              # 進入容器');
  console.log('  $ flexy-sandbox logs my-dev -f            # 追蹤日誌');
  console.log('  $ flexy-sandbox stop my-dev               # 停止容器');
  console.log('');
  console.log(chalk.cyan('更多資訊:'));
  console.log('  https://github.com/your-org/flexy-sandbox-cli');
  console.log('');
});

// 解析命令行參數
program.parse(process.argv);

// 如果沒有提供任何命令，顯示說明
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
