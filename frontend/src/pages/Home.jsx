import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiZap, FiTrendingUp, FiCreditCard, FiGift, FiTag, FiArrowRight, FiCheckCircle, FiStar, FiChevronLeft, FiChevronRight, FiClock, FiUsers, FiDownload, FiShoppingCart, FiHeart, FiEye, FiCalendar, FiPackage, FiTrendingUp as FiTrending, FiMail, FiPhone, FiMapPin, FiSend, FiUser, FiMessageCircle, FiLink } from 'react-icons/fi';
import { getSections, getProjectsSectionSettings, getProjectsList, getFeaturesItems, getStatsItems, getFAQItems, getAboutItems, getTestimonialsItems, getTestimonialsSettings, getSponsorsList, getReferencesList } from '../api/sections';
import { projectsAPI } from '../api/projects';
import { getTechIcon } from '../utils/techIcons';
import { getImageUrl, getApiUrl } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useModules } from '../context/ModulesContext';
import { usersAPI } from '../api/users';
import { donationsAPI } from '../api/donations';
import { ticketsAPI } from '../api/tickets';
import { leadsAPI } from '../api/leads';
import { blogAPI } from '../api/blog';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { RevealOnScroll, MotionCard } from '../components/motion';
import { staggerContainer, staggerItem, motionEase } from '../utils/motion';
import './Home.css';

/** Bölüm başlığı — scroll’da hafif fade-up */
function HomeSectionHeader({ children, className = 'section-header' }) {
    return (
        <RevealOnScroll className={className} amount={0.18}>
            {children}
        </RevealOnScroll>
    );
}

const Home = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { modules } = useModules();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                setLoading(true);
                const data = await getSections(language);
                setSections(data);
            } catch (error) {
                console.error('Error fetching sections:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSections();
    }, [language]);

    const renderSection = (section) => {
        if (!section.isActive) return null;

        switch (section.key) {
            case 'hero':
                return <HeroSection key={section.id} data={section} />;
            case 'features':
                return <FeaturesSection key={section.id} data={section} />;
            case 'projects':
                return <ProjectsSection key={section.id} data={section} />;
            case 'stats':
                return <StatsSection key={section.id} data={section} />;
            case 'faq':
                return <FAQSection key={section.id} data={section} />;
            case 'about':
                return <AboutSection key={section.id} data={section} />;
            case 'blog':
                // Blog modülü kontrolü
                if (!modules?.blogEnabled) return null;
                return <BlogSection key={section.id} data={section} />;
            case 'testimonials':
                return <TestimonialsSection key={section.id} data={section} />;
            case 'sponsors':
                return <SponsorsSection key={section.id} data={section} />;
            case 'references':
                return <ReferencesSection key={section.id} data={section} />;
            case 'contact':
                return <ContactSection key={section.id} data={section} />;
            default:
                return null;
        }
    };

    const { t } = useLanguage();

    if (loading) {
        return <div className="loading">{t('home.loading')}</div>;
    }

    return (
        <div className="home">
            {sections && sections.length > 0 ? (
                sections.map(section => renderSection(section))
            ) : (
                <HeroSection data={{ title: 'TeknoProje', subtitle: t('home.hero.title') }} />
            )}
        </div>
    );
};

// Hero Section with Slider
const HeroSection = ({ data }) => {
    const { language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHeroSlides();
    }, [language]);

    const loadHeroSlides = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/sections/hero/slides?lang=${language}`);
            const data = await response.json();
            const activeSlides = (data.slides || []).filter(slide => slide.status === 'active');
            setSlides(activeSlides);
        } catch (error) {
            console.error('Error loading hero slides:', error);
            // Fallback slides
            setSlides([
                {
                    title: 'Dijital Projelerinizi Dünyaya Açın',
                    subtitle: 'TeknoProje ile yazılım projelerinizi sergileyin, lisanslayın ve abonelik modeliyle sunun.',
                    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop',
                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    button_text: 'Projeleri Keşfet',
                    button_link: '/projects',
                    button_text_2: 'Ücretsiz Başla',
                    button_link_2: '/register'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slides.length === 0) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    if (loading) {
        return (
            <section className="hero-section">
                <div className="hero-slider">
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (slides.length === 0) {
        return null;
    }

    return (
        <section className="hero-section">
            <div className="hero-slider">
                {slides.map((slide, index) => {
                    const imageUrl = slide.image?.startsWith('http')
                        ? slide.image
                        : slide.image
                            ? getImageUrl(slide.image)
                            : 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop';

                    return (
                        <div
                            key={slide.id || index}
                            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${imageUrl})` }}
                        >
                            <div className="hero-slide-overlay" style={{ background: slide.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
                            <M.div
                                className="hero-slide-content"
                                initial={false}
                                animate={
                                    reduceMotion
                                        ? { opacity: index === currentSlide ? 1 : 0 }
                                        : index === currentSlide
                                            ? { opacity: 1, y: 0 }
                                            : { opacity: 0, y: 28 }
                                }
                                transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: motionEase }}
                                style={{ pointerEvents: index === currentSlide ? 'auto' : 'none' }}
                            >
                                <h1 className="hero-title">{slide.title}</h1>
                                {slide.subtitle && <p className="hero-subtitle">{slide.subtitle}</p>}
                                <M.div
                                    className="hero-buttons"
                                    initial={false}
                                    animate={
                                        index === currentSlide
                                            ? { opacity: 1, transition: { delay: reduceMotion ? 0 : 0.08 } }
                                            : { opacity: 0 }
                                    }
                                >
                                    {slide.button_text && slide.button_link && (
                                        <M.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                                            <Link to={slide.button_link} className="btn btn-primary btn-large">
                                                {slide.button_text} <FiArrowRight />
                                            </Link>
                                        </M.div>
                                    )}
                                    {slide.button_text_2 && slide.button_link_2 && (
                                        <M.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                                            <Link to={slide.button_link_2} className="btn btn-outline btn-large">
                                                {slide.button_text_2}
                                            </Link>
                                        </M.div>
                                    )}
                                </M.div>
                            </M.div>
                        </div>
                    );
                })}
                <button className="hero-nav-btn prev" onClick={prevSlide}>
                    <FiChevronLeft />
                </button>
                <button className="hero-nav-btn next" onClick={nextSlide}>
                    <FiChevronRight />
                </button>
                <div className="hero-dots">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

