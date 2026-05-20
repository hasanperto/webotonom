import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../context/AuthContext';
import {
    FiSettings, FiLock, FiBell, FiShield, FiSave, FiEye, FiEyeOff,
    FiMail, FiSmartphone, FiGlobe, FiTrash2, FiKey, FiCheckCircle,
    FiAlertCircle, FiUser, FiCreditCard, FiDatabase, FiLogOut,
    FiMapPin, FiPlus, FiEdit, FiHome, FiBriefcase, FiXCircle
} from 'react-icons/fi';
import { userAddressesAPI } from '../api/userAddresses';
import { userPaymentCardsAPI } from '../api/userPaymentCards';
import './UserSettings.css';

const UserSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('notifications');
    const [settings, setSettings] = useState({
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: false,
        order_updates: true,
        project_updates: true,
        newsletter: false,
        two_factor_auth: false,
        login_alerts: true,
        session_timeout: 30
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Address states
    const [addresses, setAddresses] = useState([]);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({
        type: 'home',
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        district: '',
        postal_code: '',
        phone: '',
        country: 'Türkiye',
        is_default: false
    });
    const [editingAddress, setEditingAddress] = useState(null);

    // Payment card states
    const [cards, setCards] = useState([]);
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [newCard, setNewCard] = useState({
        card_number: '',
        card_holder: '',
        expiry_date: '',
        cvv: '',
        save_card: true
    });

    const tabs = [
        { id: 'notifications', label: 'Bildirimler', icon: FiBell },
        { id: 'security', label: 'Güvenlik', icon: FiShield },
        { id: 'addresses', label: 'Adreslerim', icon: FiMapPin },
        { id: 'payment-cards', label: 'Ödeme Kartlarım', icon: FiCreditCard },
        { id: 'privacy', label: 'Gizlilik', icon: FiLock },
        { id: 'account', label: 'Hesap', icon: FiUser }
    ];

    const handleSettingsChange = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user starts typing
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validatePassword = () => {
        const errors = {};

        if (!passwordData.current_password) {
            errors.current_password = 'Mevcut şifre gereklidir';
        }

        if (!passwordData.new_password) {
            errors.new_password = 'Yeni şifre gereklidir';
        } else if (passwordData.new_password.length < 8) {
            errors.new_password = 'Şifre en az 8 karakter olmalıdır';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.new_password)) {
            errors.new_password = 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir';
        }

        if (!passwordData.confirm_password) {
            errors.confirm_password = 'Şifre onayı gereklidir';
        } else if (passwordData.new_password !== passwordData.confirm_password) {
            errors.confirm_password = 'Şifreler eşleşmiyor';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            // TODO: Backend API endpoint eklenmeli
            // await usersAPI.updateSettings(settings);
            setSuccessMessage('Ayarlar başarıyla kaydedildi!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error('Settings save error:', error);
            alert('Ayarlar kaydedilirken bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!validatePassword()) {
            return;
        }

        setSaving(true);
        try {
            // TODO: Backend API endpoint eklenmeli
            // await usersAPI.changePassword(passwordData);
            setSuccessMessage('Şifre başarıyla değiştirildi!');
            setTimeout(() => setSuccessMessage(''), 5000);
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            setPasswordErrors({});
        } catch (error) {
            console.error('Password change error:', error);
            setPasswordErrors({
                current_password: error.response?.data?.error || 'Şifre değiştirilirken bir hata oluştu.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        if (!window.confirm('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
            return;
        }

        if (!window.confirm('Lütfen hesabınızı silmek istediğinizi onaylayın. Tüm verileriniz kalıcı olarak silinecektir.')) {
            return;
        }

        // TODO: Backend API endpoint eklenmeli
        // await usersAPI.deleteAccount();
        alert('Hesap silme işlemi başlatıldı. E-posta adresinize onay linki gönderildi.');
    };

    useEffect(() => {
        if (activeTab === 'addresses') {
            loadAddresses();
        }
        if (activeTab === 'payment-cards') {
            loadCards();
        }
    }, [activeTab]);

    const loadAddresses = async () => {
        try {
            const response = await userAddressesAPI.getAddresses();
            setAddresses(response.data.addresses || []);
        } catch (error) {
            console.error('Addresses load error:', error);
        }
    };

    const loadCards = async () => {
        try {
            const response = await userPaymentCardsAPI.getCards();
            setCards(response.data.cards || []);
        } catch (error) {
            console.error('Cards load error:', error);
        }
    };

    const handleAddAddress = async () => {
        try {
            if (!newAddress.name || !newAddress.address_line1 || !newAddress.city) {
                alert('Lütfen ad, adres ve şehir bilgilerini doldurun');
                return;
            }

            await userAddressesAPI.addAddress(newAddress);
            setShowAddAddressModal(false);
            setNewAddress({
                type: 'home',
                name: '',
                address_line1: '',
                address_line2: '',
                city: '',
                district: '',
                postal_code: '',
                phone: '',
                country: 'Türkiye',
                is_default: false
            });
            await loadAddresses();
            setSuccessMessage('Adres başarıyla eklendi!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || 'Adres eklenemedi');
        }
    };

    const handleUpdateAddress = async () => {
        try {
            if (!editingAddress.name || !editingAddress.address_line1 || !editingAddress.city) {
                alert('Lütfen ad, adres ve şehir bilgilerini doldurun');
                return;
            }

            await userAddressesAPI.updateAddress(editingAddress.id, editingAddress);
            setEditingAddress(null);
            await loadAddresses();
            setSuccessMessage('Adres başarıyla güncellendi!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || 'Adres güncellenemedi');
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) {
            return;
        }
        try {
            await userAddressesAPI.deleteAddress(id);
            await loadAddresses();
            setSuccessMessage('Adres başarıyla silindi!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || 'Adres silinemedi');
        }
    };

    const handleSetDefaultAddress = async (id) => {
        try {
            await userAddressesAPI.setDefaultAddress(id);
            await loadAddresses();
            setSuccessMessage('Varsayılan adres güncellendi!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || 'Varsayılan adres güncellenemedi');
        }
    };

    const handleAddCard = async () => {
        try {
            if (!newCard.card_number || !newCard.card_holder || !newCard.expiry_date) {
                alert('Lütfen tüm kart bilgilerini doldurun');
                return;
            }

            if (!newCard.cvv || newCard.cvv.length < 3) {
                alert('Lütfen geçerli bir CVV girin');
                return;
            }

            await userPaymentCardsAPI.addCard(newCard);
            setShowAddCardModal(false);
            setNewCard({
                card_number: '',
                card_holder: '',
                expiry_date: '',
                cvv: '',
                save_card: true
            });
            await loadCards();
            setSuccessMessage('Kart başarıyla eklendi!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || 'Kart eklenemedi');
        }
    };

    const handleDeleteCard = async (id) => {
        if (!window.confirm('Bu kartı silmek istediğinize emin misiniz?')) {
            return;
        }
        try {
            await userPaymentCardsAPI.deleteCard(id);
            await loadCards();
            setSuccessMessage('Kart başarıyla silindi!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || 'Kart silinemedi');
        }
    };

    const handleSetDefaultCard = async (id) => {
        try {
            await userPaymentCardsAPI.setDefaultCard(id);
            await loadCards();
            setSuccessMessage('Varsayılan kart güncellendi!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || 'Varsayılan kart güncellenemedi');
        }
    };

    return (
        <UserLayout>
            <div className="user-settings-page">
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <FiSettings className="title-icon" />
                            Ayarlar
                        </h1>
                    </div>
                </div>

                {successMessage && (
                    <div className="success-message">
                        <FiCheckCircle className="success-icon" />
                        {successMessage}
                    </div>
                )}

                <div className="settings-container">
                    {/* Settings Tabs */}
                    <div className="settings-tabs">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon className="tab-icon" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Settings Content */}
                    <div className="settings-content">
                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <FiBell className="section-icon" />
                                    <div>
                                        <h2>Bildirim Ayarları</h2>
                                        <p>Hangi bildirimleri almak istediğinizi seçin</p>
                                    </div>
                                </div>

                                <div className="settings-list">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>E-posta Bildirimleri</h3>
                                            <p>Sipariş, mesaj ve güncelleme bildirimlerini e-posta ile alın</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.email_notifications}
                                                onChange={() => handleSettingsChange('email_notifications')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>SMS Bildirimleri</h3>
                                            <p>Önemli bildirimleri SMS ile alın</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.sms_notifications}
                                                onChange={() => handleSettingsChange('sms_notifications')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>Sipariş Güncellemeleri</h3>
                                            <p>Sipariş durumu değişikliklerinden haberdar olun</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.order_updates}
                                                onChange={() => handleSettingsChange('order_updates')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>Proje Güncellemeleri</h3>
                                            <p>Takip ettiğiniz projelerdeki gelişmelerden haberdar olun</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.project_updates}
                                                onChange={() => handleSettingsChange('project_updates')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>Pazarlama E-postaları</h3>
                                            <p>Kampanya ve özel teklifler hakkında bilgi alın</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.marketing_emails}
                                                onChange={() => handleSettingsChange('marketing_emails')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>Haber Bülteni</h3>
                                            <p>Düzenli haber bülteni ve içerik güncellemeleri alın</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={settings.newsletter}
                                                onChange={() => handleSettingsChange('newsletter')}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveSettings}
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    <FiSave className="btn-icon" />
                                    {saving ? 'Kaydediliyor...' : 'Bildirim Ayarlarını Kaydet'}
                                </button>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <FiShield className="section-icon" />
                                    <div>
                                        <h2>Güvenlik Ayarları</h2>
                                        <p>Hesabınızın güvenliğini artırın</p>
                                    </div>
                                </div>

                                <div className="security-sections">
                                    {/* Password Change */}
                                    <div className="security-card">
                                        <div className="card-title">
                                            <FiKey className="card-icon" />
                                            <h3>Şifre Değiştir</h3>
                                        </div>
                                        <div className="password-form">
                                            <div className="form-group">
                                                <label>Mevcut Şifre</label>
                                                <div className="password-input-wrapper">
                                                    <input
                                                        type={showPasswords.current ? 'text' : 'password'}
                                                        name="current_password"
                                                        value={passwordData.current_password}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Mevcut şifrenizi girin"
                                                        className={passwordErrors.current_password ? 'error' : ''}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="password-toggle"
                                                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                                    >
                                                        {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                                                    </button>
                                                </div>
                                                {passwordErrors.current_password && (
                                                    <span className="error-message">
                                                        <FiAlertCircle /> {passwordErrors.current_password}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="form-group">
                                                <label>Yeni Şifre</label>
                                                <div className="password-input-wrapper">
                                                    <input
                                                        type={showPasswords.new ? 'text' : 'password'}
                                                        name="new_password"
                                                        value={passwordData.new_password}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Yeni şifrenizi girin (min. 8 karakter)"
                                                        className={passwordErrors.new_password ? 'error' : ''}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="password-toggle"
                                                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                                    >
                                                        {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                                                    </button>
                                                </div>
                                                {passwordErrors.new_password && (
                                                    <span className="error-message">
                                                        <FiAlertCircle /> {passwordErrors.new_password}
                                                    </span>
                                                )}
                                                <div className="password-requirements">
                                                    <p>Şifre gereksinimleri:</p>
                                                    <ul>
                                                        <li className={passwordData.new_password.length >= 8 ? 'met' : ''}>
                                                            En az 8 karakter
                                                        </li>
                                                        <li className={/(?=.*[a-z])/.test(passwordData.new_password) ? 'met' : ''}>
                                                            En az bir küçük harf
                                                        </li>
                                                        <li className={/(?=.*[A-Z])/.test(passwordData.new_password) ? 'met' : ''}>
                                                            En az bir büyük harf
                                                        </li>
                                                        <li className={/(?=.*\d)/.test(passwordData.new_password) ? 'met' : ''}>
                                                            En az bir rakam
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Yeni Şifre (Tekrar)</label>
                                                <div className="password-input-wrapper">
                                                    <input
                                                        type={showPasswords.confirm ? 'text' : 'password'}
                                                        name="confirm_password"
                                                        value={passwordData.confirm_password}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Yeni şifrenizi tekrar girin"
                                                        className={passwordErrors.confirm_password ? 'error' : ''}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="password-toggle"
                                                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                                    >
                                                        {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                                                    </button>
                                                </div>
                                                {passwordErrors.confirm_password && (
                                                    <span className="error-message">
                                                        <FiAlertCircle /> {passwordErrors.confirm_password}
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleChangePassword}
                                                className="btn btn-primary"
                                                disabled={saving}
                                            >
                                                <FiKey className="btn-icon" />
                                                {saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Two Factor Authentication */}
                                    <div className="security-card">
                                        <div className="card-title">
                                            <FiShield className="card-icon" />
                                            <div>
                                                <h3>İki Faktörlü Kimlik Doğrulama (2FA)</h3>
                                                <p>Hesabınızı ekstra güvenlik katmanı ile koruyun</p>
                                            </div>
                                        </div>
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <h4>2FA'yı Etkinleştir</h4>
                                                <p>Giriş yaparken telefonunuzdan doğrulama kodu alın</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.two_factor_auth}
                                                    onChange={() => handleSettingsChange('two_factor_auth')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                        {settings.two_factor_auth && (
                                            <div className="two-factor-setup">
                                                <p className="setup-info">
                                                    <FiCheckCircle className="info-icon" />
                                                    2FA etkinleştirildi. Giriş yaparken telefonunuzdan doğrulama kodu alacaksınız.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Login Alerts */}
                                    <div className="security-card">
                                        <div className="card-title">
                                            <FiBell className="card-icon" />
                                            <div>
                                                <h3>Giriş Uyarıları</h3>
                                                <p>Yeni cihazlardan giriş yapıldığında bildirim alın</p>
                                            </div>
                                        </div>
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <h4>Giriş Bildirimleri</h4>
                                                <p>Bilinmeyen cihazlardan giriş yapıldığında e-posta ile bildirim alın</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.login_alerts}
                                                    onChange={() => handleSettingsChange('login_alerts')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Session Timeout */}
                                    <div className="security-card">
                                        <div className="card-title">
                                            <FiLock className="card-icon" />
                                            <div>
                                                <h3>Oturum Zaman Aşımı</h3>
                                                <p>Belirtilen süre boyunca işlem yapılmazsa oturum kapanır</p>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Zaman Aşımı Süresi (dakika)</label>
                                            <select
                                                value={settings.session_timeout}
                                                onChange={(e) => setSettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
                                                className="select-input"
                                            >
                                                <option value={15}>15 dakika</option>
                                                <option value={30}>30 dakika</option>
                                                <option value={60}>1 saat</option>
                                                <option value={120}>2 saat</option>
                                                <option value={0}>Asla kapanmasın</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Addresses Tab */}
                        {activeTab === 'addresses' && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <FiMapPin className="section-icon" />
                                    <div>
                                        <h2>Adreslerim</h2>
                                        <p>Kayıtlı adreslerinizi yönetin</p>
                                    </div>
                                </div>

                                <div className="section-actions">
                                    <button
                                        onClick={() => setShowAddAddressModal(true)}
                                        className="btn btn-primary"
                                    >
                                        <FiPlus /> Yeni Adres Ekle
                                    </button>
                                </div>

                                {addresses.length === 0 ? (
                                    <div className="empty-state">
                                        <FiMapPin className="empty-icon" />
                                        <h4>Henüz adres eklenmemiş</h4>
                                        <p>İlk adresinizi ekleyerek başlayın</p>
                                        <button
                                            onClick={() => setShowAddAddressModal(true)}
                                            className="btn btn-primary"
                                        >
                                            <FiPlus /> Adres Ekle
                                        </button>
                                    </div>
                                ) : (
                                    <div className="addresses-grid">
                                        {addresses.map(address => (
                                            <div key={address.id} className="address-card">
                                                <div className="address-card-header">
                                                    <div className="address-badges">
                                                        <span className={`badge ${address.type === 'home' ? 'badge-home' : address.type === 'work' ? 'badge-work' : 'badge-other'}`}>
                                                            {address.type === 'home' ? <FiHome /> : address.type === 'work' ? <FiBriefcase /> : <FiMapPin />}
                                                            {address.type === 'home' ? 'Ev' : address.type === 'work' ? 'İş' : 'Diğer'}
                                                        </span>
                                                        {address.is_default && (
                                                            <span className="badge badge-default">Varsayılan</span>
                                                        )}
                                                    </div>
                                                    <div className="address-actions">
                                                        {!address.is_default && (
                                                            <button
                                                                onClick={() => handleSetDefaultAddress(address.id)}
                                                                className="btn-icon"
                                                                title="Varsayılan Yap"
                                                            >
                                                                <FiCheckCircle />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setEditingAddress({ ...address })}
                                                            className="btn-icon"
                                                            title="Düzenle"
                                                        >
                                                            <FiEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAddress(address.id)}
                                                            className="btn-icon danger"
                                                            title="Sil"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="address-card-body">
                                                    <h4>{address.name}</h4>
                                                    <p>{address.address_line1}</p>
                                                    {address.address_line2 && <p>{address.address_line2}</p>}
                                                    <p>
                                                        {address.district && `${address.district}, `}
                                                        {address.city}
                                                        {address.postal_code && ` ${address.postal_code}`}
                                                    </p>
                                                    {address.country && <p>{address.country}</p>}
                                                    {address.phone && <p className="address-phone">{address.phone}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Cards Tab */}
                        {activeTab === 'payment-cards' && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <FiCreditCard className="section-icon" />
                                    <div>
                                        <h2>Ödeme Kartlarım</h2>
                                        <p>Kayıtlı ödeme kartlarınızı yönetin</p>
                                    </div>
                                </div>

                                <div className="section-actions">
                                    <button
                                        onClick={() => setShowAddCardModal(true)}
                                        className="btn btn-primary"
                                    >
                                        <FiPlus /> Yeni Kart Ekle
                                    </button>
                                </div>

                                {cards.length === 0 ? (
                                    <div className="empty-state">
                                        <FiCreditCard className="empty-icon" />
                                        <h4>Henüz kart eklenmemiş</h4>
                                        <p>İlk ödeme kartınızı ekleyerek başlayın</p>
                                        <button
                                            onClick={() => setShowAddCardModal(true)}
                                            className="btn btn-primary"
                                        >
                                            <FiPlus /> Kart Ekle
                                        </button>
                                    </div>
                                ) : (
                                    <div className="cards-grid">
                                        {cards.map(card => (
                                            <div key={card.id} className="payment-card-item">
                                                <div className="payment-card-header">
                                                    <div className="card-badges">
                                                        <span className="badge badge-card-type">{card.card_type}</span>
                                                        {card.is_default && (
                                                            <span className="badge badge-default">Varsayılan</span>
                                                        )}
                                                    </div>
                                                    <div className="card-actions">
                                                        {!card.is_default && (
                                                            <button
                                                                onClick={() => handleSetDefaultCard(card.id)}
                                                                className="btn-icon"
                                                                title="Varsayılan Yap"
                                                            >
                                                                <FiCheckCircle />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteCard(card.id)}
                                                            className="btn-icon danger"
                                                            title="Sil"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="payment-card-body">
                                                    <h4>{card.card_holder}</h4>
                                                    <p className="card-number">{card.masked_number}</p>
                                                    <p className="card-expiry">Son Kullanma: {card.expiry_date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Privacy Tab */}
                        {activeTab === 'privacy' && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <FiLock className="section-icon" />
                                    <div>
                                        <h2>Gizlilik Ayarları</h2>
                                        <p>Hesabınızın gizlilik ayarlarını yönetin</p>
                                    </div>
                                </div>

                                <div className="settings-list">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>Profil Görünürlüğü</h3>
                                            <p>Profilinizin diğer kullanıcılar tarafından görünürlüğünü ayarlayın</p>
                                        </div>
                                        <select className="select-input">
                                            <option>Herkes görebilir</option>
                                            <option>Yalnızca takipçiler</option>
                                            <option>Gizli</option>
                                        </select>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>E-posta Gizliliği</h3>
                                            <p>E-posta adresinizin diğer kullanıcılar tarafından görünürlüğü</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" defaultChecked={false} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>Veri Toplama</h3>
                                            <p>Kullanım verilerinizin toplanmasına izin verin</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" defaultChecked={true} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <button onClick={handleSaveSettings} className="btn btn-primary" disabled={saving}>
                                    <FiSave className="btn-icon" />
                                    {saving ? 'Kaydediliyor...' : 'Gizlilik Ayarlarını Kaydet'}
                                </button>
                            </div>
                        )}

                        {/* Account Tab */}
                        {activeTab === 'account' && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <FiUser className="section-icon" />
                                    <div>
                                        <h2>Hesap Ayarları</h2>
                                        <p>Hesabınızla ilgili genel ayarlar</p>
                                    </div>
                                </div>

                                <div className="account-sections">
                                    <div className="account-card">
                                        <div className="card-title">
                                            <FiDatabase className="card-icon" />
                                            <div>
                                                <h3>Veri Yönetimi</h3>
                                                <p>Hesap verilerinizi indirin veya silin</p>
                                            </div>
                                        </div>
                                        <div className="account-actions">
                                            <button className="btn btn-outline">
                                                <FiDatabase className="btn-icon" />
                                                Verilerimi İndir
                                            </button>
                                            <p className="action-description">
                                                Tüm hesap verilerinizi JSON formatında indirebilirsiniz
                                            </p>
                                        </div>
                                    </div>

                                    <div className="account-card danger-zone">
                                        <div className="card-title">
                                            <FiTrash2 className="card-icon danger" />
                                            <div>
                                                <h3>Hesabı Sil</h3>
                                                <p>Hesabınızı kalıcı olarak silin</p>
                                            </div>
                                        </div>
                                        <div className="account-actions">
                                            <button
                                                onClick={handleDeleteAccount}
                                                className="btn btn-danger"
                                            >
                                                <FiTrash2 className="btn-icon" />
                                                Hesabı Sil
                                            </button>
                                            <p className="action-description danger">
                                                Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Address Modal */}
                {showAddAddressModal && (
                    <div className="modal-overlay" onClick={() => setShowAddAddressModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h5>Yeni Adres Ekle</h5>
                                <button className="modal-close" onClick={() => setShowAddAddressModal(false)}>
                                    <FiXCircle />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Adres Tipi</label>
                                    <select
                                        className="form-control"
                                        value={newAddress.type}
                                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                                    >
                                        <option value="home">Ev</option>
                                        <option value="work">İş</option>
                                        <option value="other">Diğer</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ad Soyad *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAddress.name}
                                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres Satırı 1 *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAddress.address_line1}
                                        onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres Satırı 2</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAddress.address_line2}
                                        onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Şehir *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newAddress.city}
                                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>İlçe</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newAddress.district}
                                            onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Posta Kodu</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newAddress.postal_code}
                                            onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Telefon</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            value={newAddress.phone}
                                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="isDefaultAddress"
                                            checked={newAddress.is_default}
                                            onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="isDefaultAddress">
                                            Varsayılan adres olarak ayarla
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowAddAddressModal(false);
                                        setNewAddress({
                                            type: 'home',
                                            name: '',
                                            address_line1: '',
                                            address_line2: '',
                                            city: '',
                                            district: '',
                                            postal_code: '',
                                            phone: '',
                                            country: 'Türkiye',
                                            is_default: false
                                        });
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddAddress}
                                >
                                    Adresi Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Address Modal */}
                {editingAddress && (
                    <div className="modal-overlay" onClick={() => setEditingAddress(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h5>Adresi Düzenle</h5>
                                <button className="modal-close" onClick={() => setEditingAddress(null)}>
                                    <FiXCircle />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Adres Tipi</label>
                                    <select
                                        className="form-control"
                                        value={editingAddress.type}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, type: e.target.value })}
                                    >
                                        <option value="home">Ev</option>
                                        <option value="work">İş</option>
                                        <option value="other">Diğer</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ad Soyad *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingAddress.name}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres Satırı 1 *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingAddress.address_line1}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, address_line1: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres Satırı 2</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingAddress.address_line2 || ''}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, address_line2: e.target.value })}
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Şehir *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingAddress.city}
                                            onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>İlçe</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingAddress.district || ''}
                                            onChange={(e) => setEditingAddress({ ...editingAddress, district: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Posta Kodu</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingAddress.postal_code || ''}
                                            onChange={(e) => setEditingAddress({ ...editingAddress, postal_code: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Telefon</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            value={editingAddress.phone || ''}
                                            onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="isDefaultAddressEdit"
                                            checked={editingAddress.is_default}
                                            onChange={(e) => setEditingAddress({ ...editingAddress, is_default: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="isDefaultAddressEdit">
                                            Varsayılan adres olarak ayarla
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setEditingAddress(null)}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleUpdateAddress}
                                >
                                    Güncelle
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Card Modal */}
                {showAddCardModal && (
                    <div className="modal-overlay" onClick={() => setShowAddCardModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h5>Yeni Kart Ekle</h5>
                                <button className="modal-close" onClick={() => setShowAddCardModal(false)}>
                                    <FiXCircle />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Kart Numarası *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="1356 3215 6548 7898"
                                        value={newCard.card_number}
                                        onChange={(e) => setNewCard({ ...newCard, card_number: e.target.value })}
                                        maxLength="19"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kart Sahibi *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="John Doe"
                                        value={newCard.card_holder}
                                        onChange={(e) => setNewCard({ ...newCard, card_holder: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Son Kullanma (MM/YY) *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="12/25"
                                            value={newCard.expiry_date}
                                            onChange={(e) => setNewCard({ ...newCard, expiry_date: e.target.value })}
                                            maxLength="5"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>CVV *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="123"
                                            value={newCard.cvv}
                                            onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                                            maxLength="3"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowAddCardModal(false);
                                        setNewCard({
                                            card_number: '',
                                            card_holder: '',
                                            expiry_date: '',
                                            cvv: '',
                                            save_card: true
                                        });
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddCard}
                                >
                                    Kartı Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
};

export default UserSettings;
