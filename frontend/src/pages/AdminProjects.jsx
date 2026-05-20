import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiPackage, FiSearch, FiEye, FiCheckCircle, FiXCircle, FiClock,
    FiRefreshCw, FiDollarSign, FiUser, FiTag, FiCalendar, FiEdit, FiTrash2,
    FiMoreVertical, FiTrendingUp, FiPlus, FiX
} from 'react-icons/fi';
import './AdminProjects.css';

const AdminProjects = () => {
    const [allProjects, setAllProjects] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedActions, setExpandedActions] = useState({});

    useEffect(() => {
        loadProjects();
    }, [filter, searchTerm]);

    const loadProjects = async () => {
        try {
            const response = await api.get('/admin/projects');
            let fetchedProjects = response.data.projects || [];
            
            setAllProjects(fetchedProjects);
            
            // Filter by status
            let filtered = filter !== 'all' 
                ? fetchedProjects.filter(p => p.status === filter)
                : fetchedProjects;
            
            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(p => 
                    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            setProjects(filtered);
        } catch (error) {
            console.error('Projects load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (projectId, newStatus) => {
        if (confirm(`Proje durumunu "${newStatus === 'approved' ? 'Onaylı' : newStatus === 'rejected' ? 'Reddedilen' : 'Beklemede'}" olarak değiştirmek istediğinize emin misiniz?`)) {
            try {
                await api.put(`/admin/projects/${projectId}/status`, { status: newStatus });
                loadProjects();
                // Mobil menüyü kapat
                setExpandedActions(prev => ({ ...prev, [projectId]: false }));
            } catch (error) {
                alert(error.response?.data?.error || 'Durum güncellenemedi');
            }
        }
    };

    const handleDelete = async (projectId) => {
        if (confirm('Bu projeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await api.delete(`/admin/projects/${projectId}`);
                loadProjects();
                setExpandedActions(prev => ({ ...prev, [projectId]: false }));
            } catch (error) {
                alert(error.response?.data?.error || 'Proje silinemedi');
            }
        }
    };

    const toggleActionsMenu = (projectId) => {
        setExpandedActions(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('tr-TR').format(num || 0);
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'approved': { label: 'Onaylı', class: 'status-approved', icon: FiCheckCircle },
            'active': { label: 'Aktif', class: 'status-approved', icon: FiCheckCircle },
            'pending': { label: 'Beklemede', class: 'status-pending', icon: FiClock },
            'rejected': { label: 'Reddedilen', class: 'status-rejected', icon: FiXCircle },
            'inactive': { label: 'Pasif', class: 'status-rejected', icon: FiXCircle }
        };
        return statusMap[status] || { label: status, class: 'status-pending', icon: FiClock };
    };

    const stats = {
        total: allProjects.length,
        pending: allProjects.filter(p => p.status === 'pending').length,
        approved: allProjects.filter(p => p.status === 'approved' || p.status === 'active').length,
        rejected: allProjects.filter(p => p.status === 'rejected').length,
        totalRevenue: allProjects.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0)
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-projects-page">
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
            <div className="admin-projects-page">
                {/* Header */}
                <div className="projects-page-header">
                    <div>
                        <h1 className="page-title">Proje Yönetimi</h1>
                        <p className="page-subtitle">Tüm projeleri görüntüle, onayla veya reddet</p>
                    </div>
                    <button className="btn-refresh" onClick={loadProjects}>
                        <FiRefreshCw /> Yenile
                    </button>
                </div>

                {/* Stats Cards - Minimal */}
                <div className="projects-stats-minimal">
                    <div className="stat-minimal">
                        <div className="stat-icon-minimal total">
                            <FiPackage />
                        </div>
                        <div className="stat-content-minimal">
                            <span className="stat-label-minimal">Toplam</span>
                            <span className="stat-value-minimal">{formatNumber(stats.total)}</span>
                        </div>
                    </div>
                    <div className="stat-minimal">
                        <div className="stat-icon-minimal pending">
                            <FiClock />
                        </div>
                        <div className="stat-content-minimal">
                            <span className="stat-label-minimal">Beklemede</span>
                            <span className="stat-value-minimal">{formatNumber(stats.pending)}</span>
                        </div>
                    </div>
                    <div className="stat-minimal">
                        <div className="stat-icon-minimal approved">
                            <FiCheckCircle />
                        </div>
                        <div className="stat-content-minimal">
                            <span className="stat-label-minimal">Onaylı</span>
                            <span className="stat-value-minimal">{formatNumber(stats.approved)}</span>
                        </div>
                    </div>
                    <div className="stat-minimal">
                        <div className="stat-icon-minimal revenue">
                            <FiDollarSign />
                        </div>
                        <div className="stat-content-minimal">
                            <span className="stat-label-minimal">Toplam Değer</span>
                            <span className="stat-value-minimal">{formatPrice(stats.totalRevenue)}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="projects-filters-minimal">
                    <div className="search-box-minimal">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Proje adı, satıcı veya kategori ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-minimal"
                        />
                    </div>
                    <div className="filter-tabs-minimal">
                        <button 
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Tümü ({stats.total})
                        </button>
                        <button 
                            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            <FiClock /> Beklemede ({stats.pending})
                        </button>
                        <button 
                            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                            onClick={() => setFilter('approved')}
                        >
                            <FiCheckCircle /> Onaylı ({stats.approved})
                        </button>
                        <button 
                            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
                            onClick={() => setFilter('rejected')}
                        >
                            <FiXCircle /> Reddedilen ({stats.rejected})
                        </button>
                    </div>
                </div>

                {/* Projects Table - Modern List */}
                {projects.length === 0 ? (
                    <div className="empty-state-minimal">
                        <FiPackage className="empty-icon" />
                        <h3>Proje bulunamadı</h3>
                        <p>Seçili filtreye uygun proje yok.</p>
                    </div>
                ) : (
                    <div className="projects-table-minimal">
                        <table className="projects-table">
                            <thead>
                                <tr>
                                    <th>Proje</th>
                                    <th>Satıcı</th>
                                    <th>Kategori</th>
                                    <th>Fiyat</th>
                                    <th>Durum</th>
                                    <th>Tarih</th>
                                    <th className="text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map(project => {
                                    const statusInfo = getStatusBadge(project.status);
                                    const StatusIcon = statusInfo.icon;
                                    const isExpanded = expandedActions[project.id];
                                    return (
                                        <tr 
                                            key={project.id}
                                            className={isExpanded ? 'expanded-row' : ''}
                                            onClick={(e) => {
                                                // Mobilde satıra tıklanınca menüyü aç/kapat
                                                if (window.innerWidth <= 1024) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleActionsMenu(project.id);
                                                }
                                            }}
                                        >
                                            <td>
                                                <div className="project-cell">
                                                    {/* Mobilde + butonu */}
                                                    <div className="project-mobile-toggle">
                                                        <button
                                                            className="btn-mobile-toggle"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleActionsMenu(project.id);
                                                            }}
                                                        >
                                                            {isExpanded ? <FiX /> : <FiPlus />}
                                                        </button>
                                                        {/* Mobil menü + butonunun altında */}
                                                        {isExpanded && (
                                                            <>
                                                                <div 
                                                                    className="actions-mobile-overlay"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedActions(prev => ({ ...prev, [project.id]: false }));
                                                                    }}
                                                                ></div>
                                                                <div 
                                                                    className="actions-mobile-menu"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Link
                                                                        to={`/projects/${project.id}`}
                                                                        className="btn-action-mobile btn-view"
                                                                        onClick={() => setExpandedActions(prev => ({ ...prev, [project.id]: false }))}
                                                                    >
                                                                        <FiEye /> Görüntüle
                                                                    </Link>
                                                                    <Link
                                                                        to={`/seller/projects/${project.id}/edit`}
                                                                        className="btn-action-mobile btn-edit"
                                                                        onClick={() => setExpandedActions(prev => ({ ...prev, [project.id]: false }))}
                                                                    >
                                                                        <FiEdit /> Düzenle
                                                                    </Link>
                                                                    {project.status !== 'approved' && (
                                                                        <button
                                                                            className="btn-action-mobile btn-approve"
                                                                            onClick={() => {
                                                                                handleStatusChange(project.id, 'approved');
                                                                                setExpandedActions(prev => ({ ...prev, [project.id]: false }));
                                                                            }}
                                                                        >
                                                                            <FiCheckCircle /> Onayla
                                                                        </button>
                                                                    )}
                                                                    {project.status !== 'rejected' && (
                                                                        <button
                                                                            className="btn-action-mobile btn-reject"
                                                                            onClick={() => {
                                                                                handleStatusChange(project.id, 'rejected');
                                                                                setExpandedActions(prev => ({ ...prev, [project.id]: false }));
                                                                            }}
                                                                        >
                                                                            <FiXCircle /> Reddet
                                                                        </button>
                                                                    )}
                                                                    {project.status === 'approved' && (
                                                                        <button
                                                                            className="btn-action-mobile btn-cancel"
                                                                            onClick={() => {
                                                                                handleStatusChange(project.id, 'pending');
                                                                                setExpandedActions(prev => ({ ...prev, [project.id]: false }));
                                                                            }}
                                                                        >
                                                                            <FiClock /> Onayı İptal Et
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        className="btn-action-mobile btn-delete"
                                                                        onClick={() => {
                                                                            handleDelete(project.id);
                                                                            setExpandedActions(prev => ({ ...prev, [project.id]: false }));
                                                                        }}
                                                                    >
                                                                        <FiTrash2 /> Sil
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    {project.primary_image && (
                                                        <img 
                                                            src={project.primary_image} 
                                                            alt={project.title}
                                                            className="project-thumb"
                                                        />
                                                    )}
                                                    <div className="project-info-cell">
                                                        <Link 
                                                            to={`/projects/${project.id}`}
                                                            className="project-title-link"
                                                            onClick={(e) => {
                                                                // Mobilde link tıklamasını engelle, sadece menüyü aç
                                                                if (window.innerWidth <= 1024) {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    toggleActionsMenu(project.id);
                                                                }
                                                            }}
                                                        >
                                                            {project.title || 'İsimsiz Proje'}
                                                        </Link>
                                                        {project.short_description && (
                                                            <p className="project-desc-cell">
                                                                {project.short_description.substring(0, 60)}...
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <FiUser className="user-icon" />
                                                    <span>{project.username || 'Bilinmeyen'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="category-cell">
                                                    <FiTag className="category-icon" />
                                                    <span>{project.category_name || 'Belirtilmemiş'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="price-cell">{formatPrice(project.price)}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge-minimal ${statusInfo.class}`}>
                                                    <StatusIcon />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="date-cell">
                                                    <FiCalendar className="date-icon" />
                                                    <span>
                                                        {new Date(project.created_at).toLocaleDateString('tr-TR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="actions-cell">
                                                    {/* Desktop Actions */}
                                                    <div className="actions-desktop">
                                                        <Link
                                                            to={`/projects/${project.id}`}
                                                            className="btn-action btn-view"
                                                            title="Görüntüle"
                                                        >
                                                            <FiEye />
                                                        </Link>
                                                        <Link
                                                            to={`/admin/projects/${project.id}/edit`}
                                                            className="btn-action btn-edit"
                                                            title="Düzenle"
                                                        >
                                                            <FiEdit />
                                                        </Link>
                                                        {project.status !== 'approved' && (
                                                            <button
                                                                className="btn-action btn-approve"
                                                                onClick={() => handleStatusChange(project.id, 'approved')}
                                                                title="Onayla"
                                                            >
                                                                <FiCheckCircle />
                                                            </button>
                                                        )}
                                                        {project.status !== 'rejected' && (
                                                            <button
                                                                className="btn-action btn-reject"
                                                                onClick={() => handleStatusChange(project.id, 'rejected')}
                                                                title="Reddet"
                                                            >
                                                                <FiXCircle />
                                                            </button>
                                                        )}
                                                        {project.status === 'approved' && (
                                                            <button
                                                                className="btn-action btn-cancel"
                                                                onClick={() => handleStatusChange(project.id, 'pending')}
                                                                title="Onayı İptal Et"
                                                            >
                                                                <FiClock />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-action btn-delete"
                                                            onClick={() => handleDelete(project.id)}
                                                            title="Sil"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Mobile Actions - Sadece menü göster, toggle butonu proje adının önünde */}
                                                    <div className="actions-mobile">
                                                        {/* Mobil menü artık + butonunun altında */}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminProjects;
