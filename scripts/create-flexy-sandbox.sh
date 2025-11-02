#!/bin/bash

# Flexy Sandbox Creation Script
# Creates a Flexy sandbox container with configurable parameters

set -e  # Exit on any error

# Function to display usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --name NAME              Container name (default: flexy-sandbox-<timestamp>)"
    echo "  -i, --image NAME             Image name (default: ghcr.io/misterlex223/flexy-sandbox)"
    echo "  -p, --port PORT              Host port to expose (default: 8080)"
    echo "  -m, --mount PATH             Host path to mount to container (optional)"
    echo "  --workspace-path PATH        Container workspace path (default: /home/flexy/workspace)"
    echo "  --claude-config PATH         Host path to Claude config directory (optional)"
    echo "  -a, --anthropic-token TOKEN  Anthropic API token (optional)"
    echo "  -g, --github-token TOKEN     GitHub token (optional)"
    echo "  -t, --ttyd                   Expose ttyd port (port 9681)"
    echo "  -c, --cospec                 Expose CoSpec AI ports (ports 9280, 9281)"
    echo "  -w, --webtty                 Enable WebTTY mode"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --name my-dev-env --mount /home/user/project --port 8081"
    echo "  $0 --anthropic-token your-token --github-token your-github-token --webtty"
    echo "  $0 --name cospec-env --cospec --mount /home/user/docs --workspace-path /home/flexy/my-workspace"
}

