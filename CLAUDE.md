# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 Docker 開發環境專案，用於建置包含完整開發工具鏈的容器映像。該映像提供了 Node.js、Python、Git/GitHub CLI 和 Claude Code 的完整環境，可用於快速啟動開發環境或作為 CI/CD 基礎映像。

### 核心工具
- **Ubuntu 22.04 LTS**: 基礎作業系統
- **Node.js (LTS)**: JavaScript 執行環境
- **Python 3**: Python 執行環境
- **Git + GitHub CLI (gh)**: 版本控制和 GitHub 整合
- **AI 工具（按需安裝）**:
  - Qwen Code (`@qwen-code/qwen-code`)
  - Claude Code (`@anthropic-ai/claude-code`)
  - Gemini CLI (`@google/gemini-cli`)
  - OpenAI Codex (`@openai/codex`)
- **ttyd + tmux**: 終端分享和持久化會話
- **kai-notify**: LINE 通知整合 (npm package)
- **CoSpec AI**: 整合的 Markdown 編輯器 (port 9280)

### 使用者介面
所有輸出應使用繁體中文。

## 專案架構

### 目錄結構
```
flexy-sandbox/
├── Dockerfile              # Docker 映像建置定義
├── init.sh                 # 容器啟動初始化腳本
├── README.md               # 專案說明文件
├── claude-config/          # Claude Code 配置目錄
│   ├── CLAUDE.md          # 容器內的 Claude 配置
│   └── .mcp.json          # MCP 伺服器配置
├── cospec-ai/              # CoSpec AI Markdown 編輯器 (submodule)
│   ├── server/            # 後端 API 服務
│   ├── app-react/         # React 前端應用
│   └── docker-entrypoint.sh
└── scripts/                # 工具腳本目錄
    └── build-docker.sh    # Docker 建置腳本
```

### 關鍵檔案說明

#### Dockerfile (Dockerfile:1-91)
多階段 Docker 映像建置：
1. 安裝基礎工具和套件管理器 (apt-get)
2. 建立非 root 使用者 `flexy`
3. 安裝 Node.js (使用 NodeSource LTS)
4. 安裝 Python 3 和相關工具
5. 安裝 GitHub CLI
6. 安裝 Claude Code 和 kai-notify (npm global)
7. 配置 MCP 伺服器
8. 設定環境變數和入口點

**重要環境變數**:

**AI 工具動態配置**:
- `AI_WINDOW_0_TYPE`: Window 0 的 AI 工具類型（qwen|claude|gemini|codex）
- `AI_WINDOW_0_API_KEY`: Window 0 的 API Key
- `AI_WINDOW_0_MODEL`: Window 0 的模型名稱（可選）
- `AI_WINDOW_0_BASE_URL`: Window 0 的 API Base URL（可選）
- `AI_WINDOW_1_TYPE` ~ `AI_WINDOW_4_TYPE`: Window 1-4 的配置（同上格式）

**其他環境變數**:
- `MARKDOWN_DIR`: CoSpec AI Markdown 文件目錄 (預設: 當前工作目錄，由 Docker WorkingDir 設定)
- `COSPEC_PORT`: CoSpec AI 前端端口 (預設: 9280)
- `ENABLE_WEBTTY`: 啟用 WebTTY 模式（預設: false）
- `AI_SESSION_MODE`: AI CLI 啟動模式（interactive|on-demand，預設: interactive）

#### init.sh (init.sh:1-65)
容器啟動腳本，執行以下任務：
- 建立專案目錄結構 (`/home/flexy/workspace`)
- 初始化 Git 配置（如果不存在）
- 檢查 Claude Code 環境變數
- 顯示環境資訊和可用指令

#### MCP 配置 (claude-config/.mcp.json:1-19)
定義兩個 MCP 伺服器：
- **github**: GitHub CLI MCP 伺服器（需要 GITHUB_TOKEN）
- **docker**: Docker MCP 伺服器

