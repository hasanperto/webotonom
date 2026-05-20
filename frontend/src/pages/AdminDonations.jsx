import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import {
    FiGift, FiSearch, FiFilter, FiCheckCircle, FiClock,
    FiUser, FiCalendar, FiDollarSign, FiEye, FiXCircle,
    FiMoreVertical, FiCreditCard, FiX
} from 'react-icons/fi';
import './AdminDonations.css';

const AdminDonations = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, completed
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [adminNote, setAdminNote] = useState('');

    // Advanced Filters State
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        loadDonations();
    }, []);

    useEffect(() => {
        if (selectedDonation) {
            setAdminNote(selectedDonation.admin_note || '');
        } else {
            setAdminNote('');
        }
    }, [selectedDonation]);

    const loadDonations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/donations');
            setDonations(response.data.donations || []);
        } catch (error) {
            console.error('Donations load error:', error);
            showToast('Bağışlar yüklenirken bir hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (donationId) => {
        if (!window.confirm('Bu bağışı onaylamak istediğinize emin misiniz?')) return;

        try {
            await api.post(`/donations/admin/${donationId}/approve`, { admin_note: adminNote });

            // Update local state
            setDonations(prev => prev.map(d =>
                d.id === donationId ? { ...d, status: 'completed' } : d
            ));

            if (selectedDonation && selectedDonation.id === donationId) {
                setSelectedDonation(prev => ({ ...prev, status: 'completed', admin_note: adminNote }));
            }

            showToast('Bağış başarıyla onaylandı', 'success');
        } catch (error) {
            console.error('Approve donation error:', error);
            showToast('İşlem başarısız: ' + (error.response?.data?.error || error.message), 'error');
        }

    };

    const handleReject = async (donationId) => {
        if (!window.confirm('Bu bağışı reddetmek/iptal etmek istediğinize emin misiniz?')) return;

        try {
            await api.post(`/donations/admin/${donationId}/reject`, { admin_note: adminNote });

            // Update local state
            setDonations(prev => prev.map(d =>
                d.id === donationId ? { ...d, status: 'cancelled' } : d
            ));

            if (selectedDonation && selectedDonation.id === donationId) {
                setSelectedDonation(prev => ({ ...prev, status: 'cancelled', admin_note: adminNote }));
            }

            showToast('Bağış reddedildi/iptal edildi', 'success');
        } catch (error) {
            console.error('Reject donation error:', error);
            showToast('İşlem başarısız: ' + (error.response?.data?.error || error.message), 'error');
        }
    };

    const handleSaveNote = async () => {
        if (!selectedDonation) return;
        try {
            await api.put(`/donations/admin/${selectedDonation.id}/note`, { admin_note: adminNote });

            setDonations(prev => prev.map(d =>
                d.id === selectedDonation.id ? { ...d, admin_note: adminNote } : d
            ));

            setSelectedDonation(prev => ({ ...prev, admin_note: adminNote }));
            showToast('Admin notu kaydedildi', 'success');
        } catch (error) {
            console.error('Save note error:', error);
            showToast('Not kaydedilemedi', 'error');
        }
    };

    const filterDonations = () => {
        return donations.filter(donation => {
            // Status Filter
            const matchesStatus = filter === 'all'
                ? true
                : filter === 'pending'
                    ? ['pending', 'pending_approval'].includes(donation.status)
                    : donation.status === filter;

            // Search Filter
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (donation.transaction_id?.toLowerCase().includes(searchLower)) ||
                (donation.username?.toLowerCase().includes(searchLower)) ||
                (donation.project_title?.toLowerCase().includes(searchLower));

            if (!matchesStatus || !matchesSearch) return false;

            // Date Range
            if (dateRange.start) {
                const itemDate = new Date(donation.created_at);
                const startDate = new Date(dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                if (itemDate < startDate) return false;
            }
            if (dateRange.end) {
                const itemDate = new Date(donation.created_at);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                if (itemDate > endDate) return false;
            }

            // Amount Range
            const amount = parseFloat(donation.amount);
            if (amountRange.min && amount < parseFloat(amountRange.min)) return false;
            if (amountRange.max && amount > parseFloat(amountRange.max)) return false;

            return true;
        });
    };

    const filteredDonations = filterDonations();

    // Calculate Totals
    const totalDonationAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const pendingDonationAmount = donations
        .filter(d => ['pending', 'pending_approval'].includes(d.status))
        .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const formatCurrency = (amount, currency = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="status-badge badge-success"><FiCheckCircle /> Onaylandı</span>;
            case 'pending':
            case 'pending_approval':
                return <span className="status-badge badge-warning"><FiClock /> Bekliyor</span>;
            case 'failed':
            case 'rejected':
            case 'cancelled':
                return <span className="status-badge badge-danger"><FiXCircle /> Reddedildi</span>;
            default:
                return <span className="status-badge badge-neutral">{status}</span>;
        }
    };

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
            <div className="admin-donations-page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Bağış Yönetimi</h1>
                        <p className="page-subtitle">Proje bağışlarını izleyin ve onaylayın</p>
                    </div>
                    <div className="header-stats">
                        <div className="header-stat-card">
                            <span className="stat-label">Toplam Bağış</span>
                            <span className="stat-value">{donations.length}</span>
                            <span className="stat-subvalue" style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>
                                {formatCurrency(totalDonationAmount)}
                            </span>
                        </div>
                        <div className="header-stat-card highlight">
                            <span className="stat-label">Onay Bekleyen</span>
                            <span className="stat-value">
                                {donations.filter(d => ['pending', 'pending_approval'].includes(d.status)).length}
                            </span>
                            <span className="stat-subvalue" style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '4px' }}>
                                {formatCurrency(pendingDonationAmount)}
                            </span>
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
                                placeholder="Proje, bağışçı veya işlem no ara..."
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
                            className={`status-tab ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Onay Bekleyenler
                        </button>
                        <button
                            className={`status-tab ${filter === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            Onaylananlar
                        </button>
                    </div>
                </div>

                {/* Table View */}
                {filteredDonations.length === 0 ? (
                    <div className="no-results">
                        <div className="no-results-icon">
                            <FiFilter />
                        </div>
                        <h3>Sonuç Bulunamadı</h3>
                        <p>Seçilen kriterlere uygun bağış bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Bağışçı</th>
                                    <th>Proje</th>
                                    <th>Tutar</th>
                                    <th>Ödeme Yöntemi</th>
                                    <th>Durum</th>
                                    <th>Tarih</th>
                                    <th style={{ textAlign: 'right' }}>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDonations.map(donation => (
                                    <tr key={donation.id}>
                                        <td data-label="Bağışçı">
                                            <div className="user-cell">
                                                <div className="user-avatar-small">
                                                    <FiUser />
                                                </div>
                                                <div className="user-details">
                                                    <span className="user-name">
                                                        {donation.is_anonymous ? 'Anonim Bağışçı' : (donation.username || 'Misafir')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Proje">
                                            <div className="project-cell">
                                                <span className="project-title-small">{donation.project_title}</span>
                                            </div>
                                        </td>
                                        <td data-label="Tutar">
                                            <span className="amount-cell">{formatCurrency(donation.amount, donation.currency)}</span>
                                        </td>
                                        <td data-label="Ödeme Yöntemi">
                                            <span className="method-badge">
                                                {donation.payment_method || 'Diğer'}
                                            </span>
                                        </td>
                                        <td data-label="Durum">
                                            {getStatusBadge(donation.status)}
                                        </td>
                                        <td data-label="Tarih" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {formatDate(donation.created_at)}
                                        </td>
                                        <td data-label="İşlemler">
                                            <div className="actions-cell">
                                                {['pending', 'pending_approval'].includes(donation.status) && (
                                                    <>
                                                        <button
                                                            className="btn-icon btn-reject-icon"
                                                            onClick={() => handleReject(donation.id)}
                                                            title="Reddet"
                                                        >
                                                            <FiXCircle />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-approve-icon"
                                                            onClick={() => handleApprove(donation.id)}
                                                            title="Onayla"
                                                        >
                                                            <FiCheckCircle />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="btn-icon btn-view"
                                                    onClick={() => setSelectedDonation(donation)}
                                                    title="Detaylar"
                                                >
                                                    <FiEye />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Donation Detail Modal */}
                {selectedDonation && (
                    <div className="modal-overlay" onClick={() => setSelectedDonation(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Bağış Detayları</h2>
                                <button className="close-btn" onClick={() => setSelectedDonation(null)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-section">
                                    <h3>Bağış Bilgileri</h3>
                                    <div className="detail-row">
                                        <span>Durum</span>
                                        {getStatusBadge(selectedDonation.status)}
                                    </div>
                                    <div className="detail-row">
                                        <span>Tutar</span>
                                        <span className="amount-cell">{formatCurrency(selectedDonation.amount, selectedDonation.currency)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Proje</span>
                                        <a
                                            href={`/projects/${selectedDonation.project_slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}
                                        >
                                            {selectedDonation.project_title} <FiEye style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                                        </a>
                                    </div>
                                    <div className="detail-row">
                                        <span>Tarih</span>
                                        <strong>{formatDate(selectedDonation.created_at)}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>İşlem ID</span>
                                        <span style={{ fontFamily: 'monospace' }}>{selectedDonation.transaction_id || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Ödeme Yöntemi</span>
                                        <strong>{selectedDonation.payment_method || 'Diğer'}</strong>
                                    </div>
                                    {selectedDonation.coupon && (
                                        <div className="detail-row" style={{ background: '#f0fdf4', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem', border: '1px dashed #16a34a' }}>
                                            <span style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiGift /> İndirim Kodu
                                            </span>
                                            <div style={{ textAlign: 'right' }}>
                                                <strong style={{ display: 'block', color: '#15803d', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                                                    {selectedDonation.coupon.code}
                                                </strong>
                                                <span style={{ fontSize: '0.8rem', color: '#166534' }}>
                                                    %{selectedDonation.coupon.discount_value} İndirim
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="detail-section">
                                    <h3>Bağışçı Bilgileri</h3>
                                    <div className="detail-row">
                                        <span>Bağış Tipi</span>
                                        <strong>{selectedDonation.is_anonymous ? 'Anonim Bağış' : 'Kayıtlı Kullanıcı'}</strong>
                                    </div>
                                    {!selectedDonation.is_anonymous && (
                                        <>
                                            <div className="detail-row">
                                                <span>Kullanıcı Adı</span>
                                                <strong>{selectedDonation.username}</strong>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {selectedDonation.message && (
                                    <div className="detail-section">
                                        <h3>Bağış Mesajı</h3>
                                        <div className="receipt-preview" style={{ textAlign: 'left', fontStyle: 'italic', color: '#475569' }}>
                                            "{selectedDonation.message}"
                                        </div>
                                    </div>
                                )}

                                <div className="detail-section">
                                    <h3>Admin Notu</h3>
                                    <textarea
                                        className="admin-note-input"
                                        placeholder="Bu bağış için bir not ekleyin..."
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        rows={3}
                                    />
                                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                        <button
                                            className="btn-save-note"
                                            onClick={handleSaveNote}
                                            disabled={adminNote === (selectedDonation.admin_note || '')}
                                        >
                                            Notu Kaydet
                                        </button>
                                    </div>
                                </div>

                                {['pending', 'pending_approval'].includes(selectedDonation.status) && (
                                    <div className="modal-actions">
                                        <button
                                            className="btn-reject large"
                                            onClick={() => handleReject(selectedDonation.id)}
                                        >
                                            <FiXCircle /> Reddet
                                        </button>
                                        <button
                                            className="btn-approve large"
                                            onClick={() => handleApprove(selectedDonation.id)}
                                        >
                                            <FiCheckCircle /> Bağışı Onayla
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

export default AdminDonations;
