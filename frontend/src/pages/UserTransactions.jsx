import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    FiDollarSign, FiCalendar, FiTrendingUp, FiTrendingDown,
    FiSearch, FiFilter, FiArrowDown, FiArrowUp, FiGift,
    FiShoppingBag, FiCreditCard, FiXCircle, FiCheckCircle,
    FiClock, FiRefreshCw, FiInfo, FiChevronRight, FiChevronDown,
    FiPackage, FiFileText, FiTag
} from 'react-icons/fi';
import './UserTransactions.css';

const UserTransactions = () => {
    const { isAuthenticated } = useAuth();
    const { t, language } = useLanguage();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        total_spent: 0,
        total_earned: 0,
        total_donated: 0
    });

    useEffect(() => {
        if (isAuthenticated) {
            loadTransactions();
        }
    }, [isAuthenticated, filterType, filterStatus, language]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterType !== 'all') params.type = filterType;
            if (filterStatus !== 'all') params.status = filterStatus;

            const response = await usersAPI.getTransactions(params);
            const transactionsData = response.data.transactions || [];
            setTransactions(transactionsData);
            setStats(response.data.stats || stats);
        } catch (error) {
            console.error('Transactions load error:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';

        if (days === 0) {
            return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return t('transactions.date.yesterday') + ' ' + date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        } else if (days < 7) {
            return date.toLocaleDateString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
        }
    };

    const formatFullDate = (dateString) => {
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

    const formatDateGroup = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';

        if (days === 0) {
            return t('transactions.date.today') || 'Bugün';
        } else if (days === 1) {
            return t('transactions.date.yesterday') || 'Dün';
        } else if (days < 7) {
            return date.toLocaleDateString(locale, { weekday: 'long' });
        } else if (days < 30) {
            return date.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
        } else {
            return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
        }
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

    const getTypeLabel = (type) => {
        const key = `transactions.types.${type}`;
        const translated = t(key);
        return translated !== key ? translated : type;
    };

    const getTypeIcon = (type) => {
        const icons = {
            'deposit': FiArrowDown,
            'purchase': FiShoppingBag,
            'sale': FiTrendingUp,
            'commission': FiDollarSign,
            'payout': FiArrowUp,
            'refund': FiRefreshCw,
            'donation': FiGift
        };
        return icons[type] || FiDollarSign;
    };

    const getStatusLabel = (status) => {
        const key = `transactions.status.${status}`;
        const translated = t(key);
        return translated !== key ? translated : status;
    };

    const getStatusIcon = (status) => {
        const icons = {
            'pending': FiClock,
            'completed': FiCheckCircle,
            'failed': FiXCircle,
            'cancelled': FiXCircle
        };
        return icons[status] || FiClock;
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': '#f59e0b',
            'completed': '#10b981',
            'failed': '#ef4444',
            'cancelled': '#6b7280'
        };
        return colors[status] || '#6b7280';
    };

    const getPaymentMethodLabel = (method) => {
        if (!method) return null;
        const labels = {
            'credit_card': 'Kredi Kartı',
            'balance': 'Bakiye',
            'bank_transfer': 'Banka Havalesi',
            'paypal': 'PayPal',
            'stripe': 'Stripe',
            'iyzico': 'Iyzico',
            'crypto': 'Kripto Para',
            'other': 'Diğer'
        };
        return labels[method] || method;
    };

    const getPaymentMethodIcon = (method) => {
        if (!method) return null;
        const icons = {
            'credit_card': FiCreditCard,
            'balance': FiDollarSign,
            'bank_transfer': FiDollarSign,
            'paypal': FiCreditCard,
            'stripe': FiCreditCard,
            'iyzico': FiCreditCard,
            'crypto': FiDollarSign,
            'other': FiDollarSign
        };
        return icons[method] || FiCreditCard;
    };

    const isPositive = (type, amount) => {
        // Negatif tutarlı purchase transaction'ları için
        if (type === 'purchase' && parseFloat(amount) < 0) {
            return false;
        }
        const positiveTypes = ['deposit', 'sale', 'commission', 'payout', 'refund'];
        return positiveTypes.includes(type);
    };

    const getTypeColor = (type) => {
        const colors = {
            'deposit': '#10b981',
            'purchase': '#ef4444',
            'sale': '#3b82f6',
            'commission': '#8b5cf6',
            'payout': '#f59e0b',
            'refund': '#06b6d4',
            'donation': '#ec4899',
            'tax': '#6366f1'
        };
        return colors[type] || '#6b7280';
    };

    const getTypeBgColor = (type) => {
        const colors = {
            'deposit': 'rgba(16, 185, 129, 0.1)',
            'purchase': 'rgba(239, 68, 68, 0.1)',
            'sale': 'rgba(59, 130, 246, 0.1)',
            'commission': 'rgba(139, 92, 246, 0.1)',
            'payout': 'rgba(245, 158, 11, 0.1)',
            'refund': 'rgba(6, 182, 212, 0.1)',
            'donation': 'rgba(236, 72, 153, 0.1)',
            'tax': 'rgba(99, 102, 241, 0.1)'
        };
        return colors[type] || 'rgba(107, 114, 128, 0.1)';
    };

    // Filtreleme ve arama
    const filteredTransactions = transactions.filter(transaction => {
        // Arama filtresi
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const description = (transaction.description || '').toLowerCase();
            const transactionId = (transaction.transaction_id || '').toLowerCase();
            const orderNumber = (transaction.order_number || '').toLowerCase();
            const projectTitles = (transaction.project_titles || '').toLowerCase();

            if (!description.includes(query) &&
                !transactionId.includes(query) &&
                !orderNumber.includes(query) &&
                !projectTitles.includes(query)) {
                return false;
            }
        }

        return true;
    });

    // Tarihe göre gruplandır
    const groupedTransactions = useMemo(() => {
        const groups = {};
        filteredTransactions.forEach(transaction => {
            const dateKey = formatDateGroup(transaction.created_at);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(transaction);
        });
        // Grupları tarihe göre sırala (en yeni önce)
        const sortedGroups = Object.entries(groups).sort((a, b) => {
            const dateA = new Date(filteredTransactions.find(t => formatDateGroup(t.created_at) === a[0])?.created_at || 0);
            const dateB = new Date(filteredTransactions.find(t => formatDateGroup(t.created_at) === b[0])?.created_at || 0);
            return dateB - dateA;
        });
        return Object.fromEntries(sortedGroups);
    }, [filteredTransactions, language]);

    if (!isAuthenticated) {
        return (
            <UserLayout>
                <div className="user-transactions-page">
                    <div className="auth-required">
                        <FiDollarSign className="auth-icon" />
                        <h2>{t('transactions.auth.required')}</h2>
                        <p>{t('transactions.auth.description')}</p>
                        <Link to="/login" className="btn btn-primary">
                            {t('transactions.auth.login')}
                        </Link>
                    </div>
                </div>
            </UserLayout>
        );
    }

    if (loading) {
        return (
            <UserLayout>
                <div className="user-transactions-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('transactions.loading')}</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="user-transactions-page">
                {/* Minimal Header */}
                <div className="transactions-header-minimal">
                    <div className="header-title-section">
                        <h1 className="page-title">{t('transactions.title')}</h1>
                        <p className="page-subtitle">{t('transactions.subtitle', { count: stats.total || 0 })}</p>
                    </div>
                    <div className="header-stats-minimal">
                        <div className="stat-minimal">
                            <span className="stat-label-minimal">{t('transactions.stats.spent')}</span>
                            <span className="stat-value-minimal negative">{formatPrice(stats.total_spent || 0)}</span>
                        </div>
                        <div className="stat-minimal">
                            <span className="stat-label-minimal">{t('transactions.stats.earned')}</span>
                            <span className="stat-value-minimal positive">{formatPrice(stats.total_earned || 0)}</span>
                        </div>
                        <div className="stat-minimal">
                            <span className="stat-label-minimal">{t('transactions.stats.donated')}</span>
                            <span className="stat-value-minimal">{formatPrice(stats.total_donated || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Minimal Filtreler */}
                {transactions.length > 0 && (
                    <div className="transactions-filters-minimal">
                        <div className="search-box-minimal">
                            <FiSearch />
                            <input
                                type="text"
                                placeholder={t('transactions.search.placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="filter-select-minimal"
                        >
                            <option value="all">{t('transactions.filters.all_types')}</option>
                            <option value="deposit">{t('transactions.types.deposit')}</option>
                            <option value="purchase">{t('transactions.types.purchase')}</option>
                            <option value="sale">{t('transactions.types.sale')}</option>
                            <option value="commission">{t('transactions.types.commission')}</option>
                            <option value="payout">{t('transactions.types.payout')}</option>
                            <option value="refund">{t('transactions.types.refund')}</option>
                            <option value="donation">{t('transactions.types.donation')}</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select-minimal"
                        >
                            <option value="all">{t('transactions.filters.all_statuses')}</option>
                            <option value="completed">{t('transactions.status.completed')}</option>
                            <option value="pending">{t('transactions.status.pending')}</option>
                            <option value="failed">{t('transactions.status.failed')}</option>
                            <option value="cancelled">{t('transactions.status.cancelled')}</option>
                        </select>
                    </div>
                )}

                {/* İşlem Listesi */}
                {filteredTransactions.length === 0 ? (
                    <div className="empty-transactions-modern">
                        <div className="empty-transactions-icon-wrapper">
                            <div className="empty-transactions-icon-bg"></div>
                            <FiDollarSign className="empty-transactions-icon" />
                        </div>
                        <h2 className="empty-transactions-title">
                            {transactions.length === 0 ? t('transactions.empty.no_transactions') : t('transactions.empty.no_results')}
                        </h2>
                        <p className="empty-transactions-description">
                            {transactions.length === 0
                                ? t('transactions.empty.description')
                                : t('transactions.empty.no_results_description')}
                        </p>
                        {transactions.length === 0 && (
                            <Link to="/projects" className="btn-empty-transactions-primary">
                                <FiShoppingBag />
                                <span>{t('transactions.empty.explore_projects')}</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="transactions-list-modern">
                        {Object.entries(groupedTransactions).map(([dateGroup, transactions]) => (
                            <div key={dateGroup} className="transaction-group">
                                <div className="transaction-group-header">
                                    <div className="group-date">
                                        <FiCalendar className="group-date-icon" />
                                        <span className="group-date-text">{dateGroup}</span>
                                    </div>
                                    <div className="group-summary">
                                        <span className="group-count">{transactions.length} {t('transactions.items') || 'işlem'}</span>
                                        <span className="group-total">
                                            {formatPrice(
                                                transactions.reduce((sum, t) => {
                                                    const amount = parseFloat(t.amount || 0);
                                                    return sum + (isPositive(t.type, amount) ? amount : -Math.abs(amount));
                                                }, 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="transaction-group-items">
                                    {transactions.map(transaction => {
                                        const TypeIcon = getTypeIcon(transaction.type);
                                        const StatusIcon = getStatusIcon(transaction.status);
                                        const statusColor = getStatusColor(transaction.status);
                                        const typeColor = getTypeColor(transaction.type);
                                        const typeBgColor = getTypeBgColor(transaction.type);
                                        const isPositiveAmount = isPositive(transaction.type, transaction.amount);
                                        const isExpanded = expandedId === transaction.id;

                                        return (
                                            <div key={transaction.id} className={`transaction-card-modern ${isExpanded ? 'expanded' : ''}`}>
                                                <div className="transaction-card-main" onClick={() => setExpandedId(isExpanded ? null : transaction.id)}>
                                                    <div className="transaction-icon-wrapper" style={{ backgroundColor: typeBgColor, color: typeColor }}>
                                                        <TypeIcon />
                                                    </div>
                                                    <div className="transaction-content">
                                                        <div className="transaction-header-modern">
                                                            <div className="transaction-title-section">
                                                                <h4 className="transaction-title">{getTypeLabel(transaction.type)}</h4>
                                                                {transaction.description && (
                                                                    <p className="transaction-description">{transaction.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="transaction-amount-section">
                                                                <span className={`transaction-amount-modern ${isPositiveAmount ? 'positive' : 'negative'}`}>
                                                                    {isPositiveAmount ? '+' : '-'}
                                                                    {formatPrice(Math.abs(transaction.amount))}
                                                                </span>
                                                                <span className="transaction-status-badge" style={{ color: statusColor, backgroundColor: `${statusColor}15` }}>
                                                                    <StatusIcon />
                                                                    {getStatusLabel(transaction.status)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="transaction-meta-modern">
                                                            <div className="meta-item">
                                                                <FiClock className="meta-icon" />
                                                                <span>{formatDate(transaction.created_at)}</span>
                                                            </div>
                                                            {transaction.order_number && (
                                                                <div className="meta-item">
                                                                    <FiPackage className="meta-icon" />
                                                                    <Link
                                                                        to={`/user/orders/${transaction.order_id}`}
                                                                        className="meta-link"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        Sipariş #{transaction.order_number}
                                                                    </Link>
                                                                </div>
                                                            )}
                                                            {transaction.project_titles && (
                                                                <div className="meta-item">
                                                                    <FiTag className="meta-icon" />
                                                                    <span className="meta-text">{transaction.project_titles}</span>
                                                                </div>
                                                            )}
                                                            {transaction.transaction_id && (
                                                                <div className="meta-item">
                                                                    <FiFileText className="meta-icon" />
                                                                    <span className="meta-text transaction-id">{transaction.transaction_id}</span>
                                                                </div>
                                                            )}
                                                            {transaction.payment_method && (
                                                                <div className="meta-item">
                                                                    {(() => {
                                                                        const PaymentIcon = getPaymentMethodIcon(transaction.payment_method);
                                                                        return PaymentIcon ? <PaymentIcon className="meta-icon" /> : <FiCreditCard className="meta-icon" />;
                                                                    })()}
                                                                    <span className="meta-text payment-method-meta">{getPaymentMethodLabel(transaction.payment_method)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="transaction-expand-icon">
                                                        {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="transaction-details-modern">
                                                        <div className="details-grid">
                                                            <div className="detail-item">
                                                                <span className="detail-label">
                                                                    <FiInfo className="detail-icon" />
                                                                    İşlem ID
                                                                </span>
                                                                <span className="detail-value">{transaction.id}</span>
                                                            </div>
                                                            {transaction.transaction_id && (
                                                                <div className="detail-item">
                                                                    <span className="detail-label">
                                                                        <FiFileText className="detail-icon" />
                                                                        Transaction ID
                                                                    </span>
                                                                    <span className="detail-value transaction-id-value">{transaction.transaction_id}</span>
                                                                </div>
                                                            )}
                                                            <div className="detail-item">
                                                                <span className="detail-label">
                                                                    <FiCalendar className="detail-icon" />
                                                                    Tarih
                                                                </span>
                                                                <span className="detail-value">{formatFullDate(transaction.created_at)}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <span className="detail-label">
                                                                    <FiTag className="detail-icon" />
                                                                    İşlem Tipi
                                                                </span>
                                                                <span className="detail-value type-badge" style={{ backgroundColor: typeBgColor, color: typeColor }}>
                                                                    {getTypeLabel(transaction.type)}
                                                                </span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <span className="detail-label">
                                                                    <FiDollarSign className="detail-icon" />
                                                                    Tutar
                                                                </span>
                                                                <span className={`detail-value amount-detail ${isPositiveAmount ? 'positive' : 'negative'}`}>
                                                                    {isPositiveAmount ? '+' : '-'}
                                                                    {formatPrice(Math.abs(transaction.amount))}
                                                                </span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <span className="detail-label">
                                                                    <StatusIcon className="detail-icon" />
                                                                    Durum
                                                                </span>
                                                                <span className="detail-value status-badge-detail" style={{ color: statusColor }}>
                                                                    {getStatusLabel(transaction.status)}
                                                                </span>
                                                            </div>
                                                            {transaction.payment_method && (
                                                                <div className="detail-item">
                                                                    <span className="detail-label">
                                                                        {(() => {
                                                                            const PaymentIcon = getPaymentMethodIcon(transaction.payment_method);
                                                                            return PaymentIcon ? <PaymentIcon className="detail-icon" /> : <FiCreditCard className="detail-icon" />;
                                                                        })()}
                                                                        Ödeme Şekli
                                                                    </span>
                                                                    <span className="detail-value payment-method-badge">
                                                                        {getPaymentMethodLabel(transaction.payment_method)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {transaction.description && (
                                                                <div className="detail-item full-width">
                                                                    <span className="detail-label">
                                                                        <FiInfo className="detail-icon" />
                                                                        Açıklama
                                                                    </span>
                                                                    <span className="detail-value">{transaction.description}</span>
                                                                </div>
                                                            )}
                                                            {transaction.order_id && (
                                                                <div className="detail-item full-width">
                                                                    <span className="detail-label">
                                                                        <FiPackage className="detail-icon" />
                                                                        Sipariş Detayı
                                                                    </span>
                                                                    <Link
                                                                        to={`/user/orders/${transaction.order_id}`}
                                                                        className="detail-link"
                                                                    >
                                                                        Sipariş #{transaction.order_number || transaction.order_id} - Detayları Görüntüle
                                                                        <FiChevronRight />
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
};

export default UserTransactions;

