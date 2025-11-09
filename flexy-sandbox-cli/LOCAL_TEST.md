# 本地測試指南

在發布到 npm 之前，應該在本地進行完整測試，確保所有功能正常運作。

## 測試方法

### 方法 1: npm link（推薦）

這是最接近真實安裝的測試方法。

#### 步驟

```bash
# 1. 進入專案目錄
cd flexy-sandbox-cli

# 2. 安裝依賴
npm install

# 3. 建立全域符號連結
npm link

# 4. 驗證安裝
which flexy-sandbox
# 應該顯示: /usr/local/bin/flexy-sandbox 或類似路徑

flexy-sandbox --version
# 應該顯示: 1.0.1
```

#### 測試完成後解除連結

```bash
# 解除全域連結
npm unlink -g flexy-sandbox-cli

# 或者
npm unlink -g
```

### 方法 2: npm pack（模擬發布）

這個方法會建立一個 `.tgz` 檔案，就像發布到 npm 時的檔案。

#### 步驟

```bash
# 1. 進入專案目錄
cd flexy-sandbox-cli

# 2. 打包（會建立 flexy-sandbox-cli-1.0.1.tgz）
npm pack

# 3. 全域安裝打包檔案
npm install -g ./flexy-sandbox-cli-1.0.1.tgz

# 4. 驗證安裝
flexy-sandbox --version

# 5. 測試功能
flexy-sandbox config
```

#### 測試完成後解除安裝

```bash
npm uninstall -g flexy-sandbox-cli
```

### 方法 3: 直接執行（快速測試）

適合快速測試某個命令。

```bash
# 在專案目錄下
cd flexy-sandbox-cli

# 直接執行
node bin/flexy-sandbox.js --help
node bin/flexy-sandbox.js config
node bin/flexy-sandbox.js list
```

## 完整測試清單

### 1. 基本命令測試

```bash
# 版本資訊
flexy-sandbox --version

# 幫助訊息
flexy-sandbox --help
flexy-sandbox config --help
flexy-sandbox create --help
```

### 2. 配置功能測試

#### 測試 2.1: 使用預設模板建立配置

```bash
flexy-sandbox config

# 選擇流程:
# 1. 選擇「使用預設模板」
# 2. 選擇「開發環境」
# 3. 輸入配置名稱: test-dev
# 4. 輸入 API Key（可以用假的測試）: sk-ant-test123
# 5. 選擇儲存
```

**預期結果**：
```
✓ 配置已儲存: ~/.flexy-sandbox/test-dev.json
```

**驗證**：
```bash
ls ~/.flexy-sandbox/
cat ~/.flexy-sandbox/test-dev.json
```

#### 測試 2.2: 自訂配置

```bash
flexy-sandbox config

# 選擇流程:
# 1. 選擇「自訂配置」
# 2. 輸入配置名稱: test-custom
# 3. 啟用 WebTTY: Yes
# 4. WebTTY 端口: 9681
# 5. CoSpec 端口: 9280
# 6. AI 工具數量: 1
# 7. AI 類型: claude
# 8. API Key: sk-ant-test456
# 9. 工作目錄: $(pwd)
```

**預期結果**：配置成功儲存

#### 測試 2.3: 載入已存在的配置

```bash
flexy-sandbox config

# 選擇流程:
# 1. 選擇「載入已存在的配置」
# 2. 應該看到 test-dev 和 test-custom
# 3. 選擇 test-dev
# 4. 選擇「檢視配置」
```

**預期結果**：顯示配置內容

### 3. 配置驗證測試

#### 測試 3.1: 無效的 API Key 格式

建立一個配置，故意使用錯誤的 API Key 格式（例如 "abc123"），驗證器應該警告（目前驗證較寬鬆，只檢查不為空）。

#### 測試 3.2: 無效的端口

手動編輯配置檔案：
```bash
vi ~/.flexy-sandbox/test-dev.json
# 將 webttyPort 改為 999999（無效）
```

