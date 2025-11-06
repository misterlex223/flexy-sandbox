# 中文輸入重複問題修復指南

## 問題描述

在 WebTTY 模式下使用中文輸入法（IME）時，輸入的中文字會重複顯示。例如：
- 輸入「測試」
- 實際顯示「測試測試」

## 根本原因

此問題源自 **xterm.js** 函式庫的 IME 組合事件處理邏輯缺陷，該函式庫被 **ttyd** 使用來提供網頁終端功能。

### 技術細節

1. **雙重事件觸發**：某些中文輸入法（如搜狗輸入法、QQ拼音）會同時觸發：
   - `compositionend` 事件（包含最終組合文字）
   - 一般的 `input` 事件（包含相同文字）

2. **compositionend 事件遺失**：部分輸入法在特定瀏覽器中不會可靠地觸發 `compositionend` 事件，導致 CompositionHelper 兩次處理相同輸入

3. **去重邏輯失效**：xterm.js 的去重邏輯在特定瀏覽器+輸入法組合下會失效

### 受影響的環境

已知會出現問題的組合：
- **搜狗輸入法** (Sogou IME)
- **QQ拼音** (QQ Pinyin)
- **Microsoft Edge + Windows 預設輸入法**
- **macOS 內建輸入法**（偶爾）

## 解決方案

本專案已實施以下三層修復：

### 1. 升級 ttyd 至最新版本

**變更**：`Dockerfile:27-31`

```dockerfile
# Install latest ttyd from GitHub releases (fixes Chinese IME duplication issues)
# Using version 1.7.7 or later which includes xterm.js fixes for IME composition
RUN TTYD_VERSION=1.7.7 && \
    wget -q https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.x86_64 -O /usr/local/bin/ttyd && \
    chmod +x /usr/local/bin/ttyd
```

**效果**：
- 使用包含 xterm.js IME 修復的最新版本
- 取代 Ubuntu 22.04 倉庫中過時的版本
- 包含針對 Sogou IME、QQ Pinyin 的特定修復

### 2. 優化 ttyd 啟動參數

**變更**：`init.sh:272-276`

```bash
# Start ttyd with the tmux session
# -W flag allows write access
# -t flag sets terminal type to xterm-256color for better compatibility
LANG=zh_TW.UTF-8 LC_ALL=zh_TW.UTF-8 ttyd -p 9681 -W -t "xterm-256color" tmux new -A -s shared_session
```

**參數說明**：
- `-W`：允許寫入存取（WebTTY 模式必需）
- `-t "xterm-256color"`：設定終端類型以提升相容性
- `LANG=zh_TW.UTF-8 LC_ALL=zh_TW.UTF-8`：確保 UTF-8 中文支援

### 3. 優化 tmux 配置

**新增檔案**：`sandbox-config/.tmux.conf`

關鍵配置項：
```bash
# 設定預設終端類型
set -g default-terminal "xterm-256color"

# 減少按鍵延遲，改善輸入響應
set -s escape-time 0

# 確保 tmux 正確處理 bracketed paste mode（避免 IME 輸入被誤判為貼上）
set -g assume-paste-time 1

# 設定終端編碼為 UTF-8
set -gq utf8 on
set -gq status-utf8 on
```

**效果**：
- 減少輸入延遲（`escape-time 0`）
- 避免 IME 輸入被誤判為貼上操作（`assume-paste-time 1`）
- 強制 UTF-8 編碼支援

## 測試與驗證

### 1. 重建 Docker 映像

```bash
cd /Users/lex.yang/RD/cotandem/templates/flexy-sandbox
docker build -t flexy-dev-sandbox:latest .
```

### 2. 啟動測試容器

```bash
docker run -d --rm \
  -p 9681:9681 \
  -p 9280:9280 \
  -e ENABLE_WEBTTY=true \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  -v $(pwd):/home/flexy/workspace \
  --name flexy-test \
  flexy-dev-sandbox:latest
```

### 3. 測試中文輸入

1. 在瀏覽器中開啟 `http://localhost:9681`
2. 使用中文輸入法輸入測試文字：
   - 測試
   - 你好世界
   - 繁體中文輸入測試

3. 驗證結果：
   - ✅ **成功**：文字只顯示一次
   - ❌ **失敗**：文字重複顯示

### 4. 驗證 ttyd 版本

```bash
docker exec flexy-test ttyd --version
```

應該顯示 `ttyd version 1.7.7` 或更高版本。

### 5. 驗證 tmux 配置

```bash
docker exec flexy-test tmux show-options -g | grep -E "escape-time|assume-paste-time|default-terminal"
```

應該顯示：
```
escape-time 0
assume-paste-time 1
default-terminal "xterm-256color"
```

## 替代方案（如果問題仍然存在）

### 方案 A：嘗試不同的瀏覽器

某些瀏覽器的 IME 處理更好：
- **推薦**：Chrome/Chromium（IME 處理最佳）
- **備選**：Firefox
- **避免**：Microsoft Edge（已知有 IME 問題）

