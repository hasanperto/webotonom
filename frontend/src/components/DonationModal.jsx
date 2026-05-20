import { useState, useEffect } from 'react';
import { donationsAPI } from '../api/donations';
import { usersAPI } from '../api/users';
import { userPaymentCardsAPI } from '../api/userPaymentCards';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { FiX, FiGift, FiDollarSign, FiCreditCard, FiUser, FiLock, FiCheck, FiAlertCircle, FiPlus, FiTrash2, FiCheckCircle, FiCopy, FiTag } from 'react-icons/fi';
import { MotionModal } from './motion';
import './DonationModal.css';

const DonationModal = ({ isOpen, onClose, project }) => {
    const { isAuthenticated, user } = useAuth();
    const { formatPrice } = useCurrency();
    const { t } = useLanguage();
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('credit_card'); // credit_card, paypal, bank_transfer, balance
    const [userBalance, setUserBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [error, setError] = useState('');
    const [savedCards, setSavedCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [showNewCardForm, setShowNewCardForm] = useState(false);
    const [newCardData, setNewCardData] = useState({
        card_number: '',
        card_holder: '',
        expiry_date: '',
        cvv: '',
        save_card: false
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [copyNotification, setCopyNotification] = useState(false);

    const presetAmounts = [50, 100, 250, 500, 1000, 2500];

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            loadUserBalance();
            if (paymentMethod === 'credit_card') {
                loadSavedCards();
            }
        }
    }, [isOpen, isAuthenticated, paymentMethod]);

    const loadUserBalance = async () => {
        try {
            const response = await usersAPI.getStats();
            setUserBalance(parseFloat(response.data?.balance || 0));
        } catch (error) {
            console.error('Balance load error:', error);
            setUserBalance(0);
        }
    };

    const loadSavedCards = async () => {
        try {
            const response = await userPaymentCardsAPI.getCards();
            setSavedCards(response.data.cards || []);
            // Varsayılan kartı seç
            const defaultCard = response.data.cards?.find(card => card.is_default);
            if (defaultCard) {
                setSelectedCardId(defaultCard.id);
            }
        } catch (error) {
            console.error('Load cards error:', error);
            setSavedCards([]);
        }
    };

    const handlePresetAmount = (presetAmount) => {
        setAmount(presetAmount.toString());
        setCustomAmount('');
        setError('');
    };

    const handleCustomAmount = (value) => {
        setCustomAmount(value);
        if (value && !isNaN(value) && parseFloat(value) > 0) {
            setAmount(value);
            setError('');
        } else {
            setAmount('');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const donationAmount = parseFloat(amount);
        if (!donationAmount || donationAmount <= 0) {
            setError(t('donation_modal.error.invalid_amount') || 'Lütfen geçerli bir miktar giriniz');
            return;
        }

        // Bakiye kontrolü (eğer bakiye ile ödeme seçildiyse)
        if (isAuthenticated && paymentMethod === 'balance' && userBalance < donationAmount) {
            setError(t('donation_modal.error.insufficient_balance') || 'Bakiyeniz yetersiz. Lütfen para yükleyin veya başka bir ödeme yöntemi seçin.');
            return;
        }

        // Ziyaretçiler için anonim bağış zorunlu
        if (!isAuthenticated && !anonymous) {
            setError(t('donation_modal.error.anonymous_required') || 'Anonim bağış için lütfen anonim seçeneğini işaretleyin');
            return;
        }

        // Kredi kartı için kart bilgisi kontrolü
        let paymentData = null;
        if (paymentMethod === 'credit_card' || (!isAuthenticated && paymentMethod === 'credit_card')) {
            if (isAuthenticated) {
                if (!selectedCardId && !showNewCardForm) {
                    setError(t('donation_modal.error.select_card') || 'Lütfen bir kart seçin veya yeni kart ekleyin');
                    return;
                }
                if (showNewCardForm) {
                    // Yeni kart validasyonu
                    if (!newCardData.card_number || !newCardData.card_holder || !newCardData.expiry_date || !newCardData.cvv) {
                        setError(t('donation_modal.error.fill_card_info') || 'Lütfen tüm kart bilgilerini doldurun');
                        return;
                    }
                    paymentData = {
                        new_card: true,
                        card_data: newCardData
                    };
                } else {
                    paymentData = {
                        card_id: selectedCardId
                    };
                }
            } else {
                // Ziyaretçi için yeni kart zorunlu
                if (!newCardData.card_number || !newCardData.card_holder || !newCardData.expiry_date || !newCardData.cvv) {
                    setError(t('donation_modal.error.fill_card_info') || 'Lütfen kart bilgilerini doldurun');
                    return;
                }
                paymentData = {
                    new_card: true,
                    card_data: newCardData
                };
            }
        }

        setProcessing(true);

        try {
            const donationData = {
                amount: donationAmount,
                anonymous: anonymous || !isAuthenticated, // Ziyaretçiler otomatik anonim
                message: message || null,
                payment_method: isAuthenticated ? paymentMethod : (paymentMethod === 'credit_card' ? 'guest_card' : 'guest'),
                payment_data: paymentData
            };

            // Ziyaretçiler için token olmadan API çağrısı yapılabilir
            const response = await donationsAPI.donate(project.id, donationData);

            // Eğer bakiye ile ödeme yapıldıysa, bakiyeyi güncelle
            if (isAuthenticated && paymentMethod === 'balance') {
                await loadUserBalance();
            }

            // Başarı verilerini kaydet
            setSuccessData({
                message: response.data.message || (t('donation_modal.error.success_message') || 'Bağışınız başarıyla yapıldı!'),
                amount: donationAmount,
                coupon: response.data.discount_coupon,
                status: response.data.status
            });
            
            // Formu temizle
            setAmount('');
            setMessage('');
            setCustomAmount('');
            setAnonymous(false);
            setPaymentMethod('credit_card');
            setSelectedCardId(null);
            setShowNewCardForm(false);
            setNewCardData({
                card_number: '',
                card_holder: '',
                expiry_date: '',
                cvv: '',
                save_card: false
            });
            
            // Success ekranını göster
            setShowSuccess(true);
        } catch (error) {
            console.error('Donation error:', error);
            setError(error.response?.data?.error || (t('donation_modal.error.failed') || 'Bağış yapılamadı. Lütfen tekrar deneyin.'));
        } finally {
            setProcessing(false);
        }
    };

    if (!project) return null;

    const donationProgress = project.donation_target 
        ? ((parseFloat(project.donation_received || 0) / parseFloat(project.donation_target)) * 100).toFixed(1)
        : 0;

    const handleCloseSuccess = () => {
        setShowSuccess(false);
        setSuccessData(null);
        onClose();
        // Sayfayı yenile (proje bağış miktarını güncellemek için)
        window.location.reload();
    };

    return (
        <MotionModal
            isOpen={isOpen}
            onClose={showSuccess ? handleCloseSuccess : onClose}
            overlayClassName="donation-modal-overlay"
            panelClassName="donation-modal-content"
        >
                {showSuccess && successData ? (
                    // Success Ekranı
                    <div className="donation-success-screen">
                        <div className="success-icon-wrapper">
                            <div className="success-icon-circle">
                                <FiCheckCircle className="success-icon" />
                            </div>
                        </div>
                        <h2 className="success-title">{t('donation_modal.success.title') || 'Bağışınız Başarıyla Tamamlandı!'}</h2>
                        <p className="success-message">{successData.message}</p>
                        
                        <div className="success-amount-card">
                            <div className="success-amount-label">{t('donation_modal.success.amount_label') || 'Bağış Miktarı'}</div>
                            <div className="success-amount-value">{formatPrice(successData.amount, project?.currency || 'TRY')}</div>
                        </div>

                        {successData.coupon && (
                            <div className="success-coupon-card">
                                <div className="coupon-header-success">
                                    <FiTag className="coupon-icon-success" />
                                    <span className="coupon-title-success">{t('donation_modal.success.coupon_title') || 'Hediye Kuponu Kazandınız!'}</span>
                                </div>
                                <div className="coupon-content-success">
                                    <div className="coupon-discount-badge">
                                        %{successData.coupon.discount} {t('donation_modal.success.discount') || 'İndirim'}
                                    </div>
                                    <div className="coupon-code-wrapper-success">
                                        <span className="coupon-code-success">{successData.coupon.code}</span>
                                        <button
                                            type="button"
                                            className="coupon-copy-btn-success"
                                            onClick={() => {
                                                navigator.clipboard.writeText(successData.coupon.code);
                                                setCopyNotification(true);
                                                setTimeout(() => setCopyNotification(false), 2000);
                                            }}
                                            title={t('donation_modal.success.copy') || 'Kopyala'}
                                        >
                                            <FiCopy />
                                        </button>
                                    </div>
                                    <p className="coupon-info-success">
                                        {t('donation_modal.success.coupon_info', { project_title: project.title }) || `Bu kuponu sadece ${project.title} projesinde kullanabilirsiniz.`}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="success-actions">
                            <button
                                type="button"
                                className="success-btn-primary"
                                onClick={handleCloseSuccess}
                            >
                                <FiCheckCircle /> {t('donation_modal.success.done') || 'Tamam'}
                            </button>
                        </div>

                        {/* Kopyalama Bildirimi */}
                        {copyNotification && (
                            <div className="copy-notification">
                                <FiCheck /> {t('donation_modal.success.copied') || 'Kupon kodu kopyalandı!'}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="donation-modal-header">
                            <div className="donation-header-info">
                                <div className="donation-icon-wrapper">
                                    <FiGift className="donation-icon" />
                                </div>
                                <div>
                                    <h2>{t('donation_modal.title') || 'Bağış Yap'}</h2>
                                    <p className="donation-project-name">{project.title}</p>
                                </div>
                            </div>
                            <button className="donation-modal-close" onClick={onClose}>
                                <FiX />
                            </button>
                        </div>

                {/* Proje Bağış İlerlemesi */}
                {project.donation_target && (
                    <div className="donation-progress-section">
                        <div className="donation-progress-info">
                            <div className="progress-stat">
                                <span className="progress-label">{t('donation_modal.progress.collected') || 'Toplanan'}</span>
                                <span className="progress-value">{formatPrice(project.donation_received || 0, project.currency || 'TRY')}</span>
                            </div>
                            <div className="progress-stat">
                                <span className="progress-label">{t('donation_modal.progress.target') || 'Hedef'}</span>
                                <span className="progress-value">{formatPrice(project.donation_target, project.currency || 'TRY')}</span>
                            </div>
                            <div className="progress-stat">
                                <span className="progress-label">{t('donation_modal.progress.progress') || 'İlerleme'}</span>
                                <span className="progress-value">{donationProgress}%</span>
                            </div>
                        </div>
                        <div className="donation-progress-bar">
                            <div 
                                className="donation-progress-fill" 
                                style={{ width: `${Math.min(parseFloat(donationProgress), 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="donation-form">
                    {/* Miktar Seçimi */}
                    <div className="donation-section">
                        <label className="donation-label">
                            <FiDollarSign /> {t('donation_modal.amount.label') || 'Bağış Miktarı'} <span className="required">*</span>
                        </label>
                        <div className="donation-amount-presets">
                            {presetAmounts.map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    className={`donation-preset-btn ${amount === preset.toString() ? 'active' : ''}`}
                                    onClick={() => handlePresetAmount(preset)}
                                >
                                    {formatPrice(preset, project?.currency || 'TRY')}
                                </button>
                            ))}
                        </div>
                        <div className="donation-custom-amount">
                            <input
                                type="number"
                                placeholder={t('donation_modal.amount.custom_placeholder') || 'Özel miktar girin'}
                                value={customAmount}
                                onChange={(e) => handleCustomAmount(e.target.value)}
                                min="1"
                                step="0.01"
                            />
                        </div>
                        {amount && (
                            <div className="donation-selected-amount">
                                <FiCheck /> {t('donation_modal.amount.selected') || 'Seçilen miktar:'} <strong>{formatPrice(parseFloat(amount), project?.currency || 'TRY')}</strong>
                            </div>
                        )}
                    </div>

                    {/* Mesaj */}
                    <div className="donation-section">
                        <label className="donation-label">
                            <FiGift /> {t('donation_modal.message.label') || 'Mesajınız (İsteğe Bağlı)'}
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t('donation_modal.message.placeholder') || 'Proje sahibine mesajınızı yazın...'}
                            rows="3"
                            maxLength="500"
                        />
                        <div className="char-count">{message.length}/500</div>
                    </div>

                    {/* Anonim Bağış (Ziyaretçiler için - zorunlu) */}
                    {!isAuthenticated && (
                        <div className="donation-section">
                            <label className="donation-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={anonymous}
                                    onChange={(e) => setAnonymous(e.target.checked)}
                                    required
                                />
                                <span className="checkbox-custom"></span>
                                <div className="checkbox-content">
                                    <FiLock /> <strong>{t('donation_modal.anonymous.label') || 'Anonim Bağış'}</strong>
                                    <p>{t('donation_modal.anonymous.description') || 'Ziyaretçiler için anonim bağış zorunludur. Adınız gizli kalacak.'}</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Ödeme Yöntemi */}
                    {isAuthenticated ? (
                        <div className="donation-section">
                            <label className="donation-label">
                                <FiCreditCard /> {t('donation_modal.payment.label') || 'Ödeme Yöntemi'} <span className="required">*</span>
                            </label>
                            <div className="donation-payment-methods">
                                <button
                                    type="button"
                                    className={`donation-payment-tab ${paymentMethod === 'balance' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('balance')}
                                >
                                    <FiCreditCard />
                                    <span>{t('donation_modal.payment.balance') || 'Bakiye'}</span>
                                    <span className="payment-balance">{formatPrice(userBalance, 'TRY')}</span>
                                </button>
                                <button
                                    type="button"
                                    className={`donation-payment-tab ${paymentMethod === 'credit_card' ? 'active' : ''}`}
                                    onClick={() => {
                                        setPaymentMethod('credit_card');
                                        if (isAuthenticated) {
                                            loadSavedCards();
                                        } else {
                                            setShowNewCardForm(true);
                                        }
                                    }}
                                >
                                    <FiCreditCard />
                                    <span>{t('donation_modal.payment.credit_card') || 'Kredi Kartı'}</span>
                                </button>
                                <button
                                    type="button"
                                    className={`donation-payment-tab ${paymentMethod === 'paypal' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('paypal')}
                                >
                                    <FiCreditCard />
                                    <span>{t('donation_modal.payment.paypal') || 'PayPal'}</span>
                                </button>
                            </div>
                            {paymentMethod === 'balance' && userBalance < parseFloat(amount || 0) && (
                                <div className="donation-warning">
                                    <FiAlertCircle /> {t('donation_modal.payment.insufficient_balance') || 'Bakiyeniz yetersiz. Lütfen para yükleyin.'}
                                </div>
                            )}

                            {/* Kredi Kartı Seçimi */}
                            {paymentMethod === 'credit_card' && (
                                <div className="donation-card-selection">
                                    {isAuthenticated && savedCards.length > 0 && !showNewCardForm && (
                                        <div className="saved-cards-list">
                                            <h6 className="card-selection-title">Kayıtlı Kartlarım</h6>
                                            {savedCards.map(card => (
                                                <div
                                                    key={card.id}
                                                    className={`saved-card-item ${selectedCardId === card.id ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedCardId(card.id);
                                                        setShowNewCardForm(false);
                                                    }}
                                                >
                                                    <div className="card-radio">
                                                        <input
                                                            type="radio"
                                                            name="selected_card"
                                                            checked={selectedCardId === card.id}
                                                            onChange={() => setSelectedCardId(card.id)}
                                                        />
                                                    </div>
                                                    <div className="card-info">
                                                        <div className="card-type-badge">{card.card_type}</div>
                                                        <div className="card-number">{card.masked_number}</div>
                                                        <div className="card-holder">{card.card_holder}</div>
                                                        <div className="card-expiry">{card.expiry_date}</div>
                                                    </div>
                                                    {card.is_default && (
                                                        <span className="card-default-badge">{t('donation_modal.card.default') || 'Varsayılan'}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(showNewCardForm || savedCards.length === 0) && (
                                        <div className="new-card-form">
                                            {isAuthenticated && savedCards.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="btn-back-to-cards"
                                                    onClick={() => {
                                                        setShowNewCardForm(false);
                                                        setNewCardData({
                                                            card_number: '',
                                                            card_holder: '',
                                                            expiry_date: '',
                                                            cvv: '',
                                                            save_card: false
                                                        });
                                                    }}
                                                >
                                                    ← {t('donation_modal.card.back_to_cards') || 'Kayıtlı Kartları Göster'}
                                                </button>
                                            )}
                                            <h6 className="card-selection-title">
                                                {isAuthenticated ? (t('donation_modal.card.add_new') || 'Yeni Kart Ekle') : (t('donation_modal.card.info') || 'Kart Bilgileri')}
                                            </h6>
                                            <div className="card-form-grid">
                                                <div className="form-group">
                                                    <label>{t('donation_modal.card.number') || 'Kart Numarası'} *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="1234 5678 9012 3456"
                                                        value={newCardData.card_number}
                                                        onChange={(e) => {
                                                            let value = e.target.value.replace(/\s/g, '');
                                                            if (value.length <= 16) {
                                                                value = value.match(/.{1,4}/g)?.join(' ') || value;
                                                                setNewCardData({ ...newCardData, card_number: value });
                                                            }
                                                        }}
                                                        maxLength="19"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>{t('donation_modal.card.holder') || 'Kart Sahibi'} *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="AD SOYAD"
                                                        value={newCardData.card_holder}
                                                        onChange={(e) => setNewCardData({ ...newCardData, card_holder: e.target.value.toUpperCase() })}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>{t('donation_modal.card.expiry') || 'Son Kullanma Tarihi'} *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM/YY"
                                                        value={newCardData.expiry_date}
                                                        onChange={(e) => {
                                                            let value = e.target.value.replace(/\D/g, '');
                                                            if (value.length <= 4) {
                                                                if (value.length >= 2) {
                                                                    value = value.slice(0, 2) + '/' + value.slice(2);
                                                                }
                                                                setNewCardData({ ...newCardData, expiry_date: value });
                                                            }
                                                        }}
                                                        maxLength="5"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>{t('donation_modal.card.cvv') || 'CVV'} *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="123"
                                                        value={newCardData.cvv}
                                                        onChange={(e) => {
                                                            let value = e.target.value.replace(/\D/g, '');
                                                            if (value.length <= 4) {
                                                                setNewCardData({ ...newCardData, cvv: value });
                                                            }
                                                        }}
                                                        maxLength="4"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {isAuthenticated && (
                                                <label className="save-card-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={newCardData.save_card}
                                                        onChange={(e) => setNewCardData({ ...newCardData, save_card: e.target.checked })}
                                                    />
                                                    <span>{t('donation_modal.card.save_card') || 'Bu kartı kaydet'}</span>
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {isAuthenticated && savedCards.length > 0 && !showNewCardForm && (
                                        <button
                                            type="button"
                                            className="btn-add-new-card"
                                            onClick={() => {
                                                setShowNewCardForm(true);
                                                setSelectedCardId(null);
                                            }}
                                        >
                                            <FiPlus /> {t('donation_modal.card.add_new') || 'Yeni Kart Ekle'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="donation-section">
                            <label className="donation-label">
                                <FiCreditCard /> {t('donation_modal.payment.label') || 'Ödeme Yöntemi'} <span className="required">*</span>
                            </label>
                            <div className="donation-payment-methods">
                                <button
                                    type="button"
                                    className={`donation-payment-tab ${paymentMethod === 'credit_card' ? 'active' : ''}`}
                                    onClick={() => {
                                        setPaymentMethod('credit_card');
                                        setShowNewCardForm(true);
                                    }}
                                >
                                    <FiCreditCard />
                                    <span>{t('donation_modal.payment.credit_card') || 'Kredi Kartı'}</span>
                                </button>
                            </div>
                            {paymentMethod === 'credit_card' && (
                                <div className="donation-card-selection">
                                    <div className="new-card-form">
                                        <h6 className="card-selection-title">{t('donation_modal.card.info') || 'Kart Bilgileri'}</h6>
                                        <div className="card-form-grid">
                                            <div className="form-group">
                                                <label>{t('donation_modal.card.number') || 'Kart Numarası'} *</label>
                                                <input
                                                    type="text"
                                                    placeholder="1234 5678 9012 3456"
                                                    value={newCardData.card_number}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\s/g, '');
                                                        if (value.length <= 16) {
                                                            value = value.match(/.{1,4}/g)?.join(' ') || value;
                                                            setNewCardData({ ...newCardData, card_number: value });
                                                        }
                                                    }}
                                                    maxLength="19"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('donation_modal.card.holder') || 'Kart Sahibi'} *</label>
                                                <input
                                                    type="text"
                                                    placeholder="AD SOYAD"
                                                    value={newCardData.card_holder}
                                                    onChange={(e) => setNewCardData({ ...newCardData, card_holder: e.target.value.toUpperCase() })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('donation_modal.card.expiry') || 'Son Kullanma Tarihi'} *</label>
                                                <input
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    value={newCardData.expiry_date}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, '');
                                                        if (value.length <= 4) {
                                                            if (value.length >= 2) {
                                                                value = value.slice(0, 2) + '/' + value.slice(2);
                                                            }
                                                            setNewCardData({ ...newCardData, expiry_date: value });
                                                        }
                                                    }}
                                                    maxLength="5"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('donation_modal.card.cvv') || 'CVV'} *</label>
                                                <input
                                                    type="text"
                                                    placeholder="123"
                                                    value={newCardData.cvv}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, '');
                                                        if (value.length <= 4) {
                                                            setNewCardData({ ...newCardData, cvv: value });
                                                        }
                                                    }}
                                                    maxLength="4"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hata Mesajı */}
                    {error && (
                        <div className="donation-error">
                            <FiAlertCircle /> {error}
                        </div>
                    )}

                    {/* Butonlar */}
                    <div className="donation-actions">
                        <button
                            type="button"
                            className="donation-btn-cancel"
                            onClick={onClose}
                            disabled={processing}
                        >
                            {t('donation_modal.button.cancel') || 'İptal'}
                        </button>
                        <button
                            type="submit"
                            className="donation-btn-submit"
                            disabled={
                                processing || 
                                !amount || 
                                parseFloat(amount) <= 0 || 
                                (!isAuthenticated && !anonymous) || // Ziyaretçiler için anonim zorunlu
                                (isAuthenticated && paymentMethod === 'balance' && userBalance < parseFloat(amount || 0))
                            }
                        >
                            {processing ? (
                                <>{t('donation_modal.button.processing') || 'İşleniyor...'}</>
                            ) : (
                                <>
                                    <FiGift /> {t('donation_modal.button.submit') || 'Bağış Yap'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
                    </>
                )}
        </MotionModal>
    );
};

export default DonationModal;


