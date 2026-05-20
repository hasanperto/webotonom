import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiFileText, FiUser, FiMail, FiPhone, FiCalendar, FiClock,
    FiCheckCircle, FiXCircle, FiDollarSign, FiDownload,
    FiArrowLeft, FiPackage, FiShoppingCart, FiTag, FiPercent
} from 'react-icons/fi';
import './AdminInvoiceDetail.css';

const AdminInvoiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInvoice();
    }, [id]);

    const loadInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/accounting/invoices/${id}`);
            setInvoice(response.data.invoice);
        } catch (error) {
            console.error('Invoice load error:', error);
            alert('Fatura yüklenirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
            navigate('/admin/accounting/pending-invoices');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount, currency = 'TRY') => {
        if (!amount) return '₺0,00';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const handlePrintInvoice = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=1200');
        
        // Formatlanmış değerleri hazırla
        const formattedInvoiceDate = formatDateShort(invoice.invoice_date);
        const formattedDueDate = invoice.due_date ? formatDateShort(invoice.due_date) : '';
        const formattedAmount = formatCurrency(invoice.amount, invoice.currency);
        const formattedTaxAmount = formatCurrency(invoice.tax_amount, invoice.currency);
        const formattedTotalAmount = formatCurrency(invoice.total_amount, invoice.currency);
        
        // Sipariş kalemlerini formatla
        const formattedItems = invoice.order_items && invoice.order_items.length > 0
            ? invoice.order_items.map(item => `
                <tr>
                    <td class="item-desc">${item.project_title || 'Proje'}</td>
                    <td class="text-right">${item.quantity || 1}</td>
                    <td class="text-right">${formatCurrency(item.unit_price, invoice.currency)}</td>
                    <td class="text-right">${formatCurrency(item.total_price, invoice.currency)}</td>
                </tr>
            `).join('')
            : `
                <tr>
                    <td class="item-desc">${invoice.order_number ? 'Sipariş: ' + invoice.order_number : 'Hizmet'}</td>
                    <td class="text-right">1</td>
                    <td class="text-right">${formattedAmount}</td>
                    <td class="text-right">${formattedAmount}</td>
                </tr>
            `;
        
        const invoiceHTML = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fatura - ${invoice.invoice_number}</title>
    <style>
        :root {
            --primary-color: #2563eb;
            --text-dark: #1f2937;
            --text-light: #6b7280;
            --border-color: #e5e7eb;
            --bg-light: #f9fafb;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f3f4f6;
            color: var(--text-dark);
        }

        .invoice-container {
            max-width: 850px;
            margin: auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }

        /* Header Bölümü */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--bg-light);
            padding-bottom: 30px;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 28px;
            font-weight: 800;
            color: var(--primary-color);
            text-decoration: none;
        }

        .invoice-info {
            text-align: right;
        }

        .invoice-info h1 {
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-dark);
        }

        .invoice-info p {
            margin: 5px 0;
            color: var(--text-light);
            font-size: 14px;
        }

        /* Adres Bölümü */
        .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }

        .details h3 {
            font-size: 14px;
            text-transform: uppercase;
            color: var(--text-light);
            margin-bottom: 10px;
            font-weight: 600;
        }

        .details p {
            margin: 2px 0;
            line-height: 1.5;
            color: var(--text-dark);
        }

        .details strong {
            font-weight: 600;
            color: var(--text-dark);
        }

        /* Tablo Bölümü */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        table th {
            background-color: var(--bg-light);
            padding: 12px 15px;
            text-align: left;
            font-size: 14px;
            color: var(--text-light);
            border-bottom: 1px solid var(--border-color);
            font-weight: 600;
        }

        table td {
            padding: 15px;
            border-bottom: 1px solid var(--border-color);
        }

        .item-desc { 
            font-weight: 500; 
            color: var(--text-dark);
        }
        
        .text-right { 
            text-align: right; 
        }

        /* Toplam Bölümü */
        .totals {
            display: flex;
            justify-content: flex-end;
        }

        .totals-table {
            width: 300px;
        }

        .totals-table tr td {
            padding: 10px 0;
            border: none;
        }

        .totals-table tr td:first-child {
            color: var(--text-light);
            font-weight: 500;
        }

        .totals-table tr td:last-child {
            text-align: right;
            font-weight: 600;
            color: var(--text-dark);
        }

        .grand-total td {
            font-size: 20px;
            font-weight: 700;
            color: var(--primary-color);
            padding-top: 15px;
            border-top: 2px solid var(--border-color);
        }

        /* Alt Bilgi */
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            text-align: center;
            font-size: 13px;
            color: var(--text-light);
            line-height: 1.8;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 5px;
        }

        .status-paid {
            background-color: #d1fae5;
            color: #065f46;
        }

        .status-draft {
            background-color: #f3f4f6;
            color: #374151;
        }

        .status-sent {
            background-color: #dbeafe;
            color: #1e40af;
        }

        .status-overdue {
            background-color: #fee2e2;
            color: #991b1b;
        }

        .status-cancelled {
            background-color: #fee2e2;
            color: #991b1b;
        }

        /* Yazdırma Ayarları */
        @media print {
            body { 
                background: white; 
                padding: 0; 
            }
            .invoice-container { 
                box-shadow: none; 
                border: none; 
                padding: 20px;
            }
            .no-print { 
                display: none; 
            }
            @page {
                margin: 0.5cm;
            }
        }
    </style>
</head>
<body>

<div class="invoice-container">
    <!-- Header -->
    <div class="header">
        <div class="brand">
            <div class="logo">TEKNOLOJİ A.Ş.</div>
            <p style="color: var(--text-light); font-size: 14px;">bilgi@teknoloji.com<br>+90 212 000 00 00</p>
        </div>
        <div class="invoice-info">
            <h1>FATURA</h1>
            <p><strong>No:</strong> ${invoice.invoice_number}</p>
            <p><strong>Tarih:</strong> ${formattedInvoiceDate}</p>
            ${formattedDueDate ? `<p><strong>Vade:</strong> ${formattedDueDate}</p>` : ''}
            <span class="status-badge status-${invoice.status}">${getStatusLabel(invoice.status)}</span>
        </div>
    </div>

    <!-- Adres/Detaylar -->
    <div class="details">
        <div>
            <h3>KİMİNDEN:</h3>
            <p><strong>Teknoloji Yazılım ve Danışmanlık</strong></p>
            <p>Levent Plaza, No:42</p>
            <p>Beşiktaş / İstanbul</p>
            <p>VKN: 1234567890</p>
        </div>
        <div>
            <h3>KİME:</h3>
            <p><strong>${invoice.username || 'Müşteri'}</strong></p>
            ${invoice.email ? `<p>${invoice.email}</p>` : ''}
            ${invoice.phone ? `<p>${invoice.phone}</p>` : ''}
            ${invoice.order_number ? `<p><strong>Sipariş No:</strong> ${invoice.order_number}</p>` : ''}
        </div>
    </div>

    <!-- Ürün Tablosu -->
    <table>
        <thead>
            <tr>
                <th>AÇIKLAMA</th>
                <th class="text-right">ADET</th>
                <th class="text-right">BİRİM FİYAT</th>
                <th class="text-right">TOPLAM</th>
            </tr>
        </thead>
        <tbody>
            ${formattedItems}
        </tbody>
    </table>

    <!-- Hesaplamalar -->
    <div class="totals">
        <table class="totals-table">
            <tr>
                <td>Ara Toplam:</td>
                <td class="text-right">${formattedAmount}</td>
            </tr>
            <tr>
                <td>KDV (%18):</td>
                <td class="text-right">${formattedTaxAmount}</td>
            </tr>
            <tr class="grand-total">
                <td>GENEL TOPLAM:</td>
                <td class="text-right">${formattedTotalAmount}</td>
            </tr>
        </table>
    </div>

    ${invoice.notes ? `
    <!-- Notlar -->
    <div style="margin-top: 30px; padding: 15px; background: var(--bg-light); border-radius: 8px;">
        <p style="margin: 0; color: var(--text-dark); line-height: 1.6;"><strong>Notlar:</strong> ${invoice.notes}</p>
    </div>
    ` : ''}

    <!-- Alt Bilgi -->
    <div class="footer">
        <p>Ödeme vadesi faturadan itibaren 30 gündür. IBAN: TR00 0000 0000 0000 0000 0000 00</p>
        <p>Bizi tercih ettiğiniz için teşekkür ederiz!</p>
    </div>
</div>

<div style="text-align: center; margin-top: 20px;" class="no-print">
    <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">
        PDF Olarak Kaydet / Yazdır
    </button>
</div>

</body>
</html>
        `;

        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        
        // Yazdırma penceresini açtıktan sonra otomatik yazdırma dialogunu aç
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'draft': 'Taslak',
            'sent': 'Gönderildi',
            'paid': 'Ödendi',
            'overdue': 'Vadesi Geçti',
            'cancelled': 'İptal Edildi'
        };
        return statusMap[status] || status;
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'draft': { label: 'Taslak', icon: FiFileText, color: '#6b7280' },
            'sent': { label: 'Gönderildi', icon: FiClock, color: '#3b82f6' },
            'paid': { label: 'Ödendi', icon: FiCheckCircle, color: '#10b981' },
            'overdue': { label: 'Vadesi Geçti', icon: FiXCircle, color: '#ef4444' },
            'cancelled': { label: 'İptal Edildi', icon: FiXCircle, color: '#ef4444' }
        };
        const statusInfo = statusMap[status] || statusMap['draft'];
        const Icon = statusInfo.icon;
        return (
            <span className="status-badge-invoice" style={{ backgroundColor: statusInfo.color }}>
                <Icon className="status-icon" />
                {statusInfo.label}
            </span>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-invoice-detail-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!invoice) {
        return (
            <AdminLayout>
                <div className="admin-invoice-detail-page">
                    <div className="error-state">
                        <FiXCircle className="error-icon" />
                        <h3>Fatura bulunamadı</h3>
                        <button onClick={() => navigate('/admin/accounting/pending-invoices')} className="btn btn-primary">
                            Faturalara Dön
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-invoice-detail-page">
                <div className="page-header-invoice">
                    <button onClick={() => navigate('/admin/accounting/pending-invoices')} className="back-button">
                        <FiArrowLeft />
                        Geri Dön
                    </button>
                    <div className="header-content-invoice">
                        <h1 className="page-title-invoice">
                            <FiFileText className="title-icon" />
                            Fatura Detayı
                        </h1>
                        <p className="page-subtitle-invoice">Fatura #{invoice.invoice_number}</p>
                    </div>
                </div>

                <div className="invoice-detail-grid">
                    <div className="invoice-detail-left">
                        {/* Fatura Bilgileri */}
                        <div className="detail-card-invoice">
                            <div className="card-header-invoice">
                                <h2>
                                    <FiFileText /> Fatura Bilgileri
                                </h2>
                                {getStatusBadge(invoice.status)}
                            </div>
                            <div className="card-body-invoice">
                                <div className="info-row-invoice">
                                    <span className="info-label-invoice">Fatura Numarası:</span>
                                    <span className="info-value-invoice">{invoice.invoice_number}</span>
                                </div>
                                <div className="info-row-invoice">
                                    <span className="info-label-invoice">Fatura Tarihi:</span>
                                    <span className="info-value-invoice">{formatDate(invoice.invoice_date)}</span>
                                </div>
                                {invoice.due_date && (
                                    <div className="info-row-invoice">
                                        <span className="info-label-invoice">Vade Tarihi:</span>
                                        <span className="info-value-invoice">{formatDate(invoice.due_date)}</span>
                                    </div>
                                )}
                                {invoice.order_number && (
                                    <div className="info-row-invoice">
                                        <span className="info-label-invoice">Sipariş Numarası:</span>
                                        <span className="info-value-invoice">
                                            <a 
                                                href={`/admin/orders/${invoice.order_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="link-order"
                                            >
                                                {invoice.order_number}
                                            </a>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Müşteri Bilgileri */}
                        <div className="detail-card-invoice">
                            <div className="card-header-invoice">
                                <h2>
                                    <FiUser /> Müşteri Bilgileri
                                </h2>
                            </div>
                            <div className="card-body-invoice">
                                <div className="info-row-invoice">
                                    <span className="info-label-invoice">Kullanıcı Adı:</span>
                                    <span className="info-value-invoice">{invoice.username || '-'}</span>
                                </div>
                                {invoice.email && (
                                    <div className="info-row-invoice">
                                        <span className="info-label-invoice">
                                            <FiMail /> E-posta:
                                        </span>
                                        <span className="info-value-invoice">{invoice.email}</span>
                                    </div>
                                )}
                                {invoice.phone && (
                                    <div className="info-row-invoice">
                                        <span className="info-label-invoice">
                                            <FiPhone /> Telefon:
                                        </span>
                                        <span className="info-value-invoice">{invoice.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sipariş Kalemleri */}
                        {invoice.order_items && invoice.order_items.length > 0 && (
                            <div className="detail-card-invoice">
                                <div className="card-header-invoice">
                                    <h2>
                                        <FiPackage /> Sipariş Kalemleri
                                    </h2>
                                </div>
                                <div className="card-body-invoice">
                                    <div className="order-items-list-invoice">
                                        {invoice.order_items.map((item, index) => (
                                            <div key={item.id || index} className="order-item-invoice">
                                                <div className="item-info-invoice">
                                                    {item.project_image && (
                                                        <img 
                                                            src={item.project_image} 
                                                            alt={item.project_title}
                                                            className="item-image-invoice"
                                                        />
                                                    )}
                                                    <div className="item-details-invoice">
                                                        <h4>{item.project_title || 'Proje'}</h4>
                                                        <div className="item-meta-invoice">
                                                            <span>Adet: {item.quantity}</span>
                                                            <span>Birim Fiyat: {formatCurrency(item.unit_price, invoice.currency)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="item-total-invoice">
                                                    {formatCurrency(item.total_price, invoice.currency)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notlar */}
                        {invoice.notes && (
                            <div className="detail-card-invoice">
                                <div className="card-header-invoice">
                                    <h2>Notlar</h2>
                                </div>
                                <div className="card-body-invoice">
                                    <p className="notes-text">{invoice.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="invoice-detail-right">
                        {/* Fiyat Özeti */}
                        <div className="detail-card-invoice summary-card-invoice">
                            <div className="card-header-invoice">
                                <h2>
                                    <FiDollarSign /> Fiyat Özeti
                                </h2>
                            </div>
                            <div className="card-body-invoice">
                                <div className="summary-row-invoice">
                                    <span>Ara Toplam:</span>
                                    <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                                </div>
                                <div className="summary-row-invoice tax">
                                    <span>
                                        <FiPercent /> KDV (%18):
                                    </span>
                                    <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                                </div>
                                <div className="summary-row-invoice total">
                                    <span>Toplam:</span>
                                    <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                                </div>
                            </div>
                        </div>

                        {/* İşlemler */}
                        <div className="detail-card-invoice">
                            <div className="card-header-invoice">
                                <h2>İşlemler</h2>
                            </div>
                            <div className="card-body-invoice">
                                <div className="action-buttons-invoice">
                                    {invoice.pdf_path && (
                                        <a 
                                            href={invoice.pdf_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary btn-block"
                                        >
                                            <FiDownload /> Fatura İndir (PDF)
                                        </a>
                                    )}
                                    <button 
                                        onClick={handlePrintInvoice}
                                        className="btn btn-outline btn-block"
                                    >
                                        <FiFileText /> Yazdır
                                    </button>
                                    {invoice.status === 'draft' && (
                                        <>
                                            <button 
                                                onClick={() => {
                                                    if (confirm('Bu faturayı onaylamak istediğinize emin misiniz?')) {
                                                        api.put(`/admin/accounting/invoices/${invoice.id}/approve`)
                                                            .then(() => {
                                                                alert('Fatura onaylandı!');
                                                                loadInvoice();
                                                            })
                                                            .catch(err => {
                                                                alert('Onay işlemi başarısız: ' + (err.response?.data?.error || err.message));
                                                            });
                                                    }
                                                }}
                                                className="btn btn-success btn-block"
                                            >
                                                <FiCheckCircle /> Onayla
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (confirm('Bu faturayı reddetmek istediğinize emin misiniz?')) {
                                                        api.put(`/admin/accounting/invoices/${invoice.id}/reject`)
                                                            .then(() => {
                                                                alert('Fatura reddedildi!');
                                                                loadInvoice();
                                                            })
                                                            .catch(err => {
                                                                alert('Red işlemi başarısız: ' + (err.response?.data?.error || err.message));
                                                            });
                                                    }
                                                }}
                                                className="btn btn-danger btn-block"
                                            >
                                                <FiXCircle /> Reddet
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminInvoiceDetail;

