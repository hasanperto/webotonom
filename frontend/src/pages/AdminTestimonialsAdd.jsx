import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { 
    FiX, FiSave, FiGlobe, FiLoader, FiChevronLeft, FiStar, FiUpload
} from 'react-icons/fi';
import { 
    getTestimonialsItems, createTestimonialItem, updateTestimonialItem
} from '../api/sections';
import { translateText } from '../api/i18n';
import './AdminTestimonialsAdd.css';

const AdminTestimonialsAdd = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [formData, setFormData] = useState({
        tr: {
            name: '',
            role: '',
            comment: '',
            company: ''
        },
        en: {
            name: '',
            role: '',
            comment: '',
            company: ''
        },
        de: {
            name: '',
            role: '',
            comment: '',
            company: ''
        },
        rating: 5,
        avatar: '',
        status: 'active'
    });

    useEffect(() => {
        if (isEdit) {
            loadTestimonial();
        }
    }, [id]);

    const loadTestimonial = async () => {
        try {
            const [itemsTr, itemsEn, itemsDe] = await Promise.all([
                getTestimonialsItems('tr'),
                getTestimonialsItems('en'),
                getTestimonialsItems('de')
            ]);
            
            const itemTr = itemsTr.find(i => i.id === parseInt(id));
            if (itemTr) {
                const itemEn = itemsEn.find(i => i.id === parseInt(id));
                const itemDe = itemsDe.find(i => i.id === parseInt(id));
                
                setFormData({
                    tr: {
                        name: itemTr.name || '',
                        role: itemTr.role || '',
                        comment: itemTr.comment || '',
                        company: itemTr.company || ''
                    },
                    en: {
                        name: itemEn?.name || '',
                        role: itemEn?.role || '',
                        comment: itemEn?.comment || '',
                        company: itemEn?.company || ''
                    },
                    de: {
                        name: itemDe?.name || '',
                        role: itemDe?.role || '',
                        comment: itemDe?.comment || '',
                        company: itemDe?.company || ''
                    },
                    rating: itemTr.rating || 5,
                    avatar: itemTr.avatar || '',
                    status: itemTr.status || 'active'
                });
            }
        } catch (error) {
            console.error('Error loading testimonial:', error);
            alert('Testimonial yüklenirken hata oluştu');
        }
    };

    const handleAutoTranslate = async () => {
        if (!formData.tr.name && !formData.tr.role && !formData.tr.comment && !formData.tr.company) {
            alert('Önce Türkçe içeriği girin');
            return;
        }

        try {
            setTranslating(true);

            // İsim çevirisi
            if (formData.tr.name) {
                const nameEn = await translateText(formData.tr.name, 'tr', 'en');
                const nameDe = await translateText(formData.tr.name, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, name: nameEn.translatedText || '' },
                    de: { ...prev.de, name: nameDe.translatedText || '' }
                }));
            }

            // Rol çevirisi
            if (formData.tr.role) {
                const roleEn = await translateText(formData.tr.role, 'tr', 'en');
                const roleDe = await translateText(formData.tr.role, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, role: roleEn.translatedText || '' },
                    de: { ...prev.de, role: roleDe.translatedText || '' }
                }));
            }

            // Yorum çevirisi
            if (formData.tr.comment) {
                const commentEn = await translateText(formData.tr.comment, 'tr', 'en');
                const commentDe = await translateText(formData.tr.comment, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, comment: commentEn.translatedText || '' },
                    de: { ...prev.de, comment: commentDe.translatedText || '' }
                }));
            }

            // Şirket çevirisi
            if (formData.tr.company) {
                const companyEn = await translateText(formData.tr.company, 'tr', 'en');
                const companyDe = await translateText(formData.tr.company, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, company: companyEn.translatedText || '' },
                    de: { ...prev.de, company: companyDe.translatedText || '' }
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
        
        if (!formData.tr.name.trim() || !formData.tr.comment.trim()) {
            alert('Türkçe isim ve yorum gerekli');
            return;
        }

        try {
            setLoading(true);
            
            const saveData = {
                name: formData.tr.name,
                role: formData.tr.role,
                comment: formData.tr.comment,
                company: formData.tr.company,
                rating: formData.rating,
                avatar: formData.avatar,
                status: formData.status,
                translations: JSON.stringify({
                    en: formData.en,
                    de: formData.de
                })
            };
            
            if (isEdit) {
                await updateTestimonialItem(id, saveData);
            } else {
                await createTestimonialItem(saveData);
            }
            
            navigate('/admin/sections/testimonials/items');
        } catch (error) {
            console.error('Error saving testimonial:', error);
            alert('Testimonial kaydedilirken hata oluştu');
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
            <div className="admin-testimonials-add-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <button 
                                className="btn-back"
                                onClick={() => navigate('/admin/sections/testimonials/items')}
                            >
                                <FiChevronLeft /> Geri
                            </button>
                            <h1>{isEdit ? 'Testimonial Düzenle' : 'Yeni Testimonial Ekle'}</h1>
                            <p>Çok dilli testimonial oluşturun</p>
                        </div>
                        <button 
                            className="btn btn-outline"
                            onClick={() => navigate('/admin/sections/testimonials/items')}
                        >
                            <FiX /> İptal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="testimonial-form">
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
                                    İsim <span className="required">*</span>
                                    {activeTab === 'tr' && <span className="help-text">(Diğer diller otomatik çevrilecek)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData[activeTab].name}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], name: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Kullanıcı adı' : activeTab === 'en' ? 'User name' : 'Benutzername'}
                                    required={activeTab === 'tr'}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Rol/Ünvan
                                </label>
                                <input
                                    type="text"
                                    value={formData[activeTab].role}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], role: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Örn: Yazılım Geliştirici' : activeTab === 'en' ? 'E.g.: Software Developer' : 'z.B.: Softwareentwickler'}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Şirket
                                </label>
                                <input
                                    type="text"
                                    value={formData[activeTab].company}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], company: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Şirket adı' : activeTab === 'en' ? 'Company name' : 'Firmenname'}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Yorum <span className="required">*</span>
                                </label>
                                <textarea
                                    value={formData[activeTab].comment}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], comment: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Kullanıcı yorumu' : activeTab === 'en' ? 'User comment' : 'Benutzerkommentar'}
                                    rows="6"
                                    required={activeTab === 'tr'}
                                />
                            </div>
                        </div>

                        {/* Ortak Alanlar */}
                        <div className="form-section">
                            <h2>Genel Ayarlar</h2>
                            
                            <div className="form-group">
                                <label>Puan (1-5)</label>
                                <div className="rating-input">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                        <button
                                            key={rating}
                                            type="button"
                                            className={`rating-star ${formData.rating >= rating ? 'filled' : ''}`}
                                            onClick={() => setFormData({ ...formData, rating })}
                                        >
                                            <FiStar />
                                        </button>
                                    ))}
                                    <span className="rating-value">{formData.rating} / 5</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Avatar URL</label>
                                <input
                                    type="text"
                                    value={formData.avatar}
                                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                    placeholder="https://..."
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

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate('/admin/sections/testimonials/items')}
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

export default AdminTestimonialsAdd;

