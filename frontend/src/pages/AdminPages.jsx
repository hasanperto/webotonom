import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiPlus, FiEdit, FiTrash2, FiMove, FiX,
    FiChevronLeft, FiSave, FiRefreshCw,
    FiEye, FiEyeOff, FiFileText, FiSearch
} from 'react-icons/fi';
import './AdminPages.css';

const AdminPages = () => {
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/pages');
            const loaded = response.data.pages || [];
            setPages(loaded);
        } catch (error) {
            console.error('Error loading pages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu sayfayı silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await api.delete(`/admin/pages/${id}`);
            await loadPages();
        } catch (error) {
            console.error('Error deleting page:', error);
            alert('Sayfa silinirken hata oluştu');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await api.put(`/admin/pages/${id}`, { status: newStatus });
            setPages(pages.map(page => 
                page.id === id ? { ...page, status: newStatus } : page
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

        const draggedIndex = pages.findIndex(p => p.id === draggedItem.id);
        const targetIndex = pages.findIndex(p => p.id === targetItem.id);

        const newPages = [...pages];
        const [removed] = newPages.splice(draggedIndex, 1);
        newPages.splice(targetIndex, 0, removed);

        setPages(newPages);
        setDraggedItem(null);
    };

    const stats = {
        total: pages.length,
        active: pages.filter(p => p.status === 'active').length,
        inactive: pages.filter(p => p.status === 'inactive').length
    };

    const filteredPages = pages.filter(page =>
        page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-pages-page">
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
            <div className="admin-pages-page">
                {/* Header */}
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Sayfa Yönetimi</h1>
                        <p className="page-subtitle-advanced">Statik sayfaları yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadPages}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-primary" onClick={() => navigate('/admin/pages/add')}>
                            <FiPlus /> Yeni Sayfa
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="admin-stats-grid-advanced">
                    <div className="stat-card-advanced">
                        <div className="stat-icon-wrapper">
                            <FiFileText className="stat-icon" />
                        </div>
                        <div className="stat-content-advanced">
                            <span className="stat-label-advanced">Toplam Sayfa</span>
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

                {/* Search */}
                <div className="search-box-minimal">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Sayfa ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Items List */}
                <div className="pages-items-list">
                    {filteredPages.length === 0 ? (
                        <div className="empty-state-advanced">
                            <FiFileText className="empty-icon" />
                            <h3>Henüz sayfa eklenmemiş</h3>
                            <p>Yeni sayfa eklemek için "Yeni Sayfa" butonuna tıklayın.</p>
                        </div>
                    ) : (
                        filteredPages.map((page) => {
                            const isDragged = draggedItem && draggedItem.id === page.id;
                            const isDragOver = dragOverItem === page.id;
                            
                            return (
                                <div
                                    key={page.id}
                                    className={`page-item-card ${page.status === 'inactive' ? 'inactive' : ''} ${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, page)}
                                    onDragOver={(e) => handleDragOver(e, page)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, page)}
                                >
                                    <div className="item-drag-handle">
                                        <FiMove />
                                    </div>
                                    <div className="item-content">
                                        <h3>{page.title}</h3>
                                        <p className="item-slug">/{page.slug}</p>
                                        {page.meta_description && (
                                            <p className="item-description">{page.meta_description.substring(0, 100)}...</p>
                                        )}
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            onClick={() => handleToggleStatus(page.id, page.status)}
                                            className={`btn-status ${page.status === 'active' ? 'active' : 'inactive'}`}
                                            title={page.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                                        >
                                            {page.status === 'active' ? <FiEye /> : <FiEyeOff />}
                                        </button>
                                        <button
                                            onClick={() => navigate(`/admin/pages/${page.id}/edit`)}
                                            className="btn-edit"
                                            title="Düzenle"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(page.id)}
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

export default AdminPages;
