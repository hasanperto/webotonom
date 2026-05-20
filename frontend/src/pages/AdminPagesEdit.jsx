import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { translateText } from '../api/i18n';
import AdminLayout from '../components/AdminLayout';
import { 
    FiX, FiSave, FiGlobe, FiLoader, FiChevronLeft,
    FiBold, FiItalic, FiUnderline, FiType, FiCode,
    FiAlignLeft, FiAlignCenter, FiAlignRight,
    FiList, FiImage, FiLink, FiMinus, FiCornerDownRight
} from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import './AdminPagesAdd.css';

const AdminPagesEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [formData, setFormData] = useState({
        // Türkçe
        title_tr: '',
        content_tr: '',
        slug_tr: '',
        meta_title_tr: '',
        meta_description_tr: '',
        // İngilizce
        title_en: '',
        content_en: '',
        slug_en: '',
        meta_title_en: '',
        meta_description_en: '',
        // Almanca
        title_de: '',
        content_de: '',
        slug_de: '',
        meta_title_de: '',
        meta_description_de: '',
        // Ortak alanlar
        status: 'active'
    });

    const tabs = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'İngilizce', flag: '🇬🇧' },
        { code: 'de', name: 'Almanca', flag: '🇩🇪' }
    ];

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
                placeholder: 'Sayfa içeriğini girin...',
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
                placeholder: 'Enter page content...',
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
                placeholder: 'Seiteninhalt eingeben...',
            },
        },
    });

    const currentEditor = activeTab === 'tr' ? editorTr : activeTab === 'en' ? editorEn : editorDe;

    useEffect(() => {
        loadPage();
    }, [id]);

    const loadPage = async () => {
        try {
            setPageLoading(true);
            const response = await api.get(`/admin/pages/${id}`);
            const page = response.data.page || {};
            
            // Çevirileri yükle
            let translations = {};
            try {
                const transResponse = await api.get(`/i18n/content/${id}?type=page`);
                translations = transResponse.data.translations || {};
            } catch (err) {
                console.warn('Translations not available:', err);
            }

            // extra_data'dan slug ve SEO bilgilerini çek
            const parseExtraData = (extraData) => {
                if (!extraData) return {};
                try {
                    return typeof extraData === 'string' ? JSON.parse(extraData) : extraData;
                } catch {
                    return {};
                }
            };

            const trExtra = parseExtraData(translations.tr?.extra_data);
            const enExtra = parseExtraData(translations.en?.extra_data);
            const deExtra = parseExtraData(translations.de?.extra_data);

            setFormData({
                title_tr: page.title || translations.tr?.title || '',
                content_tr: page.content || translations.tr?.description || '',
                slug_tr: trExtra.slug || page.slug || '',
                meta_title_tr: trExtra.meta_title || page.meta_title || '',
                meta_description_tr: trExtra.meta_description || page.meta_description || '',
                title_en: translations.en?.title || '',
                content_en: translations.en?.description || '',
                slug_en: enExtra.slug || '',
                meta_title_en: enExtra.meta_title || '',
                meta_description_en: enExtra.meta_description || '',
                title_de: translations.de?.title || '',
                content_de: translations.de?.description || '',
                slug_de: deExtra.slug || '',
                meta_title_de: deExtra.meta_title || '',
                meta_description_de: deExtra.meta_description || '',
                status: page.status || 'active'
            });

            if (editorTr && (page.content || translations.tr?.description)) {
                editorTr.commands.setContent(page.content || translations.tr?.description || '');
            }
            if (editorEn && translations.en?.description) {
                editorEn.commands.setContent(translations.en.description);
            }
            if (editorDe && translations.de?.description) {
                editorDe.commands.setContent(translations.de.description);
            }
        } catch (error) {
            console.error('Load page error:', error);
            alert('Sayfa yüklenirken hata oluştu');
            navigate('/admin/pages');
        } finally {
            setPageLoading(false);
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
        if (!formData.title_tr && !formData.content_tr) {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title_tr || !formData.content_tr) {
            alert('Lütfen Türkçe başlık ve içerik girin');
            return;
        }

        try {
            setLoading(true);
            
            const submitData = {
                title: formData.title_tr,
                slug: formData.slug_tr || formData.slug_en || formData.slug_de || '',
                content: formData.content_tr,
                meta_title: formData.meta_title_tr || '',
                meta_description: formData.meta_description_tr || '',
                status: formData.status,
                // Çok dilli içerik
                title_tr: formData.title_tr,
                content_tr: formData.content_tr,
                slug_tr: formData.slug_tr || '',
                meta_title_tr: formData.meta_title_tr || '',
                meta_description_tr: formData.meta_description_tr || '',
                title_en: formData.title_en || '',
                content_en: formData.content_en || '',
                slug_en: formData.slug_en || '',
                meta_title_en: formData.meta_title_en || '',
                meta_description_en: formData.meta_description_en || '',
                title_de: formData.title_de || '',
                content_de: formData.content_de || '',
                slug_de: formData.slug_de || '',
                meta_title_de: formData.meta_title_de || '',
                meta_description_de: formData.meta_description_de || ''
            };

            await api.put(`/admin/pages/${id}`, submitData);
            navigate('/admin/pages');
        } catch (error) {
            console.error('Update page error:', error);
            alert('Sayfa güncellenirken hata oluştu: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <AdminLayout>
                <div className="admin-pages-add-page">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-pages-add-page">
                <div className="page-header-advanced">
                    <button 
                        onClick={() => navigate('/admin/pages')}
                        className="btn-back"
                    >
                        <FiChevronLeft /> Geri
                    </button>
                    <h1 className="page-title-advanced">Sayfa Düzenle</h1>
                </div>

                <form onSubmit={handleSubmit} className="page-form">
                    {/* Tab Sistemi */}
                    <div className="tabs-container">
                        <div className="tabs-header">
                            {tabs.map(tab => (
                                <button
                                    key={tab.code}
                                    type="button"
                                    className={`tab-button ${activeTab === tab.code ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.code)}
                                >
                                    <span className="tab-flag">{tab.flag}</span>
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                            <div className="tab-actions">
                                <button
                                    type="button"
                                    className="btn-translate"
                                    onClick={handleAutoTranslate}
                                    disabled={translating || !formData.title_tr && !formData.content_tr}
                                    title="Türkçe içeriği diğer dillere çevir"
                                >
                                    {translating ? <FiLoader className="spinning" /> : <FiGlobe />}
                                    {translating ? 'Çevriliyor...' : 'AI ile Çevir'}
                                </button>
                            </div>
                        </div>

                        {/* Tab İçerikleri */}
                        <div className="tabs-content">
                            {tabs.map(tab => (
                                <div
                                    key={tab.code}
                                    className={`tab-panel ${activeTab === tab.code ? 'active' : ''}`}
                                >
                                    <div className="form-group">
                                        <label>
                                            Başlık {tab.code === 'tr' && <span className="required">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData[`title_${tab.code}`]}
                                            onChange={(e) => setFormData({...formData, [`title_${tab.code}`]: e.target.value})}
                                            placeholder={tab.code === 'tr' ? 'Sayfa başlığını girin' : tab.code === 'en' ? 'Enter page title' : 'Seitentitel eingeben'}
                                            required={tab.code === 'tr'}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Slug
                                        </label>
                                        <input
                                            type="text"
                                            value={formData[`slug_${tab.code}`]}
                                            onChange={(e) => setFormData({...formData, [`slug_${tab.code}`]: e.target.value})}
                                            placeholder={tab.code === 'tr' ? 'sayfa-slug' : tab.code === 'en' ? 'page-slug' : 'seiten-slug'}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            İçerik {tab.code === 'tr' && <span className="required">*</span>}
                                        </label>
                                        <div className="rich-editor-wrapper">
                                            {currentEditor && activeTab === tab.code && (
                                                <>
                                                    <div className="editor-toolbar-advanced">
                                                        {/* Metin Formatlama */}
                                                        <div className="toolbar-group">
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleBold().run()}
                                                                className={currentEditor.isActive('bold') ? 'is-active' : ''}
                                                                title="Kalın (Ctrl+B)"
                                                            >
                                                                <FiBold />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleItalic().run()}
                                                                className={currentEditor.isActive('italic') ? 'is-active' : ''}
                                                                title="İtalik (Ctrl+I)"
                                                            >
                                                                <FiItalic />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const attrs = currentEditor.getAttributes('textStyle');
                                                                    if (attrs.textDecoration === 'underline') {
                                                                        currentEditor.chain().focus().unsetMark('textStyle').run();
                                                                    } else {
                                                                        currentEditor.chain().focus().setMark('textStyle', { textDecoration: 'underline' }).run();
                                                                    }
                                                                }}
                                                                className={currentEditor.getAttributes('textStyle')?.textDecoration === 'underline' ? 'is-active' : ''}
                                                                title="Altı Çizili"
                                                            >
                                                                <FiUnderline />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleStrike().run()}
                                                                className={currentEditor.isActive('strike') ? 'is-active' : ''}
                                                                title="Üstü Çizili"
                                                            >
                                                                <s>S</s>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleCode().run()}
                                                                className={currentEditor.isActive('code') ? 'is-active' : ''}
                                                                title="Kod"
                                                            >
                                                                <FiCode />
                                                            </button>
                                                        </div>

                                                        <div className="toolbar-divider"></div>

                                                        {/* Başlıklar */}
                                                        <div className="toolbar-group">
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleHeading({ level: 1 }).run()}
                                                                className={currentEditor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                                                                title="Başlık 1"
                                                            >
                                                                H1
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleHeading({ level: 2 }).run()}
                                                                className={currentEditor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                                                                title="Başlık 2"
                                                            >
                                                                H2
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleHeading({ level: 3 }).run()}
                                                                className={currentEditor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                                                                title="Başlık 3"
                                                            >
                                                                H3
                                                            </button>
                                                        </div>

                                                        <div className="toolbar-divider"></div>

                                                        {/* Listeler */}
                                                        <div className="toolbar-group">
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleBulletList().run()}
                                                                className={currentEditor.isActive('bulletList') ? 'is-active' : ''}
                                                                title="Madde İşareti"
                                                            >
                                                                <FiList />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleOrderedList().run()}
                                                                className={currentEditor.isActive('orderedList') ? 'is-active' : ''}
                                                                title="Numaralı Liste"
                                                            >
                                                                1.
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().toggleBlockquote().run()}
                                                                className={currentEditor.isActive('blockquote') ? 'is-active' : ''}
                                                                title="Alıntı"
                                                            >
                                                                <FiCornerDownRight />
                                                            </button>
                                                        </div>

                                                        <div className="toolbar-divider"></div>

                                                        {/* Medya */}
                                                        <div className="toolbar-group">
                                                            <label className="toolbar-button-image">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            const reader = new FileReader();
                                                                            reader.onload = (event) => {
                                                                                currentEditor.chain().focus().setImage({ src: event.target.result }).run();
                                                                            };
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                        e.target.value = '';
                                                                    }}
                                                                    style={{ display: 'none' }}
                                                                />
                                                                <FiImage />
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const url = window.prompt('Link URL\'si:');
                                                                    if (url) {
                                                                        currentEditor.chain().focus().setLink({ href: url }).run();
                                                                    }
                                                                }}
                                                                className={currentEditor.isActive('link') ? 'is-active' : ''}
                                                                title="Link Ekle"
                                                            >
                                                                <FiLink />
                                                            </button>
                                                        </div>

                                                        <div className="toolbar-divider"></div>

                                                        {/* Geri Al / Yinele */}
                                                        <div className="toolbar-group">
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().undo().run()}
                                                                disabled={!currentEditor.can().undo()}
                                                                title="Geri Al (Ctrl+Z)"
                                                            >
                                                                ↶
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => currentEditor.chain().focus().redo().run()}
                                                                disabled={!currentEditor.can().redo()}
                                                                title="Yinele (Ctrl+Y)"
                                                            >
                                                                ↷
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <EditorContent editor={currentEditor} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SEO Ayarları - Her Dil İçin */}
                    <div className="form-section">
                        <h2>SEO Ayarları</h2>
                        {tabs.map(tab => (
                            <div key={`seo-${tab.code}`} className="seo-tab-section">
                                <h3 className="seo-tab-title">
                                    <span className="tab-flag">{tab.flag}</span>
                                    {tab.name} SEO
                                </h3>
                                <div className="form-group">
                                    <label>Meta Başlık</label>
                                    <input
                                        type="text"
                                        value={formData[`meta_title_${tab.code}`]}
                                        onChange={(e) => setFormData({...formData, [`meta_title_${tab.code}`]: e.target.value})}
                                        placeholder={tab.code === 'tr' ? 'SEO için başlık' : tab.code === 'en' ? 'SEO title' : 'SEO-Titel'}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Meta Açıklama</label>
                                    <textarea
                                        value={formData[`meta_description_${tab.code}`]}
                                        onChange={(e) => setFormData({...formData, [`meta_description_${tab.code}`]: e.target.value})}
                                        placeholder={tab.code === 'tr' ? 'SEO için açıklama' : tab.code === 'en' ? 'SEO description' : 'SEO-Beschreibung'}
                                        rows="3"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ortak Alanlar */}
                    <div className="form-section">
                        <h2>Genel Ayarlar</h2>
                        
                        <div className="form-group">
                            <label>Durum</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                            >
                                <option value="active">Aktif</option>
                                <option value="inactive">Pasif</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><FiLoader className="spinning" /> Kaydediliyor...</> : <><FiSave /> Kaydet</>}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/pages')}>
                            <FiX /> İptal
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default AdminPagesEdit;

