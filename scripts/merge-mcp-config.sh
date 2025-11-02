#!/bin/bash
# MCP 配置合併腳本
# 功能：智慧合併預設 MCP 配置和使用者自訂配置
# 策略：保留預設伺服器（github, docker, kai-notify），並添加使用者自訂的額外伺服器

set -e

DEFAULT_CONFIG="$1"
USER_CONFIG="$2"
OUTPUT_CONFIG="$3"

# 檢查參數
if [ -z "$DEFAULT_CONFIG" ] || [ -z "$USER_CONFIG" ] || [ -z "$OUTPUT_CONFIG" ]; then
    echo "Usage: $0 <default-config> <user-config> <output-config>"
    echo "Example: $0 /home/flexy/default-mcp.json /home/flexy/.claude/.mcp.json /home/flexy/.claude/.mcp.json"
    exit 1
fi

# 如果使用者配置不存在，直接複製預設配置
if [ ! -f "$USER_CONFIG" ]; then
    echo "使用者 MCP 配置不存在，使用預設配置..."
    cp "$DEFAULT_CONFIG" "$OUTPUT_CONFIG"
    exit 0
fi

# 檢查是否安裝了 jq（用於 JSON 合併）
if ! command -v jq &> /dev/null; then
    echo "警告: jq 未安裝，無法合併 JSON 配置"
    echo "將使用使用者配置覆蓋預設配置..."
    cp "$USER_CONFIG" "$OUTPUT_CONFIG"
    exit 0
fi

# 使用 jq 合併兩個 JSON 配置
# 策略：預設配置 + 使用者配置，使用者配置中的同名伺服器會覆蓋預設
echo "正在合併 MCP 配置..."
jq -s '
  .[0] as $default |
  .[1] as $user |
  {
    mcp: {
      servers: ($default.mcp.servers + $user.mcp.servers)
    }
  }
' "$DEFAULT_CONFIG" "$USER_CONFIG" > "$OUTPUT_CONFIG"

echo "✓ MCP 配置合併完成: $OUTPUT_CONFIG"

# 顯示合併後的伺服器列表
echo "已配置的 MCP 伺服器："
jq -r '.mcp.servers | keys[]' "$OUTPUT_CONFIG" | sed 's/^/  - /'
