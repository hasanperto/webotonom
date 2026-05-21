# PROJE EKLEME ŞABLONU — webotonom.de

Bu dosyayı kopyalayıp doldurun. Bilgileri verdikten sonra SQL dosyası oluşturulacak ve veritabanına eklenecektir.

---

## 1. TEMEL BİLGİLER

| Alan | Değer |
|------|-------|
| **Proje Adı (TR)** | ... |
| **Proje Adı (EN)** | ... |
| **Proje Adı (DE)** | ... |
| **Slug (URL)** | ornek-proje-adi *(küçük harf, tire ile)* |
| **Canlı Site URL** | https://... |
| **Demo URL** | https://... *(yoksa boş bırak)* |
| **Video URL** | https://youtube.com/... *(yoksa boş bırak)* |
| **Versiyon** | 1.0.0 |
| **Durum** | active / draft / pending |
| **Öne Çıkan** | Evet / Hayır |

---

## 2. KATEGORİ

Birini seç:

- [ ] Web Uygulamaları *(id: 1)*
- [ ] Mobil Uygulamalar *(id: 2)*
- [ ] API & Backend *(id: 3)*
- [ ] E-Ticaret *(id: 4)*
- [ ] Yapay Zeka *(id: 5)*
- [ ] CMS & Blog *(id: 6)*

---

## 3. FİYATLANDIRMA

| Alan | Değer |
|------|-------|
| **Fiyat** | 0.00 *(ücretsizse)* veya tutar (TRY) |
| **İndirimli Fiyat** | *(yoksa boş)* |
| **Lisans Türü** | open_source / regular / extended |
| **Tamamlanma %** | 0–100 |
| **Bağış Hedefi** | *(tamamlanmamış projeler için, yoksa boş)* |

---

## 4. KISA AÇIKLAMA (max 500 karakter)

Vitrin kartında görünür. Her dil için ayrı yaz.

**TR:**
> ...

**EN:**
> ...

**DE:**
> ...

---

## 5. DETAYLI AÇIKLAMA

Proje sayfasında görünür. Aşağıdaki başlıkları doldurun:

### Proje Nedir?
> ...

### Modüller ve Özellikler

- **Modül 1:** ...
- **Modül 2:** ...
- **Modül 3:** ...

### Teknik Altyapı
- **Frontend:** ...
- **Backend:** ...
- **Veritabanı:** ...
- **Diğer:** ...

### Gereksinimler
> Kullanıcının ihtiyaç duyduğu şeyler (tarayıcı, hesap, vs.)

---

## 6. ETİKETLER

Mevcut etiketlerden seç ve/veya yeni ekle:

**Mevcut etiketler:**
React, Vue.js, Node.js, Python, TypeScript, JavaScript, TailwindCSS, MySQL, PostgreSQL, MongoDB, Redis, Docker, AWS, Firebase, GraphQL, REST API, AI/ML, Flutter, React Native, Laravel, Socket.io, PWA, WebSocket, Oyun, Eğitim, Almanca, Express.js

**Seçilenler:** ...

**Yeni eklenecekler (varsa):** ...

---

## 7. GÖRSELLER

Yüklenecek görsel dosya adları (sunucuya manuel yüklenir):

- `projects/proje-adi-1.jpg` *(kapak — primary)*
- `projects/proje-adi-2.jpg`
- `projects/proje-adi-3.jpg`

---

## 8. ÖRNEK: Almanca Fiil Kart Oyunu

| Alan | Değer |
|------|-------|
| Proje Adı (TR) | Almanca Fiil Kart Oyunu |
| Proje Adı (EN) | German Verb Card Game |
| Proje Adı (DE) | Deutsches Verb-Kartenspiel |
| Slug | almanca-fiil-kart-oyunu |
| Canlı Site | https://game.webotonom.de/ |
| Versiyon | 3.0.0 |
| Kategori | Web Uygulamaları |
| Fiyat | 0.00 (ücretsiz) |
| Lisans | open_source |
| Tamamlanma | %100 |
| Öne Çıkan | Evet |
| Etiketler | JavaScript, Socket.io, PWA, WebSocket, Oyun, Eğitim, Almanca, Express.js |

**Kısa Açıklama (TR):**
> Almanca fiilleri eğlenceli kart oyunu formatında öğrenin. Tek ve çok oyunculu mod, XP sistemi, PWA — her cihazda çalışır.

**Modüller:**
- Oyun Modları: Offline tek oyuncu, Online çok oyunculu (Socket.io, 4 kişi)
- Soru Bankası: 500+ fiil, A1–C1 seviye, 4 dil
- Lobi Sistemi: UUID'li oda, host yönetimi, hazır olma
- Zamanlama: Sıra tabanlı, bağımsız sayaç, combo bonus
- Oyuncu Profili: XP, seviye, rozetler, başarımlar, liderlik tablosu
- Mağaza: Premium paketler, power-up'lar, özel çerçeveler
- PWA: Offline çalışma, ana ekrana ekleme, APK üretme
- Sohbet: Lobi içi gerçek zamanlı mesajlaşma

**Teknik:**
- Frontend: Vanilla HTML5, CSS3, JavaScript ES6+
- Backend: Node.js, Express.js
- Gerçek Zamanlı: Socket.io (WebSocket)
- PWA: Service Worker, Web App Manifest
