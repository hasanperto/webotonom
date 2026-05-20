-- TeknoProje Örnek Veri SQL
-- Veritabanı adı: teknopro
-- Bu dosyayı database.sql'den sonra çalıştırın
-- INSERT IGNORE kullanılarak mevcut veriler korunur

USE `teknopro`;

-- ============================================
-- 1. KULLANICI ROLLERİ (Mevcut olanlar atlanır)
-- ============================================
INSERT IGNORE INTO `user_roles` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Admin', 'admin', 'Sistem yöneticisi'),
(2, 'Kullanıcı', 'user', 'Normal kullanıcı'),
(3, 'Satıcı', 'seller', 'Proje satıcısı'),
(4, 'Moderatör', 'moderator', 'İçerik moderatörü');

-- ============================================
-- 2. ÖRNEK KULLANICILAR (Mevcut olanlar atlanır)
-- ============================================
-- Şifre: 123456 (bcrypt hash — doğrulanmış)
-- NOT: role_id kullanılıyor (1=admin, 2=user, 3=seller)
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone`, `role_id`, `status`, `email_verified`, `bio`, `website`, `location`) VALUES
(1, 'admin', 'admin@teknoproje.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Admin', 'User', '+90 555 111 1111', 1, 'active', 1, 'Sistem yöneticisi', 'https://teknoproje.com', 'İstanbul, Türkiye'),
(2, 'ahmet', 'ahmet@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Ahmet', 'Yılmaz', '+90 555 222 2222', 3, 'active', 1, 'Full-stack developer, 10 yıllık deneyim', 'https://ahmetyilmaz.dev', 'Ankara, Türkiye'),
(3, 'ayse', 'ayse@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Ayşe', 'Kaya', '+90 555 333 3333', 3, 'active', 1, 'UI/UX tasarımcı ve frontend developer', 'https://aysekaya.com', 'İzmir, Türkiye'),
(4, 'mehmet', 'mehmet@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Mehmet', 'Demir', '+90 555 444 4444', 2, 'active', 1, 'Yazılım meraklısı', NULL, 'Bursa, Türkiye'),
(5, 'zeynep', 'zeynep@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Zeynep', 'Çelik', '+90 555 555 5555', 2, 'active', 1, 'Mobil uygulama geliştirici', 'https://zeynepcelik.dev', 'Antalya, Türkiye'),
(6, 'ali', 'ali@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Ali', 'Öztürk', '+90 555 666 6666', 3, 'active', 1, 'Backend uzmanı, Node.js ve Python', 'https://aliozturk.io', 'Konya, Türkiye');

-- ============================================
-- 3. KATEGORİLER (Mevcut olanlar atlanır)
-- NOT: database.sql'de color sütunu yok, icon ve sort_order var
-- ============================================
INSERT IGNORE INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `parent_id`, `sort_order`, `status`) VALUES
(1, 'Web Uygulamaları', 'web-uygulamalari', 'Web tabanlı projeler ve uygulamalar', 'globe', NULL, 1, 'active'),
(2, 'Mobil Uygulamalar', 'mobil-uygulamalar', 'iOS ve Android uygulamaları', 'smartphone', NULL, 2, 'active'),
(3, 'API & Backend', 'api-backend', 'API servisleri ve backend çözümleri', 'server', NULL, 3, 'active'),
(4, 'E-Ticaret', 'e-ticaret', 'E-ticaret platformları ve çözümleri', 'shopping-cart', NULL, 4, 'active'),
(5, 'Yapay Zeka', 'yapay-zeka', 'AI ve makine öğrenmesi projeleri', 'cpu', NULL, 5, 'active'),
(6, 'CMS & Blog', 'cms-blog', 'İçerik yönetim sistemleri', 'file-text', NULL, 6, 'active'),
(7, 'React Projeleri', 'react-projeleri', 'React.js ile geliştirilmiş projeler', 'code', 1, 7, 'active'),
(8, 'Vue.js Projeleri', 'vuejs-projeleri', 'Vue.js ile geliştirilmiş projeler', 'code', 1, 8, 'active'),
(9, 'Node.js API', 'nodejs-api', 'Node.js ile geliştirilmiş API\'ler', 'terminal', 3, 9, 'active'),
(10, 'Python API', 'python-api', 'Python ile geliştirilmiş API\'ler', 'terminal', 3, 10, 'active');

-- ============================================
-- 4. ETİKETLER (Mevcut olanlar atlanır)
-- NOT: database.sql'de color sütunu yok
-- ============================================
INSERT IGNORE INTO `tags` (`id`, `name`, `slug`) VALUES
(1, 'React', 'react'),
(2, 'Vue.js', 'vuejs'),
(3, 'Node.js', 'nodejs'),
(4, 'Python', 'python'),
(5, 'TypeScript', 'typescript'),
(6, 'JavaScript', 'javascript'),
(7, 'TailwindCSS', 'tailwindcss'),
(8, 'MySQL', 'mysql'),
(9, 'PostgreSQL', 'postgresql'),
(10, 'MongoDB', 'mongodb'),
(11, 'Redis', 'redis'),
(12, 'Docker', 'docker'),
(13, 'AWS', 'aws'),
(14, 'Firebase', 'firebase'),
(15, 'GraphQL', 'graphql'),
(16, 'REST API', 'rest-api'),
(17, 'AI/ML', 'ai-ml'),
(18, 'Flutter', 'flutter'),
(19, 'React Native', 'react-native'),
(20, 'Laravel', 'laravel');

-- ============================================
-- 5. PROJELER (Mevcut olanlar atlanır)
-- NOT: database.sql yapısına uygun sütunlar kullanıldı
-- ============================================
INSERT IGNORE INTO `projects` (`id`, `user_id`, `title`, `slug`, `short_description`, `description`, `category_id`, `price`, `discount_price`, `currency`, `license_type`, `demo_url`, `video_url`, `version`, `status`, `featured`, `completion_percentage`, `donation_target`, `donation_received`, `view_count`, `download_count`, `rating`, `rating_count`, `created_at`) VALUES
-- Tamamlanmış Projeler (completion_percentage = 100, donation_target = NULL)
(1, 2, 'TeknoShop E-Ticaret Platformu', 'teknoshop-e-ticaret', 'Modern ve hızlı e-ticaret çözümü', 'TeknoShop, React ve Node.js ile geliştirilmiş kapsamlı bir e-ticaret platformudur. Ödeme entegrasyonları, stok yönetimi, sipariş takibi ve admin paneli içerir. Stripe ve iyzico entegrasyonu hazır. Tamamen tamamlanmış ve production-ready bir projedir.', 4, 2499.00, 1999.00, 'TRY', 'extended', 'https://demo.teknoshop.com', NULL, '2.5.0', 'active', 1, 100, NULL, 0.00, 15420, 342, 4.8, 156, '2024-01-15 10:00:00'),
(2, 2, 'TaskFlow Proje Yönetimi', 'taskflow-proje-yonetimi', 'Agile takımlar için proje yönetim aracı', 'TaskFlow, Kanban board, sprint planlama, zaman takibi ve raporlama özellikleri sunan modern bir proje yönetim uygulamasıdır. Real-time güncellemeler ve takım işbirliği araçları içerir. Proje tamamen tamamlanmıştır ve kullanıma hazırdır.', 1, 1499.00, NULL, 'TRY', 'regular', 'https://demo.taskflow.app', NULL, '3.1.2', 'active', 1, 100, NULL, 0.00, 8750, 189, 4.6, 89, '2024-02-20 14:30:00'),
(3, 3, 'BlogCraft CMS', 'blogcraft-cms', 'SEO dostu blog ve içerik yönetim sistemi', 'BlogCraft, Next.js ve Prisma ile geliştirilmiş modern bir CMS\'dir. Markdown desteği, SEO optimizasyonu, çoklu dil desteği ve güçlü editör özellikleri sunar. Tamamen tamamlanmış ve production-ready bir projedir.', 6, 899.00, 749.00, 'TRY', 'regular', 'https://demo.blogcraft.dev', NULL, '1.8.0', 'active', 0, 100, NULL, 0.00, 5230, 127, 4.5, 67, '2024-03-10 09:15:00'),

-- Tamamlanmamış Projeler (completion_percentage < 100, donation_target var)
(4, 3, 'ChatBot AI Assistant', 'chatbot-ai-assistant', 'OpenAI destekli akıllı chatbot', 'Müşteri hizmetleri için geliştirilmiş AI chatbot. OpenAI GPT-4 entegrasyonu, öğrenme yetenekleri ve çoklu platform desteği (web, WhatsApp, Telegram) sunar. Proje şu anda %65 tamamlanmış durumda. Backend API\'ler hazır, frontend geliştirme devam ediyor.', 5, 3499.00, NULL, 'TRY', 'extended', 'https://demo.chatbot-ai.com', NULL, '2.0.1', 'active', 1, 65, 50000.00, 32500.00, 12100, 78, 4.9, 45, '2024-04-05 16:45:00'),
(5, 6, 'RestAPI Boilerplate', 'restapi-boilerplate', 'Production-ready Node.js API başlangıç kiti', 'JWT auth, rate limiting, validation, logging, testing ve Docker desteği ile tam donanımlı API boilerplate. Express.js ve TypeScript kullanır. Proje %45 tamamlanmış. Temel API yapısı hazır, dokümantasyon ve örnekler ekleniyor.', 3, 599.00, 499.00, 'TRY', 'regular', 'https://demo.restapi-kit.dev', NULL, '4.2.0', 'active', 0, 45, 15000.00, 6750.00, 9870, 456, 4.7, 234, '2024-05-12 11:20:00'),
(6, 6, 'DataViz Dashboard', 'dataviz-dashboard', 'Veri görselleştirme ve analitik dashboard', 'Chart.js ve D3.js ile geliştirilmiş interaktif dashboard. Real-time veri güncelleme, özelleştirilebilir widget\'lar ve PDF/Excel export özellikleri. Proje %70 tamamlanmış. Temel grafikler hazır, gelişmiş özellikler ekleniyor.', 1, 1299.00, NULL, 'TRY', 'regular', 'https://demo.dataviz.io', NULL, '1.5.3', 'active', 0, 70, 30000.00, 21000.00, 4560, 98, 4.4, 52, '2024-06-18 13:00:00'),

-- Ücretsiz Projeler (price = 0.00)
(7, 2, 'MobileStore App', 'mobilestore-app', 'React Native e-ticaret mobil uygulaması', 'iOS ve Android için hazır e-ticaret mobil uygulaması. Push notifications, offline mode, deep linking ve sosyal medya entegrasyonu içerir. Açık kaynak ve tamamen ücretsiz bir projedir.', 2, 0.00, NULL, 'TRY', 'open_source', 'https://demo.mobilestore.app', NULL, '2.3.0', 'active', 1, 100, NULL, 0.00, 7890, 156, 4.6, 78, '2024-07-22 08:30:00'),
(8, 3, 'FormBuilder Pro', 'formbuilder-pro', 'Drag & drop form oluşturucu', 'Sürükle bırak ile dinamik form oluşturma aracı. Conditional logic, validation, file upload ve webhook entegrasyonu. React hook-form tabanlı. Tamamen ücretsiz ve açık kaynak bir projedir.', 1, 0.00, NULL, 'TRY', 'open_source', 'https://demo.formbuilder.pro', NULL, '3.0.0', 'active', 0, 100, NULL, 0.00, 6230, 187, 4.5, 93, '2024-08-30 15:45:00'),
(9, 6, 'AuthKit', 'authkit', 'Tam özellikli authentication sistemi', 'Social login, 2FA, magic link, session management ve RBAC içeren authentication kit. Next.js ve Prisma ile çalışır. Ücretsiz ve açık kaynak bir projedir. Topluluk tarafından desteklenmektedir.', 3, 0.00, NULL, 'TRY', 'open_source', 'https://demo.authkit.dev', NULL, '2.1.0', 'active', 0, 100, NULL, 0.00, 11200, 523, 4.8, 267, '2024-09-15 10:00:00'),

-- Ek Projeler
(10, 2, 'VideoStream Platform', 'videostream-platform', 'Video streaming ve yayın platformu', 'HLS streaming, live broadcasting, video on demand, chat ve monetization özellikleri. AWS MediaConvert ve CloudFront entegrasyonu.', 1, 4999.00, NULL, 'TRY', 'extended', 'https://demo.videostream.tv', NULL, '1.2.0', 'active', 1, 100, NULL, 0.00, 3450, 23, 4.7, 12, '2024-10-08 12:30:00'),

-- Yeni Tamamlanmamış Projeler (Fiyat 0.00 değil, bağış hedefi var)
(11, 2, 'IoT Akıllı Ev Sistemi', 'iot-akilli-ev-sistemi', 'Ev otomasyonu için kapsamlı IoT çözümü', 'Akıllı ev otomasyonu sistemi. Sensör entegrasyonu, mobil uygulama kontrolü, sesli asistan desteği ve enerji yönetimi özellikleri. Proje %35 tamamlanmış. Temel sensör okuma ve kontrol mekanizmaları hazır, mobil uygulama ve AI entegrasyonu geliştiriliyor.', 1, 2999.00, NULL, 'TRY', 'regular', 'https://demo.iot-evim.com', NULL, '0.8.0', 'active', 0, 35, 45000.00, 15750.00, 3420, 12, 0.0, 0, '2024-11-10 09:00:00'),
(12, 3, 'Blockchain Wallet App', 'blockchain-wallet-app', 'Güvenli kripto para cüzdan uygulaması', 'Multi-chain destekli kripto para cüzdanı. Bitcoin, Ethereum, BSC ve diğer blockchain ağları için destek. NFT yönetimi, DeFi entegrasyonu ve güvenli saklama. Proje %55 tamamlanmış. Temel cüzdan fonksiyonları hazır, DeFi ve NFT özellikleri ekleniyor.', 2, 3999.00, NULL, 'TRY', 'regular', 'https://demo.blockchain-wallet.app', NULL, '1.2.0', 'active', 1, 55, 75000.00, 41250.00, 5670, 89, 4.3, 23, '2024-11-15 14:20:00'),
(13, 6, 'AI Image Generator', 'ai-image-generator', 'Yapay zeka destekli görsel üretim platformu', 'Stable Diffusion ve DALL-E entegrasyonu ile görsel üretim platformu. Text-to-image, image-to-image, inpainting ve style transfer özellikleri. Proje %28 tamamlanmış. Temel API entegrasyonları yapıldı, kullanıcı arayüzü ve gelişmiş özellikler geliştiriliyor.', 5, 4999.00, NULL, 'TRY', 'regular', 'https://demo.ai-image-gen.com', NULL, '0.5.0', 'active', 0, 28, 60000.00, 16800.00, 2890, 45, 0.0, 0, '2024-11-20 11:30:00'),
(14, 2, 'Social Media Analytics', 'social-media-analytics', 'Sosyal medya analitik ve raporlama platformu', 'Instagram, Twitter, Facebook ve LinkedIn için kapsamlı analitik platform. Hashtag takibi, engagement analizi, rakip analizi ve otomatik raporlama. Proje %62 tamamlanmış. API entegrasyonları tamamlandı, görselleştirme ve raporlama özellikleri geliştiriliyor.', 1, 3499.00, NULL, 'TRY', 'regular', 'https://demo.social-analytics.io', NULL, '1.5.0', 'active', 1, 62, 55000.00, 34100.00, 4120, 67, 4.1, 18, '2024-11-25 16:45:00'),
(15, 3, 'E-Learning Platform', 'e-learning-platform', 'Online eğitim ve kurs yönetim sistemi', 'Video dersler, canlı yayınlar, quiz sistemi, sertifika yönetimi ve öğrenci takip sistemi. Zoom entegrasyonu, ödeme sistemi ve çoklu dil desteği. Proje %40 tamamlanmış. Temel video oynatma ve kullanıcı yönetimi hazır, canlı yayın ve ödeme entegrasyonları geliştiriliyor.', 1, 4499.00, NULL, 'TRY', 'regular', 'https://demo.elearning.edu', NULL, '0.9.0', 'active', 0, 40, 80000.00, 32000.00, 5230, 134, 0.0, 0, '2024-12-01 10:15:00');

-- ============================================
-- 6. PROJE GÖRSELLERİ (Mevcut olanlar atlanır)
-- ============================================
INSERT IGNORE INTO `project_images` (`id`, `project_id`, `image_path`, `is_primary`, `sort_order`) VALUES
-- TeknoShop E-Ticaret (Tamamlanmış)
(1, 1, 'projects/teknoshop-1.jpg', 1, 1),
(2, 1, 'projects/teknoshop-2.jpg', 0, 2),
(3, 1, 'projects/teknoshop-3.jpg', 0, 3),
-- TaskFlow (Tamamlanmış)
(4, 2, 'projects/taskflow-1.jpg', 1, 1),
(5, 2, 'projects/taskflow-2.jpg', 0, 2),
-- BlogCraft CMS (Tamamlanmış)
(6, 3, 'projects/blogcraft-1.jpg', 1, 1),
(7, 3, 'projects/blogcraft-2.jpg', 0, 2),
-- ChatBot AI (Tamamlanmamış - %65)
(8, 4, 'projects/chatbot-1.jpg', 1, 1),
(9, 4, 'projects/chatbot-2.jpg', 0, 2),
-- RestAPI Boilerplate (Tamamlanmamış - %45)
(10, 5, 'projects/restapi-1.jpg', 1, 1),
(11, 5, 'projects/restapi-2.jpg', 0, 2),
-- DataViz Dashboard (Tamamlanmamış - %70)
(12, 6, 'projects/dataviz-1.jpg', 1, 1),
(13, 6, 'projects/dataviz-2.jpg', 0, 2),
(14, 6, 'projects/dataviz-3.jpg', 0, 3),
-- MobileStore App (Ücretsiz)
(15, 7, 'projects/mobilestore-1.jpg', 1, 1),
(16, 7, 'projects/mobilestore-2.jpg', 0, 2),
-- FormBuilder Pro (Ücretsiz)
(17, 8, 'projects/formbuilder-1.jpg', 1, 1),
(18, 8, 'projects/formbuilder-2.jpg', 0, 2),
-- AuthKit (Ücretsiz)
(19, 9, 'projects/authkit-1.jpg', 1, 1),
(20, 9, 'projects/authkit-2.jpg', 0, 2),
-- VideoStream Platform
(21, 10, 'projects/videostream-1.jpg', 1, 1),
(22, 10, 'projects/videostream-2.jpg', 0, 2),
-- IoT Akıllı Ev Sistemi (Tamamlanmamış - %35)
(23, 11, 'projects/iot-evim-1.jpg', 1, 1),
(24, 11, 'projects/iot-evim-2.jpg', 0, 2),
-- Blockchain Wallet App (Tamamlanmamış - %55)
(25, 12, 'projects/blockchain-wallet-1.jpg', 1, 1),
(26, 12, 'projects/blockchain-wallet-2.jpg', 0, 2),
-- AI Image Generator (Tamamlanmamış - %28)
(27, 13, 'projects/ai-image-1.jpg', 1, 1),
(28, 13, 'projects/ai-image-2.jpg', 0, 2),
-- Social Media Analytics (Tamamlanmamış - %62)
(29, 14, 'projects/social-analytics-1.jpg', 1, 1),
(30, 14, 'projects/social-analytics-2.jpg', 0, 2),
-- E-Learning Platform (Tamamlanmamış - %40)
(31, 15, 'projects/elearning-1.jpg', 1, 1),
(32, 15, 'projects/elearning-2.jpg', 0, 2);

-- ============================================
-- 7. PROJE-ETİKET İLİŞKİLERİ (Mevcut olanlar atlanır)
-- ============================================
INSERT IGNORE INTO `project_tags` (`project_id`, `tag_id`) VALUES
(1, 1), (1, 3), (1, 5), (1, 7), (1, 8),
(2, 1), (2, 5), (2, 7), (2, 10), (2, 12),
(3, 1), (3, 5), (3, 7), (3, 9), (3, 16),
(4, 3), (4, 4), (4, 5), (4, 17), (4, 16),
(5, 3), (5, 5), (5, 8), (5, 12), (5, 16),
(6, 1), (6, 6), (6, 7), (6, 8),
(7, 19), (7, 5), (7, 14), (7, 16),
(8, 1), (8, 5), (8, 6), (8, 7),
(9, 1), (9, 3), (9, 5), (9, 9),
(10, 1), (10, 3), (10, 13), (10, 12),
-- Yeni Tamamlanmamış Projeler
(11, 1), (11, 3), (11, 5), (11, 12), (11, 17),
(12, 2), (12, 3), (12, 5), (12, 12),
(13, 3), (13, 4), (13, 5), (13, 17),
(14, 1), (14, 3), (14, 6), (14, 16),
(15, 1), (15, 3), (15, 5), (15, 8);

-- ============================================
-- 7. SİPARİŞLER (Mevcut olanlar atlanır)
-- NOT: database.sql yapısına uygun sütunlar (order_status, payment_status)
-- ============================================
INSERT IGNORE INTO `orders` (`id`, `order_number`, `user_id`, `total_amount`, `discount_amount`, `final_amount`, `currency`, `payment_method`, `payment_status`, `order_status`, `created_at`) VALUES
(1, 'ORD-2024-0001', 4, 1999.00, 0.00, 1999.00, 'TRY', 'credit_card', 'paid', 'completed', '2024-06-15 10:30:00'),
(2, 'ORD-2024-0002', 5, 1499.00, 149.90, 1349.10, 'TRY', 'credit_card', 'paid', 'completed', '2024-07-20 14:45:00'),
(3, 'ORD-2024-0003', 4, 899.00, 0.00, 899.00, 'TRY', 'bank_transfer', 'paid', 'completed', '2024-08-05 09:00:00'),
(4, 'ORD-2024-0004', 5, 3499.00, 0.00, 3499.00, 'TRY', 'credit_card', 'paid', 'completed', '2024-09-10 16:20:00'),
(5, 'ORD-2024-0005', 4, 599.00, 100.00, 499.00, 'TRY', 'credit_card', 'paid', 'completed', '2024-10-01 11:15:00');

-- ============================================
-- 9. SİPARİŞ DETAYLARI (Mevcut olanlar atlanır)
-- NOT: database.sql yapısına uygun sütunlar (quantity, subtotal)
-- ============================================
INSERT IGNORE INTO `order_items` (`id`, `order_id`, `project_id`, `price`, `quantity`, `subtotal`) VALUES
(1, 1, 1, 1999.00, 1, 1999.00),
(2, 2, 2, 1499.00, 1, 1499.00),
(3, 3, 3, 899.00, 1, 899.00),
(4, 4, 4, 3499.00, 1, 3499.00),
(5, 5, 5, 599.00, 1, 599.00);

-- ============================================
-- 9. DEĞERLENDİRMELER (Mevcut olanlar atlanır)
-- NOT: database.sql yapısına uygun sütunlar (is_approved, is_featured)
-- ============================================
INSERT IGNORE INTO `reviews` (`id`, `project_id`, `user_id`, `rating`, `comment`, `is_approved`, `is_featured`, `helpful_count`, `created_at`) VALUES
(1, 1, 4, 5, 'Mükemmel E-Ticaret Çözümü! Çok kapsamlı ve iyi dokümante edilmiş bir proje. Kurulumu kolaydı ve destek ekibi çok yardımcı oldu.', 1, 1, 25, '2024-06-20 10:00:00'),
(2, 1, 5, 5, 'Profesyonel ve Güvenilir. İş ihtiyaçlarımızı tam olarak karşıladı. Ödeme entegrasyonları sorunsuz çalışıyor.', 1, 0, 18, '2024-07-15 14:30:00'),
(3, 2, 4, 4, 'Harika Proje Yönetim Aracı. Ekibimizin verimliliğini artırdı. Sadece bazı küçük UX iyileştirmeleri yapılabilir.', 1, 0, 12, '2024-08-10 09:15:00'),
(4, 3, 5, 5, 'SEO Dostu CMS. Blog trafiğimiz %40 arttı. Editör kullanımı çok kolay.', 1, 1, 30, '2024-09-05 16:45:00'),
(5, 4, 4, 5, 'Müşteri Memnuniyeti Arttı. AI chatbot müşteri hizmetlerinde devrim yarattı. Yanıt süreleri %70 azaldı.', 1, 1, 45, '2024-10-01 11:20:00'),
(6, 5, 5, 5, 'En İyi API Boilerplate. Yeni projelerimde hep kullanıyorum. Zaman tasarrufu sağlıyor.', 1, 0, 22, '2024-10-15 13:00:00');

-- ============================================
-- 10. ABONELİK PLANLARI (Mevcut olanlar atlanır)
-- ============================================
INSERT IGNORE INTO `subscription_plans` (`id`, `name`, `slug`, `description`, `price`, `currency`, `billing_period`, `is_featured`, `sort_order`, `status`) VALUES
(4, 'Pro', 'pro', 'Profesyonel özellikler, öncelikli destek', 99.00, 'TRY', 'monthly', 1, 4, 'active'),
(5, 'Enterprise', 'enterprise', 'Kurumsal çözümler, özel destek', 299.00, 'TRY', 'monthly', 0, 5, 'active'),
(6, 'Seller Pro', 'seller-pro', 'Satıcılar için premium özellikler', 149.00, 'TRY', 'monthly', 0, 6, 'active');

-- ============================================
-- 11. KULLANICI ABONELİKLERİ (Mevcut olanlar atlanır)
-- ============================================
INSERT IGNORE INTO `user_subscriptions` (`id`, `user_id`, `plan_id`, `start_date`, `end_date`, `status`, `auto_renew`, `created_at`) VALUES
(1, 4, 4, '2024-10-01', '2024-11-01', 'active', 1, '2024-10-01 00:00:00'),
(2, 5, 5, '2024-09-15', '2024-10-15', 'active', 1, '2024-09-15 00:00:00'),
(3, 2, 6, '2024-08-01', '2024-09-01', 'active', 1, '2024-08-01 00:00:00');

-- ============================================
-- 12. PROJE BAĞIŞLARI (Mevcut olanlar atlanır)
-- NOT: database.sql'de project_donations tablosu var
-- ============================================
INSERT IGNORE INTO `project_donations` (`id`, `project_id`, `user_id`, `amount`, `currency`, `is_anonymous`, `message`, `payment_method`, `status`, `created_at`) VALUES
(1, 1, 4, 50.00, 'TRY', 0, 'Harika proje, geliştirmeye devam edin!', 'credit_card', 'completed', '2024-10-15 10:00:00'),
(2, 2, 5, 100.00, 'TRY', 0, 'Çok faydalı bir araç, teşekkürler.', 'credit_card', 'completed', '2024-10-16 14:30:00'),
(3, 4, 4, 250.00, 'TRY', 1, NULL, 'credit_card', 'completed', '2024-10-17 09:15:00'),
(4, 1, 5, 75.00, 'TRY', 0, 'Başarılarınızın devamını dilerim.', 'credit_card', 'completed', '2024-10-18 16:45:00');

-- ============================================
-- 13. SEPET (Mevcut olanlar atlanır)
-- NOT: database.sql'de cart tablosu var
-- ============================================
INSERT IGNORE INTO `cart` (`id`, `user_id`, `project_id`, `created_at`) VALUES
(1, 4, 6, '2024-10-20 10:00:00'),
(2, 4, 8, '2024-10-20 10:05:00'),
(3, 5, 9, '2024-10-19 14:30:00');

-- ============================================
-- 14. DESTEK BİLETLERİ (Mevcut olanlar atlanır)
-- NOT: database.sql yapısına uygun sütunlar
-- ============================================
INSERT IGNORE INTO `tickets` (`id`, `ticket_number`, `user_id`, `subject`, `priority`, `status`, `created_at`) VALUES
(1, 'TKT-2024-0001', 4, 'Ödeme sorunu - Kredi kartı hatası', 'high', 'open', '2024-10-20 10:00:00'),
(2, 'TKT-2024-0002', 5, 'Lisans aktivasyonu sorunu', 'medium', 'in_progress', '2024-10-19 14:30:00'),
(3, 'TKT-2024-0003', 4, 'Dokümantasyon eksik - API entegrasyonu', 'low', 'resolved', '2024-10-18 09:15:00'),
(4, 'TKT-2024-0004', 2, 'Satıcı hesabı onayı bekleniyor', 'medium', 'open', '2024-10-21 16:45:00');

-- ============================================
-- 15. DESTEK BİLET YANITLARI
-- ============================================
INSERT IGNORE INTO `ticket_replies` (`id`, `ticket_id`, `user_id`, `message`, `is_admin`, `created_at`) VALUES
(1, 1, 4, 'Kredi kartı ile ödeme yaparken hata alıyorum. Lütfen yardımcı olur musunuz?', 0, '2024-10-20 10:00:00'),
(2, 1, 1, 'Merhaba, sorununuzu inceliyoruz. En kısa sürede size dönüş yapacağız.', 1, '2024-10-20 10:30:00'),
(3, 2, 5, 'Satın aldığım projenin lisans anahtarı çalışmıyor.', 0, '2024-10-19 14:30:00'),
(4, 2, 1, 'Lisans anahtarınızı yeniledik, lütfen tekrar deneyin.', 1, '2024-10-19 15:00:00');

-- ============================================
-- 16. İLETİŞİM MESAJLARI
-- ============================================
INSERT IGNORE INTO `contact_messages` (`id`, `name`, `email`, `subject`, `message`, `is_read`, `created_at`) VALUES
(1, 'Burak Kılıç', 'burak@firma.com', 'E-ticaret projesi hakkında', 'E-ticaret projesi hakkında bilgi almak istiyorum.', 0, '2024-10-20 10:00:00'),
(2, 'Selin Yıldız', 'selin@startup.io', 'Özel proje geliştirme', 'Özel proje geliştirme teklifi istiyoruz.', 1, '2024-10-19 14:30:00'),
(3, 'Emre Aksoy', 'emre@corp.com.tr', 'Enterprise lisans', 'Enterprise lisans ve destek paketi hakkında görüşmek istiyoruz.', 0, '2024-10-18 09:15:00'),
(4, 'Deniz Şahin', 'deniz@agency.com', 'Partner programı', 'Partner programı hakkında bilgi almak istiyorum.', 0, '2024-10-21 16:45:00');

-- ============================================
-- 17. FAVORİLER
-- ============================================
INSERT IGNORE INTO `favorites` (`id`, `user_id`, `project_id`, `created_at`) VALUES
(1, 4, 1, '2024-10-01 10:00:00'),
(2, 4, 4, '2024-10-05 14:30:00'),
(3, 5, 2, '2024-10-10 09:15:00'),
(4, 5, 5, '2024-10-12 16:45:00'),
(5, 4, 9, '2024-10-15 11:00:00');

-- ============================================
-- 18. MESAJLAR
-- ============================================
INSERT IGNORE INTO `messages` (`id`, `sender_id`, `receiver_id`, `subject`, `message`, `is_read`, `created_at`) VALUES
(1, 4, 2, 'TeknoShop hakkında soru', 'Merhaba, TeknoShop projeniz hakkında bir kaç sorum var.', 1, '2024-10-15 10:00:00'),
(2, 2, 4, 'RE: TeknoShop hakkında soru', 'Merhaba, sorularınızı cevaplamaktan memnuniyet duyarım.', 1, '2024-10-15 11:30:00'),
(3, 5, 3, 'BlogCraft entegrasyonu', 'BlogCraft CMS\'i mevcut sitemize nasıl entegre edebilirim?', 0, '2024-10-18 14:00:00');

-- ============================================
-- 19. ANA SAYFA BÖLÜMLERİ (Varsa güncelle, yoksa ekle)
-- ============================================
INSERT INTO `home_sections` (`id`, `key`, `title`, `subtitle`, `description`, `isActive`, `order`) VALUES
(1, 'hero', 'Dijital Projelerinizi Dünyaya Açın', 'TeknoProje ile yazılım projelerinizi sergileyin, lisanslayın ve abonelik modeliyle sunun.', NULL, 1, 1),
(2, 'features', 'Neden TeknoProje?', 'Geliştiriciler ve alıcılar için tasarlanmış güçlü özellikler', NULL, 1, 2),
(3, 'projects', 'Popüler Projeler', 'Binlerce başarılı proje keşfedin', NULL, 1, 3),
(4, 'stats', 'Rakamlarla TeknoProje', NULL, NULL, 1, 4),
(5, 'faq', 'Sık Sorulan Sorular', 'Yanıtını aradığınız soruyu bulun', NULL, 1, 5),
(6, 'about', 'Hakkımızda', 'TeknoProje Hikayesi', 'TeknoProje, geliştiricilerin ve yazılım firmalarının dijital projelerini dünyayla paylaşması için kurulmuş bir platformdur.', 1, 6),
(7, 'blog', 'Blog Haberleri', 'En son teknoloji haberleri ve ipuçları', NULL, 1, 7),
(8, 'testimonials', 'Kullanıcı Yorumları', 'Binlerce memnun kullanıcı bize güveniyor', NULL, 1, 8),
(9, 'contact', 'İletişim', 'Sorularınız için bize yazın', NULL, 1, 9)
ON DUPLICATE KEY UPDATE 
    title = VALUES(title), 
    subtitle = VALUES(subtitle),
    description = VALUES(description);

-- ============================================
-- 20. HOMEPAGE SECTIONS (Ana yapıdaki tablo)
-- ============================================
INSERT IGNORE INTO `homepage_sections` (`id`, `title`, `slug`, `content`, `section_type`, `sort_order`, `is_visible`) VALUES
(1, 'Hero', 'hero', NULL, 'hero', 1, 1),
(2, 'Özellikler', 'features', NULL, 'features', 2, 1),
(3, 'Projeler', 'projects', NULL, 'projects', 3, 1),
(4, 'İstatistikler', 'stats', NULL, 'stats', 4, 1),
(5, 'SSS', 'faq', NULL, 'faq', 5, 1),
(6, 'Hakkımızda', 'about', NULL, 'about', 6, 1),
(7, 'Blog', 'blog', NULL, 'blog', 7, 1),
(8, 'Yorumlar', 'testimonials', NULL, 'testimonials', 8, 1),
(9, 'İletişim', 'contact', NULL, 'contact', 9, 1);

-- ============================================
-- ÖZET BİLGİLER
-- ============================================
-- Kullanıcı Şifresi (tüm kullanıcılar için): 123456
-- Admin: admin@teknoproje.com / 123456 (role_id: 1)
-- Satıcılar: ahmet@example.com, ayse@example.com, ali@example.com (role_id: 3)
-- Kullanıcılar: mehmet@example.com, zeynep@example.com (role_id: 2)

-- NOT: INSERT IGNORE kullanıldığı için mevcut kayıtlar atlanır
-- Hiçbir veri üzerine yazılmaz veya silinmez
