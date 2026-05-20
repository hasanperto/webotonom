import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { 
    FiX, FiSave, FiGlobe, FiLoader, FiChevronLeft, FiPlus
} from 'react-icons/fi';
import { 
    getFAQItems, createFAQItem, updateFAQItem
} from '../api/sections';
import { translateText } from '../api/i18n';
import './AdminFAQAdd.css';

const AdminFAQAdd = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [formData, setFormData] = useState({
        tr: {
            question: '',
            answer: ''
        },
        en: {
            question: '',
            answer: ''
        },
        de: {
            question: '',
            answer: ''
        },
        category: '',
        status: 'active'
    });
    const [categories, setCategories] = useState([]);
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        if (isEdit) {
            loadFAQ();
        }
        loadCategories();
    }, [id]);

    const loadCategories = async () => {
        try {
            const items = await getFAQItems();
            const uniqueCategories = [...new Set(items
                .map(item => item.category)
                .filter(cat => cat && cat.trim() !== '')
            )].sort();
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadFAQ = async () => {
        try {
            const items = await getFAQItems();
            const item = items.find(i => i.id === parseInt(id));
            if (item) {
                setFormData({
                    tr: {
                        question: item.question || '',
                        answer: item.answer || ''
                    },
                    en: {
                        question: '',
                        answer: ''
                    },
                    de: {
                        question: '',
                        answer: ''
                    },
                    category: item.category || '',
                    status: item.status || 'active'
                });
            }
        } catch (error) {
            console.error('Error loading FAQ:', error);
            alert('FAQ yüklenirken hata oluştu');
        }
    };

    const handleAutoTranslate = async () => {
        if (!formData.tr.question && !formData.tr.answer) {
            alert('Önce Türkçe içeriği girin');
            return;
        }

        try {
            setTranslating(true);

            // Soru çevirisi
            if (formData.tr.question) {
                const questionEn = await translateText(formData.tr.question, 'tr', 'en');
                const questionDe = await translateText(formData.tr.question, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, question: questionEn.translatedText || '' },
                    de: { ...prev.de, question: questionDe.translatedText || '' }
                }));
            }

            // Cevap çevirisi
            if (formData.tr.answer) {
                const answerEn = await translateText(formData.tr.answer, 'tr', 'en');
                const answerDe = await translateText(formData.tr.answer, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    en: { ...prev.en, answer: answerEn.translatedText || '' },
                    de: { ...prev.de, answer: answerDe.translatedText || '' }
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

    const handleAddCategory = () => {
        if (newCategory.trim() === '') {
            alert('Kategori adı boş olamaz');
            return;
        }
        
        const categoryLower = newCategory.trim().toLowerCase();
        if (categories.includes(categoryLower)) {
            alert('Bu kategori zaten mevcut');
            return;
        }
        
        setCategories([...categories, categoryLower].sort());
        setFormData({ ...formData, category: categoryLower });
        setNewCategory('');
        setShowCategoryInput(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.tr.question.trim() || !formData.tr.answer.trim()) {
            alert('Türkçe soru ve cevap gerekli');
            return;
        }

        try {
            setLoading(true);
            
            const saveData = {
                question: formData.tr.question,
                answer: formData.tr.answer,
                category: formData.category || '',
                status: formData.status,
                translations: JSON.stringify({
                    en: formData.en,
                    de: formData.de
                })
            };
            
            if (isEdit) {
                await updateFAQItem(id, saveData);
            } else {
                await createFAQItem(saveData);
            }
            
            navigate('/admin/sections/faq/items');
        } catch (error) {
            console.error('Error saving FAQ:', error);
            alert('FAQ kaydedilirken hata oluştu');
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
            <div className="admin-faq-add-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <button 
                                className="btn-back"
                                onClick={() => navigate('/admin/sections/faq/items')}
                            >
                                <FiChevronLeft /> Geri
                            </button>
                            <h1>{isEdit ? 'FAQ Düzenle' : 'Yeni FAQ Ekle'}</h1>
                            <p>Çok dilli FAQ oluşturun</p>
                        </div>
                        <button 
                            className="btn btn-outline"
                            onClick={() => navigate('/admin/sections/faq/items')}
                        >
                            <FiX /> İptal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="faq-form">
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
                                    Soru <span className="required">*</span>
                                    {activeTab === 'tr' && <span className="help-text">(Diğer diller otomatik çevrilecek)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData[activeTab].question}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], question: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Örn: TeknoProje nedir?' : activeTab === 'en' ? 'E.g.: What is TeknoProje?' : 'z.B.: Was ist TeknoProje?'}
                                    required={activeTab === 'tr'}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Cevap <span className="required">*</span>
                                </label>
                                <textarea
                                    value={formData[activeTab].answer}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        [activeTab]: { ...formData[activeTab], answer: e.target.value }
                                    })}
                                    placeholder={activeTab === 'tr' ? 'Sorunun cevabını yazın...' : activeTab === 'en' ? 'Write the answer...' : 'Schreiben Sie die Antwort...'}
                                    rows="8"
                                    required={activeTab === 'tr'}
                                />
                            </div>
                        </div>

                        {/* Ortak Alanlar */}
                        <div className="form-section">
                            <h2>Genel Ayarlar</h2>
                            
                            <div className="form-group">
                                <label>Kategori</label>
                                <div className="category-select-group">
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="category-select"
                                    >
                                        <option value="">Kategori Seçiniz</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {!isEdit && (
                                        <button
                                            type="button"
                                            className="btn-add-category"
                                            onClick={() => setShowCategoryInput(!showCategoryInput)}
                                            title="Yeni Kategori Ekle"
                                        >
                                            <FiPlus />
                                        </button>
                                    )}
                                </div>
                                {showCategoryInput && (
                                    <div className="category-input-group">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="Yeni kategori adı (örn: general, payment)"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCategory();
                                                }
                                            }}
                                            className="category-input"
                                        />
                                        <button
                                            type="button"
                                            className="btn-add-category-confirm"
                                            onClick={handleAddCategory}
                                        >
                                            Ekle
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-cancel-category"
                                            onClick={() => {
                                                setShowCategoryInput(false);
                                                setNewCategory('');
                                            }}
                                        >
                                            İptal
                                        </button>
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
                                onClick={() => navigate('/admin/sections/faq/items')}
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

export default AdminFAQAdd;

