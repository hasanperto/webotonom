-- ============================================
-- TeknoProje - Tam Örnek Veriler (Çok Dilli)
-- Türkçe, İngilizce, Almanca
-- ============================================

USE `teknopro`;

-- ============================================
-- 1. DİLLER
-- ============================================
INSERT IGNORE INTO `languages` (`id`, `code`, `name`, `native_name`, `rtl`, `is_default`, `status`, `sort_order`) VALUES
(1, 'tr', 'Turkish', 'Türkçe', 0, 1, 'active', 1),
(2, 'en', 'English', 'English', 0, 0, 'active', 2),
(3, 'de', 'German', 'Deutsch', 0, 0, 'active', 3);

-- ============================================
-- 2. KULLANICI ROLLERİ
-- ============================================
INSERT IGNORE INTO `user_roles` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Admin', 'admin', 'Sistem yöneticisi'),
(2, 'Kullanıcı', 'user', 'Normal kullanıcı'),
(3, 'Satıcı', 'seller', 'Proje satıcısı');

-- ============================================
-- 3. KULLANICILAR (Giriş Bilgileri)
-- ============================================
-- Şifre: 123456 (bcrypt hash — doğrulanmış)
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone`, `role_id`, `status`, `email_verified`, `bio`, `website`, `location`, `created_at`) VALUES
-- Admin
(1, 'admin', 'admin@teknoproje.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Admin', 'User', '+90 555 111 1111', 1, 'active', 1, 'Sistem yöneticisi', 'https://teknoproje.com', 'İstanbul, Türkiye', NOW()),

-- Satıcılar
(2, 'ahmet', 'ahmet@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Ahmet', 'Yılmaz', '+90 555 222 2222', 3, 'active', 1, 'Full-stack developer, 10 yıllık deneyim', 'https://ahmetyilmaz.dev', 'Ankara, Türkiye', NOW()),
(3, 'ayse', 'ayse@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Ayşe', 'Kaya', '+90 555 333 3333', 3, 'active', 1, 'UI/UX tasarımcı ve frontend developer', 'https://aysekaya.com', 'İzmir, Türkiye', NOW()),
(6, 'ali', 'ali@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Ali', 'Öztürk', '+90 555 666 6666', 3, 'active', 1, 'Backend uzmanı, Node.js ve Python', 'https://aliozturk.io', 'Konya, Türkiye', NOW()),

-- Normal Kullanıcılar
(4, 'mehmet', 'mehmet@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Mehmet', 'Demir', '+90 555 444 4444', 2, 'active', 1, 'Yazılım meraklısı', NULL, 'Bursa, Türkiye', NOW()),
(5, 'zeynep', 'zeynep@example.com', '$2a$10$/gLxzPx/rXnIZdAa86h7..Ki6J1yXjhBEgwu2nmTS4EhLmNVNKFBm', 'Zeynep', 'Çelik', '+90 555 555 5555', 2, 'active', 1, 'Mobil uygulama geliştirici', 'https://zeynepcelik.dev', 'Antalya, Türkiye', NOW());

-- ============================================
-- 4. KATEGORİLER (3 Dil)
-- ============================================
INSERT IGNORE INTO `categories` (`id`, `name`, `slug`, `description`, `parent_id`, `sort_order`, `status`) VALUES
(1, 'Web Uygulamaları', 'web-uygulamalari', 'Web tabanlı projeler ve uygulamalar', NULL, 1, 'active'),
(2, 'Mobil Uygulamalar', 'mobil-uygulamalar', 'iOS ve Android uygulamaları', NULL, 2, 'active'),
(3, 'API & Backend', 'api-backend', 'API servisleri ve backend çözümleri', NULL, 3, 'active'),
(4, 'E-Ticaret', 'e-ticaret', 'E-ticaret platformları ve çözümleri', NULL, 4, 'active'),
(5, 'Yapay Zeka', 'yapay-zeka', 'AI ve makine öğrenmesi projeleri', NULL, 5, 'active'),
(6, 'CMS & Blog', 'cms-blog', 'İçerik yönetim sistemleri', NULL, 6, 'active');

-- Kategori çevirileri
INSERT IGNORE INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`) VALUES
-- Web Uygulamaları
(1, 'page', 'en', 'Web Applications', 'Web-based projects and applications'),
(1, 'page', 'de', 'Web-Anwendungen', 'Web-basierte Projekte und Anwendungen'),
-- Mobil Uygulamalar
(2, 'page', 'en', 'Mobile Applications', 'iOS and Android applications'),
(2, 'page', 'de', 'Mobile Anwendungen', 'iOS- und Android-Anwendungen'),
-- API & Backend
(3, 'page', 'en', 'API & Backend', 'API services and backend solutions'),
(3, 'page', 'de', 'API & Backend', 'API-Services und Backend-Lösungen'),
-- E-Ticaret
(4, 'page', 'en', 'E-Commerce', 'E-commerce platforms and solutions'),
(4, 'page', 'de', 'E-Commerce', 'E-Commerce-Plattformen und Lösungen'),
-- Yapay Zeka
(5, 'page', 'en', 'Artificial Intelligence', 'AI and machine learning projects'),
(5, 'page', 'de', 'Künstliche Intelligenz', 'KI- und Machine-Learning-Projekte'),
-- CMS & Blog
(6, 'page', 'en', 'CMS & Blog', 'Content management systems'),
(6, 'page', 'de', 'CMS & Blog', 'Content-Management-Systeme');

