import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getImageUrl } from '../utils/api';
import { 
    FiX, FiUpload, FiImage, FiSave, FiGlobe, FiLoader, FiChevronLeft
} from 'react-icons/fi';
import { 
    getHeroSlides, createHeroSlide, updateHeroSlide
} from '../api/sections';
import { translateText } from '../api/i18n';
import './AdminHeroSlidesAdd.css';

const AdminHeroSlidesAdd = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [formData, setFormData] = useState({
        tr: {
            title: '',
            subtitle: '',
            button_text: 'Projeleri Keşfet',
            button_text_2: 'Ücretsiz Başla'
        },
        en: {
            title: '',
            subtitle: '',
            button_text: '',
            button_text_2: ''
        },
        de: {
            title: '',
            subtitle: '',
            button_text: '',
            button_text_2: ''
        },
        image: null,
        existing_image: null,
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        link: '',
        button_link: '/projects',
        button_link_2: '/register',
        order: 0,
        status: 'active'
    });
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (isEdit) {
            loadSlide();
        }
    }, [id]);

    const loadSlide = async () => {
        try {
            const slides = await getHeroSlides();
            const slide = slides.find(s => s.id === parseInt(id));
            if (slide) {
                setFormData({
                    tr: {
                        title: slide.title || '',
                        subtitle: slide.subtitle || '',
                        button_text: slide.button_text || 'Projeleri Keşfet',
                        button_text_2: slide.button_text_2 || 'Ücretsiz Başla'
                    },
                    en: {
                        title: '',
                        subtitle: '',
                        button_text: '',
                        button_text_2: ''
                    },
                    de: {
                        title: '',
                        subtitle: '',
                        button_text: '',
                        button_text_2: ''
                    },
                    image: null,
                    existing_image: slide.image || null,
                    gradient: slide.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    link: slide.link || '',
                    button_link: slide.button_link || '/projects',
                    button_link_2: slide.button_link_2 || '/register',
                    order: slide.order || 0,
                    status: slide.status || 'active'
                });
                setImagePreview(slide.image ? getImageUrl(slide.image) : null);
            }
        } catch (error) {
            console.error('Error loading slide:', error);
            alert('Slide yüklenirken hata oluştu');
        }
    };

    const handleAutoTranslate = async () => {
        if (!formData.tr.title && !formData.tr.subtitle && !formData.tr.button_text && !formData.tr.button_text_2) {
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

            // Alt başlık çevirisi
            if (formData.tr.subtitle) {
                const subtitleEn = await translateText(formData.tr.subtitle, 'tr', 'en');
                const subtitleDe = await translateText(formData.tr.subtitle, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, subtitle: subtitleEn.translatedText || '' },
                    de: { ...prev.de, subtitle: subtitleDe.translatedText || '' }
                }));
            }

            // Buton 1 metni çevirisi
            if (formData.tr.button_text) {
                const button1En = await translateText(formData.tr.button_text, 'tr', 'en');
                const button1De = await translateText(formData.tr.button_text, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, button_text: button1En.translatedText || '' },
                    de: { ...prev.de, button_text: button1De.translatedText || '' }
                }));
            }

            // Buton 2 metni çevirisi
            if (formData.tr.button_text_2) {
                const button2En = await translateText(formData.tr.button_text_2, 'tr', 'en');
                const button2De = await translateText(formData.tr.button_text_2, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, button_text_2: button2En.translatedText || '' },
                    de: { ...prev.de, button_text_2: button2De.translatedText || '' }
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
            
            const saveData = {
                title: formData.tr.title,
                subtitle: formData.tr.subtitle,
                button_text: formData.tr.button_text,
                button_text_2: formData.tr.button_text_2,
                image: formData.image,
                existing_image: formData.existing_image,
                gradient: formData.gradient,
                link: formData.link,
                button_link: formData.button_link,
                button_link_2: formData.button_link_2,
                order: formData.order,
                status: formData.status,
                translations: JSON.stringify({
                    en: formData.en,
                    de: formData.de
                })
            };
            
            if (isEdit) {
                await updateHeroSlide(id, saveData);
            } else {
                await createHeroSlide(saveData);
            }
            
            navigate('/admin/sections/hero/slides');
        } catch (error) {
            console.error('Error saving slide:', error);
            alert('Slide kaydedilirken hata oluştu');
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
            <div className="admin-hero-slides-add-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <button 
                                className="btn-back"
                                onClick={() => navigate('/admin/sections/hero/slides')}
                            >
                                <FiChevronLeft /> Geri
                            </button>
                            <h1>{isEdit ? 'Slide Düzenle' : 'Yeni Slide Ekle'}</h1>
                            <p>Çok dilli hero slide oluşturun</p>
                        </div>
                        <button 
                            className="btn btn-outline"
                            onClick={() => navigate('/admin/sections/hero/slides')}
                        >
                            <FiX /> İptal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="hero-slide-form">
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
                                    placeholder={activeTab === 'tr' ? 'Slide başlığı' : activeTab === 'en' ? 'Slide title' : 'Slide-Titel'}
                                    required={activeTab === 'tr'}
                                />
                            </div>

                            <div className="form-group">
                                <label>Alt Başlık</label>
                                <input
                                    type="text"
                                    value={formData[activeTab].subtitle}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], subtitle: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Slide alt başlığı' : activeTab === 'en' ? 'Slide subtitle' : 'Slide-Untertitel'}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Buton 1 Metni</label>
                                    <input
                                        type="text"
                                        value={formData[activeTab].button_text}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            [activeTab]: { ...formData[activeTab], button_text: e.target.value }
                                        })}
                                        placeholder={activeTab === 'tr' ? 'Projeleri Keşfet' : activeTab === 'en' ? 'Explore Projects' : 'Projekte erkunden'}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Buton 2 Metni</label>
                                    <input
                                        type="text"
                                        value={formData[activeTab].button_text_2}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            [activeTab]: { ...formData[activeTab], button_text_2: e.target.value }
                                        })}
                                        placeholder={activeTab === 'tr' ? 'Ücretsiz Başla' : activeTab === 'en' ? 'Start Free' : 'Kostenlos starten'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ortak Alanlar */}
                        <div className="form-section">
                            <h2>Genel Ayarlar</h2>
                            
                            <div className="form-group">
                                <label>Resim</label>
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

                            <div className="form-group">
                                <label>Gradient (CSS)</label>
                                <input
                                    type="text"
                                    value={formData.gradient}
                                    onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                                    placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Buton 1 Link</label>
                                    <input
                                        type="text"
                                        value={formData.button_link}
                                        onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                                        placeholder="/projects"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Buton 2 Link</label>
                                    <input
                                        type="text"
                                        value={formData.button_link_2}
                                        onChange={(e) => setFormData({ ...formData, button_link_2: e.target.value })}
                                        placeholder="/register"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Sıra</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    />
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
                        </div>

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate('/admin/sections/hero/slides')}
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

export default AdminHeroSlidesAdd;

