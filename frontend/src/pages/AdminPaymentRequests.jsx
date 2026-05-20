import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import {
    FiCheckCircle, FiXCircle, FiClock, FiCreditCard,
    FiMessageSquare, FiFileText, FiUser, FiSearch,
    FiFilter, FiDollarSign, FiCalendar, FiExternalLink,
    FiDownload, FiEye, FiMoreVertical
} from 'react-icons/fi';
import './AdminPaymentRequests.css';

const AdminPaymentRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, pending_approval, completed, rejected
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null); // For modal
    const [processingId, setProcessingId] = useState(null);
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

    // Advanced Filters State
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });
    const [selectedMethod, setSelectedMethod] = useState('all');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/payment-requests');
            console.log('Payment requests response:', response.data);
            console.log('Requests count:', response.data?.requests?.length || 0);
            setRequests(response.data.requests || []);
        } catch (error) {
            console.error('Load requests error:', error);
            console.error('Error response:', error.response?.data);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, note = null) => {
        if (!window.confirm(`Bu talebi ${status === 'completed' ? 'ONAYLAMAK' : 'REDDETMEK'} istediğinize emin misiniz?`)) {
            return;
        }

        try {
            setProcessingId(id);
            
            // Order bazlı bank transfer bildirimi ise farklı endpoint kullan
            const request = requests.find(r => r.id === id);
            if (request && request.source_type === 'bank_transfer_order') {
                // Bank transfer notification endpoint'i kullan
                const notificationId = id.replace('bt_', ''); // 'bt_' prefix'ini kaldır
                if (status === 'completed') {
                    await api.put(`/admin/bank-transfer-notifications/${notificationId}/approve`, {
                        admin_notes: note
                    });
                } else {
                    await api.put(`/admin/bank-transfer-notifications/${notificationId}/reject`, {
                        admin_notes: note
                    });
                }
            } else {
                // Normal payment request endpoint'i kullan
                await api.put(`/admin/payment-requests/${id}/status`, {
                    status,
                    note
                });
            }

            // Listeyi güncelle
            setRequests(prev => prev.map(req =>
                req.id === id ? { ...req, status: status === 'completed' ? 'approved' : (status === 'failed' ? 'rejected' : status) } : req
            ));

            // Modalı kapat
            setSelectedRequest(null);

            showToast(`İşlem başarıyla ${status === 'completed' ? 'onaylandı' : 'reddedildi'}.`, 'success');
            
            // Listeyi yenile
            loadRequests();
        } catch (error) {
            console.error('Update status error:', error);
            showToast('İşlem başarısız: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const statuses = {
            pending: { label: 'Beklemede', class: 'badge-pending', icon: FiClock },
            pending_approval: { label: 'Beklemede', class: 'badge-pending', icon: FiClock },
            pending_review: { label: 'Beklemede', class: 'badge-pending', icon: FiClock },
            processing: { label: 'İşleniyor', class: 'badge-info', icon: FiClock },
            completed: { label: 'Tamamlandı', class: 'badge-success', icon: FiCheckCircle },
            approved: { label: 'Tamamlandı', class: 'badge-success', icon: FiCheckCircle },
            failed: { label: 'Başarısız', class: 'badge-danger', icon: FiXCircle },
            rejected: { label: 'Reddedildi', class: 'badge-danger', icon: FiXCircle },
            cancelled: { label: 'İptal', class: 'badge-secondary', icon: FiXCircle }
        };
        const style = statuses[status] || statuses.pending;
        const Icon = style.icon;
        return (
            <span className={`status-badge ${style.class}`}>
                <Icon /> {style.label}
            </span>
        );
    };

    const filterRequests = () => {
        return requests.filter(req => {
            // Status and Search Filter
            const matchesStatus = filter === 'all'
                ? true
                : filter === 'pending_actions'
                    ? ['pending', 'pending_approval', 'pending_review'].includes(req.status)
                    : req.status === filter;

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || searchTerm.trim() === '' || 
                (req.reference_number?.toLowerCase().includes(searchLower)) ||
                (req.receipt_number?.toLowerCase().includes(searchLower)) ||
                (req.order_number?.toLowerCase().includes(searchLower)) ||
                (req.username?.toLowerCase().includes(searchLower)) ||
                (req.email?.toLowerCase().includes(searchLower)) ||
                (req.full_name?.toLowerCase().includes(searchLower)) ||
                (req.sender_name?.toLowerCase().includes(searchLower)) ||
                (req.total_amount?.toString().includes(searchLower));

            // Advanced Filters
            if (!matchesStatus || !matchesSearch) return false;

            // Date Range
            if (dateRange.start) {
                const reqDate = new Date(req.created_at);
                const startDate = new Date(dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                if (reqDate < startDate) return false;
            }
            if (dateRange.end) {
                const reqDate = new Date(req.created_at);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                if (reqDate > endDate) return false;
            }

            // Amount Range
            const amount = parseFloat(req.total_amount);
            if (amountRange.min && amount < parseFloat(amountRange.min)) return false;
            if (amountRange.max && amount > parseFloat(amountRange.max)) return false;

            // Payment Method
            if (selectedMethod !== 'all' && req.payment_method !== selectedMethod) return false;

            return true;
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const filteredRequests = filterRequests();

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">
                    <div className="spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-payments-page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Ödeme Talepleri</h1>
                        <p className="page-subtitle">Bakiye yükleme ve ödeme bildirimlerini yönetin</p>
                    </div>
                    <div className="header-stats">
                        <div className="stat-pill warning">
                            <span>Bekleyen:</span>
                            <strong>{requests.filter(r => ['pending', 'pending_approval', 'pending_review'].includes(r.status)).length}</strong>
                        </div>
                        <div className="stat-pill success">
                            <span>Toplam Tutar:</span>
                            <strong>{formatAmount(requests.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0))}</strong>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="filters-section">
                    <div className="search-bar-wrapper">
                        <div className="search-input-group">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Referans no, kullanıcı adı veya e-posta ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            className={`btn-filter-toggle ${showAdvancedFilters ? 'active' : ''}`}
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            <FiFilter /> Filtrele
                        </button>
                    </div>

                    {showAdvancedFilters && (
                        <div className="advanced-filters-panel">
                            <div className="filter-group">
                                <label>Tarih Aralığı</label>
                                <div className="date-range-inputs">
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                    <span className="range-separator">-</span>
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Tutar Aralığı</label>
                                <div className="amount-range-inputs">
                                    <input
                                        type="number"
                                        className="amount-input"
                                        placeholder="Min"
                                        value={amountRange.min}
                                        onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                                    />
                                    <span className="range-separator">-</span>
                                    <input
                                        type="number"
                                        className="amount-input"
                                        placeholder="Max"
                                        value={amountRange.max}
                                        onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Ödeme Yöntemi</label>
                                <select
                                    className="select-input"
                                    value={selectedMethod}
                                    onChange={(e) => setSelectedMethod(e.target.value)}
                                >
                                    <option value="all">Tümü</option>
                                    <option value="bank_transfer">Havale/EFT</option>
                                    <option value="card">Kredi Kartı</option>
                                    <option value="mobile">Mobil Ödeme</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="status-tabs">
                        <button
                            className={`status-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Tümü
                        </button>
                        <button
                            className={`status-tab ${filter === 'pending_actions' ? 'active' : ''}`}
                            onClick={() => setFilter('pending_actions')}
                        >
                            İşlem Bekleyenler
                        </button>
                        <button
                            className={`status-tab ${filter === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            Onaylananlar
                        </button>
                        <button
                            className={`status-tab ${filter === 'failed' ? 'active' : ''}`}
                            onClick={() => setFilter('failed')}
                        >
                            Reddedilenler
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {/* Table View */}
                {filteredRequests.length === 0 ? (
                    <div className="no-results">
                        <div className="no-results-icon">
                            <FiFilter />
                        </div>
                        <h3>Sonuç Bulunamadı</h3>
                        <p>
                            {requests.length === 0 
                                ? 'Henüz ödeme talebi bulunmuyor.' 
                                : 'Seçilen kriterlere uygun ödeme talebi bulunmuyor.'}
                        </p>
                        {requests.length > 0 && (
                            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                                <p>Toplam {requests.length} kayıt var. Filtreleri temizleyip tekrar deneyin.</p>
                                <button 
                                    onClick={() => {
                                        setFilter('all');
                                        setSearchTerm('');
                                        setDateRange({ start: '', end: '' });
                                        setAmountRange({ min: '', max: '' });
                                        setSelectedMethod('all');
                                    }}
                                    style={{ 
                                        marginTop: '0.5rem', 
                                        padding: '0.5rem 1rem', 
                                        backgroundColor: '#3b82f6', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Filtreleri Temizle
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Kullanıcı</th>
                                    <th>Tutar</th>
                                    <th>Ödeme Yöntemi</th>
                                    <th>Durum</th>
                                    <th>Tarih</th>
                                    <th style={{ textAlign: 'right' }}>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map(req => (
                                    <tr key={req.id}>
                                        <td data-label="Kullanıcı">
                                            <div className="user-cell">
                                                <div className="user-avatar-small">
                                                    <FiUser />
                                                </div>
                                                <div className="user-details">
                                                    <span className="user-name">{req.username}</span>
                                                    <span className="user-email-small">{req.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Tutar">
                                            <span className="amount-cell">{formatAmount(req.total_amount)}</span>
                                        </td>
                                        <td data-label="Ödeme Yöntemi">
                                            <span className="method-badge">
                                                {req.payment_method === 'bank_transfer' ? 'Havale/EFT' :
                                                    req.payment_method === 'mobile' ? 'Mobil Ödeme' : 'Kredi Kartı'}
                                            </span>
                                        </td>
                                        <td data-label="Durum">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td data-label="Tarih" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {formatDate(req.created_at)}
                                        </td>
                                        <td data-label="İşlemler">
                                            <div className="actions-cell">
                                                <button
                                                    className="btn-icon btn-view"
                                                    onClick={() => setSelectedRequest(req)}
                                                    title="Detayları Görüntüle"
                                                >
                                                    <FiEye />
                                                </button>

                                                {['pending', 'pending_approval', 'pending_review', 'processing'].includes(req.status) && (
                                                    <>
                                                        <button
                                                            className="btn-icon btn-reject-icon"
                                                            onClick={() => handleStatusUpdate(req.id, 'failed')}
                                                            disabled={processingId === req.id}
                                                            title="Reddet"
                                                        >
                                                            <FiXCircle />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-approve-icon"
                                                            onClick={() => handleStatusUpdate(req.id, 'completed')}
                                                            disabled={processingId === req.id}
                                                            title="Onayla"
                                                        >
                                                            <FiCheckCircle />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {selectedRequest && (
                    <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Ödeme Detayları</h2>
                                <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                                    <FiXCircle />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-section">
                                    <h3>İşlem Bilgileri</h3>
                                    {selectedRequest.order_number && (
                                        <div className="detail-row">
                                            <span>Sipariş No:</span>
                                            <span><strong>{selectedRequest.order_number}</strong></span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span>Durum:</span>
                                        {getStatusBadge(selectedRequest.status)}
                                    </div>
                                    <div className="detail-row">
                                        <span>Tutar:</span>
                                        <strong>{formatAmount(selectedRequest.total_amount)}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Ödeme Yöntemi:</span>
                                        <span className="method-badge">
                                            {selectedRequest.payment_method === 'bank_transfer' ? 'Havale/EFT' :
                                                selectedRequest.payment_method === 'mobile' ? 'Mobil Ödeme' : 'Kredi Kartı'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Kullanıcı:</span>
                                        <span>{selectedRequest.full_name || selectedRequest.username} ({selectedRequest.email})</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Tarih:</span>
                                        <span>{formatDate(selectedRequest.created_at)}</span>
                                    </div>
                                </div>

                                {(selectedRequest.bank_name || selectedRequest.sender_name) && (
                                    <div className="detail-section">
                                        <h3>Banka Bilgileri</h3>
                                        {selectedRequest.bank_name && (
                                            <div className="detail-row">
                                                <span>Banka:</span>
                                                <span><strong>{selectedRequest.bank_name}</strong></span>
                                            </div>
                                        )}
                                        {selectedRequest.sender_name && (
                                            <div className="detail-row">
                                                <span>Gönderen:</span>
                                                <span><strong>{selectedRequest.sender_name}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(selectedRequest.receipt_number || selectedRequest.reference_number) && (
                                    <div className="detail-section">
                                        <h3>Dekont Bilgileri</h3>
                                        {selectedRequest.receipt_number && (
                                            <div className="detail-row">
                                                <span>Dekont No:</span>
                                                <span><strong>{selectedRequest.receipt_number}</strong></span>
                                            </div>
                                        )}
                                        {selectedRequest.reference_number && (
                                            <div className="detail-row">
                                                <span>Referans No:</span>
                                                <span><strong>{selectedRequest.reference_number}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(selectedRequest.receipt_image || selectedRequest.receipt_file) && (
                                    <div className="detail-section">
                                        <h3>Dekont Görseli</h3>
                                        <div className="receipt-preview">
                                            <img
                                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedRequest.receipt_file || `/uploads/${selectedRequest.receipt_image}`}`}
                                                alt="Dekont"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Resim+Yüklenemedi' }}
                                                style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }}
                                            />
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedRequest.receipt_file || `/uploads/${selectedRequest.receipt_image}`}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-download"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <FiDownload /> İndir / Görüntüle
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {(selectedRequest.notes || selectedRequest.user_note) && (
                                    <div className="detail-section">
                                        <h3>Ek Notlar</h3>
                                        <div className="notes-content">
                                            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                                {selectedRequest.notes || selectedRequest.user_note || '-'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedRequest.admin_notes && (
                                    <div className="detail-section">
                                        <h3>Admin Notları</h3>
                                        <div className="notes-content">
                                            <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#64748b' }}>
                                                {selectedRequest.admin_notes}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {['pending', 'pending_approval', 'pending_review'].includes(selectedRequest.status) && (
                                    <div className="modal-actions">
                                        <button
                                            className="btn-reject large"
                                            onClick={() => handleStatusUpdate(selectedRequest.id, selectedRequest.source_type === 'bank_transfer_order' ? 'rejected' : 'failed')}
                                        >
                                            Reddet
                                        </button>
                                        <button
                                            className="btn-approve large"
                                            onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                                        >
                                            {selectedRequest.source_type === 'bank_transfer_order' ? 'Onayla ve Siparişi Güncelle' : 'Onayla ve Bakiyeyi Yükle'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Toast Notification */}
                {toast && (
                    <div className={`toast-notification ${toast.type}`}>
                        {toast.type === 'success' ? <FiCheckCircle /> : <FiXCircle />}
                        <span>{toast.message}</span>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminPaymentRequests;
