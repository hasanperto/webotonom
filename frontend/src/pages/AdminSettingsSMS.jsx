import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiMessageSquare } from 'react-icons/fi';
import './AdminSettingsSMS.css';

const AdminSettingsSMS = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        provider: '',
        apiKey: '',
        apiSecret: '',
        senderId: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/sms');
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
            await api.put('/admin/settings/sms', formData);
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
                <div className="admin-settings-sms-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-sms-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">SMS Ayarları</h1>
                        <p className="page-subtitle-advanced">SMS gönderim ayarlarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>SMS Sağlayıcı Ayarları</h3>
                        <div className="form-group">
                            <label>SMS Sağlayıcı</label>
                            <select
                                value={formData.provider}
                                onChange={(e) => handleChange('provider', e.target.value)}
                            >
                                <option value="">Sağlayıcı Seçin</option>
                                <option value="twilio">Twilio</option>
                                <option value="nexmo">Vonage (Nexmo)</option>
                                <option value="messagebird">MessageBird</option>
                                <option value="custom">Özel Sağlayıcı</option>
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>API Key</label>
                                <input
                                    type="text"
                                    value={formData.apiKey}
                                    onChange={(e) => handleChange('apiKey', e.target.value)}
                                    placeholder="API anahtarı"
                                />
                            </div>
                            <div className="form-group">
                                <label>API Secret</label>
                                <input
                                    type="password"
                                    value={formData.apiSecret}
                                    onChange={(e) => handleChange('apiSecret', e.target.value)}
                                    placeholder="API gizli anahtarı"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Gönderen ID (Sender ID)</label>
                            <input
                                type="text"
                                value={formData.senderId}
                                onChange={(e) => handleChange('senderId', e.target.value)}
                                placeholder="SMS gönderen kimliği"
                            />
                            <p className="form-help">SMS'lerde görünecek gönderen kimliği</p>
                        </div>
                    </div>

                    <div className="form-actions-minimal">
                        <button type="button" className="btn-test" onClick={() => alert('Test SMS gönderilecek (henüz implement edilmedi)')}>
                            Test SMS Gönder
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            <FiSave /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default AdminSettingsSMS;

