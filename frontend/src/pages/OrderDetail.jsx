import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useLanguage } from '../context/LanguageContext';
import { ordersAPI } from '../api/orders';
import { getImageUrl } from '../utils/api';
import api from '../api/axios';
import { 
    FiPackage, FiCalendar, FiDollarSign, FiEye, 
    FiCheckCircle, FiClock, FiXCircle, FiDownload,
    FiArrowLeft, FiMapPin, FiMail, FiPhone, FiCreditCard,
    FiFileText, FiShoppingBag, FiUser, FiTrendingUp,
    FiInfo, FiHash, FiGlobe, FiBox, FiTruck, FiMessageCircle,
    FiChevronLeft, FiChevronRight, FiExternalLink, FiPrinter,
    FiShare2, FiCopy, FiTag, FiPercent, FiLayers, FiActivity,
    FiPlus, FiX, FiCode
} from 'react-icons/fi';
import './OrderDetail.css';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageSliders, setImageSliders] = useState({}); // Her ürün için slider durumu
    
    // Bank transfer payment form states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [bankTransferNotification, setBankTransferNotification] = useState({
        receipt_number: '',
        reference_number: '',
        receipt_file: null,
        notes: ''
    });
    const [submittingNotification, setSubmittingNotification] = useState(false);
    const [bankAccounts, setBankAccounts] = useState([]);

    const loadBankAccounts = async () => {
        try {
            const response = await api.get('/bank-accounts');
            setBankAccounts(response.data.accounts || []);
        } catch (error) {
            console.error('Bank accounts load error:', error);
        }
    };

    const loadOrder = async () => {
        try {
            const response = await ordersAPI.getOrder(id);
            setOrder(response.data.order);
        } catch (error) {
            console.error('Order load error:', error);
            alert(t('order_detail.errors.load_failed'));
            navigate('/user/orders');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        loadOrder();
        loadBankAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    
    const handleOpenPaymentModal = () => {
        setShowPaymentModal(true);
        setBankTransferNotification({
            receipt_number: '',
            reference_number: '',
            receipt_file: null,
            notes: ''
        });
    };
    
    const handleClosePaymentModal = () => {
        setShowPaymentModal(false);
        setBankTransferNotification({
            receipt_number: '',
            reference_number: '',
            receipt_file: null,
            notes: ''
        });
    };
    
    const handleSubmitBankTransferNotification = async (e) => {
        e.preventDefault();
        
        if (!bankTransferNotification.receipt_number) {
            alert(t('checkout.receipt_number_required') || 'Dekont numarası zorunludur');
            return;
        }
        
        if (!order) {
            return;
        }
        
        setSubmittingNotification(true);
        try {
            const formData = new FormData();
            formData.append('receipt_number', bankTransferNotification.receipt_number);
            formData.append('reference_number', bankTransferNotification.reference_number || '');
            formData.append('notes', bankTransferNotification.notes || '');
            formData.append('order_id', order.id);
            if (bankTransferNotification.receipt_file) {
                formData.append('receipt_file', bankTransferNotification.receipt_file);
            }
            
            await api.post('/orders/bank-transfer-notification', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            alert(t('checkout.notification_submitted_success') || 'Ödeme bildirimi başarıyla gönderildi');
            handleClosePaymentModal();
            loadOrder(); // Siparişi yenile
        } catch (error) {
            console.error('Bank transfer notification error:', error);
            alert(error.response?.data?.error || t('checkout.notification_submit_failed') || 'Bildirim gönderilirken hata oluştu');
        } finally {
            setSubmittingNotification(false);
        }
    };

    const getStatusBadge = (orderStatus, paymentStatus) => {
        const statusMap = {
            'pending': { label: t('order_detail.status.pending'), icon: FiClock, color: '#f59e0b' },
            'processing': { label: t('order_detail.status.processing'), icon: FiClock, color: '#3b82f6' },
            'completed': { label: t('order_detail.status.completed'), icon: FiCheckCircle, color: '#10b981' },
            'cancelled': { label: t('order_detail.status.cancelled'), icon: FiXCircle, color: '#ef4444' }
        };
        const statusInfo = statusMap[orderStatus] || statusMap['pending'];
        const Icon = statusInfo.icon;
        return (
            <span className="status-badge-large" style={{ backgroundColor: statusInfo.color }}>
                <Icon className="status-icon" />
                {statusInfo.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: t('order_detail.payment_status.pending'), color: '#f59e0b' },
            'pending_review': { label: t('order_detail.payment_status.pending_review') || 'Ödeme İnceleniyor', color: '#f59e0b' },
            'paid': { label: t('order_detail.payment_status.paid'), color: '#10b981' },
            'failed': { label: t('order_detail.payment_status.failed'), color: '#ef4444' },
            'refunded': { label: t('order_detail.payment_status.refunded'), color: '#6b7280' }
        };
        const statusInfo = statusMap[status] || statusMap['pending'];
        return (
            <span className="payment-status-badge" style={{ backgroundColor: statusInfo.color }}>
                {statusInfo.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const localeMap = {
            'tr': 'tr-TR',
            'en': 'en-US',
            'de': 'de-DE'
        };
        return date.toLocaleDateString(localeMap[language] || 'tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        const localeMap = {
            'tr': 'tr-TR',
            'en': 'en-US',
            'de': 'de-DE'
        };
        return new Intl.NumberFormat(localeMap[language] || 'tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price);
    };

    const maskCardNumber = (cardNumber) => {
        if (!cardNumber) return '';
        // Sadece rakamları al
        const digits = cardNumber.replace(/\D/g, '');
        if (digits.length < 8) return cardNumber;
        
        // İlk 4 ve son 4 haneyi göster, ortadaki kısmı * ile maskela
        const first4 = digits.substring(0, 4);
        const last4 = digits.substring(digits.length - 4);
        const middle = '*'.repeat(Math.max(0, digits.length - 8));
        
        // 4'lü gruplar halinde göster
        return `${first4} ${middle} ${last4}`.replace(/\s+/g, ' ').trim();
    };

    const calculateTax = (amount, taxRate = 20) => {
        // KDV hesaplama (varsayılan %20)
        return (amount * taxRate) / (100 + taxRate);
    };

    const calculateSubtotalWithoutTax = (amount, taxRate = 20) => {
        // KDV hariç tutar
        return amount - calculateTax(amount, taxRate);
    };

    const handleCancelOrder = async () => {
        if (!window.confirm(t('order_detail.cancel_confirm'))) {
            return;
        }

        try {
            await ordersAPI.cancelOrder(id);
            alert(t('order_detail.cancel_success'));
            loadOrder();
        } catch (error) {
            alert(error.response?.data?.error || t('order_detail.cancel_failed'));
        }
    };

    const handleSendMessageToSeller = (sellerId, projectId, projectTitle) => {
        // Mesajlaşma sayfasına yönlendir
        const subject = t('order_detail.actions.message_subject', { project: projectTitle });
        navigate(`/user/messages?seller_id=${sellerId}&project_id=${projectId}&subject=${encodeURIComponent(subject)}`);
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="order-detail-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('order_detail.loading')}</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    if (!order) {
        return (
            <UserLayout>
                <div className="order-detail-page">
                    <div className="error-state">
                        <FiXCircle className="error-icon" />
                        <h3>{t('order_detail.not_found')}</h3>
                        <Link to="/user/orders" className="btn btn-primary">
                            {t('order_detail.back_to_orders')}
                        </Link>
                    </div>
                </div>
            </UserLayout>
        );
    }

    const handlePrintInvoice = async () => {
        if (!order) return;
        try {
            const response = await ordersAPI.getInvoice(id);
            if (response.data.invoice) {
                printInvoice(response.data.invoice, order);
            }
        } catch (error) {
            console.error('Invoice print error:', error);
            alert('Fatura yazdırılamadı');
        }
    };

    const printInvoice = (invoice, orderData) => {
        const printWindow = window.open('', '_blank', 'width=900,height=1200');
        
        const formatCurrency = (amount, currency = 'TRY') => {
            return new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        };

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fatura - ${invoice.invoice_number || order.order_number}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #fff; }
                    .invoice-container { max-width: 800px; margin: 0 auto; background: #fff; }
                    .invoice-header { border-bottom: 3px solid #696cff; padding-bottom: 20px; margin-bottom: 30px; }
                    .invoice-title { font-size: 32px; font-weight: 700; color: #696cff; margin-bottom: 10px; }
                    .invoice-number { font-size: 14px; color: #6b7280; }
                    .invoice-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
                    .info-section h3 { font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom: 10px; }
                    .info-section p { font-size: 14px; color: #1a1a1a; margin: 5px 0; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .items-table th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
                    .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                    .items-table tr:last-child td { border-bottom: none; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .summary-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
                    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                    .summary-row.total { font-size: 20px; font-weight: 700; padding-top: 15px; border-top: 2px solid #e5e7eb; margin-top: 10px; }
                    .summary-label { color: #6b7280; }
                    .summary-value { color: #1a1a1a; font-weight: 600; }
                    @media print { body { padding: 0; } .invoice-container { max-width: 100%; } }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="invoice-header">
                        <div class="invoice-title">FATURA</div>
                        <div class="invoice-number">Fatura No: ${invoice.invoice_number || orderData.order_number}</div>
                    </div>
                    <div class="invoice-info">
                        <div class="info-section">
                            <h3>Fatura Bilgileri</h3>
                            <p><strong>Fatura No:</strong> ${invoice.invoice_number || orderData.order_number}</p>
                            <p><strong>Tarih:</strong> ${formatDate(orderData.created_at)}</p>
                            <p><strong>Sipariş No:</strong> ${orderData.order_number}</p>
                        </div>
                        <div class="info-section">
                            <h3>Fatura Edilen</h3>
                            <p><strong>${invoice.customer_name || 'Müşteri'}</strong></p>
                            <p>${invoice.customer_email || ''}</p>
                            <p>${invoice.customer_phone || ''}</p>
                        </div>
                    </div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Ürün/Hizmet</th>
                                <th class="text-center">Miktar</th>
                                <th class="text-right">Birim Fiyat</th>
                                <th class="text-right">KDV</th>
                                <th class="text-right">Toplam</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items?.map(item => `
                                <tr>
                                    <td>${item.title || item.project_title || 'Ürün'}</td>
                                    <td class="text-center">${item.quantity || 1}</td>
                                    <td class="text-right">${formatCurrency(item.price || 0)}</td>
                                    <td class="text-right">${formatCurrency(item.tax || 0)}</td>
                                    <td class="text-right"><strong>${formatCurrency(item.subtotal || 0)}</strong></td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>
                    <div class="summary-section">
                        <div class="summary-row">
                            <span class="summary-label">Ara Toplam (KDV Hariç)</span>
                            <span class="summary-value">${formatCurrency(invoice.subtotal_excl_tax || 0)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">KDV Toplamı</span>
                            <span class="summary-value">${formatCurrency(invoice.tax_total || 0)}</span>
                        </div>
                        ${invoice.discount_amount > 0 ? `
                        <div class="summary-row">
                            <span class="summary-label">İndirim</span>
                            <span class="summary-value">-${formatCurrency(invoice.discount_amount)}</span>
                        </div>
                        ` : ''}
                        <div class="summary-row total">
                            <span class="summary-label">GENEL TOPLAM</span>
                            <span class="summary-value">${formatCurrency(invoice.total_incl_tax || orderData.final_amount || orderData.total_amount)}</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    return (
        <UserLayout>
            <div className="order-detail-page-modern">
                {/* Modern Header - Navbar Style */}
                <div className="order-header-modern bg-1">
                    <div className="header-wrapper">
                        <div className="header-top bg-1">
                            <button onClick={() => navigate('/user/orders')} className="back-btn-modern">
                                <FiArrowLeft />
                                <span>{t('order_detail.back') || 'Siparişlere Dön'}</span>
                            </button>
                            <div className="header-actions">
                                {order.payment_method === 'bank_transfer' && (order.payment_status === 'pending' || order.payment_status === 'pending_review') && (
                                    <button 
                                        onClick={() => {
                                            setShowPaymentModal(true);
                                            setBankTransferNotification({
                                                receipt_number: '',
                                                reference_number: '',
                                                receipt_file: null,
                                                notes: ''
                                            });
                                        }}
                                        className="action-btn-modern pay"
                                        style={{ backgroundColor: '#10b981', color: 'white' }}
                                    >
                                        <FiCreditCard />
                                        <span>{t('orders.pay_now') || 'Ödeme Yap'}</span>
                                    </button>
                                )}
                                {/* Fatura butonu - sadece ödenmiş siparişler için */}
                                {order.payment_status === 'paid' && (
                                    <button onClick={handlePrintInvoice} className="action-btn-modern print">
                                        <FiPrinter />
                                        <span>Fatura Yazdır</span>
                                    </button>
                                )}
                                <button className="action-btn-modern share">
                                    <FiShare2 />
                                    <span>Paylaş</span>
                                </button>
                            </div>
                        </div>
                        <div className="header-main">
                            <div className="header-left">
                                <div className="order-icon-wrapper">
                                    <FiPackage />
                                </div>
                                <div className="header-text">
                                    <h1 className="page-title-modern">
                                        {t('order_detail.title') || 'Sipariş Detayı'}
                                    </h1>
                                    <div className="order-number-modern">
                                        <FiHash />
                                        <span>{order.order_number || `#${order.id}`}</span>
                                        <button 
                                            className="copy-btn"
                                            onClick={() => {
                                                navigator.clipboard.writeText(order.order_number || `#${order.id}`);
                                                alert('Sipariş numarası kopyalandı!');
                                            }}
                                        >
                                            <FiCopy />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="header-status">
                                {getStatusBadge(order.order_status, order.payment_status)}
                                {getPaymentStatusBadge(order.payment_status)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="order-detail-grid">
                    <div className="order-main-section">
                        {/* Sipariş Özeti İstatistikleri */}
                        <div className="order-stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #696cff, #06b6d4)' }}>
                                    <FiHash />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">{t('order_detail.stats.order_no')}</span>
                                    <span className="stat-value">{order.order_number || `#${order.id}`}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    <FiDollarSign />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">{t('order_detail.stats.total_amount')}</span>
                                    <span className="stat-value">{formatPrice(order.final_amount || order.total_amount)}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                    <FiBox />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">{t('order_detail.stats.items_count')}</span>
                                    <span className="stat-value">{t('order_detail.stats.items_count_value', { count: order.items?.length || 0 })}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                                    <FiCalendar />
                                </div>
                                <div className="stat-content">
                                    <span className="stat-label">{t('order_detail.stats.order_date')}</span>
                                    <span className="stat-value">{new Date(order.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Sipariş Durumu ve Timeline */}
                        <div className="order-status-card">
                            <div className="status-header">
                                <h3>
                                    <FiTrendingUp className="section-icon" />
                                    {t('order_detail.status_history.title')}
                                </h3>
                            </div>
                            
                            <div className="status-badges-container">
                                <div className="status-badge-item">
                                    <span className="badge-label">{t('order_detail.status_history.order_status')}</span>
                                    {getStatusBadge(order.order_status, order.payment_status)}
                                </div>
                                <div className="status-badge-item">
                                    <span className="badge-label">{t('order_detail.status_history.payment_status')}</span>
                                    {getPaymentStatusBadge(order.payment_status)}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="order-timeline">
                                <div className="timeline-item completed">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <span className="timeline-title">{t('order_detail.timeline.created.title')}</span>
                                            <span className="timeline-time">{formatDate(order.created_at)}</span>
                                        </div>
                                        <p className="timeline-description">{t('order_detail.timeline.created.description')}</p>
                                    </div>
                                </div>
                                
                                {order.payment_status === 'paid' && (
                                    <div className="timeline-item completed">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-title">{t('order_detail.timeline.payment_received.title')}</span>
                                                <span className="timeline-time">{formatDate(order.updated_at || order.created_at)}</span>
                                            </div>
                                            <p className="timeline-description">{t('order_detail.timeline.payment_received.description')}</p>
                                        </div>
                                    </div>
                                )}

                                {order.order_status === 'processing' && (
                                    <div className="timeline-item active">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-title">{t('order_detail.timeline.processing.title')}</span>
                                                <span className="timeline-time">{formatDate(order.updated_at || order.created_at)}</span>
                                            </div>
                                            <p className="timeline-description">{t('order_detail.timeline.processing.description')}</p>
                                        </div>
                                    </div>
                                )}

                                {order.order_status === 'completed' && (
                                    <div className="timeline-item completed">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-title">{t('order_detail.timeline.completed.title')}</span>
                                                <span className="timeline-time">{formatDate(order.updated_at || order.created_at)}</span>
                                            </div>
                                            <p className="timeline-description">{t('order_detail.timeline.completed.description')}</p>
                                        </div>
                                    </div>
                                )}

                                {order.order_status === 'pending' && (
                                    <div className="timeline-item pending">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-title">{t('order_detail.timeline.pending.title')}</span>
                                                <span className="timeline-time">{t('order_detail.timeline.pending.time')}</span>
                                            </div>
                                            <p className="timeline-description">{t('order_detail.timeline.pending.description')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="order-dates-detailed">
                                <div className="date-item-detailed">
                                    <div className="date-icon-wrapper">
                                        <FiCalendar />
                                    </div>
                                    <div className="date-info">
                                        <span className="date-label">{t('order_detail.dates.order_date')}</span>
                                        <span className="date-value">{formatDate(order.created_at)}</span>
                                    </div>
                                </div>
                                {order.updated_at && order.updated_at !== order.created_at && (
                                    <div className="date-item-detailed">
                                        <div className="date-icon-wrapper">
                                            <FiClock />
                                        </div>
                                        <div className="date-info">
                                            <span className="date-label">{t('order_detail.dates.last_update')}</span>
                                            <span className="date-value">{formatDate(order.updated_at)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sipariş Kalemleri */}
                        <div className="order-items-card">
                            <div className="order-items-header">
                                <h3>
                                    <FiShoppingBag className="section-icon" />
                                    {t('order_detail.items.title')}
                                </h3>
                                <span className="items-count">{t('order_detail.items.count', { count: order.items?.length || 0 })}</span>
                            </div>
                            <div className="items-list">
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item, index) => {
                                        const sliderKey = `item-${index}`;
                                        const currentImageIndex = imageSliders[sliderKey] || 0;
                                        const images = item.images && item.images.length > 0 ? item.images : (item.image ? [{ path: item.image, is_primary: true }] : []);
                                        
                                        const nextImage = () => {
                                            if (images.length > 1) {
                                                setImageSliders(prev => ({
                                                    ...prev,
                                                    [sliderKey]: (currentImageIndex + 1) % images.length
                                                }));
                                            }
                                        };
                                        
                                        const prevImage = () => {
                                            if (images.length > 1) {
                                                setImageSliders(prev => ({
                                                    ...prev,
                                                    [sliderKey]: currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
                                                }));
                                            }
                                        };
                                        
                                        return (
                                        <div key={index} className="order-item-detail">
                                            <div className="item-image-wrapper">
                                                {images.length > 0 ? (
                                                    <div className="item-image-slider">
                                                        <img 
                                                            src={getImageUrl(images[currentImageIndex].path)} 
                                                            alt={item.title}
                                                            className="item-image"
                                                            onError={(e) => {
                                                                e.target.src = '/img/default.svg';
                                                            }}
                                                        />
                                                        {images.length > 1 && (
                                                            <>
                                                                <button 
                                                                    className="slider-nav-btn slider-prev"
                                                                    onClick={prevImage}
                                                                    aria-label="Önceki görsel"
                                                                >
                                                                    <FiChevronLeft />
                                                                </button>
                                                                <button 
                                                                    className="slider-nav-btn slider-next"
                                                                    onClick={nextImage}
                                                                    aria-label="Sonraki görsel"
                                                                >
                                                                    <FiChevronRight />
                                                                </button>
                                                                <div className="slider-indicators">
                                                                    {images.map((img, imgIndex) => (
                                                                        <span 
                                                                            key={imgIndex}
                                                                            className={`slider-dot ${imgIndex === currentImageIndex ? 'active' : ''}`}
                                                                            onClick={() => setImageSliders(prev => ({ ...prev, [sliderKey]: imgIndex }))}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="item-image-placeholder">
                                                        <FiPackage />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="item-details">
                                                <h4>
                                                    <Link to={`/projects/${item.project_id}`}>
                                                        {item.title}
                                                    </Link>
                                                </h4>
                                                <div className="item-meta">
                                                    <span className="item-quantity">
                                                        <span className="meta-label">{t('order_detail.items.quantity')}:</span>
                                                        <span className="meta-value">{item.quantity}</span>
                                                    </span>
                                                    <span className="item-price">
                                                        <span className="meta-label">{t('order_detail.items.unit_price')}:</span>
                                                        <span className="meta-value">{formatPrice(item.price)}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="item-subtotal">
                                                <span className="subtotal-label">{t('order_detail.items.total')}</span>
                                                <span className="subtotal-value">{formatPrice(item.subtotal)}</span>
                                            </div>
                                        </div>
                                    );
                                    })
                                ) : (
                                    <p className="no-items">{t('order_detail.items.not_found')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="order-sidebar">
                        {/* Sipariş Özeti */}
                        <div className="order-summary-card">
                            <div className="card-header-modern">
                                <h3>
                                    <FiFileText className="section-icon" />
                                    {t('order_detail.summary.title')}
                                </h3>
                            </div>
                            
                            {/* Product Details */}
                            {order.items && order.items.length > 0 && (
                                <div className="summary-items-section">
                                    <h4 className="summary-section-title">{t('order_detail.summary.products')}</h4>
                                    <div className="summary-items-list">
                                        {order.items.map((item, index) => {
                                            const itemTax = calculateTax(item.subtotal);
                                            const itemSubtotalWithoutTax = calculateSubtotalWithoutTax(item.subtotal);
                                            return (
                                                <div key={index} className="summary-item-row">
                                                    <div className="summary-item-info">
                                                        <span className="summary-item-name">{item.title || item.project_title || t('order_detail.summary.product')}</span>
                                                        <span className="summary-item-meta">
                                                            {t('order_detail.summary.item_meta', { quantity: item.quantity, price: formatPrice(item.price) })}
                                                        </span>
                                                    </div>
                                                    <div className="summary-item-amounts">
                                                        <div className="summary-item-amount-row">
                                                            <span className="amount-label">{t('order_detail.summary.subtotal')}:</span>
                                                            <span className="amount-value">{formatPrice(itemSubtotalWithoutTax)}</span>
                                                        </div>
                                                        <div className="summary-item-amount-row">
                                                            <span className="amount-label">{t('order_detail.summary.tax')}:</span>
                                                            <span className="amount-value">{formatPrice(itemTax)}</span>
                                                        </div>
                                                        <div className="summary-item-amount-row total">
                                                            <span className="amount-label">{t('order_detail.summary.total')}:</span>
                                                            <span className="amount-value">{formatPrice(item.subtotal)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="summary-divider"></div>

                            {/* Özet Hesaplamalar */}
                            <div className="summary-list">
                                {(() => {
                                    const totalTax = order.items?.reduce((sum, item) => sum + calculateTax(item.subtotal), 0) || 0;
                                    const subtotalWithoutTax = order.items?.reduce((sum, item) => sum + calculateSubtotalWithoutTax(item.subtotal), 0) || (order.total_amount - totalTax);
                                    
                                    return (
                                        <>
                                            <div className="summary-row">
                                                <div className="summary-label-wrapper">
                                                    <span className="summary-label">{t('order_detail.summary.subtotal_excl_tax')}</span>
                                                    <span className="summary-sublabel">{t('order_detail.summary.products_count', { count: order.items?.length || 0 })}</span>
                                                </div>
                                                <span className="summary-value">{formatPrice(subtotalWithoutTax)}</span>
                                            </div>
                                            <div className="summary-row">
                                                <div className="summary-label-wrapper">
                                                    <span className="summary-label">{t('order_detail.summary.tax_total')}</span>
                                                    <span className="summary-sublabel">{t('order_detail.summary.total_tax')}</span>
                                                </div>
                                                <span className="summary-value">{formatPrice(totalTax)}</span>
                                            </div>
                                            {order.discount_amount > 0 && (
                                                <div className="summary-row discount">
                                                    <div className="summary-label-wrapper">
                                                        <span className="summary-label">{t('order_detail.summary.discount')}</span>
                                                        {order.coupon_code && (
                                                            <span className="summary-sublabel">{t('order_detail.summary.coupon_label', { code: order.coupon_code })}</span>
                                                        )}
                                                    </div>
                                                    <span className="summary-value">-{formatPrice(order.discount_amount)}</span>
                                                </div>
                                            )}
                                            {order.coupon_code && !order.discount_amount && (
                                                <div className="summary-row coupon">
                                                    <span className="summary-label">{t('order_detail.summary.coupon_code')}</span>
                                                    <span className="coupon-code">{order.coupon_code}</span>
                                                </div>
                                            )}
                                            <div className="summary-divider"></div>
                                            <div className="summary-row total">
                                                <span className="summary-label">{t('order_detail.summary.total_incl_tax')}</span>
                                                <span className="summary-value">{formatPrice(order.final_amount || order.total_amount)}</span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Ödeme Bilgileri */}
                        <div className="payment-info-card">
                            <div className="card-header-modern">
                                <h3>
                                    <FiCreditCard className="section-icon" />
                                    {t('order_detail.payment.title')}
                                </h3>
                            </div>
                            <div className="payment-details">
                                <div className="payment-detail-item-modern">
                                    <div className="detail-icon-wrapper">
                                        <FiCreditCard />
                                    </div>
                                    <div className="detail-content">
                                        <span className="detail-label">{t('order_detail.payment.method')}</span>
                                        <div className="detail-value-group">
                                            <span className="detail-value">
                                                {order.payment_method === 'credit_card' ? t('order_detail.payment.methods.credit_card') : 
                                                 order.payment_method === 'bank_transfer' ? t('order_detail.payment.methods.bank_transfer') : 
                                                 order.payment_method === 'paypal' ? t('order_detail.payment.methods.paypal') :
                                                 order.payment_method === 'balance' ? t('order_detail.payment.methods.balance') :
                                                 order.payment_method || t('order_detail.payment.methods.not_specified')}
                                            </span>
                                            {order.payment_method === 'credit_card' && order.card_number && (
                                                <span className="card-number-masked">
                                                    {maskCardNumber(order.card_number)}
                                                </span>
                                            )}
                                            {order.payment_method === 'credit_card' && order.card_holder && (
                                                <span className="card-holder-name">
                                                    {order.card_holder}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="payment-detail-item-modern">
                                    <div className="detail-icon-wrapper">
                                        <FiGlobe />
                                    </div>
                                    <div className="detail-content">
                                        <span className="detail-label">{t('order_detail.payment.currency')}</span>
                                        <span className="detail-value">{order.currency || 'TRY'}</span>
                                    </div>
                                </div>
                                {order.payment_status && (
                                    <div className="payment-detail-item-modern">
                                        <div className="detail-icon-wrapper">
                                            <FiCheckCircle />
                                        </div>
                                        <div className="detail-content">
                                            <span className="detail-label">{t('order_detail.payment.status')}</span>
                                            {getPaymentStatusBadge(order.payment_status)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fatura Bilgileri */}
                        {order.billing_info && (
                            <div className="billing-info-card">
                                <div className="card-header-modern">
                                    <h3>
                                        <FiUser className="section-icon" />
                                        {t('order_detail.billing.title')}
                                    </h3>
                                </div>
                                <div className="billing-details">
                                    {order.billing_info.name && (
                                        <div className="billing-detail-item">
                                            <FiUser className="billing-icon" />
                                            <div className="billing-content">
                                                <span className="billing-label">{t('order_detail.billing.name')}</span>
                                                <span className="billing-value">{order.billing_info.name}</span>
                                            </div>
                                        </div>
                                    )}
                                    {order.billing_info.email && (
                                        <div className="billing-detail-item">
                                            <FiMail className="billing-icon" />
                                            <div className="billing-content">
                                                <span className="billing-label">{t('order_detail.billing.email')}</span>
                                                <span className="billing-value">{order.billing_info.email}</span>
                                            </div>
                                        </div>
                                    )}
                                    {order.billing_info.phone && (
                                        <div className="billing-detail-item">
                                            <FiPhone className="billing-icon" />
                                            <div className="billing-content">
                                                <span className="billing-label">{t('order_detail.billing.phone')}</span>
                                                <span className="billing-value">{order.billing_info.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                    {order.billing_info.address && (
                                        <div className="billing-detail-item">
                                            <FiMapPin className="billing-icon" />
                                            <div className="billing-content">
                                                <span className="billing-label">{t('order_detail.billing.address')}</span>
                                                <span className="billing-value">
                                                    {order.billing_info.address}
                                                    {order.billing_info.city && `, ${order.billing_info.city}`}
                                                    {order.billing_info.district && `, ${order.billing_info.district}`}
                                                    {order.billing_info.postal_code && ` ${order.billing_info.postal_code}`}
                                                    {order.billing_info.country && `, ${order.billing_info.country}`}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* İşlemler */}
                        <div className="order-actions-card">
                            <h3>{t('order_detail.actions.title')}</h3>
                            <div className="action-buttons">
                                {/* Her ürün için proje görüntüle, indirme ve satıcıya mesaj butonları */}
                                {order.items && order.items.length > 0 && order.items.map((item, index) => (
                                    <div key={index} className="item-actions-group">
                                        {item.project_id && (
                                            <>
                                                <Link 
                                                    to={`/projects/${item.project_id}`}
                                                    className="btn btn-primary btn-block"
                                                    target="_blank"
                                                >
                                                    <FiEye className="btn-icon" />
                                                    {t('order_detail.actions.view_project', { title: item.title })}
                                                </Link>
                                                
                                                {/* Proje indirme butonları - sadece ödenmiş siparişler için */}
                                                {order.payment_status === 'paid' && order.order_status !== 'cancelled' && item.download_files && item.download_files.length > 0 && (
                                                    <div className="download-files-section" style={{ marginTop: '0.5rem' }}>
                                                        {item.download_files.map((file, fileIndex) => (
                                                            <a
                                                                key={fileIndex}
                                                                href={file.url}
                                                                download
                                                                className="btn btn-success btn-block"
                                                                style={{ marginBottom: '0.5rem' }}
                                                            >
                                                                <FiDownload className="btn-icon" />
                                                                {file.type === 'source' || file.type === 'zip' ? (
                                                                    <>
                                                                        <FiCode className="btn-icon" />
                                                                        {t('order_detail.actions.download_project') || 'Projeyi İndir'} {file.name ? `(${file.name})` : ''}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FiFileText className="btn-icon" />
                                                                        {t('order_detail.actions.download_file') || 'Dosyayı İndir'} {file.name ? `(${file.name})` : ''}
                                                                    </>
                                                                )}
                                                                {file.size && file.size !== 'N/A' && (
                                                                    <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', opacity: 0.8 }}>
                                                                        ({file.size})
                                                                    </span>
                                                                )}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* Ödeme bekleniyor mesajı */}
                                                {order.payment_method === 'bank_transfer' && (order.payment_status === 'pending' || order.payment_status === 'pending_review') && (
                                                    <div className="alert alert-warning" style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.875rem' }}>
                                                        <FiClock style={{ marginRight: '0.5rem' }} />
                                                        {t('order_detail.payment_pending_message') || 'Ödeme onaylandıktan sonra proje dosyalarını indirebilirsiniz.'}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {item.seller_id && (
                                            <button 
                                                onClick={() => handleSendMessageToSeller(item.seller_id, item.project_id, item.title)}
                                                className="btn btn-info btn-block"
                                            >
                                                <FiMessageCircle className="btn-icon" />
                                                {t('order_detail.actions.message_seller', { seller: item.seller_username || t('order_detail.actions.seller') })}
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                {/* Fatura butonu - sadece ödenmiş siparişler için */}
                                {order.payment_status === 'paid' && (
                                    <button 
                                        onClick={() => window.open(`/api/orders/${order.id}/invoice`, '_blank')}
                                        className="btn btn-primary btn-block"
                                    >
                                        <FiDownload className="btn-icon" />
                                        {t('order_detail.actions.download_invoice')}
                                    </button>
                                )}
                                
                                {/* İptal butonu - sadece bekleyen siparişler için */}
                                {order.order_status === 'pending' && order.payment_status !== 'paid' && (
                                    <button 
                                        onClick={handleCancelOrder}
                                        className="btn btn-danger btn-block"
                                    >
                                        <FiXCircle className="btn-icon" />
                                        {t('order_detail.actions.cancel_order')}
                                    </button>
                                )}
                                
                                <Link 
                                    to="/user/orders"
                                    className="btn btn-outline btn-block"
                                >
                                    <FiArrowLeft className="btn-icon" />
                                    {t('order_detail.actions.back_to_orders')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Transfer Payment Modal */}
                {showPaymentModal && order && (
                    <div className="modal-overlay" onClick={handleClosePaymentModal}>
                        <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h5>{t('orders.pay_order') || 'Sipariş Ödemesi'}</h5>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={handleClosePaymentModal}
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                                    <h6>{t('checkout.bank_account_info') || 'Banka Hesap Bilgileri'}</h6>
                                    <p className="mb-2">{t('checkout.bank_transfer_info') || 'Havale/EFT ile ödeme yapmak için aşağıdaki hesap bilgilerini kullanın:'}</p>
                                    {bankAccounts.length > 0 ? (
                                        bankAccounts.map((account, index) => (
                                            <div key={account.id} style={{ marginBottom: index < bankAccounts.length - 1 ? '1rem' : '0' }}>
                                                <ul className="list-unstyled mb-0" style={{ fontSize: '0.875rem' }}>
                                                    <li><strong>{t('checkout.bank')}:</strong> {account.bank_name}</li>
                                                    <li><strong>{t('checkout.iban')}:</strong> {account.iban}</li>
                                                    <li><strong>{t('checkout.account_holder')}:</strong> {account.account_holder}</li>
                                                    {account.account_number && (
                                                        <li><strong>{t('checkout.account_number')}:</strong> {account.account_number}</li>
                                                    )}
                                                    {account.branch_name && (
                                                        <li><strong>{t('checkout.branch')}:</strong> {account.branch_name}</li>
                                                    )}
                                                    <li><strong>{t('checkout.description')}:</strong> {t('checkout.order_number')}: #{order.order_number || order.id}</li>
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted">{t('checkout.no_bank_accounts') || 'Banka hesabı bulunamadı'}</p>
                                    )}
                                </div>

                                <form onSubmit={handleSubmitBankTransferNotification}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            {t('checkout.receipt_number')} <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={bankTransferNotification.receipt_number}
                                            onChange={(e) => setBankTransferNotification(prev => ({ ...prev, receipt_number: e.target.value }))}
                                            placeholder={t('checkout.receipt_number_placeholder')}
                                            required
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            {t('checkout.reference_number')} (CS)
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={bankTransferNotification.reference_number}
                                            onChange={(e) => setBankTransferNotification(prev => ({ ...prev, reference_number: e.target.value }))}
                                            placeholder={t('checkout.reference_number_placeholder')}
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            {t('checkout.upload_receipt')}
                                        </label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setBankTransferNotification(prev => ({ ...prev, receipt_file: e.target.files[0] }))}
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                        />
                                        <small className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                                            {t('checkout.upload_receipt_hint')}
                                        </small>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            {t('checkout.additional_notes')}
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={bankTransferNotification.notes}
                                            onChange={(e) => setBankTransferNotification(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder={t('checkout.additional_notes_placeholder')}
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }}
                                        />
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={submittingNotification}
                                            style={{ flex: 1 }}
                                        >
                                            {submittingNotification ? t('checkout.submitting') : t('checkout.submit_notification')}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleClosePaymentModal}
                                            disabled={submittingNotification}
                                        >
                                            {t('checkout.cancel')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
};

export default OrderDetail;