## 常用開發指令

### 建置 Docker 映像

**方法 1: 直接使用 Docker**
```bash
docker build -t flexy-dev-sandbox .
```

**方法 2: 使用建置腳本**
```bash
./scripts/build-docker.sh
```

注意：建置腳本會從專案根目錄執行 `docker build`，映像名稱為 `flexy-dev-sandbox`。

### 執行容器

**方式 1: 使用新版動態配置（推薦）**
```bash
docker run -it --rm \
  -e AI_WINDOW_0_TYPE=qwen \
  -e AI_WINDOW_0_API_KEY=sk-xxx \
  -e AI_WINDOW_1_TYPE=claude \
  -e AI_WINDOW_1_API_KEY=sk-ant-xxx \
  -e AI_WINDOW_2_TYPE=gemini \
  -e AI_WINDOW_2_API_KEY=AIza-xxx \
  -e GITHUB_TOKEN=your_github_token \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox
```

**方式 2: 自訂 Window 配置**
```bash
# 例如：只在 Window 0 和 Window 2 配置 AI 工具
docker run -it --rm \
  -e AI_WINDOW_0_TYPE=claude \
  -e AI_WINDOW_0_API_KEY=sk-ant-xxx \
  -e AI_WINDOW_2_TYPE=qwen \
  -e AI_WINDOW_2_API_KEY=sk-xxx \
  -e AI_WINDOW_2_MODEL=qwen-max \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox
# Window 0: Claude
# Window 1: bash shell (未配置)
# Window 2: Qwen
# Window 3: bash shell (未配置)
# Window 4: bash shell (未配置)
# Window 5: user terminal (固定)
```

**一次性執行 Claude Code 任務**
```bash
docker run --rm \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  flexy-dev-sandbox claude "建立一個 Express 應用"
```

**掛載本地專案目錄**
```bash
docker run -it --rm \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox
```

**WebTTY 模式（網頁終端共享 + Markdown 編輯器）**
```bash
# 啟動 WebTTY 模式，支援多客戶端共享同一 tmux 會話，並啟用 Markdown 編輯器
docker run -d --rm \
  -p 9681:9681 \
  -p 9280:9280 \
  -e ENABLE_WEBTTY=true \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  -v $(pwd):/home/flexy/workspace \
  -v $(pwd)/markdown:/home/flexy/markdown \
  --name flexy-webtty \
  flexy-dev-sandbox

# 在瀏覽器中開啟:
# - http://localhost:9681 - Web Terminal (ttyd + tmux)
# - http://localhost:8280 - CoSpec AI Markdown Editor
# 所有客戶端將共享同一個 tmux 會話，適合協作開發
```

### 容器內可用指令

根據你的配置，以下 AI 工具可能可用：
- `qwen` - Qwen Code CLI（如果已配置並安裝）
- `claude` - Claude Code CLI（如果已配置並安裝）
- `gemini` - Gemini CLI（如果已配置並安裝）
- `codex` - OpenAI Codex CLI（如果已配置並安裝）

其他工具：
- `node` / `npm` - Node.js 工具
- `python3` / `pip3` - Python 工具
- `git` / `gh` - 版本控制和 GitHub CLI

## 動態 AI 工具配置（新功能）

### 概述

Flexy Sandbox 支援在容器啟動時動態安裝和配置 AI 工具，無需重新建置映像。前 5 個 tmux windows（0-4）可自由配置，Window 5 固定為使用者終端。

### 支援的 AI 工具

| 工具名稱 | TYPE 值 | npm 套件 |
|---------|---------|----------|
| Qwen Code | `qwen` | `@qwen-code/qwen-code@latest` |
| Claude Code | `claude` | `@anthropic-ai/claude-code` |
| Gemini CLI | `gemini` | `@google/gemini-cli` |
| OpenAI Codex | `codex` | `@openai/codex` |

### 配置環境變數格式

