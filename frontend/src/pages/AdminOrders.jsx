import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiShoppingBag, FiSearch, FiFilter, FiEye, FiCheckCircle, 
    FiXCircle, FiClock, FiDollarSign, FiUser, FiCalendar, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import './AdminOrders.css';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [filter, searchTerm]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/orders');
            let fetchedOrders = response.data.orders || [];
            
            // Filter by status
            let filtered = filter !== 'all' 
                ? fetchedOrders.filter(o => o.order_status === filter || o.payment_status === filter)
                : fetchedOrders;
            
            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(o => 
                    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.username?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            setOrders(filtered);
        } catch (error) {
            console.error('Orders load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount, currency = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-orders-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-orders-page">
                <div className="admin-header-minimal">
                    <div>
                        <h1 className="page-title-advanced">Sipariş Yönetimi</h1>
                        <p className="page-subtitle-advanced">Tüm siparişleri görüntüleyin ve yönetin</p>
                    </div>
                </div>

                <div className="admin-filters-minimal">
                    <div className="search-box-minimal">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Sipariş ara..."
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
                            className={`filter-tab-minimal ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            <FiClock /> Bekleyen
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            <FiCheckCircle /> Tamamlanan
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'paid' ? 'active' : ''}`}
                            onClick={() => setFilter('paid')}
                        >
                            <FiDollarSign /> Ödenen
                        </button>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="orders-table desktop-view">
                    <table>
                        <thead>
                            <tr>
                                <th>Sipariş No</th>
                                <th>Müşteri</th>
                                <th>Tutar</th>
                                <th>Ödeme Durumu</th>
                                <th>Sipariş Durumu</th>
                                <th>Tarih</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <strong>{order.order_number}</strong>
                                    </td>
                                    <td>
                                        <div className="user-info-cell">
                                            <FiUser />
                                            <span>{order.username || 'Misafir'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{formatCurrency(order.final_amount, order.currency)}</strong>
                                    </td>
                                    <td>
                                        <span className={`status-badge-minimal ${order.payment_status}`}>
                                            {order.payment_status === 'paid' ? 'Ödendi' : 
                                             order.payment_status === 'pending' ? 'Bekliyor' :
                                             order.payment_status === 'failed' ? 'Başarısız' : 'İade'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge-minimal ${order.order_status}`}>
                                            {order.order_status === 'completed' ? 'Tamamlandı' :
                                             order.order_status === 'processing' ? 'İşleniyor' :
                                             order.order_status === 'pending' ? 'Bekliyor' : 'İptal'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <FiCalendar />
                                            {formatDate(order.created_at)}
                                        </div>
                                    </td>
                                    <td>
                                        <Link
                                            to={`/admin/orders/${order.id}`}
                                            className="btn-view-minimal"
                                        >
                                            <FiEye /> Detay
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="orders-mobile mobile-view">
                    {orders.map(order => {
                        const isExpanded = expandedOrderId === order.id;
                        return (
                            <div 
                                key={order.id} 
                                className={`order-card-mobile ${isExpanded ? 'expanded' : ''}`}
                            >
                                <div 
                                    className="order-card-header"
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                >
                                    <div className="order-card-main-info">
                                        <div className="order-number-mobile">
                                            <strong>{order.order_number}</strong>
                                        </div>
                                        <div className="order-amount-mobile">
                                            {formatCurrency(order.final_amount, order.currency)}
                                        </div>
                                    </div>
                                    <div className="order-card-status-row">
                                        <span className={`status-badge-minimal ${order.payment_status}`}>
                                            {order.payment_status === 'paid' ? 'Ödendi' : 
                                             order.payment_status === 'pending' ? 'Bekliyor' :
                                             order.payment_status === 'failed' ? 'Başarısız' : 'İade'}
                                        </span>
                                        <span className={`status-badge-minimal ${order.order_status}`}>
                                            {order.order_status === 'completed' ? 'Tamamlandı' :
                                             order.order_status === 'processing' ? 'İşleniyor' :
                                             order.order_status === 'pending' ? 'Bekliyor' : 'İptal'}
                                        </span>
                                    </div>
                                    <button className="order-expand-btn">
                                        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                    </button>
                                </div>
                                
                                {isExpanded && (
                                    <div className="order-card-details">
                                        <div className="order-detail-row">
                                            <span className="detail-label">
                                                <FiUser /> Müşteri
                                            </span>
                                            <span className="detail-value">{order.username || 'Misafir'}</span>
                                        </div>
                                        <div className="order-detail-row">
                                            <span className="detail-label">
                                                <FiCalendar /> Tarih
                                            </span>
                                            <span className="detail-value">{formatDate(order.created_at)}</span>
                                        </div>
                                        <div className="order-card-actions">
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="btn-view-minimal btn-full-width"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FiEye /> Detayları Görüntüle
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {orders.length === 0 && (
                    <div className="empty-state-minimal">
                        <FiShoppingBag />
                        <p>Sipariş bulunamadı</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminOrders;

