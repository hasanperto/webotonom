-- ============================================================
-- PROJE EKLEMESİ: Almanca Fiil Kart Oyunu (game.webotonom.de)
-- Çalıştırma: database.sql + database_sample_data.sql sonrası
-- ============================================================

USE `teknopro`;

-- ============================================
-- 1. YENİ ETİKETLER
-- ============================================
INSERT IGNORE INTO `tags` (`id`, `name`, `slug`) VALUES
(21, 'Socket.io',   'socketio'),
(22, 'PWA',         'pwa'),
(23, 'WebSocket',   'websocket'),
(24, 'Oyun',        'oyun'),
(25, 'Eğitim',      'egitim'),
(26, 'Almanca',     'almanca'),
(27, 'Express.js',  'expressjs');

-- ============================================
-- 2. PROJE (id = 16)
-- Canlı site: https://game.webotonom.de/
-- Tamamlanmış, ücretsiz, öne çıkan proje
-- ============================================
INSERT IGNORE INTO `projects`
  (`id`, `user_id`, `title`, `slug`,
   `short_description`,
   `description`,
   `category_id`, `price`, `discount_price`, `currency`,
   `license_type`, `demo_url`, `video_url`, `version`,
   `status`, `featured`, `completion_percentage`,
   `donation_target`, `donation_received`,
   `view_count`, `download_count`, `rating`, `rating_count`,
   `technologies`, `requirements`,
   `created_at`)
VALUES (
  16, 1,
  'Almanca Fiil Kart Oyunu',
  'almanca-fiil-kart-oyunu',

  'Almanca fiilleri eğlenceli kart oyunu formatında öğrenin. Tek ve çok oyunculu mod, XP sistemi, PWA — her cihazda çalışır.',

  'Almanca Fiil Kart Oyunu, Almanca öğrenmek isteyenlere yönelik geliştirilmiş ücretsiz ve açık kaynaklı bir web uygulamasıdır. 500\'den fazla fiili kart oyunu formatında, eğlenceli ve rekabetçi bir ortamda öğretir. Hem internet bağlantısı olmadan tek başına hem de arkadaşlarla gerçek zamanlı oynamak mümkündür.\n\n'
  '## Modüller ve Özellikler\n\n'
  '### Oyun Modları\n'
  '- **Tek Oyuncu (Offline):** İnternet gerektirmez. Aynı cihazda 1–4 kişi sırayla oynayabilir (Pass & Play). A1\'den C1\'e kadar zorluk seviyesi seçimi yapılabilir.\n'
  '- **Çok Oyunculu (Online):** Socket.io ile gerçek zamanlı WebSocket bağlantısı. Oda (lobi) oluştur, bağlantı kodu paylaş, 4 kişiye kadar eş zamanlı oyna. Sorular sunucu tarafında doğrulanır; hile yapılamaz.\n\n'
  '### Soru ve İçerik Bankası\n'
  '- 500\'den fazla Almanca fiil, 4 şıklı çoktan seçmeli format\n'
  '- A1 (Başlangıç) → C1 (İleri) seviye filtreleme\n'
  '- Sorular ve seçenekler her oyunda rastgele karıştırılır\n'
  '- Soru dili seçimi: Türkçe, Almanca, Ukraynaca, Arapça\n\n'
  '### Lobi ve Oda Yönetimi\n'
  '- Rastgele UUID ile oda oluşturma / odaya katılma\n'
  '- Host (oda kurucusu) oyun ayarlarını belirler: soru sayısı, süre sınırı, maksimum oyuncu\n'
  '- Hazır olma sistemi: tüm oyuncular hazır olmadan oyun başlamaz\n'
  '- Host ayrılırsa oda otomatik olarak bir sonraki oyuncuya devredilir\n\n'
  '### Zamanlama ve Sıra Sistemi\n'
  '- Sıra tabanlı oynanış: sadece sırası gelen oyuncu cevap verebilir\n'
  '- Her istemci bağımsız sayaç yönetir (senkronizasyon kayması önlenir)\n'
  '- Süre dolduğunda sunucu otomatik pas geçer (player_timeout)\n'
  '- Combo bonus: üst üste doğru cevaplarda çarpan artar\n\n'
  '### İlerleme ve Oyuncu Profili\n'
  '- XP & Seviye sistemi: her doğru cevap ve oyun sonunda XP kazanılır\n'
  '- Otomatik rozet sistemi: seviyeye göre özel rozetler\n'
  '- Başarım sistemi: özel görevleri tamamlayarak ödüller\n'
  '- Günlük görevler ve seri (streak) takibi\n'
  '- Liderlik tablosu: haftalık / aylık en yüksek skorlar\n\n'
  '### Mağaza ve Premium\n'
  '- Bronz, Silver, Gold premium paketleri\n'
  '- Özel çerçeveler, power-up\'lar (zaman bonusu, hata kalkanı, zaman dondurucu)\n'
  '- Arkadaş ekleme ve davet sistemi\n\n'
  '### PWA ve Mobil\n'
  '- Progressive Web App: ana ekrana ekleme, splash screen, maskeli ikonlar\n'
  '- Service Worker ile offline önbellekleme — uygulama internet olmadan açılır\n'
  '- PWABuilder ile Android APK üretilebilir\n'
  '- Tüm ekran boyutlarına duyarlı (responsive) tasarım\n\n'
  '### Gerçek Zamanlı Sohbet\n'
  '- Lobi içi anlık mesajlaşma (Socket.io chat_message olayı)\n'
  '- Mesajlar sunucu tarafında filtrelerek yalnızca ilgili lobiye iletilir\n\n'
  '## Teknik Altyapı\n'
  '- **Frontend:** Vanilla HTML5, CSS3 (Grid & Flexbox), JavaScript ES6+\n'
  '- **Backend:** Node.js, Express.js\n'
  '- **Gerçek Zamanlı:** Socket.io (WebSocket)\n'
  '- **PWA:** Service Worker, Web App Manifest\n'
  '- **Canlı Site:** https://game.webotonom.de/',

  1,        -- category_id: Web Uygulamaları
  0.00,     -- price: ücretsiz
  NULL,     -- discount_price
  'TRY',
  'open_source',
  'https://game.webotonom.de/',
  NULL,
  '3.0.0',
  'active',
  1,        -- featured: öne çıkan
  100,      -- tamamlanmış
  NULL,     -- donation_target
  0.00,     -- donation_received
  0,        -- view_count (canlıda sayılacak)
  0,        -- download_count
  0.00,     -- rating
  0,        -- rating_count
  'HTML5, CSS3, JavaScript, Node.js, Express.js, Socket.io, PWA, Service Worker',
  'Modern tarayıcı (Chrome, Firefox, Safari, Edge). Çok oyunculu mod için internet bağlantısı gereklidir.',
  '2025-01-01 00:00:00'
);

