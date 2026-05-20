-- Tickets Page Translations
-- TR, EN, DE

INSERT INTO translations (language_code, `key`, `value`, `group`) VALUES
-- Header
('tr', 'tickets.header.title', 'Destek Sistemi', 'tickets'),
('en', 'tickets.header.title', 'Support System', 'tickets'),
('de', 'tickets.header.title', 'Support-System', 'tickets'),

('tr', 'tickets.header.active_tickets', 'Aktif Ticket', 'tickets'),
('en', 'tickets.header.active_tickets', 'Active Tickets', 'tickets'),
('de', 'tickets.header.active_tickets', 'Aktive Tickets', 'tickets'),

('tr', 'tickets.header.departments', 'Departman', 'tickets'),
('en', 'tickets.header.departments', 'Departments', 'tickets'),
('de', 'tickets.header.departments', 'Abteilungen', 'tickets'),

-- Form
('tr', 'tickets.form.create_new', 'Yeni Ticket Oluştur', 'tickets'),
('en', 'tickets.form.create_new', 'Create New Ticket', 'tickets'),
('de', 'tickets.form.create_new', 'Neues Ticket Erstellen', 'tickets'),

('tr', 'tickets.form.cancel', 'İptal', 'tickets'),
('en', 'tickets.form.cancel', 'Cancel', 'tickets'),
('de', 'tickets.form.cancel', 'Abbrechen', 'tickets'),

('tr', 'tickets.form.new_request', 'Yeni Destek Talebi', 'tickets'),
('en', 'tickets.form.new_request', 'New Support Request', 'tickets'),
('de', 'tickets.form.new_request', 'Neue Support-Anfrage', 'tickets'),

('tr', 'tickets.form.select_department', 'Departman Seçin', 'tickets'),
('en', 'tickets.form.select_department', 'Select Department', 'tickets'),
('de', 'tickets.form.select_department', 'Abteilung Auswählen', 'tickets'),

('tr', 'tickets.form.department_required', 'Lütfen bir departman seçin', 'tickets'),
('en', 'tickets.form.department_required', 'Please select a department', 'tickets'),
('de', 'tickets.form.department_required', 'Bitte wählen Sie eine Abteilung aus', 'tickets'),

('tr', 'tickets.form.subject', 'Konu', 'tickets'),
('en', 'tickets.form.subject', 'Subject', 'tickets'),
('de', 'tickets.form.subject', 'Betreff', 'tickets'),

('tr', 'tickets.form.subject_placeholder', 'Ticket konusunu yazın', 'tickets'),
('en', 'tickets.form.subject_placeholder', 'Enter ticket subject', 'tickets'),
('de', 'tickets.form.subject_placeholder', 'Ticket-Betreff eingeben', 'tickets'),

('tr', 'tickets.form.category', 'Kategori', 'tickets'),
('en', 'tickets.form.category', 'Category', 'tickets'),
('de', 'tickets.form.category', 'Kategorie', 'tickets'),

('tr', 'tickets.form.category_general', 'Genel', 'tickets'),
('en', 'tickets.form.category_general', 'General', 'tickets'),
('de', 'tickets.form.category_general', 'Allgemein', 'tickets'),

('tr', 'tickets.form.category_technical', 'Teknik', 'tickets'),
('en', 'tickets.form.category_technical', 'Technical', 'tickets'),
('de', 'tickets.form.category_technical', 'Technisch', 'tickets'),

('tr', 'tickets.form.category_billing', 'Faturalama', 'tickets'),
('en', 'tickets.form.category_billing', 'Billing', 'tickets'),
('de', 'tickets.form.category_billing', 'Abrechnung', 'tickets'),

('tr', 'tickets.form.category_account', 'Hesap', 'tickets'),
('en', 'tickets.form.category_account', 'Account', 'tickets'),
('de', 'tickets.form.category_account', 'Konto', 'tickets'),

