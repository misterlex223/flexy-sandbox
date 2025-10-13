#!/bin/bash

# Docker 映像建置腳本
# 用於建置包含 Node.js、Python、Git/gh 和 Claude Code 的開發環境

set -e  # 遇到錯誤時停止執行

echo "開始建置 Docker 映像..."

# 設定變數
IMAGE_NAME="flexy-dev-sandbox"
DOCKERFILE_PATH="./Dockerfile"

# 檢查 Dockerfile 是否存在
if [ ! -f "$DOCKERFILE_PATH" ]; then
    echo "錯誤: 找不到 Dockerfile"
    exit 1
fi

# 建置 Docker 映像
echo "正在建置映像: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" .

# 檢查建置是否成功
if [ $? -eq 0 ]; then
    echo "Docker 映像建置成功!"
    echo "映像名稱: $IMAGE_NAME"
    echo ""
    echo "使用方式:"
    echo "  互動式執行: docker run -it --rm $IMAGE_NAME"
    echo "  執行一次性任務: docker run --rm $IMAGE_NAME claude '您的任務'"
else
    echo "Docker 映像建置失敗!"
    exit 1
fi