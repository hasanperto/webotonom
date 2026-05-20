import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { getImageUrl } from '../utils/api';
import { 
    FiPlus, FiEdit, FiTrash2, FiMove, FiX,
    FiChevronLeft, FiUpload, FiImage, FiSave, FiRefreshCw,
    FiEye, FiEyeOff, FiStar
} from 'react-icons/fi';
import './AdminSponsors.css';

const AdminSponsors = () => {
    const navigate = useNavigate();
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        logo: null,
        existing_logo: null,
        link_url: '',
        description: '',
        status: 'active'
    });
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        loadSponsors();
    }, []);

    const loadSponsors = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/sponsors');
            const loaded = response.data.sponsors || [];
            setSponsors(loaded.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        } catch (error) {
            console.error('Error loading sponsors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        setFormData({
            name: '',
            logo: null,
            existing_logo: null,
            link_url: '',
            description: '',
            status: 'active'
        });
        setLogoPreview(null);
        setShowModal(true);
    };

    const handleEdit = (sponsor) => {
        setEditingId(sponsor.id);
        setFormData({
            name: sponsor.name || '',
            logo: null,
            existing_logo: sponsor.logo || null,
            link_url: sponsor.link_url || '',
            description: sponsor.description || '',
            status: sponsor.status || 'active'
        });
        setLogoPreview(sponsor.logo ? getImageUrl(sponsor.logo) : null);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu sponsoru silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await api.delete(`/admin/sponsors/${id}`);
            await loadSponsors();
        } catch (error) {
            console.error('Error deleting sponsor:', error);
            alert('Sponsor silinirken hata oluştu');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await api.put(`/admin/sponsors/${id}`, { status: newStatus });
            setSponsors(sponsors.map(sponsor => 
                sponsor.id === id ? { ...sponsor, status: newStatus } : sponsor
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
            formDataToSend.append('name', formData.name);
            formDataToSend.append('link_url', formData.link_url || '');
            formDataToSend.append('description', formData.description || '');
            formDataToSend.append('status', formData.status);
            
            if (formData.logo) {
                formDataToSend.append('logo', formData.logo);
            }

            if (editingId) {
                await api.put(`/admin/sponsors/${editingId}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/sponsors', formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowModal(false);
            await loadSponsors();
        } catch (error) {
            console.error('Error saving sponsor:', error);
            alert('Sponsor kaydedilirken hata oluştu: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, logo: file });
            setLogoPreview(URL.createObjectURL(file));
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

        const draggedIndex = sponsors.findIndex(s => s.id === draggedItem.id);
        const targetIndex = sponsors.findIndex(s => s.id === targetItem.id);

        const newSponsors = [...sponsors];
        const [removed] = newSponsors.splice(draggedIndex, 1);
        newSponsors.splice(targetIndex, 0, removed);

        // Order'ları güncelle
        const updatedSponsors = newSponsors.map((sponsor, i) => ({ ...sponsor, sort_order: i + 1 }));

        try {
            await api.put('/admin/sponsors/order', {
                sponsors: updatedSponsors.map((sponsor, idx) => ({
                    id: sponsor.id,
                    sort_order: idx + 1
                }))
            });
            setSponsors(updatedSponsors);
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Sıra güncellenirken hata oluştu');
            loadSponsors();
        } finally {
            setDraggedItem(null);
        }
    };

    const stats = {
        total: sponsors.length,
        active: sponsors.filter(s => s.status === 'active').length,
        inactive: sponsors.filter(s => s.status === 'inactive').length
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-sponsors-page">
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
            <div className="admin-sponsors-page">
                {/* Header */}
                <div className="admin-header-advanced">
                    <div>
                        <button 
                            onClick={() => navigate('/admin/sections')}
                            className="btn-back"
                        >
                            <FiChevronLeft /> Geri
                        </button>
                        <h1 className="page-title-advanced">Sponsor Yönetimi</h1>
                        <p className="page-subtitle-advanced">Sponsorları yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSponsors}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-primary" onClick={handleAdd}>
                            <FiPlus /> Yeni Sponsor
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="admin-stats-grid-advanced">
                    <div className="stat-card-advanced">
                        <div className="stat-icon-wrapper">
                            <FiStar className="stat-icon" />
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Toplam Sponsor</span>
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
                <div className="sponsors-items-list">
                    {sponsors.length === 0 ? (
                        <div className="empty-state-advanced">
                            <FiStar className="empty-icon" />
                            <h3>Henüz sponsor eklenmemiş</h3>
                            <p>Yeni sponsor eklemek için "Yeni Sponsor" butonuna tıklayın.</p>
                        </div>
                    ) : (
                        sponsors.map((sponsor) => {
                            const isDragged = draggedItem && draggedItem.id === sponsor.id;
                            const isDragOver = dragOverItem === sponsor.id;
                            
                            return (
                                <div
                                    key={sponsor.id}
                                    className={`sponsor-item-card ${sponsor.status === 'inactive' ? 'inactive' : ''} ${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, sponsor)}
                                    onDragOver={(e) => handleDragOver(e, sponsor)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, sponsor)}
                                >
                                    <div className="item-drag-handle">
                                        <FiMove />
                                    </div>
                                    <div className="item-order">{sponsor.sort_order || 0}</div>
                                    <div className="item-logo">
                                        {sponsor.logo ? (
                                            <img src={getImageUrl(sponsor.logo)} alt={sponsor.name} />
                                        ) : (
                                            <div className="logo-placeholder">
                                                <FiImage />
                                            </div>
                                        )}
                                    </div>
                                    <div className="item-content">
                                        <h3>{sponsor.name}</h3>
                                        {sponsor.description && <p>{sponsor.description.substring(0, 100)}...</p>}
                                        {sponsor.link_url && (
                                            <a href={sponsor.link_url} target="_blank" rel="noopener noreferrer" className="item-link">
                                                <FiStar /> {sponsor.link_url}
                                            </a>
                                        )}
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            onClick={() => handleToggleStatus(sponsor.id, sponsor.status)}
                                            className={`btn-status ${sponsor.status === 'active' ? 'active' : 'inactive'}`}
                                            title={sponsor.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                                        >
                                            {sponsor.status === 'active' ? <FiEye /> : <FiEyeOff />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(sponsor)}
                                            className="btn-edit"
                                            title="Düzenle"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sponsor.id)}
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
                                <h2>{editingId ? 'Sponsor Düzenle' : 'Yeni Sponsor Ekle'}</h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label>İsim *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Logo *</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        required={!editingId}
                                    />
                                    {logoPreview && (
                                        <div className="image-preview">
                                            <img src={logoPreview} alt="Preview" />
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Link URL</label>
                                    <input
                                        type="url"
                                        value={formData.link_url}
                                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                        placeholder="https://..."
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

export default AdminSponsors;