每個 window 需要以下環境變數：

```bash
AI_WINDOW_<N>_TYPE=<qwen|claude|gemini|codex>  # AI 工具類型（必填）
AI_WINDOW_<N>_API_KEY=<your-api-key>            # API 金鑰（必填）
AI_WINDOW_<N>_MODEL=<model-name>                # 模型名稱（可選）
AI_WINDOW_<N>_BASE_URL=<api-base-url>           # API Base URL（可選）
```

其中 `<N>` 可以是 0, 1, 2, 3, 4。

### 使用範例

#### 範例 1: 配置 3 種 AI 工具

```bash
docker run -d --rm \
  -p 9681:9681 -p 9280:9280 \
  -e ENABLE_WEBTTY=true \
  -e AI_WINDOW_0_TYPE=qwen \
  -e AI_WINDOW_0_API_KEY=sk-xxx \
  -e AI_WINDOW_1_TYPE=claude \
  -e AI_WINDOW_1_API_KEY=sk-ant-xxx \
  -e AI_WINDOW_2_TYPE=gemini \
  -e AI_WINDOW_2_API_KEY=AIza-xxx \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox
```

**結果**:
- Window 0: Qwen CLI
- Window 1: Claude Code
- Window 2: Gemini CLI
- Window 3: bash shell（未配置）
- Window 4: bash shell（未配置）
- Window 5: user terminal（固定）

#### 範例 2: 只配置 Claude 和 Gemini

```bash
docker run -d --rm \
  -e ENABLE_WEBTTY=true \
  -e AI_WINDOW_1_TYPE=claude \
  -e AI_WINDOW_1_API_KEY=sk-ant-xxx \
  -e AI_WINDOW_3_TYPE=gemini \
  -e AI_WINDOW_3_API_KEY=AIza-xxx \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox
```

**結果**:
- Window 0: bash shell（未配置）
- Window 1: Claude Code
- Window 2: bash shell（未配置）
- Window 3: Gemini CLI
- Window 4: bash shell（未配置）
- Window 5: user terminal（固定）

#### 範例 3: 使用自訂模型和 Base URL

```bash
docker run -d --rm \
  -e ENABLE_WEBTTY=true \
  -e AI_WINDOW_0_TYPE=qwen \
  -e AI_WINDOW_0_API_KEY=sk-xxx \
  -e AI_WINDOW_0_MODEL=qwen-max \
  -e AI_WINDOW_0_BASE_URL=https://dashscope.aliyuncs.com/api/v1 \
  -e AI_WINDOW_1_TYPE=claude \
  -e AI_WINDOW_1_API_KEY=sk-ant-xxx \
  -e AI_WINDOW_1_MODEL=claude-3-5-sonnet-20241022 \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox
```

### 技術細節

#### AI 工具安裝流程

1. **容器啟動**: `init.sh` 執行 `/scripts/install-ai-tools.sh`
2. **解析配置**: 讀取 `AI_WINDOW_*_TYPE` 環境變數
3. **去重安裝**: 如果多個 windows 使用相同工具，只安裝一次
4. **npm 安裝**: 使用 `npm install -g` 安裝對應套件
5. **驗證**: 檢查命令是否可用

#### tmux Window 管理

- **監控腳本**: `ai-session-monitor.js` 負責建立和監控 windows
- **動態建立**: 根據配置決定每個 window 的類型（AI CLI 或 bash shell）
- **自動重啟**: 如果 AI 進程意外終止，監控器會自動重啟
- **環境變數注入**: 每個 AI 工具會從對應的 `AI_WINDOW_*_API_KEY` 等變數讀取配置

### 故障排除

#### AI 工具未安裝

檢查容器日誌：
```bash
docker logs <container-id> | grep "安裝 AI 工具"
```

#### AI CLI 未啟動

查看監控器日誌：
```bash
docker exec <container-id> cat /home/flexy/ai-monitor.log
```

