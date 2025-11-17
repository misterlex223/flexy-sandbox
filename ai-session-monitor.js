const { exec } = require('child_process');
const { promisify } = require('util');

// Use promisify to convert exec to return a Promise
const execAsync = promisify(exec);

// Read environment variables with defaults
const ENABLE_PERSISTENT_AI_SESSIONS = process.env.ENABLE_PERSISTENT_AI_SESSIONS || 'true';
const AI_SESSION_MODE = process.env.AI_SESSION_MODE || 'interactive';

console.log(`Environment variables: ENABLE_PERSISTENT_AI_SESSIONS=${ENABLE_PERSISTENT_AI_SESSIONS}, AI_SESSION_MODE=${AI_SESSION_MODE}`);

const SESSION_NAME = 'shared_session';
const MONITOR_INTERVAL = 5000; // Check every 5 seconds
const MAX_WINDOWS = 5; // Windows 1-5 are configurable, window 0 is user terminal

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
 * 從環境變數解析單一 window 配置
 * @param {number} windowIndex - Window 索引 (1-5)
 * @returns {object|null} - 配置物件或 null
 */
function getWindowConfig(windowIndex) {
    const type = process.env[`AI_WINDOW_${windowIndex}_TYPE`];
    if (!type) return null;

    const apiKey = process.env[`AI_WINDOW_${windowIndex}_API_KEY`];
    const model = process.env[`AI_WINDOW_${windowIndex}_MODEL`];
    const baseUrl = process.env[`AI_WINDOW_${windowIndex}_BASE_URL`];

    return {
        type: type.toLowerCase(),
        apiKey,
        model,
        baseUrl,
        windowIndex,
        windowName: `${type}_session`
    };
}

/**
 * 取得所有配置的 windows
 * @returns {Array} - Window 配置陣列
 */
function getAllWindowConfigs() {
    const configs = [];
    for (let i = 1; i <= MAX_WINDOWS; i++) {
        const config = getWindowConfig(i);
        configs.push(config);
    }
    return configs;
}

