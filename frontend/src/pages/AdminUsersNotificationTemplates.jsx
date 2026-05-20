import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiFileText, FiSearch, FiRefreshCw, FiPlus, FiEdit, FiTrash2, FiEye
} from 'react-icons/fi';
import './AdminUsersNotificationTemplates.css';

const AdminUsersNotificationTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        type: 'email'
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const response = await api.get('/admin/users/notification-templates');
            setTemplates(response.data.templates || []);
        } catch (error) {
            console.error('Templates load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await api.put(`/admin/users/notification-templates/${editingTemplate.id}`, formData);
            } else {
                await api.post('/admin/users/notification-templates', formData);
            }
            setShowAddModal(false);
            setEditingTemplate(null);
            setFormData({ name: '', subject: '', body: '', type: 'email' });
            loadTemplates();
        } catch (error) {
            alert(error.response?.data?.error || 'Şablon kaydedilemedi');
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name || '',
            subject: template.subject || '',
            body: template.body || '',
            type: template.type || 'email'
        });
        setShowAddModal(true);
    };

    const handleDelete = async (templateId) => {
        if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/admin/users/notification-templates/${templateId}`);
                loadTemplates();
            } catch (error) {
                alert(error.response?.data?.error || 'Silme işlemi başarısız');
            }
        }
    };

    const filteredTemplates = templates.filter(template => 
        template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-users-notification-templates-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-users-notification-templates-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Bildirim Şablonları</h1>
                        <p className="page-subtitle-advanced">E-posta ve SMS şablonlarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-add-template" onClick={() => {
                            setShowAddModal(true);
                            setEditingTemplate(null);
                            setFormData({ name: '', subject: '', body: '', type: 'email' });
                        }}>
                            <FiPlus /> Yeni Şablon
                        </button>
                        <button className="btn-refresh" onClick={loadTemplates}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <div className="search-box-minimal">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Şablon adı veya konu ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="templates-list-minimal">
                    {filteredTemplates.length === 0 ? (
                        <div className="empty-state-minimal">
                            <FiFileText className="empty-icon" />
                            <h3>Henüz şablon eklenmemiş</h3>
                            <p>Yeni şablon eklemek için "Yeni Şablon" butonuna tıklayın.</p>
                        </div>
                    ) : (
                        filteredTemplates.map(template => (
                            <div key={template.id} className="template-card-minimal">
                                <div className="template-info-section">
                                    <div className="template-icon-minimal">
                                        <FiFileText />
                                    </div>
                                    <div className="template-details-minimal">
                                        <h3>{template.name}</h3>
                                        <p className="template-subject">{template.subject}</p>
                                        <div className="template-meta-minimal">
                                            <span className={`template-type-badge ${template.type}`}>
                                                {template.type === 'email' ? 'E-Posta' : 'SMS'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="template-actions-minimal">
                                    <button 
                                        className="btn-edit-minimal"
                                        onClick={() => handleEdit(template)}
                                    >
                                        <FiEdit />
                                    </button>
                                    <button 
                                        className="btn-delete-minimal"
                                        onClick={() => handleDelete(template.id)}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => {
                        setShowAddModal(false);
                        setEditingTemplate(null);
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon Ekle'}</h2>
                                <button className="modal-close" onClick={() => {
                                    setShowAddModal(false);
                                    setEditingTemplate(null);
                                }}>×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="add-template-form">
                                <div className="form-group">
                                    <label>Şablon Adı *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tip *</label>
                                    <select
                                        required
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="email">E-Posta</option>
                                        <option value="sms">SMS</option>
                                    </select>
                                </div>
                                {formData.type === 'email' && (
                                    <div className="form-group">
                                        <label>Konu *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>İçerik *</label>
                                    <textarea
                                        required
                                        value={formData.body}
                                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                        rows={formData.type === 'sms' ? 4 : 10}
                                        maxLength={formData.type === 'sms' ? 160 : undefined}
                                    />
                                    {formData.type === 'sms' && (
                                        <div className="char-count">
                                            {formData.body.length}/160 karakter
                                        </div>
                                    )}
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => {
                                        setShowAddModal(false);
                                        setEditingTemplate(null);
                                    }}>
                                        İptal
                                    </button>
                                    <button type="submit" className="btn-save">
                                        {editingTemplate ? 'Güncelle' : 'Kaydet'}
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

export default AdminUsersNotificationTemplates;

