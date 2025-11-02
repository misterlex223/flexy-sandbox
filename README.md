# 開發環境 Docker 映像

這是一個功能強大的 Docker 開發環境，支援**動態配置多種 AI 工具**，讓你在單一容器中同時使用多個 AI 助手。

## ✨ 核心特性

### 🤖 動態 AI 工具配置
- **前 5 個 tmux windows 完全可自訂**: 根據需求配置不同的 AI 工具
- **支援 4 種 AI 工具**: Qwen Code、Claude Code、Gemini CLI、OpenAI Codex
- **按需安裝**: AI 工具在容器啟動時動態安裝，無需重新建置映像
- **靈活組合**: 可以只配置需要的 AI 工具，未配置的 windows 顯示 bash shell

### 🛠️ 完整開發工具鏈
- Ubuntu 22.04 LTS
- Node.js (最新 LTS 版本)
- Python 3
- Git 和 GitHub CLI (gh)
- ttyd + tmux (網頁終端和會話管理)
- CoSpec AI (Markdown 編輯器，port 9280)

## 目錄結構

- `Dockerfile` - Docker 映像建置檔案
- `init.sh` - 容器啟動時的初始化腳本
- `README.md` - 此說明文件
- `claude-config/` - Claude Code 設定檔案目錄
- `scripts/` - 工具腳本目錄
  - `build-docker.sh` - Docker 映像建置腳本

## 建置映像

### 方法 1: 使用 Docker 指令直接建置

```bash
# 克隆或下載這個專案
git clone <repository-url>
cd <project-directory>

# 建置 Docker 映像
docker build -t flexy-dev-sandbox .
```

### 方法 2: 使用建置腳本

```bash
# 克隆或下載這個專案
git clone <repository-url>
cd <project-directory>

# 使用建置腳本
./scripts/build-docker.sh
```

## 使用映像

### 快速開始

#### 方式 1: 配置單一 AI 工具

```bash
# 使用 Claude Code
docker run -it --rm \
  -e ENABLE_WEBTTY=true \
  -e AI_WINDOW_0_TYPE=claude \
  -e AI_WINDOW_0_API_KEY=your_claude_api_key \
  -p 9681:9681 -p 9280:9280 \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox

# 然後在瀏覽器中開啟:
# - http://localhost:9681 - Web Terminal (ttyd + tmux)
# - http://localhost:9280 - CoSpec AI Markdown Editor
```

#### 方式 2: 配置多個 AI 工具

```bash
# 同時使用 Qwen、Claude 和 Gemini
docker run -it --rm \
  -e ENABLE_WEBTTY=true \
  -e AI_WINDOW_0_TYPE=qwen \
  -e AI_WINDOW_0_API_KEY=your_qwen_api_key \
  -e AI_WINDOW_1_TYPE=claude \
  -e AI_WINDOW_1_API_KEY=your_claude_api_key \
  -e AI_WINDOW_2_TYPE=gemini \
  -e AI_WINDOW_2_API_KEY=your_gemini_api_key \
  -p 9681:9681 -p 9280:9280 \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox
```

**tmux Windows 配置**:
- Window 0: Qwen CLI
- Window 1: Claude Code
- Window 2: Gemini CLI
- Window 3-4: bash shell (未配置)
- Window 5: user terminal (固定)

### AI 工具配置說明

**環境變數格式**:
```bash
AI_WINDOW_<N>_TYPE=<qwen|claude|gemini|codex>  # AI 工具類型（必填）
AI_WINDOW_<N>_API_KEY=<your-api-key>            # API 金鑰（必填）
AI_WINDOW_<N>_MODEL=<model-name>                # 模型名稱（可選）
AI_WINDOW_<N>_BASE_URL=<api-base-url>           # API Base URL（可選）
```

其中 `<N>` 可以是 0, 1, 2, 3, 4（前 5 個 windows 可自訂）。

**特點**:
- ✅ AI 工具在容器啟動時按需安裝，無需預先建置
- ✅ 靈活配置：可以只配置需要的 AI 工具
- ✅ 未配置的 windows 自動顯示 bash shell
- ✅ Window 5 固定為使用者終端

### 進階使用範例

#### 自訂 Window 配置