#### API Key 未生效

確認環境變數格式正確：
```bash
docker exec <container-id> env | grep AI_WINDOW
```

## 通知機制

當完成複雜或多步驟任務時（特別是在 auto-accept mode），使用 `/sendNotification` 工具發送完成通知：

```bash
/sendNotification --channel=line --message "任務完成: [具體完成的任務內容]"
```

這需要 `kai-notify` npm package，已預先安裝在容器中。

## 開發流程

### 修改 Dockerfile
1. 編輯 `Dockerfile` 添加新工具或變更配置
2. 使用 `./scripts/build-docker.sh` 重新建置映像
3. 測試新映像：`docker run -it --rm flexy-dev-sandbox`

### 修改 MCP 配置
1. 編輯 `claude-config/.mcp.json` 添加或移除 MCP 伺服器
2. 重新建置映像以套用變更
3. 在容器內使用 `claude mcp list` 驗證配置

### 修改啟動腳本
1. 編輯 `init.sh` 添加初始化邏輯
2. 確保腳本有執行權限：`chmod +x init.sh`
3. 重新建置映像並測試

## Claude Code 配置持久化

### 概述

Flexy Sandbox 支援靈活的 Claude Code 配置管理，實現以下目標：
- **持久化配置**: 容器重啟後配置保留
- **多容器共享**: 多個 Flexy 容器使用相同配置
- **專案特定配置**: 支援專案級配置覆蓋
- **環境變數注入**: Kai 整合時動態生成配置

### 配置文件位置

**配置讀取優先級（從高到低）**:
1. **專案級配置**: `/home/flexy/workspace/.claude/` (最高優先級)
2. **使用者級配置**: `/home/flexy/.claude/` (預設)
3. **環境變數生成**: 從 `CLAUDE_*` 環境變數動態生成

### 配置文件

#### CLAUDE.md
Claude 行為和偏好設定文件，定義：
- 輸出語言和風格
- 編碼規範
- 提交訊息格式
- 通知設定

**預設配置** (`claude-config/CLAUDE.md`):
```markdown
# Claude Code 設定檔案

## 使用者介面
1. 一律以繁體中文輸出

## 通用原則
1. 當你完成一個複雜或多步驟的任務時（auto-accept mode），請使用 /sendNotification 工具發送完成通知。
2. 使用方式：/sendNotification --channel=line --message "任務完成: [具體完成的任務內容]"
```

#### .mcp.json
MCP (Model Context Protocol) 伺服器配置，定義可用的工具和整合。

**預設配置** (`claude-config/.mcp.json`):
```json
{
  "mcp": {
    "servers": {
      "github": {
        "type": "stdio",
        "command": "gh",
        "args": ["mcp", "server"],
        "env": {"GITHUB_TOKEN": "${GITHUB_TOKEN}"}
      },
      "kai-notify": {
        "type": "stdio",
        "command": "npx",
        "args": ["kai-notify", "--mcp"]
      }
    }
  }
}
```

### 配置初始化邏輯

容器啟動時，`init.sh` 執行以下初始化流程：

#### 1. CLAUDE.md 初始化
```bash
# 檢查是否存在使用者級 CLAUDE.md
if [ ! -f /home/flexy/.claude/CLAUDE.md ]; then
  # 優先從環境變數生成（Kai 模式）
  if [ -n "$CLAUDE_LANGUAGE" ] || [ -n "$CLAUDE_NOTIFICATION_ENABLED" ]; then
    # 從環境變數生成 CLAUDE.md
  else
    # 複製預設模板
    cp /home/flexy/CLAUDE.md /home/flexy/.claude/CLAUDE.md
  fi
fi
```

**支援的環境變數**:
- `CLAUDE_LANGUAGE`: 輸出語言（預設: 繁體中文）
- `CLAUDE_NOTIFICATION_ENABLED`: 啟用通知（預設: true）
- `CLAUDE_NOTIFICATION_CHANNEL`: 通知頻道（預設: line）