('tr', 'tickets.form.category_other', 'Diğer', 'tickets'),
('en', 'tickets.form.category_other', 'Other', 'tickets'),
('de', 'tickets.form.category_other', 'Sonstiges', 'tickets'),

('tr', 'tickets.form.priority', 'Öncelik', 'tickets'),
('en', 'tickets.form.priority', 'Priority', 'tickets'),
('de', 'tickets.form.priority', 'Priorität', 'tickets'),

('tr', 'tickets.form.priority_low', 'Düşük', 'tickets'),
('en', 'tickets.form.priority_low', 'Low', 'tickets'),
('de', 'tickets.form.priority_low', 'Niedrig', 'tickets'),

('tr', 'tickets.form.priority_medium', 'Orta', 'tickets'),
('en', 'tickets.form.priority_medium', 'Medium', 'tickets'),
('de', 'tickets.form.priority_medium', 'Mittel', 'tickets'),

('tr', 'tickets.form.priority_high', 'Yüksek', 'tickets'),
('en', 'tickets.form.priority_high', 'High', 'tickets'),
('de', 'tickets.form.priority_high', 'Hoch', 'tickets'),

('tr', 'tickets.form.priority_urgent', 'Acil', 'tickets'),
('en', 'tickets.form.priority_urgent', 'Urgent', 'tickets'),
('de', 'tickets.form.priority_urgent', 'Dringend', 'tickets'),

('tr', 'tickets.form.purchased_project', 'Satın Aldığım Proje', 'tickets'),
('en', 'tickets.form.purchased_project', 'Purchased Project', 'tickets'),
('de', 'tickets.form.purchased_project', 'Gekauftes Projekt', 'tickets'),

('tr', 'tickets.form.select_project_optional', 'Proje Seçin (Opsiyonel)', 'tickets'),
('en', 'tickets.form.select_project_optional', 'Select Project (Optional)', 'tickets'),
('de', 'tickets.form.select_project_optional', 'Projekt Auswählen (Optional)', 'tickets'),

('tr', 'tickets.form.message', 'Mesaj', 'tickets'),
('en', 'tickets.form.message', 'Message', 'tickets'),
('de', 'tickets.form.message', 'Nachricht', 'tickets'),

('tr', 'tickets.form.message_placeholder', 'Sorununuzu detaylı bir şekilde açıklayın...', 'tickets'),
('en', 'tickets.form.message_placeholder', 'Describe your issue in detail...', 'tickets'),
('de', 'tickets.form.message_placeholder', 'Beschreiben Sie Ihr Problem im Detail...', 'tickets'),

('tr', 'tickets.form.submit', 'Ticket Oluştur', 'tickets'),
('en', 'tickets.form.submit', 'Create Ticket', 'tickets'),
('de', 'tickets.form.submit', 'Ticket Erstellen', 'tickets'),

('tr', 'tickets.form.create_success', 'Ticket başarıyla oluşturuldu!', 'tickets'),
('en', 'tickets.form.create_success', 'Ticket created successfully!', 'tickets'),
('de', 'tickets.form.create_success', 'Ticket erfolgreich erstellt!', 'tickets'),

('tr', 'tickets.form.create_failed', 'Ticket oluşturulamadı', 'tickets'),
('en', 'tickets.form.create_failed', 'Failed to create ticket', 'tickets'),
('de', 'tickets.form.create_failed', 'Ticket konnte nicht erstellt werden', 'tickets'),

-- Status
('tr', 'tickets.status.open', 'Açık', 'tickets'),
('en', 'tickets.status.open', 'Open', 'tickets'),
('de', 'tickets.status.open', 'Offen', 'tickets'),

('tr', 'tickets.status.in_progress', 'İşlemde', 'tickets'),
('en', 'tickets.status.in_progress', 'In Progress', 'tickets'),
('de', 'tickets.status.in_progress', 'In Bearbeitung', 'tickets'),

('tr', 'tickets.status.waiting', 'Beklemede', 'tickets'),
('en', 'tickets.status.waiting', 'Waiting', 'tickets'),
('de', 'tickets.status.waiting', 'Wartend', 'tickets'),

