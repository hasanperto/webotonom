import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiMail, FiSend, FiUsers, FiRefreshCw } from 'react-icons/fi';
import './AdminUsersBulkEmail.css';

const AdminUsersBulkEmail = () => {
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        userFilter: 'all', // all, active, inactive, role
        roleId: '',
        sendToContacts: false
    });
    const [sending, setSending] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!confirm('Toplu e-posta göndermek istediğinize emin misiniz?')) {
            return;
        }

        setSending(true);
        try {
            const response = await api.post('/admin/users/bulk-email', formData);
            alert(`E-posta başarıyla gönderildi! ${response.data.sent_count || 0} kullanıcıya ulaştı.`);
            setFormData({ subject: '', message: '', userFilter: 'all', roleId: '', sendToContacts: false });
        } catch (error) {
            alert(error.response?.data?.error || 'E-posta gönderilemedi');
        } finally {
            setSending(false);
        }
    };

    return (
        <AdminLayout>
            <div className="admin-users-bulk-email-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Toplu E-Mail</h1>
                        <p className="page-subtitle-advanced">Birden fazla kullanıcıya e-posta gönderin</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bulk-email-form">
                    <div className="form-section">
                        <h3>Alıcı Filtreleme</h3>
                        <div className="form-group">
                            <label>Kullanıcı Filtresi</label>
                            <select
                                value={formData.userFilter}
                                onChange={(e) => setFormData({ ...formData, userFilter: e.target.value })}
                            >
                                <option value="all">Tüm Kullanıcılar</option>
                                <option value="active">Aktif Kullanıcılar</option>
                                <option value="inactive">Pasif Kullanıcılar</option>
                                <option value="role">Rol Bazlı</option>
                            </select>
                        </div>
                        {formData.userFilter === 'role' && (
                            <div className="form-group">
                                <label>Rol</label>
                                <select
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                >
                                    <option value="">Rol Seçin</option>
                                    <option value="1">Admin</option>
                                    <option value="2">Satıcı</option>
                                    <option value="3">Kullanıcı</option>
                                </select>
                            </div>
                        )}
                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.sendToContacts}
                                    onChange={(e) => setFormData({ ...formData, sendToContacts: e.target.checked })}
                                />
                                Rehberdeki iletişimlere de gönder
                            </label>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>E-Posta İçeriği</h3>
                        <div className="form-group">
                            <label>Konu *</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="E-posta konusu"
                            />
                        </div>
                        <div className="form-group">
                            <label>Mesaj *</label>
                            <textarea
                                required
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows="10"
                                placeholder="E-posta içeriği..."
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-preview" onClick={() => setPreview(formData)}>
                            Önizleme
                        </button>
                        <button type="submit" className="btn-send" disabled={sending}>
                            <FiSend /> {sending ? 'Gönderiliyor...' : 'E-Posta Gönder'}
                        </button>
                    </div>
                </form>

                {preview && (
                    <div className="email-preview">
                        <div className="preview-header">
                            <h3>E-Posta Önizlemesi</h3>
                            <button onClick={() => setPreview(null)}>×</button>
                        </div>
                        <div className="preview-content">
                            <p><strong>Konu:</strong> {preview.subject}</p>
                            <div className="preview-message">
                                {preview.message.split('\n').map((line, i) => (
                                    <p key={i}>{line || <br />}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminUsersBulkEmail;

