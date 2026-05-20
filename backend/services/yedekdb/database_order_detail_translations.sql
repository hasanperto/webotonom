-- Order Detail Page Translations
-- TR, EN, DE

INSERT INTO translations (`language_code`, `key`, `value`, `group`) VALUES
-- Page Title & Header
('tr', 'order_detail.title', 'Sipariş Detayı', 'order_detail'),
('en', 'order_detail.title', 'Order Details', 'order_detail'),
('de', 'order_detail.title', 'Bestelldetails', 'order_detail'),

('tr', 'order_detail.order_number', 'Sipariş #{number}', 'order_detail'),
('en', 'order_detail.order_number', 'Order #{number}', 'order_detail'),
('de', 'order_detail.order_number', 'Bestellung #{number}', 'order_detail'),

('tr', 'order_detail.back', 'Geri Dön', 'order_detail'),
('en', 'order_detail.back', 'Back', 'order_detail'),
('de', 'order_detail.back', 'Zurück', 'order_detail'),

-- Loading & Errors
('tr', 'order_detail.loading', 'Yükleniyor...', 'order_detail'),
('en', 'order_detail.loading', 'Loading...', 'order_detail'),
('de', 'order_detail.loading', 'Wird geladen...', 'order_detail'),

('tr', 'order_detail.not_found', 'Sipariş bulunamadı', 'order_detail'),
('en', 'order_detail.not_found', 'Order not found', 'order_detail'),
('de', 'order_detail.not_found', 'Bestellung nicht gefunden', 'order_detail'),

('tr', 'order_detail.back_to_orders', 'Siparişlerime Dön', 'order_detail'),
('en', 'order_detail.back_to_orders', 'Back to Orders', 'order_detail'),
('de', 'order_detail.back_to_orders', 'Zurück zu Bestellungen', 'order_detail'),

('tr', 'order_detail.errors.load_failed', 'Sipariş yüklenirken bir hata oluştu.', 'order_detail'),
('en', 'order_detail.errors.load_failed', 'An error occurred while loading the order.', 'order_detail'),
('de', 'order_detail.errors.load_failed', 'Beim Laden der Bestellung ist ein Fehler aufgetreten.', 'order_detail'),

-- Statistics
('tr', 'order_detail.stats.order_no', 'Sipariş No', 'order_detail'),
('en', 'order_detail.stats.order_no', 'Order No', 'order_detail'),
('de', 'order_detail.stats.order_no', 'Bestellnummer', 'order_detail'),

('tr', 'order_detail.stats.total_amount', 'Toplam Tutar', 'order_detail'),
('en', 'order_detail.stats.total_amount', 'Total Amount', 'order_detail'),
('de', 'order_detail.stats.total_amount', 'Gesamtbetrag', 'order_detail'),

('tr', 'order_detail.stats.items_count', 'Ürün Sayısı', 'order_detail'),
('en', 'order_detail.stats.items_count', 'Items Count', 'order_detail'),
('de', 'order_detail.stats.items_count', 'Anzahl der Artikel', 'order_detail'),

('tr', 'order_detail.stats.items_count_value', '{count} Adet', 'order_detail'),
('en', 'order_detail.stats.items_count_value', '{count} Items', 'order_detail'),
('de', 'order_detail.stats.items_count_value', '{count} Artikel', 'order_detail'),

('tr', 'order_detail.stats.order_date', 'Sipariş Tarihi', 'order_detail'),
('en', 'order_detail.stats.order_date', 'Order Date', 'order_detail'),
('de', 'order_detail.stats.order_date', 'Bestelldatum', 'order_detail'),

-- Status
('tr', 'order_detail.status.pending', 'Beklemede', 'order_detail'),
('en', 'order_detail.status.pending', 'Pending', 'order_detail'),
('de', 'order_detail.status.pending', 'Ausstehend', 'order_detail'),

('tr', 'order_detail.status.processing', 'İşleniyor', 'order_detail'),
('en', 'order_detail.status.processing', 'Processing', 'order_detail'),
('de', 'order_detail.status.processing', 'Wird bearbeitet', 'order_detail'),