# Check if any arguments were provided
if [[ $# -eq 0 ]]; then
    # Interactive mode - guide the user through setup
    echo "No command line arguments provided. Starting interactive setup..."
    echo ""
    
    # Default values for interactive mode
    CONTAINER_NAME="flexy-sandbox-$(date +%s)"
    IMAGE_NAME="ghcr.io/misterlex223/flexy-sandbox"
    HOST_PORT=8080
    MOUNT_PATH=""
    WORKSPACE_PATH="/home/flexy/workspace"
    CLAUDE_CONFIG_PATH=""
    ANTHROPIC_TOKEN=""
    GITHUB_TOKEN=""
    EXPOSE_TTYD=false
    EXPOSE_COSPEC=false
    ENABLE_WEBTTY=true
    TTYD_HOST_PORT=9681
    COSPEC_FRONTEND_PORT=9280
    COSPEC_API_PORT=9281
    
    # Prompt for container name
    read -p "Container name (default: $CONTAINER_NAME): " input_name
    if [ -n "$input_name" ]; then
        CONTAINER_NAME="$input_name"
    fi
    
    # Prompt for image name
    read -p "Image name (default: $IMAGE_NAME): " input_image
    if [ -n "$input_image" ]; then
        IMAGE_NAME="$input_image"
    fi
    
    # Prompt for host port
    read -p "Host port to expose (default: $HOST_PORT): " input_port
    if [ -n "$input_port" ]; then
        HOST_PORT="$input_port"
    fi
    
    # Prompt for mount path
    read -p "Host path to mount to container (optional, press Enter to skip): " input_mount
    if [ -n "$input_mount" ]; then
        MOUNT_PATH="$input_mount"
    fi
    
    # Prompt for container workspace path
    read -p "Container workspace path (default: /home/flexy/workspace): " input_workspace
    if [ -n "$input_workspace" ]; then
        WORKSPACE_PATH="$input_workspace"
    fi

    # Prompt for Claude config directory
    echo ""
    echo "Claude Code 配置目錄掛載選項："
    echo "  如果您希望在多個容器間共享 Claude 配置，請指定主機上的配置目錄。"
    echo "  建議使用: ~/.flexy-claude-config"
    echo "  留空則使用容器內預設配置（不持久化）"
    read -p "Claude config directory (optional, press Enter to skip): " input_claude_config
    if [ -n "$input_claude_config" ]; then
        CLAUDE_CONFIG_PATH="$input_claude_config"
    fi

    # Prompt for Anthropic token
    read -p "Anthropic API token (optional, press Enter to skip): " input_anthropic
    if [ -n "$input_anthropic" ]; then
        ANTHROPIC_TOKEN="$input_anthropic"
    fi
    
    # Prompt for GitHub token
    read -p "GitHub token (optional, press Enter to skip): " input_github
    if [ -n "$input_github" ]; then
        GITHUB_TOKEN="$input_github"
    fi
    
    # Prompt for TTYD exposure
    read -p "Expose ttyd port (port 9681)? (y/N): " input_ttyd
    if [[ "$input_ttyd" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        EXPOSE_TTYD=true
        # Prompt for host port mapping for ttyd
        read -p "Host port for ttyd (default: 9681): " ttyd_host_port
        if [ -z "$ttyd_host_port" ]; then
            TTYD_HOST_PORT=9681
        else
            TTYD_HOST_PORT="$ttyd_host_port"
        fi
    fi
    
    # Prompt for CoSpec exposure
    read -p "Expose CoSpec AI port (9280)? (y/N): " input_cospec
    if [[ "$input_cospec" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        EXPOSE_COSPEC=true
        # Prompt for host port mapping for CoSpec (unified server)
        read -p "Host port for CoSpec AI (default: 9280): " cospec_port
        if [ -z "$cospec_port" ]; then
            COSPEC_FRONTEND_PORT=9280
        else
            COSPEC_FRONTEND_PORT="$cospec_port"
        fi
    fi
    
    # Prompt for WebTTY mode
    read -p "Enable WebTTY mode? (Y/n): " input_webtty
    if [[ "$input_webtty" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        ENABLE_WEBTTY=true
    fi
    
else
    # Parse command line arguments like before
    # Default values
    CONTAINER_NAME="flexy-sandbox-$(date +%s)"
    IMAGE_NAME="ghcr.io/misterlex223/flexy-sandbox"
    HOST_PORT=8080
    MOUNT_PATH=""
    WORKSPACE_PATH="/home/flexy/workspace"
    CLAUDE_CONFIG_PATH=""
    ANTHROPIC_TOKEN=""
    GITHUB_TOKEN=""
    EXPOSE_TTYD=false
    EXPOSE_COSPEC=false
    ENABLE_WEBTTY=false
    # Default ports - CLI mode doesn't ask for custom ports, so use defaults
    TTYD_HOST_PORT=9681
    COSPEC_FRONTEND_PORT=9280
    COSPEC_API_PORT=9281

    while [[ $# -gt 0 ]]; do
        key="$1"
        case $key in
            -n|--name)
                CONTAINER_NAME="$2"
                shift 2
                ;;
            -i|--image)
                IMAGE_NAME="$2"
                shift 2
                ;;
            -p|--port)
                HOST_PORT="$2"
                shift 2
                ;;
            -m|--mount)
                MOUNT_PATH="$2"
                shift 2
                ;;
            --claude-config)
                CLAUDE_CONFIG_PATH="$2"
                shift 2
                ;;
            -a|--anthropic-token)
                ANTHROPIC_TOKEN="$2"
                shift 2
                ;;
            -g|--github-token)
                GITHUB_TOKEN="$2"
                shift 2
                ;;
            -t|--ttyd)
                EXPOSE_TTYD=true
                shift
                ;;
            -c|--cospec)
                EXPOSE_COSPEC=true
                shift
                ;;
            -w|--webtty)
                ENABLE_WEBTTY=true
                shift
                ;;
            --workspace-path)
                WORKSPACE_PATH="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $key"
                show_usage
                exit 1
                ;;
        esac
    done
fi

echo "Creating Flexy sandbox container: $CONTAINER_NAME"
echo "Using image: $IMAGE_NAME"
echo "Host port: $HOST_PORT"

# Check if image exists
if ! docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "$IMAGE_NAME"; then
    echo "Warning: Image '$IMAGE_NAME' not found."
    read -r -p "Do you want to build it first? [y/N] " response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Building image: $IMAGE_NAME"
        ./scripts/build-docker.sh
    else
        echo "Please build the image first or specify an existing image."
        exit 1
    fi
fi

# Check if container with same name already exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "A container with name '$CONTAINER_NAME' already exists."
    read -r -p "Do you want to remove it first? [y/N] " response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Removing existing container: $CONTAINER_NAME"
        docker rm -f "$CONTAINER_NAME" > /dev/null
    else
        echo "Please choose a different name or remove the existing container."
        exit 1
    fi
