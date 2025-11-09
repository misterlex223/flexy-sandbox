# Flexy Sandbox CLI 快速入門指南

## 安裝

```bash
cd flexy-sandbox-cli
npm install
npm link
```

## 第一次使用

### 步驟 1: 建立配置

執行互動式配置精靈：

```bash
flexy-sandbox config
```

你會看到：

```
🔧 Flexy Sandbox 配置精靈

? 請選擇配置方式: (Use arrow keys)
❯ 使用預設模板
  自訂配置
  載入已存在的配置
```

選擇 **使用預設模板**，然後選擇 **開發環境**：

```
? 選擇配置模板: (Use arrow keys)
❯ 開發環境 - 單一 AI 工具 + WebTTY + CoSpec Markdown 編輯器，適合個人開發
  多 AI 測試環境 - 同時運行 3-4 種 AI 工具，適合比較測試和評估
  團隊協作環境 - WebTTY + Markdown 編輯器 + Git 整合，適合團隊協作開發
  最小配置 - 只有基本功能，不啟用 AI 工具和 WebTTY
```

輸入配置名稱（預設為 `dev`）：

```
? 配置名稱: (dev) my-dev
```

填入 Claude API Key：

```
請填入 AI 工具的 API Keys:
? CLAUDE API Key (Window 0): [hidden]
```

確認儲存：

```
ℹ 驗證配置...
? 是否儲存配置? (Y/n) Y
✓ 配置已儲存: my-dev
```

### 步驟 2: 建立容器

確保 Flexy Sandbox Docker 映像已建置：

```bash
# 回到 flexy-sandbox 主專案目錄
cd ..
docker build -t flexy-dev-sandbox:latest .
```

建立並啟動容器：

```bash
flexy-sandbox create my-dev
```

你會看到：

```
✓ Docker 運行正常
✓ Docker 映像存在
✓ 配置載入成功
✓ 容器建立成功
────────────────────────────────────────────────────────
✓ 容器名稱: flexy-my-dev
ℹ 容器 ID: a1b2c3d4e5f6
ℹ WebTTY: http://localhost:9681
ℹ CoSpec Markdown Editor: http://localhost:9280
────────────────────────────────────────────────────────

可用命令:
  flexy-sandbox shell my-dev  - 進入容器 shell
  flexy-sandbox logs my-dev   - 查看容器日誌
  flexy-sandbox stop my-dev   - 停止容器
```

### 步驟 3: 使用容器

#### 在瀏覽器中使用

開啟瀏覽器訪問：
- **WebTTY**: http://localhost:9681
- **CoSpec Markdown Editor**: http://localhost:9280

#### 透過 CLI 進入容器

```bash
flexy-sandbox shell my-dev
```

在容器內可以使用：
- `claude` - Claude Code CLI
- `node` / `npm` - Node.js 工具
- `python3` / `pip3` - Python 工具
- `git` / `gh` - 版本控制和 GitHub CLI

#### 查看容器日誌

```bash
# 查看最後 100 行
flexy-sandbox logs my-dev

# 持續追蹤日誌
flexy-sandbox logs my-dev -f
```

### 步驟 4: 管理容器

#### 列出所有容器

```bash
flexy-sandbox list
```

輸出範例：
```
┌──────────┬─────────────┬─────────┬──────────────────────┬─────────────────────┐
│ 名稱     │ ID          │ 狀態    │ 端口                 │ 映像                │
├──────────┼─────────────┼─────────┼──────────────────────┼─────────────────────┤
│ my-dev   │ a1b2c3d4e5f │ running │ 9681:9681, 9280:9280 │ flexy-dev-sandbox   │
└──────────┴─────────────┴─────────┴──────────────────────┴─────────────────────┘

ℹ 總共 1 個容器
```

#### 停止容器

```bash
flexy-sandbox stop my-dev
```

#### 重新啟動容器

```bash
flexy-sandbox start my-dev
```

#### 刪除容器

```bash
flexy-sandbox delete my-dev
```

會詢問確認：
```
? 確定要刪除容器 my-dev? (y/N) y
✓ 容器已刪除: my-dev
? 是否同時刪除配置檔案? (y/N) n
```

## 進階使用

### 自訂配置

如果預設模板不符合需求，可以使用自訂配置：

```bash
flexy-sandbox config
```

選擇 **自訂配置**，然後逐步填寫：

1. 配置名稱
2. 是否啟用 WebTTY
3. 端口設定
4. AI 工具數量和類型
5. 工作目錄路徑

### 多 AI 工具配置

如果需要同時測試多種 AI 工具：

```bash
flexy-sandbox config
```

選擇 **多 AI 測試環境** 模板，填入所有 AI 工具的 API Keys。

建立容器後，在 tmux 中：
- Window 0: Qwen
- Window 1: Claude
- Window 2: Gemini
- Window 3: Codex
- Window 4: bash shell
- Window 5: user terminal

使用 `Ctrl+b 0-5` 切換不同的 window。

### 團隊協作配置

團隊協作模板會掛載 Git 配置和 SSH 金鑰：

```bash
flexy-sandbox config
```

選擇 **團隊協作環境**，填入：
- Claude API Key
- GitHub Token（可選）

這樣容器內就可以直接使用 Git 和 GitHub CLI，無需重新配置。

### 編輯已存在的配置

配置儲存在 `~/.flexy-sandbox/<name>.json`，可以直接編輯：

```bash
# 查看配置位置
ls ~/.flexy-sandbox/

# 編輯配置
vi ~/.flexy-sandbox/my-dev.json
```

編輯後重新建立容器即可套用變更。

## 常見問題

### Q: 如何更換 AI 工具的 API Key？

A: 編輯配置文件 `~/.flexy-sandbox/<name>.json`，修改 `aiWindows[].apiKey` 欄位，然後重新建立容器。

### Q: 如何更改端口？

A: 編輯配置文件，修改 `webttyPort` 或 `cospecPort` 欄位，然後重新建立容器。

### Q: 容器啟動後如何連線？

A: 使用以下任一方式：
- 瀏覽器訪問 WebTTY: http://localhost:9681
- CLI 進入 shell: `flexy-sandbox shell <name>`
- SSH 連線（如果有配置）

### Q: 如何在容器內安裝額外的工具？

A: 進入容器 shell 後，使用 `apt-get install` 或 `npm install -g` 安裝。注意：容器刪除後安裝的工具會消失，建議修改 Dockerfile 重新建置映像。

### Q: 配置中的 `$(pwd)` 是什麼意思？

A: `$(pwd)` 會被替換為執行 `flexy-sandbox create` 時的當前工作目錄。如果想掛載特定目錄，可以改為絕對路徑。

## 下一步

- 查看 [README.md](./README.md) 了解所有命令和選項
- 查看主專案的 [CLAUDE.md](../CLAUDE.md) 了解 Flexy Sandbox 的完整功能
- 嘗試建立自己的配置模板

## 需要幫助？

如有問題，請：
- 執行 `flexy-sandbox --help` 查看命令說明
- 查看專案文件
- 提交 GitHub Issue