('tr', 'order_detail.status.completed', 'Tamamlandı', 'order_detail'),
('en', 'order_detail.status.completed', 'Completed', 'order_detail'),
('de', 'order_detail.status.completed', 'Abgeschlossen', 'order_detail'),

('tr', 'order_detail.status.cancelled', 'İptal Edildi', 'order_detail'),
('en', 'order_detail.status.cancelled', 'Cancelled', 'order_detail'),
('de', 'order_detail.status.cancelled', 'Storniert', 'order_detail'),

-- Payment Status
('tr', 'order_detail.payment_status.pending', 'Ödeme Bekleniyor', 'order_detail'),
('en', 'order_detail.payment_status.pending', 'Payment Pending', 'order_detail'),
('de', 'order_detail.payment_status.pending', 'Zahlung ausstehend', 'order_detail'),

('tr', 'order_detail.payment_status.paid', 'Ödendi', 'order_detail'),
('en', 'order_detail.payment_status.paid', 'Paid', 'order_detail'),
('de', 'order_detail.payment_status.paid', 'Bezahlt', 'order_detail'),

('tr', 'order_detail.payment_status.failed', 'Ödeme Başarısız', 'order_detail'),
('en', 'order_detail.payment_status.failed', 'Payment Failed', 'order_detail'),
('de', 'order_detail.payment_status.failed', 'Zahlung fehlgeschlagen', 'order_detail'),

('tr', 'order_detail.payment_status.refunded', 'İade Edildi', 'order_detail'),
('en', 'order_detail.payment_status.refunded', 'Refunded', 'order_detail'),
('de', 'order_detail.payment_status.refunded', 'Erstattet', 'order_detail'),

-- Status History
('tr', 'order_detail.status_history.title', 'Sipariş Durumu ve Geçmişi', 'order_detail'),
('en', 'order_detail.status_history.title', 'Order Status and History', 'order_detail'),
('de', 'order_detail.status_history.title', 'Bestellstatus und Verlauf', 'order_detail'),

('tr', 'order_detail.status_history.order_status', 'Sipariş Durumu', 'order_detail'),
('en', 'order_detail.status_history.order_status', 'Order Status', 'order_detail'),
('de', 'order_detail.status_history.order_status', 'Bestellstatus', 'order_detail'),

('tr', 'order_detail.status_history.payment_status', 'Ödeme Durumu', 'order_detail'),
('en', 'order_detail.status_history.payment_status', 'Payment Status', 'order_detail'),
('de', 'order_detail.status_history.payment_status', 'Zahlungsstatus', 'order_detail'),

-- Timeline
('tr', 'order_detail.timeline.created.title', 'Sipariş Oluşturuldu', 'order_detail'),
('en', 'order_detail.timeline.created.title', 'Order Created', 'order_detail'),
('de', 'order_detail.timeline.created.title', 'Bestellung erstellt', 'order_detail'),

('tr', 'order_detail.timeline.created.description', 'Siparişiniz başarıyla oluşturuldu ve sistem tarafından kaydedildi.', 'order_detail'),
('en', 'order_detail.timeline.created.description', 'Your order has been successfully created and saved by the system.', 'order_detail'),
('de', 'order_detail.timeline.created.description', 'Ihre Bestellung wurde erfolgreich erstellt und vom System gespeichert.', 'order_detail'),

('tr', 'order_detail.timeline.payment_received.title', 'Ödeme Alındı', 'order_detail'),
('en', 'order_detail.timeline.payment_received.title', 'Payment Received', 'order_detail'),
('de', 'order_detail.timeline.payment_received.title', 'Zahlung erhalten', 'order_detail'),

('tr', 'order_detail.timeline.payment_received.description', 'Ödemeniz başarıyla alındı ve işleme alındı.', 'order_detail'),
('en', 'order_detail.timeline.payment_received.description', 'Your payment has been successfully received and processed.', 'order_detail'),
('de', 'order_detail.timeline.payment_received.description', 'Ihre Zahlung wurde erfolgreich erhalten und verarbeitet.', 'order_detail'),