('tr', 'tickets.status.resolved', 'Çözüldü', 'tickets'),
('en', 'tickets.status.resolved', 'Resolved', 'tickets'),
('de', 'tickets.status.resolved', 'Gelöst', 'tickets'),

('tr', 'tickets.status.closed', 'Kapatıldı', 'tickets'),
('en', 'tickets.status.closed', 'Closed', 'tickets'),
('de', 'tickets.status.closed', 'Geschlossen', 'tickets'),

-- Priority
('tr', 'tickets.priority.low', 'Düşük', 'tickets'),
('en', 'tickets.priority.low', 'Low', 'tickets'),
('de', 'tickets.priority.low', 'Niedrig', 'tickets'),

('tr', 'tickets.priority.medium', 'Orta', 'tickets'),
('en', 'tickets.priority.medium', 'Medium', 'tickets'),
('de', 'tickets.priority.medium', 'Mittel', 'tickets'),

('tr', 'tickets.priority.high', 'Yüksek', 'tickets'),
('en', 'tickets.priority.high', 'High', 'tickets'),
('de', 'tickets.priority.high', 'Hoch', 'tickets'),

('tr', 'tickets.priority.urgent', 'Acil', 'tickets'),
('en', 'tickets.priority.urgent', 'Urgent', 'tickets'),
('de', 'tickets.priority.urgent', 'Dringend', 'tickets'),

-- FAQ
('tr', 'tickets.faq.title', 'Sık Sorulan Sorular', 'tickets'),
('en', 'tickets.faq.title', 'Frequently Asked Questions', 'tickets'),
('de', 'tickets.faq.title', 'Häufig Gestellte Fragen', 'tickets'),

('tr', 'tickets.faq.subtitle', 'Yanıtını aradığınız soruyu bulun', 'tickets'),
('en', 'tickets.faq.subtitle', 'Find the answer you are looking for', 'tickets'),
('de', 'tickets.faq.subtitle', 'Finden Sie die Antwort, die Sie suchen', 'tickets'),

('tr', 'tickets.faq.show', 'Göster', 'tickets'),
('en', 'tickets.faq.show', 'Show', 'tickets'),
('de', 'tickets.faq.show', 'Anzeigen', 'tickets'),

('tr', 'tickets.faq.hide', 'Gizle', 'tickets'),
('en', 'tickets.faq.hide', 'Hide', 'tickets'),
('de', 'tickets.faq.hide', 'Ausblenden', 'tickets'),

-- Filters
('tr', 'tickets.filters.search_placeholder', 'Ticket ara...', 'tickets'),
('en', 'tickets.filters.search_placeholder', 'Search tickets...', 'tickets'),
('de', 'tickets.filters.search_placeholder', 'Tickets suchen...', 'tickets'),

('tr', 'tickets.filters.all_departments', 'Tüm Departmanlar', 'tickets'),
('en', 'tickets.filters.all_departments', 'All Departments', 'tickets'),
('de', 'tickets.filters.all_departments', 'Alle Abteilungen', 'tickets'),

('tr', 'tickets.filters.all_statuses', 'Tüm Durumlar', 'tickets'),
('en', 'tickets.filters.all_statuses', 'All Statuses', 'tickets'),
('de', 'tickets.filters.all_statuses', 'Alle Status', 'tickets'),

-- List
('tr', 'tickets.loading', 'Ticket\'lar yükleniyor...', 'tickets'),
('en', 'tickets.loading', 'Loading tickets...', 'tickets'),
('de', 'tickets.loading', 'Tickets werden geladen...', 'tickets'),

('tr', 'tickets.empty.title', 'Henüz ticket oluşturmadınız', 'tickets'),
('en', 'tickets.empty.title', 'You haven\'t created any tickets yet', 'tickets'),
('de', 'tickets.empty.title', 'Sie haben noch keine Tickets erstellt', 'tickets'),

