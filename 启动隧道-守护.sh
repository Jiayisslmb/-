#!/bin/bash
# ============================================================
#  DeSocial — 隧道守护脚本
# ============================================================
#  自动重连 + URL 变化时自动更新代理并重新部署
#  使用方法: ./启动隧道-守护.sh
#  停止: Ctrl+C
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAST_URL_FILE="/tmp/desocial-last-url.txt"
TUNNEL_LOG="/tmp/desocial-tunnel.log"

echo "========================================"
echo "  DeSocial 隧道守护进程"
echo "========================================"
echo "项目目录: $PROJECT_DIR"
echo "日志文件: $TUNNEL_LOG"
echo ""

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 正在启动隧道..."

    # 通过 DOH 解析 localhost.run IP（绕过国内 DNS 污染）
    IP=$(curl -s --max-time 5 \
        "https://dns.alidns.com/resolve?name=localhost.run&type=A" \
        | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['Answer'][0]['data'])" 2>/dev/null)

    if [ -z "$IP" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 无法解析 localhost.run IP，30秒后重试..."
        sleep 30
        continue
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] localhost.run IP: $IP"

    # 启动隧道
    ssh -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -R 80:localhost:3002 \
        nokey@$IP > "$TUNNEL_LOG" 2>&1 &
    TUNNEL_PID=$!

    # 等待隧道建立
    sleep 15

    # 提取隧道 URL
    TUNNEL_URL=$(grep -oE 'https://[a-z0-9]+\.lhr\.life' "$TUNNEL_LOG" 2>/dev/null || true)

    if [ -n "$TUNNEL_URL" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 隧道已建立: $TUNNEL_URL"

        # 检查 URL 是否变化
        LAST_URL=$(cat "$LAST_URL_FILE" 2>/dev/null || true)
        if [ "$TUNNEL_URL" != "$LAST_URL" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] URL 已变化，更新代理并重新部署..."
            echo "$TUNNEL_URL" > "$LAST_URL_FILE"

            # 更新 Pages Function 代理 URL
            sed -i "s|const API_BASE = '.*'|const API_BASE = '$TUNNEL_URL'|" \
                "$PROJECT_DIR/functions/api/[[path]].ts"

            # 构建 & 部署
            cd "$PROJECT_DIR"
            npm run build && \
            npx wrangler pages deploy out --project-name=desocial --branch=main --commit-dirty=true

            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署完成"
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] URL 未变化，无需重新部署"
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 隧道建立失败，即将重试..."
    fi

    # 等待进程结束
    wait $TUNNEL_PID 2>/dev/null || true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 隧道断开，10秒后重连..."
    sleep 10
done
