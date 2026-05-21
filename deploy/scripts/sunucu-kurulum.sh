#!/bin/bash
# Ilk kurulum — Linux / aaPanel
# Kullanim: chmod +x deploy/scripts/sunucu-kurulum.sh
#           ./deploy/scripts/sunucu-kurulum.sh /www/wwwroot/alanadiniz.com

set -euo pipefail

PROJE_KOK="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJE_KOK"

echo "=== Tekno sunucu kurulumu ==="
echo "Kok: $PROJE_KOK"

command -v node >/dev/null || { echo "Node.js yok. aaPanel App Store -> Node 20 LTS"; exit 1; }
node -v

# Frontend build
echo "[1/5] Frontend build..."
cd "$PROJE_KOK/frontend"
if [ -f package-lock.json ]; then
    npm ci --legacy-peer-deps
else
    npm install --legacy-peer-deps
fi
npm run build
test -f dist/index.html || { echo "frontend/dist yok"; exit 1; }

# Backend bagimliliklari
echo "[2/5] Backend npm..."
cd "$PROJE_KOK/backend"
if [ -f package-lock.json ]; then
    npm ci --omit=dev
else
    npm install --omit=dev
fi

# .env
if [ ! -f .env ]; then
    if [ -f "$PROJE_KOK/deploy/.env.production.example" ]; then
        cp "$PROJE_KOK/deploy/.env.production.example" .env
        echo "[!] backend/.env olusturuldu — DUZENLEYIN"
    else
        cp .env.example .env 2>/dev/null || true
        echo "[!] .env.example kopyalandi — DUZENLEYIN"
    fi
fi

# Uploads + log
mkdir -p public/uploads logs
chmod -R 775 public/uploads 2>/dev/null || true

# Veritabani hazirlik (tablolar)
echo "[3/5] Veritabani kontrol..."
export NODE_ENV=production
node scripts/sunucu-hazirlik.js || echo "UYARI: hazirlik scripti — .env DB bilgilerini kontrol edin"

# PM2
echo "[4/5] PM2..."
if command -v pm2 >/dev/null; then
    pm2 delete tekno 2>/dev/null || true
    pm2 start "$PROJE_KOK/deploy/ecosystem.config.cjs"
    pm2 save
    echo "PM2: tekno baslatildi"
else
    echo "PM2 yok. Manuel: cd backend && NODE_ENV=production node server.js"
fi

echo "[5/5] Saglik..."
sleep 2
curl -sS "http://127.0.0.1:${PORT:-5000}/api/health" || echo "curl basarisiz — PORT ve .env kontrol"

echo ""
echo "=== Kurulum bitti ==="
echo "1) backend/.env doldurun (DB, JWT, FRONTEND_URL, CORS)"
echo "2) Nginx proxy -> 127.0.0.1:5000 (deploy/nginx-tekno.example.conf)"
echo "3) https://alanadiniz/api/health"
