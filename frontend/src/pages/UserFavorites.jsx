import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { usersAPI } from '../api/users';
import { useLanguage } from '../context/LanguageContext';
import { cartAPI } from '../api/cart';
import { getImageUrl } from '../utils/api';
import { 
    FiHeart, FiTrash2, FiEye, FiShoppingCart,
    FiStar, FiDownload, FiCalendar
} from 'react-icons/fi';
import './UserFavorites.css';

const UserFavorites = () => {
    const { t, language } = useLanguage();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, [language]);

    const loadFavorites = async () => {
        try {
            const response = await usersAPI.getFavorites({ lang: language });
            setFavorites(response.data.favorites || []);
        } catch (error) {
            console.error('Favorites load error:', error);
            alert(t('favorites.errors.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (projectId) => {
        if (!window.confirm(t('favorites.confirm.remove'))) {
            return;
        }

        try {
            await usersAPI.toggleFavorite(projectId);
            setFavorites(favorites.filter(fav => fav.id !== projectId));
            alert(t('favorites.success.removed'));
        } catch (error) {
            console.error('Remove favorite error:', error);
            alert(error.response?.data?.error || t('favorites.errors.remove_failed'));
        }
    };


    const formatPrice = (price) => {
        if (!price || price === '0.00') return t('favorites.price.free');
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '₺0';
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        // Eğer ondalık kısım .00 ise tam sayı olarak göster
        if (numPrice % 1 === 0) {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(numPrice);
        }
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numPrice);
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="user-favorites-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('favorites.loading')}</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="user-favorites-page">
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <FiHeart className="title-icon" />
                            {t('favorites.title')}
                        </h1>
                        <p className="page-subtitle">
                            {t('favorites.subtitle', { count: favorites.length })}
                        </p>
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <div className="empty-state">
                        <FiHeart className="empty-icon" />
                        <h3>{t('favorites.empty.title')}</h3>
                        <p>{t('favorites.empty.description')}</p>
                        <Link to="/projects" className="btn btn-primary">
                            {t('favorites.empty.explore_projects')}
                        </Link>
                    </div>
                ) : (
                    <div className="favorites-grid">
                        {favorites.map(project => (
                            <div key={project.id} className="favorite-card">
                                <div className="favorite-image-wrapper">
                                    <Link to={`/projects/${project.id}`}>
                                        <img 
                                            src={getImageUrl(project.primary_image)} 
                                            alt={project.title}
                                            onError={(e) => {
                                                e.target.src = '/img/default.svg';
                                            }}
                                        />
                                    </Link>
                                    <button
                                        className="remove-favorite-btn"
                                        onClick={() => handleRemoveFavorite(project.id)}
                                        title={t('favorites.actions.remove')}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>

                                <div className="favorite-content">
                                    <div className="favorite-header">
                                        <Link to={`/projects/${project.id}`}>
                                            <h3 className="favorite-title">{project.title}</h3>
                                        </Link>
                                        {project.category_name && (
                                            <span className="favorite-category">
                                                {project.category_name}
                                            </span>
                                        )}
                                    </div>

                                    <p className="favorite-description">
                                        {project.short_description || t('favorites.no_description')}
                                    </p>

                                    <div className="favorite-footer">
                                        <div className="favorite-price">
                                            {project.discount_price ? (
                                                <>
                                                    <span className="old-price">{formatPrice(project.price)}</span>
                                                    <span className="new-price">{formatPrice(project.discount_price)}</span>
                                                </>
                                            ) : (
                                                <span className="new-price">{formatPrice(project.price)}</span>
                                            )}
                                        </div>

                                        {project.rating && (
                                            <div className="favorite-rating">
                                                <FiStar className="star-icon filled" />
                                                <span>{parseFloat(project.rating).toFixed(1)}</span>
                                                <span className="rating-count">({project.rating_count || 0})</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="favorite-actions">
                                        <Link 
                                            to={`/projects/${project.id}`}
                                            className="btn btn-primary btn-sm"
                                        >
                                            <FiEye className="btn-icon" />
                                            {t('favorites.actions.view_details')}
                                        </Link>
                                        <button 
                                            className="btn btn-outline btn-sm"
                                            onClick={async () => {
                                                try {
                                                    await cartAPI.addToCart(project.id, 1);
                                                    alert(t('favorites.success.added_to_cart'));
                                                } catch (error) {
                                                    console.error('Add to cart error:', error);
                                                    alert(error.response?.data?.error || t('favorites.errors.add_to_cart_failed'));
                                                }
                                            }}
                                        >
                                            <FiShoppingCart className="btn-icon" />
                                            {t('favorites.actions.add_to_cart')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
};

export default UserFavorites;