('tr', 'order_detail.timeline.processing.title', 'İşleniyor', 'order_detail'),
('en', 'order_detail.timeline.processing.title', 'Processing', 'order_detail'),
('de', 'order_detail.timeline.processing.title', 'Wird bearbeitet', 'order_detail'),

('tr', 'order_detail.timeline.processing.description', 'Siparişiniz hazırlanıyor ve işleme alındı.', 'order_detail'),
('en', 'order_detail.timeline.processing.description', 'Your order is being prepared and processed.', 'order_detail'),
('de', 'order_detail.timeline.processing.description', 'Ihre Bestellung wird vorbereitet und bearbeitet.', 'order_detail'),

('tr', 'order_detail.timeline.completed.title', 'Tamamlandı', 'order_detail'),
('en', 'order_detail.timeline.completed.title', 'Completed', 'order_detail'),
('de', 'order_detail.timeline.completed.title', 'Abgeschlossen', 'order_detail'),

('tr', 'order_detail.timeline.completed.description', 'Siparişiniz başarıyla tamamlandı. İndirme linklerinize erişebilirsiniz.', 'order_detail'),
('en', 'order_detail.timeline.completed.description', 'Your order has been successfully completed. You can access your download links.', 'order_detail'),
('de', 'order_detail.timeline.completed.description', 'Ihre Bestellung wurde erfolgreich abgeschlossen. Sie können auf Ihre Download-Links zugreifen.', 'order_detail'),

('tr', 'order_detail.timeline.pending.title', 'Ödeme Bekleniyor', 'order_detail'),
('en', 'order_detail.timeline.pending.title', 'Payment Pending', 'order_detail'),
('de', 'order_detail.timeline.pending.title', 'Zahlung ausstehend', 'order_detail'),

('tr', 'order_detail.timeline.pending.time', 'Beklemede', 'order_detail'),
('en', 'order_detail.timeline.pending.time', 'Pending', 'order_detail'),
('de', 'order_detail.timeline.pending.time', 'Ausstehend', 'order_detail'),

('tr', 'order_detail.timeline.pending.description', 'Ödemenizin tamamlanması bekleniyor.', 'order_detail'),
('en', 'order_detail.timeline.pending.description', 'Waiting for your payment to be completed.', 'order_detail'),
('de', 'order_detail.timeline.pending.description', 'Es wird auf den Abschluss Ihrer Zahlung gewartet.', 'order_detail'),

-- Dates
('tr', 'order_detail.dates.order_date', 'Sipariş Tarihi', 'order_detail'),
('en', 'order_detail.dates.order_date', 'Order Date', 'order_detail'),
('de', 'order_detail.dates.order_date', 'Bestelldatum', 'order_detail'),

('tr', 'order_detail.dates.last_update', 'Son Güncelleme', 'order_detail'),
('en', 'order_detail.dates.last_update', 'Last Update', 'order_detail'),
('de', 'order_detail.dates.last_update', 'Letzte Aktualisierung', 'order_detail'),

-- Items
('tr', 'order_detail.items.title', 'Sipariş Kalemleri', 'order_detail'),
('en', 'order_detail.items.title', 'Order Items', 'order_detail'),
('de', 'order_detail.items.title', 'Bestellartikel', 'order_detail'),

('tr', 'order_detail.items.count', '{count} Ürün', 'order_detail'),
('en', 'order_detail.items.count', '{count} Items', 'order_detail'),
('de', 'order_detail.items.count', '{count} Artikel', 'order_detail'),

('tr', 'order_detail.items.quantity', 'Adet', 'order_detail'),
('en', 'order_detail.items.quantity', 'Quantity', 'order_detail'),
('de', 'order_detail.items.quantity', 'Menge', 'order_detail'),

('tr', 'order_detail.items.unit_price', 'Birim', 'order_detail'),
('en', 'order_detail.items.unit_price', 'Unit', 'order_detail'),
('de', 'order_detail.items.unit_price', 'Einheit', 'order_detail'),

