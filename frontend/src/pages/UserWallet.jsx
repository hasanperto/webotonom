import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import PaymentModal from '../components/PaymentModal';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    FiCreditCard, FiPlus, FiArrowUpRight, FiArrowDownLeft,
    FiClock, FiCheckCircle, FiXCircle, FiTrendingUp,
    FiShield, FiGift, FiPercent, FiZap, FiDollarSign,
    FiCopy, FiCheck, FiAlertCircle, FiRefreshCw
} from 'react-icons/fi';
import './UserWallet.css';
import PendingPayments from '../components/PendingPayments';
const UserWallet = () => {
    const { user, isAuthenticated } = useAuth();
    const { t, language } = useLanguage();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState('');
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Predefined amounts for top-up
    const topUpAmounts = [50, 100, 250, 500, 1000, 2500];

    useEffect(() => {
        if (isAuthenticated) {
            loadWalletData();
        }
    }, [isAuthenticated]);

    const loadWalletData = async () => {
        try {
            setLoading(true);

            // Load stats (includes balance)
            const statsResponse = await usersAPI.getStats();
            setBalance(parseFloat(statsResponse.data?.balance || 0));
            setStats(statsResponse.data);

            // Load recent transactions
            const transactionsResponse = await usersAPI.getTransactions({ limit: 10 });
            setTransactions(transactionsResponse.data?.transactions || []);
        } catch (error) {
            console.error('Wallet data load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
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

    const getTransactionIcon = (type) => {
        const icons = {
            'purchase': FiArrowUpRight,
            'sale': FiArrowDownLeft,
            'refund': FiRefreshCw,
            'deposit': FiPlus,
            'withdrawal': FiArrowUpRight,
            'donation': FiGift,
            'commission': FiPercent,
            'payout': FiArrowUpRight
        };
        return icons[type] || FiDollarSign;
    };

    const getStatusColor = (status) => {
        const colors = {
            'completed': '#10b981',
            'pending': '#f59e0b',
            'failed': '#ef4444',
            'cancelled': '#6b7280'
        };
        return colors[status] || '#6b7280';
    };

    const isPositiveTransaction = (type) => {
        return ['sale', 'refund', 'deposit', 'commission'].includes(type);
    };

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        setCustomAmount('');
    };

    const handleCustomAmountChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setCustomAmount(value);
        setSelectedAmount(null);
    };

    const handleTopUp = async () => {
        const amount = selectedAmount || parseFloat(customAmount);
        if (!amount || amount < 10) {
            alert(t('wallet.min_amount_error'));
            return;
        }

        // Open payment modal with selected amount
        setPaymentAmount(amount);
        setShowPaymentModal(true);
        setShowAddMoney(false);
    };

    const handlePaymentSuccess = (totalAmount) => {
        // Refresh wallet data after successful payment
        loadWalletData();
        setSelectedAmount(null);
        setCustomAmount('');
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (!isAuthenticated) {
        return (
            <UserLayout>
                <div className="wallet-page">
                    <div className="auth-required">
                        <FiCreditCard className="auth-icon" />
                        <h2>{t('wallet.auth_required')}</h2>
                        <p>{t('wallet.auth_description')}</p>
                        <Link to="/login" className="btn btn-primary">
                            {t('wallet.login')}
                        </Link>
                    </div>
                </div>
            </UserLayout>
        );
    }

    if (loading) {
        return (
            <UserLayout>
                <div className="wallet-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('wallet.loading')}</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="wallet-page">
                {/* Header */}
                <div className="wallet-header">
                    <div className="wallet-header-content">
                        <h1 className="wallet-title">{t('wallet.title')}</h1>
                        <p className="wallet-subtitle">{t('wallet.subtitle')}</p>
                    </div>
                    <button
                        className="wallet-refresh-btn"
                        onClick={loadWalletData}
                        title={t('wallet.refresh')}
                    >
                        <FiRefreshCw />
                    </button>
                </div>

                {/* Balance Card */}
                <div className="wallet-balance-section">
                    <div className="balance-card-premium">
                        <div className="balance-card-bg">
                            <div className="balance-orb balance-orb-1"></div>
                            <div className="balance-orb balance-orb-2"></div>
                            <div className="balance-orb balance-orb-3"></div>
                        </div>
                        <div className="balance-card-content">
                            <div className="balance-header-row">
                                <div className="balance-icon-wrapper">
                                    <FiCreditCard />
                                </div>
                                <div className="balance-badge">
                                    <FiShield />
                                    <span>{t('wallet.secure')}</span>
                                </div>
                            </div>
                            <div className="balance-amount-section">
                                <span className="balance-label">{t('wallet.current_balance')}</span>
                                <h2 className="balance-amount-large">
                                    {formatPrice(balance)}
                                </h2>
                            </div>
                            <div className="balance-actions-row">
                                <button
                                    className="balance-action-btn primary"
                                    onClick={() => setShowAddMoney(true)}
                                >
                                    <FiPlus />
                                    <span>{t('wallet.add_money')}</span>
                                </button>
                                <Link to="/user/transactions" className="balance-action-btn secondary">
                                    <FiClock />
                                    <span>{t('wallet.history')}</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="wallet-quick-stats">
                        <div className="quick-stat-card">
                            <div className="quick-stat-icon spent">
                                <FiArrowUpRight />
                            </div>
                            <div className="quick-stat-info">
                                <span className="quick-stat-label">{t('wallet.total_spent')}</span>
                                <span className="quick-stat-value">{formatPrice(stats?.total_spent || 0)}</span>
                            </div>
                        </div>
                        <div className="quick-stat-card">
                            <div className="quick-stat-icon earned">
                                <FiArrowDownLeft />
                            </div>
                            <div className="quick-stat-info">
                                <span className="quick-stat-label">{t('wallet.total_earned')}</span>
                                <span className="quick-stat-value">{formatPrice(stats?.total_earned || 0)}</span>
                            </div>
                        </div>
                        <div className="quick-stat-card">
                            <div className="quick-stat-icon donated">
                                <FiGift />
                            </div>
                            <div className="quick-stat-info">
                                <span className="quick-stat-label">{t('wallet.total_donated')}</span>
                                <span className="quick-stat-value">{formatPrice(stats?.total_donated || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Payments */}
                <PendingPayments />

                {/* Add Money Section */}
                {showAddMoney && (
                    <div className="add-money-section">
                        <div className="add-money-header">
                            <h3>{t('wallet.add_money_title')}</h3>
                            <button
                                className="close-add-money"
                                onClick={() => setShowAddMoney(false)}
                            >
                                <FiXCircle />
                            </button>
                        </div>

                        <div className="amount-grid">
                            {topUpAmounts.map(amount => (
                                <button
                                    key={amount}
                                    className={`amount-option ${selectedAmount === amount ? 'selected' : ''}`}
                                    onClick={() => handleAmountSelect(amount)}
                                >
                                    <span className="amount-value">{formatPrice(amount)}</span>
                                    {amount >= 500 && (
                                        <span className="amount-bonus">
                                            <FiZap /> {amount >= 1000 ? '+5%' : '+3%'}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="custom-amount-wrapper">
                            <label>{t('wallet.custom_amount')}</label>
                            <div className="custom-amount-input">
                                <span className="currency-symbol">₺</span>
                                <input
                                    type="text"
                                    value={customAmount}
                                    onChange={handleCustomAmountChange}
                                    placeholder="0"
                                />
                            </div>
                            <span className="amount-hint">{t('wallet.min_amount')}: ₺10</span>
                        </div>

                        <button
                            className="topup-btn"
                            onClick={handleTopUp}
                            disabled={processing || (!selectedAmount && !customAmount)}
                        >
                            {processing ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    <span>{t('wallet.processing')}</span>
                                </>
                            ) : (
                                <>
                                    <FiCreditCard />
                                    <span>{t('wallet.proceed_payment')}</span>
                                </>
                            )}
                        </button>

                        <div className="payment-methods">
                            <span>{t('wallet.payment_methods')}</span>
                            <div className="payment-icons">
                                <div className="payment-icon visa">VISA</div>
                                <div className="payment-icon mastercard">MC</div>
                                <div className="payment-icon troy">TROY</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Benefits Section */}
                <div className="wallet-benefits">
                    <h3>{t('wallet.benefits_title')}</h3>
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <FiZap />
                            </div>
                            <h4>{t('wallet.benefit_fast_title')}</h4>
                            <p>{t('wallet.benefit_fast_desc')}</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <FiShield />
                            </div>
                            <h4>{t('wallet.benefit_secure_title')}</h4>
                            <p>{t('wallet.benefit_secure_desc')}</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <FiPercent />
                            </div>
                            <h4>{t('wallet.benefit_bonus_title')}</h4>
                            <p>{t('wallet.benefit_bonus_desc')}</p>
                        </div>
                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <FiTrendingUp />
                            </div>
                            <h4>{t('wallet.benefit_track_title')}</h4>
                            <p>{t('wallet.benefit_track_desc')}</p>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="recent-transactions-section">
                    <div className="section-header">
                        <h3>{t('wallet.recent_transactions')}</h3>
                        <Link to="/user/transactions" className="view-all-link">
                            {t('wallet.view_all')} →
                        </Link>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="empty-transactions">
                            <FiCreditCard className="empty-icon" />
                            <h4>{t('wallet.no_transactions')}</h4>
                            <p>{t('wallet.no_transactions_desc')}</p>
                        </div>
                    ) : (
                        <div className="transactions-list">
                            {transactions.slice(0, 5).map(transaction => {
                                const TransactionIcon = getTransactionIcon(transaction.type);
                                const isPositive = isPositiveTransaction(transaction.type);

                                return (
                                    <div key={transaction.id} className="transaction-item">
                                        <div className={`transaction-icon ${isPositive ? 'positive' : 'negative'}`}>
                                            <TransactionIcon />
                                        </div>
                                        <div className="transaction-details">
                                            <div className="transaction-main-info">
                                                <span className="transaction-type">
                                                    {t(`transactions.types.${transaction.type}`) || transaction.type}
                                                </span>
                                                <span
                                                    className="transaction-status"
                                                    style={{ color: getStatusColor(transaction.status) }}
                                                >
                                                    {t(`transactions.status.${transaction.status}`) || transaction.status}
                                                </span>
                                            </div>
                                            <div className="transaction-meta">
                                                <span className="transaction-date">
                                                    {formatDate(transaction.created_at)}
                                                </span>
                                                {transaction.order_number && (
                                                    <span className="transaction-ref">
                                                        #{transaction.order_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`transaction-amount ${isPositive ? 'positive' : 'negative'}`}>
                                            {isPositive ? '+' : '-'}
                                            {formatPrice(Math.abs(transaction.amount))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Security Info */}
                <div className="security-info">
                    <div className="security-badge">
                        <FiShield />
                    </div>
                    <div className="security-content">
                        <h4>{t('wallet.security_title')}</h4>
                        <p>{t('wallet.security_desc')}</p>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={paymentAmount}
                onSuccess={handlePaymentSuccess}
            />
        </UserLayout>
    );
};

export default UserWallet;
