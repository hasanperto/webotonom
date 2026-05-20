import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import {
    FiCheck, FiX, FiClock, FiSearch, FiFilter,
    FiUser, FiHash, FiBriefcase, FiDollarSign, FiAlertCircle
} from 'react-icons/fi';
import './AdminWithdrawals.css';

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // all, pending, completed, rejected
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [actionModal, setActionModal] = useState({ show: false, type: null, data: null });
    const [actionInput, setActionInput] = useState('');

    useEffect(() => {
        loadWithdrawals();
    }, [filter]);

    const loadWithdrawals = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/withdrawals?status=${filter}`);
            setWithdrawals(response.data);
        } catch (error) {
            console.error('Withdrawals load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (withdrawal, type) => {
        setActionModal({
            show: true,
            type,
            data: withdrawal
        });
        setActionInput('');
    };

    const confirmAction = async () => {
        try {
            const { type, data } = actionModal;
            const status = type === 'approve' ? 'completed' : 'rejected';

            const payload = {
                status,
                transaction_id: type === 'approve' ? actionInput : null,
                admin_note: type === 'reject' ? actionInput : null
            };

            const response = await api.put(`/admin/withdrawals/${data.id}`, payload);

            // Listeyi yenile
            await loadWithdrawals();

            setActionModal({ show: false, type: null, data: null });
            setActionInput('');
            
            alert(`Talep başarıyla ${type === 'approve' ? 'onaylandı' : 'reddedildi'}.${type === 'approve' ? ' Çekilebilir bakiyesi düşürüldü.' : ' Red mesajı kaydedildi.'}`);
        } catch (error) {
            console.error('Action error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'İşlem sırasında bir hata oluştu.';
            alert(`Hata: ${errorMessage}`);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout>
            <div className="admin-withdrawals-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Para Çekme Talepleri</h1>
                        <p className="page-subtitle-advanced">Satıcıların oluşturduğu ödeme taleplerini yönetin</p>
                    </div>
                </div>

                <div className="withdrawals-filters">
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
                        Bekleyenler
                    </button>
                    <button
                        className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Tamamlananlar
                    </button>
                    <button
                        className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                        onClick={() => setFilter('rejected')}
                    >
                        Reddedilenler
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                ) : withdrawals.length === 0 ? (
                    <div className="empty-state">
                        <FiDollarSign className="empty-icon" />
                        <h3>Talep Bulunamadı</h3>
                        <p>Seçilen kriterlere uygun para çekme talebi yok.</p>
                    </div>
                ) : (
                    <div className="withdrawals-grid">
                        {withdrawals.map(withdrawal => (
                            <div key={withdrawal.id} className="withdrawal-card">
                                <div className="withdrawal-card-header">
                                    <div className="user-info">
                                        <div className="user-avatar">
                                            <FiUser />
                                        </div>
                                        <div className="user-details">
                                            <h4>{withdrawal.first_name} {withdrawal.last_name}</h4>
                                            <span>{withdrawal.email}</span>
                                        </div>
                                    </div>
                                    <div className="withdrawal-amount-badge">
                                        ₺{parseFloat(withdrawal.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="withdrawal-card-body">
                                    <div className="bank-info-grid">
                                        <div className="info-row">
                                            <FiUser className="info-icon" />
                                            <div className="info-content">
                                                <span className="info-label">Hesap Sahibi</span>
                                                <span className="info-value">{withdrawal.account_holder}</span>
                                            </div>
                                        </div>
                                        <div className="info-row">
                                            <FiBriefcase className="info-icon" />
                                            <div className="info-content">
                                                <span className="info-label">Banka</span>
                                                <span className="info-value">{withdrawal.bank_name}</span>
                                            </div>
                                        </div>
                                        <div className="info-row">
                                            <FiHash className="info-icon" />
                                            <div className="info-content">
                                                <span className="info-label">IBAN</span>
                                                <span className="info-value iban">{withdrawal.iban}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="withdrawal-status">
                                        <div className={`status-badge status-${withdrawal.status}`}>
                                            {withdrawal.status === 'pending' && <><FiClock /> Beklemede</>}
                                            {withdrawal.status === 'completed' && <><FiCheck /> Tamamlandı</>}
                                            {withdrawal.status === 'rejected' && <><FiX /> Reddedildi</>}
                                        </div>
                                        <div className="request-date">
                                            {formatDate(withdrawal.created_at)}
                                        </div>
                                    </div>

                                    <div className="withdrawal-details-section">
                                        {withdrawal.transaction_id && (
                                            <div className="info-row" style={{ marginTop: '1rem', background: '#ecfdf5', borderColor: '#d1fae5', padding: '0.75rem', borderRadius: '8px' }}>
                                                <FiCheck className="info-icon" style={{ color: '#059669' }} />
                                                <div className="info-content">
                                                    <span className="info-label">İşlem Kodu / Dekont No</span>
                                                    <span className="info-value" style={{ fontWeight: '600', color: '#059669' }}>{withdrawal.transaction_id}</span>
                                                </div>
                                            </div>
                                        )}

                                        {withdrawal.admin_note && (
                                            <div className="info-row" style={{ marginTop: '1rem', background: '#fef2f2', borderColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>
                                                <FiAlertCircle className="info-icon" style={{ color: '#dc2626' }} />
                                                <div className="info-content">
                                                    <span className="info-label">Admin Notu / Red Sebebi</span>
                                                    <span className="info-value" style={{ color: '#dc2626' }}>{withdrawal.admin_note}</span>
                                                </div>
                                            </div>
                                        )}

                                        {withdrawal.updated_at && withdrawal.status !== 'pending' && (
                                            <div className="info-row" style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                                <span className="info-label">İşlem Tarihi:</span>
                                                <span className="info-value">{formatDate(withdrawal.updated_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {withdrawal.status === 'pending' && (
                                    <div className="withdrawal-card-footer">
                                        <button
                                            className="action-btn btn-reject"
                                            onClick={() => handleActionClick(withdrawal, 'reject')}
                                        >
                                            <FiX /> Reddet
                                        </button>
                                        <button
                                            className="action-btn btn-approve"
                                            onClick={() => handleActionClick(withdrawal, 'approve')}
                                        >
                                            <FiCheck /> Onayla
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Confirm Action Modal */}
                {actionModal.show && (
                    <div className="modal-overlay" onClick={() => setActionModal({ show: false, type: null, data: null })}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>
                                {actionModal.type === 'approve' ? 'Talebi Onayla' : 'Talebi Reddet'}
                            </h3>
                            <div className="modal-info-box">
                                <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Talep Detayları:</p>
                                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                                    <strong>Kullanıcı:</strong> {actionModal.data?.first_name} {actionModal.data?.last_name}<br />
                                    <strong>Tutar:</strong> ₺{parseFloat(actionModal.data?.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}<br />
                                    <strong>IBAN:</strong> {actionModal.data?.iban}
                                </p>
                            </div>
                            <p style={{ marginBottom: '1rem' }}>
                                {actionModal.type === 'approve'
                                    ? 'Bu ödemeyi onaylamak üzeresiniz. Onaylandığında çekilebilir bakiyesi düşecektir. Varsa banka işlem kodunu girebilirsiniz.'
                                    : 'Bu talebi reddetmek üzeresiniz. Reddedildiğinde çekilebilir bakiyesi geri yüklenecektir. Lütfen reddetme sebebini yazın.'}
                            </p>

                            {actionModal.type === 'approve' ? (
                                <div className="form-group">
                                    <label className="form-label">İşlem Kodu / Dekont No (İsteğe bağlı)</label>
                                    <input
                                        type="text"
                                        className="transaction-input"
                                        placeholder="Örn: TR1234567890"
                                        value={actionInput}
                                        onChange={(e) => setActionInput(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Red Sebebi *</label>
                                    <textarea
                                        className="transaction-input"
                                        placeholder="Lütfen reddetme sebebini detaylı olarak yazın..."
                                        value={actionInput}
                                        onChange={(e) => setActionInput(e.target.value)}
                                        rows="4"
                                        required
                                    />
                                    {!actionInput.trim() && (
                                        <small style={{ color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>
                                            Red sebebi zorunludur.
                                        </small>
                                    )}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setActionModal({ show: false, type: null, data: null });
                                        setActionInput('');
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    className={`btn-primary ${actionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                    onClick={confirmAction}
                                    disabled={actionModal.type === 'reject' && !actionInput.trim()}
                                    style={{ opacity: actionModal.type === 'reject' && !actionInput.trim() ? 0.5 : 1 }}
                                >
                                    {actionModal.type === 'approve' ? 'Onayla ve Tamamla' : 'Reddet'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminWithdrawals;