然後嘗試建立容器，應該會有錯誤提示。

### 4. 容器管理測試（需要 Docker）

**前提**：
- Docker 已安裝並運行
- Flexy Sandbox 映像已建置

```bash
# 檢查 Docker
docker ps

# 檢查映像
docker images | grep flexy-dev-sandbox
```

#### 測試 4.1: 建立容器

```bash
flexy-sandbox create test-dev
```

**預期結果**：
```
✓ Docker 運行正常
✓ Docker 映像存在
✓ 配置載入成功
✓ 容器建立成功
────────────────────────────────────────────────────────
✓ 容器名稱: flexy-test-dev
ℹ 容器 ID: xxxxxxxxxxxx
ℹ WebTTY: http://localhost:9681
ℹ CoSpec Markdown Editor: http://localhost:9280
────────────────────────────────────────────────────────
```

**驗證**：
```bash
docker ps | grep flexy-test-dev
```

#### 測試 4.2: 列出容器

```bash
flexy-sandbox list
```

**預期結果**：表格顯示容器資訊

#### 測試 4.3: 查看日誌

```bash
# 查看最後 50 行
flexy-sandbox logs test-dev -n 50

# 實時追蹤（按 Ctrl+C 停止）
flexy-sandbox logs test-dev -f
```

#### 測試 4.4: 進入容器 shell

```bash
flexy-sandbox shell test-dev

# 在容器內測試
pwd
ls -la
node --version
python3 --version

# 離開
exit
```

#### 測試 4.5: 容器生命週期

```bash
# 停止容器
flexy-sandbox stop test-dev

# 驗證
flexy-sandbox list
# 狀態應該是 exited

# 啟動容器
flexy-sandbox start test-dev

# 驗證
flexy-sandbox list
# 狀態應該是 running

# 暫停容器
flexy-sandbox pause test-dev

# 驗證
flexy-sandbox list
# 狀態應該是 paused

# 恢復容器
flexy-sandbox unpause test-dev

# 驗證
flexy-sandbox list
# 狀態應該是 running
```

#### 測試 4.6: 刪除容器

```bash
flexy-sandbox delete test-dev

# 應該詢問確認
? 確定要刪除容器 test-dev? Yes
? 是否同時刪除配置檔案? No

# 驗證
flexy-sandbox list
# 應該沒有 test-dev
```

### 5. 錯誤處理測試

#### 測試 5.1: Docker 未運行

```bash
# 停止 Docker Desktop
# 然後執行
flexy-sandbox create test-dev
```

**預期結果**：
```
✗ Docker 未運行或無法連線
```

#### 測試 5.2: 映像不存在

```bash
# 暫時重命名映像
docker tag flexy-dev-sandbox:latest flexy-dev-sandbox:backup
docker rmi flexy-dev-sandbox:latest

# 執行
flexy-sandbox create test-dev
```

**預期結果**：
```
✗ Docker 映像不存在
請先建置 Flexy Sandbox 映像
```

**恢復**：
```bash
docker tag flexy-dev-sandbox:backup flexy-dev-sandbox:latest
```

#### 測試 5.3: 配置不存在

```bash
flexy-sandbox create non-existent-config
```

**預期結果**：
```
✗ 配置不存在: non-existent-config
```

#### 測試 5.4: 端口衝突

```bash
# 建立第一個容器
flexy-sandbox create test-dev

# 嘗試建立第二個使用相同端口的容器
flexy-sandbox create test-custom
```

**預期結果**：Docker 錯誤訊息關於端口已被佔用

### 6. 模板測試

測試所有 4 個預設模板：

```bash
# 1. 開發環境
flexy-sandbox config
# 選擇 dev 模板

# 2. 多 AI 測試環境
flexy-sandbox config
# 選擇 multi-ai 模板

# 3. 團隊協作環境
flexy-sandbox config
# 選擇 team 模板

# 4. 最小配置
flexy-sandbox config
# 選擇 minimal 模板
```

