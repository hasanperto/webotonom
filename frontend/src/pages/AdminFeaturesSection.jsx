import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getImageUrl } from '../utils/api';
import { 
    FiPlus, FiEdit, FiTrash2, FiMove,
    FiChevronLeft, FiRefreshCw,
    FiEye, FiEyeOff, FiPackage
} from 'react-icons/fi';
import { 
    getFeaturesItems,
    deleteFeaturesItem, updateFeaturesItemsOrder, updateFeaturesItemStatus
} from '../api/sections';
import './AdminFeaturesSection.css';

const AdminFeaturesSection = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            const loadedItems = await getFeaturesItems();
            setItems(loadedItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        navigate('/admin/sections/features/items/add');
    };

    const handleEdit = (item) => {
        navigate(`/admin/sections/features/items/edit/${item.id}`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu hizmeti silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await deleteFeaturesItem(id);
            await loadItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Hizmet silinirken hata oluştu');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await updateFeaturesItemStatus(id, newStatus);
            setItems(items.map(item => 
                item.id === id ? { ...item, status: newStatus } : item
            ));
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Durum güncellenirken hata oluştu');
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

        const draggedIndex = items.findIndex(i => i.id === draggedItem.id);
        const targetIndex = items.findIndex(i => i.id === targetItem.id);

        const newItems = [...items];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        // Order'ları güncelle
        const updatedItems = newItems.map((item, i) => ({ ...item, order: i + 1 }));

        try {
            await updateFeaturesItemsOrder(updatedItems);
            setItems(updatedItems);
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Sıra güncellenirken hata oluştu');
            loadItems();
        } finally {
            setDraggedItem(null);
        }
    };

    const stats = {
        total: items.length,
        active: items.filter(i => i.status === 'active').length,
        inactive: items.filter(i => i.status === 'inactive').length
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-features-section-page">
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
            <div className="admin-features-section-page">
                {/* Header */}
                <div className="admin-header-advanced">
                    <div>
                        <button 
                            onClick={() => navigate('/admin/sections')}
                            className="btn-back"
                        >
                            <FiChevronLeft /> Geri
                        </button>
                        <h1 className="page-title-advanced">Hizmet Yönetimi</h1>
                        <p className="page-subtitle-advanced">Features section hizmetlerini yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadItems}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-primary" onClick={handleAdd}>
                            <FiPlus /> Yeni Hizmet
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="admin-stats-grid-advanced">
                    <div className="stat-card-advanced">
                        <div className="stat-icon-wrapper">
                            <FiPackage className="stat-icon" />
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Toplam Hizmet</span>
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
                <div className="features-items-list">
                    {items.length === 0 ? (
                        <div className="empty-state-advanced">
                            <FiPackage className="empty-icon" />
                            <h3>Henüz hizmet eklenmemiş</h3>
                            <p>Yeni hizmet eklemek için "Yeni Hizmet" butonuna tıklayın.</p>
                        </div>
                    ) : (
                        items.map((item) => {
                            const isDragged = draggedItem && draggedItem.id === item.id;
                            const isDragOver = dragOverItem === item.id;
                            
                            return (
                                <div
                                    key={item.id}
                                    className={`feature-item-card ${item.status === 'inactive' ? 'inactive' : ''} ${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    onDragOver={(e) => handleDragOver(e, item)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, item)}
                                >
                                    <div className="item-drag-handle">
                                        <FiMove />
                                    </div>
                                    <div className="item-order">{item.order || 0}</div>
                                    <div className="item-icon">
                                        {item.image ? (
                                            <img src={getImageUrl(item.image)} alt={item.title} />
                                        ) : (
                                            <div className="icon-placeholder">{item.icon || 'FiPackage'}</div>
                                        )}
                                    </div>
                                    <div className="item-content">
                                        <h3>{item.title}</h3>
                                        {item.description && <p>{item.description}</p>}
                                        {item.link && (
                                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                {item.link_text || item.link}
                                            </a>
                                        )}
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            onClick={() => handleToggleStatus(item.id, item.status)}
                                            className={`btn-status ${item.status === 'active' ? 'active' : 'inactive'}`}
                                            title={item.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                                        >
                                            {item.status === 'active' ? <FiEye /> : <FiEyeOff />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="btn-edit"
                                            title="Düzenle"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
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

            </div>
        </AdminLayout>
    );
};

export default AdminFeaturesSection;