-- ============================================
-- 5. ETİKETLER
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
-- 6. PROJELER (3 Dil)
-- ============================================
INSERT IGNORE INTO `projects` (`id`, `user_id`, `title`, `slug`, `short_description`, `description`, `category_id`, `price`, `discount_price`, `license_type`, `demo_url`, `video_url`, `version`, `status`, `featured`, `view_count`, `download_count`, `rating`, `rating_count`, `created_at`) VALUES
(1, 2, 'TeknoShop E-Ticaret Platformu', 'teknoshop-e-ticaret', 'Modern ve hızlı e-ticaret çözümü', 'TeknoShop, React ve Node.js ile geliştirilmiş kapsamlı bir e-ticaret platformudur. Ödeme entegrasyonları, stok yönetimi, sipariş takibi ve admin paneli içerir. Stripe ve iyzico entegrasyonu hazır.', 4, 2499.00, 1999.00, 'extended', 'https://demo.teknoshop.com', NULL, '2.5.0', 'active', 1, 15420, 342, 4.8, 156, NOW()),
(2, 2, 'TaskFlow Proje Yönetimi', 'taskflow-proje-yonetimi', 'Agile takımlar için proje yönetim aracı', 'TaskFlow, Kanban board, sprint planlama, zaman takibi ve raporlama özellikleri sunan modern bir proje yönetim uygulamasıdır. Real-time güncellemeler ve takım işbirliği araçları içerir.', 1, 1499.00, NULL, 'regular', 'https://demo.taskflow.app', NULL, '3.1.2', 'active', 1, 8750, 189, 4.6, 89, NOW()),
(3, 3, 'BlogCraft CMS', 'blogcraft-cms', 'SEO dostu blog ve içerik yönetim sistemi', 'BlogCraft, Next.js ve Prisma ile geliştirilmiş modern bir CMS\'dir. Markdown desteği, SEO optimizasyonu, çoklu dil desteği ve güçlü editör özellikleri sunar.', 6, 899.00, 749.00, 'regular', 'https://demo.blogcraft.dev', NULL, '1.8.0', 'active', 0, 5230, 127, 4.5, 67, NOW()),
(4, 3, 'ChatBot AI Assistant', 'chatbot-ai-assistant', 'OpenAI destekli akıllı chatbot', 'Müşteri hizmetleri için geliştirilmiş AI chatbot. OpenAI GPT-4 entegrasyonu, öğrenme yetenekleri ve çoklu platform desteği (web, WhatsApp, Telegram) sunar.', 5, 3499.00, NULL, 'extended', 'https://demo.chatbot-ai.com', NULL, '2.0.1', 'active', 1, 12100, 78, 4.9, 45, NOW()),
(5, 6, 'RestAPI Boilerplate', 'restapi-boilerplate', 'Production-ready Node.js API başlangıç kiti', 'JWT auth, rate limiting, validation, logging, testing ve Docker desteği ile tam donanımlı API boilerplate. Express.js ve TypeScript kullanır.', 3, 599.00, 499.00, 'regular', 'https://demo.restapi-kit.dev', NULL, '4.2.0', 'active', 0, 9870, 456, 4.7, 234, NOW());

-- Proje çevirileri (İngilizce)
INSERT IGNORE INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`) VALUES
(1, 'project', 'en', 'TeknoShop E-Commerce Platform', 'Modern and fast e-commerce solution. TeknoShop is a comprehensive e-commerce platform developed with React and Node.js. Includes payment integrations, inventory management, order tracking and admin panel. Stripe and iyzico integration ready.'),
(2, 'project', 'en', 'TaskFlow Project Management', 'Project management tool for agile teams. TaskFlow is a modern project management application offering Kanban board, sprint planning, time tracking and reporting features. Includes real-time updates and team collaboration tools.'),
(3, 'project', 'en', 'BlogCraft CMS', 'SEO-friendly blog and content management system. BlogCraft is a modern CMS developed with Next.js and Prisma. Offers Markdown support, SEO optimization, multi-language support and powerful editor features.'),
(4, 'project', 'en', 'ChatBot AI Assistant', 'OpenAI-powered smart chatbot. AI chatbot developed for customer service. Offers OpenAI GPT-4 integration, learning capabilities and multi-platform support (web, WhatsApp, Telegram).'),
(5, 'project', 'en', 'RestAPI Boilerplate', 'Production-ready Node.js API starter kit. Fully equipped API boilerplate with JWT auth, rate limiting, validation, logging, testing and Docker support. Uses Express.js and TypeScript.');

-- Proje çevirileri (Almanca)
INSERT IGNORE INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`) VALUES
(1, 'project', 'de', 'TeknoShop E-Commerce-Plattform', 'Moderne und schnelle E-Commerce-Lösung. TeknoShop ist eine umfassende E-Commerce-Plattform, die mit React und Node.js entwickelt wurde. Enthält Zahlungsintegrationen, Bestandsverwaltung, Bestellverfolgung und Admin-Panel. Stripe- und iyzico-Integration bereit.'),
(2, 'project', 'de', 'TaskFlow Projektmanagement', 'Projektmanagement-Tool für agile Teams. TaskFlow ist eine moderne Projektmanagement-Anwendung mit Kanban-Board, Sprint-Planung, Zeiterfassung und Berichtsfunktionen. Enthält Echtzeit-Updates und Team-Kollaborationstools.'),
(3, 'project', 'de', 'BlogCraft CMS', 'SEO-freundliches Blog- und Content-Management-System. BlogCraft ist ein modernes CMS, das mit Next.js und Prisma entwickelt wurde. Bietet Markdown-Unterstützung, SEO-Optimierung, Mehrsprachigkeit und leistungsstarke Editor-Funktionen.'),
(4, 'project', 'de', 'ChatBot KI-Assistent', 'OpenAI-gestützter intelligenter Chatbot. KI-Chatbot für den Kundenservice entwickelt. Bietet OpenAI GPT-4-Integration, Lernfähigkeiten und Multi-Plattform-Unterstützung (Web, WhatsApp, Telegram).'),
(5, 'project', 'de', 'RestAPI Boilerplate', 'Produktionsreifes Node.js API-Starter-Kit. Voll ausgestattetes API-Boilerplate mit JWT-Authentifizierung, Rate-Limiting, Validierung, Protokollierung, Tests und Docker-Unterstützung. Verwendet Express.js und TypeScript.');

