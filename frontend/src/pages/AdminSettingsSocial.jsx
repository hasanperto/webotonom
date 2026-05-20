import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiGlobe } from 'react-icons/fi';
import './AdminSettingsSocial.css';

const AdminSettingsSocial = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        github: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/social');
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
            await api.put('/admin/settings/social', formData);
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
                <div className="admin-settings-social-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-social-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Sosyal Medya Ayarları</h1>
                        <p className="page-subtitle-advanced">Sosyal medya hesaplarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>Sosyal Medya Hesapları</h3>
                        <div className="form-group">
                            <label>Facebook</label>
                            <input
                                type="url"
                                value={formData.facebook}
                                onChange={(e) => handleChange('facebook', e.target.value)}
                                placeholder="https://facebook.com/yourpage"
                            />
                        </div>
                        <div className="form-group">
                            <label>Twitter</label>
                            <input
                                type="url"
                                value={formData.twitter}
                                onChange={(e) => handleChange('twitter', e.target.value)}
                                placeholder="https://twitter.com/yourhandle"
                            />
                        </div>
                        <div className="form-group">
                            <label>Instagram</label>
                            <input
                                type="url"
                                value={formData.instagram}
                                onChange={(e) => handleChange('instagram', e.target.value)}
                                placeholder="https://instagram.com/yourprofile"
                            />
                        </div>
                        <div className="form-group">
                            <label>LinkedIn</label>
                            <input
                                type="url"
                                value={formData.linkedin}
                                onChange={(e) => handleChange('linkedin', e.target.value)}
                                placeholder="https://linkedin.com/company/yourcompany"
                            />
                        </div>
                        <div className="form-group">
                            <label>YouTube</label>
                            <input
                                type="url"
                                value={formData.youtube}
                                onChange={(e) => handleChange('youtube', e.target.value)}
                                placeholder="https://youtube.com/@yourchannel"
                            />
                        </div>
                        <div className="form-group">
                            <label>GitHub</label>
                            <input
                                type="url"
                                value={formData.github}
                                onChange={(e) => handleChange('github', e.target.value)}
                                placeholder="https://github.com/yourusername"
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

export default AdminSettingsSocial;

