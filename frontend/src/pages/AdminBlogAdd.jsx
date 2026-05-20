import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { translateText } from '../api/i18n';
import AdminLayout from '../components/AdminLayout';
import { FiX, FiUpload, FiImage, FiSave, FiGlobe, FiLoader, FiPlus } from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import './AdminBlogAdd.css';

const AdminBlogAdd = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [coverImage, setCoverImage] = useState(null);
    const [coverImagePreview, setCoverImagePreview] = useState(null);
    const [metaKeywords, setMetaKeywords] = useState([]);
    const [metaKeywordInput, setMetaKeywordInput] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [formData, setFormData] = useState({
        // Türkçe
        title_tr: '',
        excerpt_tr: '',
        content_tr: '',
        // İngilizce
        title_en: '',
        excerpt_en: '',
        content_en: '',
        // Almanca
        title_de: '',
        excerpt_de: '',
        content_de: '',
        // Ortak alanlar
        category_id: '',
        status: 'draft',
        is_featured: false,
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        cover_image: null
    });

    // Her dil için ayrı editor
    const editorTr = useEditor({
        extensions: [
            StarterKit.configure({ link: false }),
            TextStyle,
            Color,
            Image.configure({ inline: true, allowBase64: true }),
            Link.configure({ openOnClick: false }),
        ],
        content: formData.content_tr,
        onUpdate: ({ editor }) => {
            setFormData({ ...formData, content_tr: editor.getHTML() });
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
                placeholder: 'Blog yazısı içeriğini girin...',
            },
        },
    });

    const editorEn = useEditor({
        extensions: [
            StarterKit.configure({ link: false }),
            TextStyle,
            Color,
            Image.configure({ inline: true, allowBase64: true }),
            Link.configure({ openOnClick: false }),
        ],
        content: formData.content_en,
        onUpdate: ({ editor }) => {
            setFormData({ ...formData, content_en: editor.getHTML() });
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
                placeholder: 'Enter blog post content...',
            },
        },
    });

    const editorDe = useEditor({
        extensions: [
            StarterKit.configure({ link: false }),
            TextStyle,
            Color,
            Image.configure({ inline: true, allowBase64: true }),
            Link.configure({ openOnClick: false }),
        ],
        content: formData.content_de,
        onUpdate: ({ editor }) => {
            setFormData({ ...formData, content_de: editor.getHTML() });
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
                placeholder: 'Blog-Post-Inhalt eingeben...',
            },
        },
    });

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await api.get('/admin/blog/categories');
                const cats = response.data.categories || [];
                setCategories(cats);
                
                // En düşük ID'li kategoriyi default olarak seç
                if (cats.length > 0) {
                    const lowestIdCategory = cats.reduce((prev, curr) => 
                        prev.id < curr.id ? prev : curr
                    );
                    setFormData(prev => {
                        // Eğer kategori seçilmemişse, en düşük ID'li kategoriyi seç
                        if (!prev.category_id) {
                            return { ...prev, category_id: lowestIdCategory.id.toString() };
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error('Categories load error:', error);
            }
        };
        loadCategories();
    }, []);

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            alert('Kategori adı gerekli');
            return;
        }

        try {
            const response = await api.post('/admin/blog/categories', newCategory);
            alert('Kategori eklendi!');
            setShowCategoryModal(false);
            setNewCategory({ name: '', description: '' });
            
            // Kategorileri yeniden yükle
            const categoriesResponse = await api.get('/admin/blog/categories');
            setCategories(categoriesResponse.data.categories || []);
            
            // Yeni eklenen kategoriyi seç
            const newCat = categoriesResponse.data.categories.find(c => c.name === newCategory.name);
            if (newCat) {
                setFormData({ ...formData, category_id: newCat.id });
            }
        } catch (error) {
            console.error('Add category error:', error);
            alert(error.response?.data?.error || 'Kategori eklenirken hata oluştu');
        }
    };

    useEffect(() => {
        if (editorTr && formData.content_tr) {
            const current = editorTr.getHTML();
            if (current !== formData.content_tr) {
                editorTr.commands.setContent(formData.content_tr);
            }
        }
    }, [formData.content_tr, editorTr]);

    useEffect(() => {
        if (editorEn && formData.content_en) {
            const current = editorEn.getHTML();
            if (current !== formData.content_en) {
                editorEn.commands.setContent(formData.content_en);
            }
        }
    }, [formData.content_en, editorEn]);

    useEffect(() => {
        if (editorDe && formData.content_de) {
            const current = editorDe.getHTML();
            if (current !== formData.content_de) {
                editorDe.commands.setContent(formData.content_de);
            }
        }
    }, [formData.content_de, editorDe]);

    // Türkçe'den diğer dillere otomatik çeviri
    const handleAutoTranslate = async () => {
        if (!formData.title_tr && !formData.excerpt_tr && !formData.content_tr) {
            alert('Önce Türkçe içeriği girin');
            return;
        }

        try {
            setTranslating(true);

            if (formData.title_tr) {
                const titleEn = await translateText(formData.title_tr, 'tr', 'en');
                const titleDe = await translateText(formData.title_tr, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    title_en: titleEn.translatedText || '',
                    title_de: titleDe.translatedText || ''
                }));
            }

            if (formData.excerpt_tr) {
                const excerptEn = await translateText(formData.excerpt_tr, 'tr', 'en');
                const excerptDe = await translateText(formData.excerpt_tr, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    excerpt_en: excerptEn.translatedText || '',
                    excerpt_de: excerptDe.translatedText || ''
                }));
            }

            if (formData.content_tr) {
                const textContent = formData.content_tr.replace(/<[^>]*>/g, ' ').trim();
                if (textContent) {
                    const contentEn = await translateText(textContent, 'tr', 'en');
                    const contentDe = await translateText(textContent, 'tr', 'de');
                    
                    setFormData(prev => ({
                        ...prev,
                        content_en: `<p>${contentEn.translatedText || ''}</p>`,
                        content_de: `<p>${contentDe.translatedText || ''}</p>`
                    }));

                    if (editorEn) editorEn.commands.setContent(`<p>${contentEn.translatedText || ''}</p>`);
                    if (editorDe) editorDe.commands.setContent(`<p>${contentDe.translatedText || ''}</p>`);
                }
            }

            alert('Çeviri tamamlandı!');
        } catch (error) {
            console.error('Translation error:', error);
            alert('Çeviri sırasında hata oluştu');
        } finally {
            setTranslating(false);
        }
    };

    const handleCoverImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            setCoverImagePreview(URL.createObjectURL(file));
            setFormData({ ...formData, cover_image: file });
        }
    };

    const handleMetaKeywordAdd = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const keyword = metaKeywordInput.trim();
            if (keyword && !metaKeywords.includes(keyword)) {
                const newKeywords = [...metaKeywords, keyword];
                setMetaKeywords(newKeywords);
                setFormData({ ...formData, meta_keywords: newKeywords.join(', ') });
                setMetaKeywordInput('');
            }
        }
    };

    const handleMetaKeywordRemove = (keyword) => {
        const newKeywords = metaKeywords.filter(k => k !== keyword);
        setMetaKeywords(newKeywords);
        setFormData({ ...formData, meta_keywords: newKeywords.join(', ') });
    };

    useEffect(() => {
        // FormData'dan meta_keywords'ü parse et
        if (formData.meta_keywords) {
            const keywords = formData.meta_keywords.split(',').map(k => k.trim()).filter(k => k);
            setMetaKeywords(keywords);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title_tr || !formData.content_tr) {
            alert('Lütfen Türkçe başlık ve içerik girin');
            return;
        }

        try {
            setLoading(true);
            
            const submitData = new FormData();
            
            // Çok dilli içerik
            submitData.append('title_tr', formData.title_tr);
            submitData.append('excerpt_tr', formData.excerpt_tr);
            submitData.append('content_tr', formData.content_tr);
            submitData.append('title_en', formData.title_en);
            submitData.append('excerpt_en', formData.excerpt_en);
            submitData.append('content_en', formData.content_en);
            submitData.append('title_de', formData.title_de);
            submitData.append('excerpt_de', formData.excerpt_de);
            submitData.append('content_de', formData.content_de);
            
            // Ortak alanlar
            submitData.append('category_id', formData.category_id || '');
            submitData.append('status', formData.status);
            submitData.append('is_featured', formData.is_featured ? '1' : '0');
            submitData.append('meta_title', formData.meta_title || '');
            submitData.append('meta_description', formData.meta_description || '');
            submitData.append('meta_keywords', formData.meta_keywords || '');
            
            if (coverImage) {
                submitData.append('cover_image', coverImage);
            }

            await api.post('/admin/blog', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert('Blog yazısı başarıyla oluşturuldu!');
            navigate('/admin/blog');
        } catch (error) {
            console.error('Create blog post error:', error);
            alert(error.response?.data?.error || 'Blog yazısı oluşturulurken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentEditor = () => {
        switch(activeTab) {
            case 'tr': return editorTr;
            case 'en': return editorEn;
            case 'de': return editorDe;
            default: return editorTr;
        }
    };

    const tabs = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

    const currentEditor = getCurrentEditor();

    return (
        <AdminLayout>
            <div className="admin-blog-add-page">
                <div className="page-header">
                    <div className="header-content">
                        <h1>Yeni Blog Yazısı</h1>
                        <p>Çok dilli blog yazısı oluşturun</p>
                    </div>
                    <button 
                        className="btn btn-outline"
                        onClick={() => navigate('/admin/blog')}
                    >
                        <FiX /> İptal
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="blog-form">
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
                            </label>
                            <input
                                type="text"
                                value={formData[`title_${activeTab}`]}
                                onChange={(e) => setFormData({...formData, [`title_${activeTab}`]: e.target.value})}
                                placeholder={activeTab === 'tr' ? 'Blog yazısı başlığını girin' : 'Enter blog post title'}
                                required={activeTab === 'tr'}
                            />
                        </div>

                        <div className="form-group">
                            <label>Özet</label>
                            <textarea
                                value={formData[`excerpt_${activeTab}`]}
                                onChange={(e) => setFormData({...formData, [`excerpt_${activeTab}`]: e.target.value})}
                                placeholder={activeTab === 'tr' ? 'Kısa bir özet yazın' : 'Write a short excerpt'}
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                İçerik <span className="required">*</span>
                            </label>
                            <div className="rich-editor-wrapper">
                                {currentEditor && (
                                    <>
                                        <div className="editor-toolbar">
                                            <button
                                                type="button"
                                                onClick={() => currentEditor.chain().focus().toggleBold().run()}
                                                className={currentEditor.isActive('bold') ? 'is-active' : ''}
                                            >
                                                <strong>B</strong>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => currentEditor.chain().focus().toggleItalic().run()}
                                                className={currentEditor.isActive('italic') ? 'is-active' : ''}
                                            >
                                                <em>I</em>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => currentEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                                                className={currentEditor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                                            >
                                                H1
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => currentEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                                                className={currentEditor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                                            >
                                                H2
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => currentEditor.chain().focus().toggleBulletList().run()}
                                                className={currentEditor.isActive('bulletList') ? 'is-active' : ''}
                                            >
                                                •
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const url = window.prompt('Resim URL\'si:');
                                                    if (url) currentEditor.chain().focus().setImage({ src: url }).run();
                                                }}
                                            >
                                                <FiImage />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const url = window.prompt('Link URL\'si:');
                                                    if (url) currentEditor.chain().focus().setLink({ href: url }).run();
                                                }}
                                            >
                                                🔗
                                            </button>
                                        </div>
                                        <EditorContent editor={currentEditor} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ortak Alanlar */}
                    <div className="form-section">
                        <h2>Genel Ayarlar</h2>
                        
                        <div className="form-group">
                            <label>Kategori</label>
                            <div className="category-select-wrapper">
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                >
                                    <option value="">Kategori Seçin</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="btn-add-category"
                                    onClick={() => setShowCategoryModal(true)}
                                    title="Yeni Kategori Ekle"
                                >
                                    <FiPlus />
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Durum</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                            >
                                <option value="draft">Taslak</option>
                                <option value="published">Yayınlandı</option>
                                <option value="archived">Arşivlendi</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                                />
                                Öne Çıkarılmış
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Kapak Resmi</label>
                            <div className="image-upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverImageUpload}
                                    id="cover-image"
                                />
                                <label htmlFor="cover-image" className="upload-btn">
                                    <FiUpload /> Resim Yükle
                                </label>
                                {coverImagePreview && (
                                    <div className="image-preview">
                                        <img src={coverImagePreview} alt="Preview" />
                                        <button type="button" onClick={() => {
                                            setCoverImage(null);
                                            setCoverImagePreview(null);
                                            setFormData({...formData, cover_image: null});
                                        }}>
                                            <FiX />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SEO Ayarları */}
                    <div className="form-section">
                        <h2>SEO Ayarları</h2>
                        
                        <div className="form-group">
                            <label>Meta Başlık</label>
                            <input
                                type="text"
                                value={formData.meta_title}
                                onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                                placeholder="SEO için başlık"
                            />
                        </div>

                        <div className="form-group">
                            <label>Meta Açıklama</label>
                            <textarea
                                value={formData.meta_description}
                                onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                                placeholder="SEO için açıklama"
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Meta Anahtar Kelimeler</label>
                            <div className="meta-keywords-input">
                                <div className="keywords-tags">
                                    {metaKeywords.map((keyword, index) => (
                                        <span key={index} className="keyword-tag">
                                            {keyword}
                                            <button
                                                type="button"
                                                onClick={() => handleMetaKeywordRemove(keyword)}
                                                className="tag-remove"
                                            >
                                                <FiX />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={metaKeywordInput}
                                    onChange={(e) => setMetaKeywordInput(e.target.value)}
                                    onKeyDown={handleMetaKeywordAdd}
                                    placeholder="Anahtar kelime yazın ve Enter veya virgül tuşuna basın"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><FiLoader className="spinning" /> Kaydediliyor...</> : <><FiSave /> Kaydet</>}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/blog')}>
                            <FiX /> İptal
                        </button>
                    </div>
                </form>

                {/* Kategori Ekleme Modalı */}
                {showCategoryModal && (
                    <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Yeni Kategori Ekle</h2>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowCategoryModal(false)}
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>
                                        Kategori Adı <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                        placeholder="Örn: Teknoloji, Web Geliştirme"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Açıklama</label>
                                    <textarea
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                                        placeholder="Kategori açıklaması (isteğe bağlı)"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddCategory}
                                >
                                    <FiSave /> Kaydet
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowCategoryModal(false)}
                                >
                                    <FiX /> İptal
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminBlogAdd;

