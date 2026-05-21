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
| `PORT` | `5001` |
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
pm2 stop webotonom          # kendi PM2 adın

git pull origin main

cd frontend
npm ci --legacy-peer-deps
npm run build
cd ../backend
npm ci --omit=dev
NODE_ENV=production node scripts/sunucu-hazirlik.js

pm2 restart webotonom
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

Genelde değiştirme. **Website** → `webotonom.de` → **Config** — `proxy_pass` → `127.0.0.1:5001` (`backend/.env` → `PORT=5001` ile aynı).

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
pm2 restart webotonom
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
pm2 stop webotonom
git pull origin main
cd frontend && npm ci --legacy-peer-deps && npm run build
cd ../backend && npm ci --omit=dev && NODE_ENV=production node scripts/sunucu-hazirlik.js
pm2 restart webotonom && pm2 save
curl -sS https://webotonom.de/api/health
```

---

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| `unstable_now` / boş sayfa | `git pull`, `frontend` içinde `npm run build`, Ctrl+F5 |
| 502 Bad Gateway | `pm2 list`, `pm2 logs webotonom --lines 50` |
| DB hatası | `backend/.env` DB bilgileri, `sunucu-hazirlik.js` |
| Eski arayüz | Build bitmedi veya CDN/tarayıcı önbelleği |
