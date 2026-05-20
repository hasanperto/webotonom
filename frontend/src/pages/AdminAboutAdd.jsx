import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { 
    FiX, FiSave, FiGlobe, FiLoader, FiChevronLeft,
    FiShield, FiZap, FiTrendingUp, FiCreditCard, FiGift, FiTag,
    FiCheckCircle, FiStar, FiUsers, FiDownload, FiShoppingCart,
    FiHeart, FiEye, FiCalendar, FiPackage, FiMail, FiPhone, FiMapPin, FiSend,
    FiMessageCircle, FiLock, FiUnlock, FiSettings, FiTool, FiAward
} from 'react-icons/fi';
import { 
    getAboutItems, createAboutItem, updateAboutItem
} from '../api/sections';
import { translateText } from '../api/i18n';
import './AdminAboutAdd.css';

const AdminAboutAdd = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [formData, setFormData] = useState({
        tr: {
            text: ''
        },
        en: {
            text: ''
        },
        de: {
            text: ''
        },
        icon: 'FiCheckCircle',
        status: 'active'
    });
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
            loadAbout();
        }
    }, [id]);

    const loadAbout = async () => {
        try {
            const items = await getAboutItems();
            const item = items.find(i => i.id === parseInt(id));
            if (item) {
                // Çevirileri yükle
                const enData = { text: '' };
                const deData = { text: '' };
                
                // Eğer item'da translations varsa kullan
                if (item.translations) {
                    if (item.translations.en) {
                        enData.text = item.translations.en.text || '';
                    }
                    if (item.translations.de) {
                        deData.text = item.translations.de.text || '';
                    }
                }
                
                setFormData({
                    tr: {
                        text: item.text || ''
                    },
                    en: enData,
                    de: deData,
                    icon: item.icon || 'FiCheckCircle',
                    status: item.status || 'active'
                });
            }
        } catch (error) {
            console.error('Error loading about item:', error);
            alert('Öğe yüklenirken hata oluştu');
        }
    };

    const handleAutoTranslate = async () => {
        if (!formData.tr.text.trim()) {
            alert('Önce Türkçe içeriği girin');
            return;
        }

        try {
            setTranslating(true);

            // Metin çevirisi
            if (formData.tr.text) {
                const textEn = await translateText(formData.tr.text, 'tr', 'en');
                const textDe = await translateText(formData.tr.text, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, text: textEn.translatedText || '' },
                    de: { ...prev.de, text: textDe.translatedText || '' }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.tr.text.trim()) {
            alert('Türkçe metin gerekli');
            return;
        }

        try {
            setLoading(true);
            
            const saveData = {
                text: formData.tr.text,
                icon: formData.icon || 'FiCheckCircle',
                status: formData.status,
                translations: JSON.stringify({
                    en: formData.en,
                    de: formData.de
                })
            };
            
            if (isEdit) {
                await updateAboutItem(id, saveData);
            } else {
                await createAboutItem(saveData);
            }
            
            navigate('/admin/sections/about/items');
        } catch (error) {
            console.error('Error saving about item:', error);
            alert('Öğe kaydedilirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

    const IconComponent = iconMap[formData.icon] || FiCheckCircle;

    return (
        <AdminLayout>
            <div className="admin-about-add-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <button 
                                className="btn-back"
                                onClick={() => navigate('/admin/sections/about/items')}
                            >
                                <FiChevronLeft /> Geri
                            </button>
                            <h1>{isEdit ? 'Özellik Düzenle' : 'Yeni Özellik Ekle'}</h1>
                            <p>Çok dilli özellik oluşturun</p>
                        </div>
                        <button 
                            className="btn btn-outline"
                            onClick={() => navigate('/admin/sections/about/items')}
                        >
                            <FiX /> İptal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="about-form">
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
                                    Metin <span className="required">*</span>
                                    {activeTab === 'tr' && <span className="help-text">(Diğer diller otomatik çevrilecek)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData[activeTab].text}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], text: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Örn: Güvenli ve Güvenilir' : activeTab === 'en' ? 'E.g.: Safe and Reliable' : 'z.B.: Sicher und zuverlässig'}
                                    required={activeTab === 'tr'}
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
                                            <IconComponent className="icon-preview-small" />
                                            <span>{formData.icon}</span>
                                        </>
                                    ) : (
                                        <span>Icon Seçiniz</span>
                                    )}
                                    <span className={`toggle-arrow ${showIconSelector ? 'open' : ''}`}>▼</span>
                                </button>
                                {showIconSelector && (
                                    <div className="icon-selector-grid">
                                        {popularIcons.map(iconName => {
                                            const IconComp = iconMap[iconName];
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
                                                    <IconComp className="icon-preview" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

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

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate('/admin/sections/about/items')}
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

export default AdminAboutAdd;

