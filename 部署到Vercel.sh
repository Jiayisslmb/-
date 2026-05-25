#!/bin/bash
# Vercel 快速部署 — 更新隧道 URL 并重新部署
# 用法: ./部署到Vercel.sh https://xxx.trycloudflare.com

TUNNEL_URL=${1}

if [ -z "$TUNNEL_URL" ]; then
  echo "用法: ./部署到Vercel.sh <隧道URL>"
  echo "示例: ./部署到Vercel.sh https://education-saver-winter-genesis.trycloudflare.com"
  exit 1
fi

# 去掉末尾斜杠
TUNNEL_URL=${TUNNEL_URL%/}

echo "隧道URL: $TUNNEL_URL"
echo "API_URL:  $TUNNEL_URL/api"
echo "WS_URL:   $TUNNEL_URL"
echo ""

echo "[1/3] 更新 Vercel 环境变量..."
npx vercel env rm API_URL production --yes 2>/dev/null
printf '%s/api' "$TUNNEL_URL" | npx vercel env add API_URL production

npx vercel env rm NEXT_PUBLIC_WS_URL production --yes 2>/dev/null
printf '%s' "$TUNNEL_URL" | npx vercel env add NEXT_PUBLIC_WS_URL production

echo ""
echo "[2/3] 部署到 Vercel..."
npx vercel deploy --prod --yes

echo ""
echo "[3/3] 完成！请在浏览器中打开你的 Vercel 地址验证。"