('tr', 'order_detail.items.total', 'Toplam', 'order_detail'),
('en', 'order_detail.items.total', 'Total', 'order_detail'),
('de', 'order_detail.items.total', 'Gesamt', 'order_detail'),

('tr', 'order_detail.items.not_found', 'Sipariş kalemi bulunamadı', 'order_detail'),
('en', 'order_detail.items.not_found', 'No order items found', 'order_detail'),
('de', 'order_detail.items.not_found', 'Keine Bestellartikel gefunden', 'order_detail'),

-- Summary
('tr', 'order_detail.summary.title', 'Sipariş Özeti', 'order_detail'),
('en', 'order_detail.summary.title', 'Order Summary', 'order_detail'),
('de', 'order_detail.summary.title', 'Bestellübersicht', 'order_detail'),

('tr', 'order_detail.summary.products', 'Ürünler', 'order_detail'),
('en', 'order_detail.summary.products', 'Products', 'order_detail'),
('de', 'order_detail.summary.products', 'Produkte', 'order_detail'),

('tr', 'order_detail.summary.product', 'Ürün', 'order_detail'),
('en', 'order_detail.summary.product', 'Product', 'order_detail'),
('de', 'order_detail.summary.product', 'Produkt', 'order_detail'),

('tr', 'order_detail.summary.item_meta', '{quantity} adet × {price}', 'order_detail'),
('en', 'order_detail.summary.item_meta', '{quantity} pcs × {price}', 'order_detail'),
('de', 'order_detail.summary.item_meta', '{quantity} Stk × {price}', 'order_detail'),

('tr', 'order_detail.summary.subtotal', 'Ara Toplam', 'order_detail'),
('en', 'order_detail.summary.subtotal', 'Subtotal', 'order_detail'),
('de', 'order_detail.summary.subtotal', 'Zwischensumme', 'order_detail'),

('tr', 'order_detail.summary.tax', 'KDV (%20)', 'order_detail'),
('en', 'order_detail.summary.tax', 'VAT (20%)', 'order_detail'),
('de', 'order_detail.summary.tax', 'MwSt. (20%)', 'order_detail'),

('tr', 'order_detail.summary.total', 'Toplam', 'order_detail'),
('en', 'order_detail.summary.total', 'Total', 'order_detail'),
('de', 'order_detail.summary.total', 'Gesamt', 'order_detail'),

('tr', 'order_detail.summary.subtotal_excl_tax', 'Ara Toplam (KDV Hariç)', 'order_detail'),
('en', 'order_detail.summary.subtotal_excl_tax', 'Subtotal (Excl. VAT)', 'order_detail'),
('de', 'order_detail.summary.subtotal_excl_tax', 'Zwischensumme (ohne MwSt.)', 'order_detail'),

('tr', 'order_detail.summary.products_count', '{count} ürün', 'order_detail'),
('en', 'order_detail.summary.products_count', '{count} products', 'order_detail'),
('de', 'order_detail.summary.products_count', '{count} Produkte', 'order_detail'),

('tr', 'order_detail.summary.tax_total', 'KDV (%20)', 'order_detail'),
('en', 'order_detail.summary.tax_total', 'VAT (20%)', 'order_detail'),
('de', 'order_detail.summary.tax_total', 'MwSt. (20%)', 'order_detail'),

('tr', 'order_detail.summary.total_tax', 'Toplam KDV', 'order_detail'),
('en', 'order_detail.summary.total_tax', 'Total VAT', 'order_detail'),
('de', 'order_detail.summary.total_tax', 'Gesamt MwSt.', 'order_detail'),

('tr', 'order_detail.summary.discount', 'İndirim', 'order_detail'),
('en', 'order_detail.summary.discount', 'Discount', 'order_detail'),
('de', 'order_detail.summary.discount', 'Rabatt', 'order_detail'),

('tr', 'order_detail.summary.coupon_label', 'Kupon: {code}', 'order_detail'),
('en', 'order_detail.summary.coupon_label', 'Coupon: {code}', 'order_detail'),
('de', 'order_detail.summary.coupon_label', 'Gutschein: {code}', 'order_detail'),

