import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiMail } from 'react-icons/fi';
import './AdminSettingsContact.css';

const AdminSettingsContact = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        address: '',
        workingHours: '',
        mapEmbed: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/contact');
            if (response.data) {
                setFormData(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            console.error('Settings load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.put('/admin/settings/contact', formData);
            alert('Ayarlar başarıyla kaydedildi!');
        } catch (error) {
            console.error('Settings save error:', error);
            alert('Ayarlar kaydedilirken hata oluştu!');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-settings-contact-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-contact-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">İletişim Ayarları</h1>
                        <p className="page-subtitle-advanced">İletişim bilgilerini yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>İletişim Bilgileri</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>E-posta *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="info@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Telefon</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="+90 555 123 4567"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Adres</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Tam adres bilgisi"
                                rows="3"
                            />
                        </div>
                        <div className="form-group">
                            <label>Çalışma Saatleri</label>
                            <input
                                type="text"
                                value={formData.workingHours}
                                onChange={(e) => handleChange('workingHours', e.target.value)}
                                placeholder="Pazartesi - Cuma: 09:00 - 18:00"
                            />
                        </div>
                        <div className="form-group">
                            <label>Harita Embed Kodu</label>
                            <textarea
                                value={formData.mapEmbed}
                                onChange={(e) => handleChange('mapEmbed', e.target.value)}
                                placeholder="Google Maps iframe kodu"
                                rows="4"
                            />
                            <p className="form-help">Google Maps'ten alacağınız iframe kodunu buraya yapıştırın.</p>
                        </div>
                    </div>

                    <div className="form-actions-minimal">
                        <button type="submit" className="btn-save" disabled={saving}>
                            <FiSave /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default AdminSettingsContact;

