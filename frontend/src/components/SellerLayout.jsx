import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminLayout } from '../context/AdminLayoutContext';
import { sellerAPI } from '../api/seller';
import {
    FiHome, FiPackage, FiPlus, FiDollarSign, FiMessageCircle,
    FiUser, FiSettings, FiFileText, FiHelpCircle, FiLogOut,
    FiMenu, FiX, FiShoppingBag, FiHeart, FiBarChart2, FiUsers, FiTag, FiFolder,
    FiList
} from 'react-icons/fi';
import '../pages/Dashboard.css';

const SellerLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { sellerMenuOpen, setSellerMenuOpen } = useAdminLayout();
    const [stats, setStats] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await sellerAPI.getStats();
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
        { icon: FiHome, label: 'Dashboard', path: '/seller/dashboard', badge: null },
        { icon: FiPackage, label: 'Projelerim', path: '/seller/projects', badge: stats?.projects || 0 },
        { icon: FiPlus, label: 'Yeni Proje Ekle', path: '/seller/add-project', badge: null },
        { icon: FiHeart, label: 'Favoriler', path: '/seller/favorites', badge: null },
        { icon: FiDollarSign, label: 'Kazançlarım', path: '/seller/earnings', badge: null },
        { icon: FiList, label: 'Siparişlerim', path: '/seller/orders', badge: stats?.orders || 0 },
        { icon: FiShoppingBag, label: 'Satışlarım', path: '/seller/sales', badge: stats?.sales || 0 },
        { icon: FiBarChart2, label: 'Analitik', path: '/seller/analytics', badge: null },
        { icon: FiUsers, label: 'Müşterilerim', path: '/seller/customers', badge: null },
        { icon: FiTag, label: 'Kuponlarım', path: '/seller/coupons', badge: null },
        { icon: FiFileText, label: 'Raporlar', path: '/seller/reports', badge: null },
        { icon: FiMessageCircle, label: 'Mesajlarım', path: '/seller/messages', badge: null },
        { icon: FiUser, label: 'Profilim', path: '/seller/profile', badge: null },
        { icon: FiSettings, label: 'Ayarlar', path: '/seller/settings', badge: null },
        { icon: FiHelpCircle, label: 'Destek', path: '/tickets', badge: null },
    ];

    return (
        <div className="modern-dashboard">
            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${sellerMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <FiPackage />
                        <span>Satıcı Paneli</span>
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title={sidebarOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
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
                            <h3>{user?.username || 'Satıcı'}</h3>
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
                                onClick={() => setSellerMenuOpen(false)}
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
                    })}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <FiLogOut className="nav-icon" />
                        {sidebarOpen && <span className="nav-label">Çıkış Yap</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {children || <Outlet />}
            </main>

            {/* Mobile Overlay */}
            {sellerMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setSellerMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default SellerLayout;