('tr', 'tickets.empty.message', 'Yeni bir destek talebi oluşturmak için yukarıdaki butona tıklayın.', 'tickets'),
('en', 'tickets.empty.message', 'Click the button above to create a new support request.', 'tickets'),
('de', 'tickets.empty.message', 'Klicken Sie auf die Schaltfläche oben, um eine neue Support-Anfrage zu erstellen.', 'tickets'),

('tr', 'tickets.empty.create_first', 'İlk Ticket\'ınızı Oluşturun', 'tickets'),
('en', 'tickets.empty.create_first', 'Create Your First Ticket', 'tickets'),
('de', 'tickets.empty.create_first', 'Erstellen Sie Ihr Erstes Ticket', 'tickets'),

('tr', 'tickets.list.message_not_found', 'Mesaj bulunamadı', 'tickets'),
('en', 'tickets.list.message_not_found', 'Message not found', 'tickets'),
('de', 'tickets.list.message_not_found', 'Nachricht nicht gefunden', 'tickets'),

('tr', 'tickets.list.replies', 'yanıt', 'tickets'),
('en', 'tickets.list.replies', 'replies', 'tickets'),
('de', 'tickets.list.replies', 'Antworten', 'tickets'),

('tr', 'tickets.list.view_details', 'Detayları Gör', 'tickets'),
('en', 'tickets.list.view_details', 'View Details', 'tickets'),
('de', 'tickets.list.view_details', 'Details Anzeigen', 'tickets'),

-- Detail
('tr', 'tickets.detail.back', 'Geri Dön', 'tickets'),
('en', 'tickets.detail.back', 'Back', 'tickets'),
('de', 'tickets.detail.back', 'Zurück', 'tickets'),

('tr', 'tickets.detail.created', 'Oluşturulma', 'tickets'),
('en', 'tickets.detail.created', 'Created', 'tickets'),
('de', 'tickets.detail.created', 'Erstellt', 'tickets'),

('tr', 'tickets.detail.messages', 'Mesajlar', 'tickets'),
('en', 'tickets.detail.messages', 'Messages', 'tickets'),
('de', 'tickets.detail.messages', 'Nachrichten', 'tickets'),

('tr', 'tickets.detail.refresh', 'Yenile', 'tickets'),
('en', 'tickets.detail.refresh', 'Refresh', 'tickets'),
('de', 'tickets.detail.refresh', 'Aktualisieren', 'tickets'),

('tr', 'tickets.detail.no_messages', 'Henüz mesaj yok', 'tickets'),
('en', 'tickets.detail.no_messages', 'No messages yet', 'tickets'),
('de', 'tickets.detail.no_messages', 'Noch keine Nachrichten', 'tickets'),

('tr', 'tickets.detail.role_admin', 'Admin', 'tickets'),
('en', 'tickets.detail.role_admin', 'Admin', 'tickets'),
('de', 'tickets.detail.role_admin', 'Admin', 'tickets'),

('tr', 'tickets.detail.role_seller', 'Satıcı', 'tickets'),
('en', 'tickets.detail.role_seller', 'Seller', 'tickets'),
('de', 'tickets.detail.role_seller', 'Verkäufer', 'tickets'),

('tr', 'tickets.detail.role_user', 'Kullanıcı', 'tickets'),
('en', 'tickets.detail.role_user', 'User', 'tickets'),
('de', 'tickets.detail.role_user', 'Benutzer', 'tickets'),

('tr', 'tickets.detail.role_moderator', 'Moderatör', 'tickets'),
('en', 'tickets.detail.role_moderator', 'Moderator', 'tickets'),
('de', 'tickets.detail.role_moderator', 'Moderator', 'tickets'),

('tr', 'tickets.detail.user', 'Kullanıcı', 'tickets'),
('en', 'tickets.detail.user', 'User', 'tickets'),
('de', 'tickets.detail.user', 'Benutzer', 'tickets'),