-- Proje-etiket ilişkileri
INSERT IGNORE INTO `project_tags` (`project_id`, `tag_id`) VALUES
(1, 1), (1, 3), (1, 5), (1, 7), (1, 8),
(2, 1), (2, 5), (2, 7), (2, 10), (2, 12),
(3, 1), (3, 5), (3, 7), (3, 9), (3, 16),
(4, 3), (4, 4), (4, 5), (4, 17), (4, 16),
(5, 3), (5, 5), (5, 8), (5, 12), (5, 16);

-- ============================================
-- 7. BLOG YAZILARI (3 Dil)
-- ============================================
INSERT IGNORE INTO `blog_posts` (`id`, `user_id`, `title`, `slug`, `excerpt`, `content`, `cover_image`, `category_id`, `status`, `view_count`, `created_at`, `published_at`) VALUES
(1, 1, 'React 19 ile Gelen Yenilikler', 'react-19-yenilikler', 'React 19 sürümündeki en önemli değişiklikler ve yeni özellikler hakkında detaylı inceleme.', '<h2>React 19 Neler Getiriyor?</h2><p>React 19 ile birlikte gelen Server Components, Suspense iyileştirmeleri ve yeni hook\'lar hakkında kapsamlı bir bakış...</p><h3>Server Components</h3><p>Server Components ile sunucu tarafında render edilen bileşenler artık daha verimli çalışıyor. Bu sayede performans önemli ölçüde artıyor ve kullanıcı deneyimi iyileşiyor.</p><h3>Yeni Hook\'lar</h3><p>React 19 ile birlikte gelen yeni hook\'lar geliştiricilere daha fazla esneklik sağlıyor. Özellikle form yönetimi ve state yönetimi konularında önemli iyileştirmeler var.</p><h3>Suspense İyileştirmeleri</h3><p>Suspense API\'si artık daha güçlü ve kullanımı daha kolay. Streaming SSR ve selective hydration gibi özellikler ile daha iyi performans elde ediliyor.</p>', '/uploads/blog/react-19.jpg', 1, 'published', 2450, NOW(), NOW()),
(2, 1, 'Node.js 22 LTS Performans Analizi', 'nodejs-22-lts-performans', 'Node.js 22 LTS sürümünün performans testleri ve önceki sürümlerle karşılaştırması.', '<h2>Node.js 22 LTS Performans İyileştirmeleri</h2><p>Node.js 22 LTS sürümü ile birlikte önemli performans iyileştirmeleri geldi. Bu yazıda detaylı performans testleri ve karşılaştırmalar bulacaksınız.</p><h3>V8 Motor Güncellemeleri</h3><p>Yeni V8 motor versiyonu ile JavaScript performansı %15-20 arasında artış gösterdi. Özellikle async/await ve Promise işlemlerinde belirgin iyileştirmeler var.</p><h3>Memory Yönetimi</h3><p>Garbage collection algoritmaları optimize edildi. Uzun süre çalışan uygulamalarda memory leak\'ler önemli ölçüde azaldı.</p><h3>Network Performansı</h3><p>HTTP/2 ve HTTP/3 desteği ile network işlemleri daha hızlı. Özellikle yüksek trafikli uygulamalarda fark edilir performans artışları görülüyor.</p>', '/uploads/blog/nodejs-22.jpg', 3, 'published', 1890, NOW(), NOW()),
(3, 1, 'E-Ticaret Projelerinde Güvenlik', 'e-ticaret-guvenlik', 'E-ticaret uygulamalarında dikkat edilmesi gereken güvenlik önlemleri ve best practice\'ler.', '<h2>E-Ticaret Güvenlik Best Practices</h2><p>E-ticaret uygulamaları hassas müşteri verileri ve ödeme bilgileri işlediği için güvenlik kritik öneme sahiptir. Bu yazıda en önemli güvenlik önlemlerini ele alıyoruz.</p><h3>PCI-DSS Uyumluluğu</h3><p>Kredi kartı bilgilerini işleyen tüm e-ticaret siteleri PCI-DSS standartlarına uygun olmalıdır. Tokenization ve encryption kullanarak kart bilgilerini güvende tutun.</p><h3>XSS ve CSRF Koruması</h3><p>Cross-Site Scripting (XSS) ve Cross-Site Request Forgery (CSRF) saldırılarına karşı koruma sağlayın. Content Security Policy (CSP) headers kullanın ve CSRF token\'ları implement edin.</p><h3>Güvenli Ödeme İşlemleri</h3><p>Ödeme işlemlerini asla kendi sunucunuzda saklamayın. Stripe, PayPal gibi güvenilir ödeme gateway\'lerini kullanın ve 3D Secure gibi ek güvenlik katmanları ekleyin.</p><h3>Veri Şifreleme</h3><p>Tüm hassas verileri (şifreler, kişisel bilgiler) şifreleyin. AES-256 gibi güçlü şifreleme algoritmaları kullanın ve key management\'ı doğru yapın.</p>', '/uploads/blog/security.jpg', 4, 'published', 3120, NOW(), NOW()),
(4, 1, 'TypeScript ile Modern JavaScript Geliştirme', 'typescript-modern-javascript', 'TypeScript kullanarak daha güvenli ve ölçeklenebilir JavaScript uygulamaları geliştirme rehberi.', '<h2>TypeScript ile Modern Geliştirme</h2><p>TypeScript, JavaScript\'e tip güvenliği ekleyen güçlü bir araçtır. Bu yazıda TypeScript\'in avantajlarını ve en iyi kullanım pratiklerini ele alıyoruz.</p><h3>Tip Güvenliği</h3><p>TypeScript sayesinde compile-time\'da hataları yakalayabilirsiniz. Bu, production\'da daha az hata demektir.</p><h3>Modern ES6+ Özellikleri</h3><p>TypeScript en son JavaScript özelliklerini destekler ve eski tarayıcılar için transpile edebilir.</p>', '/uploads/blog/typescript.jpg', 1, 'published', 1560, NOW(), NOW()),
(5, 1, 'Mikroservis Mimarisi ve Best Practices', 'mikroservis-mimari', 'Mikroservis mimarisi ile modern uygulamalar geliştirme ve en iyi uygulamalar.', '<h2>Mikroservis Mimarisi</h2><p>Mikroservis mimarisi, büyük uygulamaları küçük, bağımsız servislere bölerek ölçeklenebilirlik ve bakım kolaylığı sağlar.</p><h3>Avantajlar</h3><p>Bağımsız deployment, teknoloji çeşitliliği, ölçeklenebilirlik gibi avantajlar sunar.</p><h3>Zorluklar</h3><p>Distributed system karmaşıklığı, network latency, data consistency gibi zorluklar vardır.</p>', '/uploads/blog/microservices.jpg', 3, 'published', 2100, NOW(), NOW()),
(6, 1, 'Docker ile Containerization Rehberi', 'docker-containerization', 'Docker kullanarak uygulamalarınızı containerize etme ve deployment süreçlerini optimize etme.', '<h2>Docker Containerization</h2><p>Docker, uygulamaları container\'lara paketleyerek her ortamda aynı şekilde çalışmasını sağlar.</p><h3>Dockerfile Best Practices</h3><p>Multi-stage builds, layer caching, minimal base images gibi best practice\'ler performansı artırır.</p><h3>Docker Compose</h3><p>Çoklu container uygulamalarını yönetmek için Docker Compose kullanın.</p>', '/uploads/blog/docker.jpg', 3, 'published', 1780, NOW(), NOW());