fi

# Build docker run command
RUN_CMD="docker run -d --name $CONTAINER_NAME -p $HOST_PORT:80"

# Add mount if specified
if [ -n "$MOUNT_PATH" ]; then
    if [ ! -d "$MOUNT_PATH" ]; then
        echo "Error: Mount path does not exist: $MOUNT_PATH"
        exit 1
    fi
    RUN_CMD="$RUN_CMD -v $MOUNT_PATH:$WORKSPACE_PATH"
    echo "Mounting: $MOUNT_PATH -> $WORKSPACE_PATH"
fi

# Add Claude config directory mount if specified
if [ -n "$CLAUDE_CONFIG_PATH" ]; then
    # 展開 ~ 為實際的 home 目錄
    CLAUDE_CONFIG_PATH="${CLAUDE_CONFIG_PATH/#\~/$HOME}"

    # 如果目錄不存在，建立它
    if [ ! -d "$CLAUDE_CONFIG_PATH" ]; then
        echo "Claude config directory does not exist. Creating: $CLAUDE_CONFIG_PATH"
        mkdir -p "$CLAUDE_CONFIG_PATH"
        echo "✓ Created Claude config directory"
    fi

    RUN_CMD="$RUN_CMD -v $CLAUDE_CONFIG_PATH:/home/flexy/.claude"
    echo "Mounting Claude config: $CLAUDE_CONFIG_PATH -> /home/flexy/.claude"
    echo "  此配置將在容器間共享並持久化"
fi

# Add Anthropic token if specified
if [ -n "$ANTHROPIC_TOKEN" ]; then
    RUN_CMD="$RUN_CMD -e ANTHROPIC_AUTH_TOKEN=$ANTHROPIC_TOKEN"
    echo "Setting Anthropic token"
fi

# Add GitHub token if specified
if [ -n "$GITHUB_TOKEN" ]; then
    RUN_CMD="$RUN_CMD -e GITHUB_TOKEN=$GITHUB_TOKEN"
    echo "Setting GitHub token"
fi

# Add WebTTY mode if enabled
if [ "$ENABLE_WEBTTY" = true ]; then
    RUN_CMD="$RUN_CMD -e ENABLE_WEBTTY=true"
    echo "Enabling WebTTY mode"
fi

# Expose ttyd port if requested
if [ "$EXPOSE_TTYD" = true ]; then
    RUN_CMD="$RUN_CMD -p ${TTYD_HOST_PORT}:9681"
    echo "Exposing ttyd port: ${TTYD_HOST_PORT}:9681"
fi

# Expose CoSpec AI port if requested
if [ "$EXPOSE_COSPEC" = true ]; then
    RUN_CMD="$RUN_CMD -p ${COSPEC_FRONTEND_PORT}:9280"
    echo "Exposing CoSpec port: ${COSPEC_FRONTEND_PORT}:9280"
fi

# Add the image name to the command
RUN_CMD="$RUN_CMD $IMAGE_NAME"

echo "Executing: $RUN_CMD"
echo ""

# Execute the docker run command
eval $RUN_CMD

# Wait a moment for container to start
sleep 3

# Check if container is running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Container created successfully: $CONTAINER_NAME"
    echo "Access your sandbox at: http://localhost:$HOST_PORT"
    
    if [ "$EXPOSE_TTYD" = true ]; then
        echo "ttyd terminal available at: http://localhost:$TTYD_HOST_PORT"
    fi
    
    if [ "$EXPOSE_COSPEC" = true ]; then
        echo "CoSpec AI available at: http://localhost:$COSPEC_FRONTEND_PORT"
    fi
    
    echo ""
    echo "To access the container shell:"
    echo "  docker exec -it $CONTAINER_NAME /bin/bash"
    
    echo ""
    echo "To stop the container:"
    echo "  docker stop $CONTAINER_NAME"
else
    echo "Error: Failed to start container: $CONTAINER_NAME"
    docker logs "$CONTAINER_NAME" 2>&1 | tail -20
    exit 1
fi