```bash
# 只在特定 windows 配置 AI 工具
docker run -it --rm \
  -e ENABLE_WEBTTY=true \
  -e AI_WINDOW_1_TYPE=claude \
  -e AI_WINDOW_1_API_KEY=your_key \
  -e AI_WINDOW_3_TYPE=qwen \
  -e AI_WINDOW_3_API_KEY=your_key \
  -p 9681:9681 \
  flexy-dev-sandbox

# Window 配置結果:
# - Window 0: bash shell (未配置)
# - Window 1: Claude Code
# - Window 2: bash shell (未配置)
# - Window 3: Qwen CLI
# - Window 4: bash shell (未配置)
# - Window 5: user terminal (固定)
```

#### 使用自訂模型

```bash
docker run -it --rm \
  -e ENABLE_WEBTTY=true \
  -e AI_WINDOW_0_TYPE=qwen \
  -e AI_WINDOW_0_API_KEY=your_key \
  -e AI_WINDOW_0_MODEL=qwen-max \
  -e AI_WINDOW_0_BASE_URL=https://dashscope.aliyuncs.com/api/v1 \
  -p 9681:9681 \
  flexy-dev-sandbox
```

### 互動式模式（無 WebTTY）

```bash
# 啟動互動式容器（預設不啟用 WebTTY）
docker run -it --rm flexy-dev-sandbox

# 掛載本地目錄
docker run -it --rm -v $(pwd):/home/flexy/workspace flexy-dev-sandbox
```

## 容器內可用工具

### AI 工具（根據配置安裝）
- `qwen` - Qwen Code CLI（如果已配置）
- `claude` - Claude Code CLI（如果已配置）
- `gemini` - Gemini CLI（如果已配置）
- `codex` - OpenAI Codex CLI（如果已配置）

### 開發工具（預裝）
- `node` - Node.js
- `npm` - Node Package Manager
- `python3` - Python 3
- `pip3` - Python Package Installer
- `git` - Git 版本控制
- `gh` - GitHub CLI

## 環境變數

### AI 工具配置環境變數（新版）
每個 window（0-4）可獨立配置：
- `AI_WINDOW_<N>_TYPE` - AI 工具類型（qwen|claude|gemini|codex）
- `AI_WINDOW_<N>_API_KEY` - API 金鑰
- `AI_WINDOW_<N>_MODEL` - 模型名稱（可選）
- `AI_WINDOW_<N>_BASE_URL` - API Base URL（可選）

### 其他環境變數
- `ENABLE_WEBTTY` - 啟用 WebTTY 模式（預設: false）
- `AI_SESSION_MODE` - AI CLI 啟動模式（interactive|on-demand，預設: interactive）
- `WORKING_DIRECTORY` - 容器的預設工作目錄（預設: /home/flexy/workspace）
- `COSPEC_PORT` - CoSpec AI 前端端口（預設: 9280）
- `MARKDOWN_DIR` - CoSpec AI Markdown 文件目錄

### Claude Code 配置生成環境變數
- `CLAUDE_LANGUAGE` - Claude 輸出語言
- `CLAUDE_NOTIFICATION_ENABLED` - 啟用任務完成通知
- `CLAUDE_NOTIFICATION_CHANNEL` - 通知頻道（預設: line）

### Node.js 和 Python 環境變數
- `NODE_PATH` - Node.js 模組路徑
- `PYTHONDONTWRITEBYTECODE` - 防止 Python 寫入 .pyc 檔案
- `PYTHONUNBUFFERED` - 防止 Python 輸出緩衝

## 工作目錄配置

Flexy 開發環境現在支援可配置的預設工作目錄：

### 預設工作目錄
- 預設工作目錄為 `/home/flexy/workspace`
- 容器啟動後，終端會自動切換到這個目錄
- CoSpec AI Markdown 編輯器也預設使用此目錄

### 自訂工作目錄
您可以在啟動容器時設定 `WORKING_DIRECTORY` 環境變數來自訂工作目錄：

```bash
# 使用自訂工作目錄
docker run -it --rm \
  -e WORKING_DIRECTORY=/home/flexy/my-custom-workspace \
  flexy-dev-sandbox

# 與其他環境變數一起使用
docker run -it --rm \
  -e WORKING_DIRECTORY=/home/flexy/my-project \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  -v $(pwd):/home/flexy/my-project \
  flexy-dev-sandbox
```