#### 2. MCP 配置合併
```bash
# 如果使用者已有 MCP 配置，智慧合併
if [ -f /home/flexy/.claude/.mcp.json ]; then
  # 使用 merge-mcp-config.sh 合併預設 + 使用者配置
  /scripts/merge-mcp-config.sh \
    /home/flexy/default-mcp.json \
    /home/flexy/.claude/.mcp.json \
    /home/flexy/.claude/.mcp.json
fi
```

**合併策略**:
- 保留所有預設 MCP 伺服器（github, kai-notify）
- 添加使用者自訂的額外伺服器
- 同名伺服器以使用者配置為準
- 使用 `jq` 工具進行 JSON 合併

### 配置診斷輸出

容器啟動時顯示配置狀態（`init.sh:146-191`）:

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

### Volume 掛載方案

#### 方案 A: 全域配置掛載
```bash
docker run -it --rm \
  -v ~/.flexy-claude-config:/home/flexy/.claude \
  flexy-dev-sandbox
```
適合個人使用，所有容器共享配置。

#### 方案 B: 專案配置
```bash
# 在專案目錄建立 .claude/
mkdir -p my-project/.claude
docker run -it --rm \
  -v $(pwd)/my-project:/home/flexy/workspace \
  flexy-dev-sandbox
```
適合團隊協作，配置納入 Git 版本控制。

#### 方案 C: 環境變數配置（Kai）
```bash
docker run -it --rm \
  -e CLAUDE_LANGUAGE=zh_TW \
  -e CLAUDE_NOTIFICATION_ENABLED=true \
  flexy-dev-sandbox
```
適合自動化部署，無需預先建立配置文件。

### Kai 整合範例

Kai 後端在建立 Flexy 容器時可傳入環境變數：

```javascript
// kai-backend/src/services/flexyContainer.js
const container = await docker.createContainer({
  Env: [
    `ANTHROPIC_AUTH_TOKEN=${apiKey}`,
    `CLAUDE_LANGUAGE=zh_TW`,
    `CLAUDE_NOTIFICATION_ENABLED=true`,
    `CLAUDE_NOTIFICATION_CHANNEL=line`,
    `KAI_PROJECT_ID=${projectId}`,
  ],
  // ... 其他配置
});
```

容器啟動時會自動生成對應的 CLAUDE.md 配置。

### 配置文件範例

**專案級 `.claude/CLAUDE.md`**（團隊協作）:
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

**專案級 `.claude/.mcp.json`**（擴充 MCP 伺服器）:
```json
{
  "mcp": {
    "servers": {
      "project-database": {
        "type": "stdio",
        "command": "npx",
        "args": ["@myorg/db-mcp-server"]
      },
      "custom-api": {
        "type": "stdio",
        "command": "node",
        "args": ["./tools/api-mcp-server.js"]
      }
    }
  }
}
```

這些配置會與預設 MCP 伺服器合併，確保 github、kai-notify 仍可用。

## 容器內目錄結構

- `/home/flexy` - 使用者家目錄
- `/home/flexy/workspace` - 推薦的專案掛載點
- `/home/flexy/.local/bin` - 使用者安裝的執行檔（npm global packages）
- `/home/flexy/.local/lib/node_modules` - npm global 模組目錄
- `/home/flexy/.claude/` - Claude Code 配置目錄（使用者級）
  - `CLAUDE.md` - Claude 全域配置
  - `.mcp.json` - MCP 伺服器配置
- `/home/flexy/workspace/.claude/` - 專案級配置（優先級最高）
- `/home/flexy/CLAUDE.md` - CLAUDE.md 配置模板（用於初始化）
- `/home/flexy/default-mcp.json` - MCP 配置模板（用於初始化和合併）
- `/scripts/merge-mcp-config.sh` - MCP 配置合併腳本

## WebTTY 模式詳細說明

### 啟用方式

