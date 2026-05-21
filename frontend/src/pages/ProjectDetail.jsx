import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiHeart, FiGlobe, FiShield, FiEye, FiDownload, FiStar, FiCalendar, FiInfo, FiCode, FiFileText, FiUsers, FiUserPlus, FiChevronLeft, FiChevronRight, FiPackage, FiTrendingUp, FiZap, FiAward, FiGift } from 'react-icons/fi';
import { FaWhatsapp, FaTwitter, FaFacebookF, FaLinkedinIn, FaTelegramPlane, FaRedditAlien, FaEnvelope } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import { projectsAPI } from '../api/projects';
import { donationsAPI } from '../api/donations';
import { reviewsAPI } from '../api/reviews';
import { cartAPI } from '../api/cart';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useModules } from '../context/ModulesContext';
import { getTechIcon } from '../utils/techIcons';
import { getImageUrl } from '../utils/api';
import ProjectGallerySlider from '../components/ProjectGallerySlider';
import DonationModal from '../components/DonationModal';
import { AnimatePresence, LayoutGroup, motion as M, useReducedMotion } from 'framer-motion';
import { MotionCard } from '../components/motion';
import { motionEase } from '../utils/motion';
import { formatProjectDescription } from '../utils/formatProjectDescription';
import './ProjectDetail.css';

