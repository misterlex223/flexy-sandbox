const { exec } = require('child_process');
const { promisify } = require('util');

// Use promisify to convert exec to return a Promise
const execAsync = promisify(exec);

// Read environment variables with defaults
const ENABLE_PERSISTENT_AI_SESSIONS = process.env.ENABLE_PERSISTENT_AI_SESSIONS || 'true';
const AI_SESSION_MODE = process.env.AI_SESSION_MODE || 'interactive';

console.log(`Environment variables: ENABLE_PERSISTENT_AI_SESSIONS=${ENABLE_PERSISTENT_AI_SESSIONS}, AI_SESSION_MODE=${AI_SESSION_MODE}`);

const SESSION_NAME = 'shared_session';
const MONITOR_INTERVAL = 10000; // Check every 10 seconds (less frequent)
const MAX_TABS = 5; // Tabs 1-5 are configurable, tab 0 is user terminal

// AI 工具命令映射
const AI_COMMANDS = {
    'qwen': 'qwen',
    'claude': 'claude',
    'gemini': 'gemini',
    'codex': 'codex'
};

// AI 工具環境變數映射（用於啟動命令）
const AI_ENV_MAPPINGS = {
    'qwen': {
        apiKey: 'QWEN_API_KEY',
        model: 'QWEN_MODEL',
        baseUrl: 'QWEN_BASE_URL'
    },
    'claude': {
        apiKey: 'ANTHROPIC_AUTH_TOKEN',
        model: 'ANTHROPIC_MODEL',
        baseUrl: 'ANTHROPIC_BASE_URL'
    },
    'gemini': {
        apiKey: 'GEMINI_API_KEY',
        model: 'GEMINI_MODEL',
        baseUrl: 'GEMINI_BASE_URL'
    },
    'codex': {
        apiKey: 'OPENAI_API_KEY',
        model: 'OPENAI_MODEL',
        baseUrl: 'OPENAI_BASE_URL'
    }
};

/**
 * 從環境變數解析單一 tab 配置
 * @param {number} tabIndex - Tab 索引 (1-5)
 * @returns {object|null} - 配置物件或 null
 */
function getTabConfig(tabIndex) {
    const type = process.env[`AI_WINDOW_${tabIndex}_TYPE`];
    if (!type) return null;

    const apiKey = process.env[`AI_WINDOW_${tabIndex}_API_KEY`];
    const model = process.env[`AI_WINDOW_${tabIndex}_MODEL`];
    const baseUrl = process.env[`AI_WINDOW_${tabIndex}_BASE_URL`];

    return {
        type: type.toLowerCase(),
        apiKey,
        model,
        baseUrl,
        tabIndex,
        tabName: `${type}_session`
    };
}

/**
 * 取得所有配置的 tabs
 * @returns {Array} - Tab 配置陣列
 */
function getAllTabConfigs() {
    const configs = [];
    for (let i = 1; i <= MAX_TABS; i++) {
        const config = getTabConfig(i);
        configs.push(config);
    }
    return configs;
}

/**
 * 生成 AI 工具啟動命令
 * @param {object} config - Tab 配置
 * @returns {string} - 啟動命令
 */
function generateAICommand(config) {
    const { type, apiKey, model, baseUrl } = config;
    const cmd = AI_COMMANDS[type];

    if (!cmd) {
        console.error(`Unknown AI type: ${type}`);
        return null;
    }

    // 設定環境變數到全域環境（供 AI CLI 讀取）
    const envMapping = AI_ENV_MAPPINGS[type];
    if (envMapping) {
        if (apiKey) process.env[envMapping.apiKey] = apiKey;
        if (model) process.env[envMapping.model] = model;
        if (baseUrl) process.env[envMapping.baseUrl] = baseUrl;
    }

    // 返回基本命令（AI CLI 會從環境變數讀取配置）
    return cmd;
}

// Monitor loop - just log status periodically
async function monitorSessions() {
    console.log('=== AI Session Monitor Status ===');

    if (ENABLE_PERSISTENT_AI_SESSIONS !== 'true') {
        console.log('Persistent AI sessions not enabled');
        return;
    }

    // 顯示配置的 AI 工具
    const tabConfigs = getAllTabConfigs();
    console.log('Configured AI tools:');
    for (let i = 1; i <= MAX_TABS; i++) {
        const config = tabConfigs[i - 1];
        if (config) {
            console.log(`  Tab ${i}: ${config.type} (${AI_COMMANDS[config.type]})`);
        }
    }

    console.log('Note: Zellij session will be created automatically when you connect via WebTTY');
    console.log('=====================================');
}

// Initialize the monitor when the script starts
async function startMonitoring() {
    console.log('AI session monitor starting...');

    // 顯示配置摘要
    console.log('Tab configuration:');
    const tabConfigs = getAllTabConfigs();
    for (let i = 1; i <= MAX_TABS; i++) {
        const config = tabConfigs[i - 1];
        if (config) {
            console.log(`  Tab ${i}: ${config.type}`);
        } else {
            console.log(`  Tab ${i}: bash shell (未配置 AI 工具)`);
        }
    }
    console.log('  Tab 0: user terminal (固定)');
    console.log('');

    console.log('Zellij 使用方式:');
    console.log('- 使用 Ctrl+g 然後按 n 來新增 tab');
    console.log('- 使用 Ctrl+g 然後按 d 來離開會話');
    console.log('- 使用 Ctrl+g 然後按 [數字] 切換 tab');
    console.log('- 使用 Ctrl+g 然後按 Ctrl+g 回到正常模式');
    console.log('');
    console.log('✓ Copy-on-select 已啟用：直接拖曳滑鼠選取文字即可複製！');
    console.log('');

    // Set environment variables for configured AI tools
    for (let i = 1; i <= MAX_TABS; i++) {
        const config = tabConfigs[i - 1];
        if (config) {
            generateAICommand(config);
            console.log(`環境變數已設定: Tab ${i} (${config.type})`);
        }
    }

    console.log('');
    console.log('WebTTY is ready at http://localhost:9681');
    console.log('Connect to start the Zellij session!');

    // Run the monitor at regular intervals
    setInterval(monitorSessions, MONITOR_INTERVAL);

    // Run once after a short delay
    setTimeout(monitorSessions, 2000);
}

// Start the monitoring process
startMonitoring().catch(console.error);

console.log('AI session monitoring started...');
