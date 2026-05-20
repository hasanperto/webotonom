import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiUserPlus, FiSearch, FiRefreshCw, FiMail, FiPhone, FiTrash2, FiPlus,
    FiUser, FiShield, FiPackage, FiFilter, FiX
} from 'react-icons/fi';
import './AdminUsersContacts.css';

const AdminUsersContacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all'); // all, admin, seller, user
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    useEffect(() => {
        loadContacts();
    }, [filterRole, searchTerm]);

    const loadContacts = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterRole !== 'all') {
                params.role = filterRole;
            }
            if (searchTerm) {
                params.search = searchTerm;
            }
            const response = await api.get('/admin/users/contacts', { params });
            setContacts(response.data.contacts || []);
        } catch (error) {
            console.error('Contacts load error:', error);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users/contacts', formData);
            setShowAddModal(false);
            setFormData({ name: '', email: '', phone: '', notes: '' });
            loadContacts();
        } catch (error) {
            alert(error.response?.data?.error || 'İletişim eklenemedi');
        }
    };

    const handleDelete = async (contactId, isContact) => {
        if (confirm('Bu iletişimi silmek istediğinize emin misiniz?')) {
            try {
                if (isContact) {
                    await api.delete(`/admin/users/contacts/${contactId}`);
                } else {
                    // Kullanıcı silinemez, sadece contact olarak eklenmişse silinebilir
                    alert('Sistem kullanıcıları silinemez. Sadece manuel eklenen iletişimler silinebilir.');
                    return;
                }
                loadContacts();
            } catch (error) {
                alert(error.response?.data?.error || 'Silme işlemi başarısız');
            }
        }
    };

    // İstatistikler
    const stats = {
        total: contacts.length,
        admins: contacts.filter(c => c.role_slug === 'admin').length,
        sellers: contacts.filter(c => c.role_slug === 'seller').length,
        users: contacts.filter(c => c.role_slug === 'user' || !c.role_slug).length,
        contacts: contacts.filter(c => c.is_contact).length
    };

    // Rol ikonu ve rengi
    const getRoleInfo = (contact) => {
        if (contact.is_contact) {
            return {
                icon: FiUserPlus,
                label: 'İletişim',
                color: '#8b5cf6',
                bgColor: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
            };
        }
        
        const roleSlug = contact.role_slug;
        if (roleSlug === 'admin') {
            return {
                icon: FiShield,
                label: 'Yönetici',
                color: '#ef4444',
                bgColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            };
        } else if (roleSlug === 'seller') {
            return {
                icon: FiPackage,
                label: 'Satıcı',
                color: '#f59e0b',
                bgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            };
        } else {
            return {
                icon: FiUser,
                label: 'Kullanıcı',
                color: '#3b82f6',
                bgColor: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            };
        }
    };

    if (loading && contacts.length === 0) {
        return (
            <AdminLayout>
                <div className="admin-users-contacts-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-users-contacts-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Rehberim</h1>
                        <p className="page-subtitle-advanced">Tüm iletişimleri görüntüleyin ve yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-add-contact" onClick={() => setShowAddModal(true)}>
                            <FiPlus /> Yeni İletişim
                        </button>
                        <button className="btn-refresh" onClick={loadContacts}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                {/* İstatistikler */}
                <div className="contacts-stats-summary">
                    <div className="stat-card-contact">
                        <div className="stat-icon-contact total">
                            <FiUserPlus />
                        </div>
                        <div className="stat-content-contact">
                            <span className="stat-label-contact">Toplam</span>
                            <span className="stat-value-contact">{stats.total}</span>
                        </div>
                    </div>
                    <div className="stat-card-contact">
                        <div className="stat-icon-contact admin">
                            <FiShield />
                        </div>
                        <div className="stat-content-contact">
                            <span className="stat-label-contact">Yöneticiler</span>
                            <span className="stat-value-contact">{stats.admins}</span>
                        </div>
                    </div>
                    <div className="stat-card-contact">
                        <div className="stat-icon-contact seller">
                            <FiPackage />
                        </div>
                        <div className="stat-content-contact">
                            <span className="stat-label-contact">Satıcılar</span>
                            <span className="stat-value-contact">{stats.sellers}</span>
                        </div>
                    </div>
                    <div className="stat-card-contact">
                        <div className="stat-icon-contact user">
                            <FiUser />
                        </div>
                        <div className="stat-content-contact">
                            <span className="stat-label-contact">Kullanıcılar</span>
                            <span className="stat-value-contact">{stats.users}</span>
                        </div>
                    </div>
                    <div className="stat-card-contact">
                        <div className="stat-icon-contact contact">
                            <FiUserPlus />
                        </div>
                        <div className="stat-content-contact">
                            <span className="stat-label-contact">İletişimler</span>
                            <span className="stat-value-contact">{stats.contacts}</span>
                        </div>
                    </div>
                </div>

                {/* Gelişmiş Arama ve Filtreleme */}
                <div className="contacts-filters-section">
                    <div className="search-box-advanced">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="İsim, e-posta, telefon veya notlar ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                className="search-clear"
                                onClick={() => setSearchTerm('')}
                                title="Temizle"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                    <div className="filter-tabs-advanced">
                        <button 
                            className={`filter-tab ${filterRole === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterRole('all')}
                        >
                            Tümü ({stats.total})
                        </button>
                        <button 
                            className={`filter-tab ${filterRole === 'admin' ? 'active' : ''}`}
                            onClick={() => setFilterRole('admin')}
                        >
                            <FiShield /> Yöneticiler ({stats.admins})
                        </button>
                        <button 
                            className={`filter-tab ${filterRole === 'seller' ? 'active' : ''}`}
                            onClick={() => setFilterRole('seller')}
                        >
                            <FiPackage /> Satıcılar ({stats.sellers})
                        </button>
                        <button 
                            className={`filter-tab ${filterRole === 'user' ? 'active' : ''}`}
                            onClick={() => setFilterRole('user')}
                        >
                            <FiUser /> Kullanıcılar ({stats.users})
                        </button>
                    </div>
                </div>

                <div className="contacts-list-advanced">
                    {contacts.length === 0 ? (
                        <div className="empty-state-minimal">
                            <FiUserPlus className="empty-icon" />
                            <h3>İletişim bulunamadı</h3>
                            <p>Arama kriterlerinizi değiştirerek veya filtreleri sıfırlayarak tekrar deneyin.</p>
                        </div>
                    ) : (
                        contacts.map(contact => {
                            const roleInfo = getRoleInfo(contact);
                            const RoleIcon = roleInfo.icon;
                            
                            return (
                                <div 
                                    key={contact.id} 
                                    className={`contact-card-advanced contact-card-${contact.role_slug || 'contact'}`}
                                >
                                    <div className="contact-info-section-advanced">
                                        <div 
                                            className="contact-avatar-advanced"
                                            style={{ background: roleInfo.bgColor }}
                                        >
                                            <RoleIcon />
                                        </div>
                                        <div className="contact-details-advanced">
                                            <div className="contact-header-advanced">
                                                <h3>{contact.name || contact.username}</h3>
                                                <span 
                                                    className="role-badge-contact"
                                                    style={{ 
                                                        background: roleInfo.bgColor,
                                                        color: 'white'
                                                    }}
                                                >
                                                    {roleInfo.label}
                                                </span>
                                            </div>
                                            <div className="contact-meta-advanced">
                                                {contact.email && (
                                                    <span className="meta-item-advanced">
                                                        <FiMail /> {contact.email}
                                                    </span>
                                                )}
                                                {contact.phone && (
                                                    <span className="meta-item-advanced">
                                                        <FiPhone /> {contact.phone}
                                                    </span>
                                                )}
                                            </div>
                                            {contact.notes && (
                                                <p className="contact-notes-advanced">{contact.notes}</p>
                                            )}
                                            {contact.username && contact.is_contact === false && (
                                                <div className="contact-source-badge">
                                                    Sistem Kullanıcısı
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="contact-actions-advanced">
                                        {contact.is_contact && (
                                            <button 
                                                className="btn-delete-advanced"
                                                onClick={() => handleDelete(contact.id, true)}
                                                title="Sil"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Yeni İletişim Ekle</h2>
                                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <form onSubmit={handleAddContact} className="add-contact-form">
                                <div className="form-group">
                                    <label>İsim *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>E-posta</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefon</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Notlar</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows="3"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                                        İptal
                                    </button>
                                    <button type="submit" className="btn-save">
                                        Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminUsersContacts;
