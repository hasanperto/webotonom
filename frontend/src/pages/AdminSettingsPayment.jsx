import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiCreditCard } from 'react-icons/fi';
import './AdminSettingsPayment.css';

const AdminSettingsPayment = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        stripeEnabled: false,
        stripePublicKey: '',
        stripeSecretKey: '',
        iyzicoEnabled: false,
        iyzicoApiKey: '',
        iyzicoSecretKey: '',
        paypalEnabled: false,
        paypalClientId: '',
        paypalSecret: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/payment');
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
            await api.put('/admin/settings/payment', formData);
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
                <div className="admin-settings-payment-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-payment-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Sanal Poslar</h1>
                        <p className="page-subtitle-advanced">Ödeme gateway ayarlarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="payment-gateway-section">
                        <div className="payment-gateway-card">
                            <div className="gateway-header">
                                <div className="gateway-info">
                                    <h3>Stripe</h3>
                                    <p>Kredi kartı ödemeleri için Stripe entegrasyonu</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.stripeEnabled}
                                        onChange={(e) => handleChange('stripeEnabled', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {formData.stripeEnabled && (
                                <div className="gateway-fields">
                                    <div className="form-group">
                                        <label>Public Key *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.stripePublicKey}
                                            onChange={(e) => handleChange('stripePublicKey', e.target.value)}
                                            placeholder="pk_test_..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Secret Key *</label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.stripeSecretKey}
                                            onChange={(e) => handleChange('stripeSecretKey', e.target.value)}
                                            placeholder="sk_test_..."
                                        />
                                    </div>
                                    <div className="test-info-box">
                                        <h4>Test Kart Bilgileri</h4>
                                        <div className="test-card-item">
                                            <strong>Başarılı Ödeme:</strong>
                                            <code>4242 4242 4242 4242</code>
                                            <span className="test-card-details">CVV: Herhangi bir 3 haneli sayı, Tarih: Gelecek bir tarih</span>
                                        </div>
                                        <div className="test-card-item">
                                            <strong>3D Secure:</strong>
                                            <code>4000 0027 6000 3184</code>
                                        </div>
                                        <div className="test-card-item">
                                            <strong>Reddedilen Kart:</strong>
                                            <code>4000 0000 0000 0002</code>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="payment-gateway-card">
                            <div className="gateway-header">
                                <div className="gateway-info">
                                    <h3>Iyzico</h3>
                                    <p>Türkiye için özel ödeme çözümü</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.iyzicoEnabled}
                                        onChange={(e) => handleChange('iyzicoEnabled', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {formData.iyzicoEnabled && (
                                <div className="gateway-fields">
                                    <div className="form-group">
                                        <label>API Key</label>
                                        <input
                                            type="text"
                                            value={formData.iyzicoApiKey}
                                            onChange={(e) => handleChange('iyzicoApiKey', e.target.value)}
                                            placeholder="Iyzico API anahtarı"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Secret Key</label>
                                        <input
                                            type="password"
                                            value={formData.iyzicoSecretKey}
                                            onChange={(e) => handleChange('iyzicoSecretKey', e.target.value)}
                                            placeholder="Iyzico gizli anahtarı"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="payment-gateway-card">
                            <div className="gateway-header">
                                <div className="gateway-info">
                                    <h3>PayPal</h3>
                                    <p>PayPal ödeme entegrasyonu</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.paypalEnabled}
                                        onChange={(e) => handleChange('paypalEnabled', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {formData.paypalEnabled && (
                                <div className="gateway-fields">
                                    <div className="form-group">
                                        <label>Client ID *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.paypalClientId}
                                            onChange={(e) => handleChange('paypalClientId', e.target.value)}
                                            placeholder="PayPal Client ID"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Secret *</label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.paypalSecret}
                                            onChange={(e) => handleChange('paypalSecret', e.target.value)}
                                            placeholder="PayPal Secret"
                                        />
                                    </div>
                                    <div className="test-info-box">
                                        <h4>PayPal Test Sistemi</h4>
                                        <p className="test-info-text">
                                            PayPal Sandbox modunda test yapabilirsiniz. Test hesabı oluşturmak için:
                                        </p>
                                        <ol className="test-info-list">
                                            <li><a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer">PayPal Developer</a> sayfasına gidin</li>
                                            <li>Sandbox hesabı oluşturun</li>
                                            <li>Test Client ID ve Secret'ı buraya girin</li>
                                        </ol>
                                        <div className="test-card-item">
                                            <strong>Test Modu:</strong>
                                            <span>Sandbox API endpoint'leri otomatik kullanılacak</span>
                                        </div>
                                    </div>
                                </div>
                            )}
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

export default AdminSettingsPayment;

