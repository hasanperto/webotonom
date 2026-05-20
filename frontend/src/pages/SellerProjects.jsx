import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerAPI } from '../api/seller';
import { getImageUrl } from '../utils/api';
import SellerLayout from '../components/SellerLayout';
import { 
    FiPackage, FiPlus, FiEdit, FiTrash2, FiEye, FiSearch,
    FiFilter, FiX, FiCheckCircle, FiClock, FiAlertCircle
} from 'react-icons/fi';
import './SellerProjects.css';

const SellerProjects = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        loadProjects();
    }, [filterStatus]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getProjects();
            const projectsData = response.data.projects || [];
            console.log('Loaded projects:', projectsData);
            // Debug: Her projenin primary_image'ini kontrol et
            projectsData.forEach((p, idx) => {
                console.log(`Project ${idx} (ID: ${p.id}):`, {
                    title: p.title,
                    primary_image: p.primary_image,
                    has_images: p.images?.length || 0
                });
            });
            setProjects(projectsData);
        } catch (error) {
            console.error('Projects load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await sellerAPI.deleteProject(id);
            loadProjects();
        } catch (error) {
            alert('Proje silinirken hata oluştu');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'approved': { label: 'Onaylandı', color: '#10b981', icon: FiCheckCircle },
            'pending': { label: 'Beklemede', color: '#f59e0b', icon: FiClock },
            'rejected': { label: 'Reddedildi', color: '#ef4444', icon: FiAlertCircle },
            'active': { label: 'Aktif', color: '#3b82f6', icon: FiCheckCircle },
            'inactive': { label: 'Pasif', color: '#64748b', icon: FiX },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className="status-badge" style={{ backgroundColor: config.color }}>
                <Icon /> {config.label}
            </span>
        );
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = !searchQuery || 
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = !filterStatus || project.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <SellerLayout>
                <div className="seller-projects-page">
                    <div className="loading-fullscreen">
                        <div className="spinner-large"></div>
                        <p>Projeler yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="seller-projects-page">
                <div className="dashboard-content-wrapper">
                <div className="page-header">
                    <div className="header-content">
                        <h1>Projelerim</h1>
                        <p>Yayınladığınız tüm projeleri buradan yönetebilirsiniz</p>
                    </div>
                    <Link to="/seller/add-project" className="btn btn-primary btn-large">
                        <FiPlus /> Yeni Proje Ekle
                    </Link>
                </div>

                {/* Filtreler */}
                <div className="projects-filters">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Proje ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="approved">Onaylandı</option>
                        <option value="pending">Beklemede</option>
                        <option value="rejected">Reddedildi</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                    </select>
                </div>

                {/* Proje Listesi */}
                {filteredProjects.length === 0 ? (
                    <div className="empty-projects">
                        <FiPackage className="empty-icon" />
                        <h3>Henüz proje eklemediniz</h3>
                        <p>İlk projenizi ekleyerek satışa başlayın</p>
                        <Link to="/seller/add-project" className="btn btn-primary">
                            <FiPlus /> İlk Projemi Ekle
                        </Link>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {filteredProjects.map(project => (
                            <div key={project.id} className="project-card-seller">
                                <div className="project-card-header">
                                    {getStatusBadge(project.status)}
                                    <div className="project-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => navigate(`/projects/${project.id}`)}
                                            title="Görüntüle"
                                        >
                                            <FiEye />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => navigate(`/seller/edit-project/${project.id}`)}
                                            title="Düzenle"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDelete(project.id)}
                                            title="Sil"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>

                                <div className="project-image-wrapper">
                                    {(project.primary_image || (project.images && project.images.length > 0)) ? (
                                        <img 
                                            src={
                                                project.primary_image 
                                                    ? getImageUrl(project.primary_image)
                                                    : (project.images && project.images[0]?.image_path
                                                        ? getImageUrl(project.images[0].image_path)
                                                        : null)
                                            } 
                                            alt={project.title}
                                            onError={(e) => {
                                                console.error('Image load error for project', project.id, ':', e.target.src);
                                                e.target.style.display = 'none';
                                                if (e.target.nextSibling) {
                                                    e.target.nextSibling.style.display = 'flex';
                                                }
                                            }}
                                            onLoad={() => {
                                                console.log('Image loaded successfully for project', project.id);
                                            }}
                                        />
                                    ) : null}
                                    <div className="no-image" style={{ 
                                        display: (project.primary_image || (project.images && project.images.length > 0)) ? 'none' : 'flex' 
                                    }}>
                                        <FiPackage />
                                    </div>
                                </div>

                                <div className="project-card-content">
                                    <h3>{project.title}</h3>
                                    <p className="project-description">
                                        {project.short_description || project.description?.substring(0, 100) || 'Açıklama yok'}
                                    </p>
                                    
                                    <div className="project-meta">
                                        <span className="meta-item">
                                            <FiPackage /> {project.category_name || 'Kategori yok'}
                                        </span>
                                        <span className="meta-item price">
                                            ₺{parseFloat(project.price || 0).toLocaleString('tr-TR')}
                                        </span>
                                    </div>

                                    <div className="project-stats">
                                        <span>👁️ {project.views || 0} görüntüleme</span>
                                        <span>⭐ {project.rating || 0} değerlendirme</span>
                                        <span>📥 {project.downloads || 0} indirme</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerProjects;