('tr', 'tickets.detail.closed_title', 'Bu Ticket Kapatılmış', 'tickets'),
('en', 'tickets.detail.closed_title', 'This Ticket is Closed', 'tickets'),
('de', 'tickets.detail.closed_title', 'Dieses Ticket ist Geschlossen', 'tickets'),

('tr', 'tickets.detail.closed_message', 'Bu ticket kapatılmış durumda. Kapatılan ticket\'lara sadece yöneticiler mesaj yazabilir.', 'tickets'),
('en', 'tickets.detail.closed_message', 'This ticket is closed. Only administrators can write messages to closed tickets.', 'tickets'),
('de', 'tickets.detail.closed_message', 'Dieses Ticket ist geschlossen. Nur Administratoren können Nachrichten an geschlossene Tickets schreiben.', 'tickets'),

('tr', 'tickets.detail.closed_note', 'Yeni bir sorununuz varsa lütfen yeni bir ticket oluşturun.', 'tickets'),
('en', 'tickets.detail.closed_note', 'If you have a new issue, please create a new ticket.', 'tickets'),
('de', 'tickets.detail.closed_note', 'Wenn Sie ein neues Problem haben, erstellen Sie bitte ein neues Ticket.', 'tickets'),

('tr', 'tickets.detail.write_reply', 'Yanıt Yaz', 'tickets'),
('en', 'tickets.detail.write_reply', 'Write Reply', 'tickets'),
('de', 'tickets.detail.write_reply', 'Antwort Schreiben', 'tickets'),

('tr', 'tickets.detail.reply_placeholder', 'Yanıtınızı buraya yazın... Mesajınız detaylı olursa daha hızlı çözüm bulabiliriz.', 'tickets'),
('en', 'tickets.detail.reply_placeholder', 'Write your reply here... The more detailed your message, the faster we can find a solution.', 'tickets'),
('de', 'tickets.detail.reply_placeholder', 'Schreiben Sie hier Ihre Antwort... Je detaillierter Ihre Nachricht, desto schneller können wir eine Lösung finden.', 'tickets'),

('tr', 'tickets.detail.clear', 'Temizle', 'tickets'),
('en', 'tickets.detail.clear', 'Clear', 'tickets'),
('de', 'tickets.detail.clear', 'Löschen', 'tickets'),

('tr', 'tickets.detail.send_reply', 'Yanıt Gönder', 'tickets'),
('en', 'tickets.detail.send_reply', 'Send Reply', 'tickets'),
('de', 'tickets.detail.send_reply', 'Antwort Senden', 'tickets'),

('tr', 'tickets.detail.message_required', 'Lütfen bir mesaj yazın', 'tickets'),
('en', 'tickets.detail.message_required', 'Please write a message', 'tickets'),
('de', 'tickets.detail.message_required', 'Bitte schreiben Sie eine Nachricht', 'tickets'),

('tr', 'tickets.detail.reply_success', 'Yanıtınız başarıyla gönderildi!', 'tickets'),
('en', 'tickets.detail.reply_success', 'Your reply has been sent successfully!', 'tickets'),
('de', 'tickets.detail.reply_success', 'Ihre Antwort wurde erfolgreich gesendet!', 'tickets'),

('tr', 'tickets.detail.reply_failed', 'Yanıt gönderilemedi. Lütfen tekrar deneyin.', 'tickets'),
('en', 'tickets.detail.reply_failed', 'Failed to send reply. Please try again.', 'tickets'),
('de', 'tickets.detail.reply_failed', 'Antwort konnte nicht gesendet werden. Bitte versuchen Sie es erneut.', 'tickets'),

-- Editor
('tr', 'tickets.editor.bold', 'Kalın', 'tickets'),
('en', 'tickets.editor.bold', 'Bold', 'tickets'),
('de', 'tickets.editor.bold', 'Fett', 'tickets'),

('tr', 'tickets.editor.italic', 'İtalik', 'tickets'),
('en', 'tickets.editor.italic', 'Italic', 'tickets'),
('de', 'tickets.editor.italic', 'Kursiv', 'tickets'),

