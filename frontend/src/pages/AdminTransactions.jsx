import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import {
    FiDollarSign, FiSearch, FiFilter, FiTrendingUp, FiTrendingDown,
    FiUser, FiCalendar, FiCreditCard, FiShoppingBag, FiGift, FiChevronDown, FiChevronRight, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import './AdminTransactions.css';

const AdminTransactions = () => {
    const [allTransactions, setAllTransactions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [groupedTransactions, setGroupedTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });

    const [expandedOrders, setExpandedOrders] = useState({});

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        if (allTransactions.length > 0) {
            applyFilters();
        }
    }, [allTransactions, filter, searchTerm, dateRange, amountRange]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/transactions');
            const data = response.data.transactions || [];
            setAllTransactions(data);
        } catch (error) {
            console.error('Transactions load error:', error);
            setAllTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...allTransactions];

        // 1. Type
        if (filter !== 'all') {
            result = result.filter(t => t.type === filter);
        }

        // 2. Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.transaction_id?.toLowerCase().includes(term) ||
                t.username?.toLowerCase().includes(term) ||
                t.description?.toLowerCase().includes(term) ||
                (t.order_number && t.order_number.toLowerCase().includes(term))
            );
        }

        // 3. Date Range
        if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            result = result.filter(t => new Date(t.created_at) >= startDate);
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            result = result.filter(t => new Date(t.created_at) <= endDate);
        }

        // 4. Amount Range
        if (amountRange.min !== '') {
            const min = parseFloat(amountRange.min);
            result = result.filter(t => Math.abs(t.amount) >= min);
        }
        if (amountRange.max !== '') {
            const max = parseFloat(amountRange.max);
            result = result.filter(t => Math.abs(t.amount) <= max);
        }

        setTransactions(result);
        groupData(result);
    };

    const clearAdvancedFilters = () => {
        setDateRange({ start: '', end: '' });
        setAmountRange({ min: '', max: '' });
        setSearchTerm('');
        setFilter('all');
    };


    const groupData = (data) => {
        const groups = {};
        const singles = [];

        data.forEach(t => {
            if (t.order_id) {
                if (!groups[t.order_id]) {
                    groups[t.order_id] = {
                        main: null,
                        children: [],
                        order_number: t.order_number,
                        timestamp: t.created_at
                    };
                }

                // Set 'purchase' as main, others as children
                if (t.type === 'purchase') {
                    groups[t.order_id].main = t;
                } else {
                    groups[t.order_id].children.push(t);
                }
            } else {
                singles.push(t);
            }
        });

        // Convert groups logic to array, if main is missing but has children (e.g. order deleted?), handle it
        const result = [];

        // Process groups
        Object.values(groups).forEach(g => {
            if (g.main) {
                result.push({
                    ...g.main,
                    isGroup: true,
                    related: g.children
                });
            } else if (g.children.length > 0) {
                // Orphaned sub-transactions (maybe manual adjustment or purchase deleted?)
                // Treat them as singles for now or create a dummy parent
                g.children.forEach(c => result.push(c));
            }
        });

        // Add singles
        singles.forEach(s => result.push(s));

        // Sort by date desc
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setGroupedTransactions(result);
    };

    const toggleExpand = (id) => {
        setExpandedOrders(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const formatDate = (dateString, full = false) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (full) {
            return date.toLocaleString('tr-TR', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatCurrency = (amount, currency = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'purchase': return <FiShoppingBag className="icon-purchase" />;
            case 'sale': return <FiTrendingUp className="icon-sale" />;
            case 'commission': return <FiCheckCircle className="icon-commission" />;
            case 'tax': return <FiDollarSign className="icon-tax" />; // KDV için
            case 'donation': return <FiGift className="icon-donation" />;
            default: return <FiCreditCard />;
        }
    };

    const getTransactionTypeLabel = (type) => {
        const labels = {
            purchase: 'Satın Alma',
            sale: 'Satış (Hakediş)',
            commission: 'Komisyon Geliri',
            tax: 'KDV Geliri',
            payout: 'Ödeme',
            refund: 'İade',
            donation: 'Bağış'
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-transactions-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-transactions-page">
                <div className="admin-header-minimal">
                    <div>
                        <h1 className="page-title-advanced">İşlem Yönetimi</h1>
                        <p className="page-subtitle-advanced">Finansal hareketler ve detayları</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className={`btn-advanced-filter ${showAdvancedFilters ? 'active' : ''}`}
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            <FiFilter /> Gelişmiş Filtre
                        </button>
                    </div>
                </div>

                {showAdvancedFilters && (
                    <div className="advanced-filter-panel">
                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Tarih Aralığı</label>
                                <div className="date-inputs">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                    <span>-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>Tutar Aralığı</label>
                                <div className="amount-inputs">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={amountRange.min}
                                        onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                                    />
                                    <span>-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={amountRange.max}
                                        onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="filter-actions-row">
                                <button className="btn-clear-filters" onClick={clearAdvancedFilters}>
                                    <FiX /> Temizle
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="admin-filters-minimal">
                    <div className="search-box-minimal">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="İşlem No, Sipariş No veya Kullanıcı ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab-minimal ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Tümü
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'purchase' ? 'active' : ''}`}
                            onClick={() => setFilter('purchase')}
                        >
                            <FiShoppingBag /> Satın Alma
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'sale' ? 'active' : ''}`}
                            onClick={() => setFilter('sale')}
                        >
                            <FiTrendingUp /> Satış
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'commission' ? 'active' : ''}`}
                            onClick={() => setFilter('commission')}
                        >
                            <FiDollarSign /> Komisyon
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'tax' ? 'active' : ''}`}
                            onClick={() => setFilter('tax')}
                        >
                            <FiDollarSign /> KDV
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'donation' ? 'active' : ''}`}
                            onClick={() => setFilter('donation')}
                        >
                            <FiGift /> Bağış
                        </button>
                    </div>
                </div>

                <div className="transactions-table-wrapper">
                    <table className="transactions-table-advanced">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}></th>
                                <th>İşlem / Sipariş No</th>
                                <th>Kullanıcı</th>
                                <th>Tip</th>
                                <th>Tutar</th>
                                <th>Durum</th>
                                <th>Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedTransactions.map(item => (
                                <>
                                    <tr
                                        key={item.id}
                                        className={`main-transaction-row ${item.isGroup ? 'expandable' : ''} ${item.type}`}
                                        onClick={() => item.isGroup && toggleExpand(item.id)}
                                    >
                                        <td className="expand-icon-cell">
                                            {item.isGroup && (
                                                <button className="btn-expand">
                                                    {expandedOrders[item.id] ? <FiChevronDown /> : <FiChevronRight />}
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <div className="transaction-id-group">
                                                <strong>{item.transaction_id || `#${item.id}`}</strong>
                                                {item.order_number && <span className="order-ref">{item.order_number}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="user-avatar-text">{item.username ? item.username.charAt(0).toUpperCase() : '?'}</div>
                                                <div className="user-details">
                                                    <span className="username">{item.username || 'Misafir'}</span>
                                                    <span className="role-badge">{item.user_role || 'User'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="transaction-type-badge">
                                                {getTransactionIcon(item.type)}
                                                <span>{getTransactionTypeLabel(item.type)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <strong className={`amount ${item.amount < 0 ? 'negative' : 'positive'}`}>
                                                {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount, item.currency)}
                                            </strong>
                                        </td>
                                        <td>
                                            <span className={`status-badge-modern ${item.status}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="date-cell">
                                            {formatDate(item.created_at)}
                                        </td>
                                    </tr>

                                    {/* Sub Transactions (Accordion Body) */}
                                    {item.isGroup && expandedOrders[item.id] && item.related && item.related.map(sub => (
                                        <tr key={sub.id} className="sub-transaction-row">
                                            <td colSpan="2" className="sub-spacer-col">
                                                <div className="sub-connector"></div>
                                            </td>
                                            <td>
                                                <div className="sub-user">
                                                    <FiUser className="tiny-icon" /> {sub.username}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="sub-type">
                                                    {getTransactionIcon(sub.type)}
                                                    {getTransactionTypeLabel(sub.type)}
                                                </div>
                                                <div className="sub-desc">{sub.description}</div>
                                            </td>
                                            <td>
                                                <span className={`sub-amount ${sub.amount < 0 ? 'negative' : 'positive'}`}>
                                                    {sub.amount > 0 ? '+' : ''}{formatCurrency(sub.amount, sub.currency)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="sub-status"><FiCheckCircle /> Tamamlandı</span>
                                            </td>
                                            <td className="sub-date">
                                                {formatDate(sub.created_at, true).split(' ')[1]} {/* Just Time */}
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>

                {transactions.length === 0 && (
                    <div className="empty-state-minimal">
                        <FiDollarSign />
                        <p>İşlem bulunamadı</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminTransactions;