當使用 `create-flexy-sandbox.sh` 腳本時，您也可以指定工作目錄：
```bash
# 使用互動模式
./scripts/create-flexy-sandbox.sh

# 使用命令列參數
./scripts/create-flexy-sandbox.sh --workspace-path /home/flexy/my-project
```

## Claude Code 配置持久化

Flexy Sandbox 支援靈活的 Claude Code 配置管理，允許您在容器重啟後保留配置，或在多個容器間共享相同的配置。

### 配置架構

Claude Code 配置文件存放在以下位置：

1. **使用者級配置** (推薦): `/home/flexy/.claude/`
   - `CLAUDE.md` - Claude 行為和偏好設定
   - `.mcp.json` - MCP 伺服器配置

2. **專案級配置** (最高優先級): `/home/flexy/workspace/.claude/`
   - 如果專案目錄包含 `.claude/` 子目錄，將覆蓋使用者級配置
   - 適合團隊協作，配置可納入 Git 版本控制

### 配置持久化方案

#### 方案 A: 全域配置掛載（推薦用於個人使用）

在主機上維護一份配置，所有 Flexy 容器共享：

```bash
# 在主機上建立配置目錄
mkdir -p ~/.flexy-claude-config

# 啟動容器時掛載配置目錄
docker run -it --rm \
  -v $(pwd):/home/flexy/workspace \
  -v ~/.flexy-claude-config:/home/flexy/.claude \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  flexy-dev-sandbox
```

**優點：**
- 所有 Flexy 容器共享相同配置
- 配置與專案解耦，方便管理
- 適合個人多專案使用

**使用 create-flexy-sandbox.sh 腳本：**
```bash
# 互動模式會詢問 Claude 配置目錄
./scripts/create-flexy-sandbox.sh

# 或使用命令列參數
./scripts/create-flexy-sandbox.sh \
  --claude-config ~/.flexy-claude-config \
  --anthropic-token your_token
```

#### 方案 B: 專案級配置（推薦用於團隊協作）

將配置放在專案目錄中，跟隨 Git 倉庫：

```bash
# 在專案目錄建立 .claude/ 子目錄
cd my-project
mkdir -p .claude

# 建立專案特定的 CLAUDE.md 和 .mcp.json
# (編輯這些文件以自訂專案配置)

# 啟動容器，自動使用專案配置
docker run -it --rm \
  -v $(pwd):/home/flexy/workspace \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  flexy-dev-sandbox
```

**優點：**
- 配置跟隨專案，團隊成員共享
- 可納入版本控制，追蹤配置變更
- 適合團隊協作開發

#### 方案 C: 環境變數動態配置（推薦用於 Kai 整合）

不掛載配置文件，透過環境變數動態生成：

```bash
docker run -it --rm \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  -e CLAUDE_LANGUAGE=zh_TW \
  -e CLAUDE_NOTIFICATION_ENABLED=true \
  -e CLAUDE_NOTIFICATION_CHANNEL=line \
  flexy-dev-sandbox
```

**可用環境變數：**
- `CLAUDE_LANGUAGE` - Claude 輸出語言（預設: 繁體中文）
- `CLAUDE_NOTIFICATION_ENABLED` - 是否啟用任務完成通知（預設: true）
- `CLAUDE_NOTIFICATION_CHANNEL` - 通知頻道（預設: line）

**優點：**
- 無需預先建立配置文件
- 適合自動化部署和編排工具（如 Kai）
- 配置參數化，易於管理

### 配置優先級

Claude Code 讀取配置的順序（從高到低）：

1. **專案級配置**: `/home/flexy/workspace/.claude/CLAUDE.md`
2. **使用者級配置**: `/home/flexy/.claude/CLAUDE.md`
3. **環境變數生成**: 如果前兩者都不存在，從環境變數生成

### MCP 配置合併

為確保預設 MCP 伺服器（github, kai-notify）始終可用，Flexy Sandbox 會自動合併：

- **預設 MCP 伺服器**: 容器內建的基本伺服器
- **使用者自訂伺服器**: 您添加的額外伺服器

