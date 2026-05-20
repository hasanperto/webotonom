import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import { 
    FiSave, FiRefreshCw, FiSliders, FiServer, FiMail, 
    FiGlobe, FiLayers, FiLock, FiZap, FiMessageSquare,
    FiCreditCard, FiImage, FiCheckCircle, FiXCircle, FiAlertCircle,
    FiDollarSign
} from 'react-icons/fi';
import './AdminSettings.css';

const AdminSettings = () => {
    const { refreshExchangeRates } = useCurrency();
    const { tab } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tab || 'general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingRates, setUpdatingRates] = useState(false);
    const [settings, setSettings] = useState({
        general: {
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
            language: 'tr'
        },
        api: {
            apiEnabled: false,
            apiKey: '',
            apiSecret: '',
            rateLimit: 100,
            allowedOrigins: ''
        },
        contact: {
            email: '',
            phone: '',
            address: '',
            workingHours: '',
            mapEmbed: ''
        },
        social: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
            youtube: '',
            github: ''
        },
        modules: {
            blogEnabled: true,
            ticketsEnabled: true,
            donationsEnabled: true,
            subscriptionsEnabled: true,
            commentsEnabled: true,
            ratingsEnabled: true
        },
        limits: {
            maxFileSize: 10,
            maxProjectsPerUser: 10,
            maxImagesPerProject: 20,
            maxFileUploads: 5
        },
        maintenance: {
            enabled: false,
            message: 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
            allowedIps: ''
        },
        email: {
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: '',
            smtpSecure: false,
            fromEmail: '',
            fromName: ''
        },
        sms: {
            provider: '',
            apiKey: '',
            apiSecret: '',
            senderId: ''
        },
        payment: {
            stripeEnabled: false,
            stripePublicKey: '',
            stripeSecretKey: '',
            iyzicoEnabled: false,
            iyzicoApiKey: '',
            iyzicoSecretKey: '',
            paypalEnabled: false,
            paypalClientId: '',
            paypalSecret: ''
        }
    });

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (tab) {
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        navigate(`/admin/settings/${tabId}`);
    };

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings');
            if (response.data) {
                setSettings(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            console.error('Settings load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put('/admin/settings', settings);
            alert('Ayarlar başarıyla kaydedildi!');
        } catch (error) {
            console.error('Settings save error:', error);
            alert('Ayarlar kaydedilirken hata oluştu!');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (category, field, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    const handleUpdateExchangeRates = async () => {
        try {
            setUpdatingRates(true);
            const response = await api.post('/admin/settings/currency/update-rates');
            
            if (response.data) {
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

    const tabs = [
        { id: 'general', label: 'Genel Ayarlar', icon: FiSliders },
        { id: 'api', label: 'API Ayarları', icon: FiServer },
        { id: 'contact', label: 'İletişim', icon: FiMail },
        { id: 'social', label: 'Sosyal Medya', icon: FiGlobe },
        { id: 'modules', label: 'Modül Ayarları', icon: FiLayers },
        { id: 'limits', label: 'Limit Ayarları', icon: FiLock },
        { id: 'maintenance', label: 'Bakım Modu', icon: FiZap },
        { id: 'email', label: 'Mail Ayarları', icon: FiMail },
        { id: 'sms', label: 'SMS Ayarları', icon: FiMessageSquare },
        { id: 'payment', label: 'Sanal Poslar', icon: FiCreditCard },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-settings-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Site Ayarları</h1>
                        <p className="page-subtitle-advanced">Tüm site ayarlarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button 
                            className="btn-update-rates" 
                            onClick={handleUpdateExchangeRates}
                            disabled={updatingRates}
                            title="Döviz kurlarını güncelle"
                        >
                            <FiDollarSign className={updatingRates ? 'spinning' : ''} /> 
                            {updatingRates ? 'Güncelleniyor...' : 'Kurları Güncelle'}
                        </button>
                        <button className="btn-save" onClick={handleSave} disabled={saving}>
                            <FiSave /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>

                <div className="settings-container">
                    <div className="settings-tabs">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => handleTabChange(tab.id)}
                                >
                                    <Icon />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="settings-content">
                        {activeTab === 'general' && (
                            <div className="settings-section">
                                <h2>Genel Ayarlar</h2>
                                <div className="settings-form">
                                    <div className="form-group">
                                        <label>Site Adı *</label>
                                        <input
                                            type="text"
                                            value={settings.general.siteName}
                                            onChange={(e) => handleChange('general', 'siteName', e.target.value)}
                                            placeholder="Site adını girin"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Site Açıklaması</label>
                                        <textarea
                                            value={settings.general.siteDescription}
                                            onChange={(e) => handleChange('general', 'siteDescription', e.target.value)}
                                            placeholder="Site açıklaması"
                                            rows="3"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Site URL *</label>
                                            <input
                                                type="url"
                                                value={settings.general.siteUrl}
                                                onChange={(e) => handleChange('general', 'siteUrl', e.target.value)}
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>E-posta *</label>
                                            <input
                                                type="email"
                                                value={settings.general.siteEmail}
                                                onChange={(e) => handleChange('general', 'siteEmail', e.target.value)}
                                                placeholder="info@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Telefon</label>
                                            <input
                                                type="tel"
                                                value={settings.general.sitePhone}
                                                onChange={(e) => handleChange('general', 'sitePhone', e.target.value)}
                                                placeholder="+90 555 123 4567"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Para Birimi</label>
                                            <select
                                                value={settings.general.currency}
                                                onChange={(e) => handleChange('general', 'currency', e.target.value)}
                                            >
                                                <option value="TRY">TRY (₺)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'maintenance' && (
                            <div className="settings-section">
                                <h2>Bakım Modu</h2>
                                <div className="settings-form">
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={settings.maintenance.enabled}
                                                onChange={(e) => handleChange('maintenance', 'enabled', e.target.checked)}
                                            />
                                            <span>Bakım modunu etkinleştir</span>
                                        </label>
                                        <p className="form-help">Bakım modu aktifken sadece yöneticiler siteye erişebilir.</p>
                                    </div>
                                    {settings.maintenance.enabled && (
                                        <>
                                            <div className="form-group">
                                                <label>Bakım Mesajı</label>
                                                <textarea
                                                    value={settings.maintenance.message}
                                                    onChange={(e) => handleChange('maintenance', 'message', e.target.value)}
                                                    placeholder="Bakım modu mesajı"
                                                    rows="3"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>İzin Verilen IP Adresleri</label>
                                                <input
                                                    type="text"
                                                    value={settings.maintenance.allowedIps}
                                                    onChange={(e) => handleChange('maintenance', 'allowedIps', e.target.value)}
                                                    placeholder="127.0.0.1, 192.168.1.1 (virgülle ayırın)"
                                                />
                                                <p className="form-help">Bu IP adresleri bakım modunda da siteye erişebilir.</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'modules' && (
                            <div className="settings-section">
                                <h2>Modül Ayarları</h2>
                                <div className="settings-form">
                                    <div className="modules-grid">
                                        {Object.entries(settings.modules).map(([key, value]) => (
                                            <div key={key} className="module-toggle">
                                                <div className="module-info">
                                                    <h3>{key.replace('Enabled', '').replace(/([A-Z])/g, ' $1').trim()}</h3>
                                                    <p>Bu modülü aktif/pasif yapın</p>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={value}
                                                        onChange={(e) => handleChange('modules', key, e.target.checked)}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Diğer tablar için placeholder */}
                        {activeTab !== 'general' && activeTab !== 'maintenance' && activeTab !== 'modules' && (
                            <div className="settings-section">
                                <h2>{tabs.find(t => t.id === activeTab)?.label}</h2>
                                <div className="settings-form">
                                    <div className="coming-soon">
                                        <FiAlertCircle />
                                        <p>Bu bölüm yakında eklenecek</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;

