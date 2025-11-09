#!/bin/bash

# Flexy Sandbox CLI 本地測試腳本
# 用於快速驗證所有核心功能

set -e  # 遇到錯誤立即停止

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 測試結果統計
PASSED=0
FAILED=0
TOTAL=0

# 測試函式
test_command() {
  local test_name="$1"
  local command="$2"
  local expected_exit_code="${3:-0}"

  TOTAL=$((TOTAL + 1))
  echo -e "\n${BLUE}[測試 $TOTAL]${NC} $test_name"

  if eval "$command" > /dev/null 2>&1; then
    actual_exit_code=0
  else
    actual_exit_code=$?
  fi

  if [ "$actual_exit_code" -eq "$expected_exit_code" ]; then
    echo -e "${GREEN}✓ 通過${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ 失敗${NC} (預期退出碼: $expected_exit_code, 實際: $actual_exit_code)"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# 測試命令輸出
test_output() {
  local test_name="$1"
  local command="$2"
  local expected_pattern="$3"

  TOTAL=$((TOTAL + 1))
  echo -e "\n${BLUE}[測試 $TOTAL]${NC} $test_name"

  output=$(eval "$command" 2>&1)

  if echo "$output" | grep -q "$expected_pattern"; then
    echo -e "${GREEN}✓ 通過${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ 失敗${NC} (未找到預期輸出: $expected_pattern)"
    echo "實際輸出: $output"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# 標題
echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Flexy Sandbox CLI 本地測試                  ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"

# 檢查是否已安裝
if ! command -v flexy-sandbox &> /dev/null; then
  echo -e "${RED}✗ flexy-sandbox 未安裝${NC}"
  echo -e "${YELLOW}請先執行: npm link${NC}"
  exit 1
fi

# ========== 基本命令測試 ==========
echo -e "\n${YELLOW}=== 基本命令測試 ===${NC}"

test_output "版本命令" "flexy-sandbox --version" "1.0.3"
test_command "幫助命令" "flexy-sandbox --help"
test_command "config 幫助" "flexy-sandbox config --help"
test_command "create 幫助" "flexy-sandbox create --help"
test_command "list 幫助" "flexy-sandbox list --help"
test_command "logs 幫助" "flexy-sandbox logs --help"
test_command "shell 幫助" "flexy-sandbox shell --help"

# ========== 命令可用性測試 ==========
echo -e "\n${YELLOW}=== 命令可用性測試 ===${NC}"

commands=("config" "create" "start" "stop" "pause" "unpause" "delete" "list" "logs" "shell" "inspect")
for cmd in "${commands[@]}"; do
  test_command "$cmd 命令存在" "flexy-sandbox $cmd --help"
done

# ========== 配置目錄測試 ==========
echo -e "\n${YELLOW}=== 配置目錄測試 ===${NC}"

TOTAL=$((TOTAL + 1))
echo -e "\n${BLUE}[測試 $TOTAL]${NC} 配置目錄可存取"
if [ -d "$HOME/.flexy-sandbox" ] || mkdir -p "$HOME/.flexy-sandbox" 2>/dev/null; then
  echo -e "${GREEN}✓ 通過${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ 失敗${NC}"
  FAILED=$((FAILED + 1))
fi

# ========== Docker 連線測試 ==========
echo -e "\n${YELLOW}=== Docker 環境測試 ===${NC}"

TOTAL=$((TOTAL + 1))
echo -e "\n${BLUE}[測試 $TOTAL]${NC} Docker 運行狀態"
if docker ps > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Docker 正在運行${NC}"
  PASSED=$((PASSED + 1))
  DOCKER_RUNNING=true
else
  echo -e "${YELLOW}⚠ Docker 未運行（部分測試將跳過）${NC}"
  FAILED=$((FAILED + 1))
  DOCKER_RUNNING=false
fi

if [ "$DOCKER_RUNNING" = true ]; then
  TOTAL=$((TOTAL + 1))
  echo -e "\n${BLUE}[測試 $TOTAL]${NC} Flexy Sandbox 映像存在"
  if docker images | grep -q flexy-dev-sandbox; then
    echo -e "${GREEN}✓ 映像存在${NC}"
    PASSED=$((PASSED + 1))
    IMAGE_EXISTS=true
  else
    echo -e "${YELLOW}⚠ 映像不存在（容器測試將跳過）${NC}"
    echo -e "${YELLOW}  建議執行: docker build -t flexy-dev-sandbox:latest .${NC}"
    FAILED=$((FAILED + 1))
    IMAGE_EXISTS=false
  fi
fi

# ========== 列出容器測試 ==========
if [ "$DOCKER_RUNNING" = true ]; then
  echo -e "\n${YELLOW}=== 容器列表測試 ===${NC}"
  test_command "列出 Flexy 容器" "flexy-sandbox list"
fi

# ========== 檔案結構測試 ==========
echo -e "\n${YELLOW}=== 專案檔案結構測試 ===${NC}"

files=(
  "bin/flexy-sandbox.js"
  "src/commands/config.js"
  "src/commands/lifecycle.js"
  "src/commands/query.js"
  "src/lib/configManager.js"
  "src/lib/dockerManager.js"
  "src/lib/validator.js"
  "src/lib/templates.js"
  "src/utils/constants.js"
  "src/utils/logger.js"
  "templates/dev.json"
  "templates/multi-ai.json"
  "templates/team.json"
  "templates/minimal.json"
  "package.json"
  "README.md"
)

for file in "${files[@]}"; do
  TOTAL=$((TOTAL + 1))
  echo -e "\n${BLUE}[測試 $TOTAL]${NC} 檔案存在: $file"
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓ 存在${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ 不存在${NC}"
    FAILED=$((FAILED + 1))
  fi
done

# ========== package.json 驗證 ==========
echo -e "\n${YELLOW}=== package.json 驗證 ===${NC}"

TOTAL=$((TOTAL + 1))
echo -e "\n${BLUE}[測試 $TOTAL]${NC} package.json 格式正確"
if node -e "require('./package.json')" 2>/dev/null; then
  echo -e "${GREEN}✓ JSON 格式正確${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ JSON 格式錯誤${NC}"
  FAILED=$((FAILED + 1))
fi

TOTAL=$((TOTAL + 1))
echo -e "\n${BLUE}[測試 $TOTAL]${NC} 無 conf 依賴"
if ! grep -q '"conf"' package.json; then
  echo -e "${GREEN}✓ 已移除 conf 依賴${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ 仍包含 conf 依賴${NC}"
  FAILED=$((FAILED + 1))
fi

# ========== configManager.js 驗證 ==========
echo -e "\n${YELLOW}=== configManager.js 驗證 ===${NC}"

TOTAL=$((TOTAL + 1))
echo -e "\n${BLUE}[測試 $TOTAL]${NC} 無 Conf require"
if ! grep -q "require('conf')" src/lib/configManager.js; then
  echo -e "${GREEN}✓ 已移除 Conf require${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ 仍包含 Conf require${NC}"
  FAILED=$((FAILED + 1))
fi

# ========== 測試結果總結 ==========
echo -e "\n${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   測試結果總結                                 ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"

echo -e "\n總測試數: $TOTAL"
echo -e "${GREEN}通過: $PASSED${NC}"
echo -e "${RED}失敗: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   🎉 所有測試通過！可以發布到 npm            ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "\n${RED}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║   ❌ 有測試失敗，請修復後再發布              ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
  exit 1
fi