WebTTY 模式透過 `ENABLE_WEBTTY=true` 環境變數啟用，在 init.sh:66-78 中實作。

### 運作原理

1. **ttyd**: 將終端透過 WebSocket 暴露為網頁服務
2. **tmux**: 提供持久化的終端會話，支援多客戶端連線
3. **共享會話**: 所有連線到同一容器的客戶端看到相同的終端畫面

### 使用場景

- **遠端開發**: 透過瀏覽器存取開發環境，不需要 SSH
- **配對程式設計**: 多人即時協作，共享同一終端
- **教學示範**: 講師操作，學員即時觀看
- **持久化會話**: 關閉瀏覽器後會話仍保留，重新開啟可繼續

### tmux 快捷鍵

在 WebTTY 模式下可使用 tmux 快捷鍵（預設 prefix: `Ctrl+b`）：

- `Ctrl+b %`: 垂直分割視窗
- `Ctrl+b "`: 水平分割視窗
- `Ctrl+b 方向鍵`: 切換分割區
- `Ctrl+b d`: 離開會話（會話繼續執行）
- `Ctrl+b [`: 進入複製模式（可捲動查看歷史）

### 安全考量

- WebTTY 預設**沒有認證**，任何能存取該埠的人都能連線
- 建議僅在受信任的網路環境使用，或配合反向代理（如 nginx）加上認證
- 生產環境應使用 ttyd 的 `-c` 參數設定認證憑證

### 進階配置

可修改 init.sh:78 的 ttyd 參數：

```bash
# 加入認證
exec ttyd -p 9681 -W -c username:password tmux new -A -s shared_session

# 唯讀模式
exec ttyd -p 9681 -W -R tmux attach -t shared_session

# 自訂標題
exec ttyd -p 9681 -W -t "Flexy Dev Environment" tmux new -A -s shared_session
```

## 技術細節

### Node.js 配置
- 使用 NodeSource 倉庫安裝最新 LTS 版本
- Global packages 安裝在 `/home/flexy/.local/lib/node_modules`
- `NODE_PATH` 設定為指向 global modules

### Python 配置
- 安裝 Python 3 和 pip3
- `PYTHONDONTWRITEBYTECODE=1` - 防止產生 .pyc 檔案
- `PYTHONUNBUFFERED=1` - 防止輸出緩衝

### 使用者權限
- 容器使用非 root 使用者 `flexy` 執行
- 使用者 UID/GID 由 Docker 自動分配
- 具有 sudo 權限（但預設不使用）

### 網路服務
- Port 9681: ttyd 網頁終端（WebTTY 模式）
- Port 9280: CoSpec AI Markdown Editor 前端
- 需要使用 `-p` 參數映射才能從主機存取

## Git 工作流程

預設 Git 配置（可覆蓋）：
- User: `Flexy`
- Email: `flexy@example.com`

建議在執行容器時掛載 Git 配置：
```bash
docker run -it --rm \
  -v ~/.gitconfig:/home/flexy/.gitconfig:ro \
  -v ~/.ssh:/home/flexy/.ssh:ro \
  flexy-dev-sandbox
```

## 疑難排解

### Claude Code 無法執行
確認已設定 `ANTHROPIC_AUTH_TOKEN` 環境變數。

### MCP 伺服器連線失敗
- GitHub MCP: 確認 `GITHUB_TOKEN` 環境變數已設定

### 權限問題
容器內使用 `flexy` 使用者，確保掛載的目錄有適當權限。

### npm global packages 找不到
確認 `PATH` 包含 `/home/flexy/.local/bin`。

## 擴充功能

### 添加新的開發工具
在 Dockerfile 的 `RUN apt-get install` 區段添加：
```dockerfile
RUN apt-get update && apt-get install -y \
    your-tool-name \
    && rm -rf /var/lib/apt/lists/*
```

