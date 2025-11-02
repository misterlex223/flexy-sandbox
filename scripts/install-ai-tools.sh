#!/bin/bash

# AI 工具安裝腳本
# 根據環境變數 AI_WINDOW_*_TYPE 動態安裝需要的 AI 工具

set -e  # 發生錯誤時退出

echo "========================================"
echo "  AI 工具動態安裝"
echo "========================================"

# AI 工具套件映射
declare -A AI_PACKAGES=(
    ["qwen"]="@qwen-code/qwen-code@latest"
    ["claude"]="@anthropic-ai/claude-code"
    ["gemini"]="@google/gemini-cli"
    ["codex"]="@openai/codex"
)

# AI 工具命令名稱映射（用於驗證）
declare -A AI_COMMANDS=(
    ["qwen"]="qwen"
    ["claude"]="claude"
    ["gemini"]="gemini"
    ["codex"]="codex"
)

# 收集需要安裝的 AI 工具（去重）
declare -A TOOLS_TO_INSTALL

for i in {0..4}; do
    AI_TYPE_VAR="AI_WINDOW_${i}_TYPE"
    AI_TYPE="${!AI_TYPE_VAR}"

    if [ -n "$AI_TYPE" ]; then
        echo "Window $i: $AI_TYPE"
        TOOLS_TO_INSTALL["$AI_TYPE"]=1
    fi
done

# 檢查是否有需要安裝的工具
if [ ${#TOOLS_TO_INSTALL[@]} -eq 0 ]; then
    echo "未配置任何 AI 工具，跳過安裝"
    echo "提示: 使用 AI_WINDOW_0_TYPE、AI_WINDOW_1_TYPE 等環境變數配置 AI 工具"
    echo ""
    exit 0
fi

echo ""
echo "需要安裝的 AI 工具："
for tool in "${!TOOLS_TO_INSTALL[@]}"; do
    echo "  - $tool (${AI_PACKAGES[$tool]})"
done
echo ""

# 安裝工具
INSTALL_SUCCESS=true
for tool in "${!TOOLS_TO_INSTALL[@]}"; do
    package="${AI_PACKAGES[$tool]}"

    if [ -z "$package" ]; then
        echo "⚠ 警告: 未知的 AI 工具類型 '$tool'，跳過"
        continue
    fi

    echo "正在安裝 $tool..."
    if npm install -g "$package" 2>&1 | tee /tmp/npm-install-$tool.log; then
        echo "✓ $tool 安裝成功"
    else
        echo "✗ $tool 安裝失敗"
        echo "錯誤日誌: /tmp/npm-install-$tool.log"
        INSTALL_SUCCESS=false
    fi
    echo ""
done

# 驗證安裝
echo "========================================"
echo "  驗證安裝結果"
echo "========================================"
for tool in "${!TOOLS_TO_INSTALL[@]}"; do
    cmd="${AI_COMMANDS[$tool]}"
    if command -v "$cmd" &> /dev/null; then
        version=$("$cmd" --version 2>/dev/null || echo "已安裝")
        echo "✓ $tool: $version"
    else
        echo "✗ $tool: 命令未找到"
        INSTALL_SUCCESS=false
    fi
done
echo ""

if [ "$INSTALL_SUCCESS" = true ]; then
    echo "所有 AI 工具安裝成功！"
    exit 0
else
    echo "部分 AI 工具安裝失敗，請檢查錯誤訊息"
    exit 1
fi
