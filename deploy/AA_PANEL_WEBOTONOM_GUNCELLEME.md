# webotonom.de — aaPanel (Ubuntu) ile canlı güncelleme

Canlıda eski sürüm çalışırken güvenli güncelleme akışı. Proje yapısı: üst klasörde `frontend/` ve `backend/`, Node `backend/server.js` hem API hem `frontend/dist` statik dosyalarını verir.

## 0. Bilmen gerekenler (önce kontrol et)

- **Site kök dizini:** aaPanel → **Website** → `webotonom.de` — genelde `/www/wwwroot/webotonom.de` veya senin seçtiğin yol. Aşağıda `PROJE_KOK` yazan yere bunu koy.
- **Node nasıl çalışıyor:** aaPanel **App Store** → **PM2 Manager** veya **Node.js** projesi olabilir. Güncelleme sonunda **aynı PM2 adıyla** yeniden başlatacaksın.
- **MySQL:** aaPanel → **Database** — yedek buradan da alınabilir.
- **Git:** Sunucuda `git clone` ile kurulduysa `git pull` kullanılır. Kurulmadıysa dosya sonundaki “Git yok” bölümüne bak.

---

## 1. Yedek (zorunlu)

1. aaPanel → **Files** ile `PROJE_KOK` içinden en az **`backend/.env`** ve **`backend/public/uploads`** yedeğini al (tüm klasör zip’i de olur).
2. aaPanel → **Database** → site veritabanı → **Backup** / dışa aktar (`.sql`).

Kısa kesinti yaşanabilir; mümkünse düşük trafik saatinde yap.

---

## 2. Node sürümü

aaPanel → **App Store** → **Node.js** — **20 veya 22 LTS** olsun. Terminal:

```bash
node -v
```

---

## 3. Güncelleme — Terminal (aaPanel → Terminal veya SSH)

`PROJE_KOK` örnek: `/www/wwwroot/webotonom.de`

```bash
cd PROJE_KOK

pm2 list
pm2 stop webotonom    # listedeki gerçek isim (sende farklı olabilir)

git pull origin main

cd frontend
npm ci --legacy-peer-deps
npm run build
cd ../backend
npm ci --omit=dev

mkdir -p public/uploads
chown -R www:www public/uploads
chmod -R 775 public/uploads
```

**.env** (silinmediyse dokunma; yoksa yedekten geri koy):

- `NODE_ENV=production`
- `FRONTEND_URL=https://webotonom.de`
- `CORS_ORIGIN=https://webotonom.de,https://www.webotonom.de` (www kullanıyorsan ekle)

```bash
cd PROJE_KOK/backend
NODE_ENV=production pm2 restart webotonom
pm2 save
```

---

## 4. aaPanel PM2 Manager (grafik)

1. **App Store** → **PM2 Manager** → site sürecini bul.
2. Güncellemeden önce **Stop**.
3. Terminal’de `git pull` + `npm ci` + `npm run build` bitirince **Restart**.

Çalışma dizini **`backend`**, başlatılan dosya **`server.js`** olmalı.

---

## 5. Nginx

Genelde değiştirme. **Website** → `webotonom.de` → **Config** — `proxy_pass` Node portuna (ör. `127.0.0.1:5000`) gitsin.

Test:

```bash
curl -sS https://webotonom.de/api/health
```

---

## 6. Veritabanı (yeni SQL / odeme tabloları)

```bash
cd PROJE_KOK/backend
NODE_ENV=production node scripts/sunucu-hazirlik.js
```

Veya tam guncelleme scripti:

```bash
./deploy/scripts/sunucu-guncelle.sh PROJE_KOK
```

Yeni çeviri SQL dosyaları için önce DB yedeği; sonra phpMyAdmin.

---

## Sunucuda Git yoksa

1. Yerelde `.\scripts\build-release.ps1` → zip.
2. aaPanel **Files** ile zip’i aç; **`backend/.env`** ve **`uploads`** içeriğini ezme (dikkatli seç).
3. `backend` içinde `npm ci --omit=dev`, sonra PM2 restart.

---

## Hızlı özet

```bash
cd /www/wwwroot/webotonom.de    # senin gerçek yol
pm2 stop webotonom
git pull origin main
cd frontend && npm ci --legacy-peer-deps && npm run build && cd ../backend && npm ci --omit=dev
NODE_ENV=production pm2 restart webotonom
```
