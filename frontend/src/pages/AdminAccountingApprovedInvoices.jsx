import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiCheckCircle, FiSearch, FiRefreshCw, FiEye, FiDownload, FiCalendar
} from 'react-icons/fi';
import './AdminAccountingApprovedInvoices.css';

const AdminAccountingApprovedInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadInvoices();
    }, [statusFilter]);

    const loadInvoices = async () => {
        try {
            const response = await api.get('/admin/accounting/approved-invoices', {
                params: { status: statusFilter }
            });
            setInvoices(response.data.invoices || []);
        } catch (error) {
            console.error('Approved invoices load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(invoice => 
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount, currency = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-accounting-approved-invoices-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-accounting-approved-invoices-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Onaylanan Faturalar</h1>
                        <p className="page-subtitle-advanced">Onaylanmış faturaları görüntüleyin ve yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadInvoices}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <div className="invoice-filters-minimal">
                    <div className="search-box-minimal">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Fatura numarası veya kullanıcı adı ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="status-filter-minimal"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="paid">Ödendi</option>
                        <option value="overdue">Vadesi Geçmiş</option>
                        <option value="sent">Gönderildi</option>
                    </select>
                </div>

                <div className="invoices-list-minimal">
                    {filteredInvoices.length === 0 ? (
                        <div className="empty-state-minimal">
                            <FiCheckCircle className="empty-icon" />
                            <h3>Onaylanan fatura bulunamadı</h3>
                            <p>Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
                        </div>
                    ) : (
                        filteredInvoices.map(invoice => (
                            <div key={invoice.id} className="invoice-card-minimal">
                                <div className="invoice-info-section">
                                    <div className="invoice-number-minimal">
                                        <h3>{invoice.invoice_number}</h3>
                                        <p className="invoice-user">{invoice.username || 'Kullanıcı'}</p>
                                    </div>
                                    <div className="invoice-details-minimal">
                                        <div className="invoice-amount">
                                            <span className="amount-label">Tutar:</span>
                                            <span className="amount-value">{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                                        </div>
                                        <div className="invoice-meta-minimal">
                                            <span className={`invoice-status-badge ${invoice.status}`}>
                                                {invoice.status === 'paid' ? 'Ödendi' : 
                                                 invoice.status === 'overdue' ? 'Vadesi Geçmiş' :
                                                 invoice.status === 'sent' ? 'Gönderildi' : invoice.status}
                                            </span>
                                            <span className="meta-item">
                                                <FiCalendar /> {formatDate(invoice.invoice_date)}
                                            </span>
                                            {invoice.order_id && (
                                                <span className="meta-item">
                                                    Sipariş: #{invoice.order_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="invoice-actions-minimal">
                                    <button 
                                        className="btn-view-minimal"
                                        onClick={() => window.open(`/admin/accounting/invoices/${invoice.id}`, '_blank')}
                                    >
                                        <FiEye /> Görüntüle
                                    </button>
                                    {invoice.pdf_path && (
                                        <button 
                                            className="btn-download-minimal"
                                            onClick={() => window.open(invoice.pdf_path, '_blank')}
                                        >
                                            <FiDownload /> İndir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAccountingApprovedInvoices;

