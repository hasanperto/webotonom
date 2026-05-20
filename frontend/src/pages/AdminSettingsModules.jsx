import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiLayers } from 'react-icons/fi';
import './AdminSettingsModules.css';

const AdminSettingsModules = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        blogEnabled: true,
        ticketsEnabled: true,
        donationsEnabled: true,
        subscriptionsEnabled: true,
        commentsEnabled: true,
        ratingsEnabled: true
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/modules');
            if (response.data) {
                // Backend'den gelen verileri frontend formatına çevir
                const mappedData = {
                    blogEnabled: response.data.blog_enabled !== undefined 
                        ? (response.data.blog_enabled === true || response.data.blog_enabled === '1' || response.data.blog_enabled === 1)
                        : response.data.blogEnabled !== undefined ? response.data.blogEnabled : true,
                    ticketsEnabled: response.data.tickets_enabled !== undefined
                        ? (response.data.tickets_enabled === true || response.data.tickets_enabled === '1' || response.data.tickets_enabled === 1)
                        : response.data.ticketsEnabled !== undefined ? response.data.ticketsEnabled : true,
                    donationsEnabled: response.data.donations_enabled !== undefined
                        ? (response.data.donations_enabled === true || response.data.donations_enabled === '1' || response.data.donations_enabled === 1)
                        : response.data.donationsEnabled !== undefined ? response.data.donationsEnabled : true,
                    subscriptionsEnabled: response.data.subscriptions_enabled !== undefined
                        ? (response.data.subscriptions_enabled === true || response.data.subscriptions_enabled === '1' || response.data.subscriptions_enabled === 1)
                        : response.data.subscriptionsEnabled !== undefined ? response.data.subscriptionsEnabled : true,
                    commentsEnabled: response.data.comments_enabled !== undefined
                        ? (response.data.comments_enabled === true || response.data.comments_enabled === '1' || response.data.comments_enabled === 1)
                        : response.data.commentsEnabled !== undefined ? response.data.commentsEnabled : true,
                    ratingsEnabled: response.data.ratings_enabled !== undefined
                        ? (response.data.ratings_enabled === true || response.data.ratings_enabled === '1' || response.data.ratings_enabled === 1)
                        : response.data.ratingsEnabled !== undefined ? response.data.ratingsEnabled : true
                };
                setFormData(prev => ({ ...prev, ...mappedData }));
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
            // Frontend formatını backend formatına çevir
            const backendData = {
                blog_enabled: formData.blogEnabled ? '1' : '0',
                tickets_enabled: formData.ticketsEnabled ? '1' : '0',
                donations_enabled: formData.donationsEnabled ? '1' : '0',
                subscriptions_enabled: formData.subscriptionsEnabled ? '1' : '0',
                comments_enabled: formData.commentsEnabled ? '1' : '0',
                ratings_enabled: formData.ratingsEnabled ? '1' : '0'
            };
            await api.put('/admin/settings/modules', backendData);
            alert('Ayarlar başarıyla kaydedildi!');
            await loadSettings(); // Ayarları yeniden yükle
        } catch (error) {
            console.error('Settings save error:', error);
            alert(error.response?.data?.error || 'Ayarlar kaydedilirken hata oluştu!');
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
                <div className="admin-settings-modules-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-modules-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Modül Ayarları</h1>
                        <p className="page-subtitle-advanced">Sistem modüllerini etkinleştirin veya devre dışı bırakın</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>Modül Durumları</h3>
                        <div className="modules-grid">
                            <div className="module-card">
                                <div className="module-header">
                                    <h4>Blog Modülü</h4>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.blogEnabled}
                                            onChange={(e) => handleChange('blogEnabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="module-description">Blog yazıları ve içerik yönetimi</p>
                            </div>

                            <div className="module-card">
                                <div className="module-header">
                                    <h4>Destek Modülü</h4>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.ticketsEnabled}
                                            onChange={(e) => handleChange('ticketsEnabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="module-description">Ticket sistemi ve müşteri desteği</p>
                            </div>

                            <div className="module-card">
                                <div className="module-header">
                                    <h4>Bağış Modülü</h4>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.donationsEnabled}
                                            onChange={(e) => handleChange('donationsEnabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="module-description">Proje bağışları ve sponsorluk sistemi</p>
                            </div>

                            <div className="module-card">
                                <div className="module-header">
                                    <h4>Abonelik Modülü</h4>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.subscriptionsEnabled}
                                            onChange={(e) => handleChange('subscriptionsEnabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="module-description">Abonelik planları ve yönetimi</p>
                            </div>

                            <div className="module-card">
                                <div className="module-header">
                                    <h4>Yorum Modülü</h4>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.commentsEnabled}
                                            onChange={(e) => handleChange('commentsEnabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="module-description">Yorum ve değerlendirme sistemi</p>
                            </div>

                            <div className="module-card">
                                <div className="module-header">
                                    <h4>Değerlendirme Modülü</h4>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.ratingsEnabled}
                                            onChange={(e) => handleChange('ratingsEnabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <p className="module-description">Yıldızlı değerlendirme sistemi</p>
                            </div>
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

export default AdminSettingsModules;

