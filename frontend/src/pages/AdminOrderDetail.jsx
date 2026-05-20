import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiShoppingBag, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiClock,
    FiCheckCircle, FiXCircle, FiPackage, FiDollarSign, FiCreditCard,
    FiFileText, FiDownload, FiRefreshCw, FiArrowLeft, FiEdit, FiSave,
    FiAlertCircle, FiInfo, FiShoppingCart, FiTag
} from 'react-icons/fi';
import './AdminOrderDetail.css';

const AdminOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/orders/${id}`);
            const orderData = response.data.order;
            setOrder(orderData);
            setOrderStatus(orderData.order_status);
            setPaymentStatus(orderData.payment_status);
        } catch (error) {
            console.error('Order load error:', error);
            alert('Sipariş yüklenirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!orderStatus && !paymentStatus) {
            alert('En az bir durum seçmelisiniz');
            return;
        }

        try {
            setUpdating(true);
            await api.put(`/admin/orders/${id}/status`, {
                order_status: orderStatus || order.order_status,
                payment_status: paymentStatus || order.payment_status
            });
            setShowStatusModal(false);
            loadOrder();
            alert('Sipariş durumu başarıyla güncellendi!');
        } catch (error) {
            alert(error.response?.data?.error || 'Durum güncelleme başarısız');
        } finally {
            setUpdating(false);
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeClass = (status, type = 'order') => {
        const statusMap = {
            order: {
                pending: 'status-pending',
                processing: 'status-processing',
                completed: 'status-completed',
                cancelled: 'status-cancelled'
            },
            payment: {
                pending: 'status-pending',
                paid: 'status-paid',
                failed: 'status-failed',
                refunded: 'status-refunded'
            }
        };
        return statusMap[type]?.[status] || 'status-default';
    };

    const getStatusText = (status, type = 'order') => {
        const statusMap = {
            order: {
                pending: 'Beklemede',
                processing: 'İşleniyor',
                completed: 'Tamamlandı',
                cancelled: 'İptal Edildi'
            },
            payment: {
                pending: 'Beklemede',
                paid: 'Ödendi',
                failed: 'Başarısız',
                refunded: 'İade Edildi'
            }
        };
        return statusMap[type]?.[status] || status;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-order-detail-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!order) {
        return (
            <AdminLayout>
                <div className="admin-order-detail-page">
                    <div className="empty-state-minimal">
                        <FiAlertCircle className="empty-icon" />
                        <h3>Sipariş bulunamadı</h3>
                        <p>Bu sipariş mevcut değil veya silinmiş olabilir.</p>
                        <Link to="/admin/orders" className="btn-back">
                            <FiArrowLeft /> Siparişlere Dön
                        </Link>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-order-detail-page">
                {/* Header */}
                <div className="order-detail-header">
                    <div className="header-left">
                        <Link to="/admin/orders" className="btn-back-link">
                            <FiArrowLeft /> Siparişlere Dön
                        </Link>
                        <div className="order-title-section">
                            <h1 className="page-title-advanced">Sipariş Detayı</h1>
                            <p className="order-number-display">
                                <FiShoppingBag /> {order.order_number}
                            </p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadOrder}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button 
                            className="btn-edit-status"
                            onClick={() => setShowStatusModal(true)}
                        >
                            <FiEdit /> Durum Güncelle
                        </button>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="order-status-cards">
                    <div className={`status-card ${getStatusBadgeClass(order.order_status, 'order')}`}>
                        <div className="status-icon">
                            <FiPackage />
                        </div>
                        <div className="status-content">
                            <span className="status-label">Sipariş Durumu</span>
                            <span className="status-value">{getStatusText(order.order_status, 'order')}</span>
                        </div>
                    </div>
                    <div className={`status-card ${getStatusBadgeClass(order.payment_status, 'payment')}`}>
                        <div className="status-icon">
                            <FiCreditCard />
                        </div>
                        <div className="status-content">
                            <span className="status-label">Ödeme Durumu</span>
                            <span className="status-value">{getStatusText(order.payment_status, 'payment')}</span>
                        </div>
                    </div>
                    <div className="status-card status-info">
                        <div className="status-icon">
                            <FiCalendar />
                        </div>
                        <div className="status-content">
                            <span className="status-label">Sipariş Tarihi</span>
                            <span className="status-value">{formatDate(order.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="order-detail-grid">
                    {/* Sol Taraf - Sipariş Bilgileri */}
                    <div className="order-detail-left">
                        {/* Müşteri Bilgileri */}
                        <div className="detail-card">
                            <div className="card-header">
                                <FiUser className="card-icon" />
                                <h2>Müşteri Bilgileri</h2>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="info-label">Kullanıcı Adı:</span>
                                    <span className="info-value">{order.username || 'Misafir'}</span>
                                </div>
                                {order.email && (
                                    <div className="info-row">
                                        <span className="info-label"><FiMail /> E-posta:</span>
                                        <span className="info-value">{order.email}</span>
                                    </div>
                                )}
                                {order.phone && (
                                    <div className="info-row">
                                        <span className="info-label"><FiPhone /> Telefon:</span>
                                        <span className="info-value">{order.phone}</span>
                                    </div>
                                )}
                                {order.first_name || order.last_name ? (
                                    <div className="info-row">
                                        <span className="info-label">Ad Soyad:</span>
                                        <span className="info-value">
                                            {order.first_name} {order.last_name}
                                        </span>
                                    </div>
                                ) : null}
                                {order.billing_info && (
                                    <div className="billing-info-section">
                                        <h3 className="section-subtitle">Fatura Bilgileri</h3>
                                        {order.billing_info.name && (
                                            <div className="info-row">
                                                <span className="info-label">Ad:</span>
                                                <span className="info-value">{order.billing_info.name}</span>
                                            </div>
                                        )}
                                        {order.billing_info.email && (
                                            <div className="info-row">
                                                <span className="info-label">E-posta:</span>
                                                <span className="info-value">{order.billing_info.email}</span>
                                            </div>
                                        )}
                                        {order.billing_info.phone && (
                                            <div className="info-row">
                                                <span className="info-label">Telefon:</span>
                                                <span className="info-value">{order.billing_info.phone}</span>
                                            </div>
                                        )}
                                        {order.billing_info.address && (
                                            <div className="info-row">
                                                <span className="info-label"><FiMapPin /> Adres:</span>
                                                <span className="info-value">{order.billing_info.address}</span>
                                            </div>
                                        )}
                                        {order.billing_info.city && (
                                            <div className="info-row">
                                                <span className="info-label">Şehir:</span>
                                                <span className="info-value">{order.billing_info.city}</span>
                                            </div>
                                        )}
                                        {order.billing_info.country && (
                                            <div className="info-row">
                                                <span className="info-label">Ülke:</span>
                                                <span className="info-value">{order.billing_info.country}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sipariş Kalemleri */}
                        <div className="detail-card">
                            <div className="card-header">
                                <FiShoppingCart className="card-icon" />
                                <h2>Sipariş Kalemleri ({order.items?.length || 0})</h2>
                            </div>
                            <div className="card-body">
                                {order.items && order.items.length > 0 ? (
                                    <div className="order-items-list">
                                        {order.items.map((item, index) => (
                                            <div key={item.id || index} className="order-item-card">
                                                <div className="item-image">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.title} />
                                                    ) : (
                                                        <FiPackage />
                                                    )}
                                                </div>
                                                <div className="item-details">
                                                    <h3 className="item-title">{item.title}</h3>
                                                    <div className="item-meta">
                                                        <span className="item-price">
                                                            {formatCurrency(item.price, order.currency)}
                                                        </span>
                                                        <span className="item-quantity">
                                                            Adet: {item.quantity || 1}
                                                        </span>
                                                        <span className="item-subtotal">
                                                            Ara Toplam: {formatCurrency(item.subtotal, order.currency)}
                                                        </span>
                                                    </div>
                                                    {item.slug && (
                                                        <Link 
                                                            to={`/projects/${item.slug}`}
                                                            className="item-link"
                                                            target="_blank"
                                                        >
                                                            Projeyi Görüntüle <FiArrowLeft style={{ transform: 'rotate(180deg)' }} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state-small">
                                        <FiPackage />
                                        <p>Sipariş kalemi bulunamadı</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* İşlem Geçmişi */}
                        {order.transactions && order.transactions.length > 0 && (
                            <div className="detail-card">
                                <div className="card-header">
                                    <FiDollarSign className="card-icon" />
                                    <h2>İşlem Geçmişi</h2>
                                </div>
                                <div className="card-body">
                                    <div className="transactions-list">
                                        {order.transactions.map((transaction, index) => (
                                            <div key={transaction.id || index} className="transaction-item">
                                                <div className="transaction-info">
                                                    <span className="transaction-type">{transaction.type}</span>
                                                    <span className="transaction-amount">
                                                        {formatCurrency(transaction.amount, transaction.currency)}
                                                    </span>
                                                </div>
                                                <div className="transaction-meta">
                                                    <span className={`transaction-status ${transaction.status}`}>
                                                        {transaction.status === 'completed' ? 'Tamamlandı' :
                                                         transaction.status === 'pending' ? 'Beklemede' :
                                                         transaction.status === 'failed' ? 'Başarısız' : transaction.status}
                                                    </span>
                                                    <span className="transaction-date">
                                                        {formatDate(transaction.created_at)}
                                                    </span>
                                                </div>
                                                {transaction.description && (
                                                    <p className="transaction-description">{transaction.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sağ Taraf - Özet ve Faturalar */}
                    <div className="order-detail-right">
                        {/* Fiyat Özeti */}
                        <div className="detail-card summary-card">
                            <div className="card-header">
                                <FiDollarSign className="card-icon" />
                                <h2>Fiyat Özeti</h2>
                            </div>
                            <div className="card-body">
                                <div className="summary-row">
                                    <span className="summary-label">Ara Toplam:</span>
                                    <span className="summary-value">
                                        {formatCurrency(order.total_amount, order.currency)}
                                    </span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="summary-row discount">
                                        <span className="summary-label">
                                            <FiTag /> İndirim:
                                        </span>
                                        <span className="summary-value">
                                            -{formatCurrency(order.discount_amount, order.currency)}
                                        </span>
                                    </div>
                                )}
                                {order.coupon_code && (
                                    <div className="summary-row coupon">
                                        <span className="summary-label">Kupon Kodu:</span>
                                        <span className="summary-value">{order.coupon_code}</span>
                                    </div>
                                )}
                                <div className="summary-divider"></div>
                                
                                {/* Detaylı Hesaplamalar */}
                                {order.price_breakdown && (
                                    <>
                                        <div className="summary-row">
                                            <span className="summary-label">KDV Hariç Tutar:</span>
                                            <span className="summary-value">
                                                {formatCurrency(order.price_breakdown.amount_without_tax, order.currency)}
                                            </span>
                                        </div>
                                        <div className="summary-row tax">
                                            <span className="summary-label">
                                                KDV (%{order.price_breakdown.tax_rate}):
                                            </span>
                                            <span className="summary-value">
                                                +{formatCurrency(order.price_breakdown.tax_amount, order.currency)}
                                            </span>
                                        </div>
                                        <div className="summary-divider"></div>
                                        <div className="summary-row commission">
                                            <span className="summary-label">
                                                Yönetim Komisyonu (%{order.price_breakdown.commission_rate}):
                                            </span>
                                            <span className="summary-value">
                                                -{formatCurrency(order.price_breakdown.commission_amount, order.currency)}
                                            </span>
                                        </div>
                                        <div className="summary-row seller">
                                            <span className="summary-label">Satıcıya Kalan:</span>
                                            <span className="summary-value seller-amount">
                                                {formatCurrency(order.price_breakdown.seller_amount, order.currency)}
                                            </span>
                                        </div>
                                        <div className="summary-divider"></div>
                                    </>
                                )}
                                
                                <div className="summary-row total">
                                    <span className="summary-label">Toplam:</span>
                                    <span className="summary-value">
                                        {formatCurrency(order.final_amount, order.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Ödeme Bilgileri */}
                        <div className="detail-card">
                            <div className="card-header">
                                <FiCreditCard className="card-icon" />
                                <h2>Ödeme Bilgileri</h2>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="info-label">Ödeme Yöntemi:</span>
                                    <span className="info-value">
                                        {order.payment_method === 'credit_card' ? 'Kredi Kartı' :
                                         order.payment_method === 'paypal' ? 'PayPal' :
                                         order.payment_method === 'bank_transfer' ? 'Banka Havalesi' :
                                         order.payment_method || 'Belirtilmemiş'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Para Birimi:</span>
                                    <span className="info-value">{order.currency || 'TRY'}</span>
                                </div>
                                {order.coupon_code && (
                                    <div className="info-row">
                                        <span className="info-label">Kullanılan Kupon:</span>
                                        <span className="info-value coupon-code">{order.coupon_code}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Faturalar */}
                        {order.invoices && order.invoices.length > 0 && (
                            <div className="detail-card">
                                <div className="card-header">
                                    <FiFileText className="card-icon" />
                                    <h2>Faturalar ({order.invoices.length})</h2>
                                </div>
                                <div className="card-body">
                                    <div className="invoices-list">
                                        {order.invoices.map((invoice, index) => (
                                            <div key={invoice.id || index} className="invoice-item">
                                                <div className="invoice-header">
                                                    <span className="invoice-number">{invoice.invoice_number}</span>
                                                    <span className={`invoice-status ${invoice.status}`}>
                                                        {invoice.status === 'paid' ? 'Ödendi' :
                                                         invoice.status === 'sent' ? 'Gönderildi' :
                                                         invoice.status === 'draft' ? 'Taslak' :
                                                         invoice.status === 'overdue' ? 'Vadesi Geçti' :
                                                         invoice.status === 'cancelled' ? 'İptal' : invoice.status}
                                                    </span>
                                                </div>
                                                <div className="invoice-details">
                                                    <span className="invoice-amount">
                                                        {formatCurrency(invoice.total_amount, invoice.currency)}
                                                    </span>
                                                    <span className="invoice-date">
                                                        {formatDate(invoice.invoice_date)}
                                                    </span>
                                                </div>
                                                {invoice.pdf_path && (
                                                    <a 
                                                        href={invoice.pdf_path}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-download-invoice"
                                                    >
                                                        <FiDownload /> İndir
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sipariş Notları */}
                        <div className="detail-card">
                            <div className="card-header">
                                <FiInfo className="card-icon" />
                                <h2>Sipariş Bilgileri</h2>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="info-label">Sipariş ID:</span>
                                    <span className="info-value">#{order.id}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Oluşturulma:</span>
                                    <span className="info-value">{formatDate(order.created_at)}</span>
                                </div>
                                {order.updated_at && order.updated_at !== order.created_at && (
                                    <div className="info-row">
                                        <span className="info-label">Son Güncelleme:</span>
                                        <span className="info-value">{formatDate(order.updated_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Update Modal */}
                {showStatusModal && (
                    <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                        <div className="modal-content status-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Sipariş Durumu Güncelle</h2>
                                <button className="btn-icon" onClick={() => setShowStatusModal(false)}>
                                    <FiXCircle />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Sipariş Durumu</label>
                                    <select
                                        value={orderStatus}
                                        onChange={(e) => setOrderStatus(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="pending">Beklemede</option>
                                        <option value="processing">İşleniyor</option>
                                        <option value="completed">Tamamlandı</option>
                                        <option value="cancelled">İptal Edildi</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ödeme Durumu</label>
                                    <select
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="pending">Beklemede</option>
                                        <option value="paid">Ödendi</option>
                                        <option value="failed">Başarısız</option>
                                        <option value="refunded">İade Edildi</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => setShowStatusModal(false)}
                                >
                                    İptal
                                </button>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleStatusUpdate}
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <div className="spinner-small"></div>
                                    ) : (
                                        <>
                                            <FiSave /> Kaydet
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminOrderDetail;

