import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { getImageUrl } from '../utils/api';
import { 
    FiPlus, FiEdit, FiTrash2, FiMove, FiX,
    FiChevronLeft, FiUpload, FiImage, FiSave, FiRefreshCw,
    FiEye, FiEyeOff, FiLink, FiFileText
} from 'react-icons/fi';
import './AdminReferences.css';

const AdminReferences = () => {
    const navigate = useNavigate();
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        image: null,
        existing_image: null,
        link: '',
        status: 'active'
    });
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        loadReferences();
    }, []);

    const loadReferences = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/references');
            const loaded = response.data.references || [];
            setReferences(loaded.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        } catch (error) {
            console.error('Error loading references:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        setFormData({
            title: '',
            slug: '',
            description: '',
            image: null,
            existing_image: null,
            link: '',
            status: 'active'
        });
        setImagePreview(null);
        setShowModal(true);
    };

    const handleEdit = (ref) => {
        setEditingId(ref.id);
        setFormData({
            title: ref.title || '',
            slug: ref.slug || '',
            description: ref.description || '',
            image: null,
            existing_image: ref.image || null,
            link: ref.link || '',
            status: ref.status || 'active'
        });
        setImagePreview(ref.image ? getImageUrl(ref.image) : null);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu referansı silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await api.delete(`/admin/references/${id}`);
            await loadReferences();
        } catch (error) {
            console.error('Error deleting reference:', error);
            alert('Referans silinirken hata oluştu');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await api.put(`/admin/references/${id}`, { status: newStatus });
            setReferences(references.map(ref => 
                ref.id === id ? { ...ref, status: newStatus } : ref
            ));
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Durum güncellenirken hata oluştu');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('slug', formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('link', formData.link || '');
            formDataToSend.append('status', formData.status);
            
            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            if (editingId) {
                await api.put(`/admin/references/${editingId}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/references', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowModal(false);
            await loadReferences();
        } catch (error) {
            console.error('Error saving reference:', error);
            alert('Referans kaydedilirken hata oluştu: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Drag & Drop Handlers
    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, item) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedItem && draggedItem.id !== item.id) {
            setDragOverItem(item.id);
        }
    };

    const handleDragLeave = () => {
        setDragOverItem(null);
    };

    const handleDrop = async (e, targetItem) => {
        e.preventDefault();
        setDragOverItem(null);
        
        if (!draggedItem || draggedItem.id === targetItem.id) {
            setDraggedItem(null);
            return;
        }

        const draggedIndex = references.findIndex(r => r.id === draggedItem.id);
        const targetIndex = references.findIndex(r => r.id === targetItem.id);

        const newReferences = [...references];
        const [removed] = newReferences.splice(draggedIndex, 1);
        newReferences.splice(targetIndex, 0, removed);

        // Order'ları güncelle
        const updatedReferences = newReferences.map((ref, i) => ({ ...ref, sort_order: i + 1 }));

        try {
            await api.put('/admin/references/order', {
                references: updatedReferences.map((ref, idx) => ({
                    id: ref.id,
                    sort_order: idx + 1
                }))
            });
            setReferences(updatedReferences);
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Sıra güncellenirken hata oluştu');
            loadReferences();
        } finally {
            setDraggedItem(null);
        }
    };

    const stats = {
        total: references.length,
        active: references.filter(r => r.status === 'active').length,
        inactive: references.filter(r => r.status === 'inactive').length
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-references-page">
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
            <div className="admin-references-page">
                {/* Header */}
                <div className="admin-header-advanced">
                    <div>
                        <button 
                            onClick={() => navigate('/admin/sections')}
                            className="btn-back"
                        >
                            <FiChevronLeft /> Geri
                        </button>
                        <h1 className="page-title-advanced">Referans Yönetimi</h1>
                        <p className="page-subtitle-advanced">Referansları yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadReferences}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-primary" onClick={handleAdd}>
                            <FiPlus /> Yeni Referans
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="admin-stats-grid-advanced">
                    <div className="stat-card-advanced">
                        <div className="stat-icon-wrapper">
                            <FiLink className="stat-icon" />
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Toplam Referans</span>
                            <span className="stat-value-advanced">{stats.total}</span>
                        </div>
                    </div>
                    <div className="stat-card-advanced active-card">
                        <div className="stat-icon-wrapper active">
                            <FiEye className="stat-icon" />
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Aktif</span>
                            <span className="stat-value-advanced">{stats.active}</span>
                        </div>
                    </div>
                    <div className="stat-card-advanced inactive-card">
                        <div className="stat-icon-wrapper inactive">
                            <FiEyeOff className="stat-icon" />
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Pasif</span>
                            <span className="stat-value-advanced">{stats.inactive}</span>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="references-items-list">
                    {references.length === 0 ? (
                        <div className="empty-state-advanced">
                            <FiLink className="empty-icon" />
                            <h3>Henüz referans eklenmemiş</h3>
                            <p>Yeni referans eklemek için "Yeni Referans" butonuna tıklayın.</p>
                        </div>
                    ) : (
                        references.map((ref) => {
                            const isDragged = draggedItem && draggedItem.id === ref.id;
                            const isDragOver = dragOverItem === ref.id;
                            
                            return (
                                <div
                                    key={ref.id}
                                    className={`reference-item-card ${ref.status === 'inactive' ? 'inactive' : ''} ${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, ref)}
                                    onDragOver={(e) => handleDragOver(e, ref)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, ref)}
                                >
                                    <div className="item-drag-handle">
                                        <FiMove />
                                    </div>
                                    <div className="item-order">{ref.sort_order || 0}</div>
                                    {ref.image && (
                                        <div className="item-image">
                                            <img src={getImageUrl(ref.image)} alt={ref.title} />
                                        </div>
                                    )}
                                    <div className="item-content">
                                        <h3>{ref.title}</h3>
                                        {ref.slug && <p className="item-slug">/{ref.slug}</p>}
                                        {ref.description && <p>{ref.description.substring(0, 100)}...</p>}
                                        {ref.link && (
                                            <a href={ref.link} target="_blank" rel="noopener noreferrer" className="item-link">
                                                <FiLink /> {ref.link}
                                            </a>
                                        )}
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            onClick={() => handleToggleStatus(ref.id, ref.status)}
                                            className={`btn-status ${ref.status === 'active' ? 'active' : 'inactive'}`}
                                            title={ref.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                                        >
                                            {ref.status === 'active' ? <FiEye /> : <FiEyeOff />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(ref)}
                                            className="btn-edit"
                                            title="Düzenle"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ref.id)}
                                            className="btn-delete"
                                            title="Sil"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingId ? 'Referans Düzenle' : 'Yeni Referans Ekle'}</h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>Başlık *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            title: e.target.value,
                                            slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                        })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="referans-slug"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Açıklama</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Resim</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    {imagePreview && (
                                        <div className="image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Link</label>
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
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
                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                        İptal
                                    </button>
                                    <button type="submit" className="btn-save">
                                        <FiSave /> Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminReferences;
