import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion as M } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useModules } from '../context/ModulesContext';
import { getImageUrl } from '../utils/api';
import LanguageSelector from './LanguageSelector';
import {
    FiHome, FiGrid, FiBook, FiMail, FiShoppingCart,
    FiUser, FiLogOut, FiMenu, FiX, FiSun, FiMoon,
    FiCreditCard, FiHeadphones, FiSettings, FiUsers,
    FiPackage, FiTrendingUp, FiFileText, FiChevronDown, FiShield
} from 'react-icons/fi';
import * as Icons from 'react-icons/fi';
import api from '../api/axios';
import './Header.css';

function isPrimaryNavActive(to, pathname) {
    if (!to || to === '#') return false;
    if (to === '/') return pathname === '/';
    return pathname === to || pathname.startsWith(`${to}/`);
}

const Header = ({ mobileMenuOpen: propMobileMenuOpen, setMobileMenuOpen: propSetMobileMenuOpen }) => {
    const { user, logout, isAuthenticated, isAdmin, isSeller } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { cartCount } = useCart();
    const { t, language } = useLanguage();
    const { modules } = useModules();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        mobileMenuOpen: adminMobileMenuOpen,
        setMobileMenuOpen: setAdminMobileMenuOpen,
        sellerMenuOpen,
        setSellerMenuOpen,
        userMenuOpen,
        setUserMenuOpen
    } = useAdminLayout();
    const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
    const mobileMenuOpen = propMobileMenuOpen !== undefined ? propMobileMenuOpen : internalMobileMenuOpen;
    const setMobileMenuOpen = propSetMobileMenuOpen || setInternalMobileMenuOpen;
    const isAdminPage = location.pathname.startsWith('/admin');
    const isSellerPage = location.pathname.startsWith('/seller');
    const isUserPage = location.pathname.startsWith('/user');
    const [corporateMenuItems, setCorporateMenuItems] = useState([]);
    const [hoveredMenuItem, setHoveredMenuItem] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [fixedOrder, setFixedOrder] = useState(['home', 'projects', 'blog', 'contact', 'corporate']);
    const corporateMenuRef = useRef(null);
    const [siteSettings, setSiteSettings] = useState({ logo: '', siteName: 'TeknoProje' });

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    // Site ayarlarını yükle
    useEffect(() => {
        loadSiteSettings();
    }, []);

    // Kurumsal menüyü yükle (public)
    useEffect(() => {
        loadCorporateMenu();
        loadFixedOrder();

        // Ekran boyutu değişikliğini dinle
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [language]); // Dil değiştiğinde menüyü yeniden yükle

    const loadSiteSettings = async () => {
        try {
            const response = await api.get('/public/settings/general');
            if (response.data) {
                console.log('📸 Logo ayarları yüklendi:', response.data.logo);
                setSiteSettings({
                    logo: response.data.logo || response.data.logo_url || '',
                    siteName: response.data.siteName || response.data.site_name || 'TeknoProje'
                });
            }
        } catch (error) {
            console.error('Site settings load error:', error);
            // Varsayılan değerler zaten state'te tanımlı
        }
    };

    // Kurumsal dropdown dışına tıklanınca kapat
    useEffect(() => {
        const handleOutside = (e) => {
            if (corporateMenuRef.current && !corporateMenuRef.current.contains(e.target)) {
                if (hoveredMenuItem === 'corporate') setHoveredMenuItem(null);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [hoveredMenuItem]);

    const loadFixedOrder = async () => {
        try {
            const res = await api.get('/public/settings/navigation');
            const raw = res.data?.header_fixed_nav_order;
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) setFixedOrder(parsed);
            }
        } catch (e) {
            // varsayılan kalsın
        }
    };

    const fixedMap = {
        home: { to: '/', icon: <FiHome />, label: t('header.home') },
        projects: { to: '/projects', icon: <FiGrid />, label: t('header.projects') },
        blog: modules?.blogEnabled ? { to: '/blog', icon: <FiBook />, label: t('header.blog') } : null,
        contact: { to: '/contact', icon: <FiMail />, label: t('header.contact') },
        corporate: { to: '#', icon: null, label: t('header.corporate') },
    };

    const loadCorporateMenu = async () => {
        try {
            const response = await api.get(`/menus/corporate?lang=${language}`);
            const items = response.data.items || [];

            const rootItems = items
                .filter(item => !item.parent_id)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            const tree = rootItems.map(item => ({
                ...item,
                title: item.translated_title || item.title, // Çevrilmiş başlığı kullan
                children: items
                    .filter(child => child.parent_id === item.id)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(child => ({
                        ...child,
                        title: child.translated_title || child.title // Çevrilmiş başlığı kullan
                    }))
            }));

            setCorporateMenuItems(tree);
        } catch (error) {
            console.error('Corporate menu load error:', error);
            setCorporateMenuItems([]);
        }
    };

    // Icon render fonksiyonu
    const renderIcon = (iconName) => {
        if (!iconName) return null;

        // Emoji kontrolü
        if (/[\u{1F300}-\u{1F9FF}]/u.test(iconName)) {
            return <span className="menu-icon-emoji">{iconName}</span>;
        }

        // React Icons kontrolü
        const IconComponent = Icons[iconName] || Icons['FiLink'];
        return IconComponent ? <IconComponent /> : null;
    };


    return (
        <>
        <header className="main-header">
            <div className="header-content container">
                <div className="logo-section">
                    <Link to="/" className="logo" onClick={closeMobileMenu}>
                        {siteSettings?.logo ? (
                            <img 
                                src={getImageUrl(siteSettings.logo)} 
                                alt={siteSettings?.siteName || 'TeknoProje'}
                                className="logo-image"
                            />
                        ) : (
                            <span className="logo-icon">⚡</span>
                        )}
                        <span className="logo-text">{siteSettings?.siteName || 'TeknoProje'}</span>
                    </Link>

                    {/* Admin Panel Toggle - Only show on admin pages */}
                    {isAdmin && isAdminPage && (
                        <button
                            className="admin-sidebar-toggle-header"
                            onClick={() => setAdminMobileMenuOpen(!adminMobileMenuOpen)}
                            aria-label={t('header.admin_menu')}
                        >
                            {adminMobileMenuOpen ? <FiX /> : <FiShield />}
                        </button>
                    )}

                    {/* Seller Panel Toggle - Only show on seller pages */}
                    {isSeller && isSellerPage && (
                        <button
                            className="seller-sidebar-toggle-header"
                            onClick={() => setSellerMenuOpen(!sellerMenuOpen)}
                            aria-label={t('header.seller_menu')}
                        >
                            {sellerMenuOpen ? <FiX /> : <FiSettings />}
                        </button>
                    )}

                    {/* User Panel Toggle - Only show on user pages */}
                    {isAuthenticated && isUserPage && (
                        <button
                            className="user-sidebar-toggle-header"
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            aria-label={t('header.user_menu')}
                        >
                            {userMenuOpen ? <FiX /> : <FiUser />}
                        </button>
                    )}
                </div>


                <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`} id="main-navigation">
                    <LayoutGroup id="header-primary-nav">
                    <ul className="nav-links">
                        {fixedOrder.map((key) => {
                            if (key === 'corporate') {
                                return (
                                    <li
                                        key="corporate"
                                        className={corporateMenuItems.length > 0 ? 'has-dropdown' : ''}
                                        ref={corporateMenuRef}
                                    >
                                        <button
                                            type="button"
                                            className="nav-dropdown-toggle"
                                            onClick={() => {
                                                if (corporateMenuItems.length > 0) {
                                                    setHoveredMenuItem(hoveredMenuItem === 'corporate' ? null : 'corporate');
                                                }
                                            }}
                                            disabled={corporateMenuItems.length === 0}
                                            aria-expanded={hoveredMenuItem === 'corporate'}
                                        >
                                            <span>{t('header.corporate')}</span>
                                            {corporateMenuItems.length > 0 && (
                                                <FiChevronDown className={`dropdown-arrow ${hoveredMenuItem === 'corporate' ? 'open' : ''}`} />
                                            )}
                                        </button>

                                        {corporateMenuItems.length > 0 && hoveredMenuItem === 'corporate' && (
                                            <ul className="dropdown-menu">
                                                {corporateMenuItems.map((item) => (
                                                    <li key={item.id}>
                                                        <Link
                                                            to={item.url || '/'}
                                                            onClick={closeMobileMenu}
                                                            target={item.target || '_self'}
                                                        >
                                                            {renderIcon(item.icon)}
                                                            <span>{item.title}</span>
                                                        </Link>

                                                        {item.children && item.children.length > 0 && (
                                                            <ul className="dropdown-submenu">
                                                                {item.children.map((sub) => (
                                                                    <li key={sub.id}>
                                                                        <Link
                                                                            to={sub.url || '/'}
                                                                            onClick={closeMobileMenu}
                                                                            target={sub.target || '_self'}
                                                                            className="submenu-item"
                                                                        >
                                                                            {renderIcon(sub.icon)}
                                                                            <span>{sub.title}</span>
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                );
                            }

                            const cfg = fixedMap[key];
                            if (!cfg) return null;
                            
                            // Blog modülü kapalıysa gösterme
                            if (key === 'blog' && !modules?.blogEnabled) return null;
                            const active = isPrimaryNavActive(cfg.to, location.pathname);
                            return (
                                <li key={key}>
                                    <Link
                                        to={cfg.to}
                                        onClick={closeMobileMenu}
                                        className={active ? 'nav-link--primary-active' : ''}
                                        aria-current={active ? 'page' : undefined}
                                    >
                                        {active && (
                                            <M.span
                                                layoutId="header-nav-pill"
                                                className="nav-active-pill"
                                                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                            />
                                        )}
                                        <span className="nav-link-content">
                                            {cfg.icon} <span>{cfg.label}</span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}

                        {isAuthenticated && (
                            <>
                                <li>
                                    <Link
                                        to="/cart"
                                        onClick={closeMobileMenu}
                                        className={`cart-icon-animation-target${isPrimaryNavActive('/cart', location.pathname) ? ' nav-link--primary-active' : ''}`}
                                        aria-current={isPrimaryNavActive('/cart', location.pathname) ? 'page' : undefined}
                                    >
                                        {isPrimaryNavActive('/cart', location.pathname) && (
                                            <M.span
                                                layoutId="header-nav-pill"
                                                className="nav-active-pill"
                                                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                            />
                                        )}
                                        <span className="nav-link-content">
                                            <FiShoppingCart /> <span>{t('header.cart')}</span>
                                            {cartCount && cartCount > 0 ? (
                                                <span className="badge cart-badge">{cartCount}</span>
                                            ) : null}
                                        </span>
                                    </Link>
                                </li>
                                <li className="nav-divider mobile-only"></li>
                                <li className="mobile-only">
                                    <Link to="/user/dashboard" onClick={closeMobileMenu}>
                                        <FiUser /> <span>{t('header.dashboard')}</span>
                                    </Link>
                                </li>
                                <li className="mobile-only">
                                    <Link to="/profile" onClick={closeMobileMenu}>
                                        <FiUser /> <span>{t('header.profile')}</span>
                                    </Link>
                                </li>
                                {modules?.subscriptionsEnabled && (
                                    <li className="mobile-only">
                                        <Link to="/subscriptions" onClick={closeMobileMenu}>
                                            <FiCreditCard /> <span>{t('header.subscriptions')}</span>
                                        </Link>
                                    </li>
                                )}
                                <li className="mobile-only">
                                    <Link to="/contact" onClick={closeMobileMenu}>
                                        <FiMail /> <span>{t('header.contact')}</span>
                                    </Link>
                                </li>
                                <li className="mobile-only">
                                    {modules.ticketsEnabled && (
                                        <Link to="/tickets" onClick={closeMobileMenu}>
                                            <FiHeadphones /> <span>{t('header.support')}</span>
                                        </Link>
                                    )}
                                </li>
                                {(user?.role === 'seller' || user?.role === 'admin') && (
                                    <li className="mobile-only">
                                        <Link to="/seller/dashboard" onClick={closeMobileMenu}>
                                            <FiSettings /> <span>{t('header.seller_panel')}</span>
                                        </Link>
                                    </li>
                                )}
                                {user?.role === 'admin' && (
                                    <>
                                        <li className="mobile-only">
                                            <Link to="/admin/dashboard" onClick={closeMobileMenu}>
                                                <FiTrendingUp /> <span>{t('header.admin_panel')}</span>
                                            </Link>
                                        </li>
                                        <li className="mobile-only">
                                            <Link to="/admin/users" onClick={closeMobileMenu}>
                                                <FiUsers /> <span>{t('header.users')}</span>
                                            </Link>
                                        </li>
                                        <li className="mobile-only">
                                            <Link to="/admin/projects" onClick={closeMobileMenu}>
                                                <FiPackage /> <span>{t('header.projects')}</span>
                                            </Link>
                                        </li>
                                        <li className="mobile-only">
                                            <Link to="/admin/sections" onClick={closeMobileMenu}>
                                                <FiFileText /> <span>{t('header.sections')}</span>
                                            </Link>
                                        </li>
                                    </>
                                )}
                                <li className="nav-divider mobile-only"></li>
                                <li className="mobile-only">
                                    <button onClick={handleLogout} className="btn-logout">
                                        <FiLogOut /> <span>{t('header.logout')}</span>
                                    </button>
                                </li>
                            </>
                        )}

                        {!isAuthenticated && (
                            <>
                                <li className="mobile-only">
                                    <Link to="/contact" onClick={closeMobileMenu}>
                                        <FiMail /> <span>{t('header.contact')}</span>
                                    </Link>
                                </li>
                                <li className="mobile-only">
                                    {modules.ticketsEnabled && (
                                        <Link to="/tickets" onClick={closeMobileMenu}>
                                            <FiHeadphones /> <span>{t('header.support')}</span>
                                        </Link>
                                    )}
                                </li>
                                <li className="nav-divider"></li>
                                <li>
                                    <Link to="/login" className="btn-nav" onClick={closeMobileMenu}>
                                        {t('header.login')}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/register" className="btn-nav btn-nav-primary" onClick={closeMobileMenu}>
                                        {t('header.register')}
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* Mobile Only Extras */}
                        <li className="nav-divider mobile-only"></li>
                        <li className="mobile-only mobile-extras">
                            <div className="mobile-extra-item">
                                <LanguageSelector />
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="theme-toggle mobile-menu-theme-toggle"
                                aria-label={t('theme.toggle', 'Tema değiştir')}
                            >
                                {theme === 'light' ? <FiMoon /> : <FiSun />}
                                <span>
                                    {theme === 'light'
                                        ? t('theme.switch_to_dark', 'Koyu Mod')
                                        : t('theme.switch_to_light', 'Açık Mod')}
                                </span>
                            </button>
                        </li>
                    </ul>
                    </LayoutGroup>
                </nav>
            </div>
        </header>
        <AnimatePresence>
            {mobileMenuOpen && isMobile ? (
                <M.button
                    type="button"
                    className="mobile-nav-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={closeMobileMenu}
                    aria-label="Menüyü kapat"
                />
            ) : null}
        </AnimatePresence>
        </>
    );
};

export default Header;
