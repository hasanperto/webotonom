import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiZap } from 'react-icons/fi';
import './AdminSettingsMaintenance.css';

const AdminSettingsMaintenance = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        enabled: false,
        message_tr: 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
        message_en: 'Site is under maintenance. Please try again later.',
        message_de: 'Die Website befindet sich im Wartungsmodus. Bitte versuchen Sie es später erneut.',
        allowedIps: '',
        access_password: ''
    });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/maintenance');
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
            await api.put('/admin/settings/maintenance', formData);
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
                <div className="admin-settings-maintenance-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-maintenance-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Bakım Modu</h1>
                        <p className="page-subtitle-advanced">Site bakım modunu yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>Bakım Modu Ayarları</h3>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.enabled}
                                    onChange={(e) => handleChange('enabled', e.target.checked)}
                                />
                                <span>Bakım modunu etkinleştir</span>
                            </label>
                            <p className="form-help">Bakım modu aktifken sadece yöneticiler ve izin verilen IP adresleri siteye erişebilir.</p>
                        </div>
                        {formData.enabled && (
                            <>
                                <div className="form-group">
                                    <label>Bakım Mesajı (Türkçe)</label>
                                    <textarea
                                        value={formData.message_tr}
                                        onChange={(e) => handleChange('message_tr', e.target.value)}
                                        placeholder="Site bakımda. Lütfen daha sonra tekrar deneyin."
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bakım Mesajı (İngilizce)</label>
                                    <textarea
                                        value={formData.message_en}
                                        onChange={(e) => handleChange('message_en', e.target.value)}
                                        placeholder="Site is under maintenance. Please try again later."
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bakım Mesajı (Almanca)</label>
                                    <textarea
                                        value={formData.message_de}
                                        onChange={(e) => handleChange('message_de', e.target.value)}
                                        placeholder="Die Website befindet sich im Wartungsmodus. Bitte versuchen Sie es später erneut."
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>İzin Verilen IP Adresleri (Her satıra bir tane)</label>
                                    <textarea
                                        value={formData.allowedIps}
                                        onChange={(e) => handleChange('allowedIps', e.target.value)}
                                        placeholder="127.0.0.1&#10;192.168.1.1"
                                        rows="4"
                                    />
                                    <p className="form-help">Bakım modunda siteye erişebilecek IP adreslerini belirtin. Her satıra bir IP yazın.</p>
                                </div>
                                <div className="form-group">
                                    <label>Bakım Modu Erişim Şifresi</label>
                                    <div className="password-field-wrapper">
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Yeni şifre (boş bırakılırsa admin şifresi kullanılır)"
                                            className="password-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (newPassword) {
                                                    try {
                                                        const dataToSave = { ...formData, access_password: newPassword };
                                                        await api.put('/admin/settings/maintenance', dataToSave);
                                                        setNewPassword('');
                                                        alert('Şifre kaydedildi!');
                                                    } catch (error) {
                                                        console.error('Password save error:', error);
                                                        alert('Şifre kaydedilirken hata oluştu!');
                                                    }
                                                }
                                            }}
                                            className="btn-save-password"
                                        >
                                            Şifreyi Kaydet
                                        </button>
                                    </div>
                                    <p className="form-help">Bakım modunu kapatmak için kullanılacak şifre. Boş bırakılırsa admin kullanıcı şifresi kullanılır.</p>
                                </div>
                            </>
                        )}
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

export default AdminSettingsMaintenance;

