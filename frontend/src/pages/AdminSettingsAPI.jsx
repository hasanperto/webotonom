import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiServer } from 'react-icons/fi';
import './AdminSettingsAPI.css';

const AdminSettingsAPI = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        apiEnabled: false,
        apiKey: '',
        apiSecret: '',
        rateLimit: 100,
        allowedOrigins: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/api');
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
            await api.put('/admin/settings/api', formData);
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

    const generateApiKey = () => {
        const key = 'api_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        handleChange('apiKey', key);
    };

    const generateApiSecret = () => {
        const secret = 'secret_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        handleChange('apiSecret', secret);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-settings-api-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-api-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">API Ayarları</h1>
                        <p className="page-subtitle-advanced">API erişim ayarlarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>API Yapılandırması</h3>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.apiEnabled}
                                    onChange={(e) => handleChange('apiEnabled', e.target.checked)}
                                />
                                <span>API'yi etkinleştir</span>
                            </label>
                            <p className="form-help">API etkinleştirildiğinde, dış uygulamalar API üzerinden veri erişimi sağlayabilir.</p>
                        </div>
                        <div className="form-group">
                            <label>API Key</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    value={formData.apiKey}
                                    onChange={(e) => handleChange('apiKey', e.target.value)}
                                    placeholder="API anahtarı"
                                    readOnly
                                />
                                <button type="button" className="btn-generate" onClick={generateApiKey}>
                                    Oluştur
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>API Secret</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    value={formData.apiSecret}
                                    onChange={(e) => handleChange('apiSecret', e.target.value)}
                                    placeholder="API gizli anahtarı"
                                    readOnly
                                />
                                <button type="button" className="btn-generate" onClick={generateApiSecret}>
                                    Oluştur
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Rate Limit (İstek/Dakika)</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.rateLimit}
                                onChange={(e) => handleChange('rateLimit', parseInt(e.target.value))}
                                placeholder="100"
                            />
                        </div>
                        <div className="form-group">
                            <label>İzin Verilen Origin'ler (Her satıra bir tane)</label>
                            <textarea
                                value={formData.allowedOrigins}
                                onChange={(e) => handleChange('allowedOrigins', e.target.value)}
                                placeholder="https://example.com&#10;https://app.example.com"
                                rows="4"
                            />
                            <p className="form-help">CORS için izin verilen origin'leri belirtin. Her satıra bir origin yazın.</p>
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

export default AdminSettingsAPI;