-- Blog çevirileri (İngilizce)
INSERT IGNORE INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`, `content`) VALUES
(1, 'blog', 'en', 'What\'s New in React 19', 'Detailed review of the most important changes and new features in React 19.', '<h2>What Does React 19 Bring?</h2><p>A comprehensive look at Server Components, Suspense improvements and new hooks coming with React 19...</p><h3>Server Components</h3><p>With Server Components, server-side rendered components now work more efficiently. This significantly improves performance and enhances user experience.</p><h3>New Hooks</h3><p>The new hooks coming with React 19 provide developers with more flexibility. There are significant improvements especially in form management and state management.</p><h3>Suspense Improvements</h3><p>The Suspense API is now more powerful and easier to use. Features like streaming SSR and selective hydration provide better performance.</p>'),
(2, 'blog', 'en', 'Node.js 22 LTS Performance Analysis', 'Performance tests of Node.js 22 LTS version and comparison with previous versions.', '<h2>Node.js 22 LTS Performance Improvements</h2><p>Node.js 22 LTS version comes with significant performance improvements. In this article, you will find detailed performance tests and comparisons.</p><h3>V8 Engine Updates</h3><p>With the new V8 engine version, JavaScript performance increased by 15-20%. There are noticeable improvements especially in async/await and Promise operations.</p><h3>Memory Management</h3><p>Garbage collection algorithms have been optimized. Memory leaks in long-running applications have decreased significantly.</p><h3>Network Performance</h3><p>With HTTP/2 and HTTP/3 support, network operations are faster. Noticeable performance increases are seen especially in high-traffic applications.</p>'),
(3, 'blog', 'en', 'Security in E-Commerce Projects', 'Security measures and best practices to consider in e-commerce applications.', '<h2>E-Commerce Security Best Practices</h2><p>Since e-commerce applications process sensitive customer data and payment information, security is of critical importance. In this article, we cover the most important security measures.</p><h3>PCI-DSS Compliance</h3><p>All e-commerce sites that process credit card information must comply with PCI-DSS standards. Keep card information secure by using tokenization and encryption.</p><h3>XSS and CSRF Protection</h3><p>Protect against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) attacks. Use Content Security Policy (CSP) headers and implement CSRF tokens.</p><h3>Secure Payment Transactions</h3><p>Never store payment transactions on your own server. Use trusted payment gateways like Stripe, PayPal and add additional security layers like 3D Secure.</p><h3>Data Encryption</h3><p>Encrypt all sensitive data (passwords, personal information). Use strong encryption algorithms like AES-256 and manage keys correctly.</p>'),
(4, 'blog', 'en', 'Modern JavaScript Development with TypeScript', 'Guide to developing safer and scalable JavaScript applications using TypeScript.', '<h2>Modern Development with TypeScript</h2><p>TypeScript is a powerful tool that adds type safety to JavaScript. In this article, we cover the advantages of TypeScript and best usage practices.</p><h3>Type Safety</h3><p>Thanks to TypeScript, you can catch errors at compile-time. This means fewer errors in production.</p><h3>Modern ES6+ Features</h3><p>TypeScript supports the latest JavaScript features and can transpile for older browsers.</p>'),
(5, 'blog', 'en', 'Microservices Architecture and Best Practices', 'Developing modern applications with microservices architecture and best practices.', '<h2>Microservices Architecture</h2><p>Microservices architecture provides scalability and ease of maintenance by dividing large applications into small, independent services.</p><h3>Advantages</h3><p>It offers advantages such as independent deployment, technology diversity, and scalability.</p><h3>Challenges</h3><p>There are challenges such as distributed system complexity, network latency, and data consistency.</p>'),
(6, 'blog', 'en', 'Docker Containerization Guide', 'Containerizing your applications using Docker and optimizing deployment processes.', '<h2>Docker Containerization</h2><p>Docker ensures that applications work the same way in every environment by packaging them into containers.</p><h3>Dockerfile Best Practices</h3><p>Best practices such as multi-stage builds, layer caching, and minimal base images improve performance.</p><h3>Docker Compose</h3><p>Use Docker Compose to manage multi-container applications.</p>');

-- Blog çevirileri (Almanca)
INSERT IGNORE INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`, `content`) VALUES
(1, 'blog', 'de', 'Neues in React 19', 'Detaillierte Übersicht über die wichtigsten Änderungen und neuen Funktionen in React 19.', '<h2>Was bringt React 19?</h2><p>Ein umfassender Blick auf Server Components, Suspense-Verbesserungen und neue Hooks, die mit React 19 kommen...</p><h3>Server Components</h3><p>Mit Server Components funktionieren serverseitig gerenderte Komponenten jetzt effizienter. Dies verbessert die Leistung erheblich und verbessert die Benutzererfahrung.</p><h3>Neue Hooks</h3><p>Die neuen Hooks, die mit React 19 kommen, bieten Entwicklern mehr Flexibilität. Es gibt erhebliche Verbesserungen, insbesondere bei der Formular- und Zustandsverwaltung.</p><h3>Suspense-Verbesserungen</h3><p>Die Suspense-API ist jetzt leistungsstärker und einfacher zu verwenden. Funktionen wie Streaming SSR und selektive Hydratation bieten eine bessere Leistung.</p>'),
(2, 'blog', 'de', 'Node.js 22 LTS Leistungsanalyse', 'Leistungstests der Node.js 22 LTS-Version und Vergleich mit früheren Versionen.', '<h2>Node.js 22 LTS Leistungsverbesserungen</h2><p>Die Node.js 22 LTS-Version kommt mit erheblichen Leistungsverbesserungen. In diesem Artikel finden Sie detaillierte Leistungstests und Vergleiche.</p><h3>V8-Motor-Updates</h3><p>Mit der neuen V8-Motor-Version stieg die JavaScript-Leistung um 15-20%. Es gibt spürbare Verbesserungen, insbesondere bei async/await- und Promise-Operationen.</p><h3>Speicherverwaltung</h3><p>Garbage-Collection-Algorithmen wurden optimiert. Speicherlecks in lang laufenden Anwendungen haben erheblich abgenommen.</p><h3>Netzwerkleistung</h3><p>Mit HTTP/2- und HTTP/3-Unterstützung sind Netzwerkoperationen schneller. Besonders bei hochfrequentierten Anwendungen sind spürbare Leistungssteigerungen zu verzeichnen.</p>'),
(3, 'blog', 'de', 'Sicherheit in E-Commerce-Projekten', 'Sicherheitsmaßnahmen und Best Practices, die in E-Commerce-Anwendungen zu beachten sind.', '<h2>E-Commerce-Sicherheit Best Practices</h2><p>Da E-Commerce-Anwendungen sensible Kundendaten und Zahlungsinformationen verarbeiten, ist Sicherheit von entscheidender Bedeutung. In diesem Artikel behandeln wir die wichtigsten Sicherheitsmaßnahmen.</p><h3>PCI-DSS-Konformität</h3><p>Alle E-Commerce-Sites, die Kreditkarteninformationen verarbeiten, müssen den PCI-DSS-Standards entsprechen. Halten Sie Karteninformationen sicher, indem Sie Tokenisierung und Verschlüsselung verwenden.</p><h3>XSS- und CSRF-Schutz</h3><p>Schützen Sie sich vor Cross-Site Scripting (XSS) und Cross-Site Request Forgery (CSRF) Angriffen. Verwenden Sie Content Security Policy (CSP) Header und implementieren Sie CSRF-Token.</p><h3>Sichere Zahlungstransaktionen</h3><p>Speichern Sie Zahlungstransaktionen niemals auf Ihrem eigenen Server. Verwenden Sie vertrauenswürdige Zahlungsgateways wie Stripe, PayPal und fügen Sie zusätzliche Sicherheitsebenen wie 3D Secure hinzu.</p><h3>Datenverschlüsselung</h3><p>Verschlüsseln Sie alle sensiblen Daten (Passwörter, persönliche Informationen). Verwenden Sie starke Verschlüsselungsalgorithmen wie AES-256 und verwalten Sie Schlüssel korrekt.</p>'),
(4, 'blog', 'de', 'Moderne JavaScript-Entwicklung mit TypeScript', 'Leitfaden zur Entwicklung sichererer und skalierbarer JavaScript-Anwendungen mit TypeScript.', '<h2>Moderne Entwicklung mit TypeScript</h2><p>TypeScript ist ein leistungsstarkes Tool, das JavaScript Typsicherheit hinzufügt. In diesem Artikel behandeln wir die Vorteile von TypeScript und Best Practices für die Verwendung.</p><h3>Typsicherheit</h3><p>Dank TypeScript können Sie Fehler zur Compile-Zeit erkennen. Das bedeutet weniger Fehler in der Produktion.</p><h3>Moderne ES6+ Funktionen</h3><p>TypeScript unterstützt die neuesten JavaScript-Funktionen und kann für ältere Browser transpilieren.</p>'),
(5, 'blog', 'de', 'Mikroservices-Architektur und Best Practices', 'Entwicklung moderner Anwendungen mit Mikroservices-Architektur und Best Practices.', '<h2>Mikroservices-Architektur</h2><p>Die Mikroservices-Architektur bietet Skalierbarkeit und Wartungsfreundlichkeit, indem große Anwendungen in kleine, unabhängige Services unterteilt werden.</p><h3>Vorteile</h3><p>Sie bietet Vorteile wie unabhängiges Deployment, Technologievielfalt und Skalierbarkeit.</p><h3>Herausforderungen</h3><p>Es gibt Herausforderungen wie die Komplexität verteilter Systeme, Netzwerklatenz und Datenkonsistenz.</p>'),
(6, 'blog', 'de', 'Docker Containerization Leitfaden', 'Containerisierung Ihrer Anwendungen mit Docker und Optimierung der Deployment-Prozesse.', '<h2>Docker Containerization</h2><p>Docker stellt sicher, dass Anwendungen in jeder Umgebung gleich funktionieren, indem sie in Container verpackt werden.</p><h3>Dockerfile Best Practices</h3><p>Best Practices wie Multi-Stage-Builds, Layer-Caching und minimale Basis-Images verbessern die Leistung.</p><h3>Docker Compose</h3><p>Verwenden Sie Docker Compose, um Multi-Container-Anwendungen zu verwalten.</p>');

