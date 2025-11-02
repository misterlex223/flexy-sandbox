# 使用 Ubuntu 22.04 LTS 作為基礎映像
FROM ubuntu:22.04

# 避免在安裝過程中出現互動提示
ENV DEBIAN_FRONTEND=noninteractive

# 更新套件列表並安裝基本工具
# Install ttyd and tmux
# ttyd: for sharing the terminal over the web
# tmux: for creating a persistent, shareable session
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
    ttyd \
    tmux \
    locales \
    openssh-server \
    && rm -rf /var/lib/apt/lists/*

# 生成中文 locale 支援
RUN locale-gen zh_TW.UTF-8 && update-locale LANG=zh_TW.UTF-8

# 配置 SSH 伺服器
RUN mkdir -p /var/run/sshd && \
    echo 'PermitRootLogin no' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config && \
    echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config && \
    echo 'UsePAM yes' >> /etc/ssh/sshd_config && \
    echo 'X11Forwarding no' >> /etc/ssh/sshd_config && \
    echo 'AllowTcpForwarding yes' >> /etc/ssh/sshd_config

# 建立非 root 使用者並加入 sudo 群組
RUN useradd -ms /bin/bash flexy \
    && usermod -aG sudo flexy \
    && chown -R flexy:flexy /home/flexy \
    && echo 'flexy:dockerSandbox' | chpasswd \
    && echo 'Defaults exempt_group=sudo' >> /etc/sudoers \
    && mkdir -p /etc/sudoers.d \
    && echo 'flexy ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/bin/dpkg, /usr/bin/snap, /usr/bin/pip3, /usr/bin/pip, /usr/local/bin/npx, /usr/local/bin/npm' > /etc/sudoers.d/flexy-nopasswd \
    && chmod 440 /etc/sudoers.d/flexy-nopasswd

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

# 建立 workspace 目錄
RUN mkdir -p /home/flexy/workspace

# 複製啟動腳本、監控腳本和配置腳本
COPY init.sh /usr/local/bin/init.sh
COPY ai-session-monitor.js /usr/local/bin/ai-session-monitor.js
COPY configure-mcp.sh /usr/local/bin/configure-mcp.sh
COPY scripts/merge-mcp-config.sh /scripts/merge-mcp-config.sh
COPY scripts/install-ai-tools.sh /scripts/install-ai-tools.sh
RUN chmod +x /usr/local/bin/init.sh /usr/local/bin/configure-mcp.sh /scripts/merge-mcp-config.sh /scripts/install-ai-tools.sh

# Create Qwen and Claude configuration directories
RUN mkdir -p /home/flexy/.qwen && \
    mkdir -p /home/flexy/.claude && \
    chown -R flexy:flexy /home/flexy/.qwen /home/flexy/.claude

# 切換到 flexy 使用者
USER flexy

# 建立用戶目錄結構並安裝基礎全局包 (AI 工具將在容器啟動時按需安裝)
RUN mkdir -p /home/flexy/.local/bin /home/flexy/.local/lib/node_modules && \
    npm config set prefix '/home/flexy/.local' && \
    npm install -g cospec-ai kai-notify

# 複製預設配置模板文件（用於 init.sh 初始化）
# 統一使用 .claude/ 目錄，不再在建置時建立全域配置
COPY qwen-config/settings.json /home/flexy/default-qwen-settings.json
COPY claude-config/.mcp.json /home/flexy/default-mcp.json
COPY claude-config/CLAUDE.md /home/flexy/CLAUDE.md

# 安裝 jq 用於 JSON 合併（切換回 root 用戶安裝）
USER root
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*
USER flexy

# 設定環境變數
ENV HOME=/home/flexy
ENV PATH=$PATH:$HOME/.local/bin:/usr/local/bin

# 設定 Node.js 環境變數
ENV NODE_PATH=/home/flexy/.local/lib/node_modules

# 設定 Python 環境變數
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 動態 AI 工具配置環境變數（前 5 個 windows 可自訂）
# 格式: AI_WINDOW_<N>_TYPE=<qwen|claude|gemini|codex>
# 對應環境變數: AI_WINDOW_<N>_API_KEY, AI_WINDOW_<N>_MODEL, AI_WINDOW_<N>_BASE_URL
ENV AI_WINDOW_0_TYPE=
ENV AI_WINDOW_0_API_KEY=
ENV AI_WINDOW_0_MODEL=
ENV AI_WINDOW_0_BASE_URL=

ENV AI_WINDOW_1_TYPE=
ENV AI_WINDOW_1_API_KEY=
ENV AI_WINDOW_1_MODEL=
ENV AI_WINDOW_1_BASE_URL=

ENV AI_WINDOW_2_TYPE=
ENV AI_WINDOW_2_API_KEY=
ENV AI_WINDOW_2_MODEL=
ENV AI_WINDOW_2_BASE_URL=

ENV AI_WINDOW_3_TYPE=
ENV AI_WINDOW_3_API_KEY=
ENV AI_WINDOW_3_MODEL=
ENV AI_WINDOW_3_BASE_URL=

ENV AI_WINDOW_4_TYPE=
ENV AI_WINDOW_4_API_KEY=
ENV AI_WINDOW_4_MODEL=
ENV AI_WINDOW_4_BASE_URL=

# 舊版 AI 工具環境變數（保留供其他用途）
# 注意：這些變數不再用於 AI 工具自動配置
# 請使用 AI_WINDOW_* 系列變數來配置 AI 工具
ENV QWEN_API_KEY=
ENV QWEN_BASE_URL=
ENV QWEN_MODEL=

ENV ANTHROPIC_AUTH_TOKEN=
ENV ANTHROPIC_BASE_URL=
ENV ANTHROPIC_MODEL=
ENV ANTHROPIC_SMALL_FAST_MODEL=

# Claude Code 配置生成相關環境變數（用於 Kai 整合，仍然有效）
ENV CLAUDE_LANGUAGE=
ENV CLAUDE_NOTIFICATION_ENABLED=
ENV CLAUDE_NOTIFICATION_CHANNEL=

ENV GEMINI_API_KEY=
ENV GEMINI_BASE_URL=
ENV GEMINI_MODEL=

# 設定工作目錄環境變數
ENV WORKING_DIRECTORY=/home/flexy/workspace

# 設定 CoSpec AI 環境變數
ENV COSPEC_PORT=9280
ENV MARKDOWN_DIR=/home/flexy/workspace

# 設定持久化 AI 會話環境變數
# ENABLE_PERSISTENT_AI_SESSIONS: 啟用多 tmux 會話功能 (預設: true)
# AI_SESSION_MODE: AI CLI 啟動模式 - interactive (預先啟動) 或 on-demand (按需啟動)
# TASK_COMPLETION_TIMEOUT: 任務完成檢測超時時間 (毫秒)
ENV ENABLE_PERSISTENT_AI_SESSIONS=true
ENV AI_SESSION_MODE=interactive
ENV TASK_COMPLETION_TIMEOUT=120000

# 設定 WebTTY 環境變數
# TMUX_HISTORY_LIMIT: tmux 歷史記錄限制 (預設: 10000)
ENV TMUX_HISTORY_LIMIT=10000

# 設定工作目錄
WORKDIR ${WORKING_DIRECTORY}

# 設定預設的 shell
SHELL ["/bin/bash", "-c"]

# 設定入口點
ENTRYPOINT ["/usr/local/bin/init.sh"]
CMD ["/bin/bash"]

# Expose ttyd port and CoSpec AI ports
  # Shared ttyd (tmux with multiple windows: user, claude, qwen)
EXPOSE 9681
  # CoSpec AI unified server
EXPOSE 9280
  # SSH server
EXPOSE 22