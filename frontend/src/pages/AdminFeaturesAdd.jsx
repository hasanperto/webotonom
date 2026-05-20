import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getImageUrl } from '../utils/api';
import { 
    FiX, FiUpload, FiSave, FiGlobe, FiLoader, FiChevronLeft,
    FiShield, FiZap, FiTrendingUp, FiCreditCard, FiGift, FiTag,
    FiCheckCircle, FiStar, FiUsers, FiDownload, FiShoppingCart,
    FiHeart, FiEye, FiCalendar, FiPackage, FiMail, FiPhone,
    FiMapPin, FiSend, FiMessageCircle, FiLock, FiUnlock,
    FiSettings, FiTool, FiAward
} from 'react-icons/fi';
import { 
    getFeaturesItems, createFeaturesItem, updateFeaturesItem
} from '../api/sections';
import { translateText } from '../api/i18n';
import './AdminFeaturesAdd.css';

const AdminFeaturesAdd = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [formData, setFormData] = useState({
        tr: {
            title: '',
            description: ''
        },
        en: {
            title: '',
            description: ''
        },
        de: {
            title: '',
            description: ''
        },
        icon: '',
        image: null,
        existing_image: null,
        link: '',
        link_text: '',
        status: 'active'
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [showIconSelector, setShowIconSelector] = useState(false);

    // Icon mapping
    const iconMap = {
        'FiShield': FiShield,
        'FiZap': FiZap,
        'FiTrendingUp': FiTrendingUp,
        'FiCreditCard': FiCreditCard,
        'FiGift': FiGift,
        'FiTag': FiTag,
        'FiCheckCircle': FiCheckCircle,
        'FiStar': FiStar,
        'FiUsers': FiUsers,
        'FiDownload': FiDownload,
        'FiShoppingCart': FiShoppingCart,
        'FiHeart': FiHeart,
        'FiEye': FiEye,
        'FiCalendar': FiCalendar,
        'FiPackage': FiPackage,
        'FiMail': FiMail,
        'FiPhone': FiPhone,
        'FiMapPin': FiMapPin,
        'FiSend': FiSend,
        'FiMessageCircle': FiMessageCircle,
        'FiLock': FiLock,
        'FiUnlock': FiUnlock,
        'FiSettings': FiSettings,
        'FiTool': FiTool,
        'FiAward': FiAward
    };

    const popularIcons = Object.keys(iconMap);

    useEffect(() => {
        if (isEdit) {
            loadFeature();
        }
    }, [id]);

    const loadFeature = async () => {
        try {
            const items = await getFeaturesItems();
            const item = items.find(i => i.id === parseInt(id));
            if (item) {
                setFormData({
                    tr: {
                        title: item.title || '',
                        description: item.description || ''
                    },
                    en: {
                        title: '',
                        description: ''
                    },
                    de: {
                        title: '',
                        description: ''
                    },
                    icon: item.icon || '',
                    image: null,
                    existing_image: item.image || null,
                    link: item.link || '',
                    link_text: item.link_text || '',
                    status: item.status || 'active'
                });
                setImagePreview(item.image ? getImageUrl(item.image) : null);
            }
        } catch (error) {
            console.error('Error loading feature:', error);
            alert('Hizmet yüklenirken hata oluştu');
        }
    };

    const handleAutoTranslate = async () => {
        if (!formData.tr.title && !formData.tr.description) {
            alert('Önce Türkçe içeriği girin');
            return;
        }

        try {
            setTranslating(true);

            // Başlık çevirisi
            if (formData.tr.title) {
                const titleEn = await translateText(formData.tr.title, 'tr', 'en');
                const titleDe = await translateText(formData.tr.title, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, title: titleEn.translatedText || '' },
                    de: { ...prev.de, title: titleDe.translatedText || '' }
                }));
            }

            // Açıklama çevirisi
            if (formData.tr.description) {
                const descEn = await translateText(formData.tr.description, 'tr', 'en');
                const descDe = await translateText(formData.tr.description, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, description: descEn.translatedText || '' },
                    de: { ...prev.de, description: descDe.translatedText || '' }
                }));
            }

            alert('Çeviri tamamlandı!');
        } catch (error) {
            console.error('Translation error:', error);
            alert('Çeviri sırasında hata oluştu');
        } finally {
            setTranslating(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.tr.title.trim()) {
            alert('Türkçe başlık gerekli');
            return;
        }

        try {
            setLoading(true);
            
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.tr.title);
            formDataToSend.append('description', formData.tr.description || '');
            formDataToSend.append('icon', formData.icon || '');
            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }
            if (formData.existing_image) {
                formDataToSend.append('existing_image', formData.existing_image);
            }
            formDataToSend.append('link', formData.link || '');
            formDataToSend.append('link_text', formData.link_text || '');
            formDataToSend.append('status', formData.status);
            formDataToSend.append('translations', JSON.stringify({
                en: formData.en,
                de: formData.de
            }));
            
            if (isEdit) {
                await updateFeaturesItem(id, formDataToSend);
            } else {
                await createFeaturesItem(formDataToSend);
            }
            
            navigate('/admin/sections/features/items');
        } catch (error) {
            console.error('Error saving feature:', error);
            alert('Hizmet kaydedilirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

    return (
        <AdminLayout>
            <div className="admin-features-add-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <button 
                                className="btn-back"
                                onClick={() => navigate('/admin/sections/features/items')}
                            >
                                <FiChevronLeft /> Geri
                            </button>
                            <h1>{isEdit ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle'}</h1>
                            <p>Çok dilli hizmet oluşturun</p>
                        </div>
                        <button 
                            className="btn btn-outline"
                            onClick={() => navigate('/admin/sections/features/items')}
                        >
                            <FiX /> İptal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="feature-form">
                        {/* Dil Tabları */}
                        <div className="form-section">
                            <div className="language-tabs">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.code}
                                        type="button"
                                        className={`lang-tab ${activeTab === tab.code ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.code)}
                                    >
                                        <span className="flag">{tab.flag}</span>
                                        <span>{tab.name}</span>
                                    </button>
                                ))}
                                {activeTab === 'tr' && (
                                    <button
                                        type="button"
                                        className="btn-translate"
                                        onClick={handleAutoTranslate}
                                        disabled={translating}
                                    >
                                        {translating ? (
                                            <>
                                                <FiLoader className="spinning" /> Çevriliyor...
                                            </>
                                        ) : (
                                            <>
                                                <FiGlobe /> Otomatik Çevir
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Çok Dilli İçerik Formu */}
                        <div className="form-section">
                            <h2>İçerik Bilgileri ({tabs.find(t => t.code === activeTab)?.name})</h2>
                            
                            <div className="form-group">
                                <label>
                                    Başlık <span className="required">*</span>
                                    {activeTab === 'tr' && <span className="help-text">(Diğer diller otomatik çevrilecek)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData[activeTab].title}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], title: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Başlık' : activeTab === 'en' ? 'Title' : 'Titel'}
                                    required={activeTab === 'tr'}
                                />
                            </div>

                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea
                                    value={formData[activeTab].description}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], description: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Açıklama' : activeTab === 'en' ? 'Description' : 'Beschreibung'}
                                    rows="5"
                                />
                            </div>
                        </div>

                        {/* Ortak Alanlar */}
                        <div className="form-section">
                            <h2>Genel Ayarlar</h2>
                            
                            <div className="form-group">
                                <label>Icon Seçimi</label>
                                <button
                                    type="button"
                                    className="icon-selector-toggle"
                                    onClick={() => setShowIconSelector(!showIconSelector)}
                                >
                                    {formData.icon ? (
                                        <>
                                            {iconMap[formData.icon] && (
                                                <>
                                                    {React.createElement(iconMap[formData.icon], { className: 'icon-preview-small' })}
                                                    <span>{formData.icon}</span>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <span>Icon Seçiniz</span>
                                    )}
                                    <span className={`toggle-arrow ${showIconSelector ? 'open' : ''}`}>▼</span>
                                </button>
                                {showIconSelector && (
                                    <div className="icon-selector-grid">
                                        <div 
                                            className={`icon-option ${!formData.icon ? 'selected' : ''}`}
                                            onClick={() => {
                                                setFormData({ ...formData, icon: '' });
                                                setShowIconSelector(false);
                                            }}
                                            title="Icon Yok"
                                        >
                                            <div className="icon-placeholder-small">Yok</div>
                                        </div>
                                        {popularIcons.map(iconName => {
                                            const IconComponent = iconMap[iconName];
                                            return (
                                                <div
                                                    key={iconName}
                                                    className={`icon-option ${formData.icon === iconName ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setFormData({ ...formData, icon: iconName });
                                                        setShowIconSelector(false);
                                                    }}
                                                    title={iconName}
                                                >
                                                    <IconComponent className="icon-preview" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {formData.icon && !showIconSelector && (
                                    <div className="selected-icon-info">
                                        Seçili Icon: <strong>{formData.icon}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Resim (Opsiyonel)</label>
                                <div className="image-upload-area">
                                    {imagePreview ? (
                                        <div className="image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="btn-remove-image"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    setFormData({ ...formData, image: null, existing_image: null });
                                                }}
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="upload-label">
                                            <FiUpload />
                                            <span>Resim Yükle</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Link (Opsiyonel)</label>
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Link Metni (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        value={formData.link_text}
                                        onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                                        placeholder="Daha Fazla Bilgi"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Durum</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Pasif</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate('/admin/sections/features/items')}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FiLoader className="spinning" /> Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <FiSave /> Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminFeaturesAdd;

