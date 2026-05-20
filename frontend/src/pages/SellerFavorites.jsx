import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerAPI } from '../api/seller';
import { getImageUrl } from '../utils/api';
import SellerLayout from '../components/SellerLayout';
import { 
    FiHeart, FiUser, FiPackage, FiSearch, FiFilter, 
    FiCalendar, FiEye, FiX, FiClock, FiTrash2
} from 'react-icons/fi';
import './SellerFavorites.css';

const SellerFavorites = () => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        loadFavorites();
        loadProjects();
    }, []);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getFavorites();
            const favoritesData = response.data.favorites || [];
            setFavorites(favoritesData);
        } catch (error) {
            console.error('Favorites load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProjects = async () => {
        try {
            const response = await sellerAPI.getProjects();
            const projectsData = response.data.projects || [];
            setProjects(projectsData);
        } catch (error) {
            console.error('Projects load error:', error);
        }
    };

    const handleRemoveFavorite = async (favoriteId, username) => {
        if (!window.confirm(`${username} kullanıcısının favorisini kaldırmak istediğinize emin misiniz?`)) {
            return;
        }

        try {
            await sellerAPI.removeFavorite(favoriteId);
            loadFavorites(); // Listeyi yenile
        } catch (error) {
            console.error('Remove favorite error:', error);
            alert('Favori kaldırılırken hata oluştu');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // getImageUrl utility'den import ediliyor

    const filteredFavorites = favorites.filter(fav => {
        const matchesSearch = !searchQuery || 
            fav.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fav.project_title?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesProject = !filterProject || fav.project_id.toString() === filterProject;
        
        return matchesSearch && matchesProject;
    });

    // Proje bazında grupla
    const groupedByProject = filteredFavorites.reduce((acc, fav) => {
        const projectId = fav.project_id;
        if (!acc[projectId]) {
            acc[projectId] = {
                project: {
                    id: fav.project_id,
                    title: fav.project_title,
                    slug: fav.project_slug,
                    category_name: fav.category_name,
                    primary_image: fav.primary_image
                },
                users: []
            };
        }
        acc[projectId].users.push(fav);
        return acc;
    }, {});

    if (loading) {
        return (
            <SellerLayout>
                <div className="seller-favorites-page">
                    <div className="loading-fullscreen">
                        <div className="spinner-large"></div>
                        <p>Favoriler yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="seller-favorites-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                        <div className="page-header-content">
                            <div className="page-title-section">
                                <FiHeart className="page-icon" />
                                <div>
                                    <h1>Favoriler</h1>
                                    <p>Projelerinize favori ekleyen kullanıcıları görüntüleyin ve takip edin</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtreler */}
                    <div className="filters-section">
                        <div className="search-filter">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Kullanıcı veya proje ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button 
                                    className="clear-search"
                                    onClick={() => setSearchQuery('')}
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>
                        <div className="select-filter">
                            <FiFilter className="filter-icon" />
                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Tüm Projeler</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id.toString()}>
                                        {project.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* İstatistikler */}
                    <div className="favorites-stats">
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <FiHeart style={{ color: '#ef4444' }} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{favorites.length}</span>
                                <span className="stat-label">Toplam Favori</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                                <FiPackage style={{ color: '#3b82f6' }} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{Object.keys(groupedByProject).length}</span>
                                <span className="stat-label">Favori Edilen Proje</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                <FiUser style={{ color: '#10b981' }} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">
                                    {new Set(favorites.map(f => f.user_id)).size}
                                </span>
                                <span className="stat-label">Benzersiz Kullanıcı</span>
                            </div>
                        </div>
                    </div>

                    {/* Favori Listesi */}
                    {filteredFavorites.length === 0 ? (
                        <div className="empty-state">
                            <FiHeart className="empty-icon" />
                            <h3>Henüz favori yok</h3>
                            <p>
                                {searchQuery || filterProject 
                                    ? 'Arama kriterlerinize uygun favori bulunamadı.'
                                    : 'Projelerinize henüz favori eklenmemiş.'}
                            </p>
                        </div>
                    ) : (
                        <div className="favorites-list">
                            {Object.values(groupedByProject).map((group, index) => (
                                <div key={group.project.id} className="favorite-group">
                                    <div className="project-header-card">
                                        <Link 
                                            to={`/projects/${group.project.id}`}
                                            className="project-link-card"
                                        >
                                            <div className="project-image-mini">
                                                <img 
                                                    src={getImageUrl(group.project.primary_image)}
                                                    alt={group.project.title}
                                                    onError={(e) => {
                                                        e.target.src = '/img/default.svg';
                                                    }}
                                                />
                                            </div>
                                            <div className="project-info-mini">
                                                <h3>{group.project.title}</h3>
                                                {group.project.category_name && (
                                                    <span className="category-badge">
                                                        {group.project.category_name}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="favorite-count-badge">
                                            <FiHeart />
                                            <span>{group.users.length} favori</span>
                                        </div>
                                    </div>

                                    <div className="users-list">
                                        {group.users.map((fav) => (
                                            <div key={fav.favorite_id} className="user-card">
                                                <div className="user-avatar-section">
                                                    {fav.avatar ? (
                                                        <img 
                                                            src={fav.avatar} 
                                                            alt={fav.username}
                                                            className="user-avatar"
                                                        />
                                                    ) : (
                                                        <div className="user-avatar-placeholder">
                                                            <FiUser />
                                                        </div>
                                                    )}
                                                    <div className="user-info">
                                                        <h4>{fav.username || 'Bilinmeyen Kullanıcı'}</h4>
                                                        {fav.email && (
                                                            <p className="user-email">{fav.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="user-actions">
                                                    <div className="favorited-date">
                                                        <FiCalendar />
                                                        <span>{formatDate(fav.favorited_at)}</span>
                                                    </div>
                                                    <div className="action-buttons">
                                                        <Link 
                                                            to={`/projects/${fav.project_id}`}
                                                            className="view-project-btn"
                                                        >
                                                            <FiEye />
                                                            Projeyi Gör
                                                        </Link>
                                                        <button
                                                            className="remove-favorite-btn"
                                                            onClick={() => handleRemoveFavorite(fav.favorite_id, fav.username)}
                                                            title="Favoriden Çıkar"
                                                        >
                                                            <FiTrash2 />
                                                            Favoriden Çıkar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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

export default SellerFavorites;

