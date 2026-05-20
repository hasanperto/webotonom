import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiUserX, FiSearch, FiRefreshCw, FiUnlock, FiShield, FiClock, FiUser, FiMail, 
    FiEdit, FiFileText, FiX, FiSave, FiPackage, FiShoppingCart, FiDollarSign
} from 'react-icons/fi';
import './AdminUsersBanned.css';

const AdminUsersBanned = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [filterRole, setFilterRole] = useState('all'); // all, user, seller

    useEffect(() => {
        loadBannedUsers();
    }, []);

    const loadBannedUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users/banned');
            console.log('Banned users response:', response.data);
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Banned users load error:', error);
            console.error('Error response:', error.response?.data);
            alert('Yasaklı kullanıcılar yüklenirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUnban = async (userId) => {
        if (confirm('Bu kullanıcının yasağını kaldırmak istediğinize emin misiniz?')) {
            try {
                await api.put(`/admin/users/${userId}/unban`);
                loadBannedUsers();
            } catch (error) {
                alert(error.response?.data?.error || 'İşlem başarısız');
            }
        }
    };

    const handleAddNote = (user) => {
        setSelectedUser(user);
        setNoteText(user.ban_note || '');
        setShowNoteModal(true);
    };

    const handleSaveNote = async () => {
        if (!selectedUser) return;
        try {
            await api.put(`/admin/users/${selectedUser.id}`, { ban_note: noteText });
            setShowNoteModal(false);
            loadBannedUsers();
        } catch (error) {
            alert(error.response?.data?.error || 'Not kaydedilemedi');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || 
                           (filterRole === 'user' && user.role_id === 2) ||
                           (filterRole === 'seller' && user.role_id === 3);
        return matchesSearch && matchesRole;
    });

    const stats = {
        total: users.length,
        users: users.filter(u => u.role_id === 2).length,
        sellers: users.filter(u => u.role_id === 3).length
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-users-banned-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-users-banned-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Engellenen Müşteriler</h1>
                        <p className="page-subtitle-advanced">Yasaklanmış kullanıcıları görüntüleyin ve yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadBannedUsers}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <div className="banned-filters-section">
                    <div className="search-box-minimal">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Kullanıcı adı veya e-posta ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-tabs-minimal">
                        <button 
                            className={`filter-tab ${filterRole === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterRole('all')}
                        >
                            Tümü ({stats.total})
                        </button>
                        <button 
                            className={`filter-tab ${filterRole === 'user' ? 'active' : ''}`}
                            onClick={() => setFilterRole('user')}
                        >
                            Kullanıcılar ({stats.users})
                        </button>
                        <button 
                            className={`filter-tab ${filterRole === 'seller' ? 'active' : ''}`}
                            onClick={() => setFilterRole('seller')}
                        >
                            Satıcılar ({stats.sellers})
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="banned-stats-summary">
                    <div className="stat-card-banned">
                        <div className="stat-icon-banned total">
                            <FiUserX />
                        </div>
                        <div className="stat-content-banned">
                            <span className="stat-label-banned">Toplam Yasaklı</span>
                            <span className="stat-value-banned">{stats.total}</span>
                        </div>
                    </div>
                    <div className="stat-card-banned">
                        <div className="stat-icon-banned users">
                            <FiUser />
                        </div>
                        <div className="stat-content-banned">
                            <span className="stat-label-banned">Kullanıcılar</span>
                            <span className="stat-value-banned">{stats.users}</span>
                        </div>
                    </div>
                    <div className="stat-card-banned">
                        <div className="stat-icon-banned sellers">
                            <FiPackage />
                        </div>
                        <div className="stat-content-banned">
                            <span className="stat-label-banned">Satıcılar</span>
                            <span className="stat-value-banned">{stats.sellers}</span>
                        </div>
                    </div>
                </div>

                <div className="banned-users-list-minimal">
                    {filteredUsers.length === 0 ? (
                        <div className="empty-state-minimal">
                            <FiUserX className="empty-icon" />
                            <h3>
                                {users.length === 0 
                                    ? 'Henüz yasaklı kullanıcı yok' 
                                    : 'Arama kriterlerinize uygun kullanıcı bulunamadı'}
                            </h3>
                            <p>
                                {users.length === 0 
                                    ? 'Yasaklı kullanıcılar burada görüntülenecek. Bir kullanıcıyı yasaklamak için Kullanıcı Yönetimi sayfasından "Yasakla" butonunu kullanın.' 
                                    : 'Arama kriterlerinizi değiştirerek tekrar deneyin.'}
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <div key={user.id} className="banned-user-card-advanced">
                                <div className="user-info-section-advanced">
                                    <div className="user-avatar-advanced">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.username} />
                                        ) : (
                                            <FiUser />
                                        )}
                                    </div>
                                    <div className="user-details-advanced">
                                        <div className="user-header-advanced">
                                            <h3>{user.username}</h3>
                                            <span className={`role-badge-banned ${user.role_slug || (user.role_id === 3 ? 'seller' : 'user')}`}>
                                                {user.role_name || 'Kullanıcı'}
                                            </span>
                                        </div>
                                        <p className="user-email-advanced">
                                            <FiMail /> {user.email}
                                        </p>
                                        {user.first_name || user.last_name ? (
                                            <p className="user-name-advanced">
                                                {user.first_name} {user.last_name}
                                            </p>
                                        ) : null}
                                        <div className="user-meta-advanced">
                                            <span className="meta-item-advanced">
                                                <FiClock /> Yasaklanma: {new Date(user.updated_at).toLocaleDateString('tr-TR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            {user.last_login && (
                                                <span className="meta-item-advanced">
                                                    Son Giriş: {new Date(user.last_login).toLocaleDateString('tr-TR')}
                                                </span>
                                            )}
                                        </div>
                                        {user.ban_note && (
                                            <div className="ban-note-display">
                                                <FiFileText />
                                                <span>{user.ban_note}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="user-actions-advanced-banned">
                                    <button 
                                        className="btn-note-banned"
                                        onClick={() => handleAddNote(user)}
                                        title="Not Ekle/Düzenle"
                                    >
                                        <FiFileText /> Not
                                    </button>
                                    <button 
                                        className="btn-unban-advanced"
                                        onClick={() => handleUnban(user.id)}
                                    >
                                        <FiUnlock /> Yasak Kaldır
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Note Modal */}
                {showNoteModal && selectedUser && (
                    <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
                        <div className="modal-content note-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>Yasak Notu</h2>
                                    <p className="modal-subtitle">{selectedUser.username} için not ekle/düzenle</p>
                                </div>
                                <button className="btn-icon" onClick={() => setShowNoteModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Not</label>
                                    <textarea
                                        rows="6"
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Yasaklama nedeni veya notlarınızı buraya yazın..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowNoteModal(false)}>
                                    İptal
                                </button>
                                <button className="btn-primary" onClick={handleSaveNote}>
                                    <FiSave /> Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminUsersBanned;

