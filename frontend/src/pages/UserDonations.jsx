import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { donationsAPI } from '../api/donations';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiGift, FiCalendar, FiDollarSign, FiEye, FiTrendingUp, FiHeart, FiSearch, FiFilter, FiTag, FiFileText, FiX, FiSave, FiCheck, FiCopy } from 'react-icons/fi';
import './UserDonations.css';

const UserDonations = () => {
    const { isAuthenticated } = useAuth();
    const { t, language } = useLanguage();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Advanced Filters State
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });

    // Modal State
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMessage, setEditMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [totalDonated, setTotalDonated] = useState(0);
    const [donationCount, setDonationCount] = useState(0);

    useEffect(() => {
        if (isAuthenticated) {
            loadDonations();
        }
    }, [isAuthenticated, language]);

    const loadDonations = async () => {
        try {
            setLoading(true);
            const response = await donationsAPI.getMyDonations();
            const donationsData = response.data.donations || [];
            setDonations(donationsData);

            // İstatistikleri hesapla
            const total = donationsData.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
            setTotalDonated(total);
            setDonationCount(donationsData.length);
        } catch (error) {
            console.error('Donations load error:', error);
            setDonations([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price);
    };

    // Filtreleme ve arama
    const filteredDonations = donations.filter(donation => {
        // Durum filtresi
        if (filterStatus !== 'all') {
            if (filterStatus === 'completed' && donation.status !== 'completed') return false;
            if (filterStatus === 'pending' && !['pending', 'pending_approval'].includes(donation.status)) return false;
            if (filterStatus === 'failed' && !['failed', 'rejected', 'cancelled'].includes(donation.status)) return false;
        }

        // Arama filtresi
        const query = searchQuery.toLowerCase();
        const projectTitle = (donation.project_title || '').toLowerCase();
        const message = (donation.message || '').toLowerCase();
        const transactionId = (donation.transaction_id || '').toLowerCase();

        if (searchQuery && !projectTitle.includes(query) && !message.includes(query) && !transactionId.includes(query)) {
            return false;
        }

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
        if (amountRange.min || amountRange.max) {
            const amount = parseFloat(donation.amount);
            if (amountRange.min && amount < parseFloat(amountRange.min)) return false;
            if (amountRange.max && amount > parseFloat(amountRange.max)) return false;
        }

        return true;
    });

    if (!isAuthenticated) {
        return (
            <UserLayout>
                <div className="user-donations-page">
                    <div className="auth-required">
                        <FiGift className="auth-icon" />
                        <h2>{t('donations.auth.required')}</h2>
                        <p>{t('donations.auth.description')}</p>
                        <Link to="/login" className="btn btn-primary">
                            {t('donations.auth.login')}
                        </Link>
                    </div>
                </div>
            </UserLayout>
        );
    }

    const getStatusUI = (status) => {
        switch (status) {
            case 'completed':
                return { label: t('donations.status.completed') || 'Onaylandı', className: 'badge-success' };
            case 'pending':
            case 'pending_approval':
                return { label: t('donations.status.pending') || 'Bekliyor', className: 'badge-warning' };
            case 'failed':
            case 'rejected':
            case 'cancelled':
                return { label: t('donations.status.failed') || 'Başarısız', className: 'badge-danger' };
            case 'passive':
                return { label: 'Pasif', className: 'badge-neutral' };
            default:
                return { label: status || '-', className: 'badge-neutral' };
        }
    };

    const handleOpenModal = (donation) => {
        setSelectedDonation(donation);
        setEditMessage(donation.message || '');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedDonation(null), 300);
    };

    const handleSaveMessage = async () => {
        if (!selectedDonation) return;

        try {
            setIsSaving(true);
            await donationsAPI.updateMessage(selectedDonation.id, editMessage);

            // Update local state
            setDonations(prev => prev.map(d =>
                d.id === selectedDonation.id ? { ...d, message: editMessage } : d
            ));

            setSelectedDonation(prev => ({ ...prev, message: editMessage }));
            alert(t('donations.message_updated')); // Or use a toast if available
        } catch (error) {
            console.error('Update message error:', error);
            alert('Mesaj güncellenirken bir hata oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="user-donations-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('donations.loading')}</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="user-donations-page">
                {/* Header */}
                <div className="donations-header-modern">
                    <div className="header-content">
                        <div className="header-badge">
                            <FiGift /> {t('donations.title')}
                        </div>
                        <div className="header-stats">
                            <div className="stat-card">
                                <FiTrendingUp className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-label">{t('donations.stats.total')}</span>
                                    <span className="stat-value">{formatPrice(totalDonated)}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <FiHeart className="stat-icon" />
                                <div className="stat-content">
                                    <span className="stat-label">{t('donations.stats.count')}</span>
                                    <span className="stat-value">{donationCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="filters-section">
                    <div className="search-bar-wrapper">
                        <div className="search-input-group">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder={t('donations.search.placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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
                                <label>Durum</label>
                                <div className="status-tabs">
                                    <button
                                        className={`status-tab ${filterStatus === 'all' ? 'active' : ''}`}
                                        onClick={() => setFilterStatus('all')}
                                    >
                                        Tümü
                                    </button>
                                    <button
                                        className={`status-tab ${filterStatus === 'completed' ? 'active' : ''}`}
                                        onClick={() => setFilterStatus('completed')}
                                    >
                                        Tamamlanan
                                    </button>
                                    <button
                                        className={`status-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                                        onClick={() => setFilterStatus('pending')}
                                    >
                                        Bekleyen
                                    </button>
                                    <button
                                        className={`status-tab ${filterStatus === 'failed' ? 'active' : ''}`}
                                        onClick={() => setFilterStatus('failed')}
                                    >
                                        Başarısız
                                    </button>
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Tarih Aralığı</label>
                                <div className="date-range-inputs">
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    />
                                    <span className="range-separator">-</span>
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
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
                                        onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                                    />
                                    <span className="range-separator">-</span>
                                    <input
                                        type="number"
                                        className="amount-input"
                                        placeholder="Max"
                                        value={amountRange.max}
                                        onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bağış Tablosu */}
                <div className="table-container">
                    {filteredDonations.length === 0 ? (
                        <div className="no-results">
                            <FiGift className="no-results-icon" />
                            <h3>Bağış Bulunamadı</h3>
                            <p>Arama kriterlerinize uygun bağış kaydı bulunmuyor.</p>
                            {donations.length === 0 && (
                                <Link to="/projects" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                                    Projeleri Keşfet
                                </Link>
                            )}
                        </div>
                    ) : (
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Proje</th>
                                    <th>Tutar</th>
                                    <th>Tarih</th>
                                    <th>Durum</th>
                                    <th>Mesaj</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDonations.map(donation => (
                                    <tr key={donation.id}>
                                        <td data-label="Proje">
                                            <div className="project-cell">
                                                <Link to={`/projects/${donation.project_id}`} className="project-title-small">
                                                    {donation.project_title}
                                                </Link>
                                                {donation.coupon && (
                                                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: '0.25rem' }}>
                                                        🏷️ {donation.coupon.code}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td data-label="Tutar">
                                            <span className="amount-cell">{formatPrice(donation.amount)}</span>
                                        </td>
                                        <td data-label="Tarih" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            {formatDate(donation.created_at)}
                                        </td>
                                        <td data-label="Durum">
                                            {(() => {
                                                const statusUI = getStatusUI(donation.status);
                                                return (
                                                    <span className={`status-badge ${statusUI.className}`}>
                                                        {statusUI.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td data-label="Mesaj">
                                            {donation.message ? (
                                                <span title={donation.message} style={{ fontStyle: 'italic', color: '#64748b' }}>
                                                    {donation.message.length > 20 ? donation.message.substring(0, 20) + '...' : donation.message}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td data-label="İşlemler">
                                            <div className="actions-cell">
                                                <button
                                                    onClick={() => handleOpenModal(donation)}
                                                    className="btn-icon"
                                                    title="Detaylar ve Mesaj"
                                                >
                                                    <FiFileText />
                                                </button>
                                                <Link
                                                    to={`/projects/${donation.project_id}`}
                                                    className="btn-icon"
                                                    title={t('donations.actions.view_project')}
                                                >
                                                    <FiEye />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Donation Details Modal */}
            {isModalOpen && selectedDonation && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content-modern" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Bağış Detayları</h3>
                            <button className="modal-close-btn" onClick={handleCloseModal}>
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="donation-summary-grid">
                                <div className="summary-item">
                                    <span className="label">Proje</span>
                                    <span className="value highlight">
                                        <Link to={`/projects/${selectedDonation.project_id}`} onClick={handleCloseModal}>
                                            {selectedDonation.project_title}
                                        </Link>
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Tutar</span>
                                    <span className="value price">{formatPrice(selectedDonation.amount)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Tarih</span>
                                    <span className="value">{formatDate(selectedDonation.created_at)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Durum</span>
                                    {(() => {
                                        const statusUI = getStatusUI(selectedDonation.status);
                                        return (
                                            <span className={`status-badge ${statusUI.className}`}>
                                                {statusUI.label}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {selectedDonation.coupon && (
                                    <div className="summary-item">
                                        <span className="label">Kullanılan Kupon</span>
                                        <div className="coupon-display" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <span className="coupon-code-badge" style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.5rem', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <FiTag size={12} /> {selectedDonation.coupon.code}
                                            </span>
                                            <span className="coupon-discount-info" style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.9rem' }}>
                                                (-%{selectedDonation.coupon.discount_value})
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="summary-item">
                                    <span className="label">Ödeme Yöntemi</span>
                                    <span className="value" style={{ textTransform: 'capitalize' }}>
                                        {selectedDonation.payment_method === 'balance' ? 'Bakiye ile' :
                                            selectedDonation.payment_method === 'credit_card' ? 'Kredi Kartı' :
                                                selectedDonation.payment_method || '-'}
                                    </span>
                                </div>

                                {selectedDonation.transaction_id && (
                                    <div className="summary-item full-width">
                                        <span className="label">İşlem ID</span>
                                        <span className="value mono">{selectedDonation.transaction_id}</span>
                                    </div>
                                )}
                            </div>

                            <div className="message-edit-section">
                                <label className="input-label">
                                    <FiFileText /> Bağış Mesajınız / Notunuz
                                </label>
                                <textarea
                                    className="modern-textarea"
                                    value={editMessage}
                                    onChange={(e) => setEditMessage(e.target.value)}
                                    placeholder="Bu bağış için bir not ekleyin..."
                                    rows="4"
                                />
                                <div className="message-actions">
                                    <button
                                        className="btn-save"
                                        onClick={handleSaveMessage}
                                        disabled={isSaving || editMessage === selectedDonation.message}
                                    >
                                        {isSaving ? 'Kaydediliyor...' : (
                                            <>
                                                <FiSave /> Kaydet
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
};

export default UserDonations;
