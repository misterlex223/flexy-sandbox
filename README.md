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
- `dev-environment-docker/` - (空目錄，可用於特定用途)

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

您可以根據需要修改 `/home/flexy/.mcp.json` 檔案來添加更多 MCP 伺服器。

## 自訂映像

您可以修改 Dockerfile 來添加更多工具或變更設定：

```dockerfile
# 在安裝 Claude Code 後添加自訂工具
RUN sudo apt-get update && sudo apt-get install -y \
    your-additional-tools
```