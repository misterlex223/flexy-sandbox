#!/bin/bash

# 初始化開發環境腳本

# 設定支援中文的 locale
export LANG=zh_TW.UTF-8
export LC_ALL=zh_TW.UTF-8

# 建立常用目錄
mkdir -p /home/flexy/.config

# 安裝 AI 工具（根據環境變數動態安裝）
echo "========================================"
echo "  安裝 AI 工具"
echo "========================================"
/scripts/install-ai-tools.sh || {
  echo "⚠ AI 工具安裝失敗，但繼續啟動容器"
}
echo ""

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

# 初始化 Claude Code 配置
# 策略：檢查個別文件是否存在，支援部分配置掛載
echo "Initializing Claude Code configuration..."

# 確保 .claude 目錄存在
mkdir -p /home/flexy/.claude

# 1. 處理 CLAUDE.md 配置
if [ ! -f /home/flexy/.claude/CLAUDE.md ]; then
  # 如果設定了環境變數，從環境變數生成配置（Kai 模式）
  if [ -n "$CLAUDE_LANGUAGE" ] || [ -n "$CLAUDE_NOTIFICATION_ENABLED" ]; then
    echo "從環境變數生成 CLAUDE.md 配置..."
    cat > /home/flexy/.claude/CLAUDE.md << EOF
# Claude Code 設定檔案

## 使用者介面
1. 一律以${CLAUDE_LANGUAGE:-繁體中文}輸出

## 通用原則
EOF

    if [ "${CLAUDE_NOTIFICATION_ENABLED:-true}" = "true" ]; then
      cat >> /home/flexy/.claude/CLAUDE.md << EOF
1. 當你完成一個複雜或多步驟的任務時（auto-accept mode），請使用 /sendNotification 工具發送完成通知。
2. 使用方式：/sendNotification --channel=${CLAUDE_NOTIFICATION_CHANNEL:-line} --message "任務完成: [具體完成的任務內容]"
EOF
    fi
    echo "✓ 已從環境變數生成 CLAUDE.md"
  # 否則複製預設配置模板
  elif [ -f /home/flexy/CLAUDE.md ]; then
    cp /home/flexy/CLAUDE.md /home/flexy/.claude/CLAUDE.md
    echo "✓ 已複製預設 CLAUDE.md 配置"
  else
    echo "⚠ 警告: CLAUDE.md 配置模板不存在"
  fi
else
  echo "✓ 使用現有 CLAUDE.md 配置"
fi

# 2. 處理 MCP 配置（智慧合併）
if [ ! -f /home/flexy/.claude/.mcp.json ]; then
  # 使用者配置不存在，複製預設配置
  if [ -f /home/flexy/default-mcp.json ]; then
    cp /home/flexy/default-mcp.json /home/flexy/.claude/.mcp.json
    echo "✓ 已複製預設 MCP 配置"
  else
    echo "⚠ 警告: MCP 配置模板不存在"
  fi
else
  # 使用者配置存在，嘗試合併以確保預設伺服器可用
  if [ -f /home/flexy/default-mcp.json ] && [ -f /scripts/merge-mcp-config.sh ]; then
    echo "正在合併 MCP 配置（預設 + 使用者）..."
    # 備份使用者配置
    cp /home/flexy/.claude/.mcp.json /home/flexy/.claude/.mcp.json.backup
    # 執行合併
    /scripts/merge-mcp-config.sh \
      /home/flexy/default-mcp.json \
      /home/flexy/.claude/.mcp.json.backup \
      /home/flexy/.claude/.mcp.json || {
        echo "⚠ MCP 配置合併失敗，保留使用者配置"
        mv /home/flexy/.claude/.mcp.json.backup /home/flexy/.claude/.mcp.json
      }
  else
    echo "✓ 使用現有 MCP 配置（未合併）"
  fi
fi

# 設定 Git 初始配置（如果尚未設定）
if [ ! -f /home/flexy/.gitconfig ]; then
  git config --global user.email "flexy@example.com"
  git config --global user.name "Flexy"
fi

# AI 工具環境變數檢查已整合到下方的「AI 工具配置」診斷中

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
echo "========================================"
echo "  AI 工具配置"
echo "========================================"
for i in {0..4}; do
  AI_TYPE_VAR="AI_WINDOW_${i}_TYPE"
  AI_TYPE="${!AI_TYPE_VAR}"

  if [ -n "$AI_TYPE" ]; then
    echo "Window $i: $AI_TYPE"
    API_KEY_VAR="AI_WINDOW_${i}_API_KEY"
    MODEL_VAR="AI_WINDOW_${i}_MODEL"
    BASE_URL_VAR="AI_WINDOW_${i}_BASE_URL"
    echo "  - API Key: ${!API_KEY_VAR:+已設定}"
    echo "  - Model: ${!MODEL_VAR:-預設}"
    echo "  - Base URL: ${!BASE_URL_VAR:-預設}"
  else
    echo "Window $i: bash shell (未配置 AI 工具)"
  fi
