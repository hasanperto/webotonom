# TeknoProje — Frontend & Sistem Dokümantasyonu

**TeknoProje**, yazılım projelerinin listelendiği, satıldığı, bağışlandığı ve abonelikle sunulduğu çok rollü bir e-ticaret / marketplace platformudur. Bu depo **React (Vite)** arayüzünü içerir; API ve veritabanı `../backend` klasöründedir.

---

## Hızlı başlangıç

### 1. Veritabanı (MySQL / XAMPP)

```bash
cd ../backend
cp .env.example .env
# .env içinde: DB_HOST=localhost, DB_USER=root, DB_PASSWORD=, DB_NAME=teknopro

node scripts/import-yedekdb.js
```

- Kaynak SQL: `backend/services/yedekdb/*.sql`
- Script veritabanını sıfırlayıp ~88 tabloyu yeniden oluşturur.
- Örnek kullanıcılar: `database_complete_multilang.sql` (import sırasının sonunda).

### 2. Backend API

```bash
cd ../backend
npm install
npm run dev
```

- Varsayılan: `http://localhost:5000`
- Sağlık kontrolü: `GET http://localhost:5000/api/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

npm install
npm run dev
```

- Varsayılan: `http://localhost:5173`
- Vite, geliştirmede API isteklerini proxy ile backend’e yönlendirebilir (`vite.config`).

---

## Giriş bilgileri (örnek veri)

Tüm örnek hesapların şifresi: **`123456`**

> Eski yedekte hash yanlışlıkla `password` şifresine aitti; `123456` çalışmıyorsa:
> `cd ../backend && node scripts/reset-demo-passwords.js`

| Rol | Kullanıcı adı | E-posta | Panel / yönlendirme |
|-----|---------------|---------|---------------------|
| **Admin** | `admin` | `admin@teknoproje.com` | `/admin/dashboard` |
| **Satıcı** | `ahmet` | `ahmet@example.com` | `/seller/dashboard` |
| **Satıcı** | `ayse` | `ayse@example.com` | `/seller/dashboard` |
| **Satıcı** | `ali` | `ali@example.com` | `/seller/dashboard` |
| **Kullanıcı** | `mehmet` | `mehmet@example.com` | `/user/dashboard` |
| **Kullanıcı** | `zeynep` | `zeynep@example.com` | `/user/dashboard` |

**Giriş sayfası:** `/login`  
**Kayıt:** `/register`

> JWT oturumu `localStorage` içinde `token` anahtarıyla tutulur. Admin sayfaları `requireAdmin`, satıcı sayfaları `requireSeller` ile korunur.

### Rol ID’leri (`user_roles`)

| id | slug | Açıklama |
|----|------|----------|
| 1 | `admin` | Tam yönetim paneli |
| 2 | `user` | Alıcı / normal üye |
| 3 | `seller` | Proje satıcısı |
| 4 | `moderator` | İçerik moderasyonu (örnek veride opsiyonel) |

---

## Sistem mimarisi

```
┌─────────────────┐     HTTPS/JSON      ┌──────────────────┐
│  React (Vite)   │ ◄──────────────────►│ Express API      │
│  localhost:5173 │     JWT + REST      │  localhost:5000  │
└────────┬────────┘                     └────────┬─────────┘
         │ Context: Auth, Cart,                    │
         │ Language, Currency, Modules              │ mysql2
         └──────────────────────────────────────────►│ MySQL (teknopro)
```

| Katman | Teknoloji |
|--------|-----------|
| UI | React 19, React Router 7, Framer Motion |
| HTTP | Axios (`src/api/`) |
| Editör | TipTap (blog / admin içerik) |
| API | Node.js, Express, JWT, Multer |
| Veri | MySQL 8 / MariaDB (utf8mb4) |

---

## Aç/kapa modüller

Admin → **Ayarlar → Modüller** (`/admin/settings/modules`) veya API: `GET /api/public/settings/modules`

| Modül anahtarı | Açıklama | Public route |
|----------------|----------|--------------|
| `blogEnabled` | Blog | `/blog`, `/blog/:slug` |
| `ticketsEnabled` | Destek talepleri | `/tickets` |
| `donationsEnabled` | Proje bağışları | Proje detay + `/user/donations` |
| `subscriptionsEnabled` | Abonelik planları | `/subscriptions` |
| `commentsEnabled` | Blog yorumları | Blog detay |
| `ratingsEnabled` | Proje puanlama | Proje detay |

Modül kapalıysa ilgili route ana sayfaya yönlendirilir (`ModuleRoute`).

---

## Özellikler ve sayfalar

### Herkese açık

