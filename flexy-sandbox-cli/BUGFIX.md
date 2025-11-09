# Bug 修復指南

## 問題 1: inquirer.prompt is not a function

### 錯誤訊息
```
✗ 配置失敗: inquirer.prompt is not a function
✗ inquirer.prompt is not a function
```

### 原因
- `inquirer` v9+ 版本使用 ES Module
- 與專案的 CommonJS 語法不相容

### 解決方案

#### 方案 1: 更新到最新版本（推薦）

```bash
# 解除安裝舊版本
npm uninstall -g flexy-sandbox-cli

# 安裝最新版本（1.0.2+）
npm install -g flexy-sandbox-cli@latest

# 驗證版本
flexy-sandbox --version
```

#### 方案 2: 手動修復（如果使用本地開發版本）

1. **更新 package.json**

將 `inquirer` 版本改為 `^8.2.6`：

```json
{
  "dependencies": {
    "inquirer": "^8.2.6"
  }
}
```

2. **重新安裝依賴**

```bash
rm -rf node_modules package-lock.json
npm install
npm link
```

---

## 問題 2: Conf is not a constructor

### 錯誤訊息
```
✗ Conf is not a constructor
```

### 原因
- `conf` v11+ 版本使用 ES Module
- 與專案的 CommonJS 語法不相容

### 解決方案

#### 方案 1: 更新到最新版本（推薦）

```bash
# 解除安裝舊版本
npm uninstall -g flexy-sandbox-cli

# 安裝最新版本（1.0.1+）
npm install -g flexy-sandbox-cli@latest

# 驗證版本
flexy-sandbox --version
```

#### 方案 2: 手動修復（如果使用本地開發版本）

1. **更新 package.json**

編輯 `package.json`，移除 `conf` 依賴：

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "inquirer": "^9.2.15",
    "dockerode": "^4.0.2",
    "chalk": "^4.1.2",
    "ora": "^5.4.1",
    "validator": "^13.11.0",
    "cli-table3": "^0.6.3"
  }
}
```

2. **更新 ConfigManager**

編輯 `src/lib/configManager.js`，移除第 1 行的 `const Conf = require('conf');`

將建構函式改為：

```javascript
class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), CONFIG_DIR);
  }
  // ... 其他程式碼保持不變
}
```

3. **重新安裝依賴**

```bash
# 移除舊的 node_modules
rm -rf node_modules package-lock.json

# 重新安裝
npm install

# 測試
flexy-sandbox config
```

### 驗證修復

執行以下命令確認問題已解決：

```bash
flexy-sandbox config
```

應該看到：
```
🔧 Flexy Sandbox 配置精靈

? 請選擇配置方式: (Use arrow keys)
❯ 使用預設模板
  自訂配置
  載入已存在的配置
```

### 其他相關問題

#### 如果遇到其他 ES Module 錯誤

某些套件（如 `chalk` v5+, `ora` v6+）也使用 ES Module。本專案固定使用 CommonJS 相容的版本：

- `chalk`: 4.1.2（最後的 CommonJS 版本）
- `ora`: 5.4.1（最後的 CommonJS 版本）

### 需要幫助？

如果問題仍未解決：

1. 檢查 Node.js 版本：`node --version`（需要 >= 16.0.0）
2. 清除 npm 快取：`npm cache clean --force`
3. 重新安裝：`npm install -g flexy-sandbox-cli@latest`
4. 提交 Issue：[GitHub Issues](https://github.com/your-org/flexy-sandbox-cli/issues)

## 版本歷史

- **v1.0.2** (2025-01-09): 修復 inquirer ES Module 錯誤，降級到 v8.2.6
- **v1.0.1** (2025-01-09): 修復 Conf 錯誤，改用原生 fs 模組
- **v1.0.0** (2025-01-09): 初始版本
