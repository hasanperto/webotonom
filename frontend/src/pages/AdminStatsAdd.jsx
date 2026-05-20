import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { 
    FiX, FiSave, FiGlobe, FiLoader, FiChevronLeft,
    FiShield, FiZap, FiTrendingUp, FiCreditCard, FiGift, FiTag,
    FiCheckCircle, FiStar, FiUsers, FiDownload, FiShoppingCart,
    FiHeart, FiEye, FiCalendar, FiPackage, FiMail, FiPhone,
    FiMapPin, FiSend, FiMessageCircle, FiLock, FiUnlock,
    FiSettings, FiTool, FiAward
} from 'react-icons/fi';
import { 
    getStatsItems, createStatsItem, updateStatsItem
} from '../api/sections';
import { translateText } from '../api/i18n';
import './AdminStatsAdd.css';

const AdminStatsAdd = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [formData, setFormData] = useState({
        tr: {
            number: '',
            label: ''
        },
        en: {
            number: '',
            label: ''
        },
        de: {
            number: '',
            label: ''
        },
        icon: '',
        color: '#667eea',
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
            loadStat();
        }
    }, [id]);

    const loadStat = async () => {
        try {
            const items = await getStatsItems();
            const item = items.find(i => i.id === parseInt(id));
            if (item) {
                setFormData({
                    tr: {
                        number: item.number || '',
                        label: item.label || ''
                    },
                    en: {
                        number: '',
                        label: ''
                    },
                    de: {
                        number: '',
                        label: ''
                    },
                    icon: item.icon || '',
                    color: item.color || '#667eea',
                    status: item.status || 'active'
                });
            }
        } catch (error) {
            console.error('Error loading stat:', error);
            alert('İstatistik yüklenirken hata oluştu');
        }
    };

    const handleAutoTranslate = async () => {
        if (!formData.tr.number && !formData.tr.label) {
            alert('Önce Türkçe içeriği girin');
            return;
        }

        try {
            setTranslating(true);

            // Sayı çevirisi (genelde aynı kalır ama yine de çevirebiliriz)
            if (formData.tr.number) {
                // Sayılar genelde aynı kalır, sadece label çevirisi yapılır
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, number: prev.tr.number },
                    de: { ...prev.de, number: prev.tr.number }
                }));
            }

            // Etiket çevirisi
            if (formData.tr.label) {
                const labelEn = await translateText(formData.tr.label, 'tr', 'en');
                const labelDe = await translateText(formData.tr.label, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, label: labelEn.translatedText || '' },
                    de: { ...prev.de, label: labelDe.translatedText || '' }
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
        
        if (!formData.tr.number.trim() || !formData.tr.label.trim()) {
            alert('Türkçe sayı ve etiket gerekli');
            return;
        }

        try {
            setLoading(true);
            
            const saveData = {
                number: formData.tr.number,
                label: formData.tr.label,
                icon: formData.icon || '',
                color: formData.color,
                status: formData.status,
                translations: JSON.stringify({
                    en: formData.en,
                    de: formData.de
                })
            };
            
            if (isEdit) {
                await updateStatsItem(id, saveData);
            } else {
                await createStatsItem(saveData);
            }
            
            navigate('/admin/sections/stats/items');
        } catch (error) {
            console.error('Error saving stat:', error);
            alert('İstatistik kaydedilirken hata oluştu');
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
            <div className="admin-stats-add-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <button 
                                className="btn-back"
                                onClick={() => navigate('/admin/sections/stats/items')}
                            >
                                <FiChevronLeft /> Geri
                            </button>
                            <h1>{isEdit ? 'İstatistik Düzenle' : 'Yeni İstatistik Ekle'}</h1>
                            <p>Çok dilli istatistik oluşturun</p>
                        </div>
                        <button 
                            className="btn btn-outline"
                            onClick={() => navigate('/admin/sections/stats/items')}
                        >
                            <FiX /> İptal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="stat-form">
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
                                    Sayı <span className="required">*</span>
                                    {activeTab === 'tr' && <span className="help-text">(örn: 2,500+, ₺5M+, 15K+)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData[activeTab].number}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], number: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? '2,500+' : activeTab === 'en' ? '2,500+' : '2.500+'}
                                    required={activeTab === 'tr'}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Etiket <span className="required">*</span>
                                    {activeTab === 'tr' && <span className="help-text">(örn: Aktif Proje)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData[activeTab].label}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], label: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Aktif Proje' : activeTab === 'en' ? 'Active Projects' : 'Aktive Projekte'}
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
                                <label>Renk (Hex)</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="#667eea"
                                        className="color-text"
                                    />
                                </div>
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
                                onClick={() => navigate('/admin/sections/stats/items')}
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

export default AdminStatsAdd;

