-- Settings tablosuna eksik ayarları ekle
-- Bu SQL dosyası, yeni ayar sayfaları için gerekli veritabanı güncellemelerini içerir

-- Genel Ayarlar (general)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('site_name', 'TeknoProje', 'text', 'general', 'Site adı'),
('site_description', '', 'text', 'general', 'Site açıklaması'),
('site_url', 'http://localhost:3000', 'text', 'general', 'Site URL'),
('site_email', 'info@teknoproje.com', 'email', 'general', 'Site e-posta adresi'),
('site_phone', '', 'text', 'general', 'Site telefon numarası'),
('site_address', '', 'text', 'general', 'Site adresi'),
('logo', '', 'text', 'general', 'Logo URL'),
('favicon', '', 'text', 'general', 'Favicon URL'),
('timezone', 'Europe/Istanbul', 'text', 'general', 'Zaman dilimi'),
('currency', 'TRY', 'text', 'general', 'Para birimi'),
('language', 'tr', 'text', 'general', 'Varsayılan dil')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- API Ayarları (api)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('api_enabled', '0', 'boolean', 'api', 'API etkin mi?'),
('api_key', '', 'text', 'api', 'API anahtarı'),
('api_secret', '', 'text', 'api', 'API gizli anahtarı'),
('rate_limit', '100', 'number', 'api', 'Rate limit (istek/dakika)'),
('allowed_origins', '', 'text', 'api', 'İzin verilen origin\'ler')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- İletişim Ayarları (contact)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('email', 'info@teknoproje.com', 'email', 'contact', 'İletişim e-postası'),
('phone', '', 'text', 'contact', 'İletişim telefonu'),
('address', '', 'text', 'contact', 'İletişim adresi'),
('working_hours', '', 'text', 'contact', 'Çalışma saatleri'),
('map_embed', '', 'text', 'contact', 'Harita embed kodu')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Sosyal Medya Ayarları (social)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('facebook', '', 'text', 'social', 'Facebook sayfa URL'),
('twitter', '', 'text', 'social', 'Twitter profil URL'),
('instagram', '', 'text', 'social', 'Instagram profil URL'),
('linkedin', '', 'text', 'social', 'LinkedIn sayfa URL'),
('youtube', '', 'text', 'social', 'YouTube kanal URL'),
('github', '', 'text', 'social', 'GitHub profil URL')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Modül Ayarları (modules)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('blog_enabled', '1', 'boolean', 'modules', 'Blog modülü etkin mi?'),
('tickets_enabled', '1', 'boolean', 'modules', 'Destek modülü etkin mi?'),
('donations_enabled', '1', 'boolean', 'modules', 'Bağış modülü etkin mi?'),
('subscriptions_enabled', '1', 'boolean', 'modules', 'Abonelik modülü etkin mi?'),
('comments_enabled', '1', 'boolean', 'modules', 'Yorum modülü etkin mi?'),
('ratings_enabled', '1', 'boolean', 'modules', 'Değerlendirme modülü etkin mi?')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Limit Ayarları (limits)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('max_file_size', '10', 'number', 'limits', 'Maksimum dosya boyutu (MB)'),
('max_projects_per_user', '10', 'number', 'limits', 'Kullanıcı başına maksimum proje sayısı'),
('max_images_per_project', '20', 'number', 'limits', 'Proje başına maksimum görsel sayısı'),
('max_file_uploads', '5', 'number', 'limits', 'Maksimum dosya yükleme sayısı')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Bakım Modu (maintenance)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('enabled', '0', 'boolean', 'maintenance', 'Bakım modu etkin mi?'),
('message', 'Site bakımda. Lütfen daha sonra tekrar deneyin.', 'text', 'maintenance', 'Bakım mesajı'),
('allowed_ips', '', 'text', 'maintenance', 'İzin verilen IP adresleri')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Mail Ayarları (email)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('smtp_host', '', 'text', 'email', 'SMTP sunucu adresi'),
('smtp_port', '587', 'number', 'email', 'SMTP port numarası'),
('smtp_user', '', 'text', 'email', 'SMTP kullanıcı adı'),
('smtp_password', '', 'text', 'email', 'SMTP şifre'),
('smtp_secure', '0', 'boolean', 'email', 'TLS/SSL kullan'),
('from_email', '', 'email', 'email', 'Gönderen e-posta'),
('from_name', '', 'text', 'email', 'Gönderen isim')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- SMS Ayarları (sms)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('provider', '', 'text', 'sms', 'SMS sağlayıcı'),
('api_key', '', 'text', 'sms', 'SMS API anahtarı'),
('api_secret', '', 'text', 'sms', 'SMS API gizli anahtarı'),
('sender_id', '', 'text', 'sms', 'Gönderen ID')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Ödeme Ayarları (payment)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('stripe_enabled', '0', 'boolean', 'payment', 'Stripe etkin mi?'),
('stripe_public_key', '', 'text', 'payment', 'Stripe Public Key'),
('stripe_secret_key', '', 'text', 'payment', 'Stripe Secret Key'),
('iyzico_enabled', '0', 'boolean', 'payment', 'Iyzico etkin mi?'),
('iyzico_api_key', '', 'text', 'payment', 'Iyzico API Key'),
('iyzico_secret_key', '', 'text', 'payment', 'Iyzico Secret Key'),
('paypal_enabled', '0', 'boolean', 'payment', 'PayPal etkin mi?'),
('paypal_client_id', '', 'text', 'payment', 'PayPal Client ID'),
('paypal_secret', '', 'text', 'payment', 'PayPal Secret')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- Arka Plan Görselleri (backgrounds)
INSERT INTO `settings` (`key`, `value`, `type`, `group`, `description`) VALUES
('header_background', '', 'text', 'backgrounds', 'Header arka plan görseli'),
('footer_background', '', 'text', 'backgrounds', 'Footer arka plan görseli'),
('login_background', '', 'text', 'backgrounds', 'Giriş sayfası arka plan görseli'),
('register_background', '', 'text', 'backgrounds', 'Kayıt sayfası arka plan görseli'),
('dashboard_background', '', 'text', 'backgrounds', 'Dashboard arka plan görseli')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

