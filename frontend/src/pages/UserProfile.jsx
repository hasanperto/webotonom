import { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usersAPI } from '../api/users';
import { getImageUrl } from '../utils/api';
import {
    FiUser, FiEdit, FiSave, FiX, FiCamera, FiMail,
    FiPhone, FiMapPin, FiCalendar, FiGlobe, FiLock,
    FiCheckCircle, FiAlertCircle, FiImage, FiFileText, FiDatabase,
    FiCreditCard, FiPlus, FiTrash2, FiHome, FiBriefcase
} from 'react-icons/fi';
import { userAddressesAPI } from '../api/userAddresses';
import { userPaymentCardsAPI } from '../api/userPaymentCards';
import './UserProfile.css';

const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const { t, language } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        bio: '',
        address: '',
        city: '',
        country: '',
        website: '',
        avatar: null
    });
    const [errors, setErrors] = useState({});
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
        { id: 'general', label: t('profile.tabs.general'), icon: FiUser },
        { id: 'avatar', label: t('profile.tabs.avatar'), icon: FiImage },
        { id: 'about', label: t('profile.tabs.about'), icon: FiFileText },
        { id: 'addresses', label: t('profile.tabs.addresses'), icon: FiMapPin },
        { id: 'payment-cards', label: t('profile.tabs.payment_cards'), icon: FiCreditCard },
        { id: 'account', label: t('profile.tabs.account'), icon: FiDatabase }
    ];

    useEffect(() => {
        loadProfile();
        if (activeTab === 'addresses') {
            loadAddresses();
        }
        if (activeTab === 'payment-cards') {
            loadCards();
        }
    }, [activeTab]);

    const loadProfile = async () => {
        try {
            const response = await usersAPI.getProfile();
            const userData = response.data.user;
            setProfile(userData);
            setFormData({
                username: userData.username || '',
                email: userData.email || '',
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                phone: userData.phone || '',
                bio: userData.bio || '',
                address: userData.address || '',
                city: userData.city || '',
                country: userData.country || '',
                website: userData.website || '',
                avatar: null
            });
        } catch (error) {
            console.error('Profile load error:', error);
            alert(t('profile.errors.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert(t('profile.errors.image_size'));
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert(t('profile.errors.invalid_image'));
                return;
            }
            setFormData(prev => ({
                ...prev,
                avatar: file
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = t('profile.validation.username_required');
        } else if (formData.username.length < 3) {
            newErrors.username = t('profile.validation.username_min');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('profile.validation.email_required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('profile.validation.email_invalid');
        }

        if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
            newErrors.phone = t('profile.validation.phone_invalid');
        }

        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
            newErrors.website = t('profile.validation.website_invalid');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            // TODO: Backend API endpoint eklenmeli
            setEditing(false);
            setSuccessMessage(t('profile.success.updated'));
            setTimeout(() => setSuccessMessage(''), 5000);
            loadProfile();
        } catch (error) {
            console.error('Profile update error:', error);
            alert(error.response?.data?.error || t('profile.errors.update_failed'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setErrors({});
        loadProfile();
    };


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
                alert(t('profile.address.validation.required'));
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
            setSuccessMessage(t('profile.address.success.added'));
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || t('profile.address.errors.add_failed'));
        }
    };

    const handleUpdateAddress = async () => {
        try {
            if (!editingAddress.name || !editingAddress.address_line1 || !editingAddress.city) {
                alert(t('profile.address.validation.required'));
                return;
            }

            await userAddressesAPI.updateAddress(editingAddress.id, editingAddress);
            setEditingAddress(null);
            await loadAddresses();
            setSuccessMessage(t('profile.address.success.updated'));
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || t('profile.address.errors.update_failed'));
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm(t('profile.address.confirm.delete'))) {
            return;
        }
        try {
            await userAddressesAPI.deleteAddress(id);
            await loadAddresses();
            setSuccessMessage(t('profile.address.success.deleted'));
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || t('profile.address.errors.delete_failed'));
        }
    };

    const handleSetDefaultAddress = async (id) => {
        try {
            await userAddressesAPI.setDefaultAddress(id);
            await loadAddresses();
            setSuccessMessage(t('profile.address.success.default_updated'));
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || t('profile.address.errors.default_update_failed'));
        }
    };

    const handleAddCard = async () => {
        try {
            if (!newCard.card_number || !newCard.card_holder || !newCard.expiry_date) {
                alert(t('profile.card.validation.required'));
                return;
            }

            if (!newCard.cvv || newCard.cvv.length < 3) {
                alert(t('profile.card.validation.cvv_invalid'));
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
            setSuccessMessage(t('profile.card.success.added'));
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || t('profile.card.errors.add_failed'));
        }
    };

    const handleDeleteCard = async (id) => {
        if (!window.confirm(t('profile.card.confirm.delete'))) {
            return;
        }
        try {
            await userPaymentCardsAPI.deleteCard(id);
            await loadCards();
            setSuccessMessage(t('profile.card.success.deleted'));
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || t('profile.card.errors.delete_failed'));
        }
    };

    const handleSetDefaultCard = async (id) => {
        try {
            await userPaymentCardsAPI.setDefaultCard(id);
            await loadCards();
            setSuccessMessage(t('profile.card.success.default_updated'));
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            alert(error.response?.data?.error || t('profile.card.errors.default_update_failed'));
        }
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="user-profile-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('profile.loading')}</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="user-profile-page">
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <FiUser className="title-icon" />
                            {t('profile.title')}
                        </h1>
                    </div>
                </div>

                {successMessage && (
                    <div className="success-message">
                        <FiCheckCircle className="success-icon" />
                        {successMessage}
                    </div>
                )}

                <div className="profile-container">
                    {/* Profile Header Card */}
                    <div className="profile-header-card">
                        <div className="profile-avatar-section">
                            <div className="avatar-wrapper-large">
                                {formData.avatar ? (
                                    <img
                                        src={URL.createObjectURL(formData.avatar)}
                                        alt="Avatar"
                                        className="avatar-large"
                                    />
                                ) : profile?.avatar ? (
                                    <img
                                        src={getImageUrl(profile.avatar)}
                                        alt={profile.username}
                                        className="avatar-large"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className="avatar-placeholder-large" style={{ display: profile?.avatar && !formData.avatar ? 'none' : 'flex' }}>
                                    <FiUser />
                                </div>
                            </div>
                            <div className="avatar-info">
                                <h2 className="profile-name">
                                    {profile?.first_name && profile?.last_name
                                        ? `${profile.first_name} ${profile.last_name}`
                                        : profile?.username || t('profile.user')}
                                </h2>
                                <p className="profile-email">{profile?.email || ''}</p>
                                {profile?.role_name && (
                                    <span className="profile-badge">{profile.role_name}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Tabs and Content */}
                    <div className="profile-tabs-container">
                        <div className="profile-tabs">
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

                        <div className="profile-content">
                            {/* General Tab */}
                            {activeTab === 'general' && (
                                <div className="profile-tab-content">
                                    <div className="tab-header">
                                        <h3>{t('profile.tabs.general')}</h3>
                                        {!editing && (
                                            <button onClick={() => setEditing(true)} className="btn-edit">
                                                <FiEdit />
                                                {t('profile.actions.edit')}
                                            </button>
                                        )}
                                    </div>

                                    <div className="profile-form">
                                        <div className="form-section">
                                            <h4 className="section-title">{t('profile.form.basic_info')}</h4>
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>
                                                        <FiUser className="label-icon" />
                                                        {t('profile.form.username')} <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleInputChange}
                                                        disabled={!editing}
                                                        className={errors.username ? 'error' : ''}
                                                        placeholder={t('profile.form.username_placeholder')}
                                                    />
                                                    {errors.username && (
                                                        <span className="error-message">
                                                            <FiAlertCircle /> {errors.username}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label>
                                                        <FiMail className="label-icon" />
                                                        {t('profile.form.email')} <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        disabled={!editing}
                                                        className={errors.email ? 'error' : ''}
                                                        placeholder={t('profile.form.email_placeholder')}
                                                    />
                                                    {errors.email && (
                                                        <span className="error-message">
                                                            <FiAlertCircle /> {errors.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>
                                                        <FiUser className="label-icon" />
                                                        {t('profile.form.first_name')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="first_name"
                                                        value={formData.first_name}
                                                        onChange={handleInputChange}
                                                        disabled={!editing}
                                                        placeholder={t('profile.form.first_name_placeholder')}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>
                                                        <FiUser className="label-icon" />
                                                        {t('profile.form.last_name')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="last_name"
                                                        value={formData.last_name}
                                                        onChange={handleInputChange}
                                                        disabled={!editing}
                                                        placeholder={t('profile.form.last_name_placeholder')}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h4 className="section-title">{t('profile.form.contact_info')}</h4>
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>
                                                        <FiPhone className="label-icon" />
                                                        {t('profile.form.phone')}
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        disabled={!editing}
                                                        className={errors.phone ? 'error' : ''}
                                                        placeholder={t('profile.form.phone_placeholder')}
                                                    />
                                                    {errors.phone && (
                                                        <span className="error-message">
                                                            <FiAlertCircle /> {errors.phone}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label>
                                                        <FiGlobe className="label-icon" />
                                                        {t('profile.form.website')}
                                                    </label>
                                                    <input
                                                        type="url"
                                                        name="website"
                                                        value={formData.website}
                                                        onChange={handleInputChange}
                                                        disabled={!editing}
                                                        className={errors.website ? 'error' : ''}
                                                        placeholder={t('profile.form.website_placeholder')}
                                                    />
                                                    {errors.website && (
                                                        <span className="error-message">
                                                            <FiAlertCircle /> {errors.website}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>
                                                    <FiMapPin className="label-icon" />
                                                    {t('profile.form.address')}
                                                </label>
                                                <textarea
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    disabled={!editing}
                                                    rows="3"
                                                    placeholder={t('profile.form.address_placeholder')}
                                                />
                                            </div>

                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>
                                                        <FiMapPin className="label-icon" />
                                                        {t('profile.form.city')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        disabled={!editing}
                                                        placeholder={t('profile.form.city_placeholder')}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>
                                                        <FiMapPin className="label-icon" />
                                                        {t('profile.form.country')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="country"
                                                        value={formData.country}
                                                        onChange={handleInputChange}
                                                        disabled={!editing}
                                                        placeholder={t('profile.form.country_placeholder')}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {editing && (
                                            <div className="form-actions">
                                                <button
                                                    onClick={handleSave}
                                                    className="btn btn-primary"
                                                    disabled={saving}
                                                >
                                                    <FiSave className="btn-icon" />
                                                    {saving ? t('profile.actions.saving') : t('profile.actions.save')}
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="btn btn-outline"
                                                    disabled={saving}
                                                >
                                                    <FiX className="btn-icon" />
                                                    {t('profile.actions.cancel')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Avatar Tab */}
                            {activeTab === 'avatar' && (
                                <div className="profile-tab-content">
                                    <div className="tab-header">
                                        <h3>{t('profile.tabs.avatar')}</h3>
                                    </div>

                                    <div className="avatar-upload-section">
                                        <div className="avatar-preview-large">
                                            {formData.avatar ? (
                                                <img
                                                    src={URL.createObjectURL(formData.avatar)}
                                                    alt="Avatar Preview"
                                                    className="avatar-preview-img"
                                                />
                                            ) : profile?.avatar ? (
                                                <img
                                                    src={getImageUrl(profile.avatar)}
                                                    alt="Current Avatar"
                                                    className="avatar-preview-img"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className="avatar-preview-placeholder" style={{ display: profile?.avatar && !formData.avatar ? 'none' : 'flex' }}>
                                                <FiUser />
                                            </div>
                                        </div>

                                        <div className="avatar-upload-info">
                                            <h4>{t('profile.avatar.upload_title')}</h4>
                                            <p>{t('profile.avatar.upload_description')}</p>
                                            <p className="formats">{t('profile.avatar.supported_formats')}</p>
                                        </div>

                                        <label className="avatar-upload-button">
                                            <FiCamera className="upload-icon" />
                                            <span>{t('profile.avatar.select_photo')}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                style={{ display: 'none' }}
                                            />
                                        </label>

                                        {formData.avatar && (
                                            <div className="avatar-actions">
                                                <button
                                                    onClick={handleSave}
                                                    className="btn btn-primary"
                                                    disabled={saving}
                                                >
                                                    <FiSave className="btn-icon" />
                                                    {saving ? t('profile.actions.saving') : t('profile.avatar.save_photo')}
                                                </button>
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, avatar: null }))}
                                                    className="btn btn-outline"
                                                >
                                                    <FiX className="btn-icon" />
                                                    İptal
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* About Tab */}
                            {activeTab === 'about' && (
                                <div className="profile-tab-content">
                                    <div className="tab-header">
                                        <h3>{t('profile.tabs.about')}</h3>
                                        {!editing && (
                                            <button onClick={() => setEditing(true)} className="btn-edit">
                                                <FiEdit />
                                                {t('profile.actions.edit')}
                                            </button>
                                        )}
                                    </div>

                                    <div className="about-section">
                                        <div className="form-group">
                                            <label>
                                                <FiFileText className="label-icon" />
                                                {t('profile.form.bio')}
                                            </label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                disabled={!editing}
                                                rows="8"
                                                placeholder={t('profile.form.bio_placeholder')}
                                                maxLength={500}
                                                className="bio-textarea"
                                            />
                                            <div className="char-count-wrapper">
                                                <span className="char-count">{formData.bio.length}/500</span>
                                            </div>
                                        </div>

                                        {editing && (
                                            <div className="form-actions">
                                                <button
                                                    onClick={handleSave}
                                                    className="btn btn-primary"
                                                    disabled={saving}
                                                >
                                                    <FiSave className="btn-icon" />
                                                    {saving ? t('profile.actions.saving') : t('profile.actions.save')}
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="btn btn-outline"
                                                    disabled={saving}
                                                >
                                                    <FiX className="btn-icon" />
                                                    İptal
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Addresses Tab */}
                            {activeTab === 'addresses' && (
                                <div className="profile-tab-content">
                                    <div className="tab-header">
                                        <h3>{t('profile.tabs.addresses')}</h3>
                                        <button
                                            onClick={() => setShowAddAddressModal(true)}
                                            className="btn-edit"
                                        >
                                            <FiPlus />
                                            {t('profile.address.add_new')}
                                        </button>
                                    </div>

                                    {addresses.length === 0 ? (
                                        <div className="empty-state">
                                            <FiMapPin className="empty-icon" />
                                            <h4>{t('profile.address.empty.title')}</h4>
                                            <p>{t('profile.address.empty.description')}</p>
                                            <button
                                                onClick={() => setShowAddAddressModal(true)}
                                                className="btn btn-primary"
                                            >
                                                <FiPlus /> {t('profile.address.add')}
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
                                                                {address.type === 'home' ? t('profile.address.type.home') : address.type === 'work' ? t('profile.address.type.work') : t('profile.address.type.other')}
                                                            </span>
                                                            {address.is_default && (
                                                                <span className="badge badge-default">{t('profile.address.default')}</span>
                                                            )}
                                                        </div>
                                                        <div className="address-actions">
                                                            {!address.is_default && (
                                                                <button
                                                                    onClick={() => handleSetDefaultAddress(address.id)}
                                                                    className="btn-icon"
                                                                    title={t('profile.address.set_default')}
                                                                >
                                                                    <FiCheckCircle />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setEditingAddress({ ...address })}
                                                                className="btn-icon"
                                                                title={t('profile.actions.edit')}
                                                            >
                                                                <FiEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAddress(address.id)}
                                                                className="btn-icon danger"
                                                                title={t('profile.actions.delete')}
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
                                <div className="profile-tab-content">
                                    <div className="tab-header">
                                        <h3>{t('profile.tabs.payment_cards')}</h3>
                                        <button
                                            onClick={() => setShowAddCardModal(true)}
                                            className="btn-edit"
                                        >
                                            <FiPlus />
                                            {t('profile.card.add_new')}
                                        </button>
                                    </div>

                                    {cards.length === 0 ? (
                                        <div className="empty-state">
                                            <FiCreditCard className="empty-icon" />
                                            <h4>{t('profile.card.empty.title')}</h4>
                                            <p>{t('profile.card.empty.description')}</p>
                                            <button
                                                onClick={() => setShowAddCardModal(true)}
                                                className="btn btn-primary"
                                            >
                                                <FiPlus /> {t('profile.card.add')}
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
                                                                <span className="badge badge-default">{t('profile.address.default')}</span>
                                                            )}
                                                        </div>
                                                        <div className="card-actions">
                                                            {!card.is_default && (
                                                                <button
                                                                    onClick={() => handleSetDefaultCard(card.id)}
                                                                    className="btn-icon"
                                                                    title={t('profile.address.set_default')}
                                                                >
                                                                    <FiCheckCircle />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteCard(card.id)}
                                                                className="btn-icon danger"
                                                                title={t('profile.actions.delete')}
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="payment-card-body">
                                                        <h4>{card.card_holder}</h4>
                                                        <p className="card-number">{card.masked_number}</p>
                                                        <p className="card-expiry">{t('profile.card.expiry')}: {card.expiry_date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Account Tab */}
                            {activeTab === 'account' && (
                                <div className="profile-tab-content">
                                    <div className="tab-header">
                                        <h3>{t('profile.tabs.account')}</h3>
                                    </div>

                                    <div className="account-info-section">
                                        <div className="info-card">
                                            <div className="info-item">
                                                <FiCalendar className="info-icon" />
                                                <div className="info-content">
                                                    <span className="info-label">{t('profile.account.membership_date')}</span>
                                                    <span className="info-value">
                                                        {profile?.created_at
                                                            ? new Date(profile.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })
                                                            : t('profile.account.unknown')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <FiLock className="info-icon" />
                                                <div className="info-content">
                                                    <span className="info-label">{t('profile.account.status')}</span>
                                                    <span className="info-value status-active">{t('profile.account.active')}</span>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <FiMail className="info-icon" />
                                                <div className="info-content">
                                                    <span className="info-label">{t('profile.account.email_verification')}</span>
                                                    <span className="info-value status-active">{t('profile.account.verified')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Address Modal */}
                {showAddAddressModal && (
                    <div className="modal-overlay" onClick={() => setShowAddAddressModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h5>{t('profile.address.modal.add_title')}</h5>
                                <button className="modal-close" onClick={() => setShowAddAddressModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>{t('profile.address.form.type')}</label>
                                    <select
                                        className="form-control"
                                        value={newAddress.type}
                                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                                    >
                                        <option value="home">{t('profile.address.type.home')}</option>
                                        <option value="work">{t('profile.address.type.work')}</option>
                                        <option value="other">{t('profile.address.type.other')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('profile.address.form.name')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAddress.name}
                                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('profile.address.form.address_line1')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAddress.address_line1}
                                        onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('profile.address.form.address_line2')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAddress.address_line2}
                                        onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{t('profile.address.form.city')} *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newAddress.city}
                                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('profile.address.form.district')}</label>
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
                                        <label>{t('profile.address.form.postal_code')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newAddress.postal_code}
                                            onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('profile.address.form.phone')}</label>
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
                                            {t('profile.address.form.set_default')}
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
                                    {t('profile.actions.cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddAddress}
                                >
                                    {t('profile.address.save')}
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
                                <h5>{t('profile.address.modal.edit_title')}</h5>
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
                                        onChange={(e) => setEditingAddress({ ...editingAddress, type: e.target.value })}
                                    >
                                        <option value="home">Ev</option>
                                        <option value="work">İş</option>
                                        <option value="other">Diğer</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('profile.address.form.name')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingAddress.name}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('profile.address.form.address_line1')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingAddress.address_line1}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, address_line1: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('profile.address.form.address_line2')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingAddress.address_line2 || ''}
                                        onChange={(e) => setEditingAddress({ ...editingAddress, address_line2: e.target.value })}
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{t('profile.address.form.city')} *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingAddress.city}
                                            onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('profile.address.form.district')}</label>
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
                                        <label>{t('profile.address.form.postal_code')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editingAddress.postal_code || ''}
                                            onChange={(e) => setEditingAddress({ ...editingAddress, postal_code: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('profile.address.form.phone')}</label>
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
                                            {t('profile.address.form.set_default')}
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
                                    {t('profile.actions.update')}
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
                                <h5>{t('profile.card.modal.add_title')}</h5>
                                <button className="modal-close" onClick={() => setShowAddCardModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>{t('profile.card.form.card_number')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={t('profile.card.form.card_number_placeholder')}
                                        value={newCard.card_number}
                                        onChange={(e) => setNewCard({ ...newCard, card_number: e.target.value })}
                                        maxLength="19"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('profile.card.form.card_holder')} *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={t('profile.card.form.card_holder_placeholder')}
                                        value={newCard.card_holder}
                                        onChange={(e) => setNewCard({ ...newCard, card_holder: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{t('profile.card.form.expiry_date')} *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={t('profile.card.form.expiry_date_placeholder')}
                                            value={newCard.expiry_date}
                                            onChange={(e) => setNewCard({ ...newCard, expiry_date: e.target.value })}
                                            maxLength="5"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('profile.card.form.cvv')} *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={t('profile.card.form.cvv_placeholder')}
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
                                    {t('profile.card.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
};

export default UserProfile;
