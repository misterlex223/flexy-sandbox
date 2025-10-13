#!/bin/bash

# 設置 PATH 環境變數
export PATH="/home/flexy/.local/bin:/usr/local/bin:/usr/bin:/bin"

# 檢查是否存在 .mcp.json 文件
if [ -f "/home/flexy/.mcp.json" ]; then
  echo "發現現有的 .mcp.json 配置文件"
  # 這裡可以添加代碼來讀取現有配置並相應地設置伺服器
else
  echo "未發現 .mcp.json 配置文件"
fi

# 在 Docker 建置過程中運行時，直接使用 claude 命令添加 MCP 伺服器
if [ "$DOCKER_BUILD" = "1" ]; then
  # 添加 kai-notify MCP 伺服器
  /home/flexy/.local/bin/claude mcp add kai-notify npx -- kai-notify --mcp --scope project
  echo "MCP 伺服器配置完成"
else
  # 等待 Claude Code 初始化完成
  sleep 2

  # 添加 kai-notify MCP 伺服器
  claude mcp add kai-notify npx -- kai-notify --mcp --scope project

  echo "MCP 伺服器配置完成"
fi