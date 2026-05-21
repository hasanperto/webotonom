# webotonom.de — aaPanel (Ubuntu) ile canlı güncelleme

Canlıda eski sürüm çalışırken güvenli güncelleme akışı. Proje yapısı: üst klasörde `frontend/` ve `backend/`, Node `backend/server.js` hem API hem `frontend/dist` statik dosyalarını verir.

## 0. Bilmen gerekenler (önce kontrol et)

- **Site kök dizini:** aaPanel → **Website** → `webotonom.de` — genelde `/www/wwwroot/webotonom.de`. Aşağıda `PROJE_KOK` = bu yol.
- **PM2 süreç adı:** `pm2 list` ile bak (`webotonom`, `tekno` vb.). Komutlarda kendi adını kullan.
- **MySQL:** aaPanel → **Database** — yedek buradan alınır.
- **Git:** `git clone` ile kurulduysa `git pull`. Kurulmadıysa → [Git yok](#sunucuda-git-yoksa).

---

## 1. Yedek (zorunlu)

1. aaPanel → **Files** → `PROJE_KOK` içinden **`backend/.env`** ve **`backend/public/uploads`** yedeği (veya tüm klasör zip).
2. aaPanel → **Database** → site DB → **Backup** (`.sql`).

Düşük trafik saatinde yap; site birkaç dakika kapalı kalabilir.

---

## 2. Node sürümü

aaPanel → **App Store** → **Node.js** — **20 veya 22 LTS**.

```bash
node -v
```

---

## 3. Güncelleme (önerilen — tek script)

`PROJE_KOK` örnek: `/www/wwwroot/webotonom.de`

```bash
cd /www/wwwroot/webotonom.de
chmod +x deploy/scripts/sunucu-guncelle.sh
./deploy/scripts/sunucu-guncelle.sh .
```

Script: PM2 durdur → `git pull` → frontend `npm ci` + `build` → backend `npm ci` + `sunucu-hazirlik.js` → PM2 restart → `/api/health` testi.

**`.env` dokunma** (silinmediyse). Yoksa yedekten geri koy; örnek: `deploy/.env.production.example`.

| Değişken | Değer |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `5001` (degistirmeyin) |
| `FRONTEND_URL` | `https://webotonom.de` |
| `CORS_ORIGIN` | `https://webotonom.de,https://www.webotonom.de` |

`uploads` izinleri (gerekirse):

```bash
cd /www/wwwroot/webotonom.de/backend
mkdir -p public/uploads
chown -R www:www public/uploads
chmod -R 775 public/uploads
```

---

## 4. Güncelleme — manuel adımlar

```bash
cd /www/wwwroot/webotonom.de

pm2 list
pm2 stop tekno              # veya pm2 list ile gercek ad

git pull origin main

cd frontend
npm ci --legacy-peer-deps
npm run build
cd ../backend
npm ci --omit=dev
NODE_ENV=production node scripts/sunucu-hazirlik.js

pm2 restart tekno
pm2 save
```

**Önemli:** `npm run build` sonrası `frontend/dist` tamamen yenilenmeli. Eski `vendor-*.js` ile yeni `index.html` karışırsa konsolda `unstable_now` hatası çıkar — mutlaka build bitene kadar bekle, sonra tarayıcıda **Ctrl+F5** (önbellek temizle).

---

## 5. aaPanel PM2 Manager (grafik)

1. **App Store** → **PM2 Manager** → süreci bul.
2. Güncellemeden önce **Stop**.
3. Terminal’de `git pull` + build + `sunucu-hazirlik.js` bitince **Restart**.

Çalışma dizini: **`backend`**. Başlatılan dosya: **`server.js`**.

---

## 6. Nginx

Genelde değiştirme. **Website** → `webotonom.de` → **Config** — `proxy_pass` → `127.0.0.1:5001`.

```bash
curl -sS https://webotonom.de/api/health
```

`"database":"connected"` beklenir.

---

## 7. Veritabanı (yeni SQL / ödeme tabloları)

Güncelleme scripti bunu zaten çalıştırır. Sadece DB migration gerekiyorsa:

```bash
cd /www/wwwroot/webotonom.de/backend
NODE_ENV=production node scripts/sunucu-hazirlik.js
```

Yeni çeviri SQL dosyaları: önce DB yedeği, sonra phpMyAdmin.

---

## Sunucuda Git yoksa

1. Yerelde: `.\scripts\build-release.ps1` → zip.
2. aaPanel **Files** ile aç; **`backend/.env`** ve **`uploads`** üzerine yazma.
3. Sunucuda:

```bash
cd PROJE_KOK/backend
npm ci --omit=dev
NODE_ENV=production node scripts/sunucu-hazirlik.js
pm2 restart tekno
```

---

## Hızlı özet (kopyala-yapıştır)

```bash
cd /www/wwwroot/webotonom.de
./deploy/scripts/sunucu-guncelle.sh .
```

Manuel:

```bash
cd /www/wwwroot/webotonom.de
pm2 stop tekno
git pull origin main
cd frontend && npm ci --legacy-peer-deps && npm run build
cd ../backend && npm ci --omit=dev && NODE_ENV=production node scripts/sunucu-hazirlik.js
pm2 restart tekno && pm2 save
curl -sS https://webotonom.de/api/health
```

---

## Port çakışması — 5001 dolu (port degistirmeyin)

`PORT=5001` kalsin. Sorun: **aynı portta iki baslatma** (aaPanel Node projesi + PM2, veya eski zombie surec).

```bash
ss -tlnp | grep ':5001 '
lsof -i :5001
pm2 list
```

**1) Cift Node projesini kaldir**

- aaPanel → **Website** → `webotonom.de` → **Node Project** varsa: ya **sil** ya da **Stop** (PM2 ile tek baslatma yeterli).
- Sadece terminal PM2 kullan: `pm2 start deploy/ecosystem.config.cjs` (ad: `tekno`).

**2) 5001’i tutan eski sureci durdur**

PID `ss`/`lsof` ciktisindan gelir. Kendi `tekno` degilse:

```bash
pm2 delete tekno 2>/dev/null
kill $(lsof -t -i:5001) 2>/dev/null   # dikkat: baska canli siteyse once ss ile kontrol
cd /www/wwwroot/webotonom.de
pm2 start deploy/ecosystem.config.cjs
pm2 save
curl -sS http://127.0.0.1:5001/api/health
```

**3) `.env` kontrol**

```bash
grep ^PORT= /www/wwwroot/webotonom.de/backend/.env
# PORT=5001 olmali
```

Nginx: `proxy_pass http://127.0.0.1:5001;` — port numarasini degistirme.

---

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| Port already occupied | Yukarı: aaPanel Node + PM2 cifti; 5001’deki eski PID |
| `unstable_now` / boş sayfa | `git pull`, `frontend` içinde `npm run build`, Ctrl+F5 |
| 502 Bad Gateway | `pm2 list`, `pm2 logs tekno --lines 50`, `curl 127.0.0.1:PORT/api/health` |
| DB hatası | `backend/.env` DB bilgileri, `sunucu-hazirlik.js` |
| Eski arayüz | Build bitmedi veya CDN/tarayıcı önbelleği |
