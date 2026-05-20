import { useState, useEffect } from 'react';
import SellerLayout from '../components/SellerLayout';
import { sellerAPI } from '../api/seller';
import {
    FiUsers, FiShoppingBag, FiDollarSign, FiMail, FiCalendar,
    FiSearch, FiFilter, FiEye, FiTrendingUp, FiUser
} from 'react-icons/fi';
import './SellerCustomers.css';

const SellerCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('total_earnings');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getCustomers();
            setCustomers(response.data.customers || []);
        } catch (error) {
            console.error('Customers load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return `₺${parseFloat(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const filteredAndSortedCustomers = customers
        .filter(customer => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            return (
                customer.username?.toLowerCase().includes(search) ||
                customer.email?.toLowerCase().includes(search)
            );
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'total_earnings':
                    return parseFloat(b.total_earnings || 0) - parseFloat(a.total_earnings || 0);
                case 'total_spent':
                    return parseFloat(b.total_spent || 0) - parseFloat(a.total_spent || 0);
                case 'order_count':
                    return (b.order_count || 0) - (a.order_count || 0);
                case 'name':
                    return (a.username || '').localeCompare(b.username || '');
                case 'date':
                    return new Date(b.created_at) - new Date(a.created_at);
                default:
                    return 0;
            }
        });

    const totalCustomers = customers.length;
    const totalEarnings = customers.reduce((sum, c) => sum + parseFloat(c.total_earnings || 0), 0);
    const totalDonations = customers.reduce((sum, c) => sum + parseFloat(c.total_donation || 0), 0);

    if (loading) {
        return (
            <SellerLayout>
                <div className="customers-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="customers-page">
                <div className="customers-header">
                    <div className="header-content">
                        <h1 className="page-title">Müşterilerim</h1>
                        <p className="page-subtitle">Projelerinizi satın alan veya bağış yapan müşteriler</p>
                    </div>
                    <div className="header-stats">
                        <div className="header-stat">
                            <FiUsers className="stat-icon" />
                            <div>
                                <div className="stat-value">{totalCustomers}</div>
                                <div className="stat-label">Toplam Müşteri</div>
                            </div>
                        </div>
                        <div className="header-stat">
                            <FiDollarSign className="stat-icon" />
                            <div>
                                <div className="stat-value">{formatCurrency(totalEarnings)}</div>
                                <div className="stat-label">Toplam Kazanç</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="customers-filters">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Müşteri ara (isim, e-posta)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="sort-selector">
                        <FiFilter className="filter-icon" />
                        <select
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="total_earnings">Kazancım</option>
                            <option value="total_spent">Toplam Harcama</option>
                            <option value="order_count">Sipariş Sayısı</option>
                            <option value="name">İsme Göre</option>
                            <option value="date">Kayıt Tarihi</option>
                        </select>
                    </div>
                </div>

                {filteredAndSortedCustomers.length === 0 ? (
                    <div className="empty-state">
                        <FiUsers className="empty-icon" />
                        <h3>Müşteri Bulunamadı</h3>
                        <p>{searchTerm ? 'Arama kriterlerinize uygun müşteri yok.' : 'Henüz müşteriniz bulunmuyor.'}</p>
                    </div>
                ) : (
                    <div className="customers-grid">
                        {filteredAndSortedCustomers.map(customer => {
                            // Kartta gösterilecek: Satış varsa kazanç, yoksa bağış
                            const hasSales = customer.total_earnings > 0;
                            const hasDonation = customer.total_donation > 0;
                            
                            return (
                                <div key={customer.id} className="customer-card">
                                    <div className="customer-header">
                                        <div className="customer-avatar">
                                            <FiUser />
                                        </div>
                                        <div className="customer-info">
                                            <h3 className="customer-name">{customer.username || 'İsimsiz'}</h3>
                                            <p className="customer-email">{customer.email}</p>
                                        </div>
                                    </div>
                                    <div className="customer-stats">
                                        <div className="customer-stat">
                                            <FiShoppingBag className="stat-icon-small" />
                                            <div>
                                                <div className="stat-value-small">{customer.order_count || 0}</div>
                                                <div className="stat-label-small">Sipariş</div>
                                            </div>
                                        </div>
                                        {hasSales ? (
                                            <div className="customer-stat customer-earning">
                                                <FiTrendingUp className="stat-icon-small" />
                                                <div>
                                                    <div className="stat-value-small earning-value">{formatCurrency(customer.total_earnings || 0)}</div>
                                                    <div className="stat-label-small">Kazancım</div>
                                                </div>
                                            </div>
                                        ) : hasDonation ? (
                                            <div className="customer-stat customer-donation">
                                                <FiDollarSign className="stat-icon-small" />
                                                <div>
                                                    <div className="stat-value-small donation-value">{formatCurrency(customer.total_donation || 0)}</div>
                                                    <div className="stat-label-small">Bağış</div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="customer-footer">
                                        <div className="customer-date">
                                            <FiCalendar className="date-icon" />
                                            <span>Kayıt: {formatDate(customer.created_at)}</span>
                                        </div>
                                        <button
                                            className="btn-detail"
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setShowDetailModal(true);
                                            }}
                                        >
                                            <FiEye /> Detaylar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showDetailModal && selectedCustomer && (
                    <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                        <div className="modal-content customer-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Müşteri Detayları</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="customer-detail-content">
                                    <div className="detail-section">
                                        <div className="detail-avatar-large">
                                            <FiUser />
                                        </div>
                                        <div className="detail-info">
                                            <h4>{selectedCustomer.username || 'İsimsiz'}</h4>
                                            <p className="detail-email">{selectedCustomer.email}</p>
                                        </div>
                                    </div>

                                    <div className="detail-stats-grid">
                                        <div className="detail-stat-card">
                                            <div className="detail-stat-icon">
                                                <FiShoppingBag />
                                            </div>
                                            <div className="detail-stat-content">
                                                <div className="detail-stat-label">Toplam Sipariş</div>
                                                <div className="detail-stat-value">{selectedCustomer.order_count || 0}</div>
                                            </div>
                                        </div>
                                        {selectedCustomer.total_earnings > 0 && (
                                            <div className="detail-stat-card detail-earning-card">
                                                <div className="detail-stat-icon earning-icon">
                                                    <FiTrendingUp />
                                                </div>
                                                <div className="detail-stat-content">
                                                    <div className="detail-stat-label">Kazancım</div>
                                                    <div className="detail-stat-value earning-highlight">{formatCurrency(selectedCustomer.total_earnings || 0)}</div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="detail-stat-card">
                                            <div className="detail-stat-icon">
                                                <FiDollarSign />
                                            </div>
                                            <div className="detail-stat-content">
                                                <div className="detail-stat-label">Bağış</div>
                                                <div className="detail-stat-value">{formatCurrency(selectedCustomer.total_donation || 0)}</div>
                                            </div>
                                        </div>
                                        <div className="detail-stat-card">
                                            <div className="detail-stat-icon">
                                                <FiCalendar />
                                            </div>
                                            <div className="detail-stat-content">
                                                <div className="detail-stat-label">Kayıt Tarihi</div>
                                                <div className="detail-stat-value">{formatDate(selectedCustomer.created_at)}</div>
                                            </div>
                                        </div>
                                    </div>
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
            </div>
        </SellerLayout>
    );
};

export default SellerCustomers;
