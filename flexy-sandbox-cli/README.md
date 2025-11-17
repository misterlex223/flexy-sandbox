# Flexy Sandbox CLI

互動式 CLI 工具，用於管理 Flexy Sandbox 容器的完整生命週期。提供直覺的配置介面、預設模板和強大的容器管理功能。

## 特色功能

✨ **互動式配置精靈** - 透過友善的問答流程建立配置
🎯 **預設模板** - 內建多種場景模板，快速啟動
🔍 **配置驗證** - 自動驗證 API keys、端口和配置項目
💾 **配置管理** - 儲存、載入和重複使用配置
🐳 **完整容器管理** - create, start, stop, pause, delete, logs, shell
📊 **容器列表** - 清晰的表格顯示所有容器狀態

## 安裝

### 全域安裝（推薦）

```bash
npm install -g flexy-sandbox-cli
```

### 本地開發

```bash
git clone <repository-url>
cd flexy-sandbox-cli
npm install
npm link
```

## 快速開始

### 1. 建立配置

```bash
flexy-sandbox config
```

這將啟動互動式配置精靈，引導你完成：
- 選擇預設模板或自訂配置
- 配置 AI 工具（Qwen, Claude, Gemini, Codex）
- 設定 WebTTY 和 CoSpec Markdown 編輯器
- 填入 API Keys 和其他環境變數

### 2. 建立並啟動容器

```bash
flexy-sandbox create <config-name>
```

例如：
```bash
flexy-sandbox create my-dev
```

### 3. 管理容器

```bash
# 列出所有容器
flexy-sandbox list

# 進入容器 shell
flexy-sandbox shell my-dev

# 查看容器日誌
flexy-sandbox logs my-dev

# 追蹤日誌（實時）
flexy-sandbox logs my-dev -f

# 停止容器
flexy-sandbox stop my-dev

# 啟動容器
flexy-sandbox start my-dev

# 暫停容器
flexy-sandbox pause my-dev

# 恢復容器
flexy-sandbox unpause my-dev

# 刪除容器
flexy-sandbox delete my-dev
```

## 預設配置模板

### 開發環境 (dev)

適合個人開發，包含：
- 單一 AI 工具（Claude）
- WebTTY 網頁終端
- CoSpec Markdown 編輯器
- 工作目錄掛載

### 多 AI 測試環境 (multi-ai)

適合比較測試，包含：
- 4 種 AI 工具（Qwen, Claude, Gemini, Codex）
- WebTTY 網頁終端
- CoSpec Markdown 編輯器

### 團隊協作環境 (team)

適合團隊協作，包含：
- Claude AI 工具
- WebTTY 網頁終端
- CoSpec Markdown 編輯器
- Git 配置掛載
- SSH 金鑰掛載
- GitHub Token 整合

### 最小配置 (minimal)

只有基本功能，包含：
- CoSpec Markdown 編輯器
- 工作目錄掛載
- 不啟用 AI 工具和 WebTTY

## 命令參考

### 配置管理

#### `flexy-sandbox config`

啟動互動式配置精靈。

**功能**：
- 使用預設模板
- 自訂配置
- 載入已存在的配置
- 配置驗證

### 容器生命週期

#### `flexy-sandbox create <config-name>`

根據配置建立並啟動容器。

**範例**：
```bash
flexy-sandbox create my-dev
```

#### `flexy-sandbox start <name>`

啟動已存在的容器。

#### `flexy-sandbox stop <name>`

停止運行中的容器。

#### `flexy-sandbox pause <name>`

暫停運行中的容器。

#### `flexy-sandbox unpause <name>`

恢復已暫停的容器。

#### `flexy-sandbox delete <name>`

刪除容器。

**選項**：
- `-f, --force` - 強制刪除，不詢問確認

**範例**：
```bash
flexy-sandbox delete my-dev
flexy-sandbox delete my-dev -f
```

### 容器查詢

#### `flexy-sandbox list`

列出所有 Flexy 容器。

**別名**: `ls`

**輸出範例**：
```
┌──────────────────┬─────────────┬─────────┬─────────────────────┬────────────────────┐
│ 名稱             │ ID          │ 狀態    │ 端口                │ 映像               │
├──────────────────┼─────────────┼─────────┼─────────────────────┼────────────────────┤
│ my-dev           │ a1b2c3d4e5f │ running │ 9681:9681, 9280:... │ flexy-dev-sandbox  │
└──────────────────┴─────────────┴─────────┴─────────────────────┴────────────────────┘
```

#### `flexy-sandbox logs <name>`

查看容器日誌。

**選項**：
- `-f, --follow` - 持續追蹤日誌
- `-n, --tail <lines>` - 顯示最後 N 行（預設：100）

