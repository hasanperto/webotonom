# Tekno — Sunucu yayını

Paket yapısı (backend ile aynı üst dizinde `frontend/dist` olmalı — `server.js` buna göre):

```
tekno/
├── backend/          # Node API (sunucuda: npm ci --omit=dev)
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── public/uploads/
└── frontend/
    └── dist/         # Vite production build
```

## Gereksinimler

- Node.js **20+** (veya 22 LTS)
- MySQL / MariaDB
- İsteğe bağlı: Nginx reverse proxy, PM2, SSL

## Kurulum (Linux örneği)

```bash
unzip tekno-release-*.zip -d /var/www/
cd /var/www/tekno/backend
cp .env.example .env
nano .env   # DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, NODE_ENV=production, FRONTEND_URL, CORS_ORIGIN

npm ci --omit=dev
mkdir -p public/uploads
chmod -R 775 public/uploads   # kullanıcı/www-data’ya göre ayarlayın
export NODE_ENV=production
node server.js
```

Kalıcı çalıştırma için PM2:

```bash
npm i -g pm2
cd /var/www/tekno/backend
pm2 start server.js --name tekno --env production
pm2 save
```

## Ortam değişkenleri (özet)

| Değişken | Örnek |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `FRONTEND_URL` | `https://alanadin.com` |
| `CORS_ORIGIN` | `https://alanadin.com,https://www.alanadin.com` |
| `JWT_SECRET` | Güçlü rastgele string |

Frontend build, production’da `VITE_API_URL` olmadan çalışır: `window.location.origin + '/api'`. API alt domain’de ise build sırasında `VITE_API_URL` verilmeli (paketi o adrese göre yeniden oluşturun).

## Sağlık kontrolü

`GET https://alanadiniz/api/health`

## Nginx örnek (SSL kendi certbot ile)

```nginx
server {
    listen 443 ssl http2;
    server_name alanadin.com;
    # ssl_certificate ...;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Veritabanı şeması ve çeviriler: `backend/services/yedekdb/` altındaki SQL dosyalarını sırayla veya ihtiyaca göre içe aktarın.

## Güncelleme — Git (ör. webotonom.de)

Yerelde değişiklikleri repoya gönderdikten sonra sunucuda (proje kökü `tekno/` ve `git clone` ile kurulmuş varsayımı):

```bash
cd /path/to/tekno
git pull origin main   # branch adınıza göre: master
cd frontend
npm ci --legacy-peer-deps
npm run build
cd ../backend
npm ci --omit=dev
pm2 restart tekno        # veya: NODE_ENV=production pm2 restart tekno
```

- `.env` sunucuda kalır (repoda olmamalı).
- `public/uploads` içeriği `git pull` ile silinmez; yedek almayı unutmayın.

### İlk kez Git ile bağlamak (yerel `tekno` klasörü)

Proje kökünde henüz `.git` yoksa:

```bash
cd /path/to/tekno
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI/tekno.git
git push -u origin main
```

Sunucuda:

```bash
cd /var/www
git clone https://github.com/KULLANICI/tekno.git tekno
# sonra Kurulum bölümündeki .env ve npm adımları
```

### Git kullanmadan güncelleme

Windows’ta `.\scripts\build-release.ps1` ile zip üretip sunucuda eski `frontend/dist` ve `backend` kaynaklarının üzerine açın; backend’de `npm ci --omit=dev` ve PM2 yeniden başlatın.
