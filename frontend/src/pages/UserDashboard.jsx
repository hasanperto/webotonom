import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usersAPI } from '../api/users';
import {
    FiShoppingBag, FiHeart, FiMessageCircle,
    FiCreditCard, FiGift, FiFileText,
    FiBell, FiSearch, FiPackage, FiStar,
    FiMail, FiDownload, FiShoppingCart,
    FiBookmark, FiShare2, FiUser, FiSettings,
    FiEye, FiPlus
} from 'react-icons/fi';
import './Dashboard.css';

const UserDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await usersAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Stats load error:', error);
        } finally {
            setLoading(false);
        }
    };


    const quickActions = [
        { icon: FiSearch, label: t('dashboard.quick_actions.explore_projects'), path: '/projects', color: '#696cff' },
        { icon: FiPackage, label: t('dashboard.quick_actions.my_orders'), path: '/user/orders', color: '#10b981' },
        { icon: FiStar, label: t('dashboard.quick_actions.my_favorites'), path: '/user/favorites', color: '#f59e0b' },
        { icon: FiMail, label: t('dashboard.quick_actions.my_messages'), path: '/user/messages', color: '#3b82f6' },
        { icon: FiGift, label: t('dashboard.quick_actions.my_donations'), path: '/user/donations', color: '#ef4444' },
        { icon: FiFileText, label: t('dashboard.quick_actions.support_tickets'), path: '/tickets', color: '#8b5cf6' },
        { icon: FiUser, label: t('dashboard.quick_actions.my_profile'), path: '/user/profile', color: '#06b6d4' },
        { icon: FiSettings, label: t('dashboard.quick_actions.settings'), path: '/user/settings', color: '#64748b' },
        { icon: FiShoppingCart, label: t('dashboard.quick_actions.my_cart'), path: '/cart', color: '#f97316' },
        { icon: FiDownload, label: t('dashboard.quick_actions.my_downloads'), path: '/user/downloads', color: '#14b8a6' },
        { icon: FiBookmark, label: t('dashboard.quick_actions.bookmarked_projects'), path: '/user/bookmarks', color: '#a855f7' },
        { icon: FiShare2, label: t('dashboard.quick_actions.my_shares'), path: '/user/shares', color: '#ec4899' },
    ];

    if (loading) {
        return (
            <UserLayout>
                <div className="dashboard-loading">
                    <div className="spinner-large"></div>
                    <p>{t('dashboard.loading')}</p>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>{t('dashboard.welcome', { username: user?.username })}</h1>
                        <p>{t('dashboard.subtitle')}</p>
                    </div>
                    <div className="header-actions">
                        <button className="header-btn" title={t('dashboard.notifications')}>
                            <FiBell />
                            {stats?.unread_messages > 0 && (
                                <span className="notification-badge">{stats.unread_messages}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats Cards - Minimal Design */}
                {/* Advanced Stats Grid */}
                <div className="user-stats-grid-advanced">
                    {/* Bakiye Kartı - Öne Çıkan (Mevcut Tasarım Korunuyor) */}
                    <div className="stat-card-balance">
                        <div className="balance-header">
                            <div className="balance-icon">
                                <FiCreditCard />
                            </div>
                            <div className="balance-info">
                                <span className="balance-label">{t('dashboard.balance')}</span>
                                <h2 className="balance-amount">₺{parseFloat(stats?.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                            </div>
                        </div>
                        <div className="balance-actions">
                            <Link to="/user/wallet" className="balance-btn">
                                <FiPlus /> {t('dashboard.load_money')}
                            </Link>
                            <Link to="/user/transactions" className="balance-btn outline">
                                <FiEye /> {t('dashboard.transactions')}
                            </Link>
                        </div>
                    </div>

                    {/* Siparişler - Compact Advanced Card */}
                    <Link to="/user/orders" className="stat-card-advanced orders-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper orders">
                                <FiShoppingBag className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">{t('dashboard.stats.orders')}</span>
                                <span className="stat-value-advanced">{stats?.orders || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card-body compact">
                            <div className="mini-stat warning">
                                <span className="mini-label">Bekleyen</span>
                                <span className="mini-value">{stats?.orders_details?.pending || 0}</span>
                            </div>
                            <div className="mini-stat info">
                                <span className="mini-label">İşlemde</span>
                                <span className="mini-value">{stats?.orders_details?.processing || 0}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Tamamlanan</span>
                                <span className="mini-value">{stats?.orders_details?.completed || 0}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Bağışlar - Compact Advanced Card */}
                    <Link to="/user/donations" className="stat-card-advanced donations-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper donations">
                                <FiGift className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">{t('dashboard.stats.donations')}</span>
                                <span className="stat-value-advanced">{stats?.donations || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card-body compact">
                            <div className="mini-stat warning">
                                <span className="mini-label">Bekleyen</span>
                                <span className="mini-value">{stats?.donations_details?.pending || 0}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Başarılı</span>
                                <span className="mini-value">{stats?.donations_details?.completed || 0}</span>
                            </div>
                            <div className="mini-stat danger">
                                <span className="mini-label">Başarısız</span>
                                <span className="mini-value">{stats?.donations_details?.failed || 0}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Favoriler - Compact Advanced Card */}
                    <Link to="/user/favorites" className="stat-card-advanced favorites-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper favorites">
                                <FiHeart className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">{t('dashboard.stats.favorites')}</span>
                                <span className="stat-value-advanced">{stats?.favorites || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card-body compact">
                            <div className="mini-stat info">
                                <span className="mini-label">Toplam</span>
                                <span className="mini-value">{stats?.favorites || 0}</span>
                            </div>
                        </div>
                    </Link>

                    {/* İndirmeler - Compact Advanced Card */}
                    <Link to="/user/downloads" className="stat-card-advanced downloads-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper downloads">
                                <FiDownload className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">{t('dashboard.stats.downloads')}</span>
                                <span className="stat-value-advanced">{stats?.downloads || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card-body compact">
                            <div className="mini-stat success">
                                <span className="mini-label">Toplam</span>
                                <span className="mini-value">{stats?.downloads || 0}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Mesajlar - Compact Advanced Card */}
                    <Link to="/user/messages" className="stat-card-advanced messages-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper messages">
                                <FiMessageCircle className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">{t('dashboard.stats.messages')}</span>
                                <span className="stat-value-advanced">{stats?.unread_messages || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card-body compact">
                            <div className="mini-stat warning">
                                <span className="mini-label">Okunmamış</span>
                                <span className="mini-value">{stats?.unread_messages || 0}</span>
                            </div>
                            <div className="mini-stat info">
                                <span className="mini-label">Toplam</span>
                                <span className="mini-value">-</span>
                            </div>
                        </div>
                    </Link>

                    {/* Destek Talepleri - Compact Advanced Card */}
                    <Link to="/tickets" className="stat-card-advanced tickets-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper tickets">
                                <FiFileText className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Destek Talepleri</span>
                                <span className="stat-value-advanced">{stats?.tickets || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card-body compact">
                            <div className="mini-stat warning">
                                <span className="mini-label">Açık</span>
                                <span className="mini-value">{stats?.tickets_details?.open || 0}</span>
                            </div>
                            <div className="mini-stat info">
                                <span className="mini-label">İşlemde</span>
                                <span className="mini-value">{stats?.tickets_details?.in_progress || 0}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Çözüldü</span>
                                <span className="mini-value">{stats?.tickets_details?.resolved || 0}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Sadakat Puanları - Compact Advanced Card */}
                    <Link to="/user/shares" className="stat-card-advanced shares-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper shares">
                                <FiShare2 className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Sadakat Puanı</span>
                                <span className="stat-value-advanced">{stats?.loyalty_points || 0}</span>
                            </div>
                        </div>
                        <div className="stat-card-body compact">
                            <div className="mini-progress-wrapper" style={{ width: '100%', marginTop: '0.5rem' }}>
                                <div className="mini-progress-bar" style={{
                                    height: '6px',
                                    background: '#e2e8f0',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${Math.min(((stats?.loyalty_points || 0) / (stats?.next_reward_points || 100)) * 100, 100)}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #ec4899, #be185d)'
                                    }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem', color: '#64748b' }}>
                                    <span>Sonraki Ödül</span>
                                    <span>{stats?.next_reward_points || 100} Puan</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h2 className="section-title">{t('dashboard.quick_actions.title')}</h2>
                    <div className="quick-actions-grid">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={index}
                                    to={action.path}
                                    className="quick-action-card"
                                    style={{ '--action-color': action.color }}
                                >
                                    <div className="action-icon-wrapper">
                                        <Icon />
                                    </div>
                                    <h3>{action.label}</h3>
                                    <span className="action-arrow">→</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </UserLayout >
    );
};

export default UserDashboard;
