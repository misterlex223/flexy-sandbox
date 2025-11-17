# Flexy Sandbox CLI - 安裝與測試指南

## 系統需求

- **Node.js**: >= 16.0.0
- **npm**: >= 7.0.0
- **Docker**: 最新版本
- **作業系統**: macOS, Linux, Windows (WSL2)

## 安裝步驟

### 方法 1: 本地開發安裝（推薦用於開發）

```bash
# 1. 進入專案目錄
cd flexy-sandbox-cli

# 2. 安裝依賴
npm install

# 3. 建立符號連結（全域可用）
npm link

# 4. 驗證安裝
flexy-sandbox --version
flexy-sandbox --help
```

### 方法 2: 從 Git 倉庫安裝

```bash
# 1. 克隆倉庫
git clone <repository-url>
cd flexy-sandbox-cli

# 2. 安裝依賴
npm install

# 3. 全域安裝
npm install -g .

# 4. 驗證安裝
flexy-sandbox --version
```

### 方法 3: 從 npm 安裝（發布後）

```bash
# 全域安裝
npm install -g flexy-sandbox-cli

# 驗證安裝
flexy-sandbox --version
```

## 依賴套件安裝

專案依賴會在 `npm install` 時自動安裝：

```json
{
  "commander": "^12.0.0",     // CLI 框架
  "inquirer": "^8.2.6",       // 互動式提示（v8 for CommonJS）
  "dockerode": "^4.0.2",      // Docker API
  "chalk": "^4.1.2",          // 終端顏色（v4 for CommonJS）
  "ora": "^5.4.1",            // Loading spinner（v5 for CommonJS）
  "validator": "^13.11.0",    // 驗證工具
  "cli-table3": "^0.6.3"      // 表格輸出
}
```

## 前置準備

### 1. 確認 Docker 正常運行

```bash
# 檢查 Docker 版本
docker --version

# 測試 Docker 連線
docker ps

# 如果失敗，請啟動 Docker Desktop
```

### 2. 建置 Flexy Sandbox 映像

```bash
# 回到 flexy-sandbox 主專案目錄
cd ..

# 建置 Docker 映像
docker build -t flexy-dev-sandbox:latest .

# 驗證映像存在
docker images | grep flexy-dev-sandbox
```

預期輸出：
```
flexy-dev-sandbox   latest   abc123def456   2 minutes ago   1.2GB
```

## 快速測試

### 測試 1: 檢查命令是否可用

```bash
flexy-sandbox --help
```

預期輸出：
```
Usage: flexy-sandbox [options] [command]

互動式 CLI 工具，用於管理 Flexy Sandbox 容器

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  config             建立或修改配置
  create <config-name>  根據配置建立並啟動容器
  start <name>       啟動已存在的容器
  ...
```

### 測試 2: 建立配置

```bash
flexy-sandbox config
```

選擇「使用預設模板」→「開發環境」→ 輸入配置名稱 `test-dev` → 輸入 API Key → 儲存

預期輸出：
```
🔧 Flexy Sandbox 配置精靈

? 請選擇配置方式: 使用預設模板
? 選擇配置模板: 開發環境 - 單一 AI 工具 + WebTTY + CoSpec Markdown 編輯器，適合個人開發
? 配置名稱: test-dev

請填入 AI 工具的 API Keys:
? CLAUDE API Key (Window 0): [hidden]
ℹ 驗證配置...
? 是否儲存配置? Yes
✓ 配置已儲存: test-dev

使用以下命令建立容器:
  flexy-sandbox create test-dev
```

### 測試 3: 檢查配置文件

```bash
ls ~/.flexy-sandbox/
cat ~/.flexy-sandbox/test-dev.json
```

預期輸出：
```
test-dev.json

{
  "enableWebtty": true,
  "cospecPort": 9280,
  "webttyPort": 9681,
  "aiWindows": [
    {
      "window": 1,
      "type": "claude",
      "apiKey": "sk-ant-xxx...",
      "model": "claude-3-5-sonnet-20241022",
      "baseUrl": ""
    }
  ],
  ...
}
```

### 測試 4: 建立容器

```bash
flexy-sandbox create test-dev
```

預期輸出：
```
✓ Docker 運行正常
✓ Docker 映像存在
✓ 配置載入成功
✓ 容器建立成功
────────────────────────────────────────────────────────
✓ 容器名稱: flexy-test-dev
ℹ 容器 ID: a1b2c3d4e5f6
ℹ WebTTY: http://localhost:9681
ℹ CoSpec Markdown Editor: http://localhost:9280
────────────────────────────────────────────────────────
```

### 測試 5: 列出容器

```bash
flexy-sandbox list
```