合併策略：
- 如果使用者配置中有同名伺服器，使用使用者版本
- 預設伺服器會自動添加到使用者配置中
- 使用 `jq` 工具進行 JSON 合併

### 配置診斷

容器啟動時會顯示配置診斷資訊：

```
========================================
  Claude Code 配置診斷
========================================
配置文件檢查：
✓ 使用者級 CLAUDE.md: /home/flexy/.claude/CLAUDE.md
  來源: 預設模板或使用者掛載
✓ 使用者級 MCP 配置: /home/flexy/.claude/.mcp.json
  已配置 MCP 伺服器：
    - github
    - kai-notify

配置優先級：
1. 專案級: /home/flexy/workspace/.claude/ (最高優先級)
2. 使用者級: /home/flexy/.claude/ (預設)
3. 環境變數: CLAUDE_* 變數 (用於動態生成)
```

### 範例：團隊協作配置

**專案 `.claude/CLAUDE.md` 範例：**
```markdown
# 專案 Claude 配置

## 使用者介面
1. 一律以繁體中文輸出

## 編碼規範
1. 使用 TypeScript strict 模式
2. 遵循 ESLint 配置
3. 所有 API 必須包含 JSDoc 註解

## 提交規範
1. 提交訊息使用 Conventional Commits 格式
2. 包含 JIRA ticket 編號
```

**專案 `.claude/.mcp.json` 範例：**
```json
{
  "mcp": {
    "servers": {
      "project-database": {
        "type": "stdio",
        "command": "npx",
        "args": ["@myorg/db-mcp-server"]
      }
    }
  }
}
```

將這些文件納入 Git：
```bash
git add .claude/
git commit -m "chore: add Claude configuration for team"
```

## 目錄結構

- `/home/flexy` - 使用者家目錄
- `/home/flexy/workspace` - 掛載專案的推薦目錄
- `/home/flexy/.claude/` - Claude Code 配置目錄
  - `CLAUDE.md` - Claude 全域設定檔案
  - `.mcp.json` - MCP 伺服器配置
- `/home/flexy/workspace/.claude/` - 專案級 Claude 配置（優先級最高）

## 使用 Claude Code

在容器內，您可以使用 Claude Code 來協助開發：

```bash
# 啟動互動式 Claude Code
claude

# 執行一次性任務
claude "幫我建立一個 Python Flask 應用"

# 建立 Git 提交訊息
claude commit

# 管理 MCP 伺服器
claude mcp list
claude mcp add server_name
claude mcp remove server_name
```

### MCP 伺服器設定

預設 MCP 設定包含以下伺服器：
- GitHub CLI MCP 伺服器
- kai-notify MCP 伺服器

您可以根據需要修改 `/home/flexy/.mcp.json` 檔案來添加更多 MCP 伺服器。

### kai-notify 配置

kai-notify 是一個多頻道通知系統，支持 Slack 和 LINE。要使用它，您需要創建一個 `.kai-notify.json` 配置文件：

```json
{
  "channels": {
    "slack": {
      "enabled": true,
      "botToken": "xoxb-your-token",
      "webhookUrl": "https://hooks.slack.com/services/your/webhook",
      "defaultChannel": "#general"
    },
    "line": {
      "enabled": true,
      "channelAccessToken": "your-channel-access-token",
      "channelSecret": "your-channel-secret",
      "defaultUserId": "user-id-to-send-to"
    }
  }
}
```

配置文件可以放在以下位置之一：
1. `.kai-notify.json` 在當前工作目錄中
2. `~/.kai/notify.json` 在使用者的家目錄中
3. `config/config.json` 在專案目錄中（後備選項）

要發送通知，您可以使用 Claude Code 的 sendNotification 工具：

```bash
# 發送通知到所有啟用的頻道
claude "使用 sendNotification 工具發送'任務完成'通知"

# 或者直接使用 kai-notify CLI
kai-notify --cli notify --message "Hello World" --title "Notification"
```

## 自訂映像

您可以修改 Dockerfile 來添加更多工具或變更設定：

```dockerfile
# 在安裝 Claude Code 後添加自訂工具
RUN sudo apt-get update && sudo apt-get install -y \
    your-additional-tools
```