-- ============================================
-- 8. ÇEVİRİLER (Genel)
-- ============================================
INSERT IGNORE INTO `translations` (`language_code`, `key`, `value`, `group`) VALUES
-- Türkçe
('tr', 'home', 'Ana Sayfa', 'navigation'),
('tr', 'projects', 'Projeler', 'navigation'),
('tr', 'blog', 'Blog', 'navigation'),
('tr', 'contact', 'İletişim', 'navigation'),
('tr', 'login', 'Giriş Yap', 'auth'),
('tr', 'register', 'Kayıt Ol', 'auth'),
('tr', 'logout', 'Çıkış', 'auth'),
('tr', 'profile', 'Profil', 'user'),
('tr', 'dashboard', 'Panel', 'user'),
('tr', 'cart', 'Sepet', 'ecommerce'),
('tr', 'checkout', 'Ödeme', 'ecommerce'),
('tr', 'price', 'Fiyat', 'ecommerce'),
('tr', 'add_to_cart', 'Sepete Ekle', 'ecommerce'),
('tr', 'buy_now', 'Hemen Satın Al', 'ecommerce'),
('tr', 'view_details', 'Detayları Gör', 'projects'),
('tr', 'download', 'İndir', 'projects'),
('tr', 'rating', 'Değerlendirme', 'projects'),
('tr', 'reviews', 'Yorumlar', 'projects'),
('tr', 'search', 'Ara', 'general'),
('tr', 'filter', 'Filtrele', 'general'),
('tr', 'loading', 'Yükleniyor...', 'general'),
('tr', 'error', 'Hata', 'general'),
('tr', 'success', 'Başarılı', 'general'),
('tr', 'save', 'Kaydet', 'general'),
('tr', 'cancel', 'İptal', 'general'),
('tr', 'delete', 'Sil', 'general'),
('tr', 'edit', 'Düzenle', 'general'),
('tr', 'create', 'Oluştur', 'general'),
('tr', 'update', 'Güncelle', 'general'),

