import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminLayout } from '../context/AdminLayoutContext';
import api from '../api/axios';
import {
    FiHome, FiUsers, FiPackage, FiSettings, FiLogOut,
    FiMenu, FiX, FiFileText, FiDollarSign, FiShoppingBag,
    FiTrendingUp, FiShield, FiBarChart2, FiGift, FiCreditCard,
    FiGlobe, FiList, FiMail, FiMessageSquare, FiBell,
    FiLayers, FiTag, FiImage, FiBookOpen, FiLink, FiStar,
    FiServer, FiDatabase, FiLock, FiZap, FiEdit,
    FiEye, FiTrash2, FiPlus, FiSearch, FiFilter,
    FiChevronDown, FiChevronRight, FiUserPlus, FiUserX,
    FiDollarSign as FiMoney, FiActivity, FiTrendingDown,
    FiCalendar, FiClock, FiCheckCircle, FiXCircle,
    FiAlertCircle, FiInfo, FiHelpCircle, FiSliders,
    FiGrid, FiLayout, FiMonitor, FiSmartphone, FiTablet, FiAward
} from 'react-icons/fi';
import '../pages/Dashboard.css';

const AdminLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { mobileMenuOpen, setMobileMenuOpen, sidebarOpen, setSidebarOpen } = useAdminLayout();
    const [stats, setStats] = useState(null);
    const [pendingTicketsCount, setPendingTicketsCount] = useState(0);
    const [expandedMenus, setExpandedMenus] = useState({});

    useEffect(() => {
        loadStats();
        loadPendingTicketsCount();
        // URL'e göre aktif menüleri aç
        const path = location.pathname;
        const newExpandedMenus = {};

        if (path.includes('/admin/settings') || path.includes('/admin/coupons') || path.includes('/admin/bank-accounts')) {
            newExpandedMenus['Site Yönetimi'] = true;
        }
        if (path.includes('/admin/languages')) {
            newExpandedMenus['Dil Yönetimi'] = true;
        }
        if (path.includes('/admin/menus')) {
            newExpandedMenus['Menü Yönetimi'] = true;
        }
        if (path.includes('/admin/users')) {
            newExpandedMenus['Müşteri Yönetimi'] = true;
        }
        if (path.includes('/admin/accounting')) {
            newExpandedMenus['Muhasebe'] = true;
        }
        if (path.includes('/admin/blog') || path.includes('/admin/pages') || path.includes('/admin/services') || path.includes('/admin/references') || path.includes('/admin/projects') || path.includes('/admin/sections')) {
            newExpandedMenus['İçerik Yönetimi'] = true;
        }
        if (path.includes('/admin/orders') || path.includes('/admin/transactions') || path.includes('/admin/donations') || path.includes('/admin/coupons') || path.includes('/admin/payment-requests')) {
            newExpandedMenus['E-Ticaret'] = true;
        }
        if (path.includes('/admin/subscriptions')) {
            newExpandedMenus['Abonelikler'] = true;
        }
        if (path.includes('/admin/notifications')) {
            newExpandedMenus['Bildirimler'] = true;
        }
        if (path.includes('/admin/reports')) {
            newExpandedMenus['Raporlar & Analitik'] = true;
        }
        if (path.includes('/admin/admins')) {
            newExpandedMenus['Yöneticiler'] = true;
        }

        if (Object.keys(newExpandedMenus).length > 0) {
            setExpandedMenus(prev => ({ ...prev, ...newExpandedMenus }));
        }
    }, [location.pathname]);

    const loadStats = async () => {
        try {
            const response = await api.get('/admin/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Admin stats load error:', error);
        }
    };

    const loadPendingTicketsCount = async () => {
        try {
            const response = await api.get('/tickets/pending-count');
            setPendingTicketsCount(response.data.count || 0);
        } catch (error) {
            console.error('Pending tickets count load error:', error);
            setPendingTicketsCount(0);
        }
    };

    // Her 30 saniyede bir yanıt bekleyen ticket sayısını güncelle
    useEffect(() => {
        const interval = setInterval(() => {
            loadPendingTicketsCount();
        }, 30000); // 30 saniye

        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleMenu = (menuKey) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }));
    };

    const menuStructure = [
        {
            type: 'single',
            icon: FiHome,
            label: 'Dashboard',
            path: '/admin/dashboard',
            badge: null
        },
        {
            type: 'category',
            label: 'Site Yönetimi',
            icon: FiSettings,
            items: [
                { icon: FiSliders, label: 'Genel Ayarlar', path: '/admin/settings/general' },
                { icon: FiServer, label: 'API Ayarları', path: '/admin/settings/api' },
                { icon: FiMail, label: 'İletişim Ayarları', path: '/admin/settings/contact' },
                { icon: FiGlobe, label: 'Sosyal Medya', path: '/admin/settings/social' },
                { icon: FiLayers, label: 'Modül Ayarları', path: '/admin/settings/modules' },
                { icon: FiLock, label: 'Limit Ayarları', path: '/admin/settings/limits' },
                { icon: FiZap, label: 'Bakım Modu', path: '/admin/settings/maintenance' },
                { icon: FiMail, label: 'Mail Ayarları', path: '/admin/settings/email' },
                { icon: FiMessageSquare, label: 'SMS Ayarları', path: '/admin/settings/sms' },
                { icon: FiCreditCard, label: 'Sanal Poslar', path: '/admin/settings/payment' },
                { icon: FiCreditCard, label: 'Banka Hesapları', path: '/admin/bank-accounts' },
                { icon: FiImage, label: 'Arka Plan Görselleri', path: '/admin/settings/backgrounds' },
                { icon: FiTag, label: 'Kuponlar', path: '/admin/coupons' },
            ]
        },
        {
            type: 'category',
            label: 'Dil Yönetimi',
            icon: FiGlobe,
            items: [
                { icon: FiPlus, label: 'Yeni Dil Ekle', path: '/admin/languages/add' },
                { icon: FiList, label: 'Dil Listesi', path: '/admin/languages' },
            ]
        },
        {
            type: 'category',
            label: 'Menü Yönetimi',
            icon: FiList,
            items: [
                { icon: FiMenu, label: 'Header Menü', path: '/admin/menus/header' },
                { icon: FiMenu, label: 'Footer Menü', path: '/admin/menus/footer' },
                { icon: FiMenu, label: 'Kurumsal Menü', path: '/admin/menus/corporate' },
            ]
        },
        {
            type: 'category',
            label: 'Müşteri Yönetimi',
            icon: FiUsers,
            items: [
                { icon: FiUsers, label: 'Tüm Müşteriler', path: '/admin/users' },
                { icon: FiUserX, label: 'Engellenen Müşteriler', path: '/admin/users/banned' },
                { icon: FiUserPlus, label: 'Rehberim', path: '/admin/users/contacts' },
                { icon: FiMail, label: 'Toplu E-Mail', path: '/admin/users/bulk-email' },
                { icon: FiMessageSquare, label: 'Toplu SMS', path: '/admin/users/bulk-sms' },
                { icon: FiFileText, label: 'Bildirim Şablonları', path: '/admin/users/notification-templates' },
            ]
        },
        {
            type: 'category',
            label: 'Muhasebe',
            icon: FiDollarSign,
            items: [
                { icon: FiClock, label: 'Bekleyen Faturalar', path: '/admin/accounting/pending-invoices' },
                { icon: FiCheckCircle, label: 'Onaylanan Faturalar', path: '/admin/accounting/approved-invoices' },
                { icon: FiCreditCard, label: 'Banka Havalesi Bildirimleri', path: '/admin/bank-transfer-notifications' },
            ]
        },
        {
            type: 'single',
            icon: FiHelpCircle,
            label: 'Destek Merkezi',
            path: '/admin/support',
            badge: pendingTicketsCount
        },
        {
            type: 'category',
            label: 'İçerik Yönetimi',
            icon: FiFileText,
            items: [
                { icon: FiPackage, label: 'Projeler', path: '/admin/projects' },
                { icon: FiFileText, label: 'Bölümler', path: '/admin/sections' },
                { icon: FiBookOpen, label: 'Blog', path: '/admin/blog' },
                { icon: FiFileText, label: 'Sayfalar', path: '/admin/pages' },
                { icon: FiFileText, label: 'Hizmetler', path: '/admin/services' },
                { icon: FiLink, label: 'Referanslar', path: '/admin/references' },
                { icon: FiStar, label: 'Sponsorlar', path: '/admin/sponsors' },
            ]
        },
        {
            type: 'category',
            label: 'E-Ticaret',
            icon: FiShoppingBag,
            items: [
                { icon: FiShoppingBag, label: 'Siparişler', path: '/admin/orders' },
                { icon: FiCreditCard, label: 'Ödeme Talepleri', path: '/admin/payment-requests' },
                { icon: FiDollarSign, label: 'İşlemler', path: '/admin/transactions' },
                { icon: FiGift, label: 'Bağışlar', path: '/admin/donations' },
                { icon: FiAward, label: 'Ödül Yönetimi', path: '/admin/loyalty-rewards' },
                { icon: FiTag, label: 'Kuponlar', path: '/admin/coupons' },
            ]
        },
        {
            type: 'category',
            label: 'Abonelikler',
            icon: FiCreditCard,
            items: [
                { icon: FiCreditCard, label: 'Abonelik Planları', path: '/admin/subscriptions/plans' },
                { icon: FiUsers, label: 'Aktif Abonelikler', path: '/admin/subscriptions/active' },
                { icon: FiBarChart2, label: 'Abonelik İstatistikleri', path: '/admin/subscriptions/stats' },
            ]
        },
        {
            type: 'category',
            label: 'Bildirimler',
            icon: FiBell,
            items: [
                { icon: FiCreditCard, label: 'Ödeme Bildirimleri', path: '/admin/notifications/payments', badge: 0 },
                { icon: FiMail, label: 'E-Bülten', path: '/admin/notifications/newsletter', badge: 0 },
                { icon: FiMessageSquare, label: 'Mesajlar', path: '/admin/notifications/messages', badge: 0 },
                { icon: FiMessageSquare, label: 'Yorumlar', path: '/admin/notifications/comments', badge: 0 },
            ]
        },
        {
            type: 'category',
            label: 'Raporlar & Analitik',
            icon: FiBarChart2,
            items: [
                { icon: FiBarChart2, label: 'Genel Raporlar', path: '/admin/reports' },
                { icon: FiTrendingUp, label: 'Satış Raporları', path: '/admin/reports/sales' },
                { icon: FiUsers, label: 'Kullanıcı Raporları', path: '/admin/reports/users' },
                { icon: FiActivity, label: 'Aktivite Raporları', path: '/admin/reports/activity' },
            ]
        },
        {
            type: 'category',
            label: 'Yöneticiler',
            icon: FiShield,
            items: [
                { icon: FiUserPlus, label: 'Yeni Yönetici Ekle', path: '/admin/admins/add' },
                { icon: FiUsers, label: 'Yönetici Listesi', path: '/admin/admins' },
            ]
        },
    ];

    const renderMenuItem = (item, level = 0) => {
        if (item.type === 'single') {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
                >
                    <Icon className="nav-icon" />
                    {sidebarOpen && (
                        <>
                            <span className="nav-label">{item.label}</span>
                            {item.badge !== null && item.badge > 0 && (
                                <span className="nav-badge">{item.badge}</span>
                            )}
                        </>
                    )}
                </Link>
            );
        }

        if (item.type === 'category') {
            const Icon = item.icon;
            const isExpanded = expandedMenus[item.label];
            const hasActiveChild = item.items?.some(subItem => location.pathname === subItem.path);

            return (
                <div key={item.label} className="nav-category">
                    <button
                        className={`nav-category-header ${hasActiveChild ? 'active' : ''}`}
                        onClick={() => toggleMenu(item.label)}
                        style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
                    >
                        <Icon className="nav-icon" />
                        {sidebarOpen && (
                            <>
                                <span className="nav-label">{item.label}</span>
                                {isExpanded ? <FiChevronDown className="nav-arrow" /> : <FiChevronRight className="nav-arrow" />}
                            </>
                        )}
                    </button>
                    {sidebarOpen && isExpanded && item.items && (
                        <div className="nav-submenu">
                            {item.items.map((subItem, index) => {
                                const SubIcon = subItem.icon;
                                const isSubActive = location.pathname === subItem.path;
                                return (
                                    <Link
                                        key={subItem.path || index}
                                        to={subItem.path}
                                        className={`nav-item ${isSubActive ? 'active' : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        style={{ paddingLeft: `${(level + 1) * 1.5 + 1}rem` }}
                                    >
                                        {SubIcon && <SubIcon className="nav-icon" />}
                                        <span className="nav-label">{subItem.label}</span>
                                        {subItem.badge !== null && subItem.badge > 0 && (
                                            <span className="nav-badge">{subItem.badge}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="modern-dashboard">
            {/* Sidebar */}
            <aside
                className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}
                onClick={(e) => {
                    // Sadece sidebar'ın kendisine tıklanırsa (overlay'e gitmesin)
                    if (e.target === e.currentTarget) {
                        e.stopPropagation();
                    }
                }}
            >
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <FiShield />
                        <span>Admin Paneli</span>
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Mobil görünümde ise mobile menu'yu kapat
                            if (mobileMenuOpen) {
                                setMobileMenuOpen(false);
                            }
                            // Sidebar'ı toggle et
                            setSidebarOpen(prev => !prev);
                        }}
                        title={sidebarOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
                    >
                        {sidebarOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar admin-avatar">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                        ) : (
                            <FiShield />
                        )}
                    </div>
                    {sidebarOpen && (
                        <div className="user-info">
                            <h3>{user?.username || 'Admin'}</h3>
                            <p className="admin-badge">Yönetici</p>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {menuStructure.map(item => renderMenuItem(item))}
                </nav>

                <div className="sidebar-footer">
                    <Link to="/" className="nav-item">
                        <FiHome className="nav-icon" />
                        {sidebarOpen && <span className="nav-label">Ana Sayfa</span>}
                    </Link>
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <FiLogOut className="nav-icon" />
                        {sidebarOpen && <span className="nav-label">Çıkış Yap</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {children}
            </main>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default AdminLayout;
