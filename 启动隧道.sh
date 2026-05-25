#!/bin/bash
# 智能启动 Cloudflare Tunnel — 自动检测可用端口，避免冲突

CLOUDFLARED="/c/Program Files (x86)/cloudflared/cloudflared.exe"
BACKEND_PORT=${1:-3002}
SERVER_DIR="../server"

echo "========================================"
echo "  去中心化社交平台 — Tunnel 启动器"
echo "========================================"

# 1. 智能端口检测
echo ""
echo "[1/4] 检测端口可用性..."

find_available_port() {
  local port=$1
  while netstat -ano 2>/dev/null | grep -q ":$port "; do
    echo "  端口 $port 已被占用，尝试 $((port + 1))..."
    port=$((port + 1))
    if [ $port -gt 3020 ]; then
      echo "  错误：3002-3020 范围内所有端口都被占用"
      exit 1
    fi
  done
  echo $port
}

BACKEND_PORT=$(find_available_port "$BACKEND_PORT")
echo "  使用端口: $BACKEND_PORT"

# 2. 更新后端端口配置
echo ""
echo "[2/4] 更新后端配置..."
if [ -f "$SERVER_DIR/.env" ]; then
  sed -i "s/^NEST_PORT=.*/NEST_PORT=$BACKEND_PORT/" "$SERVER_DIR/.env"
  echo "  server/.env NEST_PORT=$BACKEND_PORT"
fi

# 3. 更新前端本地配置
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT/api|" .env.local
sed -i "s|NEXT_PUBLIC_WS_URL=.*|NEXT_PUBLIC_WS_URL=http://localhost:$BACKEND_PORT|" .env.local
echo "  client/.env.local 已更新"

# 4. 启动 Tunnel
echo ""
echo "[3/4] 启动 Cloudflare Tunnel → localhost:$BACKEND_PORT"
echo "  (按 Ctrl+C 停止)"
echo ""

"$CLOUDFLARED" tunnel --url "http://localhost:$BACKEND_PORT"