### 添加新的 npm global package
在 Dockerfile 的 npm install 行添加：
```dockerfile
RUN npm install -g @anthropic-ai/claude-code kai-notify your-package
```

### 添加新的 MCP 伺服器
編輯 `claude-config/.mcp.json` 添加新的伺服器定義。

## CoSpec AI Markdown 編輯器

### 概述

CoSpec AI 是整合在 Flexy Sandbox 中的 Markdown 編輯器，提供所見即所得的編輯體驗。它在容器啟動時自動啟動，無需手動配置。

### 功能特點

- **樹狀文件瀏覽器**: 左側邊欄顯示所有 Markdown 文件的目錄結構
- **所見即所得編輯**: 基於 Vditor 的強大編輯器
- **即時預覽**: 支援分屏預覽和即時渲染
- **文件操作**: 創建、讀取、更新和刪除 Markdown 文件
- **實時同步**: 所有變更直接寫入主機文件系統

### 訪問方式

啟動容器後，可通過以下 URL 訪問：

- **前端界面**: `http://localhost:9280`

### 環境變數配置

- `MARKDOWN_DIR`: Markdown 文件存儲目錄（預設: 容器的當前工作目錄）
- `COSPEC_PORT`: 前端服務端口（預設: 9280）

### 自定義 Markdown 目錄

**注意**: 在 Kai 管理的 Flexy 容器中，工作目錄會自動設定為 `/base-root/{org}/{workspace}/{project}`，因此 CoSpec AI 會自動使用該項目目錄作為 Markdown 目錄。

如果需要自定義 Markdown 目錄：

```bash
docker run -d --rm \
  -p 9681:9681 \
  -p 9280:9280 \
  -e ENABLE_WEBTTY=true \
  -e MARKDOWN_DIR=/custom/path \
  -v $(pwd)/my-docs:/custom/path \
  flexy-dev-sandbox
```

### 日誌查看

如果 CoSpec AI 服務出現問題，可以查看日誌：

```bash
docker exec -it <container-name> cat /home/flexy/cospec-api.log
docker exec -it <container-name> cat /home/flexy/cospec-frontend.log
```

### 技術架構

- **前端**: React + TypeScript + Vite + Vditor
- **後端**: Node.js + Express + Socket.io
- **文件監控**: Chokidar (實時文件變更監控)
- **Context 同步**: 整合 Kai Context API，自動同步 Markdown 文件為記憶
- **同步元數據**: 儲存於 `.cospec-sync/sync-metadata.json`（不污染原始文件）
- **部署方式**: 前端使用 `serve` 提供靜態文件，後端運行 Node.js 服務

### 與 Kai 整合

當 Flexy 容器被 Kai 管理時：
- ttyd 終端可通過 Kai 代理在 `/flexy/:id/shell` 訪問
- CoSpec AI 編輯器可通過 Kai 代理在 `/flexy/:id/docs` 訪問

#### Kai 反向代理配置

Kai 後端實現了完整的反向代理支援，路由優先級如下：

1. **Shell 路由**: `/flexy/:id/shell/*` → 容器 port 9681
3. **CoSpec AI 前端路由**: `/flexy/:id/docs/*` → 容器 port 9280

#### CoSpec AI 反向代理適配

為了在 Kai 反向代理後正常運作，CoSpec AI 已進行以下配置：

1. **相對資源路徑** (`cospec-ai/app-react/vite.config.ts`):
   ```typescript
   base: './' // 使用相對路徑以支援反向代理
   ```

2. **相對 API 路徑** (`cospec-ai/app-react/src/services/api.ts`):
   ```typescript
   baseURL: './api' // 使用相對路徑以支援反向代理
   ```

3. **Hash 路由** (`cospec-ai/app-react/src/App.tsx`):
   ```typescript
   import { HashRouter as Router } from 'react-router-dom'
   ```

這些配置確保 CoSpec AI 可以在任意反向代理路徑下正常工作，無需額外配置。

### 源碼位置

