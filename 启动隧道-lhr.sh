#!/bin/bash
# ============================================================
#  DeSocial — localhost.run 免费隧道启动脚本
# ============================================================
#  使用方法:  ./启动隧道-lhr.sh
#
#  localhost.run 是一种基于 SSH 的免费反向隧道服务
#  - 无需注册账号即可使用
#  - 提供 HTTPS 公网地址
#  - 隧道在 SSH 连接断开后失效 (免费版)
#
#  注意: 每次启动隧道 URL 会变化，需要更新 Pages Function
# ============================================================

TUNNEL_OUTPUT="/tmp/desocial-tunnel-url.txt"
BACKEND_PORT="${1:-3002}"

echo "========================================"
echo "  DeSocial — localhost.run 隧道"
echo "========================================"
echo "后端端口: $BACKEND_PORT"
echo ""

# 检查 SSH
if ! command -v ssh &> /dev/null; then
  echo "错误: 未找到 ssh 命令"
  exit 1
fi

echo "正在启动隧道..."
echo "按 Ctrl+C 停止"
echo ""

# 启动隧道并提取 URL
ssh -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -R 80:localhost:${BACKEND_PORT} \
    nokey@localhost.run 2>&1 | while IFS= read -r line; do
  echo "$line"

  # 提取 lhr.life URL
  if echo "$line" | grep -q "lhr.life tunneled"; then
    TUNNEL_URL=$(echo "$line" | grep -oE 'https://[a-z0-9]+\.lhr\.life')
    if [ -n "$TUNNEL_URL" ]; then
      echo ""
      echo "========================================="
      echo "  ✅ 隧道已建立！"
      echo "  公网地址: $TUNNEL_URL"
      echo "  API地址:  $TUNNEL_URL/api"
      echo "========================================="
      echo "$TUNNEL_URL" > "$TUNNEL_OUTPUT"
      echo "URL 已保存到: $TUNNEL_OUTPUT"
    fi
  fi
done
