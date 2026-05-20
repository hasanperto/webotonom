import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiStar, FiDownload, FiSearch, FiFilter, FiTag, FiArrowRight, FiShoppingCart, FiHeart, FiEye, FiCalendar, FiPackage, FiX, FiChevronDown, FiChevronUp, FiDollarSign, FiTrendingUp, FiClock, FiGift } from 'react-icons/fi';
import { projectsAPI } from '../api/projects';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getTechIcon } from '../utils/techIcons';
import { getImageUrl } from '../utils/api';
import DonationModal from '../components/DonationModal';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { RevealOnScroll, MotionCard } from '../components/motion';
import { staggerContainer, staggerItem, motionEase } from '../utils/motion';
import './Projects.css';

/** Gelişmiş filtre formu (masaüstü panel + mobil sheet) — sıralama üst toolbar’da */
function ProjectsAdvancedFiltersForm({ filters, setFilters, categories, tags, t }) {
    const clearAll = () => {
        setFilters({
            category: '',
            minPrice: '',
            maxPrice: '',
            selectedTags: [],
            status: '',
            sortBy: 'newest',
            minRating: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    return (
        <>
            <div className="filters-grid">
                <div className="filter-group">
                    <label>
                        <FiTag className="filter-label-icon" />
                        {t('projects.category') || 'Kategori'}
                    </label>
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">{t('projects.all_categories') || 'Tüm Kategoriler'}</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>
                        <FiTrendingUp className="filter-label-icon" />
                        {t('projects.status') || 'Durum'}
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">{t('projects.all_statuses') || 'Tüm Durumlar'}</option>
                        <option value="completed">{t('projects.completed') || 'Tamamlanmış'}</option>
                        <option value="in-progress">{t('projects.in_progress') || 'Geliştiriliyor'}</option>
                        <option value="free">{t('projects.free') || 'Ücretsiz'}</option>
                    </select>
                </div>

                <div className="filter-group filter-group-price">
                    <label>
                        <FiDollarSign className="filter-label-icon" />
                        {t('projects.price_range') || 'Fiyat Aralığı'}
                    </label>
                    <div className="price-range">
                        <input
                            type="number"
                            placeholder={t('projects.min') || 'Min'}
                            value={filters.minPrice}
                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            className="price-input"
                            min="0"
                        />
                        <span className="price-separator">-</span>
                        <input
                            type="number"
                            placeholder={t('projects.max') || 'Max'}
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            className="price-input"
                            min="0"
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label>
                        <FiStar className="filter-label-icon" />
                        {t('projects.minimum_rating') || 'Minimum Puan'}
                    </label>
                    <select
                        value={filters.minRating}
                        onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">{t('projects.all_ratings') || 'Tüm Puanlar'}</option>
                        <option value="4">4+ {t('projects.stars') || 'Yıldız'}</option>
                        <option value="3">3+ {t('projects.stars') || 'Yıldız'}</option>
                        <option value="2">2+ {t('projects.stars') || 'Yıldız'}</option>
                        <option value="1">1+ {t('projects.stars') || 'Yıldız'}</option>
                    </select>
                </div>

                <div className="filter-group filter-group-tags">
                    <label>
                        <FiTag className="filter-label-icon" />
                        {t('projects.technologies') || 'Teknolojiler'}
                    </label>
                    <div className="tags-filter">
                        {tags.slice(0, 10).map((tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                className={`tag-filter-btn ${filters.selectedTags.includes(tag.id.toString()) ? 'active' : ''}`}
                                onClick={() => {
                                    const tagId = tag.id.toString();
                                    setFilters({
                                        ...filters,
                                        selectedTags: filters.selectedTags.includes(tagId)
                                            ? filters.selectedTags.filter((id) => id !== tagId)
                                            : [...filters.selectedTags, tagId]
                                    });
                                }}
                            >
                                {getTechIcon(tag.name)} {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="filters-actions">
                <button type="button" className="btn-clear-filters" onClick={clearAll}>
                    <FiX />
                    {t('projects.clear_filters') || 'Filtreleri Temizle'}
                </button>
            </div>
        </>
    );
}

const Projects = () => {
    const { isAuthenticated } = useAuth();
    const { addToCart: addToCartContext } = useCart();
    const { language, t } = useLanguage();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [favorites, setFavorites] = useState(new Set());
    const [addingToCart, setAddingToCart] = useState({});
    const [donationModal, setDonationModal] = useState({ isOpen: false, project: null });
    const reduceMotion = useReducedMotion();
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 1025 : false
    );

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1025);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Gelişmiş Filtreleme State'leri
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        minPrice: '',
        maxPrice: '',
        selectedTags: [],
        status: '', // 'completed', 'in-progress', 'free', ''
        sortBy: 'newest', // 'newest', 'popular', 'price-asc', 'price-desc', 'downloads', 'rating'
        minRating: '',
        dateFrom: '',
        dateTo: ''
    });

    useEffect(() => {
        if (showAdvancedFilters && isMobile) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prev;
            };
        }
        return undefined;
    }, [showAdvancedFilters, isMobile]);

    useEffect(() => {
        loadProjects();
        loadCategories();
        loadTags();
        if (isAuthenticated) {
            loadFavorites();
        }
    }, [selectedCategory, search, isAuthenticated, filters, language]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const params = { lang: language };
            if (selectedCategory) params.category = selectedCategory;
            if (search) params.search = search;
            
            // Gelişmiş filtreler
            if (filters.category) params.category = filters.category;
            if (filters.minPrice) params.min_price = filters.minPrice;
            if (filters.maxPrice) params.max_price = filters.maxPrice;
            if (filters.selectedTags.length > 0) params.tags = filters.selectedTags.join(',');
            if (filters.status) params.status = filters.status;
            if (filters.sortBy) params.sort_by = filters.sortBy;
            if (filters.minRating) params.min_rating = filters.minRating;
            if (filters.dateFrom) params.date_from = filters.dateFrom;
            if (filters.dateTo) params.date_to = filters.dateTo;
            
            const response = await projectsAPI.getAll(params);
            let projectsData = response.data.projects || [];
            
            // Client-side filtreleme (eğer backend desteklemiyorsa)
            if (filters.status) {
                projectsData = projectsData.filter(p => {
                    const isCompleted = p.completion_percentage === 100;
                    const isInProgress = p.completion_percentage < 100 && p.completion_percentage > 0;
                    const isFree = isCompleted && parseFloat(p.price) === 0;
                    
                    if (filters.status === 'completed') return isCompleted && !isFree;
                    if (filters.status === 'in-progress') return isInProgress;
                    if (filters.status === 'free') return isFree;
                    return true;
                });
            }
            
            // Fiyat filtreleme
            if (filters.minPrice || filters.maxPrice) {
                projectsData = projectsData.filter(p => {
                    const price = parseFloat(p.discount_price || p.price || 0);
                    if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
                    if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
                    return true;
                });
            }
            
            // Rating filtreleme
            if (filters.minRating) {
                projectsData = projectsData.filter(p => {
                    const rating = parseFloat(p.rating || 0);
                    return rating >= parseFloat(filters.minRating);
                });
            }
            
            // Sıralama
            if (filters.sortBy === 'newest') {
                projectsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (filters.sortBy === 'popular') {
                projectsData.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
            } else if (filters.sortBy === 'price-asc') {
                projectsData.sort((a, b) => parseFloat(a.discount_price || a.price || 0) - parseFloat(b.discount_price || b.price || 0));
            } else if (filters.sortBy === 'price-desc') {
                projectsData.sort((a, b) => parseFloat(b.discount_price || b.price || 0) - parseFloat(a.discount_price || a.price || 0));
            } else if (filters.sortBy === 'downloads') {
                projectsData.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
            } else if (filters.sortBy === 'rating') {
                projectsData.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
            }
            
            setProjects(projectsData);
        } catch (error) {
            console.error('Projects load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await projectsAPI.getCategories();
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Categories load error:', error);
        }
    };

    const loadTags = async () => {
        try {
            const response = await projectsAPI.getAll({ limit: 1000, lang: language });
            const allTags = new Set();
            (response.data.projects || []).forEach(project => {
                if (project.tags) {
                    project.tags.forEach(tag => allTags.add(JSON.stringify({ id: tag.id, name: tag.name })));
                }
            });
            setTags(Array.from(allTags).map(t => JSON.parse(t)));
        } catch (error) {
            console.error('Tags load error:', error);
        }
    };

    const loadFavorites = async () => {
        try {
            const response = await usersAPI.getFavorites();
            const favs = response.data.favorites || [];
            // Backend'den gelen favorilerde id (proje id'si) var
            const favoriteIds = favs.map(fav => parseInt(fav.id || fav.project_id || 0)).filter(id => id > 0);
            setFavorites(new Set(favoriteIds));
            console.log('Loaded favorites:', favoriteIds, 'from', favs);
        } catch (error) {
            console.error('Favorites load error:', error);
            // Hata durumunda boş Set kullan
            setFavorites(new Set());
        }
    };

    const handleToggleFavorite = async (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            await usersAPI.toggleFavorite(projectId);
            setFavorites(prev => {
                const newFavs = new Set(prev);
                const projectIdNum = parseInt(projectId);
                if (newFavs.has(projectIdNum)) {
                    newFavs.delete(projectIdNum);
                } else {
                    newFavs.add(projectIdNum);
                }
                return newFavs;
            });
        } catch (error) {
            alert(error.response?.data?.error || t('projects.favorite_error') || 'Favori işlemi başarısız');
        }
    };

    const calculateDiscount = (price, discountPrice) => {
        if (!discountPrice) return 0;
        return Math.round(((price - discountPrice) / price) * 100);
    };

    const showCartNotification = (message) => {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2500);
    };

    const handleAddToCart = async (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (addingToCart[projectId]) return;

        try {
            setAddingToCart(prev => ({ ...prev, [projectId]: true }));

            const button = e.currentTarget;
            const buttonRect = button.getBoundingClientRect();
            const cartIcon = document.querySelector('.cart-icon-animation-target') ||
                document.querySelector('a[href="/cart"]');

            if (cartIcon) {
                const cartRect = cartIcon.getBoundingClientRect();
                const animationElement = document.createElement('div');
                animationElement.className = 'cart-animation-item';
                animationElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
                document.body.appendChild(animationElement);
                animationElement.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
                animationElement.style.top = `${buttonRect.top + buttonRect.height / 2}px`;

                requestAnimationFrame(() => {
                    animationElement.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    animationElement.style.left = `${cartRect.left + cartRect.width / 2}px`;
                    animationElement.style.top = `${cartRect.top + cartRect.height / 2}px`;
                    animationElement.style.transform = 'translate(-50%, -50%) scale(0.3)';
                    animationElement.style.opacity = '0';
                });

                setTimeout(() => {
                    if (document.body.contains(animationElement)) {
                        document.body.removeChild(animationElement);
                    }
                }, 600);
            }

            const result = await addToCartContext(projectId, 1);

            if (result.success) {
                showCartNotification(t('projects.added_to_cart') || 'Sepete eklendi!');
            } else {
                alert(result.error || t('projects.cart_error') || 'Sepete eklenemedi');
            }
        } catch (error) {
            alert(error.response?.data?.error || t('projects.cart_error') || 'Sepete eklenemedi');
        } finally {
            setAddingToCart(prev => ({ ...prev, [projectId]: false }));
        }
    };

    const sortSegmentOptions = useMemo(
        () => [
            { key: 'newest', label: t('projects.newest') || 'En Yeni' },
            { key: 'popular', label: t('projects.popular') || 'Popüler' },
            { key: 'rating', label: t('projects.highest_rated') || 'Puan' },
            { key: 'price-asc', label: t('projects.price_low_to_high') || 'Fiyat ↑' },
            { key: 'price-desc', label: t('projects.price_high_to_low') || 'Fiyat ↓' },
            { key: 'downloads', label: t('projects.most_downloaded') || 'İndirme' }
        ],
        [t]
    );

    const filterChips = useMemo(() => {
        const chips = [];
        const q = search.trim();
        if (q) {
            chips.push({
                id: 'search',
                label: `"${q.length > 28 ? `${q.slice(0, 28)}…` : q}"`,
                onRemove: () => setSearch('')
            });
        }
        if (filters.category) {
            const cat = categories.find((c) => c.slug === filters.category);
            chips.push({
                id: 'category',
                label: cat?.name || filters.category,
                onRemove: () => setFilters((f) => ({ ...f, category: '' }))
            });
        }
        if (filters.status) {
            const map = {
                completed: t('projects.completed') || 'Tamamlanmış',
                'in-progress': t('projects.in_progress') || 'Geliştiriliyor',
                free: t('projects.free') || 'Ücretsiz'
            };
            chips.push({
                id: 'status',
                label: map[filters.status] || filters.status,
                onRemove: () => setFilters((f) => ({ ...f, status: '' }))
            });
        }
        if (filters.minPrice || filters.maxPrice) {
            chips.push({
                id: 'price',
                label: `${filters.minPrice || '0'} – ${filters.maxPrice || '∞'}`,
                onRemove: () => setFilters((f) => ({ ...f, minPrice: '', maxPrice: '' }))
            });
        }
        if (filters.minRating) {
            chips.push({
                id: 'rating',
                label: `${filters.minRating}+ ★`,
                onRemove: () => setFilters((f) => ({ ...f, minRating: '' }))
            });
        }
        filters.selectedTags.forEach((tid) => {
            const tag = tags.find((x) => x.id.toString() === tid);
            chips.push({
                id: `tag-${tid}`,
                label: tag?.name || tid,
                onRemove: () =>
                    setFilters((f) => ({
                        ...f,
                        selectedTags: f.selectedTags.filter((id) => id !== tid)
                    }))
            });
        });
        if (filters.sortBy && filters.sortBy !== 'newest') {
            const sortLabels = {
                popular: t('projects.popular') || 'Popüler',
                'price-asc': t('projects.price_low_to_high') || 'Fiyat artan',
                'price-desc': t('projects.price_high_to_low') || 'Fiyat azalan',
                downloads: t('projects.most_downloaded') || 'İndirme',
                rating: t('projects.highest_rated') || 'Puan'
            };
            chips.push({
                id: 'sort',
                label: sortLabels[filters.sortBy] || filters.sortBy,
                onRemove: () => setFilters((f) => ({ ...f, sortBy: 'newest' }))
            });
        }
        return chips;
    }, [search, filters, categories, tags, t]);

    const gridListVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.06, 0.04);
    const gridItemVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : staggerItem;

    return (
        <div className="projects-page">
            <RevealOnScroll className="projects-hero" amount={0.2}>
                <div className="container">
                    <h1>{t('projects.title') || 'Projeleri Keşfedin'}</h1>
                    <p>{t('projects.subtitle') || 'Binlerce kaliteli yazılım projesi arasından seçim yapın'}</p>
                </div>
            </RevealOnScroll>

            <div className="container">
                {/* Gelişmiş Filtreleme Bölümü */}
                <div className="advanced-filters-section">
                    <div className="filters-header">
                        <div className="search-box-main">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder={t('projects.search_placeholder') || 'Proje, teknoloji veya açıklama ara...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-input-main"
                            />
                        </div>
                        <button 
                            className={`btn-advanced-toggle ${showAdvancedFilters ? 'active' : ''}`}
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            <FiFilter />
                            <span>{t('projects.advanced_search') || 'Gelişmiş Arama'}</span>
                            {showAdvancedFilters ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                    </div>

                    {showAdvancedFilters && !isMobile && (
                        <div className="advanced-filters-panel">
                            <ProjectsAdvancedFiltersForm
                                filters={filters}
                                setFilters={setFilters}
                                categories={categories}
                                tags={tags}
                                t={t}
                            />
                        </div>
                    )}
                </div>

                <div className="projects-toolbar">
                    <div
                        className="projects-sort-segmented"
                        role="tablist"
                        aria-label={t('projects.sort_by') || 'Sıralama'}
                    >
                        {sortSegmentOptions.map((opt) => (
                            <button
                                key={opt.key}
                                type="button"
                                role="tab"
                                aria-selected={filters.sortBy === opt.key}
                                className={`sort-segment-btn ${filters.sortBy === opt.key ? 'active' : ''}`}
                                onClick={() => setFilters({ ...filters, sortBy: opt.key })}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {filterChips.length > 0 && (
                        <div className="projects-active-chips">
                            {filterChips.map((c) => (
                                <button key={c.id} type="button" className="filter-chip" onClick={c.onRemove}>
                                    <span>{c.label}</span>
                                    <FiX aria-hidden />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="projects-grid projects-grid--skeleton" aria-busy="true">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="project-card-skeleton">
                                <div className="skeleton-shimmer skeleton-image" />
                                <div className="skeleton-shimmer skeleton-line w-80" />
                                <div className="skeleton-shimmer skeleton-line w-60" />
                                <div className="skeleton-shimmer skeleton-line w-40" />
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="no-projects">
                        <div className="no-projects-icon">📦</div>
                        <h3>{t('projects.no_projects_found') || 'Proje bulunamadı'}</h3>
                        <p>{t('projects.no_projects_message') || 'Aradığınız kriterlere uygun proje bulunmamaktadır.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="projects-stats">
                            <span>{projects.length} {t('projects.projects_found') || 'proje bulundu'}</span>
                        </div>
                        <M.div
                            className="projects-grid"
                            variants={gridListVariants}
                            initial="hidden"
                            animate="show"
                            key={`${projects.length}-${filters.sortBy}-${search}-${filterChips.length}`}
                        >
                            {projects.map((project) => {
                                const discount = calculateDiscount(project.price, project.discount_price);
                                const completionPercentage = project.completion_percentage || 0;
                                const isCompleted = completionPercentage === 100;
                                const isInProgress = completionPercentage < 100 && completionPercentage > 0;
                                const isFree = parseFloat(project.price) === 0;
                                
                                // Primary image URL
                                let projectImage = '/img/default.svg';
                                if (project.primary_image) {
                                    projectImage = getImageUrl(project.primary_image);
                                } else if (project.images && project.images.length > 0) {
                                    const firstImage = project.images[0];
                                    const imagePath = firstImage.image_path || firstImage;
                                    if (typeof imagePath === 'string') {
                                        projectImage = getImageUrl(imagePath);
                                    }
                                }
                                
                                return (
                                    <M.div key={project.id} variants={gridItemVariants}>
                                        <MotionCard
                                            className={`project-card detailed ${project.featured ? 'featured' : ''}`}
                                            enableHover={!reduceMotion && !isMobile}
                                        >
                                        <Link to={`/projects/${project.id}`} className="project-link" data-discover="true">
                                            <div className="project-image-wrapper">
                                                <img 
                                                    src={projectImage} 
                                                    alt={project.title}
                                                    className="project-image"
                                                    onError={(e) => {
                                                        e.target.src = '/img/default.svg';
                                                    }}
                                                />
                                                
                                                {/* Badge'ler - Sol Üst */}
                                                <div className="project-badges-top">
                                                    {project.featured === 1 || project.featured === true ? (
                                                        <span className="badge badge-featured">
                                                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                            </svg> {t('projects.featured') || 'Öne Çıkan'}
                                                        </span>
                                                    ) : null}
                                                    {project.category_name ? (
                                                        <span className="badge badge-category">
                                                            {project.category_name}
                                                        </span>
                                                    ) : null}
                                                    {isInProgress ? (
                                                        <span className="badge badge-in-progress">
                                                            <FiClock /> {t('projects.in_progress') || 'Devam Ediyor'}
                                                        </span>
                                                    ) : null}
                                                    {isInProgress && completionPercentage ? (
                                                        <span className="badge badge-completion-left">
                                                            %{completionPercentage}
                                                        </span>
                                                    ) : null}
                                                    {isCompleted && !isFree ? (
                                                        <span className="badge badge-completed">
                                                            {t('projects.completed') || 'Tamamlandı'}
                                                        </span>
                                                    ) : null}
                                                    {isFree ? (
                                                        <span className="badge badge-free">
                                                            {t('projects.free') || 'Ücretsiz'}
                                                        </span>
                                                    ) : null}
                                                    {discount > 0 ? (
                                                        <span className="badge badge-discount">
                                                            -{discount}%
                                                        </span>
                                                    ) : null}
                                                </div>
                                                
                                                {/* Favori Butonu - Sağ Üst Köşe */}
                                                {isAuthenticated && (
                                                    <button
                                                        className={`favorite-button-top ${favorites.has(parseInt(project.id)) ? 'active' : ''}`}
                                                        onClick={(e) => handleToggleFavorite(e, project.id)}
                                                        title={favorites.has(parseInt(project.id)) ? (t('projects.remove_from_favorites') || 'Favorilerden Çıkar') : (t('projects.add_to_favorites') || 'Favorilere Ekle')}
                                                    >
                                                        <FiHeart className={favorites.has(parseInt(project.id)) ? 'filled' : ''} />
                                                    </button>
                                                )}
                                                
                                                {/* Overlay */}
                                                <div className="project-overlay">
                                                    <div className="project-overlay-content">
                                                        <span className="view-details">
                                                            {t('projects.view_details') || 'Detayları Gör'} <FiArrowRight />
                                                        </span>
                                                        <div className="project-overlay-actions">
                                                            {isInProgress && project.donation_target ? (
                                                                <button
                                                                    className="btn-overlay btn-donate-overlay"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        setDonationModal({ isOpen: true, project });
                                                                    }}
                                                                    title={t('projects.donate') || 'Bağış Yap'}
                                                                >
                                                                    <FiGift />
                                                                </button>
                                                            ) : null}
                                                            {!isFree && !isInProgress && (
                                                                <button
                                                                    className="btn-overlay btn-cart"
                                                                    onClick={(e) => handleAddToCart(e, project.id)}
                                                                    disabled={addingToCart[project.id]}
                                                                    title={t('projects.add_to_cart') || 'Sepete Ekle'}
                                                                >
                                                                    <FiShoppingCart />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="project-info">
                                                {/* Satıcı ve Rating */}
                                                <div className="project-seller-rating">
                                                    <div className="project-seller">
                                                        <span className="seller-avatar">👤</span>
                                                        <span className="seller-name">{project.username || 'Bilinmeyen'}</span>
                                                    </div>
                                                    {project.rating && parseFloat(project.rating) > 0 && (
                                                        <div className="project-rating">
                                                            <FiStar className="star filled" />
                                                            <span>{parseFloat(project.rating).toFixed(1)}</span>
                                                            <span className="rating-count">({project.rating_count || 0})</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Proje Başlığı */}
                                                <h3 className="project-title">{project.title}</h3>
                                                
                                                {/* Kısa Açıklama */}
                                                {project.short_description && (
                                                    <p className="project-short-desc">{project.short_description}</p>
                                                )}
                                                
                                                {/* Kullanılan Teknolojiler */}
                                                {project.tags && project.tags.length > 0 && (
                                                    <div className="project-technologies">
                                                        {project.tags.slice(0, 3).map((tag, index) => (
                                                            <span 
                                                                key={tag.id || index} 
                                                                className="tech-badge"
                                                                title={tag.name}
                                                            >
                                                                <span className="tech-icon">{getTechIcon(tag.name)}</span>
                                                                <span className="tech-name">{tag.name}</span>
                                                            </span>
                                                        ))}
                                                        {project.tags.length > 3 && (
                                                            <span className="tech-badge tech-more" title={`+${project.tags.length - 3} teknoloji daha`}>
                                                                +{project.tags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Fiyat ve İstatistikler */}
                                                <div className="project-footer">
                                                    <div className="project-price project-footer-price">
                                                        {isInProgress && project.donation_target ? (
                                                            <div className="donation-info">
                                                                <div className="donation-amounts">
                                                                    <span className="donation-received">
                                                                        {formatPrice(project.donation_received || 0, project.currency || 'TRY')}
                                                                    </span>
                                                                    <span className="donation-separator">/</span>
                                                                    <span className="donation-target">
                                                                        {formatPrice(project.donation_target, project.currency || 'TRY')}
                                                                    </span>
                                                                </div>
                                                                <div className="donation-progress-bar">
                                                                    <div 
                                                                        className="donation-progress-fill"
                                                                        style={{ width: `${completionPercentage}%` }}
                                                                    ></div>
                                                                </div>
                                                                <div className="donation-percentage">
                                                                    %{completionPercentage} {t('projects.completed') || 'tamamlandı'}
                                                                </div>
                                                            </div>
                                                        ) : isFree ? (
                                                            <span className="new-price">{t('projects.free') || 'Ücretsiz'}</span>
                                                        ) : project.discount_price ? (
                                                            <>
                                                                {project.price && (
                                                                    <span className="old-price">{formatPrice(project.price, project.currency || 'TRY')}</span>
                                                                )}
                                                                <span className="new-price">{formatPrice(project.discount_price, project.currency || 'TRY')}</span>
                                                            </>
                                                        ) : (
                                                            <span className="new-price">{formatPrice(project.price, project.currency || 'TRY')}</span>
                                                        )}
                                                    </div>
                                                    <div className="project-stats-footer">
                                                        <span className="stat-item">
                                                            <FiDownload /> {project.download_count || 0}
                                                        </span>
                                                        <span className="stat-item">
                                                            <FiEye /> {project.view_count || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Alt Butonlar */}
                                                <div className="project-actions-bottom">
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        data-discover="true"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            navigate(`/projects/${project.id}`);
                                                        }}
                                                    >
                                                        <FiArrowRight /> {t('projects.details') || 'Detaylar'}
                                                    </button>
                                                    {isInProgress && project.donation_target ? (
                                                        <button
                                                            className="btn btn-donate btn-sm"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setDonationModal({ isOpen: true, project });
                                                            }}
                                                        >
                                                            <FiGift /> {t('projects.donate') || 'Bağış Yap'}
                                                        </button>
                                                    ) : !isFree && !isInProgress ? (
                                                        <button 
                                                            className="btn btn-outline btn-sm btn-cart-action"
                                                            onClick={(e) => handleAddToCart(e, project.id)}
                                                            disabled={addingToCart[project.id]}
                                                        >
                                                            <FiShoppingCart /> {addingToCart[project.id] ? (t('projects.adding') || 'Ekleniyor...') : (t('projects.add_to_cart') || 'Sepete Ekle')}
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </Link>
                                        </MotionCard>
                                    </M.div>
                                );
                            })}
                        </M.div>
                    </>
                )}

                <AnimatePresence>
                    {showAdvancedFilters && isMobile ? (
                        <>
                            <M.button
                                key="backdrop"
                                type="button"
                                className="projects-filter-sheet-backdrop"
                                aria-label="Kapat"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAdvancedFilters(false)}
                            />
                            <M.div
                                key="sheet"
                                className="projects-filter-sheet"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="projects-filter-sheet-title"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            >
                                <div className="projects-filter-sheet-header">
                                    <h2 id="projects-filter-sheet-title">{t('projects.advanced_search') || 'Filtreler'}</h2>
                                    <button
                                        type="button"
                                        className="projects-filter-sheet-close"
                                        onClick={() => setShowAdvancedFilters(false)}
                                        aria-label="Kapat"
                                    >
                                        <FiX />
                                    </button>
                                </div>
                                <div className="projects-filter-sheet-body">
                                    <ProjectsAdvancedFiltersForm
                                        filters={filters}
                                        setFilters={setFilters}
                                        categories={categories}
                                        tags={tags}
                                        t={t}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary projects-filter-sheet-apply"
                                        onClick={() => setShowAdvancedFilters(false)}
                                    >
                                        {t('projects.apply_filters') || 'Uygula'}
                                    </button>
                                </div>
                            </M.div>
                        </>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Bağış Modal */}
            {donationModal.isOpen && donationModal.project && (
                <DonationModal
                    isOpen={donationModal.isOpen}
                    onClose={() => setDonationModal({ isOpen: false, project: null })}
                    project={donationModal.project}
                />
            )}
        </div>
    );
};

export default Projects;