('tr', 'order_detail.summary.coupon_code', 'Kupon Kodu', 'order_detail'),
('en', 'order_detail.summary.coupon_code', 'Coupon Code', 'order_detail'),
('de', 'order_detail.summary.coupon_code', 'Gutscheincode', 'order_detail'),

('tr', 'order_detail.summary.total_incl_tax', 'Toplam Tutar (KDV Dahil)', 'order_detail'),
('en', 'order_detail.summary.total_incl_tax', 'Total Amount (Incl. VAT)', 'order_detail'),
('de', 'order_detail.summary.total_incl_tax', 'Gesamtbetrag (inkl. MwSt.)', 'order_detail'),

-- Payment
('tr', 'order_detail.payment.title', 'Ödeme Bilgileri', 'order_detail'),
('en', 'order_detail.payment.title', 'Payment Information', 'order_detail'),
('de', 'order_detail.payment.title', 'Zahlungsinformationen', 'order_detail'),

('tr', 'order_detail.payment.method', 'Ödeme Yöntemi', 'order_detail'),
('en', 'order_detail.payment.method', 'Payment Method', 'order_detail'),
('de', 'order_detail.payment.method', 'Zahlungsmethode', 'order_detail'),

('tr', 'order_detail.payment.methods.credit_card', '💳 Kredi Kartı', 'order_detail'),
('en', 'order_detail.payment.methods.credit_card', '💳 Credit Card', 'order_detail'),
('de', 'order_detail.payment.methods.credit_card', '💳 Kreditkarte', 'order_detail'),

('tr', 'order_detail.payment.methods.bank_transfer', '🏦 Banka Havalesi', 'order_detail'),
('en', 'order_detail.payment.methods.bank_transfer', '🏦 Bank Transfer', 'order_detail'),
('de', 'order_detail.payment.methods.bank_transfer', '🏦 Banküberweisung', 'order_detail'),

('tr', 'order_detail.payment.methods.paypal', '💼 PayPal', 'order_detail'),
('en', 'order_detail.payment.methods.paypal', '💼 PayPal', 'order_detail'),
('de', 'order_detail.payment.methods.paypal', '💼 PayPal', 'order_detail'),

('tr', 'order_detail.payment.methods.balance', '💰 Bakiye', 'order_detail'),
('en', 'order_detail.payment.methods.balance', '💰 Balance', 'order_detail'),
('de', 'order_detail.payment.methods.balance', '💰 Guthaben', 'order_detail'),

('tr', 'order_detail.payment.methods.not_specified', 'Belirtilmemiş', 'order_detail'),
('en', 'order_detail.payment.methods.not_specified', 'Not Specified', 'order_detail'),
('de', 'order_detail.payment.methods.not_specified', 'Nicht angegeben', 'order_detail'),

('tr', 'order_detail.payment.currency', 'Para Birimi', 'order_detail'),
('en', 'order_detail.payment.currency', 'Currency', 'order_detail'),
('de', 'order_detail.payment.currency', 'Währung', 'order_detail'),

('tr', 'order_detail.payment.status', 'Ödeme Durumu', 'order_detail'),
('en', 'order_detail.payment.status', 'Payment Status', 'order_detail'),
('de', 'order_detail.payment.status', 'Zahlungsstatus', 'order_detail'),

-- Billing
('tr', 'order_detail.billing.title', 'Fatura Bilgileri', 'order_detail'),
('en', 'order_detail.billing.title', 'Billing Information', 'order_detail'),
('de', 'order_detail.billing.title', 'Rechnungsinformationen', 'order_detail'),

('tr', 'order_detail.billing.name', 'Ad Soyad', 'order_detail'),
('en', 'order_detail.billing.name', 'Full Name', 'order_detail'),
('de', 'order_detail.billing.name', 'Vollständiger Name', 'order_detail'),

