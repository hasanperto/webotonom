import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { getImageUrl } from '../utils/api';
import { 
    FiImage, FiPlus, FiEdit, FiTrash2, FiEye, FiCheck, FiX,
    FiRefreshCw, FiMoreVertical, FiChevronDown, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import './AdminSlider.css';

const AdminSlider = () => {
    const navigate = useNavigate();
    const [sliders, setSliders] = useState([]);
    const [filteredSliders, setFilteredSliders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        loadSliders();
    }, []);

    useEffect(() => {
        filterAndPaginate();
    }, [sliders, searchTerm, pageSize, currentPage]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.toolbar-left')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const loadSliders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/sliders');
            setSliders(response.data.sliders || []);
        } catch (error) {
            console.error('Sliders load error:', error);
            alert('Sliderlar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const filterAndPaginate = () => {
        let filtered = sliders;
        
        // Arama filtresi
        if (searchTerm) {
            filtered = filtered.filter(s => 
                s.title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredSliders(filtered);
    };

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        if (checked) {
            setSelectedIds(filteredSliders.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectItem = (id) => {
        setSelectedIds(prev => {
            const newIds = prev.includes(id) 
                ? prev.filter(i => i !== id)
                : [...prev, id];
            setSelectAll(newIds.length === filteredSliders.length && filteredSliders.length > 0);
            return newIds;
        });
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) {
            alert('Lütfen en az bir slider seçin');
            return;
        }

        if (action === 'delete') {
            if (!confirm('Seçili sliderları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
                return;
            }
        }

        try {
            if (action === 'active' || action === 'inactive') {
                await api.put('/admin/sliders/bulk/status', {
                    ids: selectedIds,
                    status: action === 'active' ? 'active' : 'inactive'
                });
            } else if (action === 'delete') {
                await api.delete('/admin/sliders/bulk', {
                    data: { ids: selectedIds }
                });
            }
            
            setSelectedIds([]);
            setSelectAll(false);
            loadSliders();
            setShowDropdown(false);
        } catch (error) {
            console.error('Bulk action error:', error);
            alert(error.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu sliderı silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await api.delete(`/admin/sliders/${id}`);
            loadSliders();
        } catch (error) {
            console.error('Delete slider error:', error);
            alert(error.response?.data?.error || 'Slider silinemedi');
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/admin/sliders/${id}`, { status: newStatus });
            loadSliders();
        } catch (error) {
            console.error('Status update error:', error);
            alert(error.response?.data?.error || 'Durum güncellenemedi');
        }
    };

    const totalPages = Math.ceil(filteredSliders.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSliders = filteredSliders.slice(startIndex, endIndex);

    const getStatusBadge = (slider) => {
        const status = slider.status;
        const isActive = status === 'active';
        return (
            <button
                className={`status-badge-btn ${isActive ? 'status-active' : 'status-inactive'}`}
                onClick={() => handleStatusToggle(slider.id, status)}
                title={isActive ? 'Pasif yap' : 'Aktif yap'}
            >
                {isActive ? <FiCheck /> : <FiX />}
                <span>{isActive ? 'Aktif' : 'Pasif'}</span>
            </button>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-slider-page">
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
            <div className="admin-slider-page">
                <div className="page-header">
                    <div>
                        <h1>Slider Yönetimi</h1>
                        <p>Tüm sliderları görüntüle, düzenle veya sil</p>
                    </div>
                    <div className="header-actions">
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/admin/slider/add')}
                        >
                            <FiPlus /> Yeni Slider Ekle
                        </button>
                        <button 
                            className="btn btn-outline"
                            onClick={loadSliders}
                        >
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <div className="toolbar">
                    <div className="toolbar-left">
                        <button 
                            className="btn btn-primary btn-sm dropdown-toggle"
                            onClick={() => setShowDropdown(!showDropdown)}
                            disabled={selectedIds.length === 0}
                        >
                            <FiMoreVertical /> Seçilenlere Uygula
                        </button>
                        {showDropdown && selectedIds.length > 0 && (
                            <div className="dropdown-menu">
                                <button 
                                    className="dropdown-item"
                                    onClick={() => handleBulkAction('active')}
                                >
                                    <FiCheck /> Seçilenleri Aktif Et
                                </button>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => handleBulkAction('inactive')}
                                >
                                    <FiX /> Seçilenleri Pasif Et
                                </button>
                                <button 
                                    className="dropdown-item danger"
                                    onClick={() => handleBulkAction('delete')}
                                >
                                    <FiTrash2 /> Seçilenleri Sil
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="toolbar-right">
                        <div className="dataTables-length">
                            <label>
                                Sayfada{' '}
                                <select 
                                    value={pageSize} 
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={999999}>Tümü</option>
                                </select>{' '}
                                kayıt göster
                            </label>
                        </div>
                        <div className="dataTables-filter">
                            <label>
                                Ara:{' '}
                                <input 
                                    type="search" 
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Başlık ara..."
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="checkbox-col">
                                    <input 
                                        type="checkbox" 
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        id="select-all"
                                    />
                                    <label htmlFor="select-all"></label>
                                </th>
                                <th>Sıra</th>
                                <th>Başlık</th>
                                <th>Durum</th>
                                <th className="text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSliders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        <p>Slider bulunamadı</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedSliders.map((slider, index) => (
                                    <tr key={slider.id}>
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(slider.id)}
                                                onChange={() => handleSelectItem(slider.id)}
                                                id={`slider-${slider.id}`}
                                            />
                                            <label htmlFor={`slider-${slider.id}`}></label>
                                        </td>
                                        <td>{slider.order || index + 1}</td>
                                        <td>{slider.title}</td>
                                        <td>{getStatusBadge(slider)}</td>
                                        <td className="text-center">
                                            <div className="action-buttons">
                                                <a 
                                                    href={getImageUrl(slider.image)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-icon btn-success"
                                                    title="Resmi Göster"
                                                >
                                                    <FiEye />
                                                </a>
                                                <button
                                                    className="btn-icon btn-primary"
                                                    onClick={() => navigate(`/admin/slider/${slider.id}/edit`)}
                                                    title="Düzenle"
                                                >
                                                    <FiEdit />
                                                </button>
                                                <button
                                                    className="btn-icon btn-danger"
                                                    onClick={() => handleDelete(slider.id)}
                                                    title="Sil"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-wrapper">
                        <div className="dataTables-info">
                            {filteredSliders.length} kayıttan {startIndex + 1} - {Math.min(endIndex, filteredSliders.length)} arasındaki kayıtlar gösteriliyor
                        </div>
                        <div className="pagination">
                            <button
                                className="page-btn"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <FiChevronLeft /> Önceki
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                className="page-btn"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Sonraki <FiChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminSlider;

