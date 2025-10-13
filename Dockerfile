# 使用 Ubuntu 22.04 LTS 作為基礎映像
FROM ubuntu:22.04

# 避免在安裝過程中出現互動提示
ENV DEBIAN_FRONTEND=noninteractive

# 更新套件列表並安裝基本工具
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    vim \
    nano \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# 建立非 root 使用者
RUN useradd -ms /bin/bash flexy \
    && chown -R flexy:flexy /home/flexy

# 安裝 Node.js (使用 NodeSource 倉庫以獲得最新版本)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - \
    && sudo apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Python 3 和 pip
RUN sudo apt-get update \
    && sudo apt-get install -y python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Git 已在基礎工具中安裝，現在安裝 GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && sudo apt-get update \
    && sudo apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# 複製啟動腳本和配置腳本
COPY init.sh /usr/local/bin/init.sh
COPY configure-mcp.sh /usr/local/bin/configure-mcp.sh
RUN chmod +x /usr/local/bin/init.sh /usr/local/bin/configure-mcp.sh

# 切換到 flexy 使用者
USER flexy

# 建立用戶目錄結構並安裝全局包
RUN mkdir -p /home/flexy/.local/bin /home/flexy/.local/lib/node_modules && \
    npm config set prefix '/home/flexy/.local' && \
    npm install -g @anthropic-ai/claude-code kai-notify

# 複製 Claude Code MCP 配置文件
COPY claude-config/.mcp.json /home/flexy/.mcp.json

# 配置 MCP 伺服器
RUN /usr/local/bin/configure-mcp.sh

# 設定環境變數
ENV HOME=/home/flexy
ENV PATH=$PATH:$HOME/.local/bin:/usr/local/bin

# 設定 Node.js 環境變數
ENV NODE_PATH=/home/flexy/.local/lib/node_modules

# 設定 Python 環境變數
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 設定 Claude Code 環境變數（可在執行時覆蓋）
ENV ANTHROPIC_AUTH_TOKEN=
ENV ANTHROPIC_BASE_URL=
ENV ANTHROPIC_MODEL=
ENV ANTHROPIC_SMALL_FAST_MODEL=

# 設定預設的 shell
SHELL ["/bin/bash", "-c"]

# 設定入口點
ENTRYPOINT ["/usr/local/bin/init.sh"]
CMD ["/bin/bash"]