| Sayfa | Route | Özet |
|-------|-------|------|
| Ana sayfa | `/` | Hero, özellikler, proje slider/grid, istatistik, SSS, hakkımızda, blog özeti, yorumlar, iletişim |
| Projeler | `/projects` | Filtre, sıralama, mobil filtre sheet, kart grid |
| Proje detay | `/projects/:id` | Galeri, satıcı, fiyat, bağış, sepete ekle, yorumlar |
| Sepet | `/cart` | Sepet satırları, kupon |
| Ödeme | `/checkout-wizard` | Adım adım ödeme (giriş gerekli) |
| Blog | `/blog` | Liste, kategori, arama |
| Blog yazısı | `/blog/:slug` | İçerik, TOC, paylaşım |
| İletişim | `/contact` | Form, harita |
| Satış / paketler | `/sales` | Paket satış akışı |
| Dinamik sayfa | `/page/:slug`, `/:slug` | CMS sayfaları |
| Bakım | `/maintenance` | Bakım modu ekranı |

### Kullanıcı paneli (`role_id = 2`)

| Route | İşlev |
|-------|--------|
| `/user/dashboard` | Özet |
| `/user/orders`, `/user/orders/:id` | Siparişler |
| `/user/favorites` | Favoriler |
| `/user/downloads` | İndirilen projeler |
| `/user/wallet` | Cüzdan |
| `/user/transactions` | İşlem geçmişi |
| `/user/donations` | Bağışlar |
| `/user/shares` | Paylaşımlar |
| `/user/messages` | Mesajlar |
| `/user/profile`, `/user/settings` | Profil ve ayarlar |

### Satıcı paneli (`role_id = 3`)

| Route | İşlev |
|-------|--------|
| `/seller/dashboard` | Özet |
| `/seller/projects` | Proje listesi |
| `/seller/add-project`, `/seller/edit-project/:id` | Proje ekle/düzenle |
| `/seller/orders` | Siparişler |
| `/seller/sales`, `/seller/sales/:id` | Satış detayı |
| `/seller/earnings` | Kazanç |
| `/seller/analytics` | Analitik |
| `/seller/customers` | Müşteriler |
| `/seller/coupons` | Kuponlar |
| `/seller/reports` | Raporlar |
| `/seller/media` | Medya kütüphanesi |
| `/seller/messages` | Mesajlar |
| `/seller/favorites` | Favoriler |
| `/seller/profile`, `/seller/settings` | Profil / ayarlar |

### Admin paneli (`role_id = 1`)

| Grup | Route örnekleri |
|------|-----------------|
| Genel | `/admin/dashboard` |
| Kullanıcılar | `/admin/users`, `/admin/users/banned`, `/admin/users/contacts`, toplu e-posta/SMS, bildirim şablonları |
| Projeler | `/admin/projects`, `/admin/projects/:id/edit`, `/admin/categories` |
| Sipariş & ödeme | `/admin/orders`, `/admin/transactions`, `/admin/payment-requests`, `/admin/withdrawals`, `/admin/coupons` |
| Banka | `/admin/bank-accounts`, `/admin/bank-transfer-notifications` |
| Bağış & abonelik | `/admin/donations`, `/admin/subscriptions/*` |
| Blog | `/admin/blog`, `/admin/blog/add`, `/admin/blog/:id/edit` |
| Ana sayfa bölümleri | `/admin/sections`, hero slider, features, stats, FAQ, about, testimonials, projects ayarları |
| CMS | `/admin/pages`, `/admin/menus/header`, `/admin/menus/footer`, `/admin/references`, `/admin/sponsors` |
| Muhasebe | `/admin/accounting/pending-invoices`, `approved-invoices`, fatura detay |
| Destek | `/admin/support` |
| Sadakat | `/admin/loyalty-rewards` |
| Ayarlar | `/admin/settings/general`, `api`, `contact`, `social`, `modules`, `limits`, `maintenance`, `email`, `sms`, `payment`, `backgrounds` |
| Çok dil | `/admin/languages` |

Admin liste sayfaları için şablon: `DESIGN_STANDARDS_LISTING.md`

---

## REST API özeti

Tüm endpoint’ler `/api` altında (backend `server.js`).

