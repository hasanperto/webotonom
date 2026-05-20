import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import { FiSave, FiRefreshCw, FiSliders, FiUpload, FiLink, FiImage, FiX, FiDollarSign } from 'react-icons/fi';
import './AdminSettingsGeneral.css';

const AdminSettingsGeneral = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingRates, setUpdatingRates] = useState(false);
    const [ratesUpdatedAt, setRatesUpdatedAt] = useState(null);
    const { refreshExchangeRates } = useCurrency();
    const [logoUploadType, setLogoUploadType] = useState('url'); // 'url' veya 'file'
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [formData, setFormData] = useState({
        siteName: '',
        siteDescription: '',
        siteUrl: '',
        siteEmail: '',
        sitePhone: '',
        siteAddress: '',
        logo: '',
        favicon: '',
        timezone: 'Europe/Istanbul',
        currency: 'TRY',
        language: 'tr',
        commissionRateSilver: 10,
        commissionRateGold: 15,
        commissionRatePlatinum: 20
    });

    useEffect(() => {
        loadSettings();
        loadExchangeRatesInfo();
    }, []);

    const loadExchangeRatesInfo = async () => {
        try {
            const response = await api.get('/admin/settings/currency/rates');
            if (response.data?.updatedAt) {
                setRatesUpdatedAt(response.data.updatedAt);
            }
        } catch (error) {
            console.error('Exchange rates info load error:', error);
        }
    };

    const handleUpdateExchangeRates = async () => {
        try {
            setUpdatingRates(true);
            const response = await api.post('/admin/settings/currency/update-rates');
            
            if (response.data) {
                setRatesUpdatedAt(response.data.updatedAt);
                // CurrencyContext'i yenile
                await refreshExchangeRates(true);
                alert('Döviz kurları başarıyla güncellendi!');
            }
        } catch (error) {
            console.error('Update exchange rates error:', error);
            alert(error.response?.data?.error || 'Döviz kurları güncellenirken hata oluştu!');
        } finally {
            setUpdatingRates(false);
        }
    };

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/general');
            if (response.data) {
                const data = response.data;
                setFormData(prev => ({
                    ...prev,
                    ...data,
                    commissionRateSilver: data.commissionRateSilver || data.commission_rate_silver || 10,
                    commissionRateGold: data.commissionRateGold || data.commission_rate_gold || 15,
                    commissionRatePlatinum: data.commissionRatePlatinum || data.commission_rate_platinum || 20
                }));
                if (data.logo) {
                    setLogoPreview(data.logo);
                }
            }
        } catch (error) {
            console.error('Settings load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Logo dosyası 5MB\'dan küçük olmalıdır!');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Sadece resim dosyaları yüklenebilir!');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogoFile = () => {
        setLogoFile(null);
        setLogoPreview('');
        handleChange('logo', '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const formDataToSend = new FormData();
            
            // Logo dosyası varsa ekle
            if (logoUploadType === 'file' && logoFile) {
                formDataToSend.append('logo_file', logoFile);
            } else if (logoUploadType === 'url' && formData.logo) {
                formDataToSend.append('logo', formData.logo);
            }

            // Diğer alanları ekle
            Object.keys(formData).forEach(key => {
                if (key !== 'logo' || logoUploadType === 'url') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Komisyon oranlarını backend formatına çevir
            formDataToSend.append('commission_rate_silver', formData.commissionRateSilver);
            formDataToSend.append('commission_rate_gold', formData.commissionRateGold);
            formDataToSend.append('commission_rate_platinum', formData.commissionRatePlatinum);

            await api.put('/admin/settings/general', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Ayarlar başarıyla kaydedildi!');
            await loadSettings();
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
                <div className="admin-settings-general-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-general-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Genel Ayarlar</h1>
                        <p className="page-subtitle-advanced">Site genel ayarlarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>Site Bilgileri</h3>
                        <div className="form-group">
                            <label>Site Adı *</label>
                            <input
                                type="text"
                                required
                                value={formData.siteName}
                                onChange={(e) => handleChange('siteName', e.target.value)}
                                placeholder="Site adını girin"
                            />
                        </div>
                        <div className="form-group">
                            <label>Site Açıklaması</label>
                            <textarea
                                value={formData.siteDescription}
                                onChange={(e) => handleChange('siteDescription', e.target.value)}
                                placeholder="Site açıklaması"
                                rows="3"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Site URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.siteUrl}
                                    onChange={(e) => handleChange('siteUrl', e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>E-posta *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.siteEmail}
                                    onChange={(e) => handleChange('siteEmail', e.target.value)}
                                    placeholder="info@example.com"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Telefon</label>
                                <input
                                    type="tel"
                                    value={formData.sitePhone}
                                    onChange={(e) => handleChange('sitePhone', e.target.value)}
                                    placeholder="+90 555 123 4567"
                                />
                            </div>
                            <div className="form-group">
                                <label>Adres</label>
                                <input
                                    type="text"
                                    value={formData.siteAddress}
                                    onChange={(e) => handleChange('siteAddress', e.target.value)}
                                    placeholder="Site adresi"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section-minimal">
                        <h3>Görsel Ayarlar</h3>
                        <div className="form-group">
                            <label>Logo</label>
                            <div className="logo-upload-tabs">
                                <button
                                    type="button"
                                    className={`tab-btn ${logoUploadType === 'url' ? 'active' : ''}`}
                                    onClick={() => setLogoUploadType('url')}
                                >
                                    <FiLink /> URL
                                </button>
                                <button
                                    type="button"
                                    className={`tab-btn ${logoUploadType === 'file' ? 'active' : ''}`}
                                    onClick={() => setLogoUploadType('file')}
                                >
                                    <FiUpload /> Dosya Yükle
                                </button>
                            </div>
                            
                            {logoUploadType === 'url' ? (
                                <div className="form-group">
                                    <input
                                        type="url"
                                        value={formData.logo}
                                        onChange={(e) => {
                                            handleChange('logo', e.target.value);
                                            setLogoPreview(e.target.value);
                                        }}
                                        placeholder="https://example.com/logo.png"
                                    />
                                </div>
                            ) : (
                                <div className="file-upload-area">
                                    <input
                                        type="file"
                                        id="logo-file"
                                        accept="image/*"
                                        onChange={handleLogoFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="logo-file" className="file-upload-label">
                                        <FiImage /> Logo Seç (Max 5MB)
                                    </label>
                                    {logoPreview && (
                                        <div className="logo-preview">
                                            <img src={logoPreview} alt="Logo önizleme" />
                                            <button
                                                type="button"
                                                className="remove-logo-btn"
                                                onClick={removeLogoFile}
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {logoPreview && (
                                <div className="logo-preview-container">
                                    <p className="preview-label">Önizleme:</p>
                                    <img src={logoPreview} alt="Logo önizleme" className="preview-image" />
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Favicon URL</label>
                            <input
                                type="url"
                                value={formData.favicon}
                                onChange={(e) => handleChange('favicon', e.target.value)}
                                placeholder="https://example.com/favicon.ico"
                            />
                        </div>
                    </div>

                    <div className="form-section-minimal">
                        <h3>Bölgesel Ayarlar</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Para Birimi</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => handleChange('currency', e.target.value)}
                                        style={{ flex: 1 }}
                                    >
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="JPY">JPY (¥)</option>
                                        <option value="CNY">CNY (¥)</option>
                                        <option value="RUB">RUB (₽)</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleUpdateExchangeRates}
                                        disabled={updatingRates}
                                        className="btn-update-rates"
                                        title="Döviz kurlarını güncelle"
                                    >
                                        <FiDollarSign />
                                        {updatingRates ? 'Güncelleniyor...' : 'Kurları Güncelle'}
                                    </button>
                                </div>
                                <small className="form-hint">
                                    Para birimi değiştiğinde fiyatlar otomatik olarak çevrilecektir
                                    {ratesUpdatedAt && (
                                        <span style={{ display: 'block', marginTop: '0.25rem', color: '#059669' }}>
                                            Son güncelleme: {new Date(ratesUpdatedAt).toLocaleString('tr-TR')}
                                        </span>
                                    )}
                                </small>
                            </div>
                            <div className="form-group">
                                <label>Zaman Dilimi</label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => handleChange('timezone', e.target.value)}
                                >
                                    <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                                    <option value="UTC">UTC (GMT+0)</option>
                                    <option value="America/New_York">America/New_York (GMT-5)</option>
                                    <option value="Europe/London">Europe/London (GMT+0)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Varsayılan Dil</label>
                                <select
                                    value={formData.language}
                                    onChange={(e) => handleChange('language', e.target.value)}
                                >
                                    <option value="tr">Türkçe</option>
                                    <option value="en">English</option>
                                    <option value="de">Deutsch</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section-minimal">
                        <h3>Finansal Ayarlar - Abonelik Bazlı Komisyon Oranları</h3>
                        <div className="commission-rates-grid">
                            <div className="form-group">
                                <label>Silver Plan Komisyon Oranı (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={formData.commissionRateSilver}
                                    onChange={(e) => handleChange('commissionRateSilver', parseFloat(e.target.value) || 0)}
                                    placeholder="10"
                                />
                                <small className="form-hint">Silver abonelik planı için komisyon oranı</small>
                            </div>
                            <div className="form-group">
                                <label>Gold Plan Komisyon Oranı (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={formData.commissionRateGold}
                                    onChange={(e) => handleChange('commissionRateGold', parseFloat(e.target.value) || 0)}
                                    placeholder="15"
                                />
                                <small className="form-hint">Gold abonelik planı için komisyon oranı</small>
                            </div>
                            <div className="form-group">
                                <label>Platinum Plan Komisyon Oranı (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={formData.commissionRatePlatinum}
                                    onChange={(e) => handleChange('commissionRatePlatinum', parseFloat(e.target.value) || 0)}
                                    placeholder="20"
                                />
                                <small className="form-hint">Platinum abonelik planı için komisyon oranı</small>
                            </div>
                        </div>
                        <div className="info-box">
                            <p><strong>Not:</strong> Her abonelik seviyesi için farklı komisyon oranı belirleyebilirsiniz. Kullanıcının aktif abonelik planına göre komisyon oranı uygulanacaktır.</p>
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

export default AdminSettingsGeneral;
