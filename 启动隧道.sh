#!/bin/bash
# Cloudflare Named Tunnel 启动脚本
# 使用 Named Tunnel 实现永久公网访问 (无需担心地址变化)

CLOUDFLARED="/c/Program Files (x86)/cloudflared/cloudflared.exe"
SERVER_DIR="../server"
TUNNEL_CONFIG="$SERVER_DIR/cloudflare-tunnel.yml"

echo "========================================"
echo "  去中心化社交平台 — Named Tunnel"
echo "========================================"

# 检查 cloudflared 是否安装
if [ ! -f "$CLOUDFLARED" ]; then
  echo "错误: 未找到 cloudflared.exe"
  echo "请从 https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ 下载"
  exit 1
fi

# 检查 tunnel 配置文件
if [ ! -f "$TUNNEL_CONFIG" ]; then
  echo "错误: 未找到 tunnel 配置文件: $TUNNEL_CONFIG"
  exit 1
fi

echo ""
echo "Tunnel 名称: desocial-backend"
echo "后端地址:    http://localhost:3002"
echo "前端地址:    http://localhost:3000"
echo ""
echo "公网访问地址:"
echo "  API:  https://api.desocial.com"
echo "  前端: https://app.desocial.com"
echo ""
echo "启动 Named Tunnel (按 Ctrl+C 停止)..."
echo ""

# 启动 Named Tunnel
"$CLOUDFLARED" tunnel run --config "$TUNNEL_CONFIG" desocial-backend
