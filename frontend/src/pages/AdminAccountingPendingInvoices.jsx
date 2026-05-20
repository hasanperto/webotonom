import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiClock, FiSearch, FiRefreshCw, FiCheckCircle, FiXCircle, FiEye, FiDownload,
    FiPackage, FiFileText, FiShoppingCart
} from 'react-icons/fi';
import './AdminAccountingPendingInvoices.css';

const AdminAccountingPendingInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/accounting/pending-invoices');
            setInvoices(response.data.invoices || []);
        } catch (error) {
            console.error('Pending invoices load error:', error);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (invoice) => {
        if (confirm('Bu faturayı onaylamak istediğinize emin misiniz?')) {
            try {
                if (invoice.source_type === 'order') {
                    // Siparişten fatura oluştur
                    await api.post('/admin/accounting/invoices/create-from-order', { order_id: invoice.order_id || invoice.id });
                } else {
                    // Mevcut faturayı onayla
                    await api.put(`/admin/accounting/invoices/${invoice.id}/approve`);
                }
                loadInvoices();
            } catch (error) {
                alert(error.response?.data?.error || 'Onay işlemi başarısız');
            }
        }
    };

    const handleReject = async (invoice) => {
        if (confirm('Bu faturayı reddetmek istediğinize emin misiniz?')) {
            try {
                if (invoice.source_type === 'order') {
                    // Sipariş için fatura oluşturma, sadece reddet
                    alert('Sipariş faturaları reddedilemez. Siparişi iptal etmek için sipariş yönetim sayfasını kullanın.');
                    return;
                } else {
                    await api.put(`/admin/accounting/invoices/${invoice.id}/reject`);
                }
                loadInvoices();
            } catch (error) {
                alert(error.response?.data?.error || 'Red işlemi başarısız');
            }
        }
    };

    const handleCreateInvoice = async (order) => {
        if (confirm('Bu sipariş için fatura oluşturmak istediğinize emin misiniz?')) {
            try {
                // order_id'yi belirle: source_type === 'order' ise order_id veya id kullan
                let orderId = null;
                
                if (order.source_type === 'order') {
                    // Sipariş kaydı için: order_id veya id kullan
                    orderId = order.order_id || order.id;
                } else {
                    // Fatura kaydı için: order_id kullan
                    orderId = order.order_id;
                }
                
                if (!orderId) {
                    alert('Sipariş ID bulunamadı!');
                    console.error('Order object:', order);
                    return;
                }
                
                console.log('Creating invoice for order_id:', orderId);
                await api.post('/admin/accounting/invoices/create-from-order', { order_id: orderId });
                loadInvoices();
                alert('Fatura başarıyla oluşturuldu!');
            } catch (error) {
                console.error('Create invoice error:', error);
                const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Fatura oluşturma başarısız';
                alert(errorMessage);
            }
        }
    };

    const filteredInvoices = invoices.filter(invoice => 
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.project_titles?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    // İstatistikler
    const stats = {
        total: invoices.length,
        invoices: invoices.filter(i => i.source_type === 'invoice').length,
        orders: invoices.filter(i => i.source_type === 'order').length
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-accounting-pending-invoices-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-accounting-pending-invoices-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Bekleyen Faturalar</h1>
                        <p className="page-subtitle-advanced">Onay bekleyen faturaları ve fatura oluşturulmamış siparişleri görüntüleyin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadInvoices}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                {/* İstatistikler */}
                <div className="invoices-stats-summary">
                    <div className="stat-card-invoice">
                        <div className="stat-icon-invoice total">
                            <FiFileText />
                        </div>
                        <div className="stat-content-invoice">
                            <span className="stat-label-invoice">Toplam</span>
                            <span className="stat-value-invoice">{stats.total}</span>
                        </div>
                    </div>
                    <div className="stat-card-invoice">
                        <div className="stat-icon-invoice invoice">
                            <FiFileText />
                        </div>
                        <div className="stat-content-invoice">
                            <span className="stat-label-invoice">Faturalar</span>
                            <span className="stat-value-invoice">{stats.invoices}</span>
                        </div>
                    </div>
                    <div className="stat-card-invoice">
                        <div className="stat-icon-invoice order">
                            <FiShoppingCart />
                        </div>
                        <div className="stat-content-invoice">
                            <span className="stat-label-invoice">Siparişler</span>
                            <span className="stat-value-invoice">{stats.orders}</span>
                        </div>
                    </div>
                </div>

                <div className="search-box-minimal">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Fatura numarası, sipariş numarası, kullanıcı adı veya proje adı ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="invoices-list-advanced">
                    {filteredInvoices.length === 0 ? (
                        <div className="empty-state-minimal">
                            <FiClock className="empty-icon" />
                            <h3>Bekleyen fatura bulunamadı</h3>
                            <p>Tüm faturalar onaylanmış veya reddedilmiş. Fatura oluşturulmamış sipariş bulunmuyor.</p>
                        </div>
                    ) : (
                        filteredInvoices.map(invoice => {
                            const isOrder = invoice.source_type === 'order';
                            
                            return (
                                <div 
                                    key={invoice.id} 
                                    className={`invoice-card-advanced ${isOrder ? 'invoice-card-order' : 'invoice-card-invoice'}`}
                                >
                                    <div className="invoice-info-section-advanced">
                                        <div className={`invoice-type-badge ${isOrder ? 'badge-order' : 'badge-invoice'}`}>
                                            {isOrder ? <FiShoppingCart /> : <FiFileText />}
                                            <span>{isOrder ? 'Sipariş' : 'Fatura'}</span>
                                        </div>
                                        <div className="invoice-number-advanced">
                                            <h3>{invoice.invoice_number || invoice.order_number || `#${invoice.id}`}</h3>
                                            <p className="invoice-user-advanced">
                                                <FiPackage /> {invoice.username || 'Kullanıcı'}
                                            </p>
                                        </div>
                                        <div className="invoice-details-advanced">
                                            <div className="invoice-amount-advanced">
                                                <span className="amount-label-advanced">Tutar:</span>
                                                <span className="amount-value-advanced">
                                                    {formatCurrency(invoice.total_amount, invoice.currency)}
                                                </span>
                                            </div>
                                            <div className="invoice-meta-advanced">
                                                <span className="meta-item-advanced">
                                                    <FiClock /> {formatDate(invoice.invoice_date || invoice.created_at)}
                                                </span>
                                                {invoice.order_number && (
                                                    <span className="meta-item-advanced">
                                                        <FiShoppingCart /> Sipariş: {invoice.order_number}
                                                    </span>
                                                )}
                                                {invoice.item_count && (
                                                    <span className="meta-item-advanced">
                                                        Ürün: {invoice.item_count} adet
                                                    </span>
                                                )}
                                            </div>
                                            {invoice.project_titles && (
                                                <div className="invoice-projects-advanced">
                                                    <span className="projects-label">Projeler:</span>
                                                    <span className="projects-value">{invoice.project_titles}</span>
                                                </div>
                                            )}
                                            {invoice.payment_status && (
                                                <div className="invoice-status-badge-advanced">
                                                    <span className={`status-badge payment-${invoice.payment_status}`}>
                                                        Ödeme: {invoice.payment_status === 'paid' ? 'Ödendi' : 'Beklemede'}
                                                    </span>
                                                    {invoice.order_status && (
                                                        <span className={`status-badge order-${invoice.order_status}`}>
                                                            Durum: {
                                                                invoice.order_status === 'completed' ? 'Tamamlandı' :
                                                                invoice.order_status === 'processing' ? 'İşleniyor' :
                                                                invoice.order_status === 'pending' ? 'Beklemede' :
                                                                invoice.order_status === 'cancelled' ? 'İptal' : invoice.order_status
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="invoice-actions-advanced">
                                        {isOrder ? (
                                            <>
                                                <button 
                                                    className="btn-create-invoice"
                                                    onClick={() => handleCreateInvoice(invoice)}
                                                    title="Fatura Oluştur"
                                                >
                                                    <FiFileText /> Fatura Oluştur
                                                </button>
                                                <button 
                                                    className="btn-view-order"
                                                    onClick={() => window.open(`/admin/orders/${invoice.order_id || invoice.id}`, '_blank')}
                                                    title="Siparişi Görüntüle"
                                                >
                                                    <FiEye /> Sipariş
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    className="btn-view-invoice"
                                                    onClick={() => window.open(`/admin/accounting/invoices/${invoice.id}`, '_blank')}
                                                    title="Faturayı Görüntüle"
                                                >
                                                    <FiEye /> Görüntüle
                                                </button>
                                                <button 
                                                    className="btn-approve-invoice"
                                                    onClick={() => handleApprove(invoice)}
                                                    title="Faturayı Onayla"
                                                >
                                                    <FiCheckCircle /> Onayla
                                                </button>
                                                <button 
                                                    className="btn-reject-invoice"
                                                    onClick={() => handleReject(invoice)}
                                                    title="Faturayı Reddet"
                                                >
                                                    <FiXCircle /> Reddet
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAccountingPendingInvoices;
