import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { usersAPI } from '../api/users';
import {
    FiHome, FiShoppingBag, FiHeart, FiMessageCircle,
    FiUser, FiSettings, FiHelpCircle, FiLogOut,
    FiMenu, FiX, FiDownload, FiDollarSign, FiCreditCard, FiBriefcase
} from 'react-icons/fi';
import '../pages/Dashboard.css';

const UserLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { userMenuOpen, setUserMenuOpen } = useAdminLayout();
    const [stats, setStats] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        loadStats();
        // Her 30 saniyede bir stats'ı yenile (okunmamış mesaj sayısı için)
        const interval = setInterval(() => {
            loadStats();
        }, 30000);

        // Mesaj gönderildiğinde stats'ı yenile
        const handleMessageSent = () => {
            loadStats();
        };

        window.addEventListener('messageSent', handleMessageSent);

        return () => {
            clearInterval(interval);
            window.removeEventListener('messageSent', handleMessageSent);
        };
    }, []);

    const loadStats = async () => {
        try {
            const response = await usersAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Stats load error:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { icon: FiHome, label: t('sidebar.dashboard'), path: '/user/dashboard', badge: null },
        { icon: FiShoppingBag, label: t('sidebar.orders'), path: '/user/orders', badge: stats?.orders || 0 },
        { icon: FiBriefcase, label: t('sidebar.wallet'), path: '/user/wallet', badge: null },
        { icon: FiCreditCard, label: t('sidebar.transactions'), path: '/user/transactions', badge: null },
        { icon: FiHeart, label: t('sidebar.favorites'), path: '/user/favorites', badge: stats?.favorites || 0 },
        { icon: FiDownload, label: t('sidebar.downloads'), path: '/user/downloads', badge: stats?.downloads || 0 },
        { icon: FiDollarSign, label: t('sidebar.donations'), path: '/user/donations', badge: null },
        { icon: FiMessageCircle, label: t('sidebar.messages'), path: '/user/messages', badge: stats?.unread_messages || 0 },
        { icon: FiHelpCircle, label: t('sidebar.support'), path: '/tickets', badge: null },
        { icon: FiUser, label: t('sidebar.profile'), path: '/user/profile', badge: null },
        { icon: FiSettings, label: t('sidebar.settings'), path: '/user/settings', badge: null },
    ];

    return (
        <div className="modern-dashboard">
            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${userMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <FiUser />
                        <span>{t('sidebar.title')}</span>
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title={sidebarOpen ? t('sidebar.close_menu') : t('sidebar.open_menu')}
                    >
                        {sidebarOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                        ) : (
                            <FiUser />
                        )}
                    </div>
                    {sidebarOpen && (
                        <div className="user-info">
                            <h3>{user?.username || t('sidebar.user')}</h3>
                            <p>{user?.email || ''}</p>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={index}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setUserMenuOpen(false)}
                            >
                                <Icon className="nav-icon" />
                                {sidebarOpen && (
                                    <>
                                        <span className="nav-label">{item.label}</span>
                                        {item.badge !== null && item.badge > 0 && (
                                            <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                                        )}
                                    </>
                                )}
                                {!sidebarOpen && item.badge !== null && item.badge > 0 && (
                                    <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <FiLogOut className="nav-icon" />
                        {sidebarOpen && <span className="nav-label">{t('sidebar.logout')}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {children}
            </main>

            {/* Mobile Overlay */}
            {userMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setUserMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default UserLayout;

