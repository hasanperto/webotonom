import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { getImageUrl } from '../utils/api';
import { 
    FiPackage, FiSearch, FiEye, FiCheckCircle, FiXCircle, FiClock,
    FiRefreshCw, FiDollarSign, FiUser, FiTag, FiCalendar, FiEdit, FiTrash2,
    FiTrendingUp, FiPlus, FiAlertCircle
} from 'react-icons/fi';
import './AdminProjects.css';

const AdminProjects = () => {
    const [allProjects, setAllProjects] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loadError, setLoadError] = useState(null);

    const loadProjects = useCallback(async () => {
        try {
            setLoading(true);
            setLoadError(null);
            const response = await api.get('/admin/projects');
            setAllProjects(response.data.projects || []);
        } catch (error) {
            console.error('Projects load error:', error);
            setAllProjects([]);
            setLoadError(
                error.response?.data?.details ||
                    error.response?.data?.error ||
                    'Proje listesi alınamadı. Backend çalışıyor mu kontrol edin.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const filteredProjects = useMemo(() => {
        let list = filter !== 'all'
            ? allProjects.filter((p) => p.status === filter)
            : allProjects;

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(
                (p) =>
                    p.title?.toLowerCase().includes(q) ||
                    p.username?.toLowerCase().includes(q) ||
                    p.category_name?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [allProjects, filter, searchTerm]);

    useEffect(() => {
        setProjects(filteredProjects);
    }, [filteredProjects]);

    const handleStatusChange = async (projectId, newStatus) => {
        if (confirm(`Proje durumunu "${newStatus === 'approved' ? 'Onaylı' : newStatus === 'rejected' ? 'Reddedilen' : 'Beklemede'}" olarak değiştirmek istediğinize emin misiniz?`)) {
            try {
                await api.put(`/admin/projects/${projectId}/status`, { status: newStatus });
                loadProjects();
                // Mobil menüyü kapat
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
            } catch (error) {
                alert(error.response?.data?.error || 'Proje silinemedi');
            }
        }
    };

    const formatDate = (value) =>
        new Date(value).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const renderProjectActions = (project) => (
        <div className="pai-actions">
            <Link
                to={`/projects/${project.id}`}
                className="pai-btn pai-btn--view"
                title="Görüntüle"
            >
                <FiEye /> <span>Görüntüle</span>
            </Link>
            <Link
                to={`/admin/projects/${project.id}/edit`}
                className="pai-btn pai-btn--edit"
                title="Düzenle"
            >
                <FiEdit /> <span>Düzenle</span>
            </Link>
            {project.status !== 'approved' && project.status !== 'active' && (
                <button
                    type="button"
                    className="pai-btn pai-btn--approve"
                    onClick={() => handleStatusChange(project.id, 'approved')}
                >
                    <FiCheckCircle /> <span>Onayla</span>
                </button>
            )}
            {project.status !== 'rejected' && (
                <button
                    type="button"
                    className="pai-btn pai-btn--reject"
                    onClick={() => handleStatusChange(project.id, 'rejected')}
                >
                    <FiXCircle /> <span>Reddet</span>
                </button>
            )}
            {(project.status === 'approved' || project.status === 'active') && (
                <button
                    type="button"
                    className="pai-btn pai-btn--pending"
                    onClick={() => handleStatusChange(project.id, 'pending')}
                >
                    <FiClock /> <span>Beklet</span>
                </button>
            )}
            <button
                type="button"
                className="pai-btn pai-btn--delete"
                onClick={() => handleDelete(project.id)}
            >
                <FiTrash2 /> <span>Sil</span>
            </button>
        </div>
    );

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
                    <div className="header-actions">
                        <Link to="/admin/projects/new" className="btn-primary">
                            <FiPlus /> Proje Ekle
                        </Link>
                        <button type="button" className="btn-refresh" onClick={loadProjects}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
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

                {loadError && (
                    <div className="bot-error-banner">
                        <FiAlertCircle />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* Projects Table - Modern List */}
                {!loadError && projects.length === 0 ? (
                    <div className="empty-state-minimal">
                        <FiPackage className="empty-icon" />
                        <h3>Proje bulunamadı</h3>
                        <p>
                            {allProjects.length === 0
                                ? 'Henüz kayıtlı proje yok.'
                                : 'Seçili filtreye uygun proje yok.'}
                        </p>
                    </div>
                ) : !loadError ? (
                    <div className="projects-list-shell">
                        <div className="projects-list-head" aria-hidden="true">
                            <span>Proje</span>
                            <span>Satıcı</span>
                            <span>Kategori</span>
                            <span>Fiyat</span>
                            <span>Durum</span>
                            <span>Tarih</span>
                            <span>İşlemler</span>
                        </div>
                        <ul className="projects-list">
                            {projects.map((project) => {
                                const statusInfo = getStatusBadge(project.status);
                                const StatusIcon = statusInfo.icon;
                                const thumbSrc = project.primary_image
                                    ? getImageUrl(project.primary_image)
                                    : null;

                                return (
                                    <li key={project.id} className="project-admin-item">
                                        <div className="pai-col pai-col--project">
                                            <div className="pai-project">
                                                {thumbSrc ? (
                                                    <img
                                                        src={thumbSrc}
                                                        alt=""
                                                        className="pai-thumb"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="pai-thumb pai-thumb--empty">
                                                        <FiPackage />
                                                    </div>
                                                )}
                                                <div className="pai-project-text">
                                                    <Link
                                                        to={`/projects/${project.id}`}
                                                        className="pai-title"
                                                    >
                                                        {project.title || 'İsimsiz Proje'}
                                                    </Link>
                                                    {project.short_description && (
                                                        <p className="pai-desc">
                                                            {project.short_description}
                                                        </p>
                                                    )}
                                                    <div className="pai-mobile-meta">
                                                        <span>
                                                            <FiUser /> {project.username || '—'}
                                                        </span>
                                                        <span>
                                                            <FiTag />{' '}
                                                            {project.category_name || '—'}
                                                        </span>
                                                        <span className="pai-mobile-price">
                                                            {formatPrice(project.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pai-col pai-col--seller">
                                            <span className="pai-label">Satıcı</span>
                                            <span className="pai-value">
                                                <FiUser /> {project.username || 'Bilinmeyen'}
                                            </span>
                                        </div>

                                        <div className="pai-col pai-col--category">
                                            <span className="pai-label">Kategori</span>
                                            <span className="pai-value">
                                                <FiTag /> {project.category_name || '—'}
                                            </span>
                                        </div>

                                        <div className="pai-col pai-col--price">
                                            <span className="pai-label">Fiyat</span>
                                            <span className="pai-value pai-value--price">
                                                {formatPrice(project.price)}
                                            </span>
                                        </div>

                                        <div className="pai-col pai-col--status">
                                            <span className="pai-label">Durum</span>
                                            <span
                                                className={`status-badge-minimal ${statusInfo.class}`}
                                            >
                                                <StatusIcon />
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        <div className="pai-col pai-col--date">
                                            <span className="pai-label">Tarih</span>
                                            <span className="pai-value">
                                                <FiCalendar /> {formatDate(project.created_at)}
                                            </span>
                                        </div>

                                        <div className="pai-col pai-col--actions">
                                            <span className="pai-label">İşlemler</span>
                                            {renderProjectActions(project)}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : null}
            </div>
        </AdminLayout>
    );
};

export default AdminProjects;