-- İngilizce
('en', 'home', 'Home', 'navigation'),
('en', 'projects', 'Projects', 'navigation'),
('en', 'blog', 'Blog', 'navigation'),
('en', 'contact', 'Contact', 'navigation'),
('en', 'login', 'Login', 'auth'),
('en', 'register', 'Register', 'auth'),
('en', 'logout', 'Logout', 'auth'),
('en', 'profile', 'Profile', 'user'),
('en', 'dashboard', 'Dashboard', 'user'),
('en', 'cart', 'Cart', 'ecommerce'),
('en', 'checkout', 'Checkout', 'ecommerce'),
('en', 'price', 'Price', 'ecommerce'),
('en', 'add_to_cart', 'Add to Cart', 'ecommerce'),
('en', 'buy_now', 'Buy Now', 'ecommerce'),
('en', 'view_details', 'View Details', 'projects'),
('en', 'download', 'Download', 'projects'),
('en', 'rating', 'Rating', 'projects'),
('en', 'reviews', 'Reviews', 'projects'),
('en', 'search', 'Search', 'general'),
('en', 'filter', 'Filter', 'general'),
('en', 'loading', 'Loading...', 'general'),
('en', 'error', 'Error', 'general'),
('en', 'success', 'Success', 'general'),
('en', 'save', 'Save', 'general'),
('en', 'cancel', 'Cancel', 'general'),
('en', 'delete', 'Delete', 'general'),
('en', 'edit', 'Edit', 'general'),
('en', 'create', 'Create', 'general'),
('en', 'update', 'Update', 'general'),