| Prefix | Dosya | Konu |
|--------|-------|------|
| `/api/auth` | `routes/auth.js` | Giriş, kayıt, şifre sıfırlama |
| `/api/projects` | `routes/projects.js` | Proje CRUD, liste, arama |
| `/api/users` | `routes/users.js` | Profil, favori, indirme |
| `/api/admin` | `routes/admin.js` | Yönetim işlemleri |
| `/api/seller` | `routes/seller.js` | Satıcı işlemleri |
| `/api/cart` | `routes/cart.js` | Sepet |
| `/api/orders` | `routes/orders.js` | Sipariş |
| `/api/payments` | `routes/payments.js` | Ödeme |
| `/api/wallet/payments` | `routes/walletPayments.js` | Cüzdan ödemeleri |
| `/api/donations` | `routes/donations.js` | Bağış |
| `/api/subscriptions` | `routes/subscriptions.js` | Abonelik |
| `/api/blog` | `routes/blog.js` | Blog |
| `/api/tickets` | `routes/tickets.js` | Destek |
| `/api/coupons` | `routes/coupons.js` | Kupon |
| `/api/reviews` | `routes/reviews.js` | Yorum / puan |
| `/api/leads` | `routes/leads.js` | Potansiyel müşteri |
| `/api/sales` | `routes/sales.js` | Paket satışları |
| `/api/sections` | `routes/sections.js` | Ana sayfa bölümleri |
| `/api/pages` | `routes/pages.js` | CMS sayfaları |
| `/api/menus` | `routes/menus.js` | Menüler |
| `/api/i18n` | `routes/i18n.js` | Çeviriler |
| `/api/public/settings` | `routes/publicSettings.js` | Site ayarları, modüller |
| `/api/bank-accounts` | `routes/bankAccounts.js` | Havale hesapları |
| `/api/user/addresses` | `routes/userAddresses.js` | Adresler |
| `/api/user/payment-cards` | `routes/userPaymentCards.js` | Kayıtlı kartlar |

Yüklenen dosyalar: `backend/public/uploads` → `GET /uploads/...`

---

## MySQL veritabanı yapısı

**Veritabanı adı:** `teknopro` (varsayılan)  
**Şema kaynağı:** `backend/services/yedekdb/database.sql` + migration SQL dosyaları

### Kurulum sırası (`import-yedekdb.js`)

1. `database.sql` — temel şema  
2. `database_missing_tables.sql`, `database_alter_tables.sql`, i18n migration’ları  
3. Diğer `database_*.sql` dosyaları (alfabetik)  
4. `database_complete_multilang.sql` — diller + örnek kullanıcılar + çok dilli içerik  

> `database_sample_data.sql` import script’inde **atlanır**; örnek veri için `database_complete_multilang.sql` kullanılır.

### Tablo grupları

#### Kullanıcı & güvenlik

| Tablo | Açıklama |
|-------|----------|
| `user_roles` | admin, user, seller, moderator |
| `users` | Hesaplar, `role_id`, durum, 2FA alanları |
| `user_logs` | Kullanıcı aktivite logları |
| `admin_logs` | Admin işlem logları |
| `user_accesses` | Erişim / indirme hakları |
| `user_addresses` | Teslimat / fatura adresleri |
| `user_payment_cards` | Kayıtlı ödeme kartları |

#### Proje marketplace

| Tablo | Açıklama |
|-------|----------|
| `categories` | Hiyerarşik kategoriler |
| `tags`, `project_tags` | Teknoloji / etiketler |
| `projects` | Fiyat, indirim, bağış hedefi, tamamlanma %, durum |
| `project_images` | Galeri |
| `project_files` | İndirilebilir dosyalar |
| `reviews` | Puan ve yorum |
| `favorites` | Favori projeler |
| `downloads` | İndirme kayıtları |
| `cart` | Sepet |
| `orders`, `order_items` | Siparişler |
| `coupons` | İndirim kuponları |
| `transactions` | Para hareketleri |
| `project_donations` | Bağış kayıtları |

#### Blog & içerik

| Tablo | Açıklama |
|-------|----------|
| `blog_posts`, `blog_categories`, `blog_tags`, `blog_post_tags` | Blog |
| `blog_comments`, `blog_likes`, `blog_views` | Etkileşim |
| `pages` | Statik CMS sayfaları |
| `faqs` | SSS (genel) |
| `faq_items` | Ana sayfa SSS öğeleri |

#### Ana sayfa & pazarlama

| Tablo | Açıklama |
|-------|----------|
| `home_sections` | Bölüm meta (hero, features, …) |
| `homepage_sections` | Alternatif / legacy bölüm kayıtları |
| `hero_slides` | Hero slider |
| `features_items`, `stats_items`, `about_items`, `testimonials_items` | Bölüm içerikleri |
| `references`, `sponsors` | Referans ve sponsor |
| `advertisements`, `ad_clicks`, `ad_views` | Reklam |

#### Abonelik & satış paketleri

