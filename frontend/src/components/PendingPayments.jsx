import { useState, useEffect } from 'react';
import { usersAPI } from '../api/users';
import { useLanguage } from '../context/LanguageContext';
import {
    FiClock, FiCheckCircle, FiXCircle, FiAlertCircle,
    FiChevronDown, FiChevronUp, FiSend, FiMessageSquare,
    FiCreditCard, FiDollarSign, FiCalendar, FiUser,
    FiHash, FiEdit3, FiSave
} from 'react-icons/fi';
import './PendingPayments.css';

const PendingPayments = () => {
    const { t, language } = useLanguage();
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [notes, setNotes] = useState({});
    const [savingNote, setSavingNote] = useState(null);
    const [editingNote, setEditingNote] = useState(null);

    useEffect(() => {
        loadPaymentRequests();
    }, []);

    const loadPaymentRequests = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getPaymentRequests();
            const requests = response.data.payment_requests || [];
            setPaymentRequests(requests);

            // Initialize notes state from existing data
            const initialNotes = {};
            requests.forEach(req => {
                initialNotes[req.id] = req.user_note || '';
            });
            setNotes(initialNotes);
        } catch (error) {
            console.error('Load payment requests error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
        setEditingNote(null);
    };

    const handleNoteChange = (id, value) => {
        setNotes(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveNote = async (id) => {
        try {
            setSavingNote(id);
            await usersAPI.updatePaymentRequestNote(id, notes[id]);
            setEditingNote(null);
            // Update local state
            setPaymentRequests(prev => prev.map(req =>
                req.id === id ? { ...req, user_note: notes[id] } : req
            ));
        } catch (error) {
            console.error('Save note error:', error);
            alert(t('pending_payments.note_save_error') || 'Not kaydedilemedi');
        } finally {
            setSavingNote(null);
        }
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: FiClock,
            processing: FiClock,
            pending_approval: FiAlertCircle,
            completed: FiCheckCircle,
            failed: FiXCircle,
            cancelled: FiXCircle
        };
        return icons[status] || FiClock;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            processing: '#3b82f6',
            pending_approval: '#8b5cf6',
            completed: '#10b981',
            failed: '#ef4444',
            cancelled: '#6b7280'
        };
        return colors[status] || '#6b7280';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: t('pending_payments.status.pending') || 'Beklemede',
            processing: t('pending_payments.status.processing') || 'İşleniyor',
            pending_approval: t('pending_payments.status.pending_approval') || 'Onay Bekliyor',
            completed: t('pending_payments.status.completed') || 'Tamamlandı',
            failed: t('pending_payments.status.failed') || 'Başarısız',
            cancelled: t('pending_payments.status.cancelled') || 'İptal Edildi'
        };
        return texts[status] || status;
    };

    const getMethodText = (method) => {
        const methods = {
            card: t('pending_payments.method.card') || 'Kredi Kartı',
            bank_transfer: t('pending_payments.method.bank_transfer') || 'Banka Havalesi',
            mobile: t('pending_payments.method.mobile') || 'Mobil Ödeme'
        };
        return methods[method] || method;
    };

    const getMethodIcon = (method) => {
        const icons = {
            card: FiCreditCard,
            bank_transfer: FiDollarSign,
            mobile: FiCreditCard
        };
        const Icon = icons[method] || FiDollarSign;
        return <Icon />;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        return date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="pending-payments-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (paymentRequests.length === 0) {
        return null;
    }

    // Filter only pending/processing requests for display
    const pendingRequests = paymentRequests.filter(req =>
        ['pending', 'processing', 'pending_approval'].includes(req.status)
    );

    if (pendingRequests.length === 0) {
        return null;
    }

    return (
        <div className="pending-payments-section">
            <div className="pending-payments-header">
                <h3 className="pending-payments-title">
                    <FiClock />
                    {t('pending_payments.title') || 'Bekleyen Ödeme İşlemleri'}
                </h3>
                <span className="pending-count">{pendingRequests.length}</span>
            </div>

            <div className="pending-payments-list">
                {pendingRequests.map(request => {
                    const StatusIcon = getStatusIcon(request.status);
                    const statusColor = getStatusColor(request.status);
                    const isExpanded = expandedId === request.id;
                    const isEditing = editingNote === request.id;

                    return (
                        <div
                            key={request.id}
                            className={`pending-payment-item ${isExpanded ? 'expanded' : ''}`}
                        >
                            {/* List Row - Clickable */}
                            <div
                                className="payment-list-row"
                                onClick={() => handleToggleExpand(request.id)}
                            >
                                <div className="payment-method-icon">
                                    {getMethodIcon(request.payment_method)}
                                </div>
                                <div className="payment-summary">
                                    <span className="payment-method-name">
                                        {getMethodText(request.payment_method)}
                                    </span>
                                    <span className="payment-date-mini">
                                        {formatDate(request.created_at)}
                                    </span>
                                </div>
                                <div className="payment-amount-display">
                                    {formatAmount(request.amount)}
                                </div>
                                <div className="payment-status-badge" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                                    <StatusIcon />
                                    {getStatusText(request.status)}
                                </div>
                                <div className="expand-icon">
                                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="payment-details-panel">
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <FiHash className="detail-icon" />
                                            <div className="detail-content">
                                                <span className="detail-label">
                                                    {t('pending_payments.reference') || 'Referans No'}
                                                </span>
                                                <span className="detail-value">
                                                    {request.reference_number || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="detail-item">
                                            <FiDollarSign className="detail-icon" />
                                            <div className="detail-content">
                                                <span className="detail-label">
                                                    {t('pending_payments.total_amount') || 'Toplam Tutar'}
                                                </span>
                                                <span className="detail-value">
                                                    {formatAmount(request.total_amount)}
                                                    {request.bonus_amount > 0 && (
                                                        <span className="bonus-text">
                                                            (+{formatAmount(request.bonus_amount)} bonus)
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="detail-item">
                                            <FiCalendar className="detail-icon" />
                                            <div className="detail-content">
                                                <span className="detail-label">
                                                    {t('pending_payments.created_at') || 'Oluşturma Tarihi'}
                                                </span>
                                                <span className="detail-value">
                                                    {formatDate(request.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {request.sender_name && (
                                            <div className="detail-item">
                                                <FiUser className="detail-icon" />
                                                <div className="detail-content">
                                                    <span className="detail-label">
                                                        {t('pending_payments.sender') || 'Gönderen'}
                                                    </span>
                                                    <span className="detail-value">
                                                        {request.sender_name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {request.bank_name && (
                                            <div className="detail-item">
                                                <FiCreditCard className="detail-icon" />
                                                <div className="detail-content">
                                                    <span className="detail-label">
                                                        {t('pending_payments.bank') || 'Banka'}
                                                    </span>
                                                    <span className="detail-value">
                                                        {request.bank_name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {request.gateway && (
                                            <div className="detail-item">
                                                <FiCreditCard className="detail-icon" />
                                                <div className="detail-content">
                                                    <span className="detail-label">
                                                        {t('pending_payments.gateway') || 'Ödeme Sağlayıcı'}
                                                    </span>
                                                    <span className="detail-value gateway-badge">
                                                        {request.gateway.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Note Section */}
                                    <div className="note-section">
                                        <div className="note-header">
                                            <FiMessageSquare />
                                            <span>{t('pending_payments.note') || 'Not'}</span>
                                            {!isEditing && (
                                                <button
                                                    className="edit-note-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingNote(request.id);
                                                    }}
                                                >
                                                    <FiEdit3 />
                                                </button>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="note-edit-area">
                                                <textarea
                                                    value={notes[request.id] || ''}
                                                    onChange={(e) => handleNoteChange(request.id, e.target.value)}
                                                    placeholder={t('pending_payments.note_placeholder') || 'Not eklemek için yazın...'}
                                                    rows={3}
                                                />
                                                <div className="note-actions">
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingNote(null);
                                                            setNotes(prev => ({
                                                                ...prev,
                                                                [request.id]: request.user_note || ''
                                                            }));
                                                        }}
                                                    >
                                                        {t('common.cancel') || 'İptal'}
                                                    </button>
                                                    <button
                                                        className="save-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSaveNote(request.id);
                                                        }}
                                                        disabled={savingNote === request.id}
                                                    >
                                                        {savingNote === request.id ? (
                                                            <div className="btn-spinner-small"></div>
                                                        ) : (
                                                            <>
                                                                <FiSave />
                                                                {t('common.save') || 'Kaydet'}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="note-content">
                                                {request.user_note || (
                                                    <span className="no-note">
                                                        {t('pending_payments.no_note') || 'Henüz not eklenmedi'}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status Timeline (optional for bank transfers) */}
                                    {request.payment_method === 'bank_transfer' && (
                                        <div className="status-info-box">
                                            <FiAlertCircle />
                                            <p>
                                                {t('pending_payments.bank_transfer_info') ||
                                                    'Banka havalesi işlemi admin onayı bekliyor. Onaylandığında bakiyenize yansıyacaktır.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PendingPayments;
