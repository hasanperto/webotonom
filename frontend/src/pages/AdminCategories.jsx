import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiTag, FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiXCircle,
    FiSearch, FiRefreshCw, FiSave, FiX, FiLayers
} from 'react-icons/fi';
import './AdminCategories.css';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        parent_id: null,
        icon: '',
        sort_order: 0,
        status: 'active'
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/categories');
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Categories load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            parent_id: null,
            icon: '',
            sort_order: 0,
            status: 'active'
        });
        setShowAddModal(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            parent_id: category.parent_id || null,
            icon: category.icon || '',
            sort_order: category.sort_order || 0,
            status: category.status
        });
        setShowAddModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingCategory) {
                await api.put(`/admin/categories/${editingCategory.id}`, formData);
            } else {
                await api.post('/admin/categories', formData);
            }
            setShowAddModal(false);
            loadCategories();
        } catch (error) {
            console.error('Save category error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Kategori kaydedilemedi'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
        
        try {
            await api.delete(`/admin/categories/${id}`);
            loadCategories();
        } catch (error) {
            console.error('Delete category error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Kategori silinemedi'));
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getParentName = (parentId) => {
        if (!parentId) return null;
        const parent = categories.find(c => c.id === parentId);
        return parent ? parent.name : null;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-categories-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-categories-page">
                <div className="admin-header-minimal">
                    <div>
                        <h1 className="page-title-advanced">Kategori Yönetimi</h1>
                        <p className="page-subtitle-advanced">Proje kategorilerini yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadCategories}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-primary" onClick={handleAdd}>
                            <FiPlus /> Yeni Kategori
                        </button>
                    </div>
                </div>

                <div className="search-box-minimal">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Kategori ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="categories-grid">
                    {filteredCategories.map(category => (
                        <div key={category.id} className="category-card-minimal">
                            <div className="category-header">
                                <div className="category-info">
                                    {category.icon && (
                                        <div className="category-icon">
                                            <FiLayers />
                                        </div>
                                    )}
                                    <div>
                                        <h3>{category.name}</h3>
                                        {getParentName(category.parent_id) && (
                                            <span className="parent-category">
                                                Alt kategori: {getParentName(category.parent_id)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className={`badge badge-${category.status === 'active' ? 'success' : 'secondary'}`}>
                                    {category.status === 'active' ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                            {category.description && (
                                <div className="category-body">
                                    <p>{category.description}</p>
                                </div>
                            )}
                            <div className="category-footer">
                                <span>Sıra: {category.sort_order}</span>
                                <div className="category-actions">
                                    <button className="btn-icon" onClick={() => handleEdit(category)}>
                                        <FiEdit />
                                    </button>
                                    <button className="btn-icon btn-danger" onClick={() => handleDelete(category.id)}>
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCategories.length === 0 && (
                    <div className="empty-state-minimal">
                        <FiTag />
                        <p>Kategori bulunamadı</p>
                    </div>
                )}

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</h2>
                                <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Kategori Adı *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        placeholder="Web Uygulamaları"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="web-uygulamalari"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Açıklama</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        placeholder="Kategori açıklaması..."
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Üst Kategori</label>
                                        <select
                                            value={formData.parent_id || ''}
                                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                                        >
                                            <option value="">Yok</option>
                                            {categories.filter(c => !c.parent_id).map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Sıra</label>
                                        <input
                                            type="number"
                                            value={formData.sort_order}
                                            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
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
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                    İptal
                                </button>
                                <button className="btn-primary" onClick={handleSave}>
                                    <FiSave /> Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCategories;

