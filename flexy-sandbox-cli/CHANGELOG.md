# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2025-01-09

### Added
- **完整的配置編輯功能**: 實作互動式配置編輯器
  - 編輯基本設定（WebTTY、端口）
  - 新增/編輯/刪除 AI Windows
  - 新增/刪除 Volume 掛載
  - 新增/編輯/刪除環境變數
  - 遞迴式選單，可連續編輯多個項目
  - 所有操作都有確認提示

### Changed
- 改善配置載入流程的使用體驗
- 增強互動式提示的清晰度

## [1.0.2] - 2025-01-09

### Fixed
- **降級 `inquirer` 到 v8.2.6**: 修復 "inquirer.prompt is not a function" 錯誤
  - `inquirer` v9+ 使用 ES Module，與 CommonJS 不相容
  - 降級到 v8.2.6（最後的 CommonJS 版本）
  - 功能完全相同，所有互動式提示正常工作

### Changed
- 更新依賴版本，確保所有套件與 CommonJS 相容

## [1.0.1] - 2025-01-09

### Fixed
- **移除 `conf` 依賴**: 修復 "Conf is not a constructor" 錯誤
  - `conf` v11+ 使用 ES Module，與 CommonJS 不相容
  - 改用原生 Node.js `fs` 模組管理配置文件
  - 功能完全相同，無需額外依賴

### Changed
- ConfigManager 不再依賴外部套件
- 更新文件中的依賴清單

## [1.0.0] - 2025-01-09

### Added
- 初始版本發布
- 互動式配置精靈
- 4 種預設配置模板（dev, multi-ai, team, minimal）
- 完整容器生命週期管理
- 配置驗證功能
- 美化的終端輸出
- 完整的文件（README, QUICKSTART, INSTALL, PROJECT_SUMMARY）
