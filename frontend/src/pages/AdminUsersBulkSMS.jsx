import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiMessageSquare, FiSend } from 'react-icons/fi';
import './AdminUsersBulkSMS.css';

const AdminUsersBulkSMS = () => {
    const [formData, setFormData] = useState({
        message: '',
        userFilter: 'all',
        roleId: '',
        sendToContacts: false
    });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!confirm('Toplu SMS göndermek istediğinize emin misiniz?')) {
            return;
        }

        setSending(true);
        try {
            const response = await api.post('/admin/users/bulk-sms', formData);
            alert(`SMS başarıyla gönderildi! ${response.data.sent_count || 0} kullanıcıya ulaştı.`);
            setFormData({ message: '', userFilter: 'all', roleId: '', sendToContacts: false });
        } catch (error) {
            alert(error.response?.data?.error || 'SMS gönderilemedi');
        } finally {
            setSending(false);
        }
    };

    return (
        <AdminLayout>
            <div className="admin-users-bulk-sms-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Toplu SMS</h1>
                        <p className="page-subtitle-advanced">Birden fazla kullanıcıya SMS gönderin</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bulk-sms-form">
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
                        <h3>SMS İçeriği</h3>
                        <div className="form-group">
                            <label>Mesaj * (Maksimum 160 karakter)</label>
                            <textarea
                                required
                                maxLength={160}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows="4"
                                placeholder="SMS mesajı..."
                            />
                            <div className="char-count">
                                {formData.message.length}/160 karakter
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-send" disabled={sending || !formData.message.trim()}>
                            <FiSend /> {sending ? 'Gönderiliyor...' : 'SMS Gönder'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default AdminUsersBulkSMS;

