import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { 
    FiPlus, FiEdit, FiTrash2, FiMove,
    FiChevronLeft, FiRefreshCw,
    FiEye, FiEyeOff, FiMessageCircle, FiStar, FiUser, FiSettings
} from 'react-icons/fi';
import { 
    getTestimonialsItems,
    deleteTestimonialItem, updateTestimonialsItemsOrder, updateTestimonialItemStatus,
    getTestimonialsSettings, updateTestimonialsSettings
} from '../api/sections';
import './AdminTestimonialsSection.css';

const AdminTestimonialsSection = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);

    const [settings, setSettings] = useState({
        display_type: 'all',
        display_count: 3,
        show_rating: true,
        show_avatar: true,
        show_company: true,
        slider_enabled: true,
        auto_play: true,
        auto_play_interval: 5000
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [loadedItems, settingsData] = await Promise.all([
                getTestimonialsItems(),
                getTestimonialsSettings()
            ]);
            
            setItems(loadedItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
            
            if (settingsData) {
                setSettings(settingsData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        navigate('/admin/sections/testimonials/items/add');
    };

    const handleEdit = (item) => {
        navigate(`/admin/sections/testimonials/items/edit/${item.id}`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu testimonial\'ı silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await deleteTestimonialItem(id);
            setItems(items.filter(item => item.id !== id));
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Silme işlemi başarısız oldu');
        }
    };


    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await updateTestimonialItemStatus(id, newStatus);
            setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Durum güncelleme başarısız oldu');
        }
    };

    const handleSaveSettings = async () => {
        try {
            await updateTestimonialsSettings(settings);
            alert('Ayarlar başarıyla kaydedildi');
            setShowSettingsModal(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Ayarlar kaydedilirken hata oluştu');
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, item) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverItem?.id !== item.id) {
            setDragOverItem(item);
        }
    };

    const handleDrop = async (e, targetItem) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetItem.id) {
            setDraggedItem(null);
            setDragOverItem(null);
            return;
        }

        const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
        const targetIndex = items.findIndex(item => item.id === targetItem.id);

        const newItems = [...items];
        newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);

        // Update order values
        const updatedItems = newItems.map((item, index) => ({
            ...item,
            order: index + 1
        }));

        try {
            await updateTestimonialsItemsOrder(updatedItems);
            setItems(updatedItems);
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Sıralama güncellenirken hata oluştu');
        }

        setDraggedItem(null);
        setDragOverItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-testimonials-section-page">
                    <div className="loading">Yükleniyor...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-testimonials-section-page">
                <div className="page-header">
                    <button onClick={() => navigate('/admin/sections')} className="btn-back">
                        <FiChevronLeft /> Geri
                    </button>
                    <div className="header-content">
                        <h1>Testimonials Yönetimi</h1>
                        <p>Kullanıcı yorumlarını yönetin ve ayarları yapılandırın</p>
                    </div>
                </div>

                <div className="page-actions">
                    <button onClick={handleAdd} className="btn-primary">
                        <FiPlus /> Yeni Testimonial Ekle
                    </button>
                    <button onClick={() => setShowSettingsModal(true)} className="btn-secondary">
                        <FiSettings /> Ayarlar
                    </button>
                    <button onClick={loadData} className="btn-refresh">
                        <FiRefreshCw /> Yenile
                    </button>
                </div>

                <div className="items-list">
                    {items.length === 0 ? (
                        <div className="empty-state">
                            <FiMessageCircle className="empty-icon" />
                            <p>Henüz testimonial eklenmemiş</p>
                            <button onClick={handleAdd} className="btn-primary">
                                <FiPlus /> İlk Testimonial'ı Ekle
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className={`item-card ${draggedItem?.id === item.id ? 'dragging' : ''} ${dragOverItem?.id === item.id ? 'drag-over' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragOver={(e) => handleDragOver(e, item)}
                                onDrop={(e) => handleDrop(e, item)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="item-drag-handle">
                                    <FiMove />
                                </div>
                                <div className="item-content">
                                    <div className="item-header">
                                        <div className="item-avatar">
                                            {item.avatar ? (
                                                <img src={item.avatar} alt={item.name} />
                                            ) : (
                                                <FiUser />
                                            )}
                                        </div>
                                        <div className="item-info">
                                            <h3>{item.name}</h3>
                                            {item.role && <p className="item-role">{item.role}</p>}
                                            {item.company && <p className="item-company">{item.company}</p>}
                                        </div>
                                        <div className="item-rating">
                                            {[...Array(5)].map((_, i) => (
                                                <FiStar
                                                    key={i}
                                                    className={i < (item.rating || 5) ? 'star-filled' : 'star-empty'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="item-comment">"{item.comment}"</p>
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
                        ))
                    )}
                </div>

                {/* Settings Modal */}
                {showSettingsModal && (
                    <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                        <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Testimonials Ayarları</h2>
                                <button onClick={() => setShowSettingsModal(false)} className="btn-close">
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Gösterim Tipi</label>
                                    <select
                                        value={settings.display_type}
                                        onChange={(e) => setSettings({ ...settings, display_type: e.target.value })}
                                    >
                                        <option value="all">Tümü</option>
                                        <option value="featured">Öne Çıkanlar</option>
                                        <option value="selected">Seçilenler</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Gösterilecek Adet</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={settings.display_count}
                                        onChange={(e) => setSettings({ ...settings, display_count: parseInt(e.target.value) || 3 })}
                                    />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={settings.show_rating}
                                            onChange={(e) => setSettings({ ...settings, show_rating: e.target.checked })}
                                        />
                                        Puan Göster
                                    </label>
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={settings.show_avatar}
                                            onChange={(e) => setSettings({ ...settings, show_avatar: e.target.checked })}
                                        />
                                        Avatar Göster
                                    </label>
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={settings.show_company}
                                            onChange={(e) => setSettings({ ...settings, show_company: e.target.checked })}
                                        />
                                        Şirket Göster
                                    </label>
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={settings.slider_enabled}
                                            onChange={(e) => setSettings({ ...settings, slider_enabled: e.target.checked })}
                                        />
                                        Slider Aktif
                                    </label>
                                </div>
                                {settings.slider_enabled && (
                                    <>
                                        <div className="form-group checkbox-group">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.auto_play}
                                                    onChange={(e) => setSettings({ ...settings, auto_play: e.target.checked })}
                                                />
                                                Otomatik Oynat
                                            </label>
                                        </div>
                                        {settings.auto_play && (
                                            <div className="form-group">
                                                <label>Otomatik Oynatma Aralığı (ms)</label>
                                                <input
                                                    type="number"
                                                    min="1000"
                                                    step="500"
                                                    value={settings.auto_play_interval}
                                                    onChange={(e) => setSettings({ ...settings, auto_play_interval: parseInt(e.target.value) || 5000 })}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setShowSettingsModal(false)} className="btn-cancel">
                                    <FiX /> İptal
                                </button>
                                <button onClick={handleSaveSettings} className="btn-save">
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

export default AdminTestimonialsSection;

