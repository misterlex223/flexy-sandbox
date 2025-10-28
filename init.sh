#!/bin/bash

# 初始化開發環境腳本

# 設定支援中文的 locale
export LANG=zh_TW.UTF-8
export LC_ALL=zh_TW.UTF-8

# 建立常用目錄
mkdir -p /home/flexy/.config

# Initialize Qwen and Claude config directories if they're empty/uninitialized
# This happens after mount points are established but before services start
if [ ! "$(ls -A /home/flexy/.qwen 2>/dev/null)" ]; then
  echo "Initializing Qwen config directory with default settings..."
  if [ -f /home/flexy/default-qwen-settings.json ]; then
    cp /home/flexy/default-qwen-settings.json /home/flexy/.qwen/settings.json
  else
    echo '{}' > /home/flexy/.qwen/settings.json
  fi
fi

if [ ! "$(ls -A /home/flexy/.claude 2>/dev/null)" ]; then
  echo "Initializing Claude config directory with default settings..."
  if [ -f /home/flexy/default-mcp.json ]; then
    cp /home/flexy/default-mcp.json /home/flexy/.claude/.mcp.json
  fi
  # Copy CLAUDE.md if it exists
  if [ -f /home/flexy/CLAUDE.md ]; then
    cp /home/flexy/CLAUDE.md /home/flexy/.claude/CLAUDE.md
  fi
fi

# 設定 Git 初始配置（如果尚未設定）
if [ ! -f /home/flexy/.gitconfig ]; then
  git config --global user.email "flexy@example.com"
  git config --global user.name "Flexy"
fi

# 檢查並設定 Qwen 環境變數
echo "檢查 Qwen 環境設定..."
if [ -n "$QWEN_API_KEY" ]; then
  echo "QWEN_API_KEY 已設定"
else
  echo "提示: QWEN_API_KEY 尚未設定"
fi

# 檢查並設定 Claude Code 環境變數
echo "檢查 Claude Code 環境設定..."
if [ -n "$ANTHROPIC_AUTH_TOKEN" ]; then
  echo "ANTHROPIC_AUTH_TOKEN 已設定"
else
  echo "提示: ANTHROPIC_AUTH_TOKEN 尚未設定"
fi

# 檢查並設定 Gemini 環境變數
echo "檢查 Gemini 環境設定..."
if [ -n "$GEMINI_API_KEY" ]; then
  echo "GEMINI_API_KEY 已設定"
else
  echo "提示: GEMINI_API_KEY 尚未設定"
fi

# 顯示環境資訊
echo "========================================"
echo "  Development Environment Ready"
echo "========================================"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Python version: $(python3 --version)"
echo "Git version: $(git --version)"
echo "GitHub CLI version: $(gh --version | head -n 1)"
echo "Claude Code version: $(claude --version 2>/dev/null || echo 'Claude Code installed')"
echo "========================================"
echo ""
echo "環境變數："
echo "- QWEN_API_KEY: ${QWEN_API_KEY:-未設定}"
echo "- QWEN_BASE_URL: ${QWEN_BASE_URL:-未設定}"
echo "- QWEN_MODEL: ${QWEN_MODEL:-未設定}"
echo ""
echo "- ANTHROPIC_AUTH_TOKEN: ${ANTHROPIC_AUTH_TOKEN:-未設定}"
echo "- ANTHROPIC_BASE_URL: ${ANTHROPIC_BASE_URL:-未設定}"
echo "- ANTHROPIC_MODEL: ${ANTHROPIC_MODEL:-未設定}"
echo "- ANTHROPIC_SMALL_FAST_MODEL: ${ANTHROPIC_SMALL_FAST_MODEL:-未設定}"
echo ""
echo "- GEMINI_API_KEY: ${GEMINI_API_KEY:-未設定}"
echo "- GEMINI_BASE_URL: ${GEMINI_BASE_URL:-未設定}"
echo "- GEMINI_MODEL: ${GEMINI_MODEL:-未設定}"
echo ""
echo "MCP 伺服器："
if [ -f /home/flexy/.mcp.json ]; then
  echo "- MCP 設定檔案已建立"
  echo "- 可用伺服器: $(cat /home/flexy/.mcp.json | grep '"type"' | wc -l) 個"
else
  echo "- MCP 設定檔案不存在"