預期輸出：
```
┌──────────┬─────────────┬─────────┬──────────────────────┬─────────────────────┐
│ 名稱     │ ID          │ 狀態    │ 端口                 │ 映像                │
├──────────┼─────────────┼─────────┼──────────────────────┼─────────────────────┤
│ test-dev │ a1b2c3d4e5f │ running │ 9681:9681, 9280:9280 │ flexy-dev-sandbox   │
└──────────┴─────────────┴─────────┴──────────────────────┴─────────────────────┘

ℹ 總共 1 個容器
```

### 測試 6: 進入容器 shell

```bash
flexy-sandbox shell test-dev
```

在容器內執行：
```bash
# 測試 Claude CLI
claude --version

# 測試 Node.js
node --version

# 測試 Git
git --version

# 離開容器
exit
```

### 測試 7: 查看日誌

```bash
flexy-sandbox logs test-dev
```

預期輸出：
```
ℹ 容器日誌: test-dev (最後 100 行)
────────────────────────────────────────────────────────
2024-01-09T10:30:00.123Z [init.sh] Starting Flexy Sandbox...
2024-01-09T10:30:01.456Z [init.sh] Installing AI tools...
2024-01-09T10:30:05.789Z [init.sh] Starting CoSpec AI...
...
```

### 測試 8: 停止和刪除容器

```bash
# 停止容器
flexy-sandbox stop test-dev

# 刪除容器
flexy-sandbox delete test-dev
```

## 故障排除

### 問題 1: `command not found: flexy-sandbox`

**原因**：npm link 未成功或 PATH 未包含全域 bin 目錄

**解決方案**：
```bash
# 檢查全域 bin 目錄
npm config get prefix

# 確認 PATH 包含該目錄
echo $PATH | grep $(npm config get prefix)

# 如果沒有，添加到 shell 配置（例如 ~/.zshrc 或 ~/.bashrc）
export PATH="$(npm config get prefix)/bin:$PATH"

# 重新載入 shell 配置
source ~/.zshrc  # 或 source ~/.bashrc
```

### 問題 2: `Error: Cannot find module 'commander'`

**原因**：依賴套件未安裝

**解決方案**：
```bash
npm install
```

### 問題 3: `Docker 未運行或無法連線`

**原因**：Docker 服務未啟動

**解決方案**：
```bash
# macOS/Windows: 啟動 Docker Desktop
# Linux: 啟動 Docker 服務
sudo systemctl start docker
```

### 問題 4: `Docker 映像不存在`

**原因**：Flexy Sandbox 映像未建置

**解決方案**：
```bash
cd /path/to/flexy-sandbox
docker build -t flexy-dev-sandbox:latest .
```

### 問題 5: 端口已被佔用

**錯誤訊息**：
```
Error: (HTTP code 500) server error - Bind for 0.0.0.0:9681 failed: port is already allocated
```

**解決方案**：
```bash
# 1. 找出佔用端口的程序
lsof -i :9681

# 2. 停止該程序或修改配置使用不同端口
vi ~/.flexy-sandbox/test-dev.json
# 修改 webttyPort 為其他端口（如 9682）
```

### 問題 6: API Key 驗證失敗

**原因**：API Key 格式不正確

**解決方案**：
```bash
# 確認 API Key 格式：
# Qwen: sk-xxx
# Claude: sk-ant-xxx
# Gemini: AIza-xxx
# Codex: sk-xxx

# 重新配置
flexy-sandbox config
```

## 開發模式

### 本地開發和測試

```bash
# 1. 修改程式碼
vi src/commands/config.js

# 2. 無需重新安裝，直接測試（因為使用了 npm link）
flexy-sandbox config

# 3. 查看除錯日誌
DEBUG=1 flexy-sandbox create test-dev
```

### 程式碼風格檢查

```bash
# 安裝 ESLint（如果需要）
npm install --save-dev eslint

# 初始化 ESLint 配置
npx eslint --init

# 檢查程式碼
npx eslint src/
```

## 解除安裝

### 解除全域連結

```bash
# 如果使用 npm link
npm unlink -g flexy-sandbox-cli

# 如果使用 npm install -g
npm uninstall -g flexy-sandbox-cli
```

### 清理配置文件

```bash
# 刪除所有配置
rm -rf ~/.flexy-sandbox/
```

### 清理 Docker 容器和映像

```bash
# 刪除所有 Flexy 容器
docker ps -a | grep flexy- | awk '{print $1}' | xargs docker rm -f

# 刪除 Flexy 映像
docker rmi flexy-dev-sandbox:latest
```

## 下一步

安裝完成後，請參考：

- [QUICKSTART.md](./QUICKSTART.md) - 快速入門指南
- [README.md](./README.md) - 完整功能文件
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 專案架構說明

## 需要幫助？

如有問題，請：
1. 檢查本文件的故障排除章節
2. 查看專案 README
3. 提交 GitHub Issue
4. 聯繫維護團隊