('tr', 'tickets.editor.strike', 'Üstü Çizili', 'tickets'),
('en', 'tickets.editor.strike', 'Strikethrough', 'tickets'),
('de', 'tickets.editor.strike', 'Durchgestrichen', 'tickets'),

('tr', 'tickets.editor.heading1', 'Başlık 1', 'tickets'),
('en', 'tickets.editor.heading1', 'Heading 1', 'tickets'),
('de', 'tickets.editor.heading1', 'Überschrift 1', 'tickets'),

('tr', 'tickets.editor.heading2', 'Başlık 2', 'tickets'),
('en', 'tickets.editor.heading2', 'Heading 2', 'tickets'),
('de', 'tickets.editor.heading2', 'Überschrift 2', 'tickets'),

('tr', 'tickets.editor.bullet_list', 'Madde İşareti', 'tickets'),
('en', 'tickets.editor.bullet_list', 'Bullet List', 'tickets'),
('de', 'tickets.editor.bullet_list', 'Aufzählung', 'tickets'),

('tr', 'tickets.editor.ordered_list', 'Numaralı Liste', 'tickets'),
('en', 'tickets.editor.ordered_list', 'Numbered List', 'tickets'),
('de', 'tickets.editor.ordered_list', 'Nummerierte Liste', 'tickets'),

('tr', 'tickets.editor.undo', 'Geri Al', 'tickets'),
('en', 'tickets.editor.undo', 'Undo', 'tickets'),
('de', 'tickets.editor.undo', 'Rückgängig', 'tickets'),

('tr', 'tickets.editor.redo', 'Yinele', 'tickets'),
('en', 'tickets.editor.redo', 'Redo', 'tickets'),
('de', 'tickets.editor.redo', 'Wiederholen', 'tickets'),