const ProjectDetail = () => {
    const { id } = useParams();
    const { isAuthenticated, user } = useAuth();
    const { addToCart: addToCartContext } = useCart();
    const { language, t } = useLanguage();
    const { formatPrice } = useCurrency();
    const { modules } = useModules();
    const [project, setProject] = useState(null);
    const [addingToCart, setAddingToCart] = useState(false);
    const [donations, setDonations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [relatedProjects, setRelatedProjects] = useState([]);
    const [recommendedProjects, setRecommendedProjects] = useState([]);
    const [recommendedSliderIndex, setRecommendedSliderIndex] = useState(0);

    // Form states
    const [donationAmount, setDonationAmount] = useState('');
    const [donationMessage, setDonationMessage] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewEmail, setReviewEmail] = useState('');
    const [captchaCode, setCaptchaCode] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [showDonationForm, setShowDonationForm] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [donationModal, setDonationModal] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [refLink, setRefLink] = useState('');
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        loadProject();
        if (modules?.donationsEnabled) {
            loadDonations();
        }
        if (modules?.commentsEnabled || modules?.ratingsEnabled) {
            loadReviews();
        }
        if (isAuthenticated) {
            checkFavorite();
            // Ref Link oluştur (Kullanıcı giriş yapmışsa)
            if (user?.id) {
                const baseUrl = window.location.origin + window.location.pathname;
                setRefLink(`${baseUrl}?ref=USER${user.id}`);
            }
        }

        // Ziyaret Takibi (Referans varsa)
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode && id) {
            projectsAPI.trackVisit({
                projectId: id,
                refCode: refCode,
                // Fingerprint/Cookie kütüphanesi yoksa user-agent veya localStorage ile basit bir ID yollayabiliriz.
                fingerprint: localStorage.getItem('visitor_id') || ('v_' + Math.random().toString(36).substr(2, 9))
            }).then(res => {
                if (res.data?.status === 'success') {
                    console.log('Referral visit tracked:', res.data);
                }
            }).catch(err => console.error('Tracking error:', err));

            // Visitor ID yoksa oluşturup kaydet (basit fingerprint)
            if (!localStorage.getItem('visitor_id')) {
                localStorage.setItem('visitor_id', 'v_' + Math.random().toString(36).substr(2, 9));
            }
        }

        // Giriş yapmış kullanıcı için email'i doldur
        if (isAuthenticated && user?.email) {
            setReviewEmail(user.email);
        }
        // Captcha kodu oluştur
        generateCaptcha();
    }, [id, isAuthenticated, user, language, modules]);

    // Basit captcha kodu oluştur
    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;
        setCaptchaCode(`${num1} + ${num2} = ?`);
        setCaptchaAnswer(answer.toString());
    };

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await projectsAPI.getById(id, language);
            const projectData = response.data;
            console.log('Loaded project:', {
                id: projectData.id,
                title: projectData.title,
                images_count: projectData.images?.length || 0,
                images: projectData.images?.map(img => ({
                    id: img.id,
                    image_path: img.image_path,
                    is_primary: img.is_primary
                }))
            });
            setProject(projectData);
        } catch (error) {
            console.error('Project load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDonations = async () => {
        if (!modules?.donationsEnabled) return;
        try {
            const response = await donationsAPI.getProjectDonations(id);
            setDonations(response.data.donations || []);
        } catch (error) {
            console.error('Donations load error:', error);
        }
    };

    const loadReviews = async () => {
        try {
            const response = await reviewsAPI.getProjectReviews(id);
            setReviews(response.data.reviews || []);
        } catch (error) {
            console.error('Reviews load error:', error);
        }
    };

    const loadRelatedProjects = async () => {
        try {
            if (project?.category_slug) {
                const response = await projectsAPI.getAll({
                    category: project.category_slug,
                    limit: 4,
                    lang: language
                });
                const related = (response.data.projects || []).filter(p => p.id !== parseInt(id));
                setRelatedProjects(related.slice(0, 4));
            }
        } catch (error) {
            console.error('Related projects load error:', error);
        }
    };

    const loadRecommendedProjects = async () => {
        try {
            const response = await projectsAPI.getAll({ limit: 20, lang: language });
            const allProjects = response.data.projects || [];
            // Mevcut projeyi hariç tut ve rastgele seç
            const filtered = allProjects.filter(p => p.id !== parseInt(id));
            // Rastgele karıştır
            const shuffled = filtered.sort(() => Math.random() - 0.5);
            setRecommendedProjects(shuffled.slice(0, 8));
        } catch (error) {
            console.error('Recommended projects load error:', error);
        }
    };

    useEffect(() => {
        if (project) {
            loadRelatedProjects();
            loadRecommendedProjects();
        }
    }, [project, language]);

    // Slider otomatik geçiş
    useEffect(() => {
        if (recommendedProjects.length > 0) {
            const interval = setInterval(() => {
                setRecommendedSliderIndex((prev) =>
                    prev >= recommendedProjects.length - 4 ? 0 : prev + 1
                );
            }, 4000); // 4 saniyede bir geçiş
            return () => clearInterval(interval);
        }
    }, [recommendedProjects]);

    const handleDonate = () => {
        setDonationModal(true);
    };

    const handleAddReview = async (e) => {
        e.preventDefault();

        // Modül kontrolü
        if (!modules?.commentsEnabled && !modules?.ratingsEnabled) {
            alert('Yorum ve değerlendirme modülü devre dışı.');
            return;
        }

        // Email validasyonu (giriş yapmamış kullanıcılar için)
        if (!isAuthenticated) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!reviewEmail || !emailRegex.test(reviewEmail)) {
                alert(t('project_detail.invalid_email'));
                return;
            }
        }

        // Captcha doğrulama
        const userAnswer = document.getElementById('captcha-input')?.value;
        if (!userAnswer || userAnswer.trim() !== captchaAnswer) {
            alert(t('project_detail.wrong_captcha'));
            generateCaptcha();
            document.getElementById('captcha-input').value = '';
            return;
        }

        try {
            await reviewsAPI.addReview(id, {
                comment: reviewComment,
                rating: reviewRating,
                email: isAuthenticated ? user?.email : reviewEmail
            });
            alert(t('project_detail.review_added'));
            setReviewComment('');
            setReviewRating(5);
            setReviewEmail('');
            setShowReviewForm(false);
            generateCaptcha();
            loadReviews();
            loadProject();
        } catch (error) {
            alert(error.response?.data?.error || t('project_detail.review_failed'));
        }
    };

    const checkFavorite = async () => {
        try {
            const response = await usersAPI.getFavorites();
            const favorites = response.data.favorites || [];
            // Backend'den gelen favorilerde id (proje id'si) var
            const projectIdNum = parseInt(id);
            const isFav = favorites.some(fav => parseInt(fav.id || fav.project_id || 0) === projectIdNum);
            setIsFavorite(isFav);
            console.log('ProjectDetail: Check favorite', { projectId: projectIdNum, isFavorite: isFav, favorites });
        } catch (error) {
            console.error('Check favorite error:', error);
            setIsFavorite(false);
        }
    };

    const handleToggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert(t('project_detail.login_required_favorite'));
            return;
        }

        try {
            setFavoriteLoading(true);
            await usersAPI.toggleFavorite(id);
            setIsFavorite(!isFavorite);
        } catch (error) {
            alert(error.response?.data?.error || t('project_detail.favorite_failed'));
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Bağış modülü aktifse ve proje bağış hedefi varsa, sepete ekleme yapılamaz
        if (isDonationMode) {
            alert('Bu proje bağış modunda. Lütfen bağış yapın.');
            return;
        }

        if (!isAuthenticated) {
            alert(t('project_detail.login_required_cart'));
            return;
        }

        if (addingToCart) return;

        try {
            setAddingToCart(true);

            // Animasyon için buton pozisyonunu al
            const button = e.currentTarget;
            const buttonRect = button.getBoundingClientRect();

            // Sepet ikonunu bul
            const cartIcon = document.querySelector('.cart-icon-animation-target') ||
                document.querySelector('a[href="/cart"]');

            if (cartIcon) {
                const cartRect = cartIcon.getBoundingClientRect();

                // Animasyon elementi oluştur
                const animationElement = document.createElement('div');
                animationElement.className = 'cart-animation-item';
                animationElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';
                document.body.appendChild(animationElement);

                // Başlangıç pozisyonu
                animationElement.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
                animationElement.style.top = `${buttonRect.top + buttonRect.height / 2}px`;

                // Animasyon
                requestAnimationFrame(() => {
                    animationElement.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    animationElement.style.left = `${cartRect.left + cartRect.width / 2}px`;
                    animationElement.style.top = `${cartRect.top + cartRect.height / 2}px`;
                    animationElement.style.transform = 'scale(0.3)';
                    animationElement.style.opacity = '0';
                });

                // Animasyon bitince temizle
                setTimeout(() => {
                    if (document.body.contains(animationElement)) {
                        document.body.removeChild(animationElement);
                    }
                }, 600);
            }

            // Sepete ekle
            const result = await addToCartContext(id, 1);

            if (result.success) {
                // Başarı mesajı (toast benzeri)
                showCartNotification(t('project_detail.added_to_cart'));
            } else {
                alert(result.error || t('project_detail.cart_failed'));
            }
        } catch (error) {
            alert(error.response?.data?.error || t('project_detail.cart_failed'));
        } finally {
            setAddingToCart(false);
        }
    };

    const showCartNotification = (message) => {
        // Toast bildirimi oluştur
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
        }, 2000);
    };


    const calculateProgress = () => {
        if (!project || !project.funding_goal) return 0;
        return Math.min((project.total_donations / project.funding_goal) * 100, 100);
    };

    if (loading) {
        return <div className="loading">{t('project_detail.loading')}</div>;
    }

    if (!project) {
        return <div className="container">{t('project_detail.not_found')}</div>;
    }

    // Tamamlanmış proje kontrolü: completion_percentage === 100
    // Veritabanında status alanı 'active' veya 'approved' olabilir, 'completed' değil
    // Tamamlanmış projeler: completion_percentage === 100 VE donation_target yoksa (NULL veya 0)
    const isCompleted = Number(project.completion_percentage) === 100 &&
        (project.status === 'active' || project.status === 'approved') &&
        (!project.donation_target || Number(project.donation_target) === 0);
    const isInProgress = project.completion_percentage < 100 && project.completion_percentage > 0;
    // Tamamlanmamış projeler ücretsiz olamaz, sadece tamamlanmış projeler ücretsiz olabilir
    const isFree = isCompleted && parseFloat(project.price) === 0;
    
    // Bağış modülü aktifse ve proje bağış hedefi varsa, bağış modunda
    const hasDonationTarget = modules?.donationsEnabled && 
        project.donation_target && 
        Number(project.donation_target) > 0;
    const isDonationMode = hasDonationTarget && isInProgress;

    return (
        <div className="project-detail-page vuexy-style">
            {project && (
                <Helmet>
                    <title>{project.title} | Tekno Market</title>
                    <meta name="description" content={project.short_description || project.description?.substring(0, 150)} />

                    {/* Open Graph / Facebook */}
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content={window.location.href} />
                    <meta property="og:title" content={project.title} />
                    <meta property="og:description" content={project.short_description || project.description?.substring(0, 150)} />
                    <meta property="og:image" content={project.images && project.images.length > 0 ? (project.images[0].image_path?.startsWith('http') ? project.images[0].image_path : `${window.location.origin}${project.images[0].image_path}`) : `${window.location.origin}/img/default-project.png`} />

                    {/* Twitter */}
                    <meta property="twitter:card" content="summary_large_image" />
                    <meta property="twitter:url" content={window.location.href} />
                    <meta property="twitter:title" content={project.title} />
                    <meta property="twitter:description" content={project.short_description || project.description?.substring(0, 150)} />
                    <meta property="twitter:image" content={project.images && project.images.length > 0 ? (project.images[0].image_path?.startsWith('http') ? project.images[0].image_path : `${window.location.origin}${project.images[0].image_path}`) : `${window.location.origin}/img/default-project.png`} />
                </Helmet>
            )}

            <div className="container-xxl flex-grow-1 container-p-y">
                <div className="row">
                    <div className="col-12">
                        {/* Proje Detayları Card */}
                        <div className="card mb-4">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h4 className="card-title mb-0">{project.title}</h4>
                                {project.is_featured && (
                                    <span className="badge bg-warning">
                                        <FiStar className="me-1" /> {t('project_detail.featured')}
                                    </span>
                                )}
                            </div>

                            <div className="card-body">
                                <div className="row">
                                    {/* Proje Görseli */}
                                    <div className="col-md-6 col-lg-4 mb-3">
                                        <div className="card p-2">
                                            <ProjectGallerySlider
                                                images={project.images || []}
                                                projectTitle={project.title}
                                                projectId={project.id}
                                            />
                                        </div>
                                    </div>

                                    {/* Proje Bilgileri */}
                                    <div className="col-md-6 col-lg-8">
                                        <div className="row g-3 project-detail-main-row align-items-start">
                                            {/* Sol Taraf - Bilgiler */}
                                            <div className="col-lg-8">
                                                {/* Kategori */}
                                                {project.category_name && (
                                                    <div className="mb-3">
                                                        <Link
                                                            to={`/projects?category=${project.category_slug || ''}`}
                                                            className="badge bg-primary text-decoration-none px-3 py-2"
                                                            style={{ fontSize: '0.9rem' }}
                                                        >
                                                            {project.category_name}
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* Fiyat + satıcı (sağa hizalı) */}
                                                <div className="price-section-modern mb-4">
                                                    <div className="price-seller-row">
                                                        <div className="price-seller-row-main">
                                                            {isDonationMode ? (
                                                                <div className="price-display">
                                                                    <div className="price-label">{t('project_detail.donation_target')}</div>
                                                                    <div className="price-amount donation-price">
                                                                        {formatPrice(project.donation_target || 0, project.currency || 'TRY')}
                                                                    </div>
                                                                    {project.donation_received > 0 && !isInProgress && (
                                                                        <div className="donation-received-info">
                                                                            <span className="donation-received-label">{t('project_detail.collected') || 'Toplanan'}:</span>
                                                                            <span className="donation-received-amount">
                                                                                {formatPrice(project.donation_received || 0, project.currency || 'TRY')}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : isFree ? (
                                                                <div className="price-display">
                                                                    <div className="price-amount free-price-modern">
                                                                        {t('project_detail.free')}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="price-display">
                                                                    {project.discount_price ? (
                                                                        <>
                                                                            <div className="price-old">{formatPrice(project.price, project.currency || 'TRY')}</div>
                                                                            <div className="price-amount discount-price">
                                                                                {formatPrice(project.discount_price, project.currency || 'TRY')}
                                                                            </div>
                                                                            <div className="price-save">
                                                                                %{Math.round(((project.price - project.discount_price) / project.price) * 100)} {t('project_detail.discount')}
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="price-amount normal-price">
                                                                            {formatPrice(project.price, project.currency || 'TRY')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="price-seller-row-seller">
                                                            <div className="price-seller-inline">
                                                                <div className="price-seller-inline-text">
                                                                    <div className="price-seller-name">{project.username || t('project_detail.unknown')}</div>
                                                                    <div className="price-seller-role text-muted">{t('project_detail.seller')}</div>
                                                                </div>
                                                                <div className="avatar-modern price-seller-avatar">
                                                                    <img
                                                                        src={project.user_avatar ? getImageUrl(project.user_avatar) : '/img/default.svg'}
                                                                        alt={project.username || t('project_detail.seller')}
                                                                        className="rounded-circle"
                                                                        width="48"
                                                                        height="48"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                    <div className="avatar-placeholder-modern" style={{ display: 'none' }}>
                                                                        {project.username?.charAt(0).toUpperCase() || 'U'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isInProgress && (
                                                        <div className="price-section-completion">
                                                            <h6 className="price-section-completion-title">{t('project_detail.completion_status')}</h6>
                                                            <div className="progress progress-dual price-section-completion-bar">
                                                                <div
                                                                    className="progress-bar progress-bar-completed progress-bar-striped progress-bar-animated"
                                                                    role="progressbar"
                                                                    style={{ width: `${project.completion_percentage}%` }}
                                                                    aria-valuenow={project.completion_percentage}
                                                                    aria-valuemin="0"
                                                                    aria-valuemax="100"
                                                                />
                                                                <div
                                                                    className="progress-bar progress-bar-remaining"
                                                                    role="progressbar"
                                                                    style={{ width: `${100 - project.completion_percentage}%` }}
                                                                    aria-valuenow={100 - project.completion_percentage}
                                                                    aria-valuemin="0"
                                                                    aria-valuemax="100"
                                                                />
                                                            </div>
                                                            <div className="price-section-completion-meta">
                                                                <span className="text-muted">
                                                                    %{project.completion_percentage} {t('project_detail.completed')}
                                                                </span>
                                                                {project.donation_target && (
                                                                    <span className="text-muted price-section-completion-funds">
                                                                        <strong>{formatPrice(project.donation_received || 0, project.currency || 'TRY')}</strong>
                                                                        {' / '}
                                                                        {formatPrice(project.donation_target, project.currency || 'TRY')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Modern Kartlar - Kısa Açıklama */}
                                                {project.short_description && (
                                                    <div className="info-card-modern mb-3">
                                                        <div className="info-card-body">
                                                            <p className="mb-0 text-muted">{project.short_description}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Modern Kartlar - İstatistikler Grid */}
                                                <div className="stats-grid-modern mb-3">
                                                    <div className="stat-card-modern">
                                                        <div className="stat-icon-modern stat-icon-eye">
                                                            <FiEye />
                                                        </div>
                                                        <div className="stat-content-modern">
                                                            <div className="stat-value-modern">{project.view_count || 0}</div>
                                                            <div className="stat-label-modern">{t('project_detail.views')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="stat-card-modern">
                                                        <div className="stat-icon-modern stat-icon-download">
                                                            <FiDownload />
                                                        </div>
                                                        <div className="stat-content-modern">
                                                            <div className="stat-value-modern">{project.download_count || 0}</div>
                                                            <div className="stat-label-modern">{t('project_detail.downloads')}</div>
                                                        </div>
                                                    </div>
                                                    {project.rating && (
                                                        <div className="stat-card-modern">
                                                            <div className="stat-icon-modern stat-icon-rating">
                                                                <FiStar />
                                                            </div>
                                                            <div className="stat-content-modern">
                                                                <div className="stat-value-modern">{parseFloat(project.rating).toFixed(1)}</div>
                                                                <div className="stat-label-modern">({project.review_count || 0} {t('project_detail.review_count')})</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="stat-card-modern">
                                                        <div className="stat-icon-modern stat-icon-version">
                                                            <FiPackage />
                                                        </div>
                                                        <div className="stat-content-modern">
                                                            <div className="stat-value-modern">{project.version || '1.0.0'}</div>
                                                            <div className="stat-label-modern">{t('project_detail.version')}</div>
                                                        </div>
                                                    </div>

                                                    {/* Share & Earn Button */}
                                                    <div className="stat-card-modern share-earn-card"
                                                        onClick={() => setShowShareMenu(!showShareMenu)}>
                                                        <div className="stat-icon-modern stat-icon-share">
                                                            <FiUsers />
                                                        </div>
                                                        <div className="stat-content-modern">
                                                            <div className="stat-value-modern text-primary">{t('project_detail.share') || 'Paylaş'}</div>
                                                            <div className="stat-label-modern">{t('project_detail.earn_points') || 'Puan Kazan'}</div>
                                                        </div>

                                                        {showShareMenu && (
                                                            <div className="share-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                                                <div className="share-menu-header">
                                                                    <h6>{t('project_detail.share_title') || 'Paylaş & Kazan'}</h6>
                                                                    <button className="close-share" onClick={() => setShowShareMenu(false)}>&times;</button>
                                                                </div>
                                                                <div className="share-menu-body">
                                                                    {/* Copy Link */}
                                                                    <div className="share-input-group">
                                                                        <input type="text" readOnly value={refLink || (window.location.href + '?ref=GUEST')} />
                                                                        <button onClick={() => {
                                                                            navigator.clipboard.writeText(refLink || window.location.href);
                                                                            alert('Link kopyalandı!');
                                                                        }}>
                                                                            <FiCode />
                                                                        </button>
                                                                    </div>
                                                                    <div className="share-social-links">
                                                                        {/* WhatsApp */}
                                                                        <a href={`https://wa.me/?text=${encodeURIComponent(project.title + ' ' + (refLink || window.location.href))}`}
                                                                            target="_blank" rel="noreferrer" className="social-btn whatsapp" title="WhatsApp">
                                                                            <FaWhatsapp />
                                                                        </a>

                                                                        {/* Twitter / X */}
                                                                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(project.title)}&url=${encodeURIComponent(refLink || window.location.href)}`}
                                                                            target="_blank" rel="noreferrer" className="social-btn twitter" title="Twitter">
                                                                            <FaTwitter />
                                                                        </a>

                                                                        {/* Facebook */}
                                                                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refLink || window.location.href)}`}
                                                                            target="_blank" rel="noreferrer" className="social-btn facebook" title="Facebook">
                                                                            <FaFacebookF />
                                                                        </a>

                                                                        {/* LinkedIn */}
                                                                        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(refLink || window.location.href)}`}
                                                                            target="_blank" rel="noreferrer" className="social-btn linkedin" title="LinkedIn">
                                                                            <FaLinkedinIn />
                                                                        </a>

                                                                        {/* Telegram */}
                                                                        <a href={`https://t.me/share/url?url=${encodeURIComponent(refLink || window.location.href)}&text=${encodeURIComponent(project.title)}`}
                                                                            target="_blank" rel="noreferrer" className="social-btn telegram" title="Telegram">
                                                                            <FaTelegramPlane />
                                                                        </a>

                                                                        {/* Reddit */}
                                                                        <a href={`https://reddit.com/submit?url=${encodeURIComponent(refLink || window.location.href)}&title=${encodeURIComponent(project.title)}`}
                                                                            target="_blank" rel="noreferrer" className="social-btn reddit" title="Reddit">
                                                                            <FaRedditAlien />
                                                                        </a>

                                                                        {/* Email */}
                                                                        <a href={`mailto:?subject=${encodeURIComponent(project.title)}&body=${encodeURIComponent(refLink || window.location.href)}`}
                                                                            className="social-btn email" title="Email">
                                                                            <FaEnvelope />
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Sağ Taraf - Butonlar */}
                                            <div className="col-lg-4 project-detail-cta-col">
                                                <div className="action-buttons-modern">
                                                    <div className="project-detail-primary-actions">
                                                        {!isAuthenticated ? (
                                                            <>
                                                                <Link to="/login" className="btn-modern btn-modern-primary btn-modern-large">
                                                                    <FiUsers className="me-2" /> {t('project_detail.login')}
                                                                </Link>
                                                                <Link to="/register" className="btn-modern btn-modern-outline btn-modern-large mt-2">
                                                                    <FiUserPlus className="me-2" /> {t('project_detail.register')}
                                                                </Link>
                                                            </>
                                                        ) : isDonationMode ? (
                                                            <button
                                                                onClick={handleDonate}
                                                                className="btn-modern btn-modern-danger btn-modern-large"
                                                            >
                                                                <FiGift className="me-2" /> {t('project_detail.donate')}
                                                            </button>
                                                        ) : isFree ? (
                                                            <button className="btn-modern btn-modern-success btn-modern-large">
                                                                <FiDownload className="me-2" /> {t('project_detail.free_download')}
                                                            </button>
                                                        ) : (
                                                            <button onClick={handleAddToCart} className="btn-modern btn-modern-primary btn-modern-large">
                                                                <FiPackage className="me-2" /> {t('project_detail.add_to_cart')}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {isAuthenticated && (
                                                        <button
                                                            onClick={handleToggleFavorite}
                                                            disabled={favoriteLoading}
                                                            className={`btn-modern btn-modern-outline btn-modern-large ${isFavorite ? 'active' : ''}`}
                                                            style={{ width: '100%' }}
                                                        >
                                                            <FiHeart className={isFavorite ? 'filled' : ''} />
                                                            <span>{isFavorite ? t('project_detail.remove_from_favorites') : t('project_detail.add_to_favorites')}</span>
                                                        </button>
                                                    )}

                                                    {/* Demo Butonları */}
                                                    {isCompleted ? (
                                                        <div className="demo-buttons-modern demo-buttons-completed">
                                                            {project.demo_url ? (
                                                                <div className="demo-button-wrapper">
                                                                    <a
                                                                        href={project.demo_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="btn-modern btn-modern-info btn-modern-large"
                                                                    >
                                                                        <FiGlobe className="me-2" /> {t('project_detail.site_demo')}
                                                                    </a>
                                                                    <div className="demo-login-info">
                                                                        <div className="demo-credentials">
                                                                            <strong>{t('project_detail.admin_login_info')}</strong>
                                                                            <div className="credential-item">
                                                                                <span className="credential-label">{t('project_detail.username')}:</span>
                                                                                <span className="credential-value">{project.demo_username || 'user'}</span>
                                                                            </div>
                                                                            <div className="credential-item">
                                                                                <span className="credential-label">{t('project_detail.password')}:</span>
                                                                                <span className="credential-value">{project.demo_password || 'demo'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button disabled className="btn-modern btn-modern-disabled btn-modern-large">
                                                                    <FiGlobe className="me-2" /> {t('project_detail.site_demo')}
                                                                </button>
                                                            )}
                                                            {project.admin_demo_url ? (
                                                                <div className="demo-button-wrapper">
                                                                    <a
                                                                        href={project.admin_demo_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="btn-modern btn-modern-secondary btn-modern-large"
                                                                    >
                                                                        <FiShield className="me-2" /> {t('project_detail.admin_demo')}
                                                                    </a>
                                                                    <div className="demo-login-info">
                                                                        <div className="demo-credentials">
                                                                            <strong>{t('project_detail.admin_login_info')}</strong>
                                                                            <div className="credential-item">
                                                                                <span className="credential-label">{t('project_detail.username')}:</span>
                                                                                <span className="credential-value">{project.admin_username || 'demo'}</span>
                                                                            </div>
                                                                            <div className="credential-item">
                                                                                <span className="credential-label">{t('project_detail.password')}:</span>
                                                                                <span className="credential-value">{project.admin_password || 'demo'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button disabled className="btn-modern btn-modern-disabled btn-modern-large">
                                                                    <FiShield className="me-2" /> {t('project_detail.admin_demo')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="demo-buttons-modern">
                                                            <button disabled className="btn-modern btn-modern-disabled btn-modern-small">
                                                                <FiGlobe className="me-1" /> {t('project_detail.site_demo')}
                                                            </button>
                                                            <button disabled className="btn-modern btn-modern-disabled btn-modern-small">
                                                                <FiShield className="me-1" /> {t('project_detail.admin_demo')}
                                                            </button>
                                                            <small className="demo-disabled-text">{t('project_detail.will_be_active')}</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sekme Menülü Proje İçeriği */}
                        <div className="card project-detail-tabs-card">
                            <div className="card-body project-detail-tabs-card-body">
                                <LayoutGroup id="project-detail-tabs">
                                    <div className="project-detail-tabs-wrap">
                                    <ul className="nav nav-tabs project-detail-tabs-nav" role="tablist">
                                        <li className="nav-item" role="presentation">
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={activeTab === 'description'}
                                                className={`nav-link project-detail-tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('description')}
                                            >
                                                {activeTab === 'description' && (
                                                    <M.span
                                                        layoutId="project-detail-tab-pill"
                                                        className="project-detail-tab-pill"
                                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                                                        aria-hidden
                                                    />
                                                )}
                                                <span className="project-detail-tab-label">
                                                    <FiInfo className="me-1" /> {t('project_detail.description')}
                                                </span>
                                            </button>
                                        </li>
                                        <li className="nav-item" role="presentation">
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={activeTab === 'technologies'}
                                                className={`nav-link project-detail-tab-btn ${activeTab === 'technologies' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('technologies')}
                                            >
                                                {activeTab === 'technologies' && (
                                                    <M.span
                                                        layoutId="project-detail-tab-pill"
                                                        className="project-detail-tab-pill"
                                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                                                        aria-hidden
                                                    />
                                                )}
                                                <span className="project-detail-tab-label">
                                                    <FiCode className="me-1" /> {t('project_detail.technologies')}
                                                </span>
                                            </button>
                                        </li>
                                        <li className="nav-item" role="presentation">
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={activeTab === 'downloads'}
                                                className={`nav-link project-detail-tab-btn ${activeTab === 'downloads' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('downloads')}
                                            >
                                                {activeTab === 'downloads' && (
                                                    <M.span
                                                        layoutId="project-detail-tab-pill"
                                                        className="project-detail-tab-pill"
                                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                                                        aria-hidden
                                                    />
                                                )}
                                                <span className="project-detail-tab-label">
                                                    <FiFileText className="me-1" /> {t('project_detail.downloads')}
                                                </span>
                                            </button>
                                        </li>

                                        {isDonationMode && (
                                            <li className="nav-item" role="presentation">
                                                <button
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={activeTab === 'donors'}
                                                    className={`nav-link project-detail-tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
                                                    onClick={() => setActiveTab('donors')}
                                                >
                                                    {activeTab === 'donors' && (
                                                        <M.span
                                                            layoutId="project-detail-tab-pill"
                                                            className="project-detail-tab-pill"
                                                            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                                                            aria-hidden
                                                        />
                                                    )}
                                                    <span className="project-detail-tab-label">
                                                        <FiUsers className="me-1" /> {t('project_detail.donors')}
                                                    </span>
                                                </button>
                                            </li>
                                        )}

                                        <li className="nav-item" role="presentation">
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={activeTab === 'reviews'}
                                                className={`nav-link project-detail-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('reviews')}
                                            >
                                                {activeTab === 'reviews' && (
                                                    <M.span
                                                        layoutId="project-detail-tab-pill"
                                                        className="project-detail-tab-pill"
                                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                                                        aria-hidden
                                                    />
                                                )}
                                                <span className="project-detail-tab-label">
                                                    <FiStar className="me-1" /> {t('project_detail.reviews')}
                                                    {reviews.length > 0 && (
                                                        <span className="badge rounded-pill bg-primary ms-1">{reviews.length}</span>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                    </ul>
                                    </div>
                                </LayoutGroup>

                                <div className="tab-content project-detail-tab-content">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <M.div
                                            key={activeTab}
                                            id={`tab-panel-${activeTab}`}
                                            role="tabpanel"
                                            className="project-detail-tab-motion-pane"
                                            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                                            transition={{ duration: 0.2, ease: motionEase }}
                                        >
                                            {activeTab === 'description' && (
                                        <div className="project-description" id="tab-description">
                                            {project.description ? (
                                                <div dangerouslySetInnerHTML={{ __html: formatProjectDescription(project.description) }} />
                                            ) : (
                                                <p>{project.short_description || t('project_detail.no_description')}</p>
                                            )}
                                        </div>
                                            )}

                                            {activeTab === 'technologies' && (
                                        <div id="tab-technologies">
                                        {project.tags && project.tags.length > 0 ? (
                                            <div className="tech-grid-modern">
                                                {project.tags.map(tag => (
                                                    <div key={tag.id} className="tech-card-modern">
                                                        <div className="tech-icon-wrapper">
                                                            <span className="tech-icon-large">{getTechIcon(tag.name)}</span>
                                                        </div>
                                                        <div className="tech-name">{tag.name}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted">{t('project_detail.no_technologies')}</p>
                                        )}
                                        </div>
                                            )}

                                            {activeTab === 'downloads' && (
                                        <div id="tab-downloads" className="project-detail-downloads-tab">
                                            {project.download_files && project.download_files.length > 0 ? (
                                                <div className="project-downloads-table-wrap">
                                                    <table className="project-downloads-table">
                                                        <thead>
                                                            <tr>
                                                                <th scope="col">{t('project_detail.file_name')}</th>
                                                                <th scope="col">{t('project_detail.size')}</th>
                                                                <th scope="col" className="project-downloads-th-action">
                                                                    {t('project_detail.action')}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {project.download_files.map((file, index) => (
                                                                <tr key={index}>
                                                                    <td data-label={t('project_detail.file_name')}>
                                                                        <div className="project-downloads-file">
                                                                            <span className="project-downloads-file-icon" aria-hidden>
                                                                                <FiFileText />
                                                                            </span>
                                                                            <span className="project-downloads-file-name">
                                                                                {file.name || `${t('project_detail.file')} ${index + 1}`}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td data-label={t('project_detail.size')}>
                                                                        <span className="project-downloads-size">{file.size || '—'}</span>
                                                                    </td>
                                                                    <td
                                                                        data-label={t('project_detail.action')}
                                                                        className="project-downloads-td-action"
                                                                    >
                                                                        <a href={file.url || '#'} className="project-downloads-btn">
                                                                            <FiDownload aria-hidden />
                                                                            <span>{t('project_detail.download')}</span>
                                                                        </a>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="project-downloads-empty" role="status">
                                                    <div className="project-downloads-empty-icon" aria-hidden>
                                                        <FiFileText />
                                                    </div>
                                                    <p className="project-downloads-empty-text">{t('project_detail.no_downloads')}</p>
                                                </div>
                                            )}
                                        </div>
                                            )}

                                            {activeTab === 'donors' && isDonationMode && (
                                        <div id="tab-donors" className="project-detail-donors-tab">
                                            {donations.length > 0 ? (
                                                <div className="project-donors-table-wrap">
                                                    <table className="project-donors-table">
                                                        <thead>
                                                            <tr>
                                                                <th scope="col">{t('project_detail.donor')}</th>
                                                                <th scope="col">{t('project_detail.amount')}</th>
                                                                <th scope="col">{t('project_detail.date')}</th>
                                                                <th scope="col" className="project-donors-th-msg">
                                                                    {t('project_detail.message')}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {donations.map((donation) => {
                                                                const donorDateLocale =
                                                                    language === 'de'
                                                                        ? 'de-DE'
                                                                        : language === 'tr'
                                                                          ? 'tr-TR'
                                                                          : 'en-US';
                                                                return (
                                                                    <tr key={donation.id}>
                                                                        <td data-label={t('project_detail.donor')}>
                                                                            <div className="project-donors-donor">
                                                                                <img
                                                                                    src={
                                                                                        donation.donor_avatar
                                                                                            ? getImageUrl(donation.donor_avatar)
                                                                                            : '/img/default.svg'
                                                                                    }
                                                                                    className="project-donors-avatar"
                                                                                    width="32"
                                                                                    height="32"
                                                                                    alt={donation.donor_name || t('project_detail.anonymous')}
                                                                                    onError={(e) => {
                                                                                        e.target.src = '/img/default.svg';
                                                                                    }}
                                                                                />
                                                                                <span className="project-donors-name">
                                                                                    {donation.donor_name || t('project_detail.anonymous')}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td data-label={t('project_detail.amount')}>
                                                                            <span className="project-donors-amount">
                                                                                {formatPrice(donation.amount)}
                                                                            </span>
                                                                        </td>
                                                                        <td data-label={t('project_detail.date')}>
                                                                            <span className="project-donors-date">
                                                                                {new Date(donation.created_at).toLocaleDateString(
                                                                                    donorDateLocale
                                                                                )}
                                                                            </span>
                                                                        </td>
                                                                        <td
                                                                            data-label={t('project_detail.message')}
                                                                            className="project-donors-td-msg"
                                                                        >
                                                                            {donation.message ? (
                                                                                <button
                                                                                    type="button"
                                                                                    className="project-donors-msg-btn"
                                                                                    title={donation.message}
                                                                                    aria-label={t('project_detail.message')}
                                                                                >
                                                                                    <FiInfo />
                                                                                </button>
                                                                            ) : (
                                                                                <span className="project-donors-msg-empty" aria-hidden>
                                                                                    —
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="project-donors-empty" role="status">
                                                    <div className="project-donors-empty-icon" aria-hidden>
                                                        <FiGift />
                                                    </div>
                                                    <p className="project-donors-empty-text">{t('project_detail.no_donations')}</p>
                                                </div>
                                            )}
                                        </div>
                                            )}

                                            {activeTab === 'reviews' && (modules?.commentsEnabled || modules?.ratingsEnabled) && (
                                        <div id="tab-reviews">
                                        {!showReviewForm && (
                                            <button
                                                className="btn btn-primary mb-3"
                                                onClick={() => setShowReviewForm(true)}
                                            >
                                                {t('project_detail.add_review')}
                                            </button>
                                        )}

                                        {showReviewForm && (
                                            <form onSubmit={handleAddReview} className="review-form mb-4 p-3 border rounded">
                                                {/* Email alanı - sadece giriş yapmamış kullanıcılar için */}
                                                {!isAuthenticated && (
                                                    <div className="mb-3">
                                                        <label className="form-label">
                                                            {t('project_detail.email_address')} <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            value={reviewEmail}
                                                            onChange={(e) => setReviewEmail(e.target.value)}
                                                            placeholder="ornek@email.com"
                                                            required
                                                        />
                                                        <small className="form-text text-muted">
                                                            {t('project_detail.email_required')}
                                                        </small>
                                                    </div>
                                                )}

                                                {/* Giriş yapmış kullanıcı bilgisi */}
                                                {isAuthenticated && user && (
                                                    <div className="mb-3">
                                                        <div className="alert alert-info d-flex align-items-center">
                                                            <FiUsers className="me-2" />
                                                            <span>{t('project_detail.review_as', { name: user.username || user.email })}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mb-3">
                                                    <label className="form-label" id="review-rating-label">
                                                        {t('project_detail.rating')}
                                                    </label>
                                                    <div
                                                        className="review-rating-picker"
                                                        role="radiogroup"
                                                        aria-labelledby="review-rating-label"
                                                    >
                                                        {[1, 2, 3, 4, 5].map((r) => (
                                                            <button
                                                                key={r}
                                                                type="button"
                                                                role="radio"
                                                                aria-checked={reviewRating === r}
                                                                className={`review-rating-star ${r <= reviewRating ? 'is-active' : ''}`}
                                                                onClick={() => setReviewRating(r)}
                                                                aria-label={`${r} / 5 — ${t('project_detail.stars')}`}
                                                            >
                                                                <FiStar
                                                                    className={`review-rating-icon ${r <= reviewRating ? 'is-filled' : ''}`}
                                                                    aria-hidden
                                                                />
                                                            </button>
                                                        ))}
                                                        <span className="review-rating-summary" aria-live="polite">
                                                            <strong>{reviewRating}</strong>
                                                            <span className="text-muted">/5</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="form-label">{t('project_detail.comment')}</label>
                                                    <textarea
                                                        className="form-control review-textarea-full"
                                                        value={reviewComment}
                                                        onChange={(e) => setReviewComment(e.target.value)}
                                                        placeholder={t('project_detail.comment_placeholder')}
                                                        required
                                                        rows="5"
                                                    />
                                                </div>

                                                {/* Bot koruması - Captcha */}
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        {t('project_detail.verification_code')} <span className="text-danger">*</span>
                                                    </label>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="captcha-display">
                                                            <span className="captcha-code">{captchaCode}</span>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary ms-2"
                                                                onClick={generateCaptcha}
                                                                title={t('project_detail.generate_new_code')}
                                                            >
                                                                <FiInfo />
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            id="captcha-input"
                                                            className="form-control captcha-input"
                                                            placeholder={t('project_detail.enter_answer')}
                                                            required
                                                            maxLength="3"
                                                        />
                                                    </div>
                                                    <small className="form-text text-muted">
                                                        {t('project_detail.captcha_info')}
                                                    </small>
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <button type="submit" className="btn btn-primary">{t('project_detail.submit')}</button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => {
                                                            setShowReviewForm(false);
                                                            setReviewComment('');
                                                            setReviewEmail('');
                                                            generateCaptcha();
                                                        }}
                                                    >
                                                        {t('project_detail.cancel')}
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {reviews.length === 0 ? (
                                            <p className="text-muted">{t('project_detail.no_reviews')}</p>
                                        ) : (
                                            <div className="reviews-list">
                                                {reviews.map(review => (
                                                    <div key={review.id} className="d-flex mb-4 pb-1 border-bottom">
                                                        <div className="flex-shrink-0 me-3">
                                                            <img
                                                                src={review.user_avatar ? getImageUrl(review.user_avatar) : '/img/default.svg'}
                                                                className="rounded-circle"
                                                                width="40"
                                                                height="40"
                                                                alt={review.username || t('project_detail.user')}
                                                                onError={(e) => {
                                                                    e.target.src = '/img/default.svg';
                                                                }}
                                                            />
                                                            <div className="avatar-placeholder" style={{ display: 'none', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', alignItems: 'center', justifyContent: 'center' }}>
                                                                {review.username?.charAt(0).toUpperCase() || 'A'}
                                                            </div>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <h6 className="mb-0">{review.username || t('project_detail.anonymous')}</h6>
                                                                <small className="text-muted">{new Date(review.created_at).toLocaleDateString('tr-TR')}</small>
                                                            </div>
                                                            <div className="mb-2">
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <FiStar
                                                                        key={star}
                                                                        className={star <= review.rating ? 'text-warning' : 'text-muted'}
                                                                        style={{ fill: star <= review.rating ? '#ffc107' : 'none' }}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <p className="mb-0">{review.comment}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        </div>
                                            )}
                                        </M.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Önerilen Projeler - Modern Kompakt Tasarım */}
                        {recommendedProjects.length > 0 && (
                            <div className="card mt-4 recommended-projects-modern">
                                <div className="card-body">
                                    <div className="recommended-header-compact">
                                        <h5 className="recommended-title-compact">
                                            <FiStar /> {t('project_detail.recommended_projects')}
                                        </h5>
                                        <div className="recommended-controls-compact">
                                            <button
                                                className="btn-control-compact"
                                                onClick={() => setRecommendedSliderIndex(prev => prev > 0 ? prev - 1 : recommendedProjects.length - 4)}
                                                aria-label="Önceki"
                                            >
                                                <FiChevronLeft />
                                            </button>
                                            <button
                                                className="btn-control-compact"
                                                onClick={() => setRecommendedSliderIndex(prev => prev < recommendedProjects.length - 4 ? prev + 1 : 0)}
                                                aria-label="Sonraki"
                                            >
                                                <FiChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="recommended-grid-compact">
                                        <M.div
                                            className="recommended-track-compact"
                                            animate={{ x: `-${recommendedSliderIndex * (100 / 4)}%` }}
                                            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 32 }}
                                        >
                                            {recommendedProjects.map((recProject) => {
                                                const isCompleted = recProject.completion_percentage === 100;
                                                const isInProgress = recProject.completion_percentage > 0 && recProject.completion_percentage < 100;
                                                const isFree = recProject.price && parseFloat(recProject.price) === 0;

                                                return (
                                                    <MotionCard
                                                        key={recProject.id}
                                                        as={Link}
                                                        to={`/projects/${recProject.id}`}
                                                        className="recommended-card-compact"
                                                        enableHover={false}
                                                    >
                                                        <div className="card-image-compact">
                                                            {recProject.primary_image || (recProject.images && recProject.images.length > 0) ? (
                                                                <img
                                                                    src={(() => {
                                                                        const imgPath = recProject.primary_image || (recProject.images?.[0]?.image_path);
                                                                        if (!imgPath) return '/img/default.svg';
                                                                        return getImageUrl(imgPath);
                                                                    })()}
                                                                    alt={recProject.title}
                                                                    onError={(e) => {
                                                                        e.target.src = '/img/default.svg';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <img src="/img/default.svg" alt={recProject.title} />
                                                            )}
                                                            <div className="card-badge-compact">
                                                                {isCompleted ? (
                                                                    <span className="badge-compact badge-success">
                                                                        <FiAward /> {t('project_detail.completed_badge')}
                                                                    </span>
                                                                ) : isInProgress ? (
                                                                    <span className="badge-compact badge-warning">
                                                                        <FiTrendingUp /> {t('project_detail.in_progress_badge')}
                                                                    </span>
                                                                ) : isFree ? (
                                                                    <span className="badge-compact badge-info">
                                                                        <FiZap /> {t('project_detail.free_badge')}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div className="card-content-compact">
                                                            <h6 className="card-title-compact">{recProject.title}</h6>
                                                            {recProject.category_name && (
                                                                <span className="card-category-compact">
                                                                    {recProject.category_name}
                                                                </span>
                                                            )}
                                                            <p className="card-desc-compact">
                                                                {recProject.short_description?.substring(0, 60) || ''}
                                                            </p>
                                                            <div className="card-footer-compact">
                                                                <div className="card-stats-compact">
                                                                    <span className="stat-compact">
                                                                        <FiEye /> {recProject.view_count || 0}
                                                                    </span>
                                                                    {recProject.rating > 0 && (
                                                                        <span className="stat-compact">
                                                                            <FiStar /> {parseFloat(recProject.rating).toFixed(1)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="card-price-compact">
                                                                    {recProject.completion_percentage < 100 && recProject.donation_target ? (
                                                                        <span className="price-compact price-donation">
                                                                            {formatPrice(recProject.donation_received || 0, recProject.currency || 'TRY')}
                                                                        </span>
                                                                    ) : recProject.price && parseFloat(recProject.price) > 0 ? (
                                                                        <span className="price-compact price-paid">
                                                                            {formatPrice(recProject.price, recProject.currency || 'TRY')}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="price-compact price-free">
                                                                            {t('project_detail.free_badge')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </MotionCard>
                                                );
                                            })}
                                        </M.div>
                                    </div>
                                    <div className="recommended-dots-compact">
                                        {Array.from({ length: Math.ceil(recommendedProjects.length / 4) }).map((_, index) => (
                                            <button
                                                key={index}
                                                className={`dot-compact ${Math.floor(recommendedSliderIndex / 4) === index ? 'active' : ''}`}
                                                onClick={() => setRecommendedSliderIndex(index * 4)}
                                                aria-label={`Sayfa ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* İlginizi Çekebilecek Projeler */}
                        {relatedProjects.length > 0 && (
                            <div className="card mt-4">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <FiStar className="me-2" /> {t('project_detail.related_projects')}
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        {relatedProjects.map(relatedProject => (
                                            <div key={relatedProject.id} className="col-md-6 col-lg-3 mb-3">
                                                <MotionCard
                                                    as={Link}
                                                    to={`/projects/${relatedProject.id}`}
                                                    className="text-decoration-none text-reset d-block h-100"
                                                    enableHover={false}
                                                >
                                                    <div className="card h-100">
                                                        {relatedProject.images && relatedProject.images.length > 0 && (
                                                            <img
                                                                src={(() => {
                                                                    const imgPath = relatedProject.images[0].image_path;
                                                                    if (!imgPath) return '/img/default.svg';
                                                                    return getImageUrl(imgPath);
                                                                })()}
                                                                className="card-img-top"
                                                                alt={relatedProject.title}
                                                                style={{ height: '150px', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        <div className="card-body">
                                                            <h6 className="card-title">{relatedProject.title}</h6>
                                                            <p className="card-text text-muted small">
                                                                {relatedProject.short_description?.substring(0, 60)}...
                                                            </p>
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span className="badge bg-primary">
                                                                    {relatedProject.category_name}
                                                                </span>
                                                                <span className="text-primary fw-bold">
                                                                    {relatedProject.price ? formatPrice(relatedProject.price) : t('project_detail.free_badge')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </MotionCard>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="project-detail-mobile-cta" role="region" aria-label={t('project_detail.add_to_cart')}>
                <div className="project-detail-mobile-cta-handle" aria-hidden="true" />
                <div className="project-detail-mobile-cta-inner">
                    <div className="project-detail-mobile-cta-meta">
                        {!isFree && !isDonationMode && (
                            <div className="project-detail-mobile-cta-price-block">
                                <span className="project-detail-mobile-cta-label">{t('project_detail.price_label')}</span>
                                <span className="project-detail-mobile-cta-price">
                                    {formatPrice(project.price, project.currency || 'TRY')}
                                </span>
                            </div>
                        )}
                        {isDonationMode && project.donation_target && (
                            <div className="project-detail-mobile-cta-price-block">
                                <span className="project-detail-mobile-cta-label">{t('project_detail.donation_target')}</span>
                                <span className="project-detail-mobile-cta-price text-truncate">
                                    {formatPrice(project.donation_received || 0, project.currency || 'TRY')}
                                    <span className="project-detail-mobile-cta-price-sep">/</span>
                                    {formatPrice(project.donation_target, project.currency || 'TRY')}
                                </span>
                            </div>
                        )}
                        {isFree && !isDonationMode && (
                            <div className="project-detail-mobile-cta-badge project-detail-mobile-cta-badge--free">
                                <FiZap aria-hidden />
                                <span>{t('project_detail.free_badge')}</span>
                            </div>
                        )}
                    </div>
                    <div className="project-detail-mobile-cta-actions">
                        {!isAuthenticated ? (
                            <div className="project-detail-mobile-cta-auth">
                                <Link to="/login" className="project-detail-mobile-cta-btn project-detail-mobile-cta-btn--primary">
                                    <FiUsers aria-hidden />
                                    <span>{t('project_detail.login')}</span>
                                </Link>
                                <Link to="/register" className="project-detail-mobile-cta-btn project-detail-mobile-cta-btn--ghost">
                                    <FiUserPlus aria-hidden />
                                    <span>{t('project_detail.register')}</span>
                                </Link>
                            </div>
                        ) : isDonationMode ? (
                            <button type="button" onClick={handleDonate} className="project-detail-mobile-cta-btn project-detail-mobile-cta-btn--donate project-detail-mobile-cta-btn--full">
                                <FiGift aria-hidden />
                                <span>{t('project_detail.donate')}</span>
                            </button>
                        ) : isFree ? (
                            <button type="button" className="project-detail-mobile-cta-btn project-detail-mobile-cta-btn--success project-detail-mobile-cta-btn--full">
                                <FiDownload aria-hidden />
                                <span>{t('project_detail.free_download')}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                className="project-detail-mobile-cta-btn project-detail-mobile-cta-btn--primary project-detail-mobile-cta-btn--full"
                                disabled={addingToCart}
                            >
                                <FiPackage aria-hidden />
                                <span>{addingToCart ? '...' : t('project_detail.add_to_cart')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bağış Modal */}
            {isDonationMode && donationModal && project && (
                <DonationModal
                    isOpen={donationModal}
                    onClose={() => {
                        setDonationModal(false);
                        loadDonations();
                        loadProject();
                    }}
                    project={project}
                />
            )}
        </div>
    );
};

export default ProjectDetail;
