import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { 
    FiChevronLeft, FiSave, FiRefreshCw, FiPackage, FiCheck,
    FiX, FiSearch, FiFilter, FiGrid, FiList
} from 'react-icons/fi';
import { 
    getProjectsSectionSettings, updateProjectsSectionSettings,
    getProjectsCategories, getProjectsList
} from '../api/sections';
import './AdminProjectsSection.css';

const AdminProjectsSection = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        display_count: 6,
        display_type: 'featured',
        category_ids: [],
        selected_project_ids: [],
        sort_by: 'latest',
        show_filters: true,
        show_view_all: true
    });
    const [categories, setCategories] = useState([]);
    const [projects, setProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterFeatured, setFilterFeatured] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (settings.display_type === 'selected') {
            loadProjects();
        }
    }, [searchTerm, filterCategory, filterFeatured]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [settingsData, categoriesData] = await Promise.all([
                getProjectsSectionSettings(),
                getProjectsCategories()
            ]);
            
            if (settingsData) {
                setSettings({
                    display_count: settingsData.display_count || 6,
                    display_type: settingsData.display_type || 'featured',
                    category_ids: settingsData.category_ids || [],
                    selected_project_ids: settingsData.selected_project_ids || [],
                    sort_by: settingsData.sort_by || 'latest',
                    show_filters: settingsData.show_filters === 1,
                    show_view_all: settingsData.show_view_all === 1
                });
            }
            
            setCategories(categoriesData);
            
            if (settingsData?.display_type === 'selected') {
                await loadProjects();
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProjects = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (filterCategory) params.category_id = filterCategory;
            if (filterFeatured) params.featured = 'true';
            
            const projectsData = await getProjectsList(params);
            setProjects(projectsData);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateProjectsSectionSettings(settings);
            alert('Ayarlar başarıyla kaydedildi');
            navigate('/admin/sections');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Ayarlar kaydedilirken hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleCategoryToggle = (categoryId) => {
        const categoryIds = settings.category_ids || [];
        if (categoryIds.includes(categoryId)) {
            setSettings({
                ...settings,
                category_ids: categoryIds.filter(id => id !== categoryId)
            });
        } else {
            setSettings({
                ...settings,
                category_ids: [...categoryIds, categoryId]
            });
        }
    };

    const handleProjectToggle = (projectId) => {
        const projectIds = settings.selected_project_ids || [];
        if (projectIds.includes(projectId)) {
            setSettings({
                ...settings,
                selected_project_ids: projectIds.filter(id => id !== projectId)
            });
        } else {
            setSettings({
                ...settings,
                selected_project_ids: [...projectIds, projectId]
            });
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-projects-section-page">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const selectedProjects = projects.filter(p => 
        settings.selected_project_ids?.includes(p.id)
    );

    return (
        <AdminLayout>
            <div className="admin-projects-section-page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <button className="btn-back" onClick={() => navigate('/admin/sections')}>
                            <FiChevronLeft /> Bölümlere Dön
                        </button>
                        <h1>Projeler Bölümü Yönetimi</h1>
                        <p>Ana sayfa projeler bölümünün gösterim ayarlarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadData}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-save" onClick={handleSave} disabled={saving}>
                            <FiSave /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="settings-container">
                    <div className="settings-grid">
                        {/* Display Count */}
                        <div className="setting-card">
                            <label className="setting-label">
                                <FiGrid /> Gösterilecek Proje Sayısı
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="24"
                                value={settings.display_count}
                                onChange={(e) => setSettings({ ...settings, display_count: parseInt(e.target.value) || 6 })}
                                className="setting-input"
                            />
                            <p className="setting-hint">Ana sayfada kaç proje gösterileceğini belirleyin (1-24)</p>
                        </div>

                        {/* Display Type */}
                        <div className="setting-card">
                            <label className="setting-label">
                                <FiFilter /> Gösterim Tipi
                            </label>
                            <select
                                value={settings.display_type}
                                onChange={(e) => setSettings({ ...settings, display_type: e.target.value })}
                                className="setting-select"
                            >
                                <option value="featured">Öne Çıkan Projeler</option>
                                <option value="selected">Manuel Seçim</option>
                                <option value="category">Kategori Bazlı</option>
                                <option value="all">Tüm Projeler</option>
                            </select>
                            <p className="setting-hint">Projelerin nasıl seçileceğini belirleyin</p>
                        </div>

                        {/* Sort By */}
                        <div className="setting-card">
                            <label className="setting-label">
                                <FiList /> Sıralama
                            </label>
                            <select
                                value={settings.sort_by}
                                onChange={(e) => setSettings({ ...settings, sort_by: e.target.value })}
                                className="setting-select"
                            >
                                <option value="latest">En Yeni</option>
                                <option value="popular">En Popüler</option>
                                <option value="price_asc">Fiyat (Düşük-Yüksek)</option>
                                <option value="price_desc">Fiyat (Yüksek-Düşük)</option>
                                <option value="rating">En Yüksek Puan</option>
                            </select>
                            <p className="setting-hint">Projelerin sıralama kriteri</p>
                        </div>
                    </div>

                    {/* Category Selection (if display_type is category) */}
                    {settings.display_type === 'category' && (
                        <div className="setting-section">
                            <h3>Kategori Seçimi</h3>
                            <p className="section-description">Gösterilecek kategorileri seçin</p>
                            <div className="categories-grid">
                                {categories.map(category => (
                                    <div
                                        key={category.id}
                                        className={`category-chip ${settings.category_ids?.includes(category.id) ? 'selected' : ''}`}
                                        onClick={() => handleCategoryToggle(category.id)}
                                    >
                                        {settings.category_ids?.includes(category.id) ? (
                                            <FiCheck className="check-icon" />
                                        ) : null}
                                        <span>{category.name}</span>
                                    </div>
                                ))}
                            </div>
                            {categories.length === 0 && (
                                <p className="empty-message">Henüz kategori eklenmemiş</p>
                            )}
                        </div>
                    )}

                    {/* Project Selection (if display_type is selected) */}
                    {settings.display_type === 'selected' && (
                        <div className="setting-section">
                            <h3>Proje Seçimi</h3>
                            <p className="section-description">Gösterilecek projeleri manuel olarak seçin</p>
                            
                            {/* Search and Filters */}
                            <div className="project-filters">
                                <div className="search-box">
                                    <FiSearch />
                                    <input
                                        type="text"
                                        placeholder="Proje ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">Tüm Kategoriler</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <label className="filter-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={filterFeatured}
                                        onChange={(e) => setFilterFeatured(e.target.checked)}
                                    />
                                    Sadece Öne Çıkanlar
                                </label>
                            </div>

                            {/* Selected Projects Count */}
                            {selectedProjects.length > 0 && (
                                <div className="selected-count">
                                    <FiCheck /> {selectedProjects.length} proje seçildi
                                </div>
                            )}

                            {/* Projects List */}
                            <div className="projects-grid">
                                {projects.map(project => {
                                    const isSelected = settings.selected_project_ids?.includes(project.id);
                                    return (
                                        <div
                                            key={project.id}
                                            className={`project-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleProjectToggle(project.id)}
                                        >
                                            <div className="project-check">
                                                {isSelected ? (
                                                    <FiCheck className="check-icon" />
                                                ) : (
                                                    <div className="check-placeholder"></div>
                                                )}
                                            </div>
                                            <div className="project-info">
                                                <h4>{project.title}</h4>
                                                <div className="project-meta">
                                                    {project.category_name && (
                                                        <span className="project-category">{project.category_name}</span>
                                                    )}
                                                    {project.is_featured && (
                                                        <span className="project-featured">Öne Çıkan</span>
                                                    )}
                                                    <span className="project-price">₺{project.price || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {projects.length === 0 && (
                                <p className="empty-message">Proje bulunamadı</p>
                            )}
                        </div>
                    )}

                    {/* Additional Options */}
                    <div className="setting-section">
                        <h3>Ek Seçenekler</h3>
                        <div className="options-grid">
                            <label className="option-checkbox">
                                <input
                                    type="checkbox"
                                    checked={settings.show_filters}
                                    onChange={(e) => setSettings({ ...settings, show_filters: e.target.checked })}
                                />
                                <span>Filtre Butonlarını Göster</span>
                            </label>
                            <label className="option-checkbox">
                                <input
                                    type="checkbox"
                                    checked={settings.show_view_all}
                                    onChange={(e) => setSettings({ ...settings, show_view_all: e.target.checked })}
                                />
                                <span>"Tümünü Gör" Butonunu Göster</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminProjectsSection;