-- ============================================
-- 3. PROJE-ETİKET İLİŞKİLERİ
-- ============================================
INSERT IGNORE INTO `project_tags` (`project_id`, `tag_id`) VALUES
(16, 6),   -- JavaScript
(16, 21),  -- Socket.io
(16, 22),  -- PWA
(16, 23),  -- WebSocket
(16, 24),  -- Oyun
(16, 25),  -- Eğitim
(16, 26),  -- Almanca
(16, 27);  -- Express.js

-- ============================================
-- 4. ÇOK DİLLİ ÇEVIRILER (content_translations)
-- ============================================

-- Türkçe
INSERT IGNORE INTO `content_translations`
  (`content_id`, `content_type`, `language_code`, `title`, `short_description`, `description`)
VALUES (
  16, 'project', 'tr',
  'Almanca Fiil Kart Oyunu',
  'Almanca fiilleri eğlenceli kart oyunu formatında öğrenin. Tek ve çok oyunculu mod, XP sistemi, PWA — her cihazda çalışır.',
  '500+ Almanca fiili kart oyunu formatında öğreten ücretsiz web uygulaması. Tek oyuncu (offline) ve gerçek zamanlı çok oyunculu (Socket.io, 4 kişi) mod destekler. A1–C1 zorluk seviyeleri, XP & seviye sistemi, günlük görevler, rozet ve liderlik tablosu içerir. Progressive Web App olarak ana ekrana eklenebilir, offline çalışır. Node.js, Express.js ve Socket.io ile geliştirilmiştir.'
);

-- İngilizce
INSERT IGNORE INTO `content_translations`
  (`content_id`, `content_type`, `language_code`, `title`, `short_description`, `description`)
VALUES (
  16, 'project', 'en',
  'German Verb Card Game',
  'Learn German verbs in a fun card game format. Single and multiplayer modes, XP system, PWA — works on any device.',
  'A free, open-source web application that teaches 500+ German verbs through an interactive card game. Supports offline single-player and real-time online multiplayer (up to 4 players via Socket.io). Features A1–C1 difficulty levels, XP & leveling system, daily quests, badges, leaderboards, an in-game store, and premium power-ups. Installable as a Progressive Web App — works offline. Built with Vanilla JS, Node.js, Express.js, and Socket.io.'
);

-- Almanca
INSERT IGNORE INTO `content_translations`
  (`content_id`, `content_type`, `language_code`, `title`, `short_description`, `description`)
VALUES (
  16, 'project', 'de',
  'Deutsches Verb-Kartenspiel',
  'Lerne deutsche Verben spielerisch im Kartenformat. Einzel- und Mehrspielermodus, XP-System, PWA — auf jedem Gerät nutzbar.',
  'Eine kostenlose Web-App zum Lernen von über 500 deutschen Verben im Kartenspiel-Format. Unterstützt Offline-Einzelspieler und Echtzeit-Mehrspieler (bis zu 4 Personen über Socket.io). Beinhaltet Schwierigkeitsstufen A1–C1, XP- & Levelsystem, tägliche Aufgaben, Abzeichen, Bestenlisten und Premium-Pakete. Als Progressive Web App installierbar und offline nutzbar. Entwickelt mit Vanilla JS, Node.js, Express.js und Socket.io.'
);

-- ============================================
-- 5. KONTROL (isteğe bağlı çalıştır)
-- ============================================
-- SELECT p.id, p.title, p.slug, p.status, p.featured
-- FROM projects p WHERE p.id = 16;
--
-- SELECT ct.language_code, ct.title
-- FROM content_translations ct
-- WHERE ct.content_id = 16 AND ct.content_type = 'project';
