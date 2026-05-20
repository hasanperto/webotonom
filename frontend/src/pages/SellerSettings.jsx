import { useState, useEffect } from 'react';
import SellerLayout from '../components/SellerLayout';
import { userAddressesAPI } from '../api/userAddresses';
import { userPaymentCardsAPI } from '../api/userPaymentCards';
import { 
    FiSave, FiLock, FiBell, FiShield, FiCreditCard, FiMapPin,
    FiPlus, FiTrash2, FiCheckCircle, FiEdit, FiHome, FiBriefcase, FiX
} from 'react-icons/fi';
import './SellerSettings.css';

const SellerSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        // Genel
        language: 'tr',
        timezone: 'Europe/Istanbul',
        
        // Güvenlik
        current_password: '',
        new_password: '',
        confirm_password: '',
        
        // Bildirimler
        email_notifications: true,
        push_notifications: true,
        sales_notifications: true,
        message_notifications: true,
        
        // Ödeme
        bank_name: '',
        account_holder: '',
        iban: '',
        tax_number: ''
    });
    
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
            alert('Adres başarıyla eklendi');
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
            alert('Adres başarıyla güncellendi');
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
        } catch (error) {
            alert(error.response?.data?.error || 'Adres silinemedi');
        }
    };

    const handleSetDefaultAddress = async (id) => {
        try {
            await userAddressesAPI.setDefaultAddress(id);
            await loadAddresses();
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
            alert('Kart başarıyla eklendi');
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
        } catch (error) {
            alert(error.response?.data?.error || 'Kart silinemedi');
        }
    };

    const handleSetDefaultCard = async (id) => {
        try {
            await userPaymentCardsAPI.setDefaultCard(id);
            await loadCards();
        } catch (error) {
            alert(error.response?.data?.error || 'Varsayılan kart güncellenemedi');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // TODO: Implement settings save
        alert('Ayarlar kaydedildi');
    };

    const tabs = [
        { id: 'general', label: 'Genel', icon: FiBell },
        { id: 'security', label: 'Güvenlik', icon: FiShield },
        { id: 'notifications', label: 'Bildirimler', icon: FiBell },
        { id: 'addresses', label: 'Adreslerim', icon: FiMapPin },
        { id: 'payment-cards', label: 'Ödeme Kartlarım', icon: FiCreditCard },
        { id: 'payment', label: 'Ödeme Bilgileri', icon: FiCreditCard },
    ];

    return (
        <SellerLayout>
            <div className="seller-settings-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                    <div className="header-content">
                        <h1>Ayarlar</h1>
                        <p>Hesap ayarlarınızı yönetin</p>
                    </div>
                </div>

                <div className="settings-layout">
                    {/* Tab Menü */}
                    <div className="settings-tabs">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab İçeriği */}
                    <div className="settings-content">
                        <form onSubmit={handleSubmit}>
                            {activeTab === 'general' && (
                                <div className="settings-section">
                                    <h2>Genel Ayarlar</h2>
                                    
                                    <div className="form-group">
                                        <label>Dil</label>
                                        <select
                                            value={formData.language}
                                            onChange={(e) => setFormData({...formData, language: e.target.value})}
                                        >
                                            <option value="tr">Türkçe</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Zaman Dilimi</label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                                        >
                                            <option value="Europe/Istanbul">İstanbul (GMT+3)</option>
                                            <option value="Europe/London">Londra (GMT+0)</option>
                                            <option value="America/New_York">New York (GMT-5)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="settings-section">
                                    <h2>Güvenlik Ayarları</h2>
                                    
                                    <div className="form-group">
                                        <label>
                                            <FiLock /> Mevcut Şifre
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.current_password}
                                            onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                                            placeholder="Mevcut şifrenizi girin"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            <FiLock /> Yeni Şifre
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.new_password}
                                            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                                            placeholder="Yeni şifrenizi girin"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            <FiLock /> Yeni Şifre (Tekrar)
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.confirm_password}
                                            onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                                            placeholder="Yeni şifrenizi tekrar girin"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="settings-section">
                                    <h2>Bildirim Ayarları</h2>
                                    
                                    <div className="toggle-group">
                                        <div className="toggle-item">
                                            <div className="toggle-info">
                                                <h3>E-posta Bildirimleri</h3>
                                                <p>Önemli güncellemeler için e-posta alın</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.email_notifications}
                                                    onChange={(e) => setFormData({...formData, email_notifications: e.target.checked})}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>

                                        <div className="toggle-item">
                                            <div className="toggle-info">
                                                <h3>Anlık Bildirimler</h3>
                                                <p>Tarayıcı bildirimleri alın</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.push_notifications}
                                                    onChange={(e) => setFormData({...formData, push_notifications: e.target.checked})}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>

                                        <div className="toggle-item">
                                            <div className="toggle-info">
                                                <h3>Satış Bildirimleri</h3>
                                                <p>Yeni satışlar için bildirim alın</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.sales_notifications}
                                                    onChange={(e) => setFormData({...formData, sales_notifications: e.target.checked})}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>

                                        <div className="toggle-item">
                                            <div className="toggle-info">
                                                <h3>Mesaj Bildirimleri</h3>
                                                <p>Yeni mesajlar için bildirim alın</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.message_notifications}
                                                    onChange={(e) => setFormData({...formData, message_notifications: e.target.checked})}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'addresses' && (
                                <div className="settings-section">
                                    <div className="section-header">
                                        <h2>Adreslerim</h2>
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
                                                                onClick={() => setEditingAddress({...address})}
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

                            {activeTab === 'payment-cards' && (
                                <div className="settings-section">
                                    <div className="section-header">
                                        <h2>Ödeme Kartlarım</h2>
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

                            {activeTab === 'payment' && (
                                <div className="settings-section">
                                    <h2>Ödeme Bilgileri</h2>
                                    
                                    <div className="form-group">
                                        <label>
                                            <FiCreditCard /> Banka Adı
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bank_name}
                                            onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                                            placeholder="Banka adını girin"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Hesap Sahibi
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.account_holder}
                                            onChange={(e) => setFormData({...formData, account_holder: e.target.value})}
                                            placeholder="Hesap sahibi adı"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            IBAN
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.iban}
                                            onChange={(e) => setFormData({...formData, iban: e.target.value})}
                                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Vergi Numarası
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tax_number}
                                            onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                                            placeholder="Vergi numaranız"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    <FiSave /> Ayarları Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Add Address Modal */}
                {showAddAddressModal && (
                    <div className="modal-overlay" onClick={() => setShowAddAddressModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h5>Yeni Adres Ekle</h5>
                                <button className="modal-close" onClick={() => setShowAddAddressModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Adres Tipi</label>
                                    <select
                                        className="form-control"
                                        value={newAddress.type}
                                        onChange={(e) => setNewAddress({...newAddress, type: e.target.value})}
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
                                        onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres Satırı 1 *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAddress.address_line1}
                                        onChange={(e) => setNewAddress({...newAddress, address_line1: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres Satırı 2</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAddress.address_line2}
                                        onChange={(e) => setNewAddress({...newAddress, address_line2: e.target.value})}
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Şehir *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newAddress.city}
                                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>İlçe</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newAddress.district}
                                            onChange={(e) => setNewAddress({...newAddress, district: e.target.value})}
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
                                            onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Telefon</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            value={newAddress.phone}
                                            onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
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
                                            onChange={(e) => setNewAddress({...newAddress, is_default: e.target.checked})}
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
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Adres Tipi</label>
                                    <select
                                        className="form-control"
                                        value={editingAddress.type}
                                        onChange={(e) => setEditingAddress({...editingAddress, type: e.target.value})}
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
                                        onChange={(e) => setEditingAddress({...editingAddress, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres Satırı 1 *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingAddress.address_line1}
                                        onChange={(e) => setEditingAddress({...editingAddress, address_line1: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adres Satırı 2</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingAddress.address_line2 || ''}
                                        onChange={(e) => setEditingAddress({...editingAddress, address_line2: e.target.value})}
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Şehir *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingAddress.city}
                                            onChange={(e) => setEditingAddress({...editingAddress, city: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>İlçe</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingAddress.district || ''}
                                            onChange={(e) => setEditingAddress({...editingAddress, district: e.target.value})}
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
                                            onChange={(e) => setEditingAddress({...editingAddress, postal_code: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Telefon</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            value={editingAddress.phone || ''}
                                            onChange={(e) => setEditingAddress({...editingAddress, phone: e.target.value})}
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
                                            onChange={(e) => setEditingAddress({...editingAddress, is_default: e.target.checked})}
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
                                    <FiX />
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
                                        onChange={(e) => setNewCard({...newCard, card_number: e.target.value})}
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
                                        onChange={(e) => setNewCard({...newCard, card_holder: e.target.value})}
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
                                            onChange={(e) => setNewCard({...newCard, expiry_date: e.target.value})}
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
                                            onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
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
            </div>
        </SellerLayout>
    );
};

export default SellerSettings;