/**
 * 生成 AI 工具啟動命令
 * @param {object} config - Window 配置
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

// Main initialization function - create tmux session and windows if they don't exist
async function initializeSession() {
    try {
        // Check if session exists
        const sessionExists = await checkSessionExists(SESSION_NAME);
        if (!sessionExists) {
            console.log(`Creating tmux session: ${SESSION_NAME}`);

            if (ENABLE_PERSISTENT_AI_SESSIONS === 'true') {
                const windowConfigs = getAllWindowConfigs();
                let firstWindowCreated = false;

                // 建立 windows（1-5）
                for (let i = 0; i < MAX_WINDOWS; i++) {
                    const config = windowConfigs[i];
                    const windowName = config ? config.windowName : `shell_${i}`;

                    if (!firstWindowCreated) {
                        // 建立第一個 window（同時建立 session）
                        await execAsync(`tmux new -d -s ${SESSION_NAME} -n ${windowName}`);
                        firstWindowCreated = true;
                        console.log(`Created session with window ${i}: ${windowName}`);
                    } else {
                        // 建立後續 windows
                        await execAsync(`tmux new-window -t ${SESSION_NAME}:${i} -n ${windowName}`);
                        console.log(`Created window ${i}: ${windowName}`);
                    }

                    // 如果是 AI 工具且為 interactive 模式，啟動 AI CLI
                    if (config && AI_SESSION_MODE === 'interactive') {
                        const aiCmd = generateAICommand(config);
                        if (aiCmd) {
                            console.log(`Starting ${config.type} in window ${i}...`);
                            await execAsync(`tmux send-keys -t ${SESSION_NAME}:${i} '${aiCmd}' Enter`);
                        }
                    }
                }

                // 建立 window 0（使用者終端，固定）
                await execAsync(`tmux new-window -t ${SESSION_NAME}:0 -n user_session`);
                console.log('Created window 0: user_session');

            } else {
                // 如果未啟用持久化 AI 會話，只建立使用者終端
                await execAsync(`tmux new -d -s ${SESSION_NAME} -n user_session`);
            }

            console.log(`Session ${SESSION_NAME} initialized with all windows`);
        } else {
            console.log(`Session ${SESSION_NAME} already exists`);
        }
    } catch (error) {
        console.error('Error initializing session:', error);
    } finally {
        // Always ensure the history limit is set for the session using environment variable
        const tmuxHistoryLimit = process.env.TMUX_HISTORY_LIMIT || '10000';
        await execAsync(`tmux set -g history-limit ${tmuxHistoryLimit}`);
        await execAsync(`tmux set -g mouse on `);
    }

}

function checkSessionExists(sessionName) {
    return new Promise((resolve) => {
        exec(`tmux has-session -t ${sessionName}`, (error) => {
            resolve(!error);
        });
    });
}

function checkWindowRunning(sessionName, windowIndex) {
    return new Promise((resolve) => {
        exec(`tmux list-panes -t ${sessionName}:${windowIndex} -F '#{pane_dead}' 2>/dev/null | head -n 1`,
        (error, stdout) => {
            if (error) {
                console.log(`Error checking window ${sessionName}:${windowIndex} status:`, error.message);
                resolve(false);
                return;
            }
            const paneDead = stdout.trim();
            console.log(`Window ${sessionName}:${windowIndex} dead status: "${paneDead}"`);
            resolve(paneDead !== '1');
        });
    });
}

function checkAIProcessRunning(sessionName, windowIndex, aiCmd) {
    return new Promise((resolve) => {
        exec(`tmux list-panes -t ${sessionName}:${windowIndex} -F '#{pane_current_command}' 2>/dev/null | head -n 1`,
        (error, stdout) => {
            if (error || !stdout.trim()) {
                console.log(`Window ${windowIndex} process check failed or empty:`, error ? error.message : 'no output');
                resolve(false);
                return;
            }
            const currentCmd = stdout.trim().toLowerCase();
            console.log(`Window ${windowIndex} current command: "${currentCmd}", looking for: "${aiCmd}"`);

            // Check if the current command matches our AI command (case-insensitive)
            // Also include more robust checks to handle cases where the command shows as 'node' or other parent processes
            let isRunning = currentCmd.includes(aiCmd.toLowerCase());

            // If basic check fails, do a more thorough check with ps to see if the AI process is running
            if (!isRunning) {
                exec(`ps aux | grep -v grep | grep ${aiCmd}`, (psError, psStdout) => {
                    if (!psError && psStdout) {
                        // Additional check: if we see the AI command in the process list,
                        // it might be running as a child process even if tmux doesn't show it
                        console.log(`Found ${aiCmd} in process list: ${psStdout.trim()}`);
                        isRunning = true;
                    }
                    console.log(`Process ${aiCmd} running status after ps check: ${isRunning}`);
                    resolve(isRunning);
                });
            } else {
                console.log(`Process ${aiCmd} running status: ${isRunning}`);
                resolve(isRunning);
            }
        });
    });
}

// Track the last restart time to prevent rapid restarts
const lastRestartTime = {};

async function restartAIInWindow(windowIndex, aiCmd) {
    // Prevent restarting too frequently
    const currentTime = Date.now();
    const key = `${windowIndex}-${aiCmd}`;
    if (lastRestartTime[key] && (currentTime - lastRestartTime[key]) < 3000) {
        console.log(`Skipping restart for ${aiCmd} in window ${windowIndex} - too frequent`);
        return;
    }

    console.log(`Restarting ${aiCmd} in window ${windowIndex}`);

    try {
        // Clear the pane first to ensure a clean restart
        await execAsync(`tmux send-keys -t ${SESSION_NAME}:${windowIndex} 'C-c' Enter`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for interruption
        await execAsync(`tmux send-keys -t ${SESSION_NAME}:${windowIndex} 'clear' Enter`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for clear
        // Send the AI command to the window
        await execAsync(`tmux send-keys -t ${SESSION_NAME}:${windowIndex} '${aiCmd}' Enter`);
        lastRestartTime[key] = currentTime;
        console.log(`${aiCmd} restarted in window ${windowIndex}`);
    } catch (error) {
        console.error(`Error restarting ${aiCmd}:`, error);
    }
}

async function ensureWindowsExist() {
    if (ENABLE_PERSISTENT_AI_SESSIONS !== 'true') {
        return; // Only manage windows if persistent AI sessions are enabled
    }

    try {
        const windowConfigs = getAllWindowConfigs();

        // 檢查並重建 windows 1-5
        for (let i = 0; i < MAX_WINDOWS; i++) {
            const config = windowConfigs[i];
            const windowName = config ? config.windowName : `shell_${i}`;
            const windowRunning = await checkWindowRunning(SESSION_NAME, i);

            if (!windowRunning) {
                console.log(`Window ${i} missing, creating...`);
                await execAsync(`tmux kill-window -t ${SESSION_NAME}:${i} 2>/dev/null || true`);
                await execAsync(`tmux new-window -t ${SESSION_NAME}:${i} -n ${windowName}`);

                // 如果是 AI 工具且為 interactive 模式，啟動 AI CLI
                if (config && AI_SESSION_MODE === 'interactive') {
                    const aiCmd = generateAICommand(config);
                    if (aiCmd) {
                        await execAsync(`tmux send-keys -t ${SESSION_NAME}:${i} '${aiCmd}' Enter`);
                    }
                }
            }
        }

        // 檢查使用者終端（window 0）
        const userRunning = await checkWindowRunning(SESSION_NAME, 0);
        if (!userRunning) {
            console.log('User window (window 0) missing, creating...');
            await execAsync(`tmux kill-window -t ${SESSION_NAME}:0 2>/dev/null || true`);
            await execAsync(`tmux new-window -t ${SESSION_NAME}:0 -n user_session`);
        }
    } catch (error) {
        console.error('Error ensuring windows exist:', error);
    }
}

async function monitorSessions() {
    console.log('=== Starting monitorSessions cycle ===');
    try {
        // If persistent AI sessions are not enabled, nothing to monitor
        if (ENABLE_PERSISTENT_AI_SESSIONS !== 'true') {
            console.log('Persistent AI sessions not enabled, skipping monitoring');
            return;
        }

        if (!await checkSessionExists(SESSION_NAME)) {
            console.log(`Session ${SESSION_NAME} does not exist, initializing...`);
            await initializeSession();
            return;
        }

        await ensureWindowsExist();

        // 監控所有配置的 AI windows
        const windowConfigs = getAllWindowConfigs();
        for (let i = 0; i < MAX_WINDOWS; i++) {
            const config = windowConfigs[i];
            if (!config) continue; // 跳過未配置的 window

            console.log(`Checking ${config.type} session (window ${i})...`);
            const windowRunning = await checkWindowRunning(SESSION_NAME, i);
            console.log(`Window ${i} running: ${windowRunning}`);

            if (windowRunning) {
                const aiCmd = AI_COMMANDS[config.type];
                const processRunning = await checkAIProcessRunning(SESSION_NAME, i, aiCmd);
                console.log(`${config.type} process running: ${processRunning}`);

                if (!processRunning && AI_SESSION_MODE === 'interactive') {
                    console.log(`${config.type} process not running, restarting...`);
                    await restartAIInWindow(i, aiCmd);
                } else {
                    console.log(`${config.type} process is running as expected`);
                }
            } else if (AI_SESSION_MODE === 'interactive') {
                // Window is dead, try to restart it
                console.log(`Window ${i} (${config.type}) is dead, restarting...`);
                await execAsync(`tmux kill-window -t ${SESSION_NAME}:${i} 2>/dev/null || true`);
                await execAsync(`tmux new-window -t ${SESSION_NAME}:${i} -n ${config.windowName}`);
                const aiCmd = generateAICommand(config);
                if (aiCmd) {
                    await execAsync(`tmux send-keys -t ${SESSION_NAME}:${i} '${aiCmd}' Enter`);
                }
                console.log(`Window ${i} (${config.type}) restarted`);
            }
        }

        // 檢查使用者終端（window 0）
        console.log('Checking user session...');
        const userRunning = await checkWindowRunning(SESSION_NAME, 0);
        console.log(`User window running: ${userRunning}`);
        if (!userRunning) {
            console.log('User window (window 0) is dead, restarting...');
            await execAsync(`tmux new-window -t ${SESSION_NAME}:0 -n user_session`);
            console.log('User window restarted');
        }

        console.log('=== Completed monitorSessions cycle ===');
    } catch (error) {
        console.error('Error in monitorSessions:', error);
    }
}

// Initialize the session when the script starts
async function startMonitoring() {
    console.log('AI session monitor starting...');

    // 顯示配置摘要
    console.log('Window configuration:');
    const windowConfigs = getAllWindowConfigs();
    for (let i = 0; i < MAX_WINDOWS; i++) {
        const config = windowConfigs[i];
        if (config) {
            console.log(`  Window ${i}: ${config.type}`);
        } else {
            console.log(`  Window ${i}: bash shell (未配置 AI 工具)`);
        }
    }
    console.log('  Window 0: user terminal (固定)');
    console.log('');

    await initializeSession();

    // Run the monitor at regular intervals
    setInterval(monitorSessions, MONITOR_INTERVAL);

    // Also run immediately once after giving AI CLIs time to start up
    setTimeout(monitorSessions, 3000); // Run first check after 3 seconds to allow AI tools to start
}

// Start the monitoring process
startMonitoring().catch(console.error);

console.log('AI session monitoring started...');
