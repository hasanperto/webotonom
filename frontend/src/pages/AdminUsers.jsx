import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiSearch, FiUser, FiMail, FiShield, FiCheckCircle, FiXCircle, FiClock,
    FiUsers, FiTrendingUp, FiZap, FiFilter, FiRefreshCw, FiEdit, FiSettings, FiMoreVertical,
    FiEye, FiTrash2, FiLock, FiUnlock, FiX, FiSave, FiPackage, FiShoppingCart,
    FiDollarSign, FiActivity, FiBarChart2, FiInfo, FiTrendingDown
} from 'react-icons/fi';
import './AdminUsers.css';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [userProjects, setUserProjects] = useState([]);
    const [userOrders, setUserOrders] = useState([]);
    const [userSales, setUserSales] = useState([]);
    const [userTransactions, setUserTransactions] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loadingTab, setLoadingTab] = useState(false);
    const [editActiveTab, setEditActiveTab] = useState('basic');
    const [editFormData, setEditFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role_id: 2,
        status: 'active',
        balance: 0,
        bio: '',
        website: '',
        location: '',
        email_verified: false,
        two_factor_enabled: false
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Users load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        if (confirm(`Kullanıcı durumunu "${newStatus}" olarak değiştirmek istediğinize emin misiniz?`)) {
            try {
                await api.put(`/admin/users/${userId}/status`, { status: newStatus });
                loadUsers();
            } catch (error) {
                alert(error.response?.data?.error || 'Durum güncellenemedi');
            }
        }
    };

    const handleViewDetails = async (user) => {
        setSelectedUser(user);
        setShowDetailModal(true);
        setActiveTab('general');
        // İlk tab için verileri yükle
        await loadUserData(user.id, 'general');
    };

    const loadUserData = async (userId, tab) => {
        if (!userId) return;
        
        setLoadingTab(true);
        try {
            switch (tab) {
                case 'projects': {
                    const projectsRes = await api.get(`/admin/users/${userId}/projects`);
                    setUserProjects(projectsRes.data.projects || []);
                    break;
                }
                case 'orders': {
                    const ordersRes = await api.get(`/admin/users/${userId}/orders`);
                    setUserOrders(ordersRes.data.orders || []);
                    break;
                }
                case 'sales': {
                    const salesRes = await api.get(`/admin/users/${userId}/sales`);
                    setUserSales(salesRes.data.sales || []);
                    break;
                }
                case 'transactions': {
                    const transactionsRes = await api.get(`/admin/users/${userId}/transactions`);
                    setUserTransactions(transactionsRes.data.transactions || []);
                    break;
                }
                case 'reports': {
                    const statsRes = await api.get(`/admin/users/${userId}/stats`);
                    setUserStats(statsRes.data);
                    break;
                }
                default:
                    break;
            }
        } catch (error) {
            console.error(`Load ${tab} error:`, error);
        } finally {
            setLoadingTab(false);
        }
    };

    const handleTabChange = async (tab) => {
        setActiveTab(tab);
        if (selectedUser) {
            await loadUserData(selectedUser.id, tab);
        }
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setEditFormData({
            username: user.username || '',
            email: user.email || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            role_id: user.role_id || 2,
            status: user.status || 'active',
            balance: user.balance || 0,
            bio: user.bio || '',
            website: user.website || '',
            location: user.location || '',
            email_verified: user.email_verified || false,
            two_factor_enabled: user.two_factor_enabled || false
        });
        setEditActiveTab('basic');
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            await api.put(`/admin/users/${selectedUser.id}`, editFormData);
            setShowEditModal(false);
            loadUsers();
            alert('Kullanıcı başarıyla güncellendi!');
        } catch (error) {
            alert(error.response?.data?.error || 'Kullanıcı güncellenemedi');
        }
    };

    const handleBan = async (userId) => {
        if (confirm('Bu kullanıcıyı yasaklamak istediğinize emin misiniz?')) {
            try {
                await api.put(`/admin/users/${userId}/status`, { status: 'banned' });
                loadUsers();
            } catch (error) {
                alert(error.response?.data?.error || 'Kullanıcı yasaklanamadı');
            }
        }
    };

    const handleUnban = async (userId) => {
        if (confirm('Bu kullanıcının yasağını kaldırmak istediğinize emin misiniz?')) {
            try {
                await api.put(`/admin/users/${userId}/unban`);
                loadUsers();
            } catch (error) {
                alert(error.response?.data?.error || 'Yasak kaldırılamadı');
            }
        }
    };

    const handleDelete = async (userId) => {
        if (confirm('Bu kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
            try {
                await api.delete(`/admin/users/${userId}`);
                loadUsers();
                alert('Kullanıcı başarıyla silindi!');
            } catch (error) {
                alert(error.response?.data?.error || 'Kullanıcı silinemedi');
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        const matchesRole = roleFilter === 'all' || 
                           (user.role_slug || user.role_name?.toLowerCase()) === roleFilter;
        return matchesSearch && matchesStatus && matchesRole;
    });

    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        pending: users.filter(u => u.status === 'pending').length,
        banned: users.filter(u => u.status === 'banned').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        admin: users.filter(u => (u.role_slug || u.role_name?.toLowerCase()) === 'admin').length,
        seller: users.filter(u => (u.role_slug || u.role_name?.toLowerCase()) === 'seller').length,
        user: users.filter(u => (u.role_slug || u.role_name?.toLowerCase()) === 'user' || !u.role_slug).length
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('tr-TR').format(num || 0);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-users-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-users-page">
                {/* Header */}
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Kullanıcı Yönetimi</h1>
                        <p className="page-subtitle-advanced">Tüm kullanıcıları görüntüle ve yönet</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadUsers}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="admin-stats-grid-advanced">
                    <div className="stat-card-advanced users-card">
                        <div className="stat-icon-wrapper users">
                            <FiUsers className="stat-icon" />
                            <div className="stat-icon-bg"></div>
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Toplam Kullanıcı</span>
                            <span className="stat-value-advanced">{formatNumber(stats.total)}</span>
                            <div className="stat-footer">
                                <span className="stat-change positive">
                                    <FiTrendingUp /> {formatNumber(stats.active)} aktif
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card-advanced active-card">
                        <div className="stat-icon-wrapper active">
                            <FiCheckCircle className="stat-icon" />
                            <div className="stat-icon-bg"></div>
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Aktif Kullanıcı</span>
                            <span className="stat-value-advanced">{formatNumber(stats.active)}</span>
                            <div className="stat-footer">
                                <span className="stat-change positive">
                                    %{Math.round((stats.active / (stats.total || 1)) * 100)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card-advanced pending-card">
                        <div className="stat-icon-wrapper pending">
                            <FiClock className="stat-icon" />
                            <div className="stat-icon-bg"></div>
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Beklemede</span>
                            <span className="stat-value-advanced">{formatNumber(stats.pending)}</span>
                            <div className="stat-footer">
                                <span className="stat-change warning">
                                    Onay bekliyor
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card-advanced banned-card">
                        <div className="stat-icon-wrapper banned">
                            <FiXCircle className="stat-icon" />
                            <div className="stat-icon-bg"></div>
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Yasaklı</span>
                            <span className="stat-value-advanced">{formatNumber(stats.banned)}</span>
                            <div className="stat-footer">
                                <span className="stat-change negative">
                                    Engellenmiş
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="admin-filters-section">
                    <div className="search-box-advanced">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Kullanıcı adı veya e-posta ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-advanced"
                        />
                    </div>
                    <div className="filter-buttons-advanced">
                        <button 
                            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            Tümü
                        </button>
                        <button 
                            className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('active')}
                        >
                            <FiCheckCircle /> Aktif
                        </button>
                        <button 
                            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('pending')}
                        >
                            <FiClock /> Beklemede
                        </button>
                        <button 
                            className={`filter-btn ${statusFilter === 'banned' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('banned')}
                        >
                            <FiXCircle /> Yasaklı
                        </button>
                    </div>
                    <div className="filter-buttons-advanced">
                        <button 
                            className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setRoleFilter('all')}
                        >
                            Tüm Roller
                        </button>
                        <button 
                            className={`filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
                            onClick={() => setRoleFilter('admin')}
                        >
                            <FiShield /> Admin
                        </button>
                        <button 
                            className={`filter-btn ${roleFilter === 'seller' ? 'active' : ''}`}
                            onClick={() => setRoleFilter('seller')}
                        >
                            <FiUser /> Satıcı
                        </button>
                        <button 
                            className={`filter-btn ${roleFilter === 'user' ? 'active' : ''}`}
                            onClick={() => setRoleFilter('user')}
                        >
                            <FiUser /> Kullanıcı
                        </button>
                    </div>
                </div>

                {/* Users List */}
                {filteredUsers.length === 0 ? (
                    <div className="empty-state-advanced">
                        <FiUser className="empty-icon" />
                        <h3>Kullanıcı bulunamadı</h3>
                        <p>Arama kriterlerinize uygun kullanıcı yok.</p>
                    </div>
                ) : (
                    <div className="users-list-advanced">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="user-card-advanced">
                                <div className="user-main-advanced">
                                    <div className={`user-avatar-advanced ${user.status}`}>
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.username} />
                                        ) : (
                                            <FiUser />
                                        )}
                                        <div className={`user-status-indicator ${user.status}`}></div>
                                    </div>
                                    <div className="user-info-advanced">
                                        <div className="user-header-advanced">
                                            <h3 className="user-name-advanced">{user.username}</h3>
                                            <span className={`role-badge-advanced ${user.role_slug || user.role_name?.toLowerCase() || 'user'}`}>
                                                {user.role_name || user.role_slug || 'Kullanıcı'}
                                            </span>
                                        </div>
                                        <div className="user-meta-advanced">
                                            <span className="user-email-advanced">
                                                <FiMail /> {user.email}
                                            </span>
                                            <span className="user-date-advanced">
                                                {new Date(user.created_at).toLocaleDateString('tr-TR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="user-actions-advanced">
                                        <div className="action-buttons-group">
                                            <button
                                                className="action-btn btn-view"
                                                onClick={() => handleViewDetails(user)}
                                                title="Detayları Gör"
                                            >
                                                <FiEye />
                                            </button>
                                            <button
                                                className="action-btn btn-edit"
                                                onClick={() => handleEdit(user)}
                                                title="Düzenle"
                                            >
                                                <FiSettings />
                                            </button>
                                            {user.status === 'banned' ? (
                                                <button
                                                    className="action-btn btn-unban"
                                                    onClick={() => handleUnban(user.id)}
                                                    title="Yasağı Kaldır"
                                                >
                                                    <FiUnlock />
                                                </button>
                                            ) : (
                                                <button
                                                    className="action-btn btn-ban"
                                                    onClick={() => handleBan(user.id)}
                                                    title="Yasakla"
                                                >
                                                    <FiLock />
                                                </button>
                                            )}
                                            <button
                                                className="action-btn btn-delete"
                                                onClick={() => handleDelete(user.id)}
                                                title="Sil"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                        <select
                                            value={user.status}
                                            onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                            className={`status-select-advanced ${user.status}`}
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Pasif</option>
                                            <option value="banned">Yasaklı</option>
                                            <option value="pending">Beklemede</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {showDetailModal && selectedUser && (
                    <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                        <div className="modal-content user-detail-modal-advanced" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-header-user">
                                    <div className="user-detail-avatar-small">
                                        {selectedUser.avatar ? (
                                            <img src={selectedUser.avatar} alt={selectedUser.username} />
                                        ) : (
                                            <FiUser />
                                        )}
                                    </div>
                                    <div>
                                        <h2>{selectedUser.username}</h2>
                                        <p className="user-detail-subtitle">
                                            {selectedUser.email} • {selectedUser.role_name || selectedUser.role_slug || 'Kullanıcı'}
                                        </p>
                                    </div>
                                </div>
                                <button className="btn-icon" onClick={() => setShowDetailModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            
                            {/* Tabs */}
                            <div className="user-detail-tabs">
                                <button 
                                    className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('general')}
                                >
                                    <FiInfo /> Genel Bilgiler
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('projects')}
                                >
                                    <FiPackage /> Projeler ({userProjects.length})
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('orders')}
                                >
                                    <FiShoppingCart /> Satın Alımlar ({userOrders.length})
                                </button>
                                {(selectedUser.role_slug === 'seller' || selectedUser.role_id === 3) && (
                                    <button 
                                        className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                                        onClick={() => handleTabChange('sales')}
                                    >
                                        <FiDollarSign /> Satışlar ({userSales.length})
                                    </button>
                                )}
                                <button 
                                    className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('transactions')}
                                >
                                    <FiActivity /> İşlemler ({userTransactions.length})
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('reports')}
                                >
                                    <FiBarChart2 /> Raporlar
                                </button>
                            </div>

                            <div className="modal-body">
                                {loadingTab ? (
                                    <div className="loading-container">
                                        <div className="spinner-large"></div>
                                    </div>
                                ) : (
                                    <>
                                        {/* General Tab */}
                                        {activeTab === 'general' && (
                                            <div className="user-detail-content">
                                                <div className="user-detail-info-grid">
                                                    <div className="detail-section">
                                                        <h3>Kişisel Bilgiler</h3>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Kullanıcı Adı:</span>
                                                            <span className="detail-value">{selectedUser.username}</span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">E-posta:</span>
                                                            <span className="detail-value">{selectedUser.email}</span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Ad Soyad:</span>
                                                            <span className="detail-value">
                                                                {selectedUser.first_name || '-'} {selectedUser.last_name || ''}
                                                            </span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Telefon:</span>
                                                            <span className="detail-value">{selectedUser.phone || '-'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="detail-section">
                                                        <h3>Hesap Bilgileri</h3>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Rol:</span>
                                                            <span className={`role-badge-advanced ${selectedUser.role_slug || selectedUser.role_name?.toLowerCase() || 'user'}`}>
                                                                {selectedUser.role_name || selectedUser.role_slug || 'Kullanıcı'}
                                                            </span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Durum:</span>
                                                            <span className={`detail-value status-${selectedUser.status}`}>
                                                                {selectedUser.status === 'active' ? 'Aktif' : 
                                                                 selectedUser.status === 'banned' ? 'Yasaklı' : 
                                                                 selectedUser.status === 'pending' ? 'Beklemede' : 'Pasif'}
                                                            </span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Bakiye:</span>
                                                            <span className="detail-value">{selectedUser.balance || 0} ₺</span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">E-posta Doğrulandı:</span>
                                                            <span className="detail-value">
                                                                {selectedUser.email_verified ? '✓ Evet' : '✗ Hayır'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="detail-section">
                                                        <h3>Zaman Bilgileri</h3>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Kayıt Tarihi:</span>
                                                            <span className="detail-value">
                                                                {new Date(selectedUser.created_at).toLocaleDateString('tr-TR', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="detail-row">
                                                            <span className="detail-label">Son Giriş:</span>
                                                            <span className="detail-value">
                                                                {selectedUser.last_login 
                                                                    ? new Date(selectedUser.last_login).toLocaleDateString('tr-TR', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })
                                                                    : 'Hiç giriş yapmamış'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Projects Tab */}
                                        {activeTab === 'projects' && (
                                            <div className="tab-content">
                                                {userProjects.length === 0 ? (
                                                    <div className="empty-state-minimal">
                                                        <FiPackage />
                                                        <p>Henüz proje yok</p>
                                                    </div>
                                                ) : (
                                                    <div className="projects-list">
                                                        {userProjects.map(project => (
                                                            <div key={project.id} className="project-item">
                                                                <div className="project-item-info">
                                                                    <h4>{project.title}</h4>
                                                                    <p className="project-meta">
                                                                        {project.category_name || 'Kategori yok'} • 
                                                                        {project.status === 'approved' ? 'Onaylandı' : 
                                                                         project.status === 'pending' ? 'Beklemede' : 
                                                                         project.status === 'rejected' ? 'Reddedildi' : project.status}
                                                                    </p>
                                                                    <div className="project-stats">
                                                                        <span>👁️ {project.views || 0} görüntüleme</span>
                                                                        <span>📥 {project.downloads || 0} indirme</span>
                                                                        <span>💰 {project.sales_count || 0} satış</span>
                                                                        <span>💵 {parseFloat(project.total_revenue || 0).toFixed(2)} ₺ gelir</span>
                                                                    </div>
                                                                </div>
                                                                <div className="project-item-price">
                                                                    <span className="price">{project.price || 0} ₺</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Orders Tab */}
                                        {activeTab === 'orders' && (
                                            <div className="tab-content">
                                                {userOrders.length === 0 ? (
                                                    <div className="empty-state-minimal">
                                                        <FiShoppingCart />
                                                        <p>Henüz sipariş yok</p>
                                                    </div>
                                                ) : (
                                                    <div className="orders-list">
                                                        {userOrders.map(order => (
                                                            <div key={order.id} className="order-item">
                                                                <div className="order-item-header">
                                                                    <div>
                                                                        <h4>Sipariş #{order.order_number}</h4>
                                                                        <p className="order-date">
                                                                            {new Date(order.created_at).toLocaleDateString('tr-TR', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`order-status-badge ${order.order_status}`}>
                                                                        {order.order_status === 'completed' ? 'Tamamlandı' :
                                                                         order.order_status === 'pending' ? 'Beklemede' :
                                                                         order.order_status === 'cancelled' ? 'İptal Edildi' :
                                                                         order.order_status}
                                                                    </span>
                                                                </div>
                                                                <div className="order-item-details">
                                                                    <p><strong>Ürünler:</strong> {order.project_titles || 'N/A'}</p>
                                                                    <p><strong>Ürün Sayısı:</strong> {order.item_count || 0}</p>
                                                                    <p><strong>Toplam:</strong> {parseFloat(order.final_amount || 0).toFixed(2)} ₺</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Sales Tab */}
                                        {activeTab === 'sales' && (selectedUser.role_slug === 'seller' || selectedUser.role_id === 3) && (
                                            <div className="tab-content">
                                                {userSales.length === 0 ? (
                                                    <div className="empty-state-minimal">
                                                        <FiDollarSign />
                                                        <p>Henüz satış yok</p>
                                                    </div>
                                                ) : (
                                                    <div className="sales-list">
                                                        {userSales.map(sale => (
                                                            <div key={sale.id} className="sale-item">
                                                                <div className="sale-item-header">
                                                                    <div>
                                                                        <h4>{sale.project_title}</h4>
                                                                        <p className="sale-date">
                                                                            {new Date(sale.order_date).toLocaleDateString('tr-TR', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                    <span className="sale-price">{parseFloat(sale.price || 0).toFixed(2)} ₺</span>
                                                                </div>
                                                                <div className="sale-item-details">
                                                                    <p><strong>Alıcı:</strong> {sale.buyer_username} ({sale.buyer_email})</p>
                                                                    <p><strong>Sipariş No:</strong> #{sale.order_number}</p>
                                                                    <p><strong>Komisyon:</strong> {parseFloat(sale.commission_amount || 0).toFixed(2)} ₺</p>
                                                                    <p><strong>Durum:</strong> {sale.order_status === 'completed' ? 'Tamamlandı' : sale.order_status}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Transactions Tab */}
                                        {activeTab === 'transactions' && (
                                            <div className="tab-content">
                                                {userTransactions.length === 0 ? (
                                                    <div className="empty-state-minimal">
                                                        <FiActivity />
                                                        <p>Henüz işlem yok</p>
                                                    </div>
                                                ) : (
                                                    <div className="transactions-list">
                                                        {userTransactions.map(transaction => (
                                                            <div key={transaction.id} className="transaction-item">
                                                                <div className="transaction-item-header">
                                                                    <div>
                                                                        <h4>{transaction.type === 'purchase' ? 'Satın Alma' :
                                                                              transaction.type === 'sale' ? 'Satış' :
                                                                              transaction.type === 'commission' ? 'Komisyon' :
                                                                              transaction.type === 'donation' ? 'Bağış' :
                                                                              transaction.type}</h4>
                                                                        <p className="transaction-date">
                                                                            {new Date(transaction.created_at).toLocaleDateString('tr-TR', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`transaction-amount ${transaction.type === 'purchase' || transaction.type === 'donation' ? 'negative' : 'positive'}`}>
                                                                        {transaction.type === 'purchase' || transaction.type === 'donation' ? '-' : '+'}
                                                                        {parseFloat(transaction.amount || 0).toFixed(2)} ₺
                                                                    </span>
                                                                </div>
                                                                <div className="transaction-item-details">
                                                                    <p><strong>Açıklama:</strong> {transaction.description || 'N/A'}</p>
                                                                    {transaction.order_number && (
                                                                        <p><strong>Sipariş No:</strong> #{transaction.order_number}</p>
                                                                    )}
                                                                    {transaction.project_titles && (
                                                                        <p><strong>Projeler:</strong> {transaction.project_titles}</p>
                                                                    )}
                                                                    <p><strong>Durum:</strong> 
                                                                        <span className={`status-badge ${transaction.status}`}>
                                                                            {transaction.status === 'completed' ? 'Tamamlandı' :
                                                                             transaction.status === 'pending' ? 'Beklemede' :
                                                                             transaction.status === 'failed' ? 'Başarısız' :
                                                                             transaction.status}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Reports Tab */}
                                        {activeTab === 'reports' && userStats && (
                                            <div className="tab-content">
                                                <div className="reports-grid">
                                                    <div className="report-section">
                                                        <h3>Proje İstatistikleri</h3>
                                                        <div className="report-stats">
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam Proje</span>
                                                                <span className="report-value">{userStats.projects?.total_projects || 0}</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Onaylanan</span>
                                                                <span className="report-value positive">{userStats.projects?.approved_projects || 0}</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Beklemede</span>
                                                                <span className="report-value warning">{userStats.projects?.pending_projects || 0}</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam Görüntüleme</span>
                                                                <span className="report-value">{userStats.projects?.total_views || 0}</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam İndirme</span>
                                                                <span className="report-value">{userStats.projects?.total_downloads || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="report-section">
                                                        <h3>Sipariş İstatistikleri</h3>
                                                        <div className="report-stats">
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam Sipariş</span>
                                                                <span className="report-value">{userStats.orders?.total_orders || 0}</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam Harcama</span>
                                                                <span className="report-value negative">{parseFloat(userStats.orders?.total_spent || 0).toFixed(2)} ₺</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Tamamlanan Siparişler</span>
                                                                <span className="report-value">{parseFloat(userStats.orders?.completed_orders_total || 0).toFixed(2)} ₺</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(selectedUser.role_slug === 'seller' || selectedUser.role_id === 3) && (
                                                        <div className="report-section">
                                                            <h3>Satış İstatistikleri</h3>
                                                            <div className="report-stats">
                                                                <div className="report-stat-item">
                                                                    <span className="report-label">Toplam Satış</span>
                                                                    <span className="report-value">{userStats.sales?.total_sales || 0}</span>
                                                                </div>
                                                                <div className="report-stat-item">
                                                                    <span className="report-label">Toplam Gelir</span>
                                                                    <span className="report-value positive">{parseFloat(userStats.sales?.total_revenue || 0).toFixed(2)} ₺</span>
                                                                </div>
                                                                <div className="report-stat-item">
                                                                    <span className="report-label">Toplam Komisyon</span>
                                                                    <span className="report-value">{parseFloat(userStats.sales?.total_commission || 0).toFixed(2)} ₺</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="report-section">
                                                        <h3>İşlem İstatistikleri</h3>
                                                        <div className="report-stats">
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam İşlem</span>
                                                                <span className="report-value">{userStats.transactions?.total_transactions || 0}</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam Harcama</span>
                                                                <span className="report-value negative">{parseFloat(userStats.transactions?.total_spent || 0).toFixed(2)} ₺</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam Kazanç</span>
                                                                <span className="report-value positive">{parseFloat(userStats.transactions?.total_earned || 0).toFixed(2)} ₺</span>
                                                            </div>
                                                            <div className="report-stat-item">
                                                                <span className="report-label">Toplam Bağış</span>
                                                                <span className="report-value">{parseFloat(userStats.transactions?.total_donated || 0).toFixed(2)} ₺</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                                    Kapat
                                </button>
                                <button className="btn-primary" onClick={() => {
                                    setShowDetailModal(false);
                                    handleEdit(selectedUser);
                                }}>
                                    <FiEdit /> Düzenle
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && selectedUser && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content user-edit-modal-advanced" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-header-user">
                                    <div className="user-detail-avatar-small">
                                        {selectedUser.avatar ? (
                                            <img src={selectedUser.avatar} alt={selectedUser.username} />
                                        ) : (
                                            <FiUser />
                                        )}
                                    </div>
                                    <div>
                                        <h2>Kullanıcı Düzenle</h2>
                                        <p className="user-detail-subtitle">{selectedUser.username} • {selectedUser.email}</p>
                                    </div>
                                </div>
                                <button className="btn-icon" onClick={() => setShowEditModal(false)}>
                                    <FiX />
                                </button>
                            </div>

                            {/* Edit Tabs */}
                            <div className="user-detail-tabs">
                                <button 
                                    className={`tab-btn ${editActiveTab === 'basic' ? 'active' : ''}`}
                                    onClick={() => setEditActiveTab('basic')}
                                >
                                    <FiUser /> Temel Bilgiler
                                </button>
                                <button 
                                    className={`tab-btn ${editActiveTab === 'account' ? 'active' : ''}`}
                                    onClick={() => setEditActiveTab('account')}
                                >
                                    <FiShield /> Hesap Ayarları
                                </button>
                                <button 
                                    className={`tab-btn ${editActiveTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => setEditActiveTab('profile')}
                                >
                                    <FiInfo /> Profil Bilgileri
                                </button>
                                <button 
                                    className={`tab-btn ${editActiveTab === 'security' ? 'active' : ''}`}
                                    onClick={() => setEditActiveTab('security')}
                                >
                                    <FiLock /> Güvenlik
                                </button>
                            </div>

                            <div className="modal-body">
                                {/* Basic Info Tab */}
                                {editActiveTab === 'basic' && (
                                    <div className="edit-form-content">
                                        <div className="form-section-title">
                                            <h3>Kişisel Bilgiler</h3>
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Kullanıcı Adı *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={editFormData.username}
                                                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                                    placeholder="Kullanıcı adı"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>E-posta *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={editFormData.email}
                                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                    placeholder="E-posta adresi"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Ad</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.first_name}
                                                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                                    placeholder="Ad"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Soyad</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.last_name}
                                                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                                    placeholder="Soyad"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Telefon</label>
                                                <input
                                                    type="tel"
                                                    value={editFormData.phone}
                                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                                    placeholder="Telefon numarası"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Account Settings Tab */}
                                {editActiveTab === 'account' && (
                                    <div className="edit-form-content">
                                        <div className="form-section-title">
                                            <h3>Hesap Ayarları</h3>
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Rol *</label>
                                                <select
                                                    value={editFormData.role_id}
                                                    onChange={(e) => setEditFormData({ ...editFormData, role_id: parseInt(e.target.value) })}
                                                >
                                                    <option value="1">Admin</option>
                                                    <option value="2">Kullanıcı</option>
                                                    <option value="3">Satıcı</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Durum *</label>
                                                <select
                                                    value={editFormData.status}
                                                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                                >
                                                    <option value="active">Aktif</option>
                                                    <option value="inactive">Pasif</option>
                                                    <option value="banned">Yasaklı</option>
                                                    <option value="pending">Beklemede</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Bakiye (₺)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={editFormData.balance}
                                                    onChange={(e) => setEditFormData({ ...editFormData, balance: parseFloat(e.target.value) || 0 })}
                                                    placeholder="0.00"
                                                />
                                                <small className="form-hint">Kullanıcının hesap bakiyesi</small>
                                            </div>
                                            <div className="form-group">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={editFormData.email_verified}
                                                        onChange={(e) => setEditFormData({ ...editFormData, email_verified: e.target.checked })}
                                                    />
                                                    <span>E-posta Doğrulandı</span>
                                                </label>
                                                <small className="form-hint">Kullanıcının e-postasının doğrulandığını işaretle</small>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Profile Info Tab */}
                                {editActiveTab === 'profile' && (
                                    <div className="edit-form-content">
                                        <div className="form-section-title">
                                            <h3>Profil Bilgileri</h3>
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group full-width">
                                                <label>Biyografi</label>
                                                <textarea
                                                    rows="4"
                                                    value={editFormData.bio}
                                                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                                                    placeholder="Kullanıcı hakkında bilgi..."
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Web Sitesi</label>
                                                <input
                                                    type="url"
                                                    value={editFormData.website}
                                                    onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Konum</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.location}
                                                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                                                    placeholder="Şehir, Ülke"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Security Tab */}
                                {editActiveTab === 'security' && (
                                    <div className="edit-form-content">
                                        <div className="form-section-title">
                                            <h3>Güvenlik Ayarları</h3>
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group full-width">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={editFormData.two_factor_enabled}
                                                        onChange={(e) => setEditFormData({ ...editFormData, two_factor_enabled: e.target.checked })}
                                                    />
                                                    <span>İki Faktörlü Kimlik Doğrulama (2FA)</span>
                                                </label>
                                                <small className="form-hint">Kullanıcının 2FA özelliğini etkinleştir/devre dışı bırak</small>
                                            </div>
                                            <div className="form-group full-width">
                                                <div className="info-box">
                                                    <h4>Güvenlik Bilgileri</h4>
                                                    <div className="info-row">
                                                        <span className="info-label">Son Giriş:</span>
                                                        <span className="info-value">
                                                            {selectedUser.last_login 
                                                                ? new Date(selectedUser.last_login).toLocaleDateString('tr-TR', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                                : 'Hiç giriş yapmamış'}
                                                        </span>
                                                    </div>
                                                    {selectedUser.last_ip && (
                                                        <div className="info-row">
                                                            <span className="info-label">Son IP Adresi:</span>
                                                            <span className="info-value">{selectedUser.last_ip}</span>
                                                        </div>
                                                    )}
                                                    <div className="info-row">
                                                        <span className="info-label">Kayıt Tarihi:</span>
                                                        <span className="info-value">
                                                            {new Date(selectedUser.created_at).toLocaleDateString('tr-TR', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                                    İptal
                                </button>
                                <button className="btn-primary" onClick={handleSaveEdit}>
                                    <FiSave /> Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="stats-summary-advanced">
                    <div className="stat-summary-card">
                        <div className="stat-summary-icon users">
                            <FiUsers />
                        </div>
                        <div className="stat-summary-content">
                            <span className="stat-summary-label">Toplam</span>
                            <span className="stat-summary-value">{formatNumber(stats.total)}</span>
                        </div>
                    </div>
                    <div className="stat-summary-card">
                        <div className="stat-summary-icon active">
                            <FiCheckCircle />
                        </div>
                        <div className="stat-summary-content">
                            <span className="stat-summary-label">Aktif</span>
                            <span className="stat-summary-value positive">{formatNumber(stats.active)}</span>
                        </div>
                    </div>
                    <div className="stat-summary-card">
                        <div className="stat-summary-icon pending">
                            <FiClock />
                        </div>
                        <div className="stat-summary-content">
                            <span className="stat-summary-label">Beklemede</span>
                            <span className="stat-summary-value warning">{formatNumber(stats.pending)}</span>
                        </div>
                    </div>
                    <div className="stat-summary-card">
                        <div className="stat-summary-icon banned">
                            <FiXCircle />
                        </div>
                        <div className="stat-summary-content">
                            <span className="stat-summary-label">Yasaklı</span>
                            <span className="stat-summary-value negative">{formatNumber(stats.banned)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
