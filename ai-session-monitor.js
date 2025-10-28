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

// Main initialization function - create tmux session and windows if they don't exist
async function initializeSession() {
    try {
        // Check if session exists
        const sessionExists = await checkSessionExists(SESSION_NAME);
        if (!sessionExists) {
            console.log(`Creating tmux session: ${SESSION_NAME}`);
            
            if (ENABLE_PERSISTENT_AI_SESSIONS === 'true') {
                // Create the main session with Qwen window (window 0)
                await execAsync(`tmux new -d -s ${SESSION_NAME} -n qwen_session`);
                
                // Create Claude session window (window 1)
                await execAsync(`tmux new-window -t ${SESSION_NAME}:1 -n claude_session`);
                
                // Create Gemini session window (window 2)
                await execAsync(`tmux new-window -t ${SESSION_NAME}:2 -n gemini_session`);
                
                // Create User session window (window 3)
                await execAsync(`tmux new-window -t ${SESSION_NAME}:3 -n user_session`);
                
                // If in interactive mode, start AI CLIs
                if (AI_SESSION_MODE === 'interactive') {
                    console.log('Starting AI CLI tools in interactive mode...');
                    await execAsync(`tmux send-keys -t ${SESSION_NAME}:0 'qwen' Enter`);
                    await execAsync(`tmux send-keys -t ${SESSION_NAME}:1 'claude' Enter`);
                    await execAsync(`tmux send-keys -t ${SESSION_NAME}:2 'gemini' Enter`);
                }
            } else {
                // Create the main session with user window (window 0) if persistent AI sessions are disabled
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
    const windowNames = {
        0: 'qwen_session',
        1: 'claude_session',
        2: 'gemini_session'
    };
    
    const windowName = windowNames[windowIndex];
    if (!windowName) {
        console.log(`Window index ${windowIndex} is not an AI window, skipping restart`);
        return;
    }
    
    // Prevent restarting too frequently
    const currentTime = Date.now();
    const key = `${windowIndex}-${aiCmd}`;
    if (lastRestartTime[key] && (currentTime - lastRestartTime[key]) < 3000) {
        console.log(`Skipping restart for ${aiCmd} in ${windowName} (window ${windowIndex}) - too frequent`);
        return;
    }
    
    console.log(`Restarting ${aiCmd} in ${windowName} (window ${windowIndex})`);
    
    try {
        // Clear the pane first to ensure a clean restart
        await execAsync(`tmux send-keys -t ${SESSION_NAME}:${windowIndex} 'C-c' Enter`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for interruption
        await execAsync(`tmux send-keys -t ${SESSION_NAME}:${windowIndex} 'clear' Enter`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for clear
        // Send the AI command to the window
        await execAsync(`tmux send-keys -t ${SESSION_NAME}:${windowIndex} '${aiCmd}' Enter`);
        lastRestartTime[key] = currentTime;
        console.log(`${aiCmd} restarted in ${windowName}`);
    } catch (error) {
        console.error(`Error restarting ${aiCmd}:`, error);
    }
}

async function ensureWindowsExist() {
    if (ENABLE_PERSISTENT_AI_SESSIONS !== 'true') {
        return; // Only manage windows if persistent AI sessions are enabled
    }
    
    try {
        // Check if Qwen window exists (window 0)
        const qwenRunning = await checkWindowRunning(SESSION_NAME, 0);
        if (!qwenRunning) {
            console.log('Qwen window missing, creating...');
            await execAsync(`tmux kill-window -t ${SESSION_NAME}:0 2>/dev/null || true`); // Clean up dead window if any
            await execAsync(`tmux new-window -t ${SESSION_NAME}:0 -n qwen_session`);
            if (AI_SESSION_MODE === 'interactive') {
                await execAsync(`tmux send-keys -t ${SESSION_NAME}:0 'qwen' Enter`);
            }
        }

        // Check if Claude window exists (window 1)
        const claudeRunning = await checkWindowRunning(SESSION_NAME, 1);
        if (!claudeRunning) {
            console.log('Claude window missing, creating...');
            await execAsync(`tmux kill-window -t ${SESSION_NAME}:1 2>/dev/null || true`); // Clean up dead window if any
            await execAsync(`tmux new-window -t ${SESSION_NAME}:1 -n claude_session`);
            if (AI_SESSION_MODE === 'interactive') {
                await execAsync(`tmux send-keys -t ${SESSION_NAME}:1 'claude' Enter`);
            }
        }

        // Check if Gemini window exists (window 2)
        const geminiRunning = await checkWindowRunning(SESSION_NAME, 2);
        if (!geminiRunning) {
            console.log('Gemini window missing, creating...');
            await execAsync(`tmux kill-window -t ${SESSION_NAME}:2 2>/dev/null || true`); // Clean up dead window if any
            await execAsync(`tmux new-window -t ${SESSION_NAME}:2 -n gemini_session`);
            if (AI_SESSION_MODE === 'interactive') {
                await execAsync(`tmux send-keys -t ${SESSION_NAME}:2 'gemini' Enter`);
            }
        }
        
        // Check if User window exists (window 3)
        const userRunning = await checkWindowRunning(SESSION_NAME, 3);
        if (!userRunning) {
            console.log('User window missing, creating...');
            await execAsync(`tmux kill-window -t ${SESSION_NAME}:3 2>/dev/null || true`); // Clean up dead window if any
            await execAsync(`tmux new-window -t ${SESSION_NAME}:3 -n user_session`);
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

        // Check Qwen session (window 0)
        console.log('Checking Qwen session...');
        const qwenRunning = await checkWindowRunning(SESSION_NAME, 0);
        console.log(`Qwen window running: ${qwenRunning}`);
        if (qwenRunning) {
            const qwenProcessRunning = await checkAIProcessRunning(SESSION_NAME, 0, 'qwen');
            console.log(`Qwen process running: ${qwenProcessRunning}`);
            if (!qwenProcessRunning && AI_SESSION_MODE === 'interactive') {
                console.log('Qwen process not running, restarting...');
                await restartAIInWindow(0, 'qwen');
            } else {
                console.log('Qwen process is running as expected');
            }
        } else if (AI_SESSION_MODE === 'interactive') {
            // Window is dead, try to restart it
            console.log('Qwen window is dead, restarting...');
            await execAsync(`tmux kill-window -t ${SESSION_NAME}:0 2>/dev/null || true`); // Clean up dead window if any
            await execAsync(`tmux new-window -t ${SESSION_NAME}:0 -n qwen_session`);
            await execAsync(`tmux send-keys -t ${SESSION_NAME}:0 'qwen' Enter`);
            console.log('Qwen window restarted');
        }

        // Check Claude session (window 1)
        console.log('Checking Claude session...');
        const claudeRunning = await checkWindowRunning(SESSION_NAME, 1);
        console.log(`Claude window running: ${claudeRunning}`);
        if (claudeRunning) {
            const claudeProcessRunning = await checkAIProcessRunning(SESSION_NAME, 1, 'claude');
            console.log(`Claude process running: ${claudeProcessRunning}`);
            if (!claudeProcessRunning && AI_SESSION_MODE === 'interactive') {
                console.log('Claude process not running, restarting...');
                await restartAIInWindow(1, 'claude');
            } else {
                console.log('Claude process is running as expected');
            }
        } else if (AI_SESSION_MODE === 'interactive') {
            // Window is dead, try to restart it
            console.log('Claude window is dead, restarting...');
            await execAsync(`tmux kill-window -t ${SESSION_NAME}:1 2>/dev/null || true`); // Clean up dead window if any
            await execAsync(`tmux new-window -t ${SESSION_NAME}:1 -n claude_session`);
            await execAsync(`tmux send-keys -t ${SESSION_NAME}:1 'claude' Enter`);
            console.log('Claude window restarted');
        }

        // Check Gemini session (window 2)
        console.log('Checking Gemini session...');
        const geminiRunning = await checkWindowRunning(SESSION_NAME, 2);
        console.log(`Gemini window running: ${geminiRunning}`);
        if (geminiRunning) {
            const geminiProcessRunning = await checkAIProcessRunning(SESSION_NAME, 2, 'gemini');
            console.log(`Gemini process running: ${geminiProcessRunning}`);
            if (!geminiProcessRunning && AI_SESSION_MODE === 'interactive') {
                console.log('Gemini process not running, restarting...');
                await restartAIInWindow(2, 'gemini');
            } else {
                console.log('Gemini process is running as expected');
            }
        } else if (AI_SESSION_MODE === 'interactive') {
            // Window is dead, try to restart it
            console.log('Gemini window is dead, restarting...');
            await execAsync(`tmux kill-window -t ${SESSION_NAME}:2 2>/dev/null || true`); // Clean up dead window if any
            await execAsync(`tmux new-window -t ${SESSION_NAME}:2 -n gemini_session`);
            await execAsync(`tmux send-keys -t ${SESSION_NAME}:2 'gemini' Enter`);
            console.log('Gemini window restarted');
        }

        // Check user session (window 3) - just ensure window exists, no process to monitor
        console.log('Checking user session...');
        const userRunning = await checkWindowRunning(SESSION_NAME, 3);
        console.log(`User window running: ${userRunning}`);
        if (!userRunning) {
            console.log('User window is dead, restarting...');
            await execAsync(`tmux new-window -t ${SESSION_NAME}:3 -n user_session`);
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
    await initializeSession();
    
    // Run the monitor at regular intervals
    setInterval(monitorSessions, MONITOR_INTERVAL);
    
    // Also run immediately once after giving AI CLIs time to start up
    setTimeout(monitorSessions, 3000); // Run first check after 3 seconds to allow AI tools to start
}

// Start the monitoring process
startMonitoring().catch(console.error);

console.log('AI session monitoring started...');