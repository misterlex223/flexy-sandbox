#!/bin/bash

# 初始化開發環境腳本

# 建立常用目錄
mkdir -p /home/flexy/projects
mkdir -p /home/flexy/.config

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

# 啟動 CoSpec AI Markdown Editor（始終在後台啟動）
echo "========================================"
echo "  啟動 CoSpec AI Markdown Editor"
echo "========================================"
echo "Markdown Editor 將在以下位置啟動："
echo "- 前端: http://localhost:${COSPEC_PORT:-8080}"
echo "- API:  http://localhost:${COSPEC_API_PORT:-8081}"
echo "- Markdown 目錄: ${MARKDOWN_DIR:-/home/flexy/markdown}"
echo ""

# 確保 markdown 目錄存在
mkdir -p ${MARKDOWN_DIR:-/home/flexy/markdown}

# 在後台啟動 CoSpec AI 服務器
cd /cospec-ai/server
PORT=${COSPEC_API_PORT:-8081} MARKDOWN_DIR=${MARKDOWN_DIR:-/home/flexy/markdown} node index.js > /home/flexy/cospec-api.log 2>&1 &
COSPEC_API_PID=$!
echo "CoSpec API 已啟動 (PID: $COSPEC_API_PID)"

# 在後台啟動 CoSpec AI 前端
cd /cospec-ai/app-react
npx serve -s dist -l ${COSPEC_PORT:-8080} > /home/flexy/cospec-frontend.log 2>&1 &
COSPEC_FRONTEND_PID=$!
echo "CoSpec Frontend 已啟動 (PID: $COSPEC_FRONTEND_PID)"
echo ""

# 檢查是否啟用 WebTTY 模式
# 如果設定了 ENABLE_WEBTTY=true 環境變數，則啟動 ttyd + tmux
if [ "$ENABLE_WEBTTY" = "true" ]; then
  echo "========================================"
  echo "  啟動 WebTTY 模式"
  echo "========================================"
  echo "WebTTY 將在 http://localhost:7681 啟動"
  echo "所有客戶端將共享同一個 tmux 會話"
  echo ""

  # 處理停止信號，同時關閉 CoSpec AI 和 ttyd
  trap "kill $COSPEC_API_PID $COSPEC_FRONTEND_PID; exit" SIGINT SIGTERM

  # 使用 ttyd 啟動共享的 tmux 會話
  # -p 7681: 監聽 7681 埠
  # tmux new -A -s shared_session: 建立或附加到名為 shared_session 的會話
  exec ttyd -p 7681 tmux new -A -s shared_session
else
  # 預設模式：啟動 bash shell，但保持 CoSpec AI 在後台運行
  trap "kill $COSPEC_API_PID $COSPEC_FRONTEND_PID; exit" SIGINT SIGTERM
  exec "$@"
fi