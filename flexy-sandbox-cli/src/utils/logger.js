const chalk = require('chalk');

class Logger {
  static info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message) {
    console.log(chalk.green('✓'), message);
  }

  static error(message) {
    console.log(chalk.red('✗'), message);
  }

  static warning(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  static debug(message) {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🐛'), message);
    }
  }

  static title(message) {
    console.log('\n' + chalk.bold.cyan(message) + '\n');
  }

  static separator() {
    console.log(chalk.gray('─'.repeat(60)));
  }
}

module.exports = Logger;
