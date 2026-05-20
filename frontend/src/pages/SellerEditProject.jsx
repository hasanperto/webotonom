import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { sellerAPI } from '../api/seller';
import { projectsAPI } from '../api/projects';
import { translateText } from '../api/i18n';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/api';
import SellerLayout from '../components/SellerLayout';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiX, FiUpload, FiImage, FiSave, FiPower, FiEye, FiEyeOff, FiRefreshCw, FiGlobe, FiLoader } from 'react-icons/fi';
import Select from 'react-select';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import './SellerAddProject.css';

const SellerEditProject = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { isAdmin } = useAuth();
    const isAdminMode = location.pathname.includes('/admin/projects/') || isAdmin;
    const [categories, setCategories] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState('tr');
    const [project, setProject] = useState(null);
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
        status: 'pending',
        is_active: true,
        // Demo ve video
        demo_url: '',
        admin_demo_url: '',
        demo_username: '',
        demo_password: '',
        admin_username: '',
        admin_password: '',
        video_url: '',
        // Teknik bilgiler
        license_type: '',
        requirements: '',
        version: '1.0.0',
        // Proje durumu
        completion_status: 'completed',
        completion_percentage: 100,
        donation_target: '',
        deadline: '',
        source_url: ''
    });
    const [images, setImages] = useState([]); // Yeni yüklenen resimler (File objeleri)
    const [existingImages, setExistingImages] = useState([]); // Mevcut resimler (obje: {id, url, is_primary})
    const [deletedImageIds, setDeletedImageIds] = useState([]); // Silinen resim ID'leri
    const [primaryImageIndex, setPrimaryImageIndex] = useState(null); // Mevcut resimlerden vitrin resmi index'i
    const [primaryNewImageIndex, setPrimaryNewImageIndex] = useState(null); // Yeni resimlerden vitrin resmi index'i

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
        loadCategories();
        if (id) {
            loadProject();
        }
    }, [id]);

    // Editor içeriklerini güncelle
    useEffect(() => {
        if (editorTr && formData.description_tr) {
            const currentContent = editorTr.getHTML();
            if (currentContent !== formData.description_tr) {
                editorTr.commands.setContent(formData.description_tr);
            }
        }
    }, [formData.description_tr, editorTr]);

    useEffect(() => {
        if (editorEn && formData.description_en) {
            const currentContent = editorEn.getHTML();
            if (currentContent !== formData.description_en) {
                editorEn.commands.setContent(formData.description_en);
            }
        }
    }, [formData.description_en, editorEn]);

    useEffect(() => {
        if (editorDe && formData.description_de) {
            const currentContent = editorDe.getHTML();
            if (currentContent !== formData.description_de) {
                editorDe.commands.setContent(formData.description_de);
            }
        }
    }, [formData.description_de, editorDe]);

    const loadCategories = async () => {
        try {
            const response = await projectsAPI.getCategories();
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Categories load error:', error);
        }
    };

    const loadProject = async () => {
        try {
            setLoading(true);
            // Admin modunda admin API'sini kullan, seller modunda seller API'sini kullan
            const response = isAdminMode
                ? await api.get(`/admin/projects/${id}`)
                : await sellerAPI.getProject(id);
            const projectData = response.data.project || response.data;
            setProject(projectData);

            // Mevcut görselleri yükle (ID'leri ile birlikte)
            if (projectData.images && Array.isArray(projectData.images) && projectData.images.length > 0) {
                const imageObjects = projectData.images.map((img, index) => {
                    let imageUrl;
                    let imageId = img.id || null;
                    let isPrimary = img.is_primary === 1 || img.is_primary === true;

                    if (typeof img === 'string') {
                        imageUrl = getImageUrl(img);
                    } else if (img.image_path) {
                        // Backend'den gelen path'i işle
                        const rawPath = img.image_path;
                        imageUrl = getImageUrl(rawPath);
                        imageId = img.id || null;
                        isPrimary = img.is_primary === 1 || img.is_primary === true;

                        // Debug: Console'a yazdır
                        console.log(`🖼️ Görsel ${index + 1}:`, {
                            rawPath,
                            finalUrl: imageUrl,
                            id: imageId
                        });
                    } else {
                        imageUrl = img;
                    }

                    return {
                        id: imageId,
                        url: imageUrl,
                        is_primary: isPrimary,
                        raw_path: img.image_path || img // Debug için
                    };
                });
                setExistingImages(imageObjects);

                // Primary image index'ini bul
                const primaryIndex = imageObjects.findIndex(img => img.is_primary);
                if (primaryIndex !== -1) {
                    setPrimaryImageIndex(primaryIndex);
                }
            } else if (projectData.primary_image) {
                let primaryUrl;
                if (typeof projectData.primary_image === 'string') {
                    primaryUrl = getImageUrl(projectData.primary_image);
                } else {
                    primaryUrl = projectData.primary_image;
                }
                setExistingImages([{ id: null, url: primaryUrl, is_primary: true }]);
                setPrimaryImageIndex(0);
            }

            // Çok dilli içerikleri yükle
            const translations = projectData.translations || {};

            setFormData({
                // Türkçe (varsayılan veya translations'dan)
                title_tr: projectData.title || translations.tr?.title || '',
                short_description_tr: projectData.short_description || translations.tr?.short_description || '',
                description_tr: projectData.description || translations.tr?.description || '',
                // İngilizce
                title_en: translations.en?.title || '',
                short_description_en: translations.en?.short_description || '',
                description_en: translations.en?.description || '',
                // Almanca
                title_de: translations.de?.title || '',
                short_description_de: translations.de?.short_description || '',
                description_de: translations.de?.description || '',
                // Ortak alanlar
                category_id: projectData.category_id || projectData.category?.id || '',
                price: projectData.price || '',
                discount_price: projectData.discount_price || '',
                currency: projectData.currency || 'TRY',
                tags: [],
                status: projectData.status || 'pending',
                is_active: projectData.is_active !== undefined ? projectData.is_active : true,
                // Demo ve video
                demo_url: projectData.demo_url || '',
                admin_demo_url: projectData.admin_demo_url || '',
                demo_username: projectData.demo_username || '',
                demo_password: projectData.demo_password || '',
                admin_username: projectData.admin_username || '',
                admin_password: projectData.admin_password || '',
                video_url: projectData.video_url || '',
                // Teknik bilgiler
                license_type: projectData.license_type || '',
                requirements: projectData.requirements || '',
                version: projectData.version || '1.0.0',
                // Proje durumu (Tamamlanmış / Geliştirme Aşamasında)
                completion_status: projectData.completion_status || 'completed',
                completion_percentage: projectData.completion_percentage || 100,
                donation_target: projectData.donation_target || '',
                deadline: projectData.deadline ? projectData.deadline.split('T')[0] : '',
                source_url: projectData.source_url || ''
            });

            // Tags'ı array olarak yükle (react-select formatına çevir)
            if (projectData.tags) {
                const tagsArray = Array.isArray(projectData.tags)
                    ? projectData.tags.map(t => {
                        const tag = typeof t === 'string' ? { id: t, name: t } : t;
                        return {
                            value: tag.id?.toString() || tag.name,
                            label: tag.name,
                            id: tag.id || tag.name,
                            name: tag.name,
                            slug: tag.slug
                        };
                    })
                    : projectData.tags.split(',').map(t => {
                        const trimmed = t.trim();
                        return {
                            value: trimmed,
                            label: trimmed,
                            id: trimmed,
                            name: trimmed,
                            slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        };
                    }).filter(t => t.name);
                setSelectedTags(tagsArray);
            }
        } catch (error) {
            console.error('Project load error:', error);
            alert('Proje yüklenirken hata oluştu');
            navigate(isAdminMode ? '/admin/projects' : '/seller/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoTranslate = async () => {
        if (!formData.title_tr && !formData.short_description_tr && !formData.description_tr) {
            alert('Önce Türkçe içerik girin');
            return;
        }

        try {
            setTranslating(true);
            const errors = [];
            const updatedFormData = { ...formData };

            // Başlık çevirisi
            if (formData.title_tr) {
                try {
                    console.log('🔄 Başlık çevirisi başlatılıyor:', formData.title_tr);
                    const titleEn = await translateText(formData.title_tr, 'tr', 'en');
                    const titleDe = await translateText(formData.title_tr, 'tr', 'de');

                    if (titleEn?.translatedText) {
                        updatedFormData.title_en = titleEn.translatedText;
                        console.log('✅ İngilizce başlık çevrildi:', titleEn.translatedText);
                    } else {
                        errors.push('İngilizce başlık çevirisi başarısız');
                    }

                    if (titleDe?.translatedText) {
                        updatedFormData.title_de = titleDe.translatedText;
                        console.log('✅ Almanca başlık çevrildi:', titleDe.translatedText);
                    } else {
                        errors.push('Almanca başlık çevirisi başarısız');
                    }
                } catch (error) {
                    console.error('❌ Başlık çevirisi hatası:', error);
                    errors.push(`Başlık çevirisi: ${error.response?.data?.error || error.message || 'Bilinmeyen hata'}`);
                }
            }

            // Kısa açıklama çevirisi
            if (formData.short_description_tr) {
                try {
                    console.log('🔄 Kısa açıklama çevirisi başlatılıyor');
                    const shortDescEn = await translateText(formData.short_description_tr, 'tr', 'en');
                    const shortDescDe = await translateText(formData.short_description_tr, 'tr', 'de');

                    if (shortDescEn?.translatedText) {
                        updatedFormData.short_description_en = shortDescEn.translatedText;
                    } else {
                        errors.push('İngilizce kısa açıklama çevirisi başarısız');
                    }

                    if (shortDescDe?.translatedText) {
                        updatedFormData.short_description_de = shortDescDe.translatedText;
                    } else {
                        errors.push('Almanca kısa açıklama çevirisi başarısız');
                    }
                } catch (error) {
                    console.error('❌ Kısa açıklama çevirisi hatası:', error);
                    errors.push(`Kısa açıklama çevirisi: ${error.response?.data?.error || error.message || 'Bilinmeyen hata'}`);
                }
            }

            // Detaylı açıklama çevirisi
            if (formData.description_tr) {
                try {
                    console.log('🔄 Detaylı açıklama çevirisi başlatılıyor');
                    const descEn = await translateText(formData.description_tr, 'tr', 'en');
                    const descDe = await translateText(formData.description_tr, 'tr', 'de');

                    if (descEn?.translatedText) {
                        updatedFormData.description_en = descEn.translatedText;
                        // Editor içeriklerini güncelle
                        if (editorEn) editorEn.commands.setContent(descEn.translatedText);
                    } else {
                        errors.push('İngilizce açıklama çevirisi başarısız');
                    }

                    if (descDe?.translatedText) {
                        updatedFormData.description_de = descDe.translatedText;
                        // Editor içeriklerini güncelle
                        if (editorDe) editorDe.commands.setContent(descDe.translatedText);
                    } else {
                        errors.push('Almanca açıklama çevirisi başarısız');
                    }
                } catch (error) {
                    console.error('❌ Detaylı açıklama çevirisi hatası:', error);
                    errors.push(`Detaylı açıklama çevirisi: ${error.response?.data?.error || error.message || 'Bilinmeyen hata'}`);
                }
            }

            // FormData'yı güncelle
            setFormData(updatedFormData);

            // Sonuç mesajı
            if (errors.length > 0) {
                alert(`Çeviri tamamlandı ancak bazı hatalar oluştu:\n${errors.join('\n')}\n\nLütfen browser console'unu (F12) kontrol edin.`);
            } else {
                alert('✅ Çeviri başarıyla tamamlandı!');
            }
        } catch (error) {
            console.error('❌ Genel çeviri hatası:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Bilinmeyen hata';
            alert(`Çeviri sırasında hata oluştu:\n${errorMessage}\n\nLütfen browser console'unu (F12) kontrol edin.`);
        } finally {
            setTranslating(false);
        }
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

        if (!formData.title_tr || !formData.description_tr || !formData.category_id || !formData.price) {
            alert('Lütfen tüm zorunlu alanları doldurun (Türkçe)');
            return;
        }

        try {
            setSaving(true);

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
            submitData.append('price', formData.price);
            submitData.append('discount_price', formData.discount_price || '');
            submitData.append('currency', formData.currency);
            // Tags'ı array olarak gönder
            const tagsArray = selectedTags.map(t => t.name || t.label);
            submitData.append('tags', tagsArray.join(','));
            submitData.append('status', formData.status);
            submitData.append('is_active', formData.is_active ? '1' : '0');
            // Demo ve video
            submitData.append('demo_url', formData.demo_url || '');
            submitData.append('admin_demo_url', formData.admin_demo_url || '');
            submitData.append('demo_username', formData.demo_username || '');
            submitData.append('demo_password', formData.demo_password || '');
            submitData.append('admin_username', formData.admin_username || '');
            submitData.append('admin_password', formData.admin_password || '');
            submitData.append('video_url', formData.video_url || '');
            // Teknik bilgiler
            submitData.append('license_type', formData.license_type || '');
            submitData.append('requirements', formData.requirements || '');
            submitData.append('version', formData.version || '1.0.0');
            // Proje durumu
            submitData.append('completion_status', formData.completion_status || 'completed');
            submitData.append('completion_percentage', formData.completion_status === 'completed' ? 100 : formData.completion_percentage);
            submitData.append('source_url', formData.source_url || '');
            if (formData.completion_status === 'in_progress') {
                submitData.append('donation_target', formData.donation_target || '');
                submitData.append('deadline', formData.deadline || '');
            } else {
                submitData.append('donation_target', '');
                submitData.append('deadline', '');
            }

            // Yeni resimler varsa ekle
            // Eğer yeni resimlerden vitrin resmi seçildiyse, önce primary_image olarak ekle
            if (primaryNewImageIndex !== null && images[primaryNewImageIndex]) {
                submitData.append('primary_image', images[primaryNewImageIndex]);
            }

            // Diğer yeni resimleri gallery_images olarak ekle
            images.forEach((file, index) => {
                // Vitrin resmi zaten primary_image olarak eklendi, tekrar ekleme
                if (primaryNewImageIndex !== index) {
                    submitData.append('gallery_images', file);
                }
            });

            // Mevcut resimlerden vitrin resmi seçildiyse, backend'e bildir
            if (primaryImageIndex !== null && primaryNewImageIndex === null) {
                submitData.append('primary_image_index', primaryImageIndex.toString());
            }

            // Silinen resim ID'lerini gönder
            if (deletedImageIds.length > 0) {
                submitData.append('deleted_image_ids', deletedImageIds.join(','));
            }

            // Admin modunda admin API'sini kullan, seller modunda seller API'sini kullan
            if (isAdminMode) {
                await api.put(`/admin/projects/${id}`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await sellerAPI.updateProject(id, submitData);
            }
            alert('Proje başarıyla güncellendi!');
            navigate(isAdminMode ? '/admin/projects' : '/seller/projects');
        } catch (error) {
            alert(error.response?.data?.error || 'Proje güncellenirken hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async () => {
        if (!window.confirm(`Projeyi ${formData.is_active ? 'pasif' : 'aktif'} yapmak istediğinize emin misiniz?`)) {
            return;
        }

        try {
            const newActiveStatus = !formData.is_active;
            const submitData = new FormData();
            submitData.append('is_active', newActiveStatus ? '1' : '0');
            // Admin modunda admin API'sini kullan, seller modunda seller API'sini kullan
            if (isAdminMode) {
                await api.put(`/admin/projects/${id}`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await sellerAPI.updateProject(id, submitData);
            }
            setFormData({ ...formData, is_active: newActiveStatus });
            alert(`Proje başarıyla ${newActiveStatus ? 'aktif' : 'pasif'} yapıldı!`);
        } catch (error) {
            alert(error.response?.data?.error || 'Durum güncellenirken hata oluştu');
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

    const tabs = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

    const currentEditor = getCurrentEditor();

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        setImages([...images, ...files]);
        e.target.value = ''; // Reset input
    };

    const handleRemoveImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        // Eğer silinen resim vitrin resmiyse, ilk resmi vitrin yap
        if (primaryNewImageIndex === index) {
            setPrimaryNewImageIndex(newImages.length > 0 ? 0 : null);
        } else if (primaryNewImageIndex > index) {
            // Silinen resim vitrin resminden önceyse, index'i azalt
            setPrimaryNewImageIndex(primaryNewImageIndex - 1);
        }
    };

    const handleRemoveExistingImage = async (imageObj) => {
        if (!window.confirm('Bu görseli kaldırmak istediğinize emin misiniz?')) {
            return;
        }
        const index = existingImages.findIndex(img => img.url === imageObj.url || (img.id && img.id === imageObj.id));
        const newImages = existingImages.filter(img => img.url !== imageObj.url && (img.id !== imageObj.id || !img.id));
        setExistingImages(newImages);

        // Eğer silinen resmin ID'si varsa, silinenler listesine ekle
        if (imageObj.id) {
            setDeletedImageIds([...deletedImageIds, imageObj.id]);
        }

        // Eğer silinen resim vitrin resmiyse, ilk resmi vitrin yap
        if (primaryImageIndex === index) {
            setPrimaryImageIndex(newImages.length > 0 ? 0 : null);
        } else if (primaryImageIndex > index) {
            // Silinen resim vitrin resminden önceyse, index'i azalt
            setPrimaryImageIndex(primaryImageIndex - 1);
        }
    };

    // Mevcut resimlerden vitrin resmi seç
    const handleSetPrimaryExistingImage = (index) => {
        setPrimaryImageIndex(index);
    };

    // Yeni resimlerden vitrin resmi seç
    const handleSetPrimaryNewImage = (index) => {
        setPrimaryNewImageIndex(index);
    };

    const Layout = isAdminMode ? AdminLayout : SellerLayout;
    const backToListPath = isAdminMode ? '/admin/projects' : '/seller/projects';

    if (loading) {
        return (
            <Layout>
                <div className="seller-add-project-page">
                    <div className="dashboard-content-wrapper">
                        <div className="loading-fullscreen">
                            <div className="spinner-large"></div>
                            <p>Proje yükleniyor...</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!project) {
        return (
            <Layout>
                <div className="seller-add-project-page">
                    <div className="dashboard-content-wrapper">
                        <div className="error-message">
                            <h2>Proje bulunamadı</h2>
                            <button onClick={() => navigate(backToListPath)} className="btn btn-primary">
                                Projelere Dön
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="seller-add-project-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="header-content">
                            <h1>Proje Düzenle</h1>
                            <p>{project.title} projesini düzenleyin</p>
                        </div>
                        <div className="header-actions">
                            <button
                                className={`btn ${formData.is_active ? 'btn-success' : 'btn-outline'}`}
                                onClick={handleToggleActive}
                                title={formData.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                            >
                                {formData.is_active ? <FiEye /> : <FiEyeOff />}
                                {formData.is_active ? 'Aktif' : 'Pasif'}
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => navigate(backToListPath)}
                            >
                                <FiX /> İptal
                            </button>
                        </div>
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
                                    placeholder={activeTab === 'tr' ? 'Kısa açıklama (görünür sayfada gösterilir)' : activeTab === 'en' ? 'Short description (shown on visible page)' : 'Kurze Beschreibung (auf sichtbarer Seite angezeigt)'}
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
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Durum
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="pending">Beklemede</option>
                                        <option value="approved">Onaylandı</option>
                                        <option value="rejected">Reddedildi</option>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Pasif</option>
                                    </select>
                                </div>
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

                        {/* Proje Durumu Bölümü - Admin için görünür */}
                        {isAdminMode && (
                            <div className="form-section">
                                <h2>Proje Durumu</h2>

                                <div className="form-group">
                                    <label>Tamamlanma Durumu</label>
                                    <div className="radio-group project-status-radios" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '1rem',
                                            border: formData.completion_status === 'completed' ? '2px solid var(--primary, #696cff)' : '1px solid var(--border-color, #e0e0e0)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: formData.completion_status === 'completed' ? 'rgba(105, 108, 255, 0.1)' : 'transparent'
                                        }}>
                                            <input
                                                type="radio"
                                                name="completion_status"
                                                value="completed"
                                                checked={formData.completion_status === 'completed'}
                                                onChange={() => setFormData({ ...formData, completion_status: 'completed', completion_percentage: 100 })}
                                            />
                                            <div>
                                                <strong>✅ Tamamlanmış Proje</strong>
                                                <br />
                                                <small style={{ color: 'var(--text-muted)' }}>Proje bitti, satışa hazır</small>
                                            </div>
                                        </label>

                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '1rem',
                                            border: formData.completion_status === 'in_progress' ? '2px solid var(--warning, #ff9f43)' : '1px solid var(--border-color, #e0e0e0)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: formData.completion_status === 'in_progress' ? 'rgba(255, 159, 67, 0.1)' : 'transparent'
                                        }}>
                                            <input
                                                type="radio"
                                                name="completion_status"
                                                value="in_progress"
                                                checked={formData.completion_status === 'in_progress'}
                                                onChange={() => setFormData({ ...formData, completion_status: 'in_progress', completion_percentage: 50 })}
                                            />
                                            <div>
                                                <strong>🔄 Geliştirme Aşamasında</strong>
                                                <br />
                                                <small style={{ color: 'var(--text-muted)' }}>Erken erişim olarak sunuluyor</small>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {formData.completion_status === 'in_progress' && (
                                    <>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Tamamlanma Yüzdesi: <strong>{formData.completion_percentage}%</strong></label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="99"
                                                    value={formData.completion_percentage}
                                                    onChange={(e) => setFormData({ ...formData, completion_percentage: parseInt(e.target.value) })}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Bağış Hedefi (₺)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={formData.donation_target}
                                                    onChange={(e) => setFormData({ ...formData, donation_target: e.target.value })}
                                                    placeholder="Örn: 5000"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Tahmini Bitiş Tarihi</label>
                                                <input
                                                    type="date"
                                                    value={formData.deadline}
                                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Kaynak Kod URL</label>
                                                <input
                                                    type="url"
                                                    value={formData.source_url}
                                                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                                                    placeholder="GitHub veya kaynak kod linki"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {formData.completion_status === 'completed' && (
                                    <div className="form-group">
                                        <label>Kaynak Kod / İndirme Linki</label>
                                        <input
                                            type="url"
                                            value={formData.source_url}
                                            onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                                            placeholder="GitHub veya indirme linki"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-section">
                            <h2>Fiyatlandırma</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        Fiyat (₺) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        required
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

                        <div className="form-section">
                            <h2>Görseller</h2>

                            {/* Mevcut Görseller */}
                            {existingImages.length > 0 && (
                                <div className="existing-images">
                                    <h3>Mevcut Görseller</h3>
                                    <p className="form-hint">Vitrin resmi seçmek için resme tıklayın</p>
                                    <div className="images-grid">
                                        {existingImages.map((img, index) => (
                                            <div
                                                key={img.id || index}
                                                className={`image-preview existing ${primaryImageIndex === index ? 'primary' : ''}`}
                                                onClick={() => handleSetPrimaryExistingImage(index)}
                                            >
                                                <img
                                                    src={img.url || img}
                                                    alt={`Görsel ${index + 1}`}
                                                    onError={(e) => {
                                                        console.error('Görsel yüklenemedi:', img.url || img);
                                                        e.target.src = '/img/default.svg';
                                                    }}
                                                    loading="lazy"
                                                />
                                                {primaryImageIndex === index && (
                                                    <div className="primary-badge">
                                                        <FiImage /> Vitrin Resmi
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveExistingImage(img);
                                                    }}
                                                >
                                                    <FiX />
                                                </button>
                                                {primaryImageIndex !== index && (
                                                    <button
                                                        type="button"
                                                        className="set-primary-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetPrimaryExistingImage(index);
                                                        }}
                                                        title="Vitrin Resmi Yap"
                                                    >
                                                        <FiImage /> Vitrin
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Yeni Görsel Yükleme */}
                            <div className="image-upload-area">
                                <input
                                    type="file"
                                    id="image-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="image-upload" className="upload-button">
                                    <FiUpload /> Görsel Yükle
                                </label>
                                <p className="upload-hint">PNG, JPG veya GIF formatında görseller yükleyebilirsiniz</p>
                            </div>

                            {/* Yüklenen Yeni Görseller */}
                            {images.length > 0 && (
                                <div className="new-images">
                                    <h3>Yeni Görseller</h3>
                                    <p className="form-hint">Vitrin resmi seçmek için resme tıklayın</p>
                                    <div className="images-grid">
                                        {images.map((file, index) => (
                                            <div
                                                key={index}
                                                className={`image-preview ${primaryNewImageIndex === index ? 'primary' : ''}`}
                                                onClick={() => handleSetPrimaryNewImage(index)}
                                            >
                                                <img src={URL.createObjectURL(file)} alt={`Yeni görsel ${index + 1}`} />
                                                {primaryNewImageIndex === index && (
                                                    <div className="primary-badge">
                                                        <FiImage /> Vitrin Resmi
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveImage(index);
                                                    }}
                                                >
                                                    <FiX />
                                                </button>
                                                {primaryNewImageIndex !== index && (
                                                    <button
                                                        type="button"
                                                        className="set-primary-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetPrimaryNewImage(index);
                                                        }}
                                                        title="Vitrin Resmi Yap"
                                                    >
                                                        <FiImage /> Vitrin
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => navigate(backToListPath)}
                            >
                                <FiX /> İptal
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <FiRefreshCw className="spinning" /> Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <FiSave /> Değişiklikleri Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default SellerEditProject;