done
echo "Window 5: user terminal (固定)"
echo ""
echo "========================================"
echo "  Claude Code 配置診斷"
echo "========================================"

# 檢查配置文件位置和來源
echo "配置文件檢查："

# CLAUDE.md 檢查
if [ -f /home/flexy/.claude/CLAUDE.md ]; then
  echo "✓ 使用者級 CLAUDE.md: /home/flexy/.claude/CLAUDE.md"
  # 檢查是否為環境變數生成
  if [ -n "$CLAUDE_LANGUAGE" ] || [ -n "$CLAUDE_NOTIFICATION_ENABLED" ]; then
    echo "  來源: 環境變數生成"
  else
    echo "  來源: 預設模板或使用者掛載"
  fi
else
  echo "✗ 使用者級 CLAUDE.md 不存在"
fi

# 專案級 CLAUDE.md 檢查
if [ -f /home/flexy/workspace/.claude/CLAUDE.md ]; then
  echo "⚠ 專案級 CLAUDE.md 存在（將覆蓋使用者級配置）"
  echo "  路徑: /home/flexy/workspace/.claude/CLAUDE.md"
fi

# MCP 配置檢查
if [ -f /home/flexy/.claude/.mcp.json ]; then
  echo "✓ 使用者級 MCP 配置: /home/flexy/.claude/.mcp.json"
  # 顯示已配置的 MCP 伺服器
  if command -v jq &> /dev/null; then
    echo "  已配置 MCP 伺服器："
    jq -r '.mcp.servers | keys[]' /home/flexy/.claude/.mcp.json 2>/dev/null | sed 's/^/    - /' || echo "    (無法解析 JSON)"
  else
    echo "  MCP 伺服器數量: $(grep -o '"type"' /home/flexy/.claude/.mcp.json 2>/dev/null | wc -l | tr -d ' ')"
  fi
else
  echo "✗ 使用者級 MCP 配置不存在"
fi

echo ""
echo "配置優先級："
echo "1. 專案級: /home/flexy/workspace/.claude/ (最高優先級)"
echo "2. 使用者級: /home/flexy/.claude/ (預設)"
echo "3. 環境變數: CLAUDE_* 變數 (用於動態生成)"
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

# Use the working directory environment variable
WORKING_DIRECTORY=${WORKING_DIRECTORY:-/home/flexy/workspace}

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
echo "- Markdown 目錄: ${MARKDOWN_DIR:-$WORKING_DIRECTORY}"
echo ""

# 確保 markdown 目錄存在（預設使用 working directory）
mkdir -p ${MARKDOWN_DIR:-$WORKING_DIRECTORY}

# 在後台啟動 CoSpec AI unified server
npx cospec-ai --port ${COSPEC_PORT:-9280} --markdown-dir ${MARKDOWN_DIR:-$WORKING_DIRECTORY} > /home/flexy/cospec.log 2>&1 &
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
  echo "工作目錄: $WORKING_DIRECTORY"

  # 切換到工作目錄
  cd "$WORKING_DIRECTORY" || {
    echo "警告: 無法切換到工作目錄 $WORKING_DIRECTORY，使用當前目錄"
    cd /home/flexy/workspace
  }

  # 啟動 AI 會話監控器 (handles session creation and management)
  echo "啟動 AI 會話監控器..."
  echo "AI 會話監控器將根據環境變數建立 tmux 窗口"
  echo "配置的 windows 將顯示對應的 AI 工具"
  echo "未配置的 windows 將顯示 bash shell"
  echo "Window 5 固定為使用者終端"
  node /usr/local/bin/ai-session-monitor.js > /home/flexy/ai-monitor.log 2>&1 &
  AI_MONITOR_PID=$!
  echo "AI 會話監控器已啟動 (PID: $AI_MONITOR_PID)"

  # 處理停止信號，同時關閉 CoSpec AI、AI 監控器和 ttyd
  trap "kill $COSPEC_PID $AI_MONITOR_PID 2>/dev/null; exit" SIGINT SIGTERM

  # Wait briefly for the monitor to initialize the session
  sleep 2

  # Start ttyd with the tmux session
  # The JavaScript monitor handles all session management
  # -W flag allows write access
  # -t flag sets terminal type to xterm-256color for better compatibility
  LANG=zh_TW.UTF-8 LC_ALL=zh_TW.UTF-8 ttyd -p 9681 -W -t "xterm-256color" tmux new -A -s shared_session
else
  # 預設模式：切換到工作目錄並啟動 bash shell，但保持 CoSpec AI 在後台運行
  cd "$WORKING_DIRECTORY" || {
    echo "警告: 無法切換到工作目錄 $WORKING_DIRECTORY，使用當前目錄"
    cd /home/flexy/workspace
  }
  trap "kill $COSPEC_PID; exit" SIGINT SIGTERM
  exec "$@"
fi