# QWEN.md

This file provides guidance to Qwen Code (qwen.ai/code) when working with code in this repository.

## 專案概述

這是一個 Docker 開發環境專案，用於建置包含完整開發工具鏈的容器映像。該映像提供了 Node.js、Python、Git/GitHub CLI 和 Claude Code 的完整環境，可用於快速啟動開發環境或作為 CI/CD 基礎映像。

### 核心工具
- **Ubuntu 22.04 LTS**: 基礎作業系統
- **Node.js (LTS)**: JavaScript 執行環境
- **Python 3**: Python 執行環境
- **Git + GitHub CLI (gh)**: 版本控制和 GitHub 整合
- **Claude Code**: AI 輔助開發工具
- **ttyd + tmux**: 終端分享和持久化會話
- **kai-notify**: LINE 通知整合 (npm package)

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
- `ANTHROPIC_AUTH_TOKEN`: Claude API 認證令牌
- `ANTHROPIC_BASE_URL`: Claude API 基礎 URL (可選)
- `ANTHROPIC_MODEL`: Claude 主要模型名稱
- `ANTHROPIC_SMALL_FAST_MODEL`: Claude 快速模型名稱
- `MARKDOWN_DIR`: CoSpec AI Markdown 文件目錄 (預設: 當前工作目錄，由 Docker WorkingDir 設定)
- `COSPEC_PORT`: CoSpec AI 前端端口 (預設: 9280)

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

**互動式模式（含環境變數）**
```bash
docker run -it --rm \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  -e GITHUB_TOKEN=your_github_token \
  -v $(pwd):/home/flexy/workspace \
  flexy-dev-sandbox
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

- `claude` - Claude Code CLI
- `claude commit` - 建立 Git 提交訊息
- `claude mcp list` - 列出 MCP 伺服器
- `qwen` - Qwen Code CLI
- `node` / `npm` - Node.js 工具
- `python3` / `pip3` - Python 工具
- `git` / `gh` - 版本控制和 GitHub CLI

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

## 容器內目錄結構

- `/home/flexy` - 使用者家目錄
- `/home/flexy/workspace` - 推薦的專案掛載點
- `/home/flexy/.local/bin` - 使用者安裝的執行檔（npm global packages）
- `/home/flexy/.local/lib/node_modules` - npm global 模組目錄
- `/home/flexy/.mcp.json` - MCP 伺服器配置
- `/home/flexy/.claude/CLAUDE.md` - Claude Code 全域配置（來自 claude-config/CLAUDE.md）

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
- Docker MCP: 確認 Docker daemon 可存取（可能需要掛載 Docker socket）

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
- **部署方式**: 前端使用 `serve` 提供靜態文件，後端運行 Node.js 服務

### 與 Kai 整合

當 Flexy 容器被 Kai 管理時：
- ttyd 終端可通過 Kai 代理在 `/flexy/:id/shell` 訪問
- CoSpec AI 編輯器可通過 Kai 代理在 `/flexy/:id/docs` 訪問

#### Kai 反向代理配置

Kai 後端實現了完整的反向代理支援，路由優先級如下：

1. **Shell 路由**: `/flexy/:id/shell/*` → 容器 port 9681
2. **CoSpec AI API 路由**: `/flexy/:id/docs/api/*` → 容器 port 9281
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
