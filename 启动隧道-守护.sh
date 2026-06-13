#!/bin/bash
# ============================================================
#  DeSocial — 隧道守护脚本 (Vercel 版)
# ============================================================
#  启动 localhost.run 隧道 → 更新后端可达地址
#  Vercel 端通过 BACKEND_TUNNEL_URL 环境变量指向此 URL
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAST_URL_FILE="/tmp/desocial-tunnel-url.txt"
TUNNEL_LOG="/tmp/desocial-tunnel.log"

echo "========================================"
echo "  DeSocial 隧道守护进程 (Vercel)"
echo "========================================"
echo ""

while true; do
    echo "[$(date '+%H:%M:%S')] 启动隧道..."

    IP=$(curl -s --max-time 5 \
        "https://dns.alidns.com/resolve?name=localhost.run&type=A" \
        | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['Answer'][0]['data'])" 2>/dev/null)

    if [ -z "$IP" ]; then
        echo "[$(date '+%H:%M:%S')] DNS 解析失败，30秒后重试"
        sleep 30
        continue
    fi

    ssh -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -R 80:localhost:3002 \
        nokey@$IP > "$TUNNEL_LOG" 2>&1 &
    TUNNEL_PID=$!

    sleep 15

    TUNNEL_URL=$(grep -oE 'https://[a-z0-9]+\.lhr\.life' "$TUNNEL_LOG" 2>/dev/null || true)

    if [ -n "$TUNNEL_URL" ]; then
        echo "[$(date '+%H:%M:%S')] ✅ 隧道: $TUNNEL_URL"

        LAST_URL=$(cat "$LAST_URL_FILE" 2>/dev/null || true)
        if [ "$TUNNEL_URL" != "$LAST_URL" ]; then
            echo "$TUNNEL_URL" > "$LAST_URL_FILE"
            echo ""
            echo "  ⚠️  隧道 URL 已变化！"
            echo "  请在 Vercel Dashboard 中更新环境变量:"
            echo "  → Project Settings → Environment Variables"
            echo "  → BACKEND_TUNNEL_URL = $TUNNEL_URL"
            echo "  → 然后 Redeploy 项目"
            echo ""
        fi
    else
        echo "[$(date '+%H:%M:%S')] ❌ 隧道建立失败，重试中..."
    fi

    wait $TUNNEL_PID 2>/dev/null || true
    echo "[$(date '+%H:%M:%S')] 隧道断开，10秒后重连..."
    sleep 10
done