-- Errors
('tr', 'tickets.errors.session_expired', 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'tickets'),
('en', 'tickets.errors.session_expired', 'Your session has expired. Please log in again.', 'tickets'),
('de', 'tickets.errors.session_expired', 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.', 'tickets'),

('tr', 'tickets.errors.error', 'Hata', 'tickets'),
('en', 'tickets.errors.error', 'Error', 'tickets'),
('de', 'tickets.errors.error', 'Fehler', 'tickets'),

('tr', 'tickets.errors.load_failed', 'Ticket detayları yüklenemedi. Lütfen tekrar deneyin.', 'tickets'),
('en', 'tickets.errors.load_failed', 'Failed to load ticket details. Please try again.', 'tickets'),
('de', 'tickets.errors.load_failed', 'Ticket-Details konnten nicht geladen werden. Bitte versuchen Sie es erneut.', 'tickets'),

-- Auth
('tr', 'tickets.auth.required', 'Giriş Yapmanız Gerekiyor', 'tickets'),
('en', 'tickets.auth.required', 'Login Required', 'tickets'),
('de', 'tickets.auth.required', 'Anmeldung Erforderlich', 'tickets'),

('tr', 'tickets.auth.message', 'Destek sistemini kullanmak için lütfen giriş yapın.', 'tickets'),
('en', 'tickets.auth.message', 'Please log in to use the support system.', 'tickets'),
('de', 'tickets.auth.message', 'Bitte melden Sie sich an, um das Support-System zu verwenden.', 'tickets'),

('tr', 'tickets.auth.login', 'Giriş Yap', 'tickets'),
('en', 'tickets.auth.login', 'Log In', 'tickets'),
('de', 'tickets.auth.login', 'Anmelden', 'tickets'),

-- Table
('tr', 'tickets.table.priority', 'Öncelik', 'tickets'),
('en', 'tickets.table.priority', 'Priority', 'tickets'),
('de', 'tickets.table.priority', 'Priorität', 'tickets'),

('tr', 'tickets.table.department', 'Departman', 'tickets'),
('en', 'tickets.table.department', 'Department', 'tickets'),
('de', 'tickets.table.department', 'Abteilung', 'tickets'),

('tr', 'tickets.table.title', 'Başlık', 'tickets'),
('en', 'tickets.table.title', 'Title', 'tickets'),
('de', 'tickets.table.title', 'Titel', 'tickets'),

('tr', 'tickets.table.last_update', 'Son Güncelleme', 'tickets'),
('en', 'tickets.table.last_update', 'Last Update', 'tickets'),
('de', 'tickets.table.last_update', 'Letzte Aktualisierung', 'tickets'),

('tr', 'tickets.table.status', 'Durum', 'tickets'),
('en', 'tickets.table.status', 'Status', 'tickets'),
('de', 'tickets.table.status', 'Status', 'tickets'),

('tr', 'tickets.table.actions', 'İşlem', 'tickets'),
('en', 'tickets.table.actions', 'Actions', 'tickets'),
('de', 'tickets.table.actions', 'Aktionen', 'tickets'),

('tr', 'tickets.table.view', 'Görüntüle', 'tickets'),
('en', 'tickets.table.view', 'View', 'tickets'),
('de', 'tickets.table.view', 'Anzeigen', 'tickets'),

('tr', 'tickets.table.general', 'Genel', 'tickets'),
('en', 'tickets.table.general', 'General', 'tickets'),
('de', 'tickets.table.general', 'Allgemein', 'tickets'),

('tr', 'tickets.table.ticket_no', 'Ticket No', 'tickets'),
('en', 'tickets.table.ticket_no', 'Ticket No', 'tickets'),
('de', 'tickets.table.ticket_no', 'Ticket-Nr.', 'tickets'),

('tr', 'tickets.table.sender', 'Gönderen', 'tickets'),
('en', 'tickets.table.sender', 'Sender', 'tickets'),
('de', 'tickets.table.sender', 'Absender', 'tickets'),

('tr', 'tickets.table.show', 'Sayfada', 'tickets'),
('en', 'tickets.table.show', 'Show', 'tickets'),
('de', 'tickets.table.show', 'Zeige', 'tickets'),

('tr', 'tickets.table.records', 'kayıt göster', 'tickets'),
('en', 'tickets.table.records', 'records', 'tickets'),
('de', 'tickets.table.records', 'Datensätze', 'tickets'),

('tr', 'tickets.table.all', 'Tümü', 'tickets'),
('en', 'tickets.table.all', 'All', 'tickets'),
('de', 'tickets.table.all', 'Alle', 'tickets'),

('tr', 'tickets.table.records_from', 'kayıttan', 'tickets'),
('en', 'tickets.table.records_from', 'records from', 'tickets'),
('de', 'tickets.table.records_from', 'Datensätze von', 'tickets'),

('tr', 'tickets.table.records_showing', 'arasındaki kayıtlar gösteriliyor', 'tickets'),
('en', 'tickets.table.records_showing', 'records showing', 'tickets'),
('de', 'tickets.table.records_showing', 'Datensätze werden angezeigt', 'tickets'),

-- Mobile
('tr', 'tickets.mobile.message', 'Mesaj', 'tickets'),
('en', 'tickets.mobile.message', 'Message', 'tickets'),
('de', 'tickets.mobile.message', 'Nachricht', 'tickets'),

('tr', 'tickets.mobile.last_update', 'Son Güncelleme', 'tickets'),
('en', 'tickets.mobile.last_update', 'Last Update', 'tickets'),
('de', 'tickets.mobile.last_update', 'Letzte Aktualisierung', 'tickets'),

('tr', 'tickets.mobile.priority', 'Öncelik', 'tickets'),
('en', 'tickets.mobile.priority', 'Priority', 'tickets'),
('de', 'tickets.mobile.priority', 'Priorität', 'tickets'),

('tr', 'tickets.mobile.unread', 'okunmamış', 'tickets'),
('en', 'tickets.mobile.unread', 'unread', 'tickets'),
('de', 'tickets.mobile.unread', 'ungelesen', 'tickets')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