**範例**：
```bash
# 查看最後 100 行日誌
flexy-sandbox logs my-dev

# 查看最後 500 行日誌
flexy-sandbox logs my-dev -n 500

# 持續追蹤日誌
flexy-sandbox logs my-dev -f
```

#### `flexy-sandbox shell <name>`

進入容器的 bash shell。

**別名**: `sh`

**範例**：
```bash
flexy-sandbox shell my-dev
```

#### `flexy-sandbox inspect <name>`

查看容器的詳細資訊（使用 `docker inspect`）。

## 配置檔案

### 配置儲存位置

所有配置儲存在 `~/.flexy-sandbox/<name>.json`。

### 配置格式

```json
{
  "enableWebtty": true,
  "cospecPort": 9280,
  "webttyPort": 9681,
  "aiWindows": [
    {
      "window": 1,
      "type": "claude",
      "apiKey": "sk-ant-xxx",
      "model": "claude-3-5-sonnet-20241022",
      "baseUrl": ""
    }
  ],
  "volumes": [
    {
      "host": "$(pwd)",
      "container": "/home/flexy/workspace"
    }
  ],
  "environment": {
    "CLAUDE_LANGUAGE": "繁體中文",
    "CLAUDE_NOTIFICATION_ENABLED": "true"
  }
}
```

### 支援的 AI 工具類型

- `qwen` - Qwen Code
- `claude` - Claude Code
- `gemini` - Gemini CLI
- `codex` - OpenAI Codex

### Volume 路徑變數

- `$(pwd)` - 當前工作目錄
- `~` - 使用者家目錄

## 環境變數

### AI Window 配置

配置會自動轉換為以下環境變數：

```bash
AI_WINDOW_<N>_TYPE=<qwen|claude|gemini|codex>
AI_WINDOW_<N>_API_KEY=<your-api-key>
AI_WINDOW_<N>_MODEL=<model-name>        # 可選
AI_WINDOW_<N>_BASE_URL=<api-base-url>   # 可選
```

同時也會設定對應的全域環境變數（向後相容）：

- Qwen: `QWEN_API_KEY`, `QWEN_MODEL`, `QWEN_BASE_URL`
- Claude: `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`, `ANTHROPIC_BASE_URL`
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_BASE_URL`
- Codex: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`

## 疑難排解

### Docker 未運行

```
✗ Docker 未運行或無法連線
```

**解決方案**：
1. 確認 Docker Desktop 已啟動
2. 執行 `docker ps` 測試連線

### Docker 映像不存在

```
✗ Docker 映像不存在
請先建置 Flexy Sandbox 映像
執行: docker build -t flexy-dev-sandbox:latest .
```

**解決方案**：
1. 進入 Flexy Sandbox 專案目錄
2. 執行 `docker build -t flexy-dev-sandbox:latest .`

### 配置不存在

```
✗ 配置不存在: my-config
```

**解決方案**：
1. 使用 `flexy-sandbox config` 建立配置
2. 或檢查配置名稱是否正確

### 端口已被佔用

如果啟動容器時端口衝突，可以：
1. 修改配置中的 `webttyPort` 或 `cospecPort`
2. 停止佔用端口的其他服務

## 開發

### 專案結構

```
flexy-sandbox-cli/
├── bin/
│   └── flexy-sandbox.js          # CLI 入口點
├── src/
│   ├── commands/
│   │   ├── config.js             # 配置命令
│   │   ├── lifecycle.js          # 生命週期命令
│   │   └── query.js              # 查詢命令
│   ├── lib/
│   │   ├── configManager.js      # 配置管理
│   │   ├── dockerManager.js      # Docker 操作
│   │   ├── validator.js          # 配置驗證
│   │   └── templates.js          # 模板管理
│   └── utils/
│       ├── logger.js             # 日誌工具
│       └── constants.js          # 常數定義
├── templates/                    # 配置模板
│   ├── dev.json
│   ├── multi-ai.json
│   ├── team.json
│   └── minimal.json
└── package.json
```

### 新增配置模板

1. 在 `templates/` 目錄新增 JSON 檔案
2. 在 `src/utils/constants.js` 的 `TEMPLATES` 陣列新增模板名稱
3. 格式參考現有模板

### 本地測試

```bash
npm link
flexy-sandbox --help
```

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 相關專案

- [Flexy Sandbox](https://github.com/your-org/flexy-sandbox) - 主要專案
- [CoSpec AI](https://github.com/misterlex223/cospec-ai) - Markdown 編輯器

## 支援

如有問題或建議，請：
- 提交 GitHub Issue
- 查看專案文件
- 聯繫維護團隊
