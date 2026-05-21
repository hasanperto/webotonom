import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerAPI } from '../api/seller';
import { projectsAPI } from '../api/projects';
import { translateText } from '../api/i18n';
import SellerLayout from '../components/SellerLayout';
import AdminLayout from '../components/AdminLayout';
import { FiX, FiUpload, FiImage, FiSave, FiGlobe, FiCheck, FiLoader, FiStar } from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Select from 'react-select';
import './SellerAddProject.css';

const SellerAddProject = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin } = useAuth();
    const isAdminMode = location.pathname.includes('/admin/projects/') || isAdmin;
    const backToListPath = isAdminMode ? '/admin/projects' : '/seller/projects';
    const [categories, setCategories] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [formData, setFormData] = useState({
        // Türkçe
        title_tr: '',
        short_description_tr: '',
        description_tr: '',
        // İngilizce
        title_en: '',
        short_description_en: '',
        description_en: '',
        // Almanca
        title_de: '',
        short_description_de: '',
        description_de: '',
        // Ortak alanlar
        category_id: '',
        price: '',
        discount_price: '',
        currency: 'TRY',
        tags: [],
        completion_status: 'completed',
        completion_percentage: 100,
        status: location.pathname.includes('/admin/projects/') ? 'approved' : 'pending',
        timeline: [], // [{ title, description, date, status: 'completed'|'pending' }]
        source_url: '',
        donation_target: '',
        deadline: '',
        // Admin yönetim alanları (formdan kaldırıldı, backend'de otomatik)
        // status: 'pending' (otomatik)
        // completion_percentage, donation_target, download_limit, featured (admin yönetir)
        demo_url: '',
        admin_demo_url: '',
        demo_username: '',
        demo_password: '',
        admin_username: '',
        admin_password: '',
        video_url: '',
        license_type: '',
        requirements: '',
        version: '1.0.0',
        primary_image_id: null, // Vitrin resmi ID
        gallery_images: [] // Galeri resimleri (File objeleri)
    });
    const [uploadedImages, setUploadedImages] = useState([]);

    // Her dil için ayrı editor
    const editorTr = useEditor({
        extensions: [
            StarterKit.configure({
                link: false, // StarterKit'teki link'i devre dışı bırak
            }),
            TextStyle,
            Color,
            Image.configure({ inline: true, allowBase64: true }),
            Link.configure({ openOnClick: false }),
        ],
        content: formData.description_tr,
        onUpdate: ({ editor }) => {
            setFormData({ ...formData, description_tr: editor.getHTML() });
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
                placeholder: 'Proje hakkında detaylı bilgi verin... HTML formatında yazabilirsiniz.',
            },
        },
    });

    const editorEn = useEditor({
        extensions: [
            StarterKit.configure({
                link: false, // StarterKit'teki link'i devre dışı bırak
            }),
            TextStyle,
            Color,
            Image.configure({ inline: true, allowBase64: true }),
            Link.configure({ openOnClick: false }),
        ],
        content: formData.description_en,
        onUpdate: ({ editor }) => {
            setFormData({ ...formData, description_en: editor.getHTML() });
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
                placeholder: 'Enter detailed information about the project... You can write in HTML format.',
            },
        },
    });

    const editorDe = useEditor({
        extensions: [
            StarterKit.configure({
                link: false, // StarterKit'teki link'i devre dışı bırak
            }),
            TextStyle,
            Color,
            Image.configure({ inline: true, allowBase64: true }),
            Link.configure({ openOnClick: false }),
        ],
        content: formData.description_de,
        onUpdate: ({ editor }) => {
            setFormData({ ...formData, description_de: editor.getHTML() });
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
                placeholder: 'Geben Sie detaillierte Informationen zum Projekt ein... Sie können im HTML-Format schreiben.',
            },
        },
    });

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await projectsAPI.getCategories();
                setCategories(response.data.categories || []);
            } catch (error) {
                console.error('Categories load error:', error);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        if (editorTr && formData.description_tr) {
            const current = editorTr.getHTML();
            if (current !== formData.description_tr) {
                editorTr.commands.setContent(formData.description_tr);
            }
        }
    }, [formData.description_tr, editorTr]);

    useEffect(() => {
        if (editorEn && formData.description_en) {
            const current = editorEn.getHTML();
            if (current !== formData.description_en) {
                editorEn.commands.setContent(formData.description_en);
            }
        }
    }, [formData.description_en, editorEn]);

    useEffect(() => {
        if (editorDe && formData.description_de) {
            const current = editorDe.getHTML();
            if (current !== formData.description_de) {
                editorDe.commands.setContent(formData.description_de);
            }
        }
    }, [formData.description_de, editorDe]);

    useEffect(() => {
        const loadTags = async () => {
            try {
                const response = await projectsAPI.getTags();
                const tags = response.data?.tags || response.data || [];
                if (tags.length > 0) {
                    console.log('Tags yüklendi:', tags.length, 'adet');
                    setAvailableTags(tags);
                } else {
                    console.warn('Tags listesi boş');
                }
            } catch (error) {
                console.error('Tags yükleme hatası:', error);
                if (error.response) {
                    console.error('API Hatası:', error.response.status, error.response.data);
                }
            }
        };
        loadTags();
    }, []);

    // Türkçe'den diğer dillere otomatik çeviri
    const handleAutoTranslate = async () => {
        if (!formData.title_tr && !formData.short_description_tr && !formData.description_tr) {
            alert('Önce Türkçe içeriği girin');
            return;
        }

        try {
            setTranslating(true);

            // Başlık çevirisi
            if (formData.title_tr) {
                const titleEn = await translateText(formData.title_tr, 'tr', 'en');
                const titleDe = await translateText(formData.title_tr, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    title_en: titleEn.translatedText || '',
                    title_de: titleDe.translatedText || ''
                }));
            }

            // Kısa açıklama çevirisi
            if (formData.short_description_tr) {
                const shortEn = await translateText(formData.short_description_tr, 'tr', 'en');
                const shortDe = await translateText(formData.short_description_tr, 'tr', 'de');
                setFormData(prev => ({
                    ...prev,
                    short_description_en: shortEn.translatedText || '',
                    short_description_de: shortDe.translatedText || ''
                }));
            }

            // Detaylı açıklama çevirisi (HTML içeriği)
            if (formData.description_tr) {
                // HTML'den sadece metni çıkar
                const textContent = formData.description_tr.replace(/<[^>]*>/g, ' ').trim();
                if (textContent) {
                    const descEn = await translateText(textContent, 'tr', 'en');
                    const descDe = await translateText(textContent, 'tr', 'de');

                    // Çeviriyi HTML formatına geri dönüştür (basit)
                    setFormData(prev => ({
                        ...prev,
                        description_en: `<p>${descEn.translatedText || ''}</p>`,
                        description_de: `<p>${descDe.translatedText || ''}</p>`
                    }));

                    if (editorEn) editorEn.commands.setContent(`<p>${descEn.translatedText || ''}</p>`);
                    if (editorDe) editorDe.commands.setContent(`<p>${descDe.translatedText || ''}</p>`);
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

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const isFirstImage = uploadedImages.length === 0;
        const newImages = files.map((file, index) => ({
            id: Date.now() + Math.random() + index,
            file,
            preview: URL.createObjectURL(file),
            isPrimary: isFirstImage && index === 0 // İlk görsel otomatik vitrin resmi
        }));

        const updatedImages = [...uploadedImages, ...newImages];
        setUploadedImages(updatedImages);

        // İlk görsel otomatik vitrin resmi ise, primary_image_id'yi ayarla
        if (isFirstImage && newImages.length > 0) {
            setFormData({ ...formData, primary_image_id: newImages[0].id });
        }

        e.target.value = ''; // Reset input
    };

    const handleSetPrimaryImage = (imageId) => {
        setUploadedImages(images =>
            images.map(img => ({ ...img, isPrimary: img.id === imageId }))
        );
        setFormData({ ...formData, primary_image_id: imageId });
    };

    const handleRemoveImage = (imageId) => {
        setUploadedImages(images => {
            const filtered = images.filter(img => img.id !== imageId);
            if (formData.primary_image_id === imageId) {
                setFormData({ ...formData, primary_image_id: filtered[0]?.id || null });
            }
            return filtered;
        });
    };

    // Tag seçim fonksiyonları - react-select için
    const handleTagChange = (selectedOptions) => {
        setSelectedTags(selectedOptions || []);
    };

    const handleCreateOption = (inputValue) => {
        const newTag = {
            value: `new-${Date.now()}`,
            label: inputValue.trim(),
            id: `new-${Date.now()}`,
            name: inputValue.trim(),
            slug: inputValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            isNew: true
        };
        setSelectedTags([...selectedTags, newTag]);
        return newTag;
    };

    // Timeline yönetimi
    const handleAddTimelineItem = () => {
        setFormData({
            ...formData,
            timeline: [...formData.timeline, { title: '', description: '', date: '', status: 'pending' }]
        });
    };

    const handleRemoveTimelineItem = (index) => {
        const newTimeline = [...formData.timeline];
        newTimeline.splice(index, 1);
        setFormData({ ...formData, timeline: newTimeline });
    };

    const handleTimelineChange = (index, field, value) => {
        const newTimeline = [...formData.timeline];
        newTimeline[index][field] = value;
        setFormData({ ...formData, timeline: newTimeline });
    };

    // react-select için options formatı
    const tagOptions = (availableTags || []).filter(tag => tag && tag.id && tag.name).map(tag => ({
        value: String(tag.id),
        label: tag.name,
        id: tag.id,
        name: tag.name,
        slug: tag.slug || tag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }));

    // Seçili tag'leri react-select formatına çevir
    const selectedTagOptions = (selectedTags || []).map(tag => ({
        value: String(tag.id || tag.value || ''),
        label: tag.name || tag.label || 'İsimsiz Etiket',
        id: tag.id || tag.value,
        name: tag.name || tag.label,
        slug: tag.slug
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title_tr || !formData.description_tr || !formData.category_id) {
            alert('Lütfen tüm zorunlu alanları doldurun (Türkçe, Kategori)');
            return;
        }

        if (formData.completion_status === 'completed' && !formData.price) {
            alert('Tamamlanmış projeler için Fiyat zorunludur');
            return;
        }

        if (formData.completion_status === 'in_progress' && !formData.donation_target) {
            alert('Geliştirilmekte olan projeler için Bağış Hedefi zorunludur');
            return;
        }

        if (!formData.primary_image_id && uploadedImages.length > 0) {
            alert('Lütfen bir vitrin resmi seçin');
            return;
        }

        try {
            setLoading(true);

            // FormData oluştur
            const submitData = new FormData();

            // Çok dilli içerik
            submitData.append('title_tr', formData.title_tr);
            submitData.append('short_description_tr', formData.short_description_tr);
            submitData.append('description_tr', formData.description_tr);
            submitData.append('title_en', formData.title_en);
            submitData.append('short_description_en', formData.short_description_en);
            submitData.append('description_en', formData.description_en);
            submitData.append('title_de', formData.title_de);
            submitData.append('short_description_de', formData.short_description_de);
            submitData.append('description_de', formData.description_de);

            // Ortak alanlar
            submitData.append('category_id', formData.category_id);
            submitData.append('discount_price', formData.discount_price || '');
            submitData.append('currency', formData.currency);
            // Tags'ı array olarak gönder
            const tagsArray = selectedTags.map(t => t.name || t.label);
            submitData.append('tags', tagsArray.join(','));
            // Status otomatik 'pending' olacak (backend'de)
            submitData.append('demo_url', formData.demo_url || '');
            submitData.append('admin_demo_url', formData.admin_demo_url || '');
            submitData.append('demo_username', formData.demo_username || '');
            submitData.append('demo_password', formData.demo_password || '');
            submitData.append('admin_username', formData.admin_username || '');
            submitData.append('admin_password', formData.admin_password || '');
            submitData.append('video_url', formData.video_url || '');
            submitData.append('license_type', formData.license_type || '');
            submitData.append('requirements', formData.requirements || '');
            submitData.append('version', formData.version || '1.0.0');
            submitData.append('primary_image_id', formData.primary_image_id || '');

            // Yeni alanlar
            submitData.append('completion_status', formData.completion_status);
            submitData.append('completion_percentage', formData.completion_status === 'completed' ? 100 : formData.completion_percentage);
            submitData.append('source_url', formData.source_url || '');

            // Price ve donation logic - SADECE BİR KEZ EKLEME
            if (formData.completion_status === 'in_progress') {
                submitData.append('price', 0); // Geliştirme aşamasında fiyat 0
                submitData.append('donation_target', formData.donation_target || '');
                submitData.append('deadline', formData.deadline || '');
            } else {
                submitData.append('price', formData.price || 0); // Tamamlanmış projede gerçek fiyat
                submitData.append('donation_target', '');
            }

            if (formData.completion_status === 'in_progress' && formData.timeline.length > 0) {
                submitData.append('timeline', JSON.stringify(formData.timeline));
            } else {
                submitData.append('timeline', JSON.stringify([]));
            }

            if (isAdminMode) {
                submitData.append('status', formData.status || 'approved');
            }

            // Resimleri ekle
            uploadedImages.forEach((img, index) => {
                submitData.append('gallery_images', img.file);
                if (img.isPrimary) {
                    submitData.append('primary_image', img.file);
                }
            });

            await sellerAPI.createProject(submitData);
            alert('Proje başarıyla oluşturuldu!');
            navigate(backToListPath);
        } catch (error) {
            alert(error.response?.data?.error || 'Proje oluşturulurken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentEditor = () => {
        switch (activeTab) {
            case 'tr': return editorTr;
            case 'en': return editorEn;
            case 'de': return editorDe;
            default: return editorTr;
        }
    };

    const getCurrentDescription = () => {
        switch (activeTab) {
            case 'tr': return formData.description_tr;
            case 'en': return formData.description_en;
            case 'de': return formData.description_de;
            default: return formData.description_tr;
        }
    };

    const tabs = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

    const currentEditor = getCurrentEditor();

    const formPage = (
            <div className="seller-add-project-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <h1>Yeni Proje Ekle</h1>
                            <p>
                                {isAdminMode
                                    ? 'Admin panelinden yeni proje oluşturun'
                                    : 'Çok dilli proje oluşturun ve satışa başlayın'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => navigate(backToListPath)}
                        >
                            <FiX /> İptal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="project-form">
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
                                    Proje Başlığı <span className="required">*</span>
                                    {activeTab === 'tr' && <span className="help-text">(Diğer diller otomatik çevrilecek)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={formData[`title_${activeTab}`]}
                                    onChange={(e) => setFormData({ ...formData, [`title_${activeTab}`]: e.target.value })}
                                    placeholder={activeTab === 'tr' ? 'Proje başlığını girin' : activeTab === 'en' ? 'Enter project title' : 'Projekttitel eingeben'}
                                    required={activeTab === 'tr'}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Kısa Açıklama
                                </label>
                                <input
                                    type="text"
                                    value={formData[`short_description_${activeTab}`]}
                                    onChange={(e) => setFormData({ ...formData, [`short_description_${activeTab}`]: e.target.value })}
                                    placeholder={activeTab === 'tr' ? 'Kısa bir açıklama yazın (max 200 karakter)' : activeTab === 'en' ? 'Write a short description (max 200 characters)' : 'Kurze Beschreibung schreiben (max. 200 Zeichen)'}
                                    maxLength={200}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Detaylı Açıklama <span className="required">*</span>
                                </label>
                                <div className="rich-editor-wrapper">
                                    {currentEditor && (
                                        <>
                                            <div className="editor-toolbar">
                                                <button
                                                    type="button"
                                                    onClick={() => currentEditor.chain().focus().toggleBold().run()}
                                                    className={currentEditor.isActive('bold') ? 'is-active' : ''}
                                                    title="Kalın"
                                                >
                                                    <strong>B</strong>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => currentEditor.chain().focus().toggleItalic().run()}
                                                    className={currentEditor.isActive('italic') ? 'is-active' : ''}
                                                    title="İtalik"
                                                >
                                                    <em>I</em>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => currentEditor.chain().focus().toggleUnderline().run()}
                                                    className={currentEditor.isActive('underline') ? 'is-active' : ''}
                                                    title="Altı Çizili"
                                                >
                                                    <u>U</u>
                                                </button>
                                                <div className="toolbar-divider"></div>
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
                                                <div className="toolbar-divider"></div>
                                                <button
                                                    type="button"
                                                    onClick={() => currentEditor.chain().focus().toggleBulletList().run()}
                                                    className={currentEditor.isActive('bulletList') ? 'is-active' : ''}
                                                    title="Madde İşareti"
                                                >
                                                    •
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => currentEditor.chain().focus().toggleOrderedList().run()}
                                                    className={currentEditor.isActive('orderedList') ? 'is-active' : ''}
                                                    title="Numaralı Liste"
                                                >
                                                    1.
                                                </button>
                                                <div className="toolbar-divider"></div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const url = window.prompt('Resim URL\'si girin:');
                                                        if (url) {
                                                            currentEditor.chain().focus().setImage({ src: url }).run();
                                                        }
                                                    }}
                                                    title="Resim Ekle"
                                                >
                                                    <FiImage />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const url = window.prompt('Link URL\'si girin:');
                                                        if (url) {
                                                            currentEditor.chain().focus().setLink({ href: url }).run();
                                                        }
                                                    }}
                                                    className={currentEditor.isActive('link') ? 'is-active' : ''}
                                                    title="Link Ekle"
                                                >
                                                    🔗
                                                </button>
                                                <div className="toolbar-divider"></div>
                                                <button
                                                    type="button"
                                                    onClick={() => currentEditor.chain().focus().undo().run()}
                                                    title="Geri Al"
                                                >
                                                    ↶
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => currentEditor.chain().focus().redo().run()}
                                                    title="Yinele"
                                                >
                                                    ↷
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
                            <h2>Ortak Bilgiler</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        Kategori <span className="required">*</span>
                                    </label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Kategori Seçin</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Etiketler (Teknolojiler)
                                    </label>
                                    <Select
                                        isMulti
                                        isSearchable
                                        isClearable
                                        options={tagOptions}
                                        value={selectedTagOptions}
                                        onChange={handleTagChange}
                                        onCreateOption={handleCreateOption}
                                        placeholder="Etiket seçin veya yeni ekleyin..."
                                        noOptionsMessage={() => "Etiket bulunamadı"}
                                        formatCreateLabel={(inputValue) => `"${inputValue}" ekle`}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '46px',
                                                borderColor: 'var(--border-color, #e0e0e0)',
                                                '&:hover': {
                                                    borderColor: 'var(--primary, #696cff)',
                                                },
                                            }),
                                            multiValue: (base) => ({
                                                ...base,
                                                backgroundColor: 'var(--primary, #696cff)',
                                                color: 'white',
                                            }),
                                            multiValueLabel: (base) => ({
                                                ...base,
                                                color: 'white',
                                            }),
                                            multiValueRemove: (base) => ({
                                                ...base,
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                    color: 'white',
                                                },
                                            }),
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h2>Proje Durumu ve Kaynaklar</h2>

                            <div className="form-group">
                                <label>Projenin Durumu</label>
                                <div className="radio-group project-status-radios">
                                    <label className={`radio-card ${formData.completion_status === 'completed' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="completion_status"
                                            value="completed"
                                            checked={formData.completion_status === 'completed'}
                                            onChange={() => setFormData({ ...formData, completion_status: 'completed', completion_percentage: 100 })}
                                        />
                                        <div className="radio-content">
                                            <FiCheck className="radio-icon" />
                                            <div>
                                                <strong>Tamamlanmış Proje</strong>
                                                <span>Proje bitti, direk satışa ve kullanıma hazır.</span>
                                            </div>
                                        </div>
                                    </label>

                                    <label className={`radio-card ${formData.completion_status === 'in_progress' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="completion_status"
                                            value="in_progress"
                                            checked={formData.completion_status === 'in_progress'}
                                            onChange={() => setFormData({ ...formData, completion_status: 'in_progress', completion_percentage: 50 })}
                                        />
                                        <div className="radio-content">
                                            <FiLoader className="radio-icon" />
                                            <div>
                                                <strong>Geliştirme Aşamasında</strong>
                                                <span>Proje henüz bitmedi, erken erişim olarak sunulacak.</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {formData.completion_status === 'completed' ? (
                                <div className="form-group slide-down">
                                    <label>Kaynak Kod / İndirme Linki <span className="required">*</span></label>
                                    <div className="input-with-icon">
                                        <FiGlobe className="input-icon" />
                                        <input
                                            type="url"
                                            value={formData.source_url}
                                            onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                                            placeholder="https://github.com/user/repo veya dosya indirme linki"
                                            required={formData.completion_status === 'completed'}
                                        />
                                    </div>
                                    <p className="help-text">Zip dosyasını yüklemeyi tercih ederseniz, şu an desteklenmemektedir (sadece link).</p>
                                </div>
                            ) : (
                                <div className="in-progress-section slide-down">
                                    <div className="form-group">
                                        <label>Tamamlanma Yüzdesi: %{formData.completion_percentage}</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="99"
                                            value={formData.completion_percentage}
                                            onChange={(e) => setFormData({ ...formData, completion_percentage: parseInt(e.target.value) })}
                                            className="range-slider"
                                        />
                                    </div>

                                    <div className="timeline-builder">
                                        <div className="timeline-header">
                                            <label>Geliştirme Planı (Timeline)</label>
                                            <button type="button" className="btn-small btn-outline" onClick={handleAddTimelineItem}>
                                                + Adım Ekle
                                            </button>
                                        </div>

                                        {formData.timeline.length === 0 && (
                                            <div className="empty-timeline">
                                                Henüz yol haritası eklenmedi. Geliştirmeleri ekleyerek güven verin.
                                            </div>
                                        )}

                                        <div className="timeline-list">
                                            {formData.timeline.map((item, index) => (
                                                <div key={index} className="timeline-item-editor">
                                                    <div className="timeline-inputs">
                                                        <input
                                                            type="text"
                                                            placeholder="Başlık (Örn: v1.1 Güncellemesi)"
                                                            value={item.title}
                                                            onChange={(e) => handleTimelineChange(index, 'title', e.target.value)}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Açıklama (Kısa detay)"
                                                            value={item.description}
                                                            onChange={(e) => handleTimelineChange(index, 'description', e.target.value)}
                                                        />
                                                        <select
                                                            value={item.status}
                                                            onChange={(e) => handleTimelineChange(index, 'status', e.target.value)}
                                                        >
                                                            <option value="pending">Beklemede</option>
                                                            <option value="in_progress">Yapılıyor</option>
                                                            <option value="completed">Tamamlandı</option>
                                                        </select>
                                                        <input
                                                            type="date"
                                                            value={item.date}
                                                            onChange={(e) => handleTimelineChange(index, 'date', e.target.value)}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn-remove-timeline"
                                                        onClick={() => handleRemoveTimelineItem(index)}
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-section">
                            <h2>{formData.completion_status === 'completed' ? 'Fiyatlandırma' : 'Bağış Hedefleri'}</h2>

                            <div className="form-row">
                                {formData.completion_status === 'completed' ? (
                                    <>
                                        <div className="form-group">
                                            <label>
                                                Fiyat <span className="required">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                placeholder="0.00"
                                                required={formData.completion_status === 'completed'}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                İndirimli Fiyat
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.discount_price}
                                                onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>
                                                Bağış Hedefi <span className="required">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.donation_target}
                                                onChange={(e) => setFormData({ ...formData, donation_target: e.target.value, price: 0 })}
                                                placeholder="Hedeflenen Bağış Tutarı"
                                                required={formData.completion_status === 'in_progress'}
                                            />
                                            <p className="help-text">Bu proje geliştirme aşamasında olduğu için satış fiyatı yerine bağış hedefi belirlenir.</p>
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                Bitiş Tarihi (Tahmini)
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.deadline}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label>
                                        Para Birimi
                                    </label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            {isAdminMode ? (
                                <div className="info-box info-box--admin">
                                    <h3>⚙️ Yayın ve Onay</h3>
                                    <p>Admin olarak projeyi kayıt anında onaylayabilir veya beklemede bırakabilirsiniz.</p>
                                    <div className="form-group" style={{ marginTop: '1rem' }}>
                                        <label htmlFor="project-status">Proje durumu</label>
                                        <select
                                            id="project-status"
                                            value={formData.status}
                                            onChange={(e) =>
                                                setFormData({ ...formData, status: e.target.value })
                                            }
                                        >
                                            <option value="pending">Beklemede</option>
                                            <option value="approved">Onaylandı</option>
                                            <option value="active">Aktif</option>
                                            <option value="rejected">Reddedildi</option>
                                            <option value="inactive">Pasif</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-box">
                                    <h3>📋 Proje Onay Süreci</h3>
                                    <p>
                                        Projeniz kaydedildikten sonra <strong>&quot;Beklemede&quot;</strong>{' '}
                                        durumuna alınacaktır. Admin tarafından onaylandıktan sonra
                                        yayınlanacaktır.
                                    </p>
                                    <p className="info-note">
                                        <strong>Not:</strong> Tamamlanma yüzdesi, bağış hedefi, indirme
                                        limiti ve öne çıkan proje ayarları admin panelinden yönetilir.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="form-section">
                            <h2>Demo ve Video</h2>

                            <div className="form-group">
                                <label>
                                    Demo URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.demo_url}
                                    onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                                    placeholder="https://demo.example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Admin Demo URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.admin_demo_url}
                                    onChange={(e) => setFormData({ ...formData, admin_demo_url: e.target.value })}
                                    placeholder="https://admin-demo.example.com"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        Demo Kullanıcı Adı
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.demo_username}
                                        onChange={(e) => setFormData({ ...formData, demo_username: e.target.value })}
                                        placeholder="demo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Demo Şifre
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.demo_password}
                                        onChange={(e) => setFormData({ ...formData, demo_password: e.target.value })}
                                        placeholder="demo123"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        Admin Kullanıcı Adı
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.admin_username}
                                        onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
                                        placeholder="admin"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Admin Şifre
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.admin_password}
                                        onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                        placeholder="admin123"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>
                                    Video URL (YouTube, Vimeo vb.)
                                </label>
                                <input
                                    type="url"
                                    value={formData.video_url}
                                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h2>Teknik Bilgiler</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        Lisans Türü
                                    </label>
                                    <select
                                        value={formData.license_type}
                                        onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                                    >
                                        <option value="">Lisans Seçin</option>
                                        <option value="standard">Standart Lisans</option>
                                        <option value="extended">Genişletilmiş Lisans</option>
                                        <option value="gpl">GPL</option>
                                        <option value="mit">MIT</option>
                                        <option value="apache">Apache</option>
                                        <option value="custom">Özel Lisans</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Versiyon
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                        placeholder="1.0.0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>
                                    Gereksinimler
                                </label>
                                <textarea
                                    rows="4"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    placeholder="PHP 7.4+, MySQL 5.7+, Apache/Nginx..."
                                />
                                <small className="help-text">Projenin çalışması için gerekli sistem gereksinimleri</small>
                            </div>
                        </div>

                        {/* Çoklu Resim Yükleme */}
                        <div className="form-section">
                            <h2>Görseller</h2>

                            <div className="image-upload-area">
                                <input
                                    type="file"
                                    id="image-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="image-upload" className="upload-label">
                                    <FiUpload />
                                    <span>Görselleri Yükle (Çoklu Seçim)</span>
                                </label>

                                {uploadedImages.length > 0 && (
                                    <div className="uploaded-images-grid">
                                        {uploadedImages.map((img) => (
                                            <div key={img.id} className={`image-preview ${img.isPrimary ? 'primary' : ''}`}>
                                                {img.isPrimary && (
                                                    <div className="primary-badge">
                                                        <FiStar /> Vitrin
                                                    </div>
                                                )}
                                                <img src={img.preview} alt="Preview" />
                                                <div className="image-actions">
                                                    <button
                                                        type="button"
                                                        className={`btn-set-primary ${img.isPrimary ? 'active' : ''}`}
                                                        onClick={() => handleSetPrimaryImage(img.id)}
                                                        title={img.isPrimary ? "Vitrin Resmi (Seçili)" : "Vitrin Resmi Yap"}
                                                        disabled={img.isPrimary}
                                                    >
                                                        {img.isPrimary ? <FiCheck /> : <FiStar />}
                                                        <span className="btn-tooltip">
                                                            {img.isPrimary ? "Vitrin Resmi" : "Vitrin Yap"}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-remove-image"
                                                        onClick={() => handleRemoveImage(img.id)}
                                                        title="Kaldır"
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {uploadedImages.length === 0 && (
                                    <p className="upload-hint">
                                        📸 Çoklu resim yükleyebilirsiniz. Yükledikten sonra bir tanesini vitrin resmi olarak seçin.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate(backToListPath)}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                <FiSave /> {loading ? 'Kaydediliyor...' : 'Projeyi Oluştur'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
    );

    if (isAdminMode) {
        return <AdminLayout>{formPage}</AdminLayout>;
    }

    return <SellerLayout>{formPage}</SellerLayout>;
};

export default SellerAddProject;
