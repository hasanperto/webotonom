# Tekno — Sunucu yayini (production)

Tek uygulama: **Node `backend/server.js`** API + `frontend/dist` statik dosyalari.

```
tekno/
├── backend/              # API, uploads, .env
├── frontend/dist/        # npm run build ciktisi
└── deploy/               # PM2, Nginx ornek, scriptler
```

## Hizli baslangic (Linux / aaPanel)

```bash
cd /www/wwwroot/alanadiniz.com    # proje kokunuz
chmod +x deploy/scripts/*.sh
./deploy/scripts/sunucu-kurulum.sh .
```

Sonra `backend/.env` duzenleyin ve PM2/Nginx kontrol edin.

Detayli kontrol listesi: [KONTROL_LISTESI.md](./KONTROL_LISTESI.md)

---

## Gereksinimler

| Bilesen | Minimum |
|---------|---------|
| Node.js | 20 LTS veya 22 |
| MySQL/MariaDB | 10.4+ |
| PM2 | Onerilir |
| Nginx | Reverse proxy + SSL |

---

## Ortam dosyasi (`backend/.env`)

Sablon: `deploy/.env.production.example`

```bash
cp deploy/.env.production.example backend/.env
nano backend/.env
```

| Degisken | Ornek |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DB_HOST` | `127.0.0.1` |
| `DB_NAME` | `teknopro` |
| `FRONTEND_URL` | `https://alanadiniz.com` |
| `CORS_ORIGIN` | `https://alanadiniz.com,https://www.alanadiniz.com` |
| `JWT_SECRET` | Uzun rastgele string |

Frontend build: `VITE_API_URL` **gerekmez** — production'da `https://domain/api` otomatik kullanilir.

---

## PM2

Proje kokunden:

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup    # sunucu acilisinda (bir kez)
```

Loglar: `backend/logs/pm2-*.log`

---

## Veritabani

**Mevcut sunucu (guncelleme):**

```bash
cd backend
NODE_ENV=production node scripts/sunucu-hazirlik.js
```

Bu script: baglanti testi, `order_items.plan_id`, odeme tablolari (`setup-payment-integrations.js`).

**Sifirdan kurulum:** `backend/services/yedekdb/database.sql` ve ihtiyaca gore diger SQL dosyalarini phpMyAdmin ile import edin. Tam dump varsa once onu kullanin.

**Onemli:** Canli DB adi `.env` icindeki `DB_NAME` (ornek: `teknopro`). `teknoprojes` kullanmayin.

---

## Nginx

Ornek: `deploy/nginx-tekno.example.conf`

- Tum trafik → `http://127.0.0.1:5000`
- `/uploads/` icin istege bagli `alias` (performans)

Test:

```bash
curl -sS https://alanadiniz.com/api/health
```

---

## Windows'tan zip paketi (Git yok)

```powershell
cd D:\Sonver\tekno
.\scripts\build-release.ps1
```

Cikti: `dist\tekno-release-*.zip` — sunucuda acin; **`backend/.env`** ve **`public/uploads`** uzerine yazmayin.

```bash
cd tekno-release-.../backend
npm ci --omit=dev
cp deploy/.env.production.example .env   # ilk kurulum
nano .env
NODE_ENV=production node scripts/sunucu-hazirlik.js
pm2 start ../deploy/ecosystem.config.cjs
```

---

## Git ile guncelleme

```bash
./deploy/scripts/sunucu-guncelle.sh /path/to/tekno
```

veya manuel:

```bash
pm2 stop tekno
git pull
cd frontend && npm ci --legacy-peer-deps && npm run build
cd ../backend && npm ci --omit=dev && node scripts/sunucu-hazirlik.js
pm2 restart tekno
```

---

## webotonom.de / aaPanel

Bkz. [AA_PANEL_WEBOTONOM_GUNCELLEME.md](./AA_PANEL_WEBOTONOM_GUNCELLEME.md) — ayni akis; script adlari `tekno` PM2 process.

---

## Sorun giderme

| Belirti | Cozum |
|---------|--------|
| 502 Bad Gateway | `pm2 list`, port 5000 dinliyor mu |
| API OK, DB fail | `.env` DB bilgileri, MySQL calisiyor mu |
| Siparis 500 | `node scripts/sunucu-hazirlik.js` |
| CORS hatasi | `CORS_ORIGIN` tam domain (https) |
| Bos sayfa | `frontend/dist/index.html` var mi, `NODE_ENV=production` |
