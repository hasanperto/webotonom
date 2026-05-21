#!/bin/bash
# Canli guncelleme (Git veya dosya uzerine)
# ./deploy/scripts/sunucu-guncelle.sh [/path/to/tekno]

set -euo pipefail

PROJE_KOK="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJE_KOK"

PM2_NAME="${PM2_NAME:-tekno}"

echo "=== Tekno guncelleme ==="
echo "Kok: $PROJE_KOK"

if command -v pm2 >/dev/null; then
    pm2 stop "$PM2_NAME" 2>/dev/null || true
fi

if [ -d .git ]; then
    echo "git pull..."
    git pull origin main || git pull origin master
fi

echo "Frontend build..."
cd frontend
npm ci --legacy-peer-deps
npm run build
cd ..

echo "Backend npm..."
cd backend
npm ci --omit=dev
export NODE_ENV=production
node scripts/sunucu-hazirlik.js
cd ..

if command -v pm2 >/dev/null; then
    pm2 restart "$PM2_NAME" || pm2 start "$PROJE_KOK/deploy/ecosystem.config.cjs"
    pm2 save
else
    echo "PM2 yok — backend'i elle yeniden baslatin"
fi

sleep 2
HEALTH_PORT="${PORT:-}"
if [ -z "$HEALTH_PORT" ] && [ -f backend/.env ]; then
    HEALTH_PORT=$(grep -E '^PORT=' backend/.env | head -1 | cut -d= -f2 | tr -d '\r"' | tr -d ' ')
fi
HEALTH_PORT="${HEALTH_PORT:-5001}"
curl -sS "http://127.0.0.1:${HEALTH_PORT}/api/health" && echo ""

echo "=== Guncelleme tamam ==="