**驗證**：
```bash
ls ~/.flexy-sandbox/
# 應該看到 4 個配置檔案
```

### 7. 邊界測試

#### 測試 7.1: 超長配置名稱

```bash
flexy-sandbox config
# 輸入超長名稱（100+ 字元）
```

#### 測試 7.2: 特殊字元配置名稱

```bash
flexy-sandbox config
# 輸入包含特殊字元的名稱（如 test@config, test/config）
```

**預期結果**：驗證器應該拒絕無效名稱

#### 測試 7.3: 最大 AI Windows

```bash
flexy-sandbox config
# 自訂配置，輸入 5 個 AI 工具（最大值）
```

#### 測試 7.4: 超過最大 AI Windows

手動編輯配置檔案，添加第 6 個 AI window，然後嘗試建立容器。

### 8. 配置文件操作測試

```bash
# 列出所有配置
ls ~/.flexy-sandbox/

# 查看配置內容
cat ~/.flexy-sandbox/test-dev.json

# 手動編輯配置
vi ~/.flexy-sandbox/test-dev.json
# 修改某些值

# 使用修改後的配置建立容器
flexy-sandbox create test-dev
```

## 自動化測試腳本

建立一個測試腳本 `test-local.sh`：

```bash
#!/bin/bash

echo "=== Flexy Sandbox CLI 本地測試 ==="

# 測試 1: 版本
echo -e "\n[測試 1] 版本檢查"
flexy-sandbox --version

# 測試 2: 幫助
echo -e "\n[測試 2] 幫助訊息"
flexy-sandbox --help | head -5

# 測試 3: 列出配置
echo -e "\n[測試 3] 現有配置"
ls -la ~/.flexy-sandbox/ 2>/dev/null || echo "配置目錄不存在（正常）"

# 測試 4: 列出容器
echo -e "\n[測試 4] Docker 容器"
flexy-sandbox list

# 測試 5: 檢查所有命令是否可用
echo -e "\n[測試 5] 命令可用性"
commands=("config" "create" "start" "stop" "pause" "unpause" "delete" "list" "logs" "shell" "inspect")
for cmd in "${commands[@]}"; do
  if flexy-sandbox $cmd --help &>/dev/null; then
    echo "✓ $cmd"
  else
    echo "✗ $cmd (可能需要參數)"
  fi
done

echo -e "\n=== 測試完成 ==="
```

執行：
```bash
chmod +x test-local.sh
./test-local.sh
```

## npm pack 檢查清單

在執行 `npm pack` 之前，確認這些檔案會被包含：

```bash
# 執行 dry-run
npm pack --dry-run

# 檢查輸出，應該包含:
# - bin/flexy-sandbox.js
# - src/**/*.js
# - templates/*.json
# - package.json
# - README.md

# 不應該包含:
# - node_modules/
# - test/
# - .git/
# - 開發相關檔案
```

## 測試通過標準

所有以下測試都應該通過：

- ✅ 所有命令都可以執行（--help 不報錯）
- ✅ 配置精靈可以正常運行
- ✅ 配置文件可以正確儲存和載入
- ✅ 配置驗證功能正常
- ✅ 容器可以正常建立、啟動、停止、刪除
- ✅ 日誌和 shell 功能正常
- ✅ 錯誤處理友善且清晰
- ✅ 沒有 "Conf is not a constructor" 錯誤
- ✅ 所有 4 個模板都可以正常使用

## 測試完成後

```bash
# 清理測試配置
rm -rf ~/.flexy-sandbox/test-*

# 清理測試容器
docker ps -a | grep flexy-test | awk '{print $1}' | xargs docker rm -f

# 解除本地安裝
npm unlink -g flexy-sandbox-cli
# 或
npm uninstall -g flexy-sandbox-cli
```

## 下一步：發布到 npm

測試通過後，參考 [發布指南](./PUBLISH.md) 進行發布。
