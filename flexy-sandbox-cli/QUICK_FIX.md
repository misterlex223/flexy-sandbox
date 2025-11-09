# 快速修復指南

## 如果你遇到 ES Module 錯誤

### 錯誤 1: "inquirer.prompt is not a function"

```bash
# 快速修復
cd flexy-sandbox-cli
rm -rf node_modules package-lock.json
npm install
npm link

# 測試
flexy-sandbox config
```

### 錯誤 2: "Conf is not a constructor"

這個問題在 v1.0.2 已經修復（改用原生 fs 模組）

### 完整修復步驟

```bash
# 1. 清理舊的安裝
npm unlink -g flexy-sandbox-cli 2>/dev/null || true

# 2. 進入專案目錄
cd flexy-sandbox-cli

# 3. 清理並重新安裝
rm -rf node_modules package-lock.json
npm install

# 4. 重新連結
npm link

# 5. 驗證
flexy-sandbox --version
# 應該顯示: 1.0.2

# 6. 測試
flexy-sandbox config
```

## 為什麼會有這些錯誤？

這是因為許多 npm 套件在新版本中改為使用 **ES Module** (ESM)，而本專案使用 **CommonJS** (CJS)。

### 問題套件和解決方案

| 套件 | 問題版本 | 修復版本 | 說明 |
|------|---------|---------|------|
| `conf` | v11+ | 移除，改用 fs | v11+ 是 ESM |
| `inquirer` | v9+ | v8.2.6 | v9+ 是 ESM |
| `chalk` | v5+ | v4.1.2 | v5+ 是 ESM |
| `ora` | v6+ | v5.4.1 | v6+ 是 ESM |

### 確認版本正確

檢查 `package.json`：

```bash
cat package.json | grep -A 8 dependencies
```

應該看到：
```json
"dependencies": {
  "commander": "^12.0.0",
  "inquirer": "^8.2.6",      ← 重要！必須是 v8
  "dockerode": "^4.0.2",
  "chalk": "^4.1.2",         ← 重要！必須是 v4
  "ora": "^5.4.1",           ← 重要！必須是 v5
  "validator": "^13.11.0",
  "cli-table3": "^0.6.3"
}
```

## 檢查清單

在測試之前，確認：

- [ ] `package.json` 版本是 `1.0.2`
- [ ] `inquirer` 版本是 `^8.2.6`（不是 v9+）
- [ ] `chalk` 版本是 `^4.1.2`（不是 v5+）
- [ ] `ora` 版本是 `^5.4.1`（不是 v6+）
- [ ] 沒有 `conf` 依賴
- [ ] `node_modules` 已清理並重新安裝
- [ ] 已執行 `npm link`

## 測試命令

```bash
# 基本測試
flexy-sandbox --version        # 應該顯示 1.0.2
flexy-sandbox --help           # 應該正常顯示
flexy-sandbox config           # 應該啟動配置精靈（不報錯）
flexy-sandbox list             # 應該正常運行

# 如果全部通過，就可以發布了！
```

## 仍然有問題？

1. **完全清理重來**：
   ```bash
   npm unlink -g flexy-sandbox-cli
   cd flexy-sandbox-cli
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   npm link
   ```

2. **檢查 Node.js 版本**：
   ```bash
   node --version
   # 應該 >= 16.0.0
   ```

3. **手動檢查 node_modules**：
   ```bash
   ls node_modules/inquirer/package.json
   cat node_modules/inquirer/package.json | grep version
   # 應該顯示 8.x.x
   ```

## 成功標誌

當你執行 `flexy-sandbox config` 時，應該看到：

```
🔧 Flexy Sandbox 配置精靈

? 請選擇配置方式: (Use arrow keys)
❯ 使用預設模板
  自訂配置
  載入已存在的配置
```

**沒有任何錯誤訊息** = 成功！✅
