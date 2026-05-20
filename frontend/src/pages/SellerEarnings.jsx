import { useState, useEffect } from 'react';
import { sellerAPI } from '../api/seller';
import SellerLayout from '../components/SellerLayout';
import { FiDollarSign, FiTrendingUp, FiClock, FiCreditCard, FiDownload, FiUser, FiHash, FiBriefcase, FiEye, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import './SellerEarnings.css';

const SellerEarnings = () => {
    const [earnings, setEarnings] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWithdrawForm, setShowWithdrawForm] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [withdrawData, setWithdrawData] = useState({
        amount: '',
        iban: '',
        bank_name: '',
        account_holder: ''
    });

    useEffect(() => {
        loadEarnings();
        loadWithdrawals();
    }, []);

    const loadEarnings = async () => {
        try {
            const response = await sellerAPI.getEarnings();
            // Data structure: { total, available, pending, withdrawn }
            setEarnings(response.data);
        } catch (error) {
            console.error('Earnings load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWithdrawals = async () => {
        try {
            const response = await sellerAPI.getWithdrawals();
            setWithdrawals(response.data.withdrawals || []);
        } catch (error) {
            console.error('Withdrawals load error:', error);
        }
    };

    // IBAN formatting function - Turkish IBAN: TR + 24 digits
    const formatIBAN = (value) => {
        // Remove all non-alphanumeric characters
        let cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        // Ensure starts with TR
        if (!cleaned.startsWith('TR')) {
            if (cleaned.startsWith('T')) {
                cleaned = 'T' + cleaned.slice(1).replace(/[^0-9R]/g, '');
            } else {
                cleaned = 'TR' + cleaned.replace(/[^0-9]/g, '');
            }
        } else {
            // After TR, only allow digits
            cleaned = 'TR' + cleaned.slice(2).replace(/[^0-9]/g, '');
        }

        // Limit to 26 characters (TR + 24 digits)
        cleaned = cleaned.slice(0, 26);

        // Format with spaces: TR00 0000 0000 0000 0000 0000 00
        let formatted = '';
        for (let i = 0; i < cleaned.length; i++) {
            if (i === 4 || i === 8 || i === 12 || i === 16 || i === 20 || i === 24) {
                formatted += ' ';
            }
            formatted += cleaned[i];
        }

        return formatted;
    };

    const handleIBANChange = (e) => {
        const formatted = formatIBAN(e.target.value);
        setWithdrawData({ ...withdrawData, iban: formatted });
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();

        if (!withdrawData.amount || parseFloat(withdrawData.amount) <= 0) {
            alert('Lütfen geçerli bir tutar girin');
            return;
        }

        if (!withdrawData.iban) {
            alert('Lütfen IBAN numaranızı girin');
            return;
        }

        if (parseFloat(withdrawData.amount) > parseFloat(earnings?.available || 0)) {
            alert('Çekilebilir bakiyeniz yetersiz');
            return;
        }

        try {
            await sellerAPI.requestWithdrawal(withdrawData);
            alert('Para çekme talebi başarıyla oluşturuldu');
            setShowWithdrawForm(false);
            setWithdrawData({ amount: '', iban: '', bank_name: '', account_holder: '' });
            loadEarnings();
            loadWithdrawals();
        } catch (error) {
            alert(error.response?.data?.error || 'Para çekme talebi oluşturulamadı');
        }
    };

    if (loading) {
        return (
            <SellerLayout>
                <div className="seller-earnings-page">
                    <div className="loading-fullscreen">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="seller-earnings-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <h1>Kazançlarım</h1>
                            <p>Gelirlerinizi ve ödemelerinizi takip edin</p>
                        </div>
                    </div>

                    {/* Özet Kartlar */}
                    <div className="earnings-summary">
                        <div className="summary-card total">
                            <div className="summary-icon">
                                <FiDollarSign />
                            </div>
                            <div className="summary-content">
                                <span className="summary-label">Cüzdan Bakiyesi</span>
                                <h2>₺{parseFloat(earnings?.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                <span className="sub-label">Toplam Ciro: ₺{parseFloat(earnings?.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>

                        <div className="summary-card available">
                            <div className="summary-icon">
                                <FiTrendingUp />
                            </div>
                            <div className="summary-content">
                                <span className="summary-label">Çekilebilir Bakiye</span>
                                <h2>₺{parseFloat(earnings?.available || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                            </div>
                        </div>

                        <div className="summary-card pending">
                            <div className="summary-icon">
                                <FiClock />
                            </div>
                            <div className="summary-content">
                                <span className="summary-label">Bloke Bakiye (7 Gün)</span>
                                <h2>₺{parseFloat(earnings?.blocked || earnings?.pending || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                            </div>
                        </div>

                        <div className="summary-card withdrawn">
                            <div className="summary-icon">
                                <FiCreditCard />
                            </div>
                            <div className="summary-content">
                                <span className="summary-label">Çekilen Toplam</span>
                                <h2>₺{parseFloat(earnings?.withdrawn || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                            </div>
                        </div>
                    </div>

                    {/* Para Çekme */}
                    <div className="withdraw-section">
                        <div className="section-header">
                            <h2>Para Çek</h2>
                            {!showWithdrawForm && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowWithdrawForm(true)}
                                    disabled={parseFloat(earnings?.available || 0) <= 0}
                                >
                                    <FiCreditCard /> Para Çekme Talebi Oluştur
                                </button>
                            )}
                        </div>

                        {showWithdrawForm && (
                            <div className="withdraw-form-card">
                                <div className="form-header">
                                    <div className="form-title">
                                        <FiCreditCard className="form-title-icon" />
                                        <div>
                                            <h3>Para Çekme Talebi</h3>
                                            <p>Kazancınızı banka hesabınıza aktarın</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="close-btn"
                                        onClick={() => {
                                            setShowWithdrawForm(false);
                                            setWithdrawData({ amount: '', iban: '', bank_name: '', account_holder: '' });
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleWithdraw} className="withdraw-form-body">
                                    {/* Amount Section - Prominent */}
                                    <div className="amount-section">
                                        <label>Çekilecek Tutar</label>
                                        <div className="amount-input-group">
                                            <span className="currency">₺</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={earnings?.available || 0}
                                                value={withdrawData.amount}
                                                onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                                                placeholder="0,00"
                                                required
                                                className="amount-field"
                                            />
                                        </div>
                                        <div className="available-balance">
                                            Çekilebilir: <strong>₺{parseFloat(earnings?.available || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
                                        </div>
                                    </div>

                                    <div className="form-divider"></div>

                                    {/* Bank Details */}
                                    <div className="bank-details">
                                        <h4>Banka Bilgileri</h4>
                                        <div className="form-row-2">
                                            <div className="form-field">
                                                <label><FiUser /> Hesap Sahibi</label>
                                                <input
                                                    type="text"
                                                    value={withdrawData.account_holder}
                                                    onChange={(e) => setWithdrawData({ ...withdrawData, account_holder: e.target.value })}
                                                    placeholder="Ad Soyad"
                                                    required
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label><FiBriefcase /> Banka</label>
                                                <input
                                                    type="text"
                                                    value={withdrawData.bank_name}
                                                    onChange={(e) => setWithdrawData({ ...withdrawData, bank_name: e.target.value })}
                                                    placeholder="Banka Adı"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="form-field full-width">
                                            <label><FiHash /> IBAN</label>
                                            <input
                                                type="text"
                                                value={withdrawData.iban}
                                                onChange={handleIBANChange}
                                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                                                maxLength={32}
                                                required
                                                className="iban-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-footer">
                                        <button type="submit" className="submit-btn">
                                            <FiCreditCard /> Talep Oluştur
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Para Çekme Geçmişi */}
                    <div className="withdrawals-section-card">
                        <div className="section-title-bar">
                            <div className="section-title-content">
                                <div className="section-icon">
                                    <FiClock />
                                </div>
                                <div>
                                    <h2>Para Çekme Geçmişi</h2>
                                    <p>Tüm para çekme talepleriniz</p>
                                </div>
                            </div>
                            <span className="history-count">{withdrawals.length} Talep</span>
                        </div>

                        {withdrawals.length === 0 ? (
                            <div className="empty-state-card">
                                <div className="empty-icon-circle">
                                    <FiCreditCard />
                                </div>
                                <h3>Henüz Talep Yok</h3>
                                <p>Para çekme talebiniz bulunmuyor</p>
                            </div>
                        ) : (
                            <div className="withdrawals-list-minimal">
                                {withdrawals.map(withdrawal => (
                                    <div key={withdrawal.id} className="withdrawal-item-minimal">
                                        <div className="withdrawal-main-minimal">
                                            <div className="withdrawal-info-minimal">
                                                <div className="withdrawal-date-minimal">
                                                    <span className="date-day-minimal">{new Date(withdrawal.created_at).getDate()}</span>
                                                    <span className="date-month-minimal">{new Date(withdrawal.created_at).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                                </div>
                                                <div className="withdrawal-details-minimal">
                                                    <span className="withdrawal-amount-minimal">₺{parseFloat(withdrawal.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                    <span className="withdrawal-id-minimal">Talep #{withdrawal.id}</span>
                                                </div>
                                            </div>
                                            <div className="withdrawal-actions-minimal">
                                                <span className={`status-pill-minimal status-${withdrawal.status}`}>
                                                    {withdrawal.status === 'pending' && <><FiClock /> Beklemede</>}
                                                    {withdrawal.status === 'completed' && <><FiCheck /> Tamamlandı</>}
                                                    {withdrawal.status === 'rejected' && <><FiX /> Reddedildi</>}
                                                </span>
                                                <button
                                                    className="btn-details-minimal"
                                                    onClick={() => {
                                                        setSelectedWithdrawal(withdrawal);
                                                        setShowDetailModal(true);
                                                    }}
                                                >
                                                    <FiEye /> Detaylar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detaylar Modal */}
            {showDetailModal && selectedWithdrawal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content withdrawal-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Para Çekme Detayları</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowDetailModal(false)}
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="withdrawal-detail-content">
                                {/* Durum */}
                                <div className="detail-section">
                                    <div className="detail-header">
                                        <span className="detail-label">Durum</span>
                                        <span className={`status-badge-detail status-${selectedWithdrawal.status}`}>
                                            {selectedWithdrawal.status === 'pending' && <><FiClock /> Beklemede</>}
                                            {selectedWithdrawal.status === 'completed' && <><FiCheck /> Tamamlandı</>}
                                            {selectedWithdrawal.status === 'rejected' && <><FiX /> Reddedildi</>}
                                        </span>
                                    </div>
                                </div>

                                {/* Tutar */}
                                <div className="detail-section">
                                    <div className="detail-row">
                                        <span className="detail-label">Tutar</span>
                                        <span className="detail-value amount-value">
                                            ₺{parseFloat(selectedWithdrawal.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                {/* Banka Bilgileri */}
                                <div className="detail-section">
                                    <h4 className="detail-section-title">Banka Bilgileri</h4>
                                    <div className="detail-row">
                                        <span className="detail-label">Hesap Sahibi</span>
                                        <span className="detail-value">{selectedWithdrawal.account_holder || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Banka</span>
                                        <span className="detail-value">{selectedWithdrawal.bank_name || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">IBAN</span>
                                        <span className="detail-value iban-value">{selectedWithdrawal.iban || '-'}</span>
                                    </div>
                                </div>

                                {/* İşlem Bilgileri */}
                                <div className="detail-section">
                                    <h4 className="detail-section-title">İşlem Bilgileri</h4>
                                    <div className="detail-row">
                                        <span className="detail-label">Talep No</span>
                                        <span className="detail-value">#{selectedWithdrawal.id}</span>
                                    </div>
                                    {selectedWithdrawal.transaction_id && (
                                        <div className="detail-row">
                                            <span className="detail-label">İşlem Kodu</span>
                                            <span className="detail-value transaction-id-value">{selectedWithdrawal.transaction_id}</span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="detail-label">Talep Tarihi</span>
                                        <span className="detail-value">
                                            {new Date(selectedWithdrawal.created_at).toLocaleString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    {selectedWithdrawal.updated_at && selectedWithdrawal.status !== 'pending' && (
                                        <div className="detail-row">
                                            <span className="detail-label">İşlem Tarihi</span>
                                            <span className="detail-value">
                                                {new Date(selectedWithdrawal.updated_at).toLocaleString('tr-TR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Admin Notu / Red Sebebi */}
                                {selectedWithdrawal.admin_note && (
                                    <div className="detail-section admin-note-section">
                                        <div className="detail-header">
                                            <span className="detail-label">
                                                <FiAlertCircle /> {selectedWithdrawal.status === 'rejected' ? 'Red Sebebi' : 'Admin Notu'}
                                            </span>
                                        </div>
                                        <div className="admin-note-content">
                                            {selectedWithdrawal.admin_note}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowDetailModal(false)}
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SellerLayout >
    );
};

export default SellerEarnings;

