#!/bin/bash
# Quick Tunnel 持久化脚本
# 每次机器重启后运行此脚本，更新 Pages Function 中的 Quick Tunnel URL

set -e

BACKEND_PORT="${1:-3002}"
PROJECT_NAME="desocial"
FUNCTIONS_FILE="functions/api/[[path]].ts"

echo "==> 启动 Quick Tunnel (端口 $BACKEND_PORT)..."
TUNNEL_OUTPUT=$(cloudflared tunnel --url "http://localhost:$BACKEND_PORT" 2>&1 &
TUNNEL_PID=$!

sleep 5

TUNNEL_URL=$(echo "$TUNNEL_OUTPUT" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)

if [ -z "$TUNNEL_URL" ]; then
  echo "错误: 无法获取 Quick Tunnel URL"
  kill $TUNNEL_PID 2>/dev/null
  exit 1
fi

echo "==> Tunnel URL: $TUNNEL_URL"

echo "==> 更新 Pages Function..."
sed -i "s|https://[a-z0-9-]*\.trycloudflare\.com|$TUNNEL_URL|g" "$FUNCTIONS_FILE"

echo "==> 部署到 Cloudflare Pages..."
npx wrangler pages deploy out --project-name "$PROJECT_NAME" --branch main --commit-dirty=true

echo "==> 完成! Quick Tunnel 运行中 (PID: $TUNNEL_PID)"
echo "Tunnel URL: $TUNNEL_URL"
echo "PID: $TUNNEL_PID"
