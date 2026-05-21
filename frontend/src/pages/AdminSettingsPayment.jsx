import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import './AdminSettingsPayment.css';

const mapFromApi = (data = {}) => ({
    paymentDemoMode: data.payment_demo_mode !== false && data.payment_demo_mode !== '0' && data.payment_demo_mode !== 0,
    creditCardEnabled: data.credit_card_enabled !== false && data.credit_card_enabled !== '0',
    bankTransferEnabled: data.bank_transfer_enabled !== false && data.bank_transfer_enabled !== '0',
    balanceEnabled: data.balance_enabled !== false && data.balance_enabled !== '0',
    paypalEnabled: data.paypal_enabled === true || data.paypal_enabled === '1' || data.paypal_enabled === 1,
    stripeEnabled: data.stripe_enabled === true || data.stripe_enabled === '1',
    stripePublicKey: data.stripe_public_key || '',
    stripeSecretKey: data.stripe_secret_key || '',
    iyzicoEnabled: data.iyzico_enabled === true || data.iyzico_enabled === '1',
    iyzicoApiKey: data.iyzico_api_key || '',
    iyzicoSecretKey: data.iyzico_secret_key || '',
    paypalClientId: data.paypal_client_id || '',
    paypalSecret: data.paypal_secret || '',
    demoCardNumber: data.demo_card_number || '4242 4242 4242 4242',
    demoCardHolder: data.demo_card_holder || 'Demo Kullanici',
    demoCardExpiry: data.demo_card_expiry || '12/34',
    demoCardCvv: data.demo_card_cvv || '123',
    demoPaypalEmail: data.demo_paypal_email || 'demo@teknopro.com',
    demoPaypalPassword: data.demo_paypal_password || 'demo1234',
});

const mapToApi = (form) => ({
    payment_demo_mode: form.paymentDemoMode,
    credit_card_enabled: form.creditCardEnabled,
    bank_transfer_enabled: form.bankTransferEnabled,
    balance_enabled: form.balanceEnabled,
    paypal_enabled: form.paypalEnabled,
    stripe_enabled: form.stripeEnabled,
    stripe_public_key: form.stripePublicKey,
    stripe_secret_key: form.stripeSecretKey,
    iyzico_enabled: form.iyzicoEnabled,
    iyzico_api_key: form.iyzicoApiKey,
    iyzico_secret_key: form.iyzicoSecretKey,
    paypal_client_id: form.paypalClientId,
    paypal_secret: form.paypalSecret,
    demo_card_number: form.demoCardNumber,
    demo_card_holder: form.demoCardHolder,
    demo_card_expiry: form.demoCardExpiry,
    demo_card_cvv: form.demoCardCvv,
    demo_paypal_email: form.demoPaypalEmail,
    demo_paypal_password: form.demoPaypalPassword,
});

const AdminSettingsPayment = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(mapFromApi());

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/payment');
            if (response.data) {
                setFormData(mapFromApi(response.data));
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
            await api.put('/admin/settings/payment', mapToApi(formData));
            alert('Ayarlar kaydedildi');
        } catch (error) {
            console.error('Settings save error:', error);
            alert('Ayarlar kaydedilirken hata olustu');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
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
                        <p className="page-subtitle-advanced">Odeme ve demo test ayarlari</p>
                    </div>
                    <div className="header-actions">
                        <button type="button" className="btn-refresh" onClick={loadSettings}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="payment-gateway-section">
                        <div className="payment-gateway-card demo-mode-card">
                            <div className="gateway-header">
                                <div className="gateway-info">
                                    <h3>Demo odeme modu</h3>
                                    <p>Acikken gercek Stripe/PayPal dogrulamasi yapilmaz; asagidaki test bilgileri gecer.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.paymentDemoMode}
                                        onChange={(e) => handleChange('paymentDemoMode', e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {formData.paymentDemoMode && (
                                <div className="gateway-fields">
                                    <h4>Test kredi karti</h4>
                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label>Kart numarasi</label>
                                            <input
                                                type="text"
                                                value={formData.demoCardNumber}
                                                onChange={(e) => handleChange('demoCardNumber', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Kart sahibi</label>
                                            <input
                                                type="text"
                                                value={formData.demoCardHolder}
                                                onChange={(e) => handleChange('demoCardHolder', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label>SKT</label>
                                            <input
                                                type="text"
                                                value={formData.demoCardExpiry}
                                                onChange={(e) => handleChange('demoCardExpiry', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>CVV</label>
                                            <input
                                                type="text"
                                                value={formData.demoCardCvv}
                                                onChange={(e) => handleChange('demoCardCvv', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <h4>Demo PayPal</h4>
                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label>E-posta</label>
                                            <input
                                                type="email"
                                                value={formData.demoPaypalEmail}
                                                onChange={(e) => handleChange('demoPaypalEmail', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Sifre</label>
                                            <input
                                                type="text"
                                                value={formData.demoPaypalPassword}
                                                onChange={(e) => handleChange('demoPaypalPassword', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="payment-gateway-card">
                            <div className="gateway-header">
                                <div className="gateway-info">
                                    <h3>Odeme yontemleri</h3>
                                </div>
                            </div>
                            <div className="gateway-fields toggle-list">
                                <label><input type="checkbox" checked={formData.creditCardEnabled} onChange={(e) => handleChange('creditCardEnabled', e.target.checked)} /> Kredi karti</label>
                                <label><input type="checkbox" checked={formData.paypalEnabled} onChange={(e) => handleChange('paypalEnabled', e.target.checked)} /> PayPal</label>
                                <label><input type="checkbox" checked={formData.bankTransferEnabled} onChange={(e) => handleChange('bankTransferEnabled', e.target.checked)} /> Havale</label>
                                <label><input type="checkbox" checked={formData.balanceEnabled} onChange={(e) => handleChange('balanceEnabled', e.target.checked)} /> Bakiye</label>
                            </div>
                        </div>

                        <div className="payment-gateway-card">
                            <div className="gateway-header">
                                <div className="gateway-info">
                                    <h3>Stripe (canli entegrasyon)</h3>
                                    <p>Secret key girilince demo modu devre disi kalir (kart icin).</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={formData.stripeEnabled} onChange={(e) => handleChange('stripeEnabled', e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {formData.stripeEnabled && (
                                <div className="gateway-fields">
                                    <div className="form-group">
                                        <label>Public Key</label>
                                        <input type="text" value={formData.stripePublicKey} onChange={(e) => handleChange('stripePublicKey', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Secret Key</label>
                                        <input type="password" value={formData.stripeSecretKey} onChange={(e) => handleChange('stripeSecretKey', e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="payment-gateway-card">
                            <div className="gateway-header">
                                <div className="gateway-info">
                                    <h3>PayPal API</h3>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={formData.paypalEnabled} onChange={(e) => handleChange('paypalEnabled', e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {formData.paypalEnabled && (
                                <div className="gateway-fields">
                                    <div className="form-group">
                                        <label>Client ID</label>
                                        <input type="text" value={formData.paypalClientId} onChange={(e) => handleChange('paypalClientId', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Secret</label>
                                        <input type="password" value={formData.paypalSecret} onChange={(e) => handleChange('paypalSecret', e.target.value)} />
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