('tr', 'order_detail.billing.email', 'E-posta', 'order_detail'),
('en', 'order_detail.billing.email', 'Email', 'order_detail'),
('de', 'order_detail.billing.email', 'E-Mail', 'order_detail'),

('tr', 'order_detail.billing.phone', 'Telefon', 'order_detail'),
('en', 'order_detail.billing.phone', 'Phone', 'order_detail'),
('de', 'order_detail.billing.phone', 'Telefon', 'order_detail'),

('tr', 'order_detail.billing.address', 'Adres', 'order_detail'),
('en', 'order_detail.billing.address', 'Address', 'order_detail'),
('de', 'order_detail.billing.address', 'Adresse', 'order_detail'),

-- Actions
('tr', 'order_detail.actions.title', 'İşlemler', 'order_detail'),
('en', 'order_detail.actions.title', 'Actions', 'order_detail'),
('de', 'order_detail.actions.title', 'Aktionen', 'order_detail'),

('tr', 'order_detail.actions.download_invoice', 'Fatura İndir', 'order_detail'),
('en', 'order_detail.actions.download_invoice', 'Download Invoice', 'order_detail'),
('de', 'order_detail.actions.download_invoice', 'Rechnung herunterladen', 'order_detail'),

('tr', 'order_detail.actions.cancel_order', 'Siparişi İptal Et', 'order_detail'),
('en', 'order_detail.actions.cancel_order', 'Cancel Order', 'order_detail'),
('de', 'order_detail.actions.cancel_order', 'Bestellung stornieren', 'order_detail'),

('tr', 'order_detail.actions.back_to_orders', 'Siparişlerime Dön', 'order_detail'),
('en', 'order_detail.actions.back_to_orders', 'Back to Orders', 'order_detail'),
('de', 'order_detail.actions.back_to_orders', 'Zurück zu Bestellungen', 'order_detail'),

('tr', 'order_detail.actions.view_project', 'Projeyi Görüntüle: {title}', 'order_detail'),
('en', 'order_detail.actions.view_project', 'View Project: {title}', 'order_detail'),
('de', 'order_detail.actions.view_project', 'Projekt anzeigen: {title}', 'order_detail'),

('tr', 'order_detail.actions.message_seller', 'Satıcıya Mesaj Gönder: {seller}', 'order_detail'),
('en', 'order_detail.actions.message_seller', 'Message Seller: {seller}', 'order_detail'),
('de', 'order_detail.actions.message_seller', 'Verkäufer kontaktieren: {seller}', 'order_detail'),

('tr', 'order_detail.actions.seller', 'Satıcı', 'order_detail'),
('en', 'order_detail.actions.seller', 'Seller', 'order_detail'),
('de', 'order_detail.actions.seller', 'Verkäufer', 'order_detail'),

('tr', 'order_detail.actions.message_subject', 'Sipariş Hakkında: {project}', 'order_detail'),
('en', 'order_detail.actions.message_subject', 'About Order: {project}', 'order_detail'),
('de', 'order_detail.actions.message_subject', 'Zur Bestellung: {project}', 'order_detail'),

-- Cancel
('tr', 'order_detail.cancel_confirm', 'Bu siparişi iptal etmek istediğinize emin misiniz?', 'order_detail'),
('en', 'order_detail.cancel_confirm', 'Are you sure you want to cancel this order?', 'order_detail'),
('de', 'order_detail.cancel_confirm', 'Sind Sie sicher, dass Sie diese Bestellung stornieren möchten?', 'order_detail'),

('tr', 'order_detail.cancel_success', 'Sipariş iptal edildi', 'order_detail'),
('en', 'order_detail.cancel_success', 'Order cancelled', 'order_detail'),
('de', 'order_detail.cancel_success', 'Bestellung storniert', 'order_detail'),

('tr', 'order_detail.cancel_failed', 'Sipariş iptal edilemedi', 'order_detail'),
('en', 'order_detail.cancel_failed', 'Failed to cancel order', 'order_detail'),
('de', 'order_detail.cancel_failed', 'Bestellung konnte nicht storniert werden', 'order_detail')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

