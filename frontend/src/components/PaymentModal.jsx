import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { walletPaymentAPI } from '../api/walletPayment';
import BankTransferForm from './BankTransferForm';
import {
    FiX, FiCreditCard, FiPhone, FiHome, FiLock,
    FiCheck, FiShield, FiAlertCircle, FiChevronRight,
    FiDollarSign, FiPercent, FiGift, FiPlus
} from 'react-icons/fi';
import { MotionModal } from './motion';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, amount, onSuccess }) => {
    const { t, language } = useLanguage();
    const [step, setStep] = useState(1); // 1: Method, 2: Card Form, 3: Processing, 4: Success
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: ''
    });
    const [errors, setErrors] = useState({});
    const [bonusAmount, setBonusAmount] = useState(0);
    const [bankTransferData, setBankTransferData] = useState(null);
    const [paymentError, setPaymentError] = useState(null);
    const [savedCards, setSavedCards] = useState([]);
    const [selectedSavedCardId, setSelectedSavedCardId] = useState(null);

    // Calculate bonus
    useEffect(() => {
        if (amount >= 1000) {
            setBonusAmount(amount * 0.05);
        } else if (amount >= 500) {
            setBonusAmount(amount * 0.03);
        } else {
            setBonusAmount(0);
        }
    }, [amount]);

    const paymentMethods = [
        {
            id: 'credit_card',
            icon: FiCreditCard,
            title: t('payment.method.credit_card') || 'Kredi/Banka Kartı',
            description: t('payment.method.credit_card_desc') || 'Visa, Mastercard, Troy',
            popular: true
        },
        {
            id: 'bank_transfer',
            icon: FiHome,
            title: t('payment.method.bank_transfer') || 'Havale/EFT',
            description: t('payment.method.bank_transfer_desc') || 'Banka hesaplarımıza transfer',
            popular: false
        },
        {
            id: 'mobile_payment',
            icon: FiPhone,
            title: t('payment.method.mobile_payment') || 'Mobil Ödeme',
            description: t('payment.method.mobile_payment_desc') || 'Faturanıza yansıtın',
            popular: false
        }
    ];

    const formatPrice = (price) => {
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleCardInput = (field, value) => {
        let formattedValue = value;

        if (field === 'cardNumber') {
            formattedValue = formatCardNumber(value);
            if (formattedValue.length > 19) return;
        } else if (field === 'expiry') {
            formattedValue = formatExpiry(value.replace('/', ''));
            if (formattedValue.length > 5) return;
        } else if (field === 'cvv') {
            formattedValue = value.replace(/[^0-9]/gi, '');
            if (formattedValue.length > 4) return;
        }

        setCardData(prev => ({ ...prev, [field]: formattedValue }));
        setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validateCard = () => {
        const newErrors = {};

        if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 16) {
            newErrors.cardNumber = t('payment.error.invalid_card') || 'Geçersiz kart numarası';
        }
        if (!cardData.cardName || cardData.cardName.length < 3) {
            newErrors.cardName = t('payment.error.invalid_name') || 'Geçersiz isim';
        }
        if (!cardData.expiry || cardData.expiry.length < 5) {
            newErrors.expiry = t('payment.error.invalid_expiry') || 'Geçersiz tarih';
        }
        if (!cardData.cvv || cardData.cvv.length < 3) {
            newErrors.cvv = t('payment.error.invalid_cvv') || 'Geçersiz CVV';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleMethodSelect = async (methodId) => {
        setPaymentMethod(methodId);
        setPaymentError(null);

        if (methodId === 'credit_card') {
            setStep(2);
            loadSavedCards();
        } else if (methodId === 'bank_transfer') {
            // Initiate bank transfer
            setStep(3);
            setProcessing(true);
            try {
                const response = await walletPaymentAPI.initiateBankTransfer(amount);
                setBankTransferData(response.data);
                setProcessing(false);
                setStep(2); // Show bank transfer form
            } catch (error) {
                console.error('Bank transfer initiation error:', error);
                setPaymentError(error.response?.data?.error || 'Failed to initiate bank transfer');
                setProcessing(false);
                setStep(1);
            }
        } else if (methodId === 'mobile_payment') {
            // For mobile payment, show selection first
            setStep(2);
        }
    };

    const handleCardSubmit = async () => {
        if (!validateCard()) return;

        setStep(3);
        setProcessing(true);
        setPaymentError(null);

        try {
            const response = await walletPaymentAPI.processCardPayment({
                amount,
                gateway: 'stripe', // or 'iyzico'
                cardToken: 'test_token' // In real scenario, tokenize card data first
            });

            if (response.data.success) {
                const totalAmount = response.data.totalAmount;
                setProcessing(false);
                setStep(4);
                setTimeout(() => {
                    if (onSuccess) onSuccess(totalAmount);
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Payment failed');
            }
        } catch (error) {
            console.error('Card payment error:', error);
            setPaymentError(error.response?.data?.error || error.message || 'Payment failed');
            setProcessing(false);
            setStep(1);
        }
    };

    const loadSavedCards = async () => {
        try {
            const response = await walletPaymentAPI.getSavedCards();
            setSavedCards(response.data || []);
        } catch (error) {
            console.error('Error loading saved cards:', error);
        }
    };

    const handleSavedCardSelect = (card) => {
        setSelectedSavedCardId(card.id);
        setCardData({
            cardNumber: card.cardNumber,
            cardName: card.cardName,
            expiry: card.expiry,
            cvv: card.cvv || ''
        });
        setErrors({});
    };

    const simulatePayment = () => {
        setProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            setProcessing(false);
            setStep(4);
            // Call success callback after animation
            setTimeout(() => {
                if (onSuccess) onSuccess(amount + bonusAmount);
            }, 2000);
        }, 3000);
    };

    const handleClose = () => {
        setStep(1);
        setPaymentMethod(null);
        setCardData({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
        setErrors({});
        setBankTransferData(null);
        setPaymentError(null);
        onClose();
    };

    const handleBankTransferSuccess = () => {
        setStep(4);
        setTimeout(() => {
            if (onSuccess) onSuccess(amount + bonusAmount);
        }, 2000);
    };

    const handleMobilePayment = async (mobileMethod) => {
        setStep(3);
        setProcessing(true);
        setPaymentError(null);

        try {
            const response = await walletPaymentAPI.processMobilePayment({
                amount,
                paymentMethod: mobileMethod,
                token: 'demo_token'
            });

            if (response.data.success) {
                const totalAmount = response.data.totalAmount;
                setProcessing(false);
                setStep(4);
                setTimeout(() => {
                    if (onSuccess) onSuccess(totalAmount);
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Payment failed');
            }
        } catch (error) {
            console.error('Mobile payment error:', error);
            setPaymentError(error.response?.data?.error || error.message || 'Payment failed');
            setProcessing(false);
            setStep(1);
        }
    };

    const getCardType = () => {
        const number = cardData.cardNumber.replace(/\s/g, '');
        if (number.startsWith('4')) return 'visa';
        if (number.startsWith('5')) return 'mastercard';
        if (number.startsWith('9')) return 'troy';
        return null;
    };

    return (
        <MotionModal
            isOpen={isOpen}
            onClose={handleClose}
            overlayClassName="payment-modal-overlay"
            panelClassName="payment-modal"
        >
                {/* Header */}
                <div className="payment-modal-header">
                    <div className="payment-header-content">
                        <h2>{t('payment.title') || 'Ödeme'}</h2>
                        <div className="payment-amount-badge">
                            {formatPrice(amount)}
                            {bonusAmount > 0 && (
                                <span className="bonus-badge">
                                    <FiGift /> +{formatPrice(bonusAmount)}
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="payment-close-btn" onClick={handleClose}>
                        <FiX />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="payment-progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="step-circle">{step > 1 ? <FiCheck /> : '1'}</div>
                        <span>{t('payment.step.method') || 'Yöntem'}</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <div className="step-circle">{step > 2 ? <FiCheck /> : '2'}</div>
                        <span>{t('payment.step.details') || 'Detaylar'}</span>
                    </div>
                    <div className="progress-line"></div>
                    <div className={`progress-step ${step >= 4 ? 'active completed' : ''}`}>
                        <div className="step-circle">{step >= 4 ? <FiCheck /> : '3'}</div>
                        <span>{t('payment.step.complete') || 'Tamamla'}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="payment-modal-content">
                    {/* Step 1: Payment Method Selection */}
                    {step === 1 && (
                        <div className="payment-methods-section">
                            <h3>{t('payment.select_method') || 'Ödeme Yöntemi Seçin'}</h3>
                            <div className="payment-methods-list">
                                {paymentMethods.map(method => {
                                    const Icon = method.icon;
                                    return (
                                        <button
                                            key={method.id}
                                            className={`payment-method-card ${paymentMethod === method.id ? 'selected' : ''}`}
                                            onClick={() => handleMethodSelect(method.id)}
                                        >
                                            {method.popular && (
                                                <span className="popular-badge">
                                                    {t('payment.popular') || 'Popüler'}
                                                </span>
                                            )}
                                            <div className="method-icon">
                                                <Icon />
                                            </div>
                                            <div className="method-info">
                                                <h4>{method.title}</h4>
                                                <p>{method.description}</p>
                                            </div>
                                            <FiChevronRight className="method-arrow" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Card Form or Bank Transfer or Mobile */}
                    {step === 2 && (
                        <>
                            {paymentMethod === 'credit_card' && (
                                <div className="card-form-section">
                                    {savedCards.length > 0 && (
                                        <div className="saved-cards-container">
                                            <h4>{t('payment.saved_cards') || 'Kayıtlı Kartlarım'}</h4>
                                            <div className="saved-cards-grid">
                                                {savedCards.map(card => (
                                                    <div
                                                        key={card.id}
                                                        className={`saved-card-item ${selectedSavedCardId === card.id ? 'selected' : ''}`}
                                                        onClick={() => handleSavedCardSelect(card)}
                                                    >
                                                        <div className="saved-card-icon">
                                                            {card.type === 'visa' && <span className="logo-visa-sm">VISA</span>}
                                                            {card.type === 'mastercard' && <span className="logo-mc-sm">MC</span>}
                                                            {!['visa', 'mastercard'].includes(card.type) && <FiCreditCard />}
                                                        </div>
                                                        <div className="saved-card-info">
                                                            <span className="saved-card-last4">•••• {card.last4}</span>
                                                            <span className="saved-card-name">{card.cardName}</span>
                                                        </div>
                                                        {selectedSavedCardId === card.id && <FiCheck className="saved-card-check" />}
                                                    </div>
                                                ))}
                                                <div
                                                    className={`saved-card-item new ${!selectedSavedCardId ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedSavedCardId(null);
                                                        setCardData({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
                                                    }}
                                                >
                                                    <div className="saved-card-icon">
                                                        <FiPlus />
                                                    </div>
                                                    <span>{t('payment.new_card') || 'Yeni Kart'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="card-preview">
                                        <div className="card-preview-front">
                                            <div className="card-chip"></div>
                                            <div className="card-type-logo">
                                                {getCardType() === 'visa' && <span className="logo-visa">VISA</span>}
                                                {getCardType() === 'mastercard' && <span className="logo-mc">MC</span>}
                                                {getCardType() === 'troy' && <span className="logo-troy">TROY</span>}
                                            </div>
                                            <div className="card-number-display">
                                                {cardData.cardNumber || '•••• •••• •••• ••••'}
                                            </div>
                                            <div className="card-details-display">
                                                <div className="card-name">
                                                    {cardData.cardName || 'AD SOYAD'}
                                                </div>
                                                <div className="card-expiry">
                                                    {cardData.expiry || 'AA/YY'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <form className="card-form" onSubmit={e => { e.preventDefault(); handleCardSubmit(); }}>
                                        {/* Test Cards Helper - Only in Development/Test Mode */}
                                        {import.meta.env.DEV && (
                                            <div className="test-cards-helper">
                                                <div className="test-helper-header">
                                                    <FiAlertCircle />
                                                    <span>{t('payment.test_mode') || 'Test Modu'}</span>
                                                </div>
                                                <div className="test-cards-list">
                                                    <div className="test-card-item">
                                                        <span className="test-card-label">✅ {t('payment.test_success') || 'Başarılı'}:</span>
                                                        <span className="test-card-number">4242 4242 4242 4242</span>
                                                    </div>
                                                    <div className="test-card-item">
                                                        <span className="test-card-label">❌ {t('payment.test_fail') || 'Başarısız'}:</span>
                                                        <span className="test-card-number">4000 0000 0000 0002</span>
                                                    </div>
                                                    <div className="test-card-hint">
                                                        CVV: 123 | {t('payment.test_expiry') || 'Tarih: Gelecek herhangi bir tarih'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label>{t('payment.card_number') || 'Kart Numarası'}</label>
                                            <div className={`input-wrapper ${errors.cardNumber ? 'error' : ''}`}>
                                                <FiCreditCard />
                                                <input
                                                    type="text"
                                                    value={cardData.cardNumber}
                                                    onChange={e => handleCardInput('cardNumber', e.target.value)}
                                                    placeholder="1234 5678 9012 3456"
                                                />
                                            </div>
                                            {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label>{t('payment.card_name') || 'Kart Üzerindeki İsim'}</label>
                                            <div className={`input-wrapper ${errors.cardName ? 'error' : ''}`}>
                                                <input
                                                    type="text"
                                                    value={cardData.cardName}
                                                    onChange={e => handleCardInput('cardName', e.target.value.toUpperCase())}
                                                    placeholder="AD SOYAD"
                                                />
                                            </div>
                                            {errors.cardName && <span className="error-text">{errors.cardName}</span>}
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>{t('payment.expiry') || 'Son Kullanma'}</label>
                                                <div className={`input-wrapper ${errors.expiry ? 'error' : ''}`}>
                                                    <input
                                                        type="text"
                                                        value={cardData.expiry}
                                                        onChange={e => handleCardInput('expiry', e.target.value)}
                                                        placeholder="AA/YY"
                                                    />
                                                </div>
                                                {errors.expiry && <span className="error-text">{errors.expiry}</span>}
                                            </div>
                                            <div className="form-group">
                                                <label>{t('payment.cvv') || 'CVV'}</label>
                                                <div className={`input-wrapper ${errors.cvv ? 'error' : ''}`}>
                                                    <FiLock />
                                                    <input
                                                        type="password"
                                                        value={cardData.cvv}
                                                        onChange={e => handleCardInput('cvv', e.target.value)}
                                                        placeholder="•••"
                                                    />
                                                </div>
                                                {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <button
                                                type="button"
                                                className="btn-back"
                                                onClick={() => setStep(1)}
                                            >
                                                {t('payment.back') || 'Geri'}
                                            </button>
                                            <button type="submit" className="btn-pay">
                                                <FiLock />
                                                {t('payment.pay_now') || 'Şimdi Öde'} {formatPrice(amount)}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {paymentMethod === 'bank_transfer' && bankTransferData && (
                                <BankTransferForm
                                    paymentRequestId={bankTransferData.paymentRequestId}
                                    amount={bankTransferData.amount}
                                    bonusAmount={bankTransferData.bonusAmount}
                                    totalAmount={bankTransferData.totalAmount}
                                    referenceNumber={bankTransferData.referenceNumber}
                                    bankAccounts={bankTransferData.bankAccounts}
                                    onSuccess={handleBankTransferSuccess}
                                    onCancel={() => setStep(1)}
                                />
                            )}

                            {paymentMethod === 'mobile_payment' && (
                                <div className="mobile-payment-section">
                                    <h3>{t('payment.select_mobile_method') || 'Select Mobile Payment'}</h3>
                                    <div className="mobile-methods">
                                        <button
                                            className="mobile-method-btn"
                                            onClick={() => handleMobilePayment('google_pay')}
                                        >
                                            <div className="mobile-icon">G</div>
                                            <span>Google Pay</span>
                                        </button>
                                        <button
                                            className="mobile-method-btn"
                                            onClick={() => handleMobilePayment('apple_pay')}
                                        >
                                            <div className="mobile-icon">🍎</div>
                                            <span>Apple Pay</span>
                                        </button>
                                    </div>
                                    <button className="btn-back-mobile" onClick={() => setStep(1)}>
                                        {t('payment.back') || 'Geri'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 3: Processing */}
                    {step === 3 && (
                        <div className="processing-section">
                            <div className="processing-animation">
                                <div className="processing-spinner"></div>
                                <div className="processing-pulse"></div>
                            </div>
                            <h3>{t('payment.processing') || 'İşleniyor...'}</h3>
                            <p>{t('payment.processing_desc') || 'Ödemeniz güvenli bir şekilde işleniyor.'}</p>
                            <div className="security-badges">
                                <div className="security-badge">
                                    <FiShield />
                                    <span>256-bit SSL</span>
                                </div>
                                <div className="security-badge">
                                    <FiLock />
                                    <span>3D Secure</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="success-section">
                            <div className="success-animation">
                                <div className="success-circle">
                                    <FiCheck className="success-icon" />
                                </div>
                                <div className="success-confetti">
                                    {[...Array(20)].map((_, i) => (
                                        <div key={i} className="confetti-piece" style={{
                                            '--delay': `${Math.random() * 0.5}s`,
                                            '--x': `${Math.random() * 200 - 100}px`,
                                            '--rotation': `${Math.random() * 360}deg`
                                        }}></div>
                                    ))}
                                </div>
                            </div>
                            <h3>{t('payment.success') || 'Ödeme Başarılı!'}</h3>
                            <p className="success-amount">
                                {formatPrice(amount + bonusAmount)}
                                <span>{t('payment.added_to_balance') || 'bakiyenize eklendi'}</span>
                            </p>
                            {bonusAmount > 0 && (
                                <div className="bonus-earned">
                                    <FiGift />
                                    <span>{formatPrice(bonusAmount)} {t('payment.bonus_earned') || 'bonus kazandınız!'}</span>
                                </div>
                            )}
                            <button className="btn-done" onClick={handleClose}>
                                {t('payment.done') || 'Tamam'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step < 3 && (
                    <div className="payment-modal-footer">
                        <div className="payment-summary">
                            <div className="summary-row">
                                <span>{t('payment.amount') || 'Tutar'}</span>
                                <span>{formatPrice(amount)}</span>
                            </div>
                            {bonusAmount > 0 && (
                                <div className="summary-row bonus">
                                    <span><FiGift /> {t('payment.bonus') || 'Bonus'}</span>
                                    <span>+{formatPrice(bonusAmount)}</span>
                                </div>
                            )}
                            <div className="summary-row total">
                                <span>{t('payment.total') || 'Toplam'}</span>
                                <span>{formatPrice(amount + bonusAmount)}</span>
                            </div>
                        </div>
                        <div className="footer-security">
                            <FiShield />
                            <span>{t('payment.secure_payment') || 'Güvenli ödeme ile korunmaktadır'}</span>
                        </div>
                    </div>
                )}
        </MotionModal>
    );
};

export default PaymentModal;
