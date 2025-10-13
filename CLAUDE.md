# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

#### init.sh (init.sh:1-65)
容器啟動腳本，執行以下任務：
- 建立專案目錄結構 (`/home/flexy/projects`)
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
  -v $(pwd):/home/flexy/projects \
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
  -v $(pwd):/home/flexy/projects \
  flexy-dev-sandbox
```

**WebTTY 模式（網頁終端共享）**
```bash
# 啟動 WebTTY 模式，支援多客戶端共享同一 tmux 會話
docker run -d --rm \
  -p 7681:7681 \
  -e ENABLE_WEBTTY=true \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  -v $(pwd):/home/flexy/projects \
  --name flexy-webtty \
  flexy-dev-sandbox

# 在瀏覽器中開啟 http://localhost:7681
# 所有客戶端將共享同一個 tmux 會話，適合協作開發
```

### 容器內可用指令

- `claude` - Claude Code CLI
- `claude commit` - 建立 Git 提交訊息
- `claude mcp list` - 列出 MCP 伺服器
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
- `/home/flexy/projects` - 推薦的專案掛載點
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
exec ttyd -p 7681 -W -c username:password tmux new -A -s shared_session

# 唯讀模式
exec ttyd -p 7681 -W -R tmux attach -t shared_session

# 自訂標題
exec ttyd -p 7681 -W -t "Flexy Dev Environment" tmux new -A -s shared_session
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
- Port 7681: ttyd 網頁終端（可選）
- 需要使用 `-p 7681:7681` 映射才能從主機存取

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