fi
echo ""
echo "Ready to start developing!"
echo ""
echo "常用指令："
echo "- qwen               # 啟動 Qwen Code"
echo "- qwen -p 'task'     # 執行一次性任務"
echo "- claude             # 啟動 Claude Code"
echo "- claude 'task'      # 執行一次性任務"
echo "- claude commit      # 建立 Git 提交訊息"
echo "- claude mcp list    # 列出 MCP 伺服器"
echo "- gemini             # 啟動 Gemini CLI"
echo "- gemini -p 'task'   # 執行一次性任務"
echo "- node               # Node.js"
echo "- npm                # Node Package Manager"
echo "- python3            # Python 3"
echo "- pip3               # Python Package Installer"
echo "- git                # Git 版本控制"
echo "- gh                 # GitHub CLI"
echo ""
echo "安裝自訂應用程式："
echo "- 要安裝系統套件，使用：sudo apt install <package-name>"
echo "- 要安裝 Python 套件，使用：pip3 install <package-name> 或 pip3 install --user <package-name>"
echo "- 要安裝 Node.js 套件，使用：npm install -g <package-name> 或 npm install <package-name>"
echo ""
echo "注意：預設 flexy 使用者密碼為 'dockerSandbox'，可以在需要時使用 sudo 執行管理員權限命令"
echo ""

# 儲存當前工作目錄（用於 CoSpec AI 和 ttyd）
WORK_DIR=$(pwd)
DEFAULT_WORKSPACE_DIR=/home/flexy/workspace

# 啟動 SSH 服務
echo "========================================"
echo "  啟動 SSH 服務"
echo "========================================"
sudo /usr/sbin/sshd
echo "SSH 服務已啟動"
echo ""

# 啟動 CoSpec AI Markdown Editor（始終在後台啟動）
echo "========================================"
echo "  啟動 CoSpec AI Markdown Editor"
echo "========================================"
echo "Markdown Editor 將在以下位置啟動："
echo "- 服務: http://localhost:${COSPEC_PORT:-9280}"
echo "- Markdown 目錄: ${MARKDOWN_DIR:-$DEFAULT_WORKSPACE_DIR}"
echo ""

# 確保 markdown 目錄存在（預設使用當前工作目錄）
mkdir -p ${MARKDOWN_DIR:-$DEFAULT_WORKSPACE_DIR}

# 在後台啟動 CoSpec AI unified server
npx cospec-ai --port ${COSPEC_PORT:-9280} --markdown-dir ${MARKDOWN_DIR:-$DEFAULT_WORKSPACE_DIR} > /home/flexy/cospec.log 2>&1 &
COSPEC_PID=$!
echo "CoSpec AI 已啟動 (PID: $COSPEC_PID)"
echo ""

# 檢查是否啟用 WebTTY 模式
# 如果設定了 ENABLE_WEBTTY=true 環境變數，則啟動 ttyd + tmux
if [ "$ENABLE_WEBTTY" = "true" ]; then
  echo "========================================"
  echo "  啟動 WebTTY 模式 (多會話支援)"
  echo "========================================"
  echo "WebTTY 將在 http://localhost:9681 啟動"
  echo "工作目錄: $(pwd)"

  # 啟動 AI 會話監控器 (handles session creation and management)
  echo "啟動 AI 會話監控器..."
  echo "AI 會話監控器將建立以下 tmux 窗口順序:"
  echo "- window:0 QWEN CLI"
  echo "- window:1 Claude Code"
  echo "- window:2 Gemini CLI"
  echo "- window:3 User"
  node /usr/local/bin/ai-session-monitor.js > /home/flexy/ai-monitor.log 2>&1 &
  AI_MONITOR_PID=$!
  echo "AI 會話監控器已啟動 (PID: $AI_MONITOR_PID)"

  # 處理停止信號，同時關閉 CoSpec AI、AI 監控器和 ttyd
  trap "kill $COSPEC_PID $AI_MONITOR_PID 2>/dev/null; exit" SIGINT SIGTERM

  # Wait briefly for the monitor to initialize the session
  sleep 2

  # Start ttyd with the tmux session
  # The JavaScript monitor handles all session management
  LANG=zh_TW.UTF-8 LC_ALL=zh_TW.UTF-8 ttyd -p 9681 tmux new -A -s shared_session
else
  # 預設模式：啟動 bash shell，但保持 CoSpec AI 在後台運行
  trap "kill $COSPEC_PID; exit" SIGINT SIGTERM
  exec "$@"
fi