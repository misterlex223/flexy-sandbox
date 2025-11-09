# 配置編輯功能使用指南

## 概述

v1.0.3 新增了完整的互動式配置編輯功能，讓你可以在不手動編輯 JSON 檔案的情況下修改配置。

## 啟動編輯功能

```bash
# 啟動配置精靈
flexy-sandbox config

# 選擇流程：
# 1. 選擇「載入已存在的配置」
# 2. 選擇要編輯的配置
# 3. 選擇「編輯配置」
```

## 編輯功能總覽

編輯器提供四大類設定的編輯：

### 1️⃣ 基本設定

可編輯：
- **WebTTY 啟用/停用**
- **WebTTY 端口**（預設 9681）
- **CoSpec 端口**（預設 9280）

### 2️⃣ AI Windows

支援操作：
- ✅ **查看** - 列出所有已配置的 AI Windows
- ➕ **新增** - 添加新的 AI 工具（最多 5 個）
- ✏️ **編輯** - 修改 API Key、模型名稱或 Base URL
- ❌ **刪除** - 移除 AI Window（自動重新編號）

### 3️⃣ Volume 掛載

支援操作：
- ✅ **查看** - 列出所有 Volume 掛載
- ➕ **新增** - 添加新的掛載點
- ❌ **刪除** - 移除 Volume

### 4️⃣ 環境變數

支援操作：
- ✅ **查看** - 列出所有環境變數
- ➕ **新增** - 添加新的環境變數（需符合命名規則）
- ✏️ **編輯** - 修改環境變數的值
- ❌ **刪除** - 移除環境變數

## 使用範例

### 範例 1: 修改 WebTTY 端口

```
🔧 Flexy Sandbox 配置精靈

? 請選擇配置方式: 載入已存在的配置
? 選擇配置: my-dev
? 選擇操作: 編輯配置

✏️  編輯配置

? 選擇要編輯的項目: 基本設定 (WebTTY, 端口)

目前設定:
  WebTTY: 啟用
  WebTTY 端口: 9681
  CoSpec 端口: 9280

? 啟用 WebTTY? Yes
? WebTTY 端口: 9682  ← 修改為 9682
? CoSpec 端口: 9280

? 選擇要編輯的項目: 完成編輯
? 是否儲存配置? Yes
✓ 配置已儲存: my-dev
```

### 範例 2: 新增 AI Window

```
✏️  編輯配置

? 選擇要編輯的項目: AI Windows

目前有 1 個 AI Windows

? 選擇操作: 新增 AI Window

新增 AI Window 1:
? AI 工具類型: gemini
? API Key: [hidden]
? 模型名稱 (可選): gemini-pro
? API Base URL (可選):

✓ 已添加

? 選擇操作: 返回
? 選擇要編輯的項目: 完成編輯
```

### 範例 3: 編輯 AI Window 的 API Key

```
✏️  編輯配置

? 選擇要編輯的項目: AI Windows

目前有 2 個 AI Windows

? 選擇操作: 編輯 AI Window
? 選擇要編輯的 Window: Window 0: claude

編輯 Window 0 (claude):
? 選擇要編輯的欄位: API Key
? 新的 API Key: [hidden]

✓ 已更新

? 選擇操作: 返回
? 選擇要編輯的項目: 完成編輯
```

### 範例 4: 刪除 AI Window

```
✏️  編輯配置

? 選擇要編輯的項目: AI Windows

目前有 2 個 AI Windows

? 選擇操作: 刪除 AI Window
? 選擇要刪除的 Window: Window 1: gemini
? 確定要刪除 Window 1? Yes

✓ 已刪除

(Window 編號會自動重新調整)
```

### 範例 5: 新增 Volume 掛載

```
✏️  編輯配置

? 選擇要編輯的項目: Volume 掛載

目前有 1 個 Volumes

? 選擇操作: 新增 Volume
? Host 路徑: ~/.gitconfig
? Container 路徑: /home/flexy/.gitconfig
? 只讀模式? Yes

✓ 已添加

? 選擇操作: 返回
? 選擇要編輯的項目: 完成編輯
```