### 方案 B：切換輸入法

測試不同的中文輸入法：
- **Windows**：Microsoft Pinyin（微軟拼音）
- **macOS**：內建輸入法
- **跨平台**：Google Input Tools

### 方案 C：使用 SSH 取代 WebTTY

如果 WebTTY 的 IME 問題無法解決：

```bash
# 啟動容器並映射 SSH 端口
docker run -d --rm \
  -p 2222:22 \
  -e ANTHROPIC_AUTH_TOKEN=your_token \
  -v $(pwd):/home/flexy/workspace \
  --name flexy-ssh \
  flexy-dev-sandbox:latest

# 使用 SSH 連線（IME 處理由本地終端負責）
ssh -p 2222 flexy@localhost
# 密碼: dockerSandbox
```

**優點**：
- 本地終端模擬器直接處理 IME，無 WebTTY 中間層
- 更穩定的中文輸入體驗
- 支援所有終端功能（剪貼簿、快捷鍵等）

**缺點**：
- 需要 SSH 客戶端
- 無法透過瀏覽器直接存取

## 診斷工具

### 檢查容器日誌

```bash
# ttyd 日誌（如果有啟動問題）
docker logs flexy-test 2>&1 | grep ttyd

# AI 監控器日誌
docker exec flexy-test cat /home/flexy/ai-monitor.log

# tmux 伺服器狀態
docker exec flexy-test tmux info
```

### 瀏覽器開發者工具

1. 開啟 `http://localhost:9681`
2. 按 F12 開啟開發者工具
3. 切換到 Console 標籤
4. 輸入中文時觀察事件：
   - 正常：`compositionstart` → `compositionupdate` → `compositionend` → `input`
   - 異常：多次 `input` 事件或缺少 `compositionend`

### WebSocket 流量分析

```javascript
// 在瀏覽器 Console 中執行
const ws = new WebSocket('ws://localhost:9681/ws');
ws.onmessage = (event) => {
  console.log('Received:', event.data);
};
```

觀察輸入中文時是否有重複的資料傳送。

## 相關資源

### 上游議題追蹤

- **ttyd Issue #1471**: Use qwen code on webpage and typing some Chinese word make the web terminal move left
- **xterm.js Issue #3679**: Sogou IME Broken (已修復於 v4.19.0)
- **xterm.js Issue #3533**: Sogou IME Character Doubling
- **xterm.js PR #3251**: QQ Pinyin/Rime IME Fix

### 參考文件

- [ttyd GitHub Releases](https://github.com/tsl0922/ttyd/releases)
- [xterm.js IME 文件](https://github.com/xtermjs/xterm.js/blob/master/src/browser/input/CompositionHelper.ts)
- [tmux Manual](https://man.openbsd.org/tmux)

## 故障排除

### 問題：升級後仍然有重複

**可能原因**：
- 瀏覽器快取未清除
- 使用了不相容的輸入法
- tmux 配置未生效

**解決方法**：
1. 清除瀏覽器快取並重新整理
2. 嘗試不同瀏覽器或輸入法
3. 驗證 tmux 配置：`docker exec flexy-test cat /home/flexy/.tmux.conf`

### 問題：ttyd 無法啟動

**可能原因**：
- 下載的二進位檔不相容
- 權限問題

**解決方法**：
```bash
# 檢查 ttyd 是否可執行
docker run --rm flexy-dev-sandbox:latest ttyd --version

# 如果失敗，檢查 Dockerfile 中的架構（x86_64 vs arm64）
# ARM64 (Apple Silicon) 需要使用不同的二進位檔：
# ttyd.aarch64
```

### 問題：部分輸入法仍然重複

**說明**：
這是已知的限制。部分輸入法的事件觸發機制與 xterm.js 不相容。

**建議**：
- 使用 SSH 方式連線（方案 C）
- 切換到相容性更好的輸入法

## 技術架構

```
瀏覽器 (IME 輸入)
    ↓
WebSocket (ttyd)
    ↓
xterm.js (CompositionHelper)
    ↓
tmux (UTF-8 處理)
    ↓
Shell (顯示輸出)
```

每一層都可能影響中文輸入的正確性，本修復方案針對所有層級進行優化。

## 版本歷史

- **2025-01-XX**: 初始修復（升級 ttyd + 優化 tmux 配置）
- **待定**: 監控 xterm.js v5.x 的進一步 IME 改進

## 貢獻與回報

如果此修復未能解決你的問題，請提供以下資訊以便診斷：

1. **環境資訊**：
   - 作業系統（Windows/macOS/Linux）
   - 瀏覽器版本
   - 輸入法名稱和版本

2. **重現步驟**：
   - 具體的輸入文字
   - 實際顯示結果
   - 瀏覽器 Console 的錯誤訊息

3. **診斷資訊**：
   - `docker logs` 輸出
   - `ttyd --version` 輸出
   - `tmux show-options -g` 輸出

請在專案 GitHub Issues 中回報問題。
