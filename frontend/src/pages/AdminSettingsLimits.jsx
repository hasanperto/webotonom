import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiLock } from 'react-icons/fi';
import './AdminSettingsLimits.css';

const AdminSettingsLimits = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        maxFileSize: 10,
        maxProjectsPerUser: 10,
        maxImagesPerProject: 20,
        maxFileUploads: 5
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/limits');
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
            await api.put('/admin/settings/limits', formData);
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
                <div className="admin-settings-limits-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-limits-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Limit Ayarları</h1>
                        <p className="page-subtitle-advanced">Sistem limitlerini yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>Dosya Limitleri</h3>
                        <div className="form-group">
                            <label>Maksimum Dosya Boyutu (MB)</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.maxFileSize}
                                onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value))}
                                placeholder="10"
                            />
                            <p className="form-help">Kullanıcıların yükleyebileceği maksimum dosya boyutu</p>
                        </div>
                        <div className="form-group">
                            <label>Maksimum Dosya Yükleme Sayısı</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.maxFileUploads}
                                onChange={(e) => handleChange('maxFileUploads', parseInt(e.target.value))}
                                placeholder="5"
                            />
                            <p className="form-help">Tek seferde yüklenebilecek maksimum dosya sayısı</p>
                        </div>
                    </div>

                    <div className="form-section-minimal">
                        <h3>Proje Limitleri</h3>
                        <div className="form-group">
                            <label>Kullanıcı Başına Maksimum Proje Sayısı</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.maxProjectsPerUser}
                                onChange={(e) => handleChange('maxProjectsPerUser', parseInt(e.target.value))}
                                placeholder="10"
                            />
                            <p className="form-help">Bir kullanıcının oluşturabileceği maksimum proje sayısı</p>
                        </div>
                        <div className="form-group">
                            <label>Proje Başına Maksimum Görsel Sayısı</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.maxImagesPerProject}
                                onChange={(e) => handleChange('maxImagesPerProject', parseInt(e.target.value))}
                                placeholder="20"
                            />
                            <p className="form-help">Bir projeye eklenebilecek maksimum görsel sayısı</p>
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

export default AdminSettingsLimits;

