import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiImage, FiUpload, FiX } from 'react-icons/fi';
import './AdminSettingsBackgrounds.css';

const AdminSettingsBackgrounds = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        headerBackground: '',
        footerBackground: '',
        loginBackground: '',
        registerBackground: '',
        dashboardBackground: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/backgrounds');
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
            await api.put('/admin/settings/backgrounds', formData);
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

    const handleImageUpload = async (field, file) => {
        // Bu kısım dosya yükleme API'si ile entegre edilmeli
        // Şimdilik sadece URL girişi yapıyoruz
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await api.post('/admin/upload', formData);
            handleChange(field, response.data.url);
        } catch (error) {
            alert('Görsel yüklenirken hata oluştu!');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-settings-backgrounds-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-backgrounds-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Arka Plan Görselleri</h1>
                        <p className="page-subtitle-advanced">Sayfa arka plan görsellerini yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>Sayfa Arka Planları</h3>
                        
                        <div className="background-item">
                            <label>Header Arka Planı</label>
                            <div className="image-upload-wrapper">
                                {formData.headerBackground ? (
                                    <div className="image-preview">
                                        <img src={formData.headerBackground} alt="Header Background" />
                                        <button type="button" className="remove-image" onClick={() => handleChange('headerBackground', '')}>
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <FiImage />
                                        <p>Görsel yüklemek için tıklayın</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            handleImageUpload('headerBackground', e.target.files[0]);
                                        }
                                    }}
                                    className="file-input"
                                />
                            </div>
                            <input
                                type="url"
                                value={formData.headerBackground}
                                onChange={(e) => handleChange('headerBackground', e.target.value)}
                                placeholder="veya görsel URL'si girin"
                                className="url-input"
                            />
                        </div>

                        <div className="background-item">
                            <label>Footer Arka Planı</label>
                            <div className="image-upload-wrapper">
                                {formData.footerBackground ? (
                                    <div className="image-preview">
                                        <img src={formData.footerBackground} alt="Footer Background" />
                                        <button type="button" className="remove-image" onClick={() => handleChange('footerBackground', '')}>
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <FiImage />
                                        <p>Görsel yüklemek için tıklayın</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            handleImageUpload('footerBackground', e.target.files[0]);
                                        }
                                    }}
                                    className="file-input"
                                />
                            </div>
                            <input
                                type="url"
                                value={formData.footerBackground}
                                onChange={(e) => handleChange('footerBackground', e.target.value)}
                                placeholder="veya görsel URL'si girin"
                                className="url-input"
                            />
                        </div>

                        <div className="background-item">
                            <label>Giriş Sayfası Arka Planı</label>
                            <div className="image-upload-wrapper">
                                {formData.loginBackground ? (
                                    <div className="image-preview">
                                        <img src={formData.loginBackground} alt="Login Background" />
                                        <button type="button" className="remove-image" onClick={() => handleChange('loginBackground', '')}>
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <FiImage />
                                        <p>Görsel yüklemek için tıklayın</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            handleImageUpload('loginBackground', e.target.files[0]);
                                        }
                                    }}
                                    className="file-input"
                                />
                            </div>
                            <input
                                type="url"
                                value={formData.loginBackground}
                                onChange={(e) => handleChange('loginBackground', e.target.value)}
                                placeholder="veya görsel URL'si girin"
                                className="url-input"
                            />
                        </div>

                        <div className="background-item">
                            <label>Kayıt Sayfası Arka Planı</label>
                            <div className="image-upload-wrapper">
                                {formData.registerBackground ? (
                                    <div className="image-preview">
                                        <img src={formData.registerBackground} alt="Register Background" />
                                        <button type="button" className="remove-image" onClick={() => handleChange('registerBackground', '')}>
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <FiImage />
                                        <p>Görsel yüklemek için tıklayın</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            handleImageUpload('registerBackground', e.target.files[0]);
                                        }
                                    }}
                                    className="file-input"
                                />
                            </div>
                            <input
                                type="url"
                                value={formData.registerBackground}
                                onChange={(e) => handleChange('registerBackground', e.target.value)}
                                placeholder="veya görsel URL'si girin"
                                className="url-input"
                            />
                        </div>

                        <div className="background-item">
                            <label>Dashboard Arka Planı</label>
                            <div className="image-upload-wrapper">
                                {formData.dashboardBackground ? (
                                    <div className="image-preview">
                                        <img src={formData.dashboardBackground} alt="Dashboard Background" />
                                        <button type="button" className="remove-image" onClick={() => handleChange('dashboardBackground', '')}>
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <FiImage />
                                        <p>Görsel yüklemek için tıklayın</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            handleImageUpload('dashboardBackground', e.target.files[0]);
                                        }
                                    }}
                                    className="file-input"
                                />
                            </div>
                            <input
                                type="url"
                                value={formData.dashboardBackground}
                                onChange={(e) => handleChange('dashboardBackground', e.target.value)}
                                placeholder="veya görsel URL'si girin"
                                className="url-input"
                            />
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

export default AdminSettingsBackgrounds;

