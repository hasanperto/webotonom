import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useLanguage } from '../context/LanguageContext';
import { ordersAPI } from '../api/orders';
import {
    FiPackage, FiCalendar, FiDollarSign, FiEye,
    FiCheckCircle, FiClock, FiXCircle, FiDownload,
    FiRefreshCw, FiMenu, FiSearch, FiFilter, FiChevronDown, FiChevronUp,
    FiCreditCard, FiPlus, FiX
} from 'react-icons/fi';
import api from '../api/axios';
import './UserOrders.css';

const UserOrders = () => {
    const { t, language } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Bank transfer payment form states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
    const [bankTransferNotification, setBankTransferNotification] = useState({
        receipt_number: '',
        reference_number: '',
        receipt_file: null,
        notes: ''
    });
    const [submittingNotification, setSubmittingNotification] = useState(false);
    const [bankAccounts, setBankAccounts] = useState([]);

    // Gelişmiş Filtre State'leri
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price_asc, price_desc

    useEffect(() => {
        loadOrders();
        loadBankAccounts();
    }, [language]);

    const loadBankAccounts = async () => {
        try {
            const response = await api.get('/bank-accounts');
            setBankAccounts(response.data.accounts || []);
        } catch (error) {
            console.error('Bank accounts load error:', error);
        }
    };

    const loadOrders = async () => {
        try {
            const response = await ordersAPI.getOrders({ lang: language });
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Orders load error:', error);
            alert(t('orders.errors.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async (e, orderId) => {
        e.stopPropagation();
        try {
            const response = await ordersAPI.getInvoice(orderId);
            if (response.data.invoice) {
                printInvoice(response.data.invoice);
            } else {
                alert(response.data.message || 'Fatura bilgisi alınamadı');
            }
        } catch (error) {
            console.error('Invoice download error:', error);
            alert(t('orders.errors.action_failed') || 'İşlem başarısız');
        }
    };

    const printInvoice = (invoice) => {
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
            if (!dateString) return '-';
            return new Date(dateString).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formattedInvoiceDate = formatDate(invoice.invoice_date);
        const formattedSubtotal = formatCurrency(invoice.subtotal, invoice.currency);
        const formattedDiscount = invoice.discount > 0 ? formatCurrency(invoice.discount, invoice.currency) : null;
        const formattedTaxAmount = formatCurrency(invoice.tax_amount, invoice.currency);
        const formattedTotal = formatCurrency(invoice.total, invoice.currency);

        // Sipariş kalemlerini formatla
        const formattedItems = invoice.items && invoice.items.length > 0
            ? invoice.items.map(item => `
                <tr>
                    <td class="item-desc">${item.title || 'Ürün'}</td>
                    <td class="text-right">${item.quantity || 1}</td>
                    <td class="text-right">${formatCurrency(item.unit_price, invoice.currency)}</td>
                    <td class="text-right">${formatCurrency(item.total_price, invoice.currency)}</td>
                </tr>
            `).join('')
            : '';

        // Billing info veya user bilgileri
        const billingInfo = invoice.billing_info || {};
        const customerName = billingInfo.name || invoice.user?.name || invoice.user?.username || 'Müşteri';
        const customerEmail = billingInfo.email || invoice.user?.email || '';
        const customerPhone = billingInfo.phone || invoice.user?.phone || '';
        const customerAddress = billingInfo.address || '';
        const customerCity = billingInfo.city || '';
        const customerDistrict = billingInfo.district || '';
        const customerPostalCode = billingInfo.postal_code || '';
        const customerCountry = billingInfo.country || 'Türkiye';

        const paymentMethodMap = {
            'credit_card': 'Kredi Kartı',
            'paypal': 'PayPal',
            'bank_transfer': 'Banka Havalesi',
            'balance': 'Bakiye',
            'guest_card': 'Misafir Kartı'
        };
        const paymentMethodLabel = paymentMethodMap[invoice.payment_method] || invoice.payment_method || 'Kredi Kartı';

        const invoiceHTML = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fatura - ${invoice.invoice_number}</title>
    <style>
        :root {
            --primary-color: #696cff;
            --text-dark: #1f2937;
            --text-light: #6b7280;
            --border-color: #e5e7eb;
            --bg-light: #f9fafb;
            --success-color: #10b981;
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
            border-bottom: 3px solid var(--primary-color);
            padding-bottom: 30px;
            margin-bottom: 30px;
        }

        .brand {
            flex: 1;
        }

        .logo {
            font-size: 32px;
            font-weight: 800;
            color: var(--primary-color);
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }

        .brand p {
            color: var(--text-light);
            font-size: 14px;
            line-height: 1.6;
        }

        .invoice-info {
            text-align: right;
        }

        .invoice-info h1 {
            margin: 0 0 15px 0;
            font-size: 36px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--primary-color);
            font-weight: 700;
        }

        .invoice-info p {
            margin: 5px 0;
            font-size: 14px;
            color: var(--text-dark);
        }

        .invoice-info strong {
            color: var(--text-dark);
        }

        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
            text-transform: uppercase;
        }

        .status-paid {
            background: #d1fae5;
            color: #065f46;
        }

        /* Adres/Detaylar */
        .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
            padding: 25px;
            background: var(--bg-light);
            border-radius: 8px;
        }

        .details h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-light);
            margin-bottom: 15px;
            font-weight: 600;
        }

        .details p {
            margin: 5px 0;
            font-size: 14px;
            color: var(--text-dark);
            line-height: 1.6;
        }

        .details strong {
            color: var(--text-dark);
            font-weight: 600;
        }

        /* Ürün Tablosu */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        thead {
            background: var(--primary-color);
            color: white;
        }

        thead th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        thead th.text-right {
            text-align: right;
        }

        tbody tr {
            border-bottom: 1px solid var(--border-color);
        }

        tbody tr:last-child {
            border-bottom: none;
        }

        tbody td {
            padding: 15px;
            font-size: 14px;
        }

        .item-desc {
            font-weight: 500;
            color: var(--text-dark);
        }

        .text-right {
            text-align: right;
        }

        /* Hesaplamalar */
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }

        .totals-table {
            width: 350px;
        }

        .totals-table tr {
            border-bottom: 1px solid var(--border-color);
        }

        .totals-table td {
            padding: 10px 15px;
            font-size: 14px;
        }

        .totals-table td:first-child {
            text-align: right;
            color: var(--text-light);
            font-weight: 500;
        }

        .totals-table td:last-child {
            text-align: right;
            color: var(--text-dark);
            font-weight: 600;
        }

        .totals-table .total-row {
            background: var(--bg-light);
            border-top: 2px solid var(--primary-color);
        }

        .totals-table .total-row td {
            font-size: 18px;
            font-weight: 700;
            color: var(--primary-color);
            padding: 15px;
        }

        .discount-row td {
            color: var(--success-color);
        }

        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid var(--border-color);
            text-align: center;
            color: var(--text-light);
            font-size: 12px;
        }

        .footer p {
            margin: 5px 0;
        }

        .payment-info {
            background: var(--bg-light);
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }

        .payment-info h4 {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-light);
            margin-bottom: 10px;
        }

        .payment-info p {
            margin: 5px 0;
            font-size: 14px;
            color: var(--text-dark);
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
                padding: 0;
            }

            .invoice-container {
                box-shadow: none;
                padding: 20px;
            }

            @page {
                margin: 1cm;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="brand">
                <div class="logo">TeknoProje</div>
                <p>
                    Teknoloji Yazılım ve Danışmanlık A.Ş.<br>
                    Levent Plaza, No:42<br>
                    Beşiktaş / İstanbul<br>
                    VKN: 1234567890<br>
                    bilgi@teknoproje.com<br>
                    +90 212 000 00 00
                </p>
            </div>
            <div class="invoice-info">
                <h1>FATURA</h1>
                <p><strong>Fatura No:</strong> ${invoice.invoice_number}</p>
                <p><strong>Tarih:</strong> ${formattedInvoiceDate}</p>
                <p><strong>Sipariş No:</strong> ${invoice.order_number || invoice.order_id}</p>
                <span class="status-badge status-${invoice.payment_status === 'paid' ? 'paid' : 'pending'}">
                    ${invoice.payment_status === 'paid' ? 'Ödendi' : 'Beklemede'}
                </span>
            </div>
        </div>

        <!-- Adres/Detaylar -->
        <div class="details">
            <div>
                <h3>KİMİNDEN</h3>
                <p><strong>TeknoProje</strong></p>
                <p>Teknoloji Yazılım ve Danışmanlık A.Ş.</p>
                <p>Levent Plaza, No:42</p>
                <p>Beşiktaş / İstanbul</p>
                <p>VKN: 1234567890</p>
            </div>
            <div>
                <h3>KİME</h3>
                <p><strong>${customerName}</strong></p>
                ${customerEmail ? `<p>${customerEmail}</p>` : ''}
                ${customerPhone ? `<p>${customerPhone}</p>` : ''}
                ${customerAddress ? `<p>${customerAddress}</p>` : ''}
                ${customerDistrict || customerCity ? `<p>${customerDistrict ? customerDistrict + ', ' : ''}${customerCity}</p>` : ''}
                ${customerPostalCode ? `<p>${customerPostalCode}</p>` : ''}
                ${customerCountry ? `<p>${customerCountry}</p>` : ''}
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
                    <td>Ara Toplam (KDV Hariç)</td>
                    <td>${formattedSubtotal}</td>
                </tr>
                ${formattedDiscount ? `
                <tr class="discount-row">
                    <td>İndirim</td>
                    <td>-${formattedDiscount}</td>
                </tr>
                ` : ''}
                <tr>
                    <td>KDV (%${invoice.tax_rate})</td>
                    <td>${formattedTaxAmount}</td>
                </tr>
                <tr class="total-row">
                    <td>GENEL TOPLAM</td>
                    <td>${formattedTotal}</td>
                </tr>
            </table>
        </div>

        <!-- Ödeme Bilgileri -->
        <div class="payment-info">
            <h4>Ödeme Bilgileri</h4>
            <p><strong>Ödeme Yöntemi:</strong> ${paymentMethodLabel}</p>
            <p><strong>Ödeme Durumu:</strong> ${invoice.payment_status === 'paid' ? 'Ödendi' : 'Beklemede'}</p>
            <p><strong>Sipariş Durumu:</strong> ${invoice.order_status === 'completed' ? 'Tamamlandı' : invoice.order_status === 'processing' ? 'İşlemde' : 'Beklemede'}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Teşekkür Ederiz!</strong></p>
            <p>Bu fatura elektronik ortamda oluşturulmuştur.</p>
            <p>www.teknoproje.com</p>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>`;

        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    };

    const getStatusBadge = (orderStatus, paymentStatus) => {
        // Önce order_status'e bak, sonra payment_status'e
        const status = orderStatus || 'pending';
        const statusMap = {
            'pending': { label: t('orders.status.pending'), icon: FiClock, color: '#f59e0b' },
            'processing': { label: t('orders.status.processing'), icon: FiClock, color: '#3b82f6' },
            'completed': { label: t('orders.status.completed'), icon: FiCheckCircle, color: '#10b981' },
            'cancelled': { label: t('orders.status.cancelled'), icon: FiXCircle, color: '#ef4444' },
            'refunded': { label: t('orders.status.refunded'), icon: FiXCircle, color: '#6b7280' }
        };
        const statusInfo = statusMap[status] || statusMap['pending'];
        const Icon = statusInfo.icon;
        return (
            <span className="status-badge-table" style={{ backgroundColor: statusInfo.color }}>
                <Icon className="status-icon" />
                {statusInfo.label}
                {paymentStatus === 'paid' && status === 'pending' && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>({t('orders.paid')})</span>
                )}
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

    const toggleRowExpansion = (orderId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedRows(newExpanded);
    };

    const handleOpenPaymentModal = (order) => {
        setSelectedOrderForPayment(order);
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
        setSelectedOrderForPayment(null);
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

        if (!selectedOrderForPayment) {
            return;
        }

        setSubmittingNotification(true);
        try {
            const formData = new FormData();
            formData.append('receipt_number', bankTransferNotification.receipt_number);
            formData.append('reference_number', bankTransferNotification.reference_number || '');
            formData.append('notes', bankTransferNotification.notes || '');
            formData.append('order_id', selectedOrderForPayment.id);
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
            loadOrders(); // Siparişleri yenile
        } catch (error) {
            console.error('Bank transfer notification error:', error);
            alert(error.response?.data?.error || t('checkout.notification_submit_failed') || 'Bildirim gönderilirken hata oluştu');
        } finally {
            setSubmittingNotification(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        // Durum filtresi
        if (filter !== 'all' && order.order_status !== filter) {
            return false;
        }

        // Tarih Aralığı Filtresi
        if (dateRange.start) {
            const orderDate = new Date(order.created_at);
            const startDate = new Date(dateRange.start);
            if (orderDate < startDate) return false;
        }
        if (dateRange.end) {
            const orderDate = new Date(order.created_at);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999); // Günün sonuna ayarla
            if (orderDate > endDate) return false;
        }

        // Fiyat Aralığı Filtresi
        const amount = parseFloat(order.final_amount || order.total_amount || 0);
        if (priceRange.min && amount < parseFloat(priceRange.min)) return false;
        if (priceRange.max && amount > parseFloat(priceRange.max)) return false;

        // Arama sorgusu
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const orderNumber = (order.order_number || order.id || '').toString().toLowerCase();
            const orderId = order.id.toString().toLowerCase();
            const totalAmount = (order.final_amount || order.total_amount || 0).toString().toLowerCase();

            // Ürün isimlerinde ara
            const itemTitles = order.items?.map(item => (item.project_title || '').toLowerCase()).join(' ') || '';

            return orderNumber.includes(query) ||
                orderId.includes(query) ||
                totalAmount.includes(query) ||
                itemTitles.includes(query);
        }

        return true;
    }).sort((a, b) => {
        // Sıralama
        switch (sortBy) {
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'price_asc':
                return (parseFloat(a.final_amount || 0) - parseFloat(b.final_amount || 0));
            case 'price_desc':
                return (parseFloat(b.final_amount || 0) - parseFloat(a.final_amount || 0));
            case 'newest':
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    if (loading) {
        return (
            <UserLayout>
                <div className="user-orders-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="user-orders-page">
                {/* Başlık ve Yenile Butonu */}
                <div className="orders-header-section">
                    <div className="orders-header-title">
                        <strong>
                            <FiMenu className="header-icon" /> {t('orders.title')}
                        </strong>
                        <button
                            type="button"
                            className="btn-refresh-orders"
                            onClick={loadOrders}
                            title={t('orders.refresh')}
                        >
                            <FiRefreshCw /> {t('orders.refresh')}
                        </button>
                    </div>
                </div>

                {/* Arama ve Filtreler */}
                <div className="orders-search-section">
                    <div className="search-box-orders">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder={t('orders.search.placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input-orders"
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchQuery('')}
                                title={t('orders.search.clear')}
                            >
                                <FiXCircle />
                            </button>
                        )}
                    </div>
                    <button
                        className={`btn-advanced-search ${showAdvancedSearch ? 'active' : ''}`}
                        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                        title={t('orders.search.advanced')}
                    >
                        <FiFilter /> {t('orders.search.advanced')}
                    </button>
                </div>

                {/* Gelişmiş Arama */}
                {/* Gelişmiş Arama */}
                {showAdvancedSearch && (
                    <div className="advanced-search-panel">
                        <div className="advanced-search-grid">
                            {/* Durum Filtresi */}
                            <div className="filter-group-advanced">
                                <label><FiCheckCircle /> {t('orders.search.status')}</label>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="filter-input-advanced"
                                >
                                    <option value="all">{t('orders.filters.all')}</option>
                                    <option value="pending">{t('orders.filters.pending')}</option>
                                    <option value="processing">{t('orders.filters.processing')}</option>
                                    <option value="completed">{t('orders.filters.completed')}</option>
                                    <option value="cancelled">{t('orders.filters.cancelled')}</option>
                                </select>
                            </div>

                            {/* Tarih Aralığı */}
                            <div className="filter-group-advanced">
                                <label><FiCalendar /> Tarih Aralığı</label>
                                <div className="date-inputs">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="filter-input-advanced"
                                        placeholder="Başlangıç"
                                    />
                                    <span>-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="filter-input-advanced"
                                        placeholder="Bitiş"
                                    />
                                </div>
                            </div>

                            {/* Fiyat Aralığı */}
                            <div className="filter-group-advanced">
                                <label><FiDollarSign /> Fiyat Aralığı</label>
                                <div className="price-inputs">
                                    <input
                                        type="number"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        className="filter-input-advanced"
                                        placeholder="Min"
                                    />
                                    <span>-</span>
                                    <input
                                        type="number"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        className="filter-input-advanced"
                                        placeholder="Max"
                                    />
                                </div>
                            </div>

                            {/* Sıralama */}
                            <div className="filter-group-advanced">
                                <label><FiMenu /> Sıralama</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="filter-input-advanced"
                                >
                                    <option value="newest">En Yeni</option>
                                    <option value="oldest">En Eski</option>
                                    <option value="price_desc">Fiyat (Azalan)</option>
                                    <option value="price_asc">Fiyat (Artan)</option>
                                </select>
                            </div>
                        </div>

                        <div className="advanced-search-footer">
                            <button
                                className="btn-reset-filters"
                                onClick={() => {
                                    setFilter('all');
                                    setDateRange({ start: '', end: '' });
                                    setPriceRange({ min: '', max: '' });
                                    setSortBy('newest');
                                    setSearchQuery('');
                                }}
                            >
                                <FiRefreshCw /> Filtreleri Temizle
                            </button>
                        </div>
                    </div>
                )}

                {/* Filtreler */}


                {/* Tablo Görünümü */}
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('orders.loading')}</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <FiPackage className="empty-icon" />
                        <h3>{t('orders.empty.title')}</h3>
                        <p>{t('orders.empty.message')}</p>
                        <Link to="/projects" className="btn btn-primary">
                            {t('orders.empty.explore')}
                        </Link>
                    </div>
                ) : (
                    <div className="table-responsive-orders">
                        <table className="orders-table-list">
                            <thead>
                                <tr>
                                    <th>{t('orders.table.order_no')}</th>
                                    <th>{t('orders.table.date')}</th>
                                    <th>{t('orders.table.items')}</th>
                                    <th>{t('orders.table.total')}</th>
                                    <th>{t('orders.table.status')}</th>
                                    <th className="text-center desktop-only">{t('orders.table.actions')}</th>
                                    <th className="mobile-only"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order, index) => {
                                    const isExpanded = expandedRows.has(order.id);
                                    return (
                                        <React.Fragment key={order.id}>
                                            <tr
                                                className={`order-row ${index % 2 === 0 ? 'odd' : 'even'} ${isExpanded ? 'expanded' : ''}`}
                                                onClick={() => {
                                                    // Mobil görünümde satıra tıklandığında aç/kapa
                                                    if (window.innerWidth <= 768) {
                                                        toggleRowExpansion(order.id);
                                                    }
                                                }}
                                            >
                                                <td className="order-number-cell">
                                                    <strong>#{order.order_number || order.id}</strong>
                                                </td>
                                                <td className="order-date-cell">
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td className="order-items-cell">
                                                    {order.items && order.items.length > 0 ? (
                                                        <div className="order-items-list">
                                                            {order.items.slice(0, 2).map((item, idx) => (
                                                                <span key={idx} className="order-item-name">
                                                                    {item.project_title || item.name || t('orders.unknown_item')}
                                                                    {idx < Math.min(order.items.length, 2) - 1 && ', '}
                                                                </span>
                                                            ))}
                                                            {order.items.length > 2 && (
                                                                <span className="order-item-more">
                                                                    +{order.items.length - 2} {t('orders.more_items')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span>{order.item_count || 0} {t('orders.items')}</span>
                                                    )}
                                                </td>
                                                <td className="order-total-cell">
                                                    <strong>{formatPrice(order.final_amount || order.total_amount || 0)}</strong>
                                                </td>
                                                <td className="order-status-cell">
                                                    {getStatusBadge(order.order_status, order.payment_status)}
                                                </td>
                                                <td className="order-actions-cell text-center desktop-only">
                                                    <Link
                                                        to={`/orders/${order.id}`}
                                                        className="btn-view-order"
                                                        title={t('orders.view_details')}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <FiEye /> {t('orders.view')}
                                                    </Link>
                                                    {order.payment_method === 'bank_transfer' && (order.payment_status === 'pending' || order.payment_status === 'pending_review') && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenPaymentModal(order);
                                                            }}
                                                            className="btn-pay-order"
                                                            title={t('orders.pay_now') || 'Ödeme Yap'}
                                                            style={{ marginLeft: '0.5rem', backgroundColor: '#10b981', color: 'white' }}
                                                        >
                                                            <FiCreditCard /> {t('orders.pay_now') || 'Ödeme Yap'}
                                                        </button>
                                                    )}
                                                    {/* Fatura butonu - sadece ödenmiş siparişler için */}
                                                    {order.payment_status === 'paid' && (
                                                        <button
                                                            onClick={(e) => handleDownloadInvoice(e, order.id)}
                                                            className="btn-download-invoice"
                                                            title={t('orders.download_invoice') || 'Fatura İndir'}
                                                        >
                                                            <FiDownload /> {t('orders.invoice') || 'Fatura'}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="order-expand-cell mobile-only">
                                                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                                </td>
                                            </tr>
                                            {/* Mobil görünümde açılan işlemler bölümü */}
                                            {isExpanded && (
                                                <tr className="order-actions-row-mobile">
                                                    <td colSpan="6" className="order-actions-mobile-content">
                                                        <div className="order-actions-mobile">
                                                            <Link
                                                                to={`/orders/${order.id}`}
                                                                className="btn-view-order-mobile"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedRows(new Set());
                                                                }}
                                                            >
                                                                <FiEye /> {t('orders.view_details')}
                                                            </Link>
                                                            {order.payment_method === 'bank_transfer' && (order.payment_status === 'pending' || order.payment_status === 'pending_review') && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenPaymentModal(order);
                                                                    }}
                                                                    className="btn-pay-order-mobile"
                                                                    style={{ backgroundColor: '#10b981', color: 'white' }}
                                                                >
                                                                    <FiCreditCard /> {t('orders.pay_now') || 'Ödeme Yap'}
                                                                </button>
                                                            )}
                                                            {/* Fatura butonu - sadece ödenmiş siparişler için */}
                                                            {order.payment_status === 'paid' && (
                                                                <button
                                                                    onClick={(e) => handleDownloadInvoice(e, order.id)}
                                                                    className="btn-download-invoice-mobile"
                                                                >
                                                                    <FiDownload /> {t('orders.download_invoice') || 'Fatura İndir'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Bank Transfer Payment Modal */}
                {showPaymentModal && selectedOrderForPayment && (
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
                                                    <li><strong>{t('checkout.description')}:</strong> {t('checkout.order_number')}: #{selectedOrderForPayment.order_number || selectedOrderForPayment.id}</li>
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

export default UserOrders;

