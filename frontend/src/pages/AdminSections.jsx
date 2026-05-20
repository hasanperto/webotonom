import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { 
    FiEdit, FiTrash2, FiEye, FiEyeOff, FiSave, FiX,
    FiFileText, FiRefreshCw, FiCheckCircle, FiMove, FiImage, FiPackage, FiTrendingUp, FiHelpCircle, FiInfo, FiBook, FiMessageCircle, FiGlobe, FiLoader
} from 'react-icons/fi';
import { 
    getSections, updateSectionOrder, toggleSection, updateSection
} from '../api/sections';
import { translateText } from '../api/i18n';
import './AdminSections.css';

const AdminSections = () => {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({
        tr: {
            title: '',
            subtitle: '',
            description: ''
        },
        en: {
            title: '',
            subtitle: '',
            description: ''
        },
        de: {
            title: '',
            subtitle: '',
            description: ''
        }
    });
    const [activeTab, setActiveTab] = useState('tr');
    const [translating, setTranslating] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);

    useEffect(() => {
        loadSections();
    }, []);

    const loadSections = async () => {
        try {
            const data = await getSections();
            // Veritabanından gelen veriyi düzelt (isActive -> isActive)
            const formattedData = Array.isArray(data) ? data : (data.sections || []);
            setSections(formattedData.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch (error) {
            console.error('Error loading sections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await toggleSection(id, !currentStatus);
            setSections(sections.map(s => 
                s.id === id ? { ...s, isActive: !currentStatus } : s
            ));
        } catch (error) {
            console.error('Error toggling section:', error);
            alert('Bölüm durumu güncellenirken hata oluştu');
        }
    };

    // Drag & Drop Handlers
    const handleDragStart = (e, section) => {
        setDraggedItem(section);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target);
    };

    const handleDragOver = (e, section) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedItem && draggedItem.id !== section.id) {
            setDragOverItem(section.id);
        }
    };

    const handleDragLeave = () => {
        setDragOverItem(null);
    };

    const handleDrop = async (e, targetSection) => {
        e.preventDefault();
        setDragOverItem(null);
        
        if (!draggedItem || draggedItem.id === targetSection.id) {
            setDraggedItem(null);
            return;
        }

        const draggedIndex = sections.findIndex(s => s.id === draggedItem.id);
        const targetIndex = sections.findIndex(s => s.id === targetSection.id);

        const newSections = [...sections];
        const [removed] = newSections.splice(draggedIndex, 1);
        newSections.splice(targetIndex, 0, removed);

        // Order'ları güncelle
        const updatedSections = newSections.map((s, i) => ({ ...s, order: i + 1 }));

        try {
            await updateSectionOrder(updatedSections);
            setSections(updatedSections);
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Sıra güncellenirken hata oluştu');
            loadSections(); // Hata durumunda yeniden yükle
        } finally {
            setDraggedItem(null);
        }
    };

    const handleEdit = (section) => {
        setEditingId(section.id);
        setActiveTab('tr');
        setEditData({
            tr: {
                title: section.title || '',
                subtitle: section.subtitle || '',
                description: section.description || ''
            },
            en: {
                title: '',
                subtitle: '',
                description: ''
            },
            de: {
                title: '',
                subtitle: '',
                description: ''
            }
        });
    };

    const handleAutoTranslate = async () => {
        if (!editData.tr.title && !editData.tr.subtitle && !editData.tr.description) {
            alert('Önce Türkçe içeriği girin');
            return;
        }

        try {
            setTranslating(true);

            // Başlık çevirisi
            if (editData.tr.title) {
                const titleEn = await translateText(editData.tr.title, 'tr', 'en');
                const titleDe = await translateText(editData.tr.title, 'tr', 'de');
                setEditData(prev => ({
                    ...prev,
                    en: { ...prev.en, title: titleEn.translatedText || '' },
                    de: { ...prev.de, title: titleDe.translatedText || '' }
                }));
            }

            // Alt başlık çevirisi
            if (editData.tr.subtitle) {
                const subtitleEn = await translateText(editData.tr.subtitle, 'tr', 'en');
                const subtitleDe = await translateText(editData.tr.subtitle, 'tr', 'de');
                setEditData(prev => ({
                    ...prev,
                    en: { ...prev.en, subtitle: subtitleEn.translatedText || '' },
                    de: { ...prev.de, subtitle: subtitleDe.translatedText || '' }
                }));
            }

            // Açıklama çevirisi
            if (editData.tr.description) {
                const descEn = await translateText(editData.tr.description, 'tr', 'en');
                const descDe = await translateText(editData.tr.description, 'tr', 'de');
                setEditData(prev => ({
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

    const handleSave = async (id) => {
        try {
            // Türkçe veriyi ana veri olarak gönder
            const saveData = {
                title: editData.tr.title,
                subtitle: editData.tr.subtitle || null,
                description: editData.tr.description || null,
                translations: JSON.stringify({
                    en: editData.en,
                    de: editData.de
                })
            };
            
            await updateSection(id, saveData);
            setSections(sections.map(s => 
                s.id === id ? { ...s, title: saveData.title, subtitle: saveData.subtitle, description: saveData.description } : s
            ));
            setEditingId(null);
            setEditData({
                tr: { title: '', subtitle: '', description: '' },
                en: { title: '', subtitle: '', description: '' },
                de: { title: '', subtitle: '', description: '' }
            });
            setActiveTab('tr');
        } catch (error) {
            console.error('Error updating section:', error);
            alert('Bölüm güncellenirken hata oluştu');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData({
            tr: { title: '', subtitle: '', description: '' },
            en: { title: '', subtitle: '', description: '' },
            de: { title: '', subtitle: '', description: '' }
        });
        setActiveTab('tr');
    };


    const stats = {
        total: sections.length,
        active: sections.filter(s => s.isActive).length,
        inactive: sections.filter(s => !s.isActive).length
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('tr-TR').format(num || 0);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-sections-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-sections-page">
                {/* Header */}
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Bölüm Yönetimi</h1>
                        <p className="page-subtitle-advanced">Ana sayfa bölümlerini sürükle-bırak ile düzenle</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSections}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="admin-stats-grid-advanced">
                    <div className="stat-card-advanced sections-card">
                        <div className="stat-icon-wrapper sections">
                            <FiFileText className="stat-icon" />
                            <div className="stat-icon-bg"></div>
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Toplam Bölüm</span>
                            <span className="stat-value-advanced">{formatNumber(stats.total)}</span>
                            <div className="stat-footer">
                                <span className="stat-change positive">
                                    <FiCheckCircle /> {formatNumber(stats.active)} aktif
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card-advanced active-card">
                        <div className="stat-icon-wrapper active">
                            <FiCheckCircle className="stat-icon" />
                            <div className="stat-icon-bg"></div>
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Aktif Bölüm</span>
                            <span className="stat-value-advanced">{formatNumber(stats.active)}</span>
                            <div className="stat-footer">
                                <span className="stat-change positive">
                                    %{Math.round((stats.active / (stats.total || 1)) * 100)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card-advanced inactive-card">
                        <div className="stat-icon-wrapper inactive">
                            <FiEyeOff className="stat-icon" />
                            <div className="stat-icon-bg"></div>
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Pasif Bölüm</span>
                            <span className="stat-value-advanced">{formatNumber(stats.inactive)}</span>
                            <div className="stat-footer">
                                <span className="stat-change">
                                    Gizli
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections List - Drag & Drop */}
                <div className="sections-list-advanced">
                    {sections.length === 0 ? (
                        <div className="empty-state-advanced">
                            <FiFileText className="empty-icon" />
                            <h3>Bölüm bulunamadı</h3>
                            <p>Henüz hiç bölüm eklenmemiş.</p>
                        </div>
                    ) : (
                        sections.map((section) => {
                            const isDragged = draggedItem && draggedItem.id === section.id;
                            const isDragOver = dragOverItem === section.id;
                            
                            return (
                                <div 
                                    key={section.id} 
                                    className={`section-card-minimal ${!section.isActive ? 'inactive' : ''} ${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, section)}
                                    onDragOver={(e) => handleDragOver(e, section)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, section)}
                                >
                                    <div className="section-drag-handle">
                                        <FiMove />
                                    </div>

                                    <div className="section-order-badge">
                                        {section.order || 0}
                                    </div>

                                    <div className="section-icon-minimal">
                                        <FiFileText />
                                        <div className={`section-status-dot ${section.isActive ? 'active' : 'inactive'}`}></div>
                                    </div>

                                    <div className="section-content-minimal">
                                        {editingId === section.id ? (
                                            <div className="section-edit-form-minimal">
                                                {/* Dil Tabları */}
                                                <div className="section-language-tabs">
                                                    <button
                                                        type="button"
                                                        className={`section-lang-tab ${activeTab === 'tr' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('tr')}
                                                    >
                                                        <span className="flag">🇹🇷</span>
                                                        <span>Türkçe</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`section-lang-tab ${activeTab === 'en' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('en')}
                                                    >
                                                        <span className="flag">🇬🇧</span>
                                                        <span>English</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`section-lang-tab ${activeTab === 'de' ? 'active' : ''}`}
                                                        onClick={() => setActiveTab('de')}
                                                    >
                                                        <span className="flag">🇩🇪</span>
                                                        <span>Deutsch</span>
                                                    </button>
                                                    {activeTab === 'tr' && (
                                                        <button
                                                            type="button"
                                                            className="section-btn-translate"
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

                                                {/* Form Alanları */}
                                                <div className="section-form-fields">
                                                    <input
                                                        type="text"
                                                        value={editData[activeTab].title}
                                                        onChange={(e) => setEditData({
                                                            ...editData,
                                                            [activeTab]: { ...editData[activeTab], title: e.target.value }
                                                        })}
                                                        placeholder={activeTab === 'tr' ? 'Başlık' : activeTab === 'en' ? 'Title' : 'Titel'}
                                                        className="edit-input-minimal"
                                                        required={activeTab === 'tr'}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editData[activeTab].subtitle}
                                                        onChange={(e) => setEditData({
                                                            ...editData,
                                                            [activeTab]: { ...editData[activeTab], subtitle: e.target.value }
                                                        })}
                                                        placeholder={activeTab === 'tr' ? 'Alt Başlık' : activeTab === 'en' ? 'Subtitle' : 'Untertitel'}
                                                        className="edit-input-minimal"
                                                    />
                                                    <textarea
                                                        value={editData[activeTab].description}
                                                        onChange={(e) => setEditData({
                                                            ...editData,
                                                            [activeTab]: { ...editData[activeTab], description: e.target.value }
                                                        })}
                                                        placeholder={activeTab === 'tr' ? 'Açıklama' : activeTab === 'en' ? 'Description' : 'Beschreibung'}
                                                        className="edit-textarea-minimal"
                                                        rows="2"
                                                    />
                                                </div>

                                                <div className="edit-actions-minimal">
                                                    <button 
                                                        onClick={() => handleSave(section.id)}
                                                        className="btn-save-minimal"
                                                    >
                                                        <FiSave /> Kaydet
                                                    </button>
                                                    <button 
                                                        onClick={handleCancel}
                                                        className="btn-cancel-minimal"
                                                    >
                                                        <FiX /> İptal
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="section-info-minimal">
                                                    <h3 className="section-title-minimal">{section.title || section.key}</h3>
                                                    {section.subtitle && (
                                                        <p className="section-subtitle-minimal">{section.subtitle}</p>
                                                    )}
                                                    <span className="section-key-minimal">Key: {section.key}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="section-actions-minimal">
                                        {editingId !== section.id && (
                                            <>
                                                {section.key === 'hero' && (
                                                    <button
                                                        onClick={() => navigate('/admin/sections/hero/slides')}
                                                        className="btn-slider-manage"
                                                        title="Slider Yönetimi"
                                                    >
                                                        <FiImage />
                                                        <span>Slider</span>
                                                    </button>
                                                )}
                                                {section.key === 'projects' && (
                                                    <button
                                                        onClick={() => navigate('/admin/sections/projects/settings')}
                                                        className="btn-slider-manage"
                                                        title="Proje Gösterim Yönetimi"
                                                    >
                                                        <FiPackage />
                                                        <span>Projeler</span>
                                                    </button>
                                                )}
                                                {section.key === 'features' && (
                                                    <button
                                                        onClick={() => navigate('/admin/sections/features/items')}
                                                        className="btn-slider-manage"
                                                        title="Hizmet Yönetimi"
                                                    >
                                                        <FiPackage />
                                                        <span>Hizmetler</span>
                                                    </button>
                                                )}
                                                {section.key === 'stats' && (
                                                    <button
                                                        onClick={() => navigate('/admin/sections/stats/items')}
                                                        className="btn-slider-manage"
                                                        title="İstatistik Yönetimi"
                                                    >
                                                        <FiTrendingUp />
                                                        <span>İstatistikler</span>
                                                    </button>
                                                )}
                                                {section.key === 'faq' && (
                                                    <button
                                                        onClick={() => navigate('/admin/sections/faq/items')}
                                                        className="btn-slider-manage"
                                                        title="FAQ Yönetimi"
                                                    >
                                                        <FiHelpCircle />
                                                        <span>SSS</span>
                                                    </button>
                                                )}
                                                {section.key === 'about' && (
                                                    <button
                                                        onClick={() => navigate('/admin/sections/about/items')}
                                                        className="btn-slider-manage"
                                                        title="Hakkımızda Yönetimi"
                                                    >
                                                        <FiInfo />
                                                        <span>Hakkımızda</span>
                                                    </button>
                                                )}
                                                {section.key === 'blog' && (
                                                    <button
                                                        onClick={() => navigate('/admin/blog')}
                                                        className="btn-slider-manage"
                                                        title="Blog Yönetimi"
                                                    >
                                                        <FiBook />
                                                        <span>Blog</span>
                                                    </button>
                                                )}
                                                {section.key === 'testimonials' && (
                                                    <button
                                                        onClick={() => navigate('/admin/sections/testimonials/items')}
                                                        className="btn-slider-manage"
                                                        title="Testimonials Yönetimi"
                                                    >
                                                        <FiMessageCircle />
                                                        <span>Yorumlar</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(section)}
                                                    className="btn-action-minimal edit"
                                                    title="Düzenle"
                                                >
                                                    <FiEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleToggle(section.id, section.isActive)}
                                                    className={`btn-action-minimal toggle ${section.isActive ? 'active' : 'inactive'}`}
                                                    title={section.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                                                >
                                                    {section.isActive ? <FiEye /> : <FiEyeOff />}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="section-status-minimal">
                                        <span className={`status-badge-minimal ${section.isActive ? 'active' : 'inactive'}`}>
                                            {section.isActive ? (
                                                <>
                                                    <FiCheckCircle /> Aktif
                                                </>
                                            ) : (
                                                <>
                                                    <FiEyeOff /> Pasif
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminSections;