-- Almanca
('de', 'home', 'Startseite', 'navigation'),
('de', 'projects', 'Projekte', 'navigation'),
('de', 'blog', 'Blog', 'navigation'),
('de', 'contact', 'Kontakt', 'navigation'),
('de', 'login', 'Anmelden', 'auth'),
('de', 'register', 'Registrieren', 'auth'),
('de', 'logout', 'Abmelden', 'auth'),
('de', 'profile', 'Profil', 'user'),
('de', 'dashboard', 'Dashboard', 'user'),
('de', 'cart', 'Warenkorb', 'ecommerce'),
('de', 'checkout', 'Zur Kasse', 'ecommerce'),
('de', 'price', 'Preis', 'ecommerce'),
('de', 'add_to_cart', 'In den Warenkorb', 'ecommerce'),
('de', 'buy_now', 'Jetzt kaufen', 'ecommerce'),
('de', 'view_details', 'Details anzeigen', 'projects'),
('de', 'download', 'Herunterladen', 'projects'),
('de', 'rating', 'Bewertung', 'projects'),
('de', 'reviews', 'Bewertungen', 'projects'),
('de', 'search', 'Suchen', 'general'),
('de', 'filter', 'Filtern', 'general'),
('de', 'loading', 'Lädt...', 'general'),
('de', 'error', 'Fehler', 'general'),
('de', 'success', 'Erfolg', 'general'),
('de', 'save', 'Speichern', 'general'),
('de', 'cancel', 'Abbrechen', 'general'),
('de', 'delete', 'Löschen', 'general'),
('de', 'edit', 'Bearbeiten', 'general'),
('de', 'create', 'Erstellen', 'general'),
('de', 'update', 'Aktualisieren', 'general');

-- ============================================
-- 9. SİPARİŞLER
-- ============================================
INSERT IGNORE INTO `orders` (`id`, `user_id`, `order_number`, `total_amount`, `discount_amount`, `final_amount`, `payment_method`, `payment_status`, `order_status`, `created_at`) VALUES
(1, 4, 'ORD-2024-0001', 1999.00, 0.00, 1999.00, 'credit_card', 'completed', 'completed', NOW()),
(2, 5, 'ORD-2024-0002', 1499.00, 149.90, 1349.10, 'credit_card', 'completed', 'completed', NOW()),
(3, 4, 'ORD-2024-0003', 899.00, 0.00, 899.00, 'bank_transfer', 'completed', 'completed', NOW());

INSERT IGNORE INTO `order_items` (`id`, `order_id`, `project_id`, `price`, `quantity`, `subtotal`) VALUES
(1, 1, 1, 1999.00, 1, 1999.00),
(2, 2, 2, 1499.00, 1, 1499.00),
(3, 3, 3, 899.00, 1, 899.00);

-- ============================================
-- 10. DEĞERLENDİRMELER
-- ============================================
INSERT IGNORE INTO `reviews` (`id`, `project_id`, `user_id`, `rating`, `comment`, `is_featured`, `is_approved`, `helpful_count`, `created_at`) VALUES
(1, 1, 4, 5, 'Çok kapsamlı ve iyi dokümante edilmiş bir proje. Kurulumu kolaydı ve destek ekibi çok yardımcı oldu.', 1, 1, 10, NOW()),
(2, 1, 5, 5, 'İş ihtiyaçlarımızı tam olarak karşıladı. Ödeme entegrasyonları sorunsuz çalışıyor.', 0, 1, 8, NOW()),
(3, 2, 4, 4, 'Ekibimizin verimliliğini artırdı. Sadece bazı küçük UX iyileştirmeleri yapılabilir.', 1, 1, 12, NOW());

-- ============================================
-- 11. ABONELİKLER
-- ============================================
INSERT IGNORE INTO `user_subscriptions` (`id`, `user_id`, `plan_id`, `start_date`, `end_date`, `status`, `auto_renew`, `created_at`) VALUES
(1, 4, 2, DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active', 1, NOW()),
(2, 5, 3, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY), 'active', 1, NOW());

-- ============================================
-- 12. KUPONLAR
-- ============================================
INSERT IGNORE INTO `coupons` (`id`, `code`, `discount_type`, `discount_value`, `min_amount`, `usage_limit`, `usage_count`, `start_date`, `expires_at`, `status`, `created_at`) VALUES
(1, 'HOSGELDIN10', 'percentage', 10.00, 100.00, 1000, 156, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 'active', NOW()),
(2, 'YAZ2024', 'percentage', 15.00, 500.00, 500, 234, '2024-06-01 00:00:00', '2024-08-31 23:59:59', 'inactive', NOW()),
(3, 'BLACKFRIDAY', 'percentage', 25.00, 1000.00, 200, 0, '2024-11-25 00:00:00', '2024-11-30 23:59:59', 'active', NOW()),
(4, '100TL', 'fixed', 100.00, 500.00, 100, 45, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 'active', NOW());

