# 開發環境 Docker 映像

這個 Docker 映像包含完整的開發環境，具備以下工具：

- Ubuntu 22.04 LTS
- Node.js (最新 LTS 版本)
- Python 3
- Git 和 GitHub CLI (gh)
- Claude Code

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

### 互動式使用

```bash
# 啟動互動式容器
docker run -it --rm flexy-dev-sandbox

# 掛載本地目錄到容器中
docker run -it --rm -v $(pwd):/home/flexy/projects flexy-dev-sandbox

# 設定 Claude Code 環境變數
docker run -it --rm \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  -e ANTHROPIC_BASE_URL=your_base_url \
  -e ANTHROPIC_MODEL=your_model \
  -e ANTHROPIC_SMALL_FAST_MODEL=your_small_model \
  flexy-dev-sandbox
```

### 使用 WebTTY 模式（網頁終端）

啟用 WebTTY 模式可以透過瀏覽器存取共享的終端會話：

```bash
# 啟動 WebTTY 模式
docker run -d --rm \
  -p 7681:7681 \
  -e ENABLE_WEBTTY=true \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  --name flexy-webtty \
  flexy-dev-sandbox

# 然後在瀏覽器中開啟 http://localhost:7681
```

**WebTTY 模式特點：**
- 所有連線的客戶端共享同一個 tmux 會話
- 多人可以同時查看和操作同一個終端
- 適合配對程式設計或遠端協作
- 會話持久化，斷線後重新連線可恢復

**停止 WebTTY 容器：**
```bash
docker stop flexy-webtty
```

### 執行一次性命令

```bash
# 執行 Claude Code 任務
docker run --rm flexy-dev-sandbox claude "幫我建立一個 Node.js Express 應用"

# 執行 Node.js 應用
docker run --rm -v $(pwd):/home/flexy/projects flexy-dev-sandbox node app.js

# 執行 Python 應用
docker run --rm -v $(pwd):/home/flexy/projects flexy-dev-sandbox python3 script.py
```

## 容器內可用工具

- `claude` - Claude Code CLI
- `node` - Node.js
- `npm` - Node Package Manager
- `python3` - Python 3
- `pip3` - Python Package Installer
- `git` - Git 版本控制
- `gh` - GitHub CLI

## 環境變數

### Node.js 環境變數
- `NODE_PATH` - Node.js 模組路徑

### Python 環境變數
- `PYTHONDONTWRITEBYTECODE` - 防止 Python 寫入 .pyc 檔案
- `PYTHONUNBUFFERED` - 防止 Python 輸出緩衝

### Claude Code 環境變數
- `ANTHROPIC_AUTH_TOKEN` - Claude API 認證令牌
- `ANTHROPIC_BASE_URL` - Claude API 基礎 URL
- `ANTHROPIC_MODEL` - Claude 模型名稱
- `ANTHROPIC_SMALL_FAST_MODEL` - Claude 小型快速模型名稱

## 目錄結構

- `/home/flexy` - 使用者家目錄
- `/home/flexy/projects` - 掛載專案的推薦目錄
- `/home/flexy/.mcp.json` - Claude Code MCP 設定檔案
- `/home/flexy/.claude/CLAUDE.md` - Claude Code 全域設定檔案

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
- Docker MCP 伺服器
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