// Features Section
const FeaturesSection = ({ data }) => {
    const { t, language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeatures();
    }, [language]);

    const loadFeatures = async () => {
        try {
            const loadedItems = await getFeaturesItems(language);
            // Sadece aktif olanları filtrele
            const activeItems = loadedItems.filter(item => item.status === 'active');
            setItems(activeItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch (error) {
            console.error('Error loading features:', error);
            // Fallback veriler
            setItems([
                { title: 'Güvenli Lisanslama', description: 'Otomatik lisans anahtarı üretimi ve Signed URL\'ler ile dosyalarınız güvende.', icon: 'FiShield' },
                { title: 'AI Destekli', description: 'Gemini ve OpenAI ile otomatik çeviri, içerik oluşturma ve proje özetleme.', icon: 'FiZap' },
                { title: 'Detaylı Analitik', description: 'Görüntülenme, indirme ve kullanıcı davranış analizleri ile stratejinizi optimize edin.', icon: 'FiTrendingUp' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Icon mapping
    const iconMap = {
        FiShield, FiZap, FiTrendingUp, FiCreditCard, FiGift, FiTag,
        FiCheckCircle, FiStar, FiUsers, FiDownload, FiShoppingCart,
        FiHeart, FiEye, FiCalendar, FiPackage, FiMail, FiPhone,
        FiMapPin, FiSend, FiMessageCircle
    };

    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'];

    if (loading) {
        return (
            <section className="features-section">
                <div className="container">
                    <div className="loading">Yükleniyor...</div>
                </div>
            </section>
        );
    }

    const featGridVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.08, 0.06);
    const featItemVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : staggerItem;

    return (
        <section className="features-section">
            <div className="container">
                <HomeSectionHeader>
                    <h2>{t('home.features.section_label', 'Özellikler')}</h2>
                    <p>{t('home.features.title', 'Neden TeknoProje?')}</p>
                </HomeSectionHeader>
                <M.div
                    className="features-grid"
                    variants={featGridVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.12 }}
                >
                    {items.length > 0 ? (
                        items.map((item, idx) => {
                            const IconComponent = iconMap[item.icon] || FiPackage;
                            const color = colors[idx % colors.length];
                            return (
                                <M.div key={item.id || idx} variants={featItemVariants}>
                                    <MotionCard className="feature-card" style={{ '--card-color': color }} enableHover>
                                    {item.image ? (
                                        <div className="feature-image-wrapper">
                                            <img src={getImageUrl(item.image)} alt={item.title} />
                                        </div>
                                    ) : (
                                        <div className="feature-icon-wrapper">
                                            <IconComponent className="feature-icon" />
                                        </div>
                                    )}
                                    <h3>{item.title}</h3>
                                    {item.description && <p>{item.description}</p>}
                                    {item.link && (
                                        <a href={item.link} className="feature-link">
                                            {item.link_text || t('home.features.more_info')} <FiArrowRight />
                                        </a>
                                    )}
                                    </MotionCard>
                                </M.div>
                            );
                        })
                    ) : (
                        <p>{t('home.features.no_items')}</p>
                    )}
                </M.div>
            </div>
        </section>
    );
};

/** Slider viewport genişliğine göre sütun sayısı (dar ekranda 3× dar kart yerine 2 veya 1) */
function getSlidesPerViewForWidth(widthPx) {
    if (widthPx < 520) return 1;
    if (widthPx < 920) return 2;
    return 3;
}

/** Alt karusel (detailed kartlar): 1 / 2 / 3 / 4 sütun — viewport genişliğine göre */
function getGridSlidesPerViewForWidth(widthPx) {
    if (widthPx < 520) return 1;
    if (widthPx < 720) return 2;
    if (widthPx < 1100) return 3;
    return 4;
}

// Projects Section with Slider
const ProjectsSection = ({ data }) => {
    const { t, language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const { formatPrice } = useCurrency();
    const { modules } = useModules();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [projects, setProjects] = useState([]);
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [favorites, setFavorites] = useState(new Set());
    const [addingToCart, setAddingToCart] = useState({});
    const [favoriteLoading, setFavoriteLoading] = useState({});
    const { addToCart: addToCartContext } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const sliderViewportRef = useRef(null);
    const touchStartXRef = useRef(null);
    const gridViewportRef = useRef(null);
    const gridTouchStartXRef = useRef(null);
    const [slideStepPx, setSlideStepPx] = useState(0);
    const [slidesPerView, setSlidesPerView] = useState(3);
    const [gridCurrentIndex, setGridCurrentIndex] = useState(0);
    const [gridSlideStepPx, setGridSlideStepPx] = useState(0);
    const [gridSlidesPerView, setGridSlidesPerView] = useState(2);

    useEffect(() => {
        loadSettingsAndProjects();
        if (isAuthenticated) {
            loadFavorites();
        }
    }, [isAuthenticated, language]);

    useEffect(() => {
        if (featuredProjects.length === 0) return;
        const slice = featuredProjects.slice(0, 6);
        const maxIndex = Math.max(0, slice.length - slidesPerView);
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, 5500);
        return () => clearInterval(interval);
    }, [featuredProjects, slidesPerView]);

    const loadSettingsAndProjects = async () => {
        try {
            setLoading(true);

            // Ayarları yükle
            let sectionSettings = null;
            try {
                sectionSettings = await getProjectsSectionSettings();
                setSettings(sectionSettings);
            } catch (error) {
                console.error('Ayarlar yüklenirken hata:', error);
                // Varsayılan ayarlar
                sectionSettings = {
                    display_count: 6,
                    display_type: 'featured',
                    selected_project_ids: [],
                    category_ids: [],
                    sort_by: 'latest',
                    show_filters: true,
                    show_view_all: true
                };
                setSettings(sectionSettings);
            }

            // Ayarlara göre projeleri yükle
            await loadProjectsBySettings(sectionSettings);
        } catch (error) {
            console.error('Projeler yüklenirken hata:', error);
            // Fallback veriler
            const fallbackProjects = [
                { id: 1, title: 'TeknoShop E-Ticaret', price: 2499, discount_price: 1999, discount: 20, primary_image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop', rating: 4.8, downloads: 342, tags: ['React', 'Node.js'], featured: true, completion_percentage: 100, created_at: new Date().toISOString() },
                { id: 2, title: 'TaskFlow Proje Yönetimi', price: 1499, discount_price: null, discount: 0, primary_image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop', rating: 4.6, downloads: 189, tags: ['React', 'TypeScript'], featured: true, completion_percentage: 100, created_at: new Date().toISOString() },
                { id: 3, title: 'BlogCraft CMS', price: 899, discount_price: 749, discount: 17, primary_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', rating: 4.5, downloads: 127, tags: ['Next.js', 'Prisma'], featured: true, completion_percentage: 100, created_at: new Date().toISOString() },
                { id: 4, title: 'ChatBot AI Assistant', price: 3499, discount_price: null, discount: 0, primary_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop', rating: 4.9, downloads: 78, tags: ['AI', 'OpenAI'], featured: true, completion_percentage: 100, created_at: new Date().toISOString() },
                { id: 5, title: 'RestAPI Boilerplate', price: 599, discount_price: 499, discount: 17, primary_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop', rating: 4.7, downloads: 456, tags: ['Node.js', 'Express'], featured: true, completion_percentage: 100, created_at: new Date().toISOString() },
                { id: 6, title: 'DataViz Dashboard', price: 1299, discount_price: null, discount: 0, primary_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', rating: 4.4, downloads: 98, tags: ['Chart.js', 'D3.js'], featured: true, completion_percentage: 100, created_at: new Date().toISOString() }
            ];
            setProjects(fallbackProjects);
            setFeaturedProjects(fallbackProjects.slice(0, 9));
        } finally {
            setLoading(false);
        }
    };

    const isFeaturedProject = (p) =>
        p?.is_featured === true ||
        p?.is_featured === 1 ||
        p?.featured === true ||
        p?.featured === 1 ||
        p?.featured === '1';

    const processProjectRow = (p) => ({
        ...p,
        rating: typeof p.rating === 'number' ? p.rating : parseFloat(p.rating || 0),
        downloads: typeof p.download_count === 'number' ? p.download_count : parseFloat(p.download_count || 0),
        views: typeof p.view_count === 'number' ? p.view_count : parseFloat(p.view_count || 0),
        featured: !!(p.is_featured || p.featured)
    });

    const sortProjectsList = (arr, sortBy) => {
        const list = [...arr];
        if (sortBy === 'latest') {
            list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortBy === 'popular') {
            list.sort((a, b) => {
                const aViews = typeof a.view_count === 'number' ? a.view_count : parseFloat(a.view_count || 0);
                const bViews = typeof b.view_count === 'number' ? b.view_count : parseFloat(b.view_count || 0);
                return bViews - aViews;
            });
        } else if (sortBy === 'price_asc') {
            list.sort((a, b) => {
                const aPrice = typeof a.price === 'number' ? a.price : parseFloat(a.price || 0);
                const bPrice = typeof b.price === 'number' ? b.price : parseFloat(b.price || 0);
                return aPrice - bPrice;
            });
        } else if (sortBy === 'price_desc') {
            list.sort((a, b) => {
                const aPrice = typeof a.price === 'number' ? a.price : parseFloat(a.price || 0);
                const bPrice = typeof b.price === 'number' ? b.price : parseFloat(b.price || 0);
                return bPrice - aPrice;
            });
        } else if (sortBy === 'rating') {
            list.sort((a, b) => {
                const aRating = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating || 0);
                const bRating = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating || 0);
                return bRating - aRating;
            });
        }
        return list;
    };

    const loadProjectsBySettings = async (sectionSettings) => {
        try {
            let allProjects = [];
            /** getAll ile gelen tam kayıtlar (slider öne çıkan için tekrar istek azaltır) */
            let richPoolForSlider = null;
            const displayType = sectionSettings?.display_type || 'featured';
            const displayCount = sectionSettings?.display_count || 6;
            const sortBy = sectionSettings?.sort_by || 'latest';
            const gridLimit = Math.min(100, Math.max(Number(displayCount) || 6, 12));

            // Sıralama parametresini API'ye uygun formata çevir
            let sortParam = 'popular';
            if (sortBy === 'latest') sortParam = 'newest';
            else if (sortBy === 'popular') sortParam = 'popular';
            else if (sortBy === 'price_asc') sortParam = 'price_asc';
            else if (sortBy === 'price_desc') sortParam = 'price_desc';
            else if (sortBy === 'rating') sortParam = 'rating';

            if (displayType === 'selected') {
                // Manuel seçilen projeler
                const selectedIds = sectionSettings?.selected_project_ids || [];
                if (selectedIds.length > 0) {
                    // Seçilen ID'lere göre detaylı proje bilgilerini yükle
                    try {
                        const response = await projectsAPI.getAll({ limit: 100, lang: language });
                        const allProjectsData = response.data.projects || [];
                        richPoolForSlider = allProjectsData;
                        allProjects = allProjectsData.filter(p => selectedIds.includes(p.id));
                        // Seçim sırasını koru
                        allProjects.sort((a, b) => {
                            const aIndex = selectedIds.indexOf(a.id);
                            const bIndex = selectedIds.indexOf(b.id);
                            return aIndex - bIndex;
                        });
                    } catch (error) {
                        console.error('Seçilen projeler yüklenirken hata:', error);
                        // Fallback: getProjectsList kullan
                        const params = { lang: language };
                        const projectsData = await getProjectsList(params);
                        allProjects = projectsData.filter(p => selectedIds.includes(p.id));
                    }
                }
            } else if (displayType === 'category') {
                // Kategori bazlı
                const categoryIds = sectionSettings?.category_ids || [];
                if (categoryIds.length > 0) {
                    for (const categoryId of categoryIds) {
                        const params = { category_id: categoryId, lang: language };
                        const projectsData = await getProjectsList(params);
                        allProjects = [...allProjects, ...projectsData];
                    }
                    // Duplicate'leri kaldır
                    allProjects = allProjects.filter((p, index, self) =>
                        index === self.findIndex(pr => pr.id === p.id)
                    );
                } else {
                    // Kategori seçilmemişse tüm projeleri getir
                    const response = await projectsAPI.getAll({ sort_by: sortParam, limit: 100, lang: language });
                    allProjects = response.data.projects || [];
                    richPoolForSlider = allProjects;
                }
            } else if (displayType === 'featured') {
                // Izgara: tüm onaylı projeler; slider yalnızca öne çıkan (featured) ile dolar
                const response = await projectsAPI.getAll({ sort_by: sortParam, limit: 100, lang: language });
                allProjects = response.data.projects || [];
                richPoolForSlider = allProjects;
            } else {
                // Tüm projeler
                try {
                    const response = await projectsAPI.getAll({ sort_by: sortParam, limit: 100, lang: language });
                    allProjects = response.data.projects || [];
                    richPoolForSlider = allProjects;
                } catch (error) {
                    console.error('Tüm projeler yüklenirken hata:', error);
                    // Fallback: getProjectsList kullan
                    allProjects = await getProjectsList({ lang: language });
                }
            }

            if (displayType !== 'selected') {
                allProjects = sortProjectsList(allProjects, sortBy);
            }

            // Izgara: daha fazla kart (ayar + en az 12, en fazla 100)
            allProjects = allProjects.slice(0, gridLimit);

            const processedProjects = allProjects.map(processProjectRow);

            // Slider: yalnızca öne çıkanlar; tam kayıt için mümkünse aynı getAll havuzu
            let sliderSource = richPoolForSlider;
            if (!sliderSource || sliderSource.length === 0) {
                try {
                    const resSlider = await projectsAPI.getAll({ sort_by: sortParam, limit: 100, lang: language });
                    sliderSource = resSlider.data.projects || [];
                } catch (e) {
                    console.error('Öne çıkan slider projeleri yüklenirken hata:', e);
                    sliderSource = [];
                }
            }
            const sliderSorted = sortProjectsList(sliderSource, sortBy);
            const processedSlider = sliderSorted
                .filter(isFeaturedProject)
                .map(processProjectRow)
                .slice(0, 9);

            setProjects(processedProjects);
            setFeaturedProjects(processedSlider);
        } catch (error) {
            console.error('Projeler yüklenirken hata:', error);
            setProjects([]);
            setFeaturedProjects([]);
        }
    };

    const calculateDiscount = (price, discountPrice) => {
        if (!discountPrice || parseFloat(price) === 0) return 0;
        return Math.round(((parseFloat(price) - parseFloat(discountPrice)) / parseFloat(price)) * 100);
    };

    const loadFavorites = async () => {
        try {
            const response = await usersAPI.getFavorites();
            const favs = response.data.favorites || [];
            // Backend'den gelen favorilerde id (proje id'si) var
            const favoriteIds = favs.map(fav => parseInt(fav.id || fav.project_id || 0)).filter(id => id > 0);
            setFavorites(new Set(favoriteIds));
            console.log('Home: Loaded favorites:', favoriteIds);
        } catch (error) {
            console.error('Favorites load error:', error);
            setFavorites(new Set());
        }
    };

    const handleToggleFavorite = async (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert('Favorilere eklemek için giriş yapmalısınız');
            return;
        }

        try {
            setFavoriteLoading(prev => ({ ...prev, [projectId]: true }));
            await usersAPI.toggleFavorite(projectId);
            setFavorites(prev => {
                const newFavorites = new Set(prev);
                const projectIdNum = parseInt(projectId);
                if (newFavorites.has(projectIdNum)) {
                    newFavorites.delete(projectIdNum);
                } else {
                    newFavorites.add(projectIdNum);
                }
                return newFavorites;
            });
        } catch (error) {
            alert(error.response?.data?.error || 'Favori işlemi başarısız');
        } finally {
            setFavoriteLoading(prev => ({ ...prev, [projectId]: false }));
        }
    };

    const handleAddToCart = async (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert('Sepete eklemek için giriş yapmalısınız');
            return;
        }

        if (addingToCart[projectId]) return;

        try {
            setAddingToCart(prev => ({ ...prev, [projectId]: true }));

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
                animationElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>';
                document.body.appendChild(animationElement);

                // Başlangıç pozisyonu
                animationElement.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
                animationElement.style.top = `${buttonRect.top + buttonRect.height / 2}px`;

                // Animasyon
                requestAnimationFrame(() => {
                    animationElement.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    animationElement.style.left = `${cartRect.left + cartRect.width / 2}px`;
                    animationElement.style.top = `${cartRect.top + cartRect.height / 2}px`;
                    animationElement.style.transform = 'translate(-50%, -50%) scale(0.3)';
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
            const result = await addToCartContext(projectId, 1);

            if (result.success) {
                showCartNotification('Sepete eklendi!');
            } else {
                alert(result.error || 'Sepete eklenemedi');
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Sepete eklenemedi');
        } finally {
            setAddingToCart(prev => ({ ...prev, [projectId]: false }));
        }
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
        }, 2000);
    };

    const handleDonate = (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert('Bağış yapmak için giriş yapmalısınız');
            return;
        }

        // Proje detay sayfasına yönlendir
        navigate(`/projects/${projectId}#donate`);
    };

    const sliderProjects = featuredProjects.slice(0, 6);
    /** Izgara: bölüm ayarına göre yüklenen tüm projeler (slider ile aynı liste değil) */
    const bottomFeaturedProjects = projects;
    const maxSlideIndex = Math.max(0, sliderProjects.length - slidesPerView);

    useEffect(() => {
        setCurrentIndex((prev) => Math.min(prev, maxSlideIndex));
    }, [maxSlideIndex]);

    useEffect(() => {
        const el = sliderViewportRef.current;
        if (!el || sliderProjects.length === 0) return;
        const update = () => {
            const w = el.clientWidth;
            if (!w) return;
            const per = getSlidesPerViewForWidth(w);
            setSlidesPerView(per);
            setSlideStepPx(w / per);
        };
        update();
        const ro = new ResizeObserver(() => requestAnimationFrame(update));
        ro.observe(el);
        const onOrient = () => requestAnimationFrame(update);
        window.addEventListener('orientationchange', onOrient);
        return () => {
            ro.disconnect();
            window.removeEventListener('orientationchange', onOrient);
        };
    }, [sliderProjects.length]);

    useEffect(() => {
        const el = gridViewportRef.current;
        if (!el || projects.length === 0) return;
        const update = () => {
            const w = el.clientWidth;
            if (!w) return;
            const per = getGridSlidesPerViewForWidth(w);
            setGridSlidesPerView(per);
            setGridSlideStepPx(w / per);
        };
        update();
        const ro = new ResizeObserver(() => requestAnimationFrame(update));
        ro.observe(el);
        const onOrient = () => requestAnimationFrame(update);
        window.addEventListener('orientationchange', onOrient);
        return () => {
            ro.disconnect();
            window.removeEventListener('orientationchange', onOrient);
        };
    }, [projects.length]);

    useEffect(() => {
        const maxIdx = Math.max(0, projects.length - gridSlidesPerView);
        setGridCurrentIndex((prev) => Math.min(prev, maxIdx));
    }, [projects.length, gridSlidesPerView]);

    useEffect(() => {
        if (reduceMotion || projects.length === 0) return;
        const maxIdx = Math.max(0, projects.length - gridSlidesPerView);
        if (maxIdx <= 0) return;
        const id = setInterval(() => {
            setGridCurrentIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
        }, 6500);
        return () => clearInterval(id);
    }, [projects.length, gridSlidesPerView, reduceMotion]);

    const nextProjects = useCallback(() => {
        setCurrentIndex((prev) => (prev >= maxSlideIndex ? 0 : prev + 1));
    }, [maxSlideIndex]);

    const prevProjects = useCallback(() => {
        setCurrentIndex((prev) => (prev <= 0 ? maxSlideIndex : prev - 1));
    }, [maxSlideIndex]);

    const onSliderTouchStart = useCallback((e) => {
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
    }, []);

    const onSliderTouchEnd = useCallback(
        (e) => {
            const start = touchStartXRef.current;
            touchStartXRef.current = null;
            if (start == null) return;
            const end = e.changedTouches[0]?.clientX;
            if (end == null) return;
            const dx = end - start;
            if (dx < -56) nextProjects();
            else if (dx > 56) prevProjects();
        },
        [nextProjects, prevProjects]
    );

    const maxGridSlideIndex = Math.max(0, projects.length - gridSlidesPerView);

    const nextGridSlide = useCallback(() => {
        setGridCurrentIndex((prev) => (prev >= maxGridSlideIndex ? 0 : prev + 1));
    }, [maxGridSlideIndex]);

    const prevGridSlide = useCallback(() => {
        setGridCurrentIndex((prev) => (prev <= 0 ? maxGridSlideIndex : prev - 1));
    }, [maxGridSlideIndex]);

    const onGridTouchStart = useCallback((e) => {
        gridTouchStartXRef.current = e.touches[0]?.clientX ?? null;
    }, []);

    const onGridTouchEnd = useCallback(
        (e) => {
            const start = gridTouchStartXRef.current;
            gridTouchStartXRef.current = null;
            if (start == null) return;
            const end = e.changedTouches[0]?.clientX;
            if (end == null) return;
            const dx = end - start;
            if (dx < -56) nextGridSlide();
            else if (dx > 56) prevGridSlide();
        },
        [nextGridSlide, prevGridSlide]
    );

    const renderProjectCard = (project, isDetailed = false) => {
        // Güvenli tip dönüşümleri
        const rating = typeof project.rating === 'number' ? project.rating : parseFloat(project.rating || 0);
        const downloads = typeof project.downloads === 'number' ? project.downloads : parseFloat(project.downloads || 0);
        const views = typeof project.views === 'number' ? project.views : parseFloat(project.views || 0);
        const price = typeof project.price === 'number' ? project.price : parseFloat(project.price || 0);
        const discountPrice = project.discount_price ? (typeof project.discount_price === 'number' ? project.discount_price : parseFloat(project.discount_price)) : null;

        const discount = calculateDiscount(price, discountPrice);
        const finalPrice = discountPrice || price;
        const isCompleted = project.completion_percentage === 100;
        const isInProgress = project.completion_percentage < 100 && project.completion_percentage > 0;
        const isFree = parseFloat(finalPrice) === 0;

        // Bağış bilgileri
        const donationReceived = typeof project.donation_received === 'number'
            ? project.donation_received
            : parseFloat(project.donation_received || 0);
        const donationTarget = typeof project.donation_target === 'number'
            ? project.donation_target
            : parseFloat(project.donation_target || 0);
        const hasDonationTarget = donationTarget > 0;
        const donationProgress = hasDonationTarget ? Math.min((donationReceived / donationTarget) * 100, 100) : 0;

        // Tag'leri güvenli şekilde işle
        let projectTags = [];
        if (project.tags) {
            if (typeof project.tags === 'string') {
                projectTags = project.tags.split(',').map(t => String(t || '').trim()).filter(t => t.length > 0);
            } else if (Array.isArray(project.tags)) {
                projectTags = project.tags.map(t => {
                    if (typeof t === 'string') return t.trim();
                    if (typeof t === 'object' && t.name) return String(t.name).trim();
                    if (typeof t === 'object' && t.tag) return String(t.tag).trim();
                    return String(t || '').trim();
                }).filter(t => t.length > 0);
            }
        }

        // Sadece vitrin/kapak resmini al
        let projectImage = '';
        if (project.primary_image) {
            // Eğer zaten /uploads/ ile başlıyorsa veya http ile başlıyorsa olduğu gibi döndür
            projectImage = getImageUrl(project.primary_image);
        } else if (project.images && Array.isArray(project.images) && project.images.length > 0) {
            const firstImage = project.images[0];
            const imagePath = firstImage.image_path || firstImage;
            projectImage = getImageUrl(imagePath);
        } else {
            projectImage = 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop';
        }

        return (
            <MotionCard
                className={`project-card ${isDetailed ? 'detailed' : 'project-card--slider'} ${project.featured ? 'featured' : ''}`}
                enableHover
            >
                <div className="project-link" onClick={() => navigate(`/projects/${project.id}`)}>
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
                            {project.featured && (
                                <span className="badge badge-featured">
                                    <FiTrending /> {t('home.projects.featured')}
                                </span>
                            )}
                            {project.category_name && (
                                <span className="badge badge-category">
                                    {project.category_name}
                                </span>
                            )}
                            {isInProgress && (
                                <span className="badge badge-in-progress">
                                    <FiClock /> Devam Ediyor
                                </span>
                            )}
                            {discount > 0 && (
                                <span className="badge badge-discount-left">
                                    -{discount}%
                                </span>
                            )}
                            {isInProgress && project.completion_percentage && (
                                <span className="badge badge-completion-left">
                                    %{project.completion_percentage}
                                </span>
                            )}
                            {isFree && (
                                <span className="badge badge-free">
                                    Ücretsiz
                                </span>
                            )}
                        </div>

                        {/* Favori Butonu - Sağ Üst Köşe */}
                        <button
                            className={`favorite-button-top ${favorites.has(parseInt(project.id)) ? 'active' : ''}`}
                            onClick={(e) => handleToggleFavorite(e, project.id)}
                            disabled={favoriteLoading[project.id]}
                            title={favorites.has(parseInt(project.id)) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                        >
                            <FiHeart className={favorites.has(parseInt(project.id)) ? 'filled' : ''} />
                        </button>


                        <div className="project-overlay">
                            <div className="project-overlay-content">
                                <span className="view-details">
                                    {t('home.projects.view_details')} <FiArrowRight />
                                </span>
                                <div className="project-overlay-actions">
                                    {isInProgress && hasDonationTarget && (
                                        <button
                                            className="btn-overlay btn-donate-overlay"
                                            onClick={(e) => handleDonate(e, project.id)}
                                            title={t('home.projects.donate')}
                                        >
                                            <FiGift />
                                        </button>
                                    )}
                                    {!isFree && !isInProgress && (
                                        <button
                                            className="btn-overlay btn-cart"
                                            onClick={(e) => handleAddToCart(e, project.id)}
                                            disabled={addingToCart[project.id]}
                                            title={t('home.projects.add_to_cart')}
                                        >
                                            {addingToCart[project.id] ? <div className="spinner"></div> : <FiShoppingCart />}
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
                                <span className="seller-avatar">
                                    <FiUser />
                                </span>
                                <span className="seller-name">
                                    {project.user?.username || project.username || 'Admin'}
                                </span>
                            </div>
                            {rating > 0 && (
                                <div className="project-rating">
                                    <FiStar className="star filled" />
                                    <span>{rating}</span>
                                    <span className="rating-count">({project.review_count || 0})</span>
                                </div>
                            )}
                        </div>

                        {/* Proje Başlığı */}
                        <h3 className="project-title">{project.title}</h3>

                        {/* Kısa Açıklama */}
                        {(project.short_description || project.description) && (
                            <p className="project-short-desc">
                                {project.short_description || project.description?.substring(0, 100) + '...'}
                            </p>
                        )}
                        {/* Kullanılan Teknolojiler */}
                        {isDetailed && projectTags.length > 0 && (
                            <div className="project-technologies">
                                {projectTags.slice(0, 3).map((tag, idx) => {
                                    const tagStr = String(tag || '').trim();
                                    if (!tagStr) return null;
                                    const techIcon = getTechIcon(tagStr);
                                    return (
                                        <span key={idx} className="tech-badge" title={tagStr}>
                                            <span className="tech-icon">{techIcon}</span>
                                            <span className="tech-name">{tagStr}</span>
                                        </span>
                                    );
                                })}
                                {projectTags.length > 3 && (
                                    <span className="tech-badge tech-more" title={`+${projectTags.length - 3} ${t('home.projects.tech_more')}`}>
                                        +{projectTags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Fiyat ve İstatistikler */}
                        <div className="project-footer">
                            <div className="project-price">
                                {isInProgress && hasDonationTarget ? (
                                    <div className="donation-info">
                                        <div className="donation-amounts">
                                            <span className="donation-received">
                                                {formatPrice(donationReceived, project.currency || 'TRY')}
                                            </span>
                                            <span className="donation-separator">/</span>
                                            <span className="donation-target">
                                                {formatPrice(donationTarget, project.currency || 'TRY')}
                                            </span>
                                        </div>
                                        <div className="donation-progress-bar">
                                            <div
                                                className="donation-progress-fill"
                                                style={{ width: `${donationProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="donation-percentage">
                                            %{donationProgress.toFixed(0)} {t('home.projects.completed')}
                                        </div>
                                    </div>
                                ) : isFree ? (
                                    <span className="price-free">{t('home.projects.free')}</span>
                                ) : (
                                    <>
                                        {discount > 0 && (
                                            <span className="old-price">{formatPrice(price, project.currency || 'TRY')}</span>
                                        )}
                                        <span className="new-price">{formatPrice(finalPrice, project.currency || 'TRY')}</span>
                                    </>
                                )}
                            </div>
                            <div className="project-stats-footer">
                                <span className="stat-item">
                                    <FiDownload className="stat-item__icon" aria-hidden />
                                    <span className="stat-item__value">{downloads}</span>
                                </span>
                                <span className="stat-item">
                                    <FiEye className="stat-item__icon" aria-hidden />
                                    <span className="stat-item__value">{views}</span>
                                </span>
                            </div>
                        </div>

                        {/* Alt Butonlar */}
                        <div className="project-actions-bottom" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <FiArrowRight /> {t('home.projects.details')}
                            </button>
                            {modules?.donationsEnabled && isInProgress && hasDonationTarget ? (
                                <button
                                    className="btn btn-donate btn-sm"
                                    onClick={(e) => handleDonate(e, project.id)}
                                >
                                    <FiGift /> {t('home.projects.donate')}
                                </button>
                            ) : !isFree ? (
                                <button
                                    className="btn btn-outline btn-sm btn-cart-action"
                                    onClick={(e) => handleAddToCart(e, project.id)}
                                    disabled={addingToCart[project.id]}
                                >
                                    <FiShoppingCart /> {addingToCart[project.id] ? t('common.loading') : t('home.projects.add_to_cart')}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </MotionCard>
        );
    };

    if (loading) {
        return (
            <section className="projects-section">
                <div className="container">
                    <div className="loading-projects">{t('home.projects.loading')}</div>
                </div>
            </section>
        );
    }

    return (
        <section className="projects-section">
            <div className="container">
                <HomeSectionHeader>
                    <h2>{t('home.projects.featured_section_title', t('home.projects.title'))}</h2>
                    <p>{t('home.projects.featured_section_subtitle', t('home.projects.subtitle'))}</p>
                </HomeSectionHeader>

                {/* Slider - Öne Çıkan Projeler */}
                {sliderProjects.length > 0 && (
                    <div
                        className="projects-slider-wrapper projects-slider-wrapper--enhanced"
                        data-slide-count={sliderProjects.length}
                    >
                        <button
                            type="button"
                            className="slider-nav-btn prev"
                            onClick={prevProjects}
                            aria-label={t('home.projects.slider_prev') || 'Önceki projeler'}
                        >
                            <FiChevronLeft />
                        </button>
                        <div
                            ref={sliderViewportRef}
                            className="projects-slider"
                            onTouchStart={onSliderTouchStart}
                            onTouchEnd={onSliderTouchEnd}
                        >
                            <div
                                className="projects-slider-track"
                                style={{
                                    transform:
                                        slideStepPx > 0
                                            ? `translate3d(-${currentIndex * slideStepPx}px, 0, 0)`
                                            : undefined,
                                    width:
                                        slideStepPx > 0
                                            ? `${sliderProjects.length * slideStepPx}px`
                                            : undefined,
                                }}
                            >
                                {sliderProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="projects-slider-slide"
                                        style={{
                                            width: slideStepPx > 0 ? `${slideStepPx}px` : undefined,
                                        }}
                                    >
                                        {renderProjectCard(project, false)}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="slider-nav-btn next"
                            onClick={nextProjects}
                            aria-label={t('home.projects.slider_next') || 'Sonraki projeler'}
                        >
                            <FiChevronRight />
                        </button>
                        {maxSlideIndex > 0 && (
                            <div className="projects-slider-dots" role="tablist" aria-label="Projeler">
                                {Array.from({ length: maxSlideIndex + 1 }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        role="tab"
                                        aria-selected={i === currentIndex}
                                        className={`projects-slider-dot ${i === currentIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentIndex(i)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Detaylı proje kartları — responsive karusel (1–4 sütun + otomatik kayma) */}
                {bottomFeaturedProjects.length > 0 && (
                    <div className="featured-projects-grid">
                        <div className="featured-section-header">
                            <h3>
                                <FiTrending /> {t('home.projects.grid_section_title', t('home.projects.title'))}
                            </h3>
                            {settings?.show_view_all !== false && (
                                <Link to="/projects" className="view-all-link">
                                    {t('home.projects.view_all')} <FiArrowRight />
                                </Link>
                            )}
                        </div>
                        <div
                            className="projects-slider-wrapper projects-slider-wrapper--enhanced featured-projects-carousel"
                            data-slide-count={bottomFeaturedProjects.length}
                            data-grid-slides-per-view={gridSlidesPerView}
                        >
                            <button
                                type="button"
                                className="slider-nav-btn prev"
                                onClick={prevGridSlide}
                                aria-label={t('home.projects.slider_prev') || 'Önceki'}
                            >
                                <FiChevronLeft />
                            </button>
                            <div
                                ref={gridViewportRef}
                                className="projects-slider"
                                onTouchStart={onGridTouchStart}
                                onTouchEnd={onGridTouchEnd}
                            >
                                <div
                                    className="projects-slider-track"
                                    style={{
                                        transform:
                                            gridSlideStepPx > 0
                                                ? `translate3d(-${gridCurrentIndex * gridSlideStepPx}px, 0, 0)`
                                                : undefined,
                                        width:
                                            gridSlideStepPx > 0
                                                ? `${bottomFeaturedProjects.length * gridSlideStepPx}px`
                                                : undefined,
                                    }}
                                >
                                    {bottomFeaturedProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="projects-slider-slide"
                                            style={{
                                                width: gridSlideStepPx > 0 ? `${gridSlideStepPx}px` : undefined,
                                            }}
                                        >
                                            {renderProjectCard(project, true)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="slider-nav-btn next"
                                onClick={nextGridSlide}
                                aria-label={t('home.projects.slider_next') || 'Sonraki'}
                            >
                                <FiChevronRight />
                            </button>
                            {maxGridSlideIndex > 0 && (
                                <div className="projects-slider-dots" role="tablist" aria-label="Projeler listesi">
                                    {Array.from({ length: maxGridSlideIndex + 1 }, (_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            role="tab"
                                            aria-selected={i === gridCurrentIndex}
                                            className={`projects-slider-dot ${i === gridCurrentIndex ? 'active' : ''}`}
                                            onClick={() => setGridCurrentIndex(i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {settings?.show_view_all !== false && (
                    <RevealOnScroll className="section-cta" amount={0.15}>
                        <M.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                            <Link to="/projects" className="btn btn-primary btn-large">
                                {t('home.projects.view_all_projects')} <FiArrowRight />
                            </Link>
                        </M.div>
                    </RevealOnScroll>
                )}
            </div>
        </section>
    );
};

// Stats Section
const StatsSection = ({ data }) => {
    const { language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [language]);

    const loadStats = async () => {
        try {
            const loadedItems = await getStatsItems(language);
            // Sadece aktif olanları filtrele
            const activeItems = loadedItems.filter(item => item.status === 'active');
            setItems(activeItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch (error) {
            console.error('Error loading stats:', error);
            // Fallback veriler
            setItems([
                { number: '2,500+', label: 'Aktif Proje', icon: 'FiTrendingUp', color: '#667eea' },
                { number: '15K+', label: 'Geliştirici', icon: 'FiUsers', color: '#f093fb' },
                { number: '₺5M+', label: 'Toplam Satış', icon: 'FiCreditCard', color: '#4facfe' },
                { number: '50K+', label: 'Mutlu Müşteri', icon: 'FiStar', color: '#43e97b' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Icon mapping
    const iconMap = {
        'FiShield': FiShield,
        'FiZap': FiZap,
        'FiTrendingUp': FiTrendingUp,
        'FiCreditCard': FiCreditCard,
        'FiGift': FiGift,
        'FiTag': FiTag,
        'FiCheckCircle': FiCheckCircle,
        'FiStar': FiStar,
        'FiUsers': FiUsers,
        'FiDownload': FiDownload,
        'FiShoppingCart': FiShoppingCart,
        'FiHeart': FiHeart,
        'FiEye': FiEye,
        'FiCalendar': FiCalendar,
        'FiPackage': FiPackage,
        'FiMail': FiMail,
        'FiPhone': FiPhone,
        'FiMapPin': FiMapPin,
        'FiSend': FiSend,
        'FiMessageCircle': FiMessageCircle
    };

    if (loading) {
        return (
            <section className="stats-section">
                <div className="container">
                    <div className="loading">Yükleniyor...</div>
                </div>
            </section>
        );
    }

    const statsGridVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.1, 0.05);
    const statsItemVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0, scale: 1 }, show: { opacity: 1, y: 0, scale: 1 } }
        : {
              hidden: { opacity: 0, y: 16, scale: 0.94 },
              show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.4, ease: motionEase },
              },
          };

    return (
        <section className="stats-section">
            <div className="container">
                <M.div
                    className="stats-grid"
                    variants={statsGridVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {items.length > 0 ? (
                        items.map((item) => {
                            const IconComponent = iconMap[item.icon] || FiTrendingUp;
                            if (!IconComponent) {
                                console.warn('Icon not found:', item.icon);
                            }
                            return (
                                <M.div
                                    key={item.id || item.number}
                                    variants={statsItemVariants}
                                    className="stat-card stat-animated"
                                    style={{ '--stat-color': item.color || '#667eea' }}
                                >
                                    <div className="stat-icon-wrapper">
                                        {IconComponent ? <IconComponent className="stat-icon" /> : <FiTrendingUp className="stat-icon" />}
                                    </div>
                                    <div className="stat-number">{item.number}</div>
                                    <div className="stat-label">{item.label}</div>
                                </M.div>
                            );
                        })
                    ) : (
                        <p>Henüz istatistik eklenmemiş.</p>
                    )}
                </M.div>
            </div>
        </section>
    );
};

// FAQ Section
const FAQSection = ({ data }) => {
    const { t, language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [faqs, setFaqs] = useState([]);
    const [openIdx, setOpenIdx] = useState(-1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFAQs();
    }, [language]);

    const loadFAQs = async () => {
        try {
            setLoading(true);
            const loadedItems = await getFAQItems(language);
            // Sadece aktif olanları filtrele
            const activeItems = loadedItems.filter(item => item.status === 'active');
            setFaqs(activeItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
            // İlk FAQ'yi varsayılan olarak aç
            if (activeItems.length > 0) {
                setOpenIdx(0);
            }
        } catch (error) {
            console.error('FAQ load error:', error);
            // Fallback veriler
            setFaqs([
                { id: 1, question: 'TeknoProje nedir?', answer: 'TeknoProje, yazılım projelerinizi sergileyen ve satmanız için bir platform.' },
                { id: 2, question: 'Nasıl proje yüklerim?', answer: 'Panelinizdeki "Yeni Proje" butonuna tıklayarak projenizi yükleyebilirsiniz.' },
                { id: 3, question: 'Ödeme ne kadar sürede yapılır?', answer: 'Ödeme işlemi 24-48 saat içinde yapılır.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const toggleFAQ = (idx) => {
        setOpenIdx(openIdx === idx ? -1 : idx);
    };

    if (loading) {
        return (
            <section className="faq-section">
                <div className="container">
                    <div className="loading-faq">{t('home.loading')}</div>
                </div>
            </section>
        );
    }

    const faqListVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.06, 0.04);
    const faqItemVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : staggerItem;

    return (
        <section className="faq-section">
            <div className="container">
                <HomeSectionHeader>
                    <h2>{data?.title || t('home.faq.title')}</h2>
                    <p>{data?.subtitle || t('home.faq.subtitle')}</p>
                </HomeSectionHeader>
                <div className="faq-modern-wrapper">
                    <div className="row gy-5">
                        <div className="col-lg-5">
                            <RevealOnScroll amount={0.15}>
                                <div className="text-center">
                                    <div className="faq-illustration">
                                        <div className="faq-illustration-icon">❓</div>
                                        <h3>{t('home.faq.illustration.title')}</h3>
                                        <p>{t('home.faq.illustration.subtitle')}</p>
                                    </div>
                                </div>
                            </RevealOnScroll>
                        </div>
                        <div className="col-lg-7">
                            <M.div
                                className="accordion"
                                id="accordionFAQ"
                                variants={faqListVariants}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.08 }}
                            >
                                {faqs.map((faq, idx) => (
                                    <M.div
                                        key={faq.id || idx}
                                        variants={faqItemVariants}
                                        className={`card accordion-item ${openIdx === idx ? 'active' : ''}`}
                                        whileHover={reduceMotion ? undefined : { scale: 1.005 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                    >
                                        <h2 className="accordion-header" id={`heading${idx}`}>
                                            <button
                                                type="button"
                                                className={`accordion-button ${openIdx === idx ? '' : 'collapsed'}`}
                                                onClick={() => toggleFAQ(idx)}
                                                aria-expanded={openIdx === idx ? 'true' : 'false'}
                                                aria-controls={`accordion${idx}`}
                                            >
                                                {faq.question}
                                                {openIdx === idx ? (
                                                    <FiChevronUp className="accordion-icon" />
                                                ) : (
                                                    <FiChevronDown className="accordion-icon" />
                                                )}
                                            </button>
                                        </h2>
                                        <div
                                            id={`accordion${idx}`}
                                            className={`accordion-collapse collapse ${openIdx === idx ? 'show' : ''}`}
                                            data-bs-parent="#accordionFAQ"
                                        >
                                            <div className="accordion-body">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </M.div>
                                ))}
                            </M.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// About Section
const AboutSection = ({ data }) => {
    const { t, language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAboutItems();
    }, [language]);

    const loadAboutItems = async () => {
        try {
            const loadedItems = await getAboutItems(language);
            // Sadece aktif olanları filtrele
            const activeItems = loadedItems.filter(item => item.status === 'active');
            setItems(activeItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch (error) {
            console.error('Error loading about items:', error);
            // Fallback veriler
            setItems([
                { text: 'Güvenli ve Güvenilir', icon: 'FiCheckCircle' },
                { text: 'Hızlı ve Kolay', icon: 'FiCheckCircle' },
                { text: 'Destek ve Yardım', icon: 'FiCheckCircle' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Icon mapping
    const iconMap = {
        'FiShield': FiShield, 'FiZap': FiZap, 'FiTrendingUp': FiTrendingUp, 'FiCreditCard': FiCreditCard,
        'FiGift': FiGift, 'FiTag': FiTag, 'FiCheckCircle': FiCheckCircle, 'FiStar': FiStar,
        'FiUsers': FiUsers, 'FiDownload': FiDownload, 'FiShoppingCart': FiShoppingCart,
        'FiHeart': FiHeart, 'FiEye': FiEye, 'FiCalendar': FiCalendar, 'FiPackage': FiPackage,
        'FiMail': FiMail, 'FiPhone': FiPhone, 'FiMapPin': FiMapPin, 'FiSend': FiSend,
        'FiMessageCircle': FiMessageCircle
    };

    if (loading) {
        return (
            <section className="about-section">
                <div className="container">
                    <div className="loading">Yükleniyor...</div>
                </div>
            </section>
        );
    }

    const aboutFeatVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.08, 0.05);
    const aboutItemVariants = reduceMotion
        ? { hidden: { opacity: 1, x: 0 }, show: { opacity: 1, x: 0 } }
        : {
              hidden: { opacity: 0, x: -12 },
              show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: motionEase } },
          };

    return (
        <section className="about-section">
            <div className="container">
                <div className="about-grid">
                    <RevealOnScroll className="about-content" amount={0.15}>
                        <h2>{data?.title || t('home.about.title')}</h2>
                        <p>
                            {data?.description || t('home.about.description')}
                        </p>
                        <M.div
                            className="about-features"
                            variants={aboutFeatVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {items.length > 0 ? (
                                items.map((item, idx) => {
                                    const IconComponent = iconMap[item.icon] || FiCheckCircle;
                                    return (
                                        <M.div key={item.id || idx} variants={aboutItemVariants} className="about-feature">
                                            {IconComponent && <IconComponent className="about-icon" />}
                                            <span>{item.text}</span>
                                        </M.div>
                                    );
                                })
                            ) : (
                                <>
                                    <M.div variants={aboutItemVariants} className="about-feature">
                                        <FiCheckCircle className="about-icon" />
                                        <span>{t('home.about.feature.secure')}</span>
                                    </M.div>
                                    <M.div variants={aboutItemVariants} className="about-feature">
                                        <FiCheckCircle className="about-icon" />
                                        <span>{t('home.about.feature.fast')}</span>
                                    </M.div>
                                    <M.div variants={aboutItemVariants} className="about-feature">
                                        <FiCheckCircle className="about-icon" />
                                        <span>{t('home.about.feature.support')}</span>
                                    </M.div>
                                </>
                            )}
                        </M.div>
                    </RevealOnScroll>
                    <RevealOnScroll className="about-visual" amount={0.12}>
                        <M.img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop"
                            alt="About"
                            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                            transition={{ duration: 0.35, ease: motionEase }}
                            style={{ borderRadius: '12px', display: 'block', width: '100%' }}
                        />
                    </RevealOnScroll>
                </div>
            </div>
        </section>
    );
};

// Blog Section
const BlogSection = ({ data }) => {
    const { t, language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                const response = await blogAPI.getPosts({ limit: 3, lang: language });
                setPosts(response.data.posts || []);
            } catch (error) {
                console.error('Blog load error:', error);
            } finally {
                setLoading(false);
            }
        };
        loadPosts();
    }, [language]);

    if (loading) {
        return (
            <section className="blog-section">
                <div className="container">
                    <div className="section-header">
                        <h2>{data?.title || t('home.blog.title')}</h2>
                        <p>{data?.subtitle || t('home.blog.subtitle')}</p>
                    </div>
                    <div className="loading">{t('home.loading')}</div>
                </div>
            </section>
        );
    }

    if (posts.length === 0) {
        return null;
    }

    const truncateExcerpt = (text, maxLength = 120) => {
        if (!text) return '';
        // HTML etiketlerini temizle (regex ile)
        const plainText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength).trim() + '...';
    };

    const blogGridVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.1, 0.06);
    const blogCardVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : staggerItem;

    return (
        <section className="blog-section">
            <div className="container">
                <HomeSectionHeader>
                    <h2>{data?.title || t('home.blog.title')}</h2>
                    <p>{data?.subtitle || t('home.blog.subtitle')}</p>
                </HomeSectionHeader>
                <M.div
                    className="blog-grid"
                    variants={blogGridVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {posts.map((post) => (
                        <M.div key={post.id} variants={blogCardVariants}>
                            <M.div whileHover={reduceMotion ? undefined : { y: -6 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
                                <Link to={`/blog/${post.slug}`} className="blog-card">
                                    {post.cover_image && (
                                        <div className="blog-image">
                                            <img src={getImageUrl(post.cover_image)} alt={post.title} />
                                        </div>
                                    )}
                                    <div className="blog-content">
                                        {post.category_name && (
                                            <span className="blog-category">{post.category_name}</span>
                                        )}
                                        <span className="blog-date">
                                            <FiClock /> {new Date(post.published_at || post.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE')}
                                        </span>
                                        <h3>{post.title}</h3>
                                        {post.excerpt && (
                                            <p>{truncateExcerpt(post.excerpt, 120)}</p>
                                        )}
                                        <span className="blog-link">
                                            {t('home.blog.read')} <FiArrowRight />
                                        </span>
                                    </div>
                                </Link>
                            </M.div>
                        </M.div>
                    ))}
                </M.div>
            </div>
        </section>
    );
};

// Testimonials Section
function getTestimonialsPerView(widthPx) {
    if (!widthPx || widthPx < 640) return 1;
    if (widthPx < 960) return 2;
    if (widthPx < 1280) return 3;
    return 4;
}

const TestimonialsSection = ({ data }) => {
    const { t, language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [testimonials, setTestimonials] = useState([]);
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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const testimonialsViewportRef = useRef(null);
    const [testimonialsPerView, setTestimonialsPerView] = useState(1);
    const [testimonialsViewportPx, setTestimonialsViewportPx] = useState(0);

    useEffect(() => {
        loadTestimonials();
    }, [language]);

    useEffect(() => {
        const el = testimonialsViewportRef.current;
        if (!el) return;

        const updatePerView = () => {
            const width = el.clientWidth || 0;
            setTestimonialsViewportPx(width);
            setTestimonialsPerView(getTestimonialsPerView(width));
        };

        updatePerView();

        const ro = new ResizeObserver(() => {
            requestAnimationFrame(updatePerView);
        });
        ro.observe(el);

        return () => {
            ro.disconnect();
        };
    }, [testimonials.length]);

    useLayoutEffect(() => {
        if (loading || !settings.slider_enabled) return;
        const el = testimonialsViewportRef.current;
        if (!el) return;
        const width = el.clientWidth || 0;
        if (width > 0) {
            setTestimonialsViewportPx(width);
            setTestimonialsPerView(getTestimonialsPerView(width));
        }
    }, [loading, settings.slider_enabled, testimonials.length]);

    const loadTestimonials = async () => {
        try {
            setLoading(true);
            const [items, settingsData] = await Promise.all([
                getTestimonialsItems(language),
                getTestimonialsSettings()
            ]);

            let filteredItems = items.filter(item => item.status === 'active');

            if (settingsData) {
                setSettings(settingsData);
            }

            // Slider için tüm aktif testimonials'ı göster, display_count sadece grid modunda kullanılacak
            setTestimonials(filteredItems);
        } catch (error) {
            console.error('Testimonials load error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Otomatik oynatma için useEffect
    const effectivePerView = Math.max(1, Math.min(testimonialsPerView, testimonials.length || 1));
    const maxSlideIndex = Math.max(0, testimonials.length - effectivePerView);
    const totalSlides = testimonials.length;

    useEffect(() => {
        setCurrentIndex((prev) => Math.min(prev, maxSlideIndex));
    }, [maxSlideIndex]);

    useEffect(() => {
        if (settings.slider_enabled && settings.auto_play && testimonials.length > 0 && maxSlideIndex > 0) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => {
                    return prev >= maxSlideIndex ? 0 : prev + 1;
                });
            }, settings.auto_play_interval);
            return () => clearInterval(interval);
        }
    }, [settings.slider_enabled, settings.auto_play, settings.auto_play_interval, testimonials.length, maxSlideIndex]);

    if (loading) {
        return (
            <section className="testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <h2>{data?.title || t('home.testimonials.title')}</h2>
                        <p>{data?.subtitle || t('home.testimonials.subtitle')}</p>
                    </div>
                    <div className="loading">{t('home.loading')}</div>
                </div>
            </section>
        );
    }

    if (testimonials.length === 0) {
        return null;
    }

    const handlePrev = () => {
        if (totalSlides === 0) return;
        setCurrentIndex((prev) => {
            if (prev === 0) {
                return maxSlideIndex;
            }
            return prev - 1;
        });
    };

    const handleNext = () => {
        if (totalSlides === 0) return;
        setCurrentIndex((prev) => {
            if (prev >= maxSlideIndex) {
                return 0;
            }
            return prev + 1;
        });
    };

    if (settings.slider_enabled) {
        const slideWidthPercent = 100 / effectivePerView;
        const slidePx =
            testimonialsViewportPx > 0 ? testimonialsViewportPx / effectivePerView : null;
        const trackStyle =
            slidePx !== null
                ? {
                      transform: `translateX(-${currentIndex * slidePx}px)`,
                      width: `${testimonials.length * slidePx}px`
                  }
                : {
                      transform: `translateX(-${currentIndex * slideWidthPercent}%)`,
                      width: `${testimonials.length * slideWidthPercent}%`
                  };
        const slideStyle =
            slidePx !== null
                ? {
                      flex: '0 0 auto',
                      width: `${slidePx}px`,
                      maxWidth: `${slidePx}px`,
                      minWidth: 0
                  }
                : {
                      flex: `0 0 ${slideWidthPercent}%`,
                      maxWidth: `${slideWidthPercent}%`,
                      minWidth: 0
                  };
        return (
            <section className="testimonials-section testimonials-slider">
                <div className="container">
                    <HomeSectionHeader>
                        <h2>{data?.title || t('home.testimonials.title')}</h2>
                        <p>{data?.subtitle || t('home.testimonials.subtitle')}</p>
                    </HomeSectionHeader>
                    <div className="testimonials-slider-wrapper">
                        <button className="slider-nav prev" onClick={handlePrev}>
                            <FiChevronLeft />
                        </button>
                        <div ref={testimonialsViewportRef} className="testimonials-slider-container">
                            <div className="testimonials-slider-track" style={trackStyle}>
                                {testimonials.map((testimonial) => (
                                    <div
                                        key={testimonial.id}
                                        className="testimonials-slide-group"
                                        style={slideStyle}
                                    >
                                        <MotionCard className="testimonial-card" enableHover={!reduceMotion}>
                                            {settings.show_avatar && (
                                                <div className="testimonial-avatar">
                                                    {testimonial.avatar ? (
                                                        <img src={testimonial.avatar} alt={testimonial.name} />
                                                    ) : (
                                                        <FiUser />
                                                    )}
                                                </div>
                                            )}
                                            {settings.show_rating && (
                                                <div className="testimonial-stars">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FiStar
                                                            key={i}
                                                            className={i < (testimonial.rating || 5) ? 'star star-filled' : 'star star-empty'}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <p className="testimonial-text">{testimonial.comment}</p>
                                            <div className="testimonial-author">
                                                <strong>{testimonial.name}</strong>
                                                {testimonial.role && <span>{testimonial.role}</span>}
                                                {settings.show_company && testimonial.company && (
                                                    <span className="testimonial-company">{testimonial.company}</span>
                                                )}
                                            </div>
                                        </MotionCard>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button className="slider-nav next" onClick={handleNext}>
                            <FiChevronRight />
                        </button>
                    </div>
                    <div className="slider-dots">
                        {Array.from({ length: maxSlideIndex + 1 }).map((_, idx) => (
                            <button
                                key={idx}
                                className={`dot ${idx === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(idx)}
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    const tmGridVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.08, 0.05);
    const tmItemVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : staggerItem;

    return (
        <section className="testimonials-section">
            <div className="container">
                <HomeSectionHeader>
                    <h2>{data?.title || 'Kullanıcı Yorumları'}</h2>
                    <p>{data?.subtitle || 'Binlerce memnun kullanıcı bize güveniyor'}</p>
                </HomeSectionHeader>
                <M.div
                    className="testimonials-grid"
                    variants={tmGridVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.12 }}
                >
                    {testimonials.map((testimonial) => (
                        <M.div key={testimonial.id} variants={tmItemVariants}>
                            <MotionCard className="testimonial-card" enableHover={!reduceMotion}>
                                {settings.show_avatar && (
                                    <div className="testimonial-avatar">
                                        {testimonial.avatar ? (
                                            <img src={testimonial.avatar} alt={testimonial.name} />
                                        ) : (
                                            <FiUser />
                                        )}
                                    </div>
                                )}
                                {settings.show_rating && (
                                    <div className="testimonial-stars">
                                        {[...Array(5)].map((_, i) => (
                                            <FiStar
                                                key={i}
                                                className={i < (testimonial.rating || 5) ? 'star star-filled' : 'star star-empty'}
                                            />
                                        ))}
                                    </div>
                                )}
                                <p className="testimonial-text">"{testimonial.comment}"</p>
                                <div className="testimonial-author">
                                    <strong>{testimonial.name}</strong>
                                    {testimonial.role && <span>{testimonial.role}</span>}
                                    {settings.show_company && testimonial.company && (
                                        <span className="testimonial-company">{testimonial.company}</span>
                                    )}
                                </div>
                            </MotionCard>
                        </M.div>
                    ))}
                </M.div>
            </div>
        </section>
    );
};

// Contact Section
// Sponsors Section
const SponsorsSection = ({ data }) => {
    const { t } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSponsors();
    }, []);

    const loadSponsors = async () => {
        try {
            const loaded = await getSponsorsList();
            setSponsors(loaded);
        } catch (error) {
            console.error('Error loading sponsors:', error);
            setSponsors([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="sponsors-section">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (sponsors.length === 0) {
        return null;
    }

    const spGridVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.07, 0.04);
    const spItemVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : staggerItem;

    return (
        <section className="sponsors-section">
            <div className="container">
                <HomeSectionHeader>
                    <h2 className="section-title">{data?.title || t('home.sponsors.title')}</h2>
                    <p className="section-subtitle">{data?.subtitle || t('home.sponsors.subtitle')}</p>
                </HomeSectionHeader>
                <M.div
                    className="sponsors-grid"
                    variants={spGridVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {sponsors.map((sponsor) => {
                        const logoUrl = sponsor.logo?.startsWith('http')
                            ? sponsor.logo
                            : sponsor.logo
                                ? getImageUrl(sponsor.logo)
                                : null;

                        return (
                            <M.div key={sponsor.id} variants={spItemVariants}>
                                <MotionCard className="sponsor-card" enableHover={!reduceMotion} as={M.a}
                                    href={sponsor.link_url || '#'}
                                    target={sponsor.link_url ? '_blank' : '_self'}
                                    rel={sponsor.link_url ? 'noopener noreferrer' : undefined}
                                >
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt={sponsor.name || 'Sponsor'}
                                        className="sponsor-logo"
                                    />
                                ) : (
                                    <div className="sponsor-placeholder">
                                        <FiPackage />
                                        <span>{sponsor.name || 'Sponsor'}</span>
                                    </div>
                                )}
                                {sponsor.description && (
                                    <p className="sponsor-description">{sponsor.description}</p>
                                )}
                                </MotionCard>
                            </M.div>
                        );
                    })}
                </M.div>
            </div>
        </section>
    );
};

// References Section
const ReferencesSection = ({ data }) => {
    const { t } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [references, setReferences] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReferences();
    }, []);

    const loadReferences = async () => {
        try {
            const loaded = await getReferencesList();
            setReferences(loaded);
        } catch (error) {
            console.error('Error loading references:', error);
            setReferences([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="references-section">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (references.length === 0) {
        return null;
    }

    const refGridVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.08, 0.05);
    const refItemVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : staggerItem;

    return (
        <section className="references-section">
            <div className="container">
                <HomeSectionHeader>
                    <h2 className="section-title">{data?.title || t('home.references.title')}</h2>
                    <p className="section-subtitle">{data?.subtitle || t('home.references.subtitle')}</p>
                </HomeSectionHeader>
                <M.div
                    className="references-grid"
                    variants={refGridVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.1 }}
                >
                    {references.map((reference) => {
                        const imageUrl = reference.image?.startsWith('http')
                            ? reference.image
                            : reference.image
                                ? getImageUrl(reference.image)
                                : null;

                        return (
                            <M.div key={reference.id} variants={refItemVariants}>
                                <MotionCard className="reference-card" enableHover={!reduceMotion}>
                                {imageUrl && (
                                    <div className="reference-image-wrapper">
                                        <img
                                            src={imageUrl}
                                            alt={reference.title || 'Referans'}
                                            className="reference-image"
                                        />
                                    </div>
                                )}
                                <div className="reference-content">
                                    <h3 className="reference-title">{reference.title}</h3>
                                    {reference.description && (
                                        <p className="reference-description">{reference.description}</p>
                                    )}
                                    {reference.link && (
                                        <a
                                            href={reference.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="reference-link"
                                        >
                                            <FiLink /> {t('home.projects.view_details')}
                                        </a>
                                    )}
                                </div>
                                </MotionCard>
                            </M.div>
                        );
                    })}
                </M.div>
            </div>
        </section>
    );
};

const ContactSection = ({ data }) => {
    const { t } = useLanguage();
    const reduceMotion = useReducedMotion();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        subject: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    // Telefon maskeleme fonksiyonu
    const formatPhoneNumber = (value) => {
        // Sadece rakamları al
        const numbers = value.replace(/\D/g, '');

        // Türkiye telefon formatı: (5XX) XXX XX XX
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 6) {
            return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        } else if (numbers.length <= 8) {
            return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
        } else {
            return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const formatted = formatPhoneNumber(value);
            setFormData({ ...formData, [name]: formatted });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        // Hata temizle
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('home.contact.errors.name_required');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('home.contact.errors.email_required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('home.contact.errors.email_invalid');
        }

        if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
            newErrors.phone = t('home.contact.errors.phone_invalid');
        }

        if (!formData.message.trim()) {
            newErrors.message = t('home.contact.errors.message_required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await leadsAPI.submit({
                name: formData.name,
                email: formData.email,
                phone: formData.phone.replace(/\D/g, ''),
                message: formData.message,
                subject: formData.subject || t('home.contact.default_subject')
            });

            setSubmitted(true);
            setFormData({
                name: '',
                email: '',
                phone: '',
                message: '',
                subject: ''
            });

            // 3 saniye sonra formu tekrar göster
            setTimeout(() => {
                setSubmitted(false);
            }, 3000);
        } catch (error) {
            alert(error.response?.data?.error || t('home.contact.errors.submit_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="contact-section">
            <div className="container">
                <HomeSectionHeader>
                    <h2>{data?.title || t('home.contact.title')}</h2>
                    <p>{data?.subtitle || t('home.contact.subtitle')}</p>
                </HomeSectionHeader>

                <AnimatePresence mode="wait">
                {submitted ? (
                    <M.div
                        key="success"
                        className="contact-success"
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.28, ease: motionEase }}
                    >
                        <div className="success-icon">✓</div>
                        <h3>{t('home.contact.success_title')}</h3>
                        <p>{t('home.contact.success_desc')}</p>
                    </M.div>
                ) : (
                    <M.div
                        key="form"
                        className="contact-modern-wrapper"
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: motionEase }}
                    >
                        <div className="row gy-5">
                            <div className="col-lg-5">
                                <div className="contact-info-modern">
                                    <h3>{t('home.contact.info_title')}</h3>
                                    <p className="contact-info-desc">
                                        {t('home.contact.info_desc')}
                                    </p>

                                    <div className="contact-info-items">
                                        <div className="contact-info-item">
                                            <div className="info-icon">
                                                <FiMail />
                                            </div>
                                            <div className="info-content">
                                                <h4>{t('home.contact.email')}</h4>
                                                <p>info@teknoproje.com</p>
                                            </div>
                                        </div>

                                        <div className="contact-info-item">
                                            <div className="info-icon">
                                                <FiPhone />
                                            </div>
                                            <div className="info-content">
                                                <h4>{t('home.contact.phone')}</h4>
                                                <p>+90 (555) 123 45 67</p>
                                            </div>
                                        </div>

                                        <div className="contact-info-item">
                                            <div className="info-icon">
                                                <FiMapPin />
                                            </div>
                                            <div className="info-content">
                                                <h4>{t('home.contact.address')}</h4>
                                                <p>İstanbul, Türkiye</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-7">
                                <form onSubmit={handleSubmit} className="contact-form-modern">
                                    <div className="form-row">
                                        <div className="form-group-modern">
                                            <label>
                                                <FiUser /> {t('home.contact.form.name')} <span className="required">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className={errors.name ? 'error' : ''}
                                                placeholder={t('home.contact.form.name_placeholder')}
                                                required
                                            />
                                            {errors.name && <span className="error-message">{errors.name}</span>}
                                        </div>

                                        <div className="form-group-modern">
                                            <label>
                                                <FiMail /> {t('home.contact.form.email')} <span className="required">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={errors.email ? 'error' : ''}
                                                placeholder={t('home.contact.form.email_placeholder')}
                                                required
                                            />
                                            {errors.email && <span className="error-message">{errors.email}</span>}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group-modern">
                                            <label>
                                                <FiPhone /> {t('home.contact.form.phone')}
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className={errors.phone ? 'error' : ''}
                                                placeholder={t('home.contact.form.phone_placeholder')}
                                                maxLength={17}
                                            />
                                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                                        </div>

                                        <div className="form-group-modern">
                                            <label>
                                                <FiMessageCircle /> {t('home.contact.form.subject')}
                                            </label>
                                            <input
                                                type="text"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder={t('home.contact.form.subject_placeholder')}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-modern">
                                        <label>
                                            <FiMessageCircle /> {t('home.contact.form.message')} <span className="required">*</span>
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            className={errors.message ? 'error' : ''}
                                            placeholder={t('home.contact.form.message_placeholder')}
                                            rows="6"
                                            required
                                        />
                                        {errors.message && <span className="error-message">{errors.message}</span>}
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-large btn-submit"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner"></span> {t('home.contact.form.sending')}
                                            </>
                                        ) : (
                                            <>
                                                <FiSend /> {t('home.contact.form.submit')}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </M.div>
                )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default Home;