| Tablo | Açıklama |
|-------|----------|
| `subscription_plans`, `plan_features`, `plan_feature_values` | Plan tanımları |
| `user_subscriptions` | Aktif abonelikler |
| `subscription_transactions`, `subscription_logs` | Abonelik ödemeleri |
| `product_packages`, `sales_orders` | Paket satışları |

#### Destek & iletişim

| Tablo | Açıklama |
|-------|----------|
| `tickets`, `ticket_replies`, `ticket_attachments`, `ticket_logs` | Destek bileti |
| `support_departments` | Departmanlar (migration SQL) |
| `messages` | Kullanıcı mesajları |
| `contact_messages` | İletişim formu |

#### Ödeme & muhasebe

| Tablo | Açıklama |
|-------|----------|
| `payment_logs` | Ödeme logları |
| `bank_accounts` | Havale IBAN bilgileri |
| `bank_transfer_notifications` | Havale bildirimleri |
| `invoices` | Faturalar |
| `settings` | Site ayarları (key-value) |

#### CRM & pazarlama

| Tablo | Açıklama |
|-------|----------|
| `leads`, `lead_interests`, `lead_notes`, `lead_status_history`, `lead_scores` | Lead yönetimi |
| `menu_items` | Header / footer menü |
| `notifications` | Bildirimler |
| `newsletter_subscribers`, `newsletter_campaigns` | E-bülten |

#### Çok dil (i18n)

| Tablo | Açıklama |
|-------|----------|
| `languages` | tr, en, de, … |
| `translations` | Anahtar–değer çevirileri (migration dosyalarında) |

### `projects` tablosu — önemli alanlar

| Alan | Tip / anlam |
|------|-------------|
| `status` | `draft`, `pending`, `approved`, `rejected`, `active`, `inactive` |
| `price`, `discount_price`, `currency` | Satış fiyatı |
| `completion_percentage` | Geliştirme ilerlemesi (100 = tamamlandı) |
| `donation_target`, `donation_received` | Bağış kampanyası |
| `featured` | Öne çıkan proje |
| `view_count`, `download_count`, `rating` | İstatistikler |

---

## Frontend klasör yapısı

```
frontend/src/
├── api/              # Axios modülleri (projects, auth, admin, …)
├── components/       # Header, Footer, modals, motion, auth
├── context/          # Auth, Cart, Language, Currency, Modules, Theme
├── pages/            # Route sayfaları (Home, Projects, Admin*, Seller*, User*)
├── utils/            # motion, techIcons, api helpers
├── App.jsx           # Tüm route tanımları
└── main.jsx
```

### Ortam değişkenleri

| Değişken | Örnek | Açıklama |
|----------|-------|----------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API kök URL |

### Komutlar

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm run preview  # Build önizleme
npm run lint     # ESLint
```

---

## Çok dil

- Varsayılan diller: **Türkçe (tr)**, **İngilizce (en)**, **Almanca (de)**
- Çeviriler: `translations` tablosu + `LanguageContext`
- Admin’den dil ve çeviri yönetimi: `/admin/languages`
- Checkout, auth, proje metinleri için ayrı SQL migration dosyaları (`database_*_translations.sql`)

---

## Bakım modu

- Admin: `/admin/settings/maintenance`
- Aktifken ziyaretçiler `/maintenance` görür; admin ve auth API yolları muaf tutulur (`checkMaintenanceMode` middleware).

---

## Güvenlik notları

- Production’da `JWT_SECRET` güçlü ve gizli olmalıdır.
- Örnek şifre **`123456`** yalnızca geliştirme içindir; canlıda değiştirin.
- `.env` dosyalarını repoya commit etmeyin.

---

## İlgili dokümanlar

| Dosya | Konu |
|-------|------|
| `../backend/README.md` | API kurulum, Render deploy |
| `DESIGN_STANDARDS_LISTING.md` | Admin liste sayfası UI standardı |
| `backend/services/yedekdb/database.sql` | Tam şema |
| `backend/services/yedekdb/database_complete_multilang.sql` | Örnek veri + giriş özeti |

---

## Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| API bağlanmıyor | Backend çalışıyor mu? `VITE_API_URL` ve CORS (`backend/.env` → `CORS_ORIGIN`) |
| Giriş olmuyor | Backend çalışıyor mu? `node scripts/reset-demo-passwords.js` ile şifreyi `123456` yapın |
| Boş proje listesi | `database_complete_multilang.sql` yüklendi mi? |
| Modül sayfası 404 | Admin → Modüller’den ilgili modülü açın |

---

*Son güncelleme: proje yedek veritabanı ve mevcut route yapısına göre hazırlanmıştır.*
