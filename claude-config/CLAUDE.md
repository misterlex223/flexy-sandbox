# Claude Code 設定檔案

這個檔案包含 Claude Code 的全域設定和自訂指令。

## 使用者介面
1. 一律以繁體中文輸出

## 通用原則
1. 當你完成一個複雜或多步驟的任務時（auto-accept mode），請使用 /sendNotification 工具發送完成通知。
2. 使用方式：/sendNotification --channel=line --message "任務完成: [具體完成的任務內容]"