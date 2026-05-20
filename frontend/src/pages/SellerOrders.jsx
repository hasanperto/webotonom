import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SellerLayout from '../components/SellerLayout';
import { useLanguage } from '../context/LanguageContext';
import { sellerAPI } from '../api/seller';
import {
    FiPackage, FiCalendar, FiDollarSign, FiEye,
    FiCheckCircle, FiClock, FiXCircle, FiDownload,
    FiRefreshCw, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiXCircle as FiX
} from 'react-icons/fi';
import './SellerOrders.css';

const SellerOrders = () => {
    const { t, language } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, processing, completed, cancelled
    const [paymentFilter, setPaymentFilter] = useState('all'); // all, pending, paid, failed
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Gelişmiş Filtre State'leri
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price_asc, price_desc

    useEffect(() => {
        loadOrders();
    }, [language, filter, paymentFilter]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getOrders({ 
                lang: language,
                status: filter !== 'all' ? filter : undefined,
                payment_status: paymentFilter !== 'all' ? paymentFilter : undefined
            });
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Orders load error:', error);
            alert('Siparişler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (orderStatus, paymentStatus) => {
        const status = orderStatus || 'pending';
        const statusMap = {
            'pending': { label: 'Beklemede', icon: FiClock, color: '#f59e0b' },
            'processing': { label: 'İşlemde', icon: FiClock, color: '#3b82f6' },
            'completed': { label: 'Tamamlandı', icon: FiCheckCircle, color: '#10b981' },
            'cancelled': { label: 'İptal Edildi', icon: FiXCircle, color: '#ef4444' }
        };
        const statusInfo = statusMap[status] || statusMap['pending'];
        const Icon = statusInfo.icon;
        return (
            <span className="status-badge-table" style={{ backgroundColor: statusInfo.color }}>
                <Icon className="status-icon" />
                {statusInfo.label}
                {paymentStatus === 'paid' && status === 'pending' && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>(Ödendi)</span>
                )}
            </span>
        );
    };

    const getPaymentStatusBadge = (status) => {
        const statusMap = {
            'pending': { label: 'Beklemede', color: '#f59e0b' },
            'paid': { label: 'Ödendi', color: '#10b981' },
            'failed': { label: 'Başarısız', color: '#ef4444' },
            'refunded': { label: 'İade Edildi', color: '#6b7280' },
            'pending_review': { label: 'İnceleme Bekliyor', color: '#3b82f6' }
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
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR', {
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

    const filteredOrders = orders.filter(order => {
        // Tarih Aralığı Filtresi
        if (dateRange.start) {
            const orderDate = new Date(order.created_at);
            const startDate = new Date(dateRange.start);
            if (orderDate < startDate) return false;
        }
        if (dateRange.end) {
            const orderDate = new Date(order.created_at);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
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
            const customerName = (order.customer_name || '').toLowerCase();
            const totalAmount = (order.final_amount || order.total_amount || 0).toString().toLowerCase();
            const itemTitles = order.items?.map(item => (item.project_title || '').toLowerCase()).join(' ') || '';

            return orderNumber.includes(query) ||
                customerName.includes(query) ||
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
            <SellerLayout>
                <div className="seller-orders-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="seller-orders-page">
                {/* Başlık ve Yenile Butonu */}
                <div className="orders-header-section">
                    <div className="orders-header-title">
                        <strong>
                            <FiPackage className="header-icon" /> Siparişlerim
                        </strong>
                        <button
                            type="button"
                            className="btn-refresh-orders"
                            onClick={loadOrders}
                            title="Yenile"
                        >
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                {/* Arama ve Filtreler */}
                <div className="orders-search-section">
                    <div className="search-box-orders">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Sipariş no, müşteri veya proje ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input-orders"
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchQuery('')}
                                title="Temizle"
                            >
                                <FiXCircle />
                            </button>
                        )}
                    </div>
                    <button
                        className={`btn-advanced-search ${showAdvancedSearch ? 'active' : ''}`}
                        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                        title="Gelişmiş Arama"
                    >
                        <FiFilter /> Gelişmiş Arama
                    </button>
                </div>

                {/* Hızlı Filtreler */}
                <div className="quick-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Tümü
                    </button>
                    <button
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Beklemede
                    </button>
                    <button
                        className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
                        onClick={() => setFilter('processing')}
                    >
                        İşlemde
                    </button>
                    <button
                        className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Tamamlanan
                    </button>
                    <button
                        className={`filter-btn ${paymentFilter === 'paid' ? 'active' : ''}`}
                        onClick={() => setPaymentFilter(paymentFilter === 'paid' ? 'all' : 'paid')}
                    >
                        Ödenenler
                    </button>
                </div>

                {/* Gelişmiş Arama */}
                {showAdvancedSearch && (
                    <div className="advanced-search-panel">
                        <div className="advanced-search-grid">
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
                                <label><FiPackage /> Sıralama</label>
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
                                    setPaymentFilter('all');
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

                {/* Tablo Görünümü */}
                {!loading && (
                    <>
                        {filteredOrders.length === 0 && orders.length === 0 ? (
                            <div className="empty-state" style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                padding: '4rem 2rem',
                                textAlign: 'center',
                                background: '#fff',
                                borderRadius: '12px',
                                border: '2px dashed #e5e7eb',
                                margin: '2rem 0',
                                minHeight: '300px',
                                width: '100%',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <FiPackage style={{ fontSize: '4rem', color: '#6b7280', marginBottom: '1rem', opacity: 0.6 }} />
                                <h3 style={{ fontSize: '1.5rem', color: '#1a1a1a', marginBottom: '0.5rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Henüz sipariş yok</h3>
                                <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>Projeleriniz satıldığında burada görünecek</p>
                            </div>
                        ) : filteredOrders.length === 0 && orders.length > 0 ? (
                            <div className="empty-state" style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                padding: '4rem 2rem',
                                textAlign: 'center',
                                background: '#fff',
                                borderRadius: '12px',
                                border: '2px dashed #e5e7eb',
                                margin: '2rem 0',
                                minHeight: '300px',
                                width: '100%',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <FiSearch style={{ fontSize: '4rem', color: '#6b7280', marginBottom: '1rem', opacity: 0.6 }} />
                                <h3 style={{ fontSize: '1.5rem', color: '#1a1a1a', marginBottom: '0.5rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Filtreye uygun sipariş bulunamadı</h3>
                                <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>Filtreleri değiştirerek tekrar deneyin</p>
                            </div>
                        ) : filteredOrders.length > 0 ? (
                            <div className="table-responsive-orders">
                        <table className="orders-table-list">
                            <thead>
                                <tr>
                                    <th>Sipariş No</th>
                                    <th>Tarih</th>
                                    <th>Müşteri</th>
                                    <th>Ürünler</th>
                                    <th>Tutar</th>
                                    <th>Kazanç</th>
                                    <th>Durum</th>
                                    <th>Ödeme</th>
                                    <th className="text-center desktop-only">İşlemler</th>
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
                                                <td className="order-customer-cell">
                                                    {order.customer_name || 'Müşteri'}
                                                </td>
                                                <td className="order-items-cell">
                                                    {order.items && order.items.length > 0 ? (
                                                        <div className="order-items-list">
                                                            {order.items.slice(0, 2).map((item, idx) => (
                                                                <span key={idx} className="order-item-name">
                                                                    {item.project_title || 'Ürün'}
                                                                    {idx < Math.min(order.items.length, 2) - 1 && ', '}
                                                                </span>
                                                            ))}
                                                            {order.items.length > 2 && (
                                                                <span className="order-item-more">
                                                                    +{order.items.length - 2} daha
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span>{order.item_count || 0} ürün</span>
                                                    )}
                                                </td>
                                                <td className="order-total-cell">
                                                    <strong>{formatPrice(order.final_amount || order.total_amount || 0)}</strong>
                                                </td>
                                                <td className="order-earnings-cell">
                                                    <strong style={{ color: '#10b981' }}>
                                                        {formatPrice(order.seller_earnings || 0)}
                                                    </strong>
                                                </td>
                                                <td className="order-status-cell">
                                                    {getStatusBadge(order.order_status, order.payment_status)}
                                                </td>
                                                <td className="order-payment-cell">
                                                    {getPaymentStatusBadge(order.payment_status)}
                                                </td>
                                                <td className="order-actions-cell text-center desktop-only">
                                                    <Link
                                                        to={`/seller/sales/${order.id}`}
                                                        className="btn-view-order"
                                                        title="Detayları Gör"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <FiEye /> Detay
                                                    </Link>
                                                </td>
                                                <td className="order-expand-cell mobile-only">
                                                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                                </td>
                                            </tr>
                                            {/* Mobil görünümde açılan işlemler bölümü */}
                                            {isExpanded && (
                                                <tr className="order-actions-row-mobile">
                                                    <td colSpan="9" className="order-actions-mobile-content">
                                                        <div className="order-actions-mobile">
                                                            <Link
                                                                to={`/seller/sales/${order.id}`}
                                                                className="btn-view-order-mobile"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedRows(new Set());
                                                                }}
                                                            >
                                                                <FiEye /> Detayları Gör
                                                            </Link>
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
                        ) : null}
                    </>
                )}
            </div>
        </SellerLayout>
    );
};

export default SellerOrders;
