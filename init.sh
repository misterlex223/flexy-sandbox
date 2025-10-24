#!/bin/bash

# 初始化開發環境腳本

# 設定支援中文的 locale
export LANG=zh_TW.UTF-8
export LC_ALL=zh_TW.UTF-8

# 建立常用目錄
mkdir -p /home/flexy/projects
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

# 檢查並設定 Claude Code 環境變數
echo "檢查 Claude Code 環境設定..."
if [ -n "$ANTHROPIC_AUTH_TOKEN" ]; then
  echo "ANTHROPIC_AUTH_TOKEN 已設定"
else
  echo "警告: ANTHROPIC_AUTH_TOKEN 尚未設定"
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
echo "- ANTHROPIC_AUTH_TOKEN: ${ANTHROPIC_AUTH_TOKEN:-未設定}"
echo "- ANTHROPIC_BASE_URL: ${ANTHROPIC_BASE_URL:-未設定}"
echo "- ANTHROPIC_MODEL: ${ANTHROPIC_MODEL:-未設定}"
echo "- ANTHROPIC_SMALL_FAST_MODEL: ${ANTHROPIC_SMALL_FAST_MODEL:-未設定}"
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
echo "- claude             # 啟動 Claude Code"
echo "- claude 'task'      # 執行一次性任務"
echo "- claude commit      # 建立 Git 提交訊息"
echo "- claude mcp list    # 列出 MCP 伺服器"
echo "- node               # Node.js"
echo "- npm                # Node Package Manager"
echo "- python3            # Python 3"
echo "- pip3               # Python Package Installer"
echo "- git                # Git 版本控制"
echo "- gh                 # GitHub CLI"
echo ""

# 儲存當前工作目錄（用於 CoSpec AI 和 ttyd）
WORK_DIR=$(pwd)

# 啟動 CoSpec AI Markdown Editor（始終在後台啟動）
echo "========================================"
echo "  啟動 CoSpec AI Markdown Editor"
echo "========================================"
echo "Markdown Editor 將在以下位置啟動："
echo "- 前端: http://localhost:${COSPEC_PORT:-9280}"
echo "- API:  http://localhost:${COSPEC_API_PORT:-9281}"
echo "- Markdown 目錄: ${MARKDOWN_DIR:-$WORK_DIR}"
echo ""

# 確保 markdown 目錄存在（預設使用當前工作目錄）
mkdir -p ${MARKDOWN_DIR:-$WORK_DIR}

# 在後台啟動 CoSpec AI 服務器
cd /cospec-ai/server
PORT=${COSPEC_API_PORT:-9281} MARKDOWN_DIR=${MARKDOWN_DIR:-$WORK_DIR} node index.js > /home/flexy/cospec-api.log 2>&1 &
COSPEC_API_PID=$!
echo "CoSpec API 已啟動 (PID: $COSPEC_API_PID)"

# 在後台啟動 CoSpec AI 前端
cd /cospec-ai/app-react
npx serve -s dist -l ${COSPEC_PORT:-9280} > /home/flexy/cospec-frontend.log 2>&1 &
COSPEC_FRONTEND_PID=$!
echo "CoSpec Frontend 已啟動 (PID: $COSPEC_FRONTEND_PID)"
echo ""

# 回到原始工作目錄
cd "$WORK_DIR"

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
  node /usr/local/bin/ai-session-monitor.js > /home/flexy/ai-monitor.log 2>&1 &
  AI_MONITOR_PID=$!
  echo "AI 會話監控器已啟動 (PID: $AI_MONITOR_PID)"

  # 處理停止信號，同時關閉 CoSpec AI、AI 監控器和 ttyd
  trap "kill $COSPEC_API_PID $COSPEC_FRONTEND_PID $AI_MONITOR_PID 2>/dev/null; exit" SIGINT SIGTERM

  # Wait briefly for the monitor to initialize the session
  sleep 2

  # Start ttyd with the tmux session
  # The JavaScript monitor handles all session management
  LANG=zh_TW.UTF-8 LC_ALL=zh_TW.UTF-8 ttyd -p 9681 -W tmux new -A -s shared_session
else
  # 預設模式：啟動 bash shell，但保持 CoSpec AI 在後台運行
  trap "kill $COSPEC_API_PID $COSPEC_FRONTEND_PID; exit" SIGINT SIGTERM
  exec "$@"
fi