-- User Downloads Page Translations
-- TR, EN, DE

INSERT INTO translations (`language_code`, `key`, `value`, `group`) VALUES
-- Page Title
('tr', 'downloads.title', 'İndirmelerim', 'downloads'),
('en', 'downloads.title', 'My Downloads', 'downloads'),
('de', 'downloads.title', 'Meine Downloads', 'downloads'),

-- Subtitle
('tr', 'downloads.subtitle', 'Satın aldığınız projeleri indirin', 'downloads'),
('en', 'downloads.subtitle', 'Download your purchased projects', 'downloads'),
('de', 'downloads.subtitle', 'Laden Sie Ihre gekauften Projekte herunter', 'downloads'),

-- Loading
('tr', 'downloads.loading', 'Yükleniyor...', 'downloads'),
('en', 'downloads.loading', 'Loading...', 'downloads'),
('de', 'downloads.loading', 'Wird geladen...', 'downloads'),

-- Actions
('tr', 'downloads.actions.download', 'İndir', 'downloads'),
('en', 'downloads.actions.download', 'Download', 'downloads'),
('de', 'downloads.actions.download', 'Herunterladen', 'downloads'),

('tr', 'downloads.actions.view_project', 'Projeyi Gör', 'downloads'),
('en', 'downloads.actions.view_project', 'View Project', 'downloads'),
('de', 'downloads.actions.view_project', 'Projekt anzeigen', 'downloads'),

-- Empty State
('tr', 'downloads.empty.title', 'Henüz indirme yok', 'downloads'),
('en', 'downloads.empty.title', 'No downloads yet', 'downloads'),
('de', 'downloads.empty.title', 'Noch keine Downloads', 'downloads'),

('tr', 'downloads.empty.description', 'Satın aldığınız projeler burada görünecek!', 'downloads'),
('en', 'downloads.empty.description', 'Your purchased projects will appear here!', 'downloads'),
('de', 'downloads.empty.description', 'Ihre gekauften Projekte werden hier angezeigt!', 'downloads'),

('tr', 'downloads.empty.explore_projects', 'Projeleri Keşfet', 'downloads'),
('en', 'downloads.empty.explore_projects', 'Explore Projects', 'downloads'),
('de', 'downloads.empty.explore_projects', 'Projekte erkunden', 'downloads')

ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

