import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { 
    FiPlus, FiEdit, FiTrash2, FiMove,
    FiChevronLeft, FiRefreshCw,
    FiEye, FiEyeOff, FiHelpCircle
} from 'react-icons/fi';
import { 
    getFAQItems,
    deleteFAQItem, updateFAQItemsOrder, updateFAQItemStatus
} from '../api/sections';
import './AdminFAQSection.css';

const AdminFAQSection = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setLoading(true);
            const loadedItems = await getFAQItems();
            setItems(loadedItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
            
            // Kategorileri çıkar (benzersiz ve null olmayan)
            const uniqueCategories = [...new Set(loadedItems
                .map(item => item.category)
                .filter(cat => cat && cat.trim() !== '')
            )].sort();
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        navigate('/admin/sections/faq/items/add');
    };

    const handleEdit = (item) => {
        navigate(`/admin/sections/faq/items/edit/${item.id}`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu FAQ\'yi silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await deleteFAQItem(id);
            await loadItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('FAQ silinirken hata oluştu');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await updateFAQItemStatus(id, newStatus);
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
            await updateFAQItemsOrder(updatedItems);
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
                <div className="admin-faq-section-page">
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
            <div className="admin-faq-section-page">
                {/* Header */}
                <div className="admin-header-advanced">
                    <div>
                        <button 
                            onClick={() => navigate('/admin/sections')}
                            className="btn-back"
                        >
                            <FiChevronLeft /> Geri
                        </button>
                        <h1 className="page-title-advanced">FAQ Yönetimi</h1>
                        <p className="page-subtitle-advanced">Sık sorulan soruları yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadItems}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-primary" onClick={handleAdd}>
                            <FiPlus /> Yeni FAQ
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="admin-stats-grid-advanced">
                    <div className="stat-card-advanced">
                        <div className="stat-icon-wrapper">
                            <FiHelpCircle className="stat-icon" />
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Toplam FAQ</span>
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
                <div className="faq-items-list">
                    {items.length === 0 ? (
                        <div className="empty-state-advanced">
                            <FiHelpCircle className="empty-icon" />
                            <h3>Henüz FAQ eklenmemiş</h3>
                            <p>Yeni FAQ eklemek için "Yeni FAQ" butonuna tıklayın.</p>
                        </div>
                    ) : (
                        items.map((item) => {
                            const isDragged = draggedItem && draggedItem.id === item.id;
                            const isDragOver = dragOverItem === item.id;
                            
                            return (
                                <div
                                    key={item.id}
                                    className={`faq-item-card ${item.status === 'inactive' ? 'inactive' : ''} ${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
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
                                    <div className="item-content">
                                        <div className="faq-question-preview">
                                            <strong>{item.question}</strong>
                                        </div>
                                        <div className="faq-answer-preview">
                                            {item.answer.length > 100 ? `${item.answer.substring(0, 100)}...` : item.answer}
                                        </div>
                                        {item.category && (
                                            <div className="faq-category-badge">
                                                {item.category}
                                            </div>
                                        )}
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            className={`btn-status ${item.status === 'active' ? 'active' : 'inactive'}`}
                                            onClick={() => handleToggleStatus(item.id, item.status)}
                                            title={item.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                                        >
                                            {item.status === 'active' ? <FiEye /> : <FiEyeOff />}
                                        </button>
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(item)}
                                            title="Düzenle"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(item.id)}
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

export default AdminFAQSection;

