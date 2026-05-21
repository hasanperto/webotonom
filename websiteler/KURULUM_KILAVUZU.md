# 🚀 Sürücü Kursu Yönetim Paneli - VDS & aaPanel Kurulum Kılavuzu

Bu kılavuz, projenin **aaPanel** kurulu bir VDS sunucusunda `driver.webotonom.de` domaini altında çalıştırılması için hazırlanmıştır.

---

## 📋 1. Ön Gereksinimler

Sunucunuzda aşağıdaki bileşenlerin aaPanel üzerinden kurulması gerekir:

1.  **Node.js**: Sürüm 18 veya 20 (Önerilen: 20 LTS).
    *   aaPanel > App Store > Node.js Version Manager > Install Node v20.
2.  **Nginx**: Web sunucusu.
3.  **PM2**: Node.js süreç yöneticisi.
    *   aaPanel > App Store > PM2 Manager > Install.

---

## 📂 2. Dosyaların Yüklenmesi

1.  Bilgisayarınızdaki `ehliyet_deploy` klasörünü **ZIP** dosyası yapın.
2.  aaPanel > **Files** menüsüne gidin.
3.  `/www/wwwroot/driver.webotonom.de` dizinine gidin (Yoksa oluşturun).
4.  Eski dosyalar varsa temizleyin.
5.  ZIP dosyasını **Upload** edin ve sağ tıklayıp **Unzip** diyerek açın.

Dosya yapısı şu şekilde görünmelidir:
```
/www/wwwroot/driver.webotonom.de/
├── api/                <-- Backend kodları
├── src/                <-- Frontend kodları
├── public/             <-- Statik dosyalar
├── sql_scripts/        <-- Veritabanı SQL dosyaları
├── package.json
├── vite.config.ts
├── deploy.sh
└── .env
```

---

## ⚙️ 3. Kurulum ve Derleme (Build)

aaPanel'de **Terminal**'i açın veya SSH ile bağlanın.

1.  Proje dizinine gidin:
    ```bash
    cd /www/wwwroot/driver.webotonom.de
    ```

2.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    ```

3.  Projeyi derleyin (Build):
    ```bash
    npm run build
    ```
    *Bu işlem `dist` klasörünü oluşturacaktır.*

---

## 🔌 4. Backend (API) Başlatma

API servisinin sürekli çalışması için PM2 kullanacağız.

1.  Terminalde şu komutu çalıştırın:
    ```bash
    pm2 start "npx tsx api/server.ts" --name driver-api
    ```

2.  Başlangıçta otomatik çalışması için:
    ```bash
    pm2 save
    pm2 startup
    ```

*API servisi artık arka planda (varsayılan 3001 portunda) çalışıyor.*

---

## 🌐 5. Nginx ve Domain Ayarları (Kritik Adım)

Frontend (React SPA) ve Backend (API) yönlendirmelerini yapmak için Nginx ayarını düzenlemelisiniz.

1.  aaPanel > **Website** menüsüne gidin.
2.  `driver.webotonom.de` sitesinin ayarlarına (Conf) tıklayın.
3.  **Config** (veya Config file) sekmesine gelin.
4.  Mevcut içeriği **SİLMEYİN**, ancak `server` bloğu içindeki `location /` kısmını aşağıdaki gibi değiştirin ve `/api` bloğunu ekleyin:

```nginx
server {
    # ... mevcut port ve server_name ayarları ...
    
    root /www/wwwroot/driver.webotonom.de/dist;  # DİKKAT: /dist eklendi
    index index.html index.htm;

    # Frontend (SPA) Yönlendirmesi
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend (API) Proxy
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # ... SSL ve Log ayarları (mevcut kalsın) ...
}
```

5.  **Kaydet (Save)** butonuna basın.

---

## 🔒 6. SSL Sertifikası

1.  Web sitesi ayarlarında **SSL** sekmesine gidin.
2.  **Let's Encrypt** seçin.
3.  Sertifikayı oluşturun ve **Force HTTPS** seçeneğini aktif edin.

---

## 🛢️ 7. Veritabanı (Supabase)

Bu proje veritabanı olarak **Supabase** kullanmaktadır. Sunucuda ekstra bir veritabanı kurmanıza gerek yoktur. Ancak `.env` dosyasının doğru ayarlandığından emin olun.

1.  `/www/wwwroot/driver.webotonom.de/.env` dosyasını açın (aaPanel dosya yöneticisinden düzenleyebilirsiniz).
2.  `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerinin dolu olduğundan emin olun.

**Önemli Not:** Eğer veritabanı şemasında güncelleme yapmanız gerekirse, `sql_scripts` klasöründeki dosyaları Supabase SQL Editor üzerinden çalıştırabilirsiniz.

---

## ✅ Kurulum Tamamlandı!

Artık tarayıcınızdan `https://driver.webotonom.de` adresine gittiğinizde:
1.  Giriş sayfası açılmalıdır.
2.  API istekleri sorunsuz çalışmalıdır.

### 🛠️ Güncelleme Nasıl Yapılır?

İleride kod güncellemesi yaptığınızda:
1.  Yeni dosyaları sunucuya yükleyin.
2.  Terminalden:
    ```bash
    cd /www/wwwroot/driver.webotonom.de
    sh deploy.sh
    ```
    komutunu çalıştırın. Bu script otomatik olarak build alıp API'yi yeniden başlatacaktır.