CoSpec AI 是作為 git submodule 整合的：
- GitHub: https://github.com/misterlex223/cospec-ai
- 本地路徑: `cospec-ai/`（submodule）
- 容器內路徑: `/cospec-ai/`

### 反向代理故障排除

如果 CoSpec AI 在 Kai 代理後無法正常工作：

1. **檢查容器內的 CoSpec AI 版本**：
   ```bash
   docker exec <container-id> grep -A 2 "baseURL" /cospec-ai/app-react/src/services/api.ts
   ```
   應該看到 `baseURL: './api'`

2. **檢查編譯後的資源**：
   ```bash
   docker exec <container-id> cat /cospec-ai/app-react/dist/index.html | grep "src="
   ```
   應該看到相對路徑如 `./assets/index-*.js`

3. **重新建置 Flexy 映像**：
   如果發現配置不正確，需要使用 `--no-cache` 重新建置：
   ```bash
   docker build --no-cache -t flexy-dev-sandbox:latest .
   ```

4. **驗證反向代理路由**：
   測試 API 是否正確路由：
   ```bash
   curl http://localhost:9900/flexy/<container-id>/docs/api/files
   ```
   應該返回 JSON 格式的文件列表，而不是 HTML。

## Context 同步整合

CoSpec AI 與 Kai 的 Context System 整合，可自動將 Markdown 文件同步為記憶體。詳細技術文件請參考 `cospec-ai/CLAUDE.md`。

### 自動同步模式

符合以下模式的文件會自動同步到 Kai Context：
- `specs/**/*.md` - 規格文件
- `requirements/**/*.md` - 需求文件
- `docs/specs/**/*.md` - 規格文件（文件目錄下）
- `**/*.spec.md` - 以 `.spec.md` 結尾的文件
- `SPEC.md` - 根目錄規格文件
- `REQUIREMENTS.md` - 根目錄需求文件

### 同步元數據儲存

**重要原則**：CoSpec AI **絕不修改原始 Markdown 文件**。所有同步元數據儲存在獨立的 `.cospec-sync/sync-metadata.json` 文件中。

**設計理念**：
1. **不污染原始文件**：同步用途的元數據不寫入原始 Markdown
2. **關注點分離**：同步狀態儲存在專用隱藏目錄
3. **防止無限循環**：元數據目錄被文件監控器忽略
4. **持久化狀態**：容器重啟後同步狀態保留

### 問題排除

**問題：無限同步循環（文件持續重複同步）**
- **原因**：~~早期版本會修改原始文件的 frontmatter，觸發文件監控器，造成無限循環~~（已修復）
- **解決方案**：
  1. 升級到最新版本的 Flexy 映像（2025-01-25 之後）
  2. 驗證 `cospec-ai/server/index.js` 的 `watchOptions.ignored` 包含 `'**/.cospec-sync/**'`
  3. 確認 `cospec-ai/server/fileSyncManager.js` 已移除 `updateFrontmatter()` 方法

**問題：同步狀態在容器重啟後遺失**
- **原因**：`.cospec-sync/` 目錄未被持久化
- **解決方案**：確保 `MARKDOWN_DIR` 的 volume 掛載包含 `.cospec-sync/` 子目錄

**問題：文件未自動同步**
- **原因**：文件路徑不符合任何自動同步模式
- **解決方案**：使用手動同步 API 或在 `fileSyncManager.js` 中添加模式

### 環境變數

- `KAI_PROJECT_ID`: 專案 ID，用於 context 同步整合（可選）
- `KAI_BACKEND_URL`: Kai 後端 URL，用於 context API（可選，預設：`http://host.docker.internal:9900`）

### 相關文件

完整的 Context 同步技術文件請參考：
- `cospec-ai/CLAUDE.md` - CoSpec AI 完整文件（包含 Context Sync Integration 章節）
- Kai 主專案的 `docs/architecture/cospec-context-integration.md` - 整合架構文件