-- ============================================
-- 13. LEAD'LER
-- ============================================
INSERT IGNORE INTO `leads` (`id`, `name`, `email`, `phone`, `company`, `message`, `source`, `status`, `created_at`) VALUES
(1, 'Burak Kılıç', 'burak@firma.com', '+90 532 111 2233', 'ABC Teknoloji', 'E-ticaret projesi hakkında bilgi almak istiyorum.', 'website', 'new', NOW()),
(2, 'Selin Yıldız', 'selin@startup.io', '+90 533 222 3344', 'StartupX', 'Özel proje geliştirme teklifi istiyoruz.', 'referral', 'contacted', NOW()),
(3, 'Emre Aksoy', 'emre@corp.com.tr', '+90 534 333 4455', 'MegaCorp', 'Enterprise lisans ve destek paketi hakkında görüşmek istiyoruz.', 'linkedin', 'qualified', NOW());

-- ============================================
-- 14. DESTEK TALEPLERİ
-- ============================================
INSERT IGNORE INTO `tickets` (`id`, `user_id`, `ticket_number`, `subject`, `priority`, `status`, `created_at`) VALUES
(1, 4, 'TKT-2024-0001', 'Ödeme sorunu', 'high', 'open', NOW()),
(2, 5, 'TKT-2024-0002', 'Lisans aktivasyonu', 'medium', 'in_progress', NOW()),
(3, 4, 'TKT-2024-0003', 'Dokümantasyon eksik', 'low', 'resolved', NOW());

-- ============================================
-- 15. PROJE BAĞIŞLARI
-- ============================================
INSERT IGNORE INTO `project_donations` (`id`, `project_id`, `user_id`, `amount`, `is_anonymous`, `message`, `payment_method`, `transaction_id`, `status`, `created_at`) VALUES
(1, 1, 4, 50.00, 0, 'Harika proje, geliştirmeye devam edin!', 'credit_card', 'TXN-DON-0001', 'completed', NOW()),
(2, 2, 5, 100.00, 0, 'Çok faydalı bir araç, teşekkürler.', 'paypal', 'TXN-DON-0002', 'completed', NOW()),
(3, 4, 4, 250.00, 1, NULL, 'credit_card', 'TXN-DON-0003', 'completed', NOW());

-- ============================================
-- 16. SEPET
-- ============================================
INSERT IGNORE INTO `cart` (`id`, `user_id`, `project_id`, `created_at`) VALUES
(1, 4, 6, NOW()),
(2, 4, 8, NOW()),
(3, 5, 9, NOW());

-- ============================================
-- 17. FAVORİLER
-- ============================================
INSERT IGNORE INTO `favorites` (`id`, `user_id`, `project_id`, `created_at`) VALUES
(1, 4, 1, NOW()),
(2, 4, 3, NOW()),
(3, 5, 2, NOW()),
(4, 5, 5, NOW());

-- ============================================
-- 18. ANA SAYFA BÖLÜMLERİ
-- ============================================
INSERT IGNORE INTO `home_sections` (`id`, `key`, `title`, `subtitle`, `description`, `isActive`, `order`, `created_at`, `updated_at`) VALUES
(1, 'hero', 'Hero Bölümü', 'Ana sayfa hero bölümü', 'Dijital Projelerinizi Dünyaya Açın', 1, 1, NOW(), NOW()),
(2, 'features', 'Özellikler', 'Neden TeknoProje?', 'Geliştiriciler ve alıcılar için tasarlanmış güçlü özelliklerle projelerinizi yönetin.', 1, 2, NOW(), NOW()),
(3, 'projects', 'Projeler', 'Popüler Projeler', 'Binlerce başarılı proje keşfedin', 1, 3, NOW(), NOW()),
(4, 'stats', 'İstatistikler', 'Rakamlarla TeknoProje', 'Başarı hikayemizi sayılarla keşfedin.', 1, 4, NOW(), NOW()),
(5, 'faq', 'SSS', 'Sık Sorulan Sorular', 'Yanıtını aradığınız soruyu bulun.', 1, 5, NOW(), NOW()),
(6, 'about', 'Hakkımızda', 'TeknoProje Hikayesi', 'TeknoProje, geliştiricilerin ve yazılım firmalarının dijital projelerini dünyayla paylaşması için kurulmuş bir platformdur.', 1, 6, NOW(), NOW()),
(7, 'blog', 'Blog', 'Blog Haberleri', 'En son teknoloji haberleri ve ipuçları', 1, 7, NOW(), NOW()),
(8, 'testimonials', 'Yorumlar', 'Kullanıcı Yorumları', 'Binlerce memnun kullanıcı bize güveniyor', 1, 8, NOW(), NOW()),
(9, 'contact', 'İletişim', 'Bize Ulaşın', 'Sorularınız için bize yazın', 1, 9, NOW(), NOW());

-- ============================================
-- GİRİŞ BİLGİLERİ ÖZET
-- ============================================
-- 
-- ADMIN:
--   Kullanıcı Adı: admin
--   E-posta: admin@teknoproje.com
--   Şifre: 123456
--   Rol: Admin
--
-- SATICILAR:
--   1. Kullanıcı Adı: ahmet
--      E-posta: ahmet@example.com
--      Şifre: 123456
--      Rol: Satıcı
--
--   2. Kullanıcı Adı: ayse
--      E-posta: ayse@example.com
--      Şifre: 123456
--      Rol: Satıcı
--
--   3. Kullanıcı Adı: ali
--      E-posta: ali@example.com
--      Şifre: 123456
--      Rol: Satıcı
--
-- KULLANICILAR:
--   1. Kullanıcı Adı: mehmet
--      E-posta: mehmet@example.com
--      Şifre: 123456
--      Rol: Kullanıcı
--
--   2. Kullanıcı Adı: zeynep
--      E-posta: zeynep@example.com
--      Şifre: 123456
--      Rol: Kullanıcı
--
-- ============================================