### 範例 6: 新增環境變數

```
✏️  編輯配置

? 選擇要編輯的項目: 環境變數

目前有 2 個環境變數

? 選擇操作: 新增環境變數
? 環境變數名稱: GITHUB_TOKEN
? 值: ghp_xxxxxxxxxxxx

✓ 已添加

? 選擇操作: 返回
? 選擇要編輯的項目: 完成編輯
```

## 特色功能

### 🔄 連續編輯

編輯器採用遞迴式選單，你可以：
1. 編輯基本設定
2. 新增 2 個 AI Windows
3. 修改某個 AI Window 的 API Key
4. 新增 Volume
5. 完成編輯並儲存

**無需退出重新進入**，一次完成所有修改！

### ✅ 即時驗證

- **環境變數名稱**：自動檢查格式（大寫字母、數字、底線）
- **端口號**：確保是有效的端口範圍
- **AI Window 數量**：最多 5 個（Window 0-4）

### 🔒 安全輸入

- **API Keys** 使用密碼模式輸入（顯示為 `*`）
- **確認提示** 在刪除操作前都會確認

### 📊 即時顯示

在編輯前會顯示目前的設定：
```
目前設定:
  WebTTY: 啟用
  WebTTY 端口: 9681
  CoSpec 端口: 9280

目前有 2 個 AI Windows
  [0] Window 0: claude (claude-3-5-sonnet-20241022)
  [1] Window 1: gemini (gemini-pro)

目前有 3 個 Volumes
  [0] $(pwd) → /home/flexy/workspace
  [1] ~/.gitconfig → /home/flexy/.gitconfig (只讀)
  [2] ~/.ssh → /home/flexy/.ssh (只讀)
```

## 編輯後的操作

編輯完成後，你可以：

1. **儲存配置**
   ```
   ? 是否儲存配置? Yes
   ✓ 配置已儲存: my-dev
   ```

2. **立即使用**（如果選擇「使用配置」）
   ```bash
   flexy-sandbox create my-dev
   ```

## 常見問題

### Q: 編輯會影響已運行的容器嗎？

A: 不會。編輯只修改配置文件，不影響已建立的容器。需要重新建立容器才會使用新配置。

### Q: 可以同時編輯多個配置嗎？

A: 一次只能編輯一個配置，但可以在編輯過程中修改多個項目。

### Q: 刪除 AI Window 後編號會改變嗎？

A: 會。刪除後會自動重新編號，確保 Window 編號連續（0, 1, 2...）。

### Q: 環境變數名稱有什麼限制？

A: 必須符合以下規則：
- 只能包含大寫字母、數字和底線
- 不能以數字開頭
- 範例：`GITHUB_TOKEN`, `API_KEY_1`, `MY_VAR`

### Q: 如果編輯到一半想取消？

A: 在最後的儲存提示選擇 `No` 即可放棄所有修改。

### Q: 可以直接編輯 JSON 檔案嗎？

A: 可以！配置文件位於 `~/.flexy-sandbox/<name>.json`，你可以直接用文字編輯器修改。

## 技術細節

### 自動重新編號

刪除 AI Window 時，系統會自動重新編號：

**刪除前**：
```
Window 0: claude
Window 1: gemini
Window 2: qwen
```

**刪除 Window 1 後**：
```
Window 0: claude
Window 1: qwen  ← 自動從 2 變為 1
```

### 配置結構

編輯後的配置仍保持標準 JSON 格式：

```json
{
  "enableWebtty": true,
  "webttyPort": 9681,
  "cospecPort": 9280,
  "aiWindows": [
    {
      "window": 0,
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
    "GITHUB_TOKEN": "ghp_xxx"
  }
}
```

## 下一步

編輯完成後：

```bash
# 建立容器使用新配置
flexy-sandbox create my-dev

# 或查看配置內容
cat ~/.flexy-sandbox/my-dev.json
```

## 需要幫助？

如有問題：
- 查看 [README.md](./README.md) 了解完整功能
- 查看 [QUICKSTART.md](./QUICKSTART.md) 快速入門
- 提交 GitHub Issue
