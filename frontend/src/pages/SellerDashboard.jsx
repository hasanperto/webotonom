import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import SellerLayout from '../components/SellerLayout';
import { 
    FiTrendingUp, FiShoppingBag, FiStar, FiBell,
    FiDollarSign, FiPackage, FiEye, FiCreditCard,
    FiPlus, FiBarChart2, FiUsers, FiTag, FiFileText, FiImage,
    FiEdit, FiHelpCircle, FiMessageCircle
} from 'react-icons/fi';
import './Dashboard.css';

const SellerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await api.get('/seller/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Seller stats load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { icon: FiPlus, label: 'Yeni Proje Ekle', path: '/seller/add-project', color: '#696cff' },
        { icon: FiPackage, label: 'Projelerim', path: '/seller/projects', color: '#10b981' },
        { icon: FiDollarSign, label: 'Kazançlarım', path: '/seller/earnings', color: '#f59e0b' },
        { icon: FiShoppingBag, label: 'Satışlarım', path: '/seller/sales', color: '#3b82f6' },
        { icon: FiBarChart2, label: 'İstatistikler', path: '/seller/analytics', color: '#8b5cf6' },
        { icon: FiMessageCircle, label: 'Mesajlarım', path: '/seller/messages', color: '#ef4444' },
        { icon: FiUsers, label: 'Müşterilerim', path: '/seller/customers', color: '#06b6d4' },
        { icon: FiTag, label: 'Kuponlarım', path: '/seller/coupons', color: '#14b8a6' },
        { icon: FiFileText, label: 'Raporlar', path: '/seller/reports', color: '#64748b' },
        { icon: FiImage, label: 'Medya Kütüphanesi', path: '/seller/media', color: '#f97316' },
        { icon: FiEdit, label: 'Profil Düzenle', path: '/seller/profile', color: '#a855f7' },
        { icon: FiHelpCircle, label: 'Destek', path: '/tickets', color: '#ec4899' },
    ];

    if (loading) {
        return (
            <SellerLayout>
                <div className="dashboard-loading">
                    <div className="spinner-large"></div>
                    <p>Yükleniyor...</p>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="dashboard-content-wrapper">
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>Hoş Geldiniz, {user?.username}!</h1>
                        <p>Satıcı panelinizin genel görünümü</p>
                    </div>
                    <div className="header-actions">
                        <button className="header-btn" title="Bildirimler">
                            <FiBell />
                        </button>
                    </div>
                </div>

                {/* Stats Cards - Minimal Design */}
                <div className="stats-section-minimal">
                    <div className="stats-compact-grid">
                        {/* Kazanç Kartı - Öne Çıkan */}
                        <div className="stat-card-balance seller-balance">
                            <div className="balance-header">
                                <div className="balance-icon">
                                    <FiDollarSign />
                                </div>
                                <div className="balance-info">
                                    <span className="balance-label">Toplam Kazanç</span>
                                    <h2 className="balance-amount">₺{parseFloat(stats?.earnings || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                </div>
                            </div>
                            <div className="balance-actions">
                                <Link to="/seller/earnings" className="balance-btn">
                                    <FiEye /> Detayları Gör
                                </Link>
                                <Link to="/seller/earnings" className="balance-btn outline">
                                    <FiCreditCard /> Para Çek
                                </Link>
                            </div>
                        </div>

                        {/* Kompakt İstatistikler */}
                        <div className="stat-item-compact stat-card-projects" onClick={() => navigate('/seller/projects')}>
                            <div className="stat-compact-icon-wrapper">
                                <div className="stat-compact-icon">
                                    <FiPackage />
                                </div>
                            </div>
                            <div className="stat-compact-content">
                                <span className="stat-compact-value">{stats?.projects || 0}</span>
                                <span className="stat-compact-label">Proje</span>
                            </div>
                        </div>

                        <div className="stat-item-compact stat-card-sales" onClick={() => navigate('/seller/sales')}>
                            <div className="stat-compact-icon-wrapper">
                                <div className="stat-compact-icon">
                                    <FiShoppingBag />
                                </div>
                            </div>
                            <div className="stat-compact-content">
                                <span className="stat-compact-value">{stats?.sales || 0}</span>
                                <span className="stat-compact-label">Satış</span>
                            </div>
                        </div>

                        <div className="stat-item-compact stat-card-views" onClick={() => navigate('/seller/analytics')}>
                            <div className="stat-compact-icon-wrapper">
                                <div className="stat-compact-icon">
                                    <FiEye />
                                </div>
                            </div>
                            <div className="stat-compact-content">
                                <span className="stat-compact-value">{stats?.views || 0}</span>
                                <span className="stat-compact-label">Görüntüleme</span>
                            </div>
                        </div>

                        <div className="stat-item-compact stat-card-ratings" onClick={() => navigate('/seller/projects')}>
                            <div className="stat-compact-icon-wrapper">
                                <div className="stat-compact-icon">
                                    <FiStar />
                                </div>
                            </div>
                            <div className="stat-compact-content">
                                <span className="stat-compact-value">{stats?.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '0.0'}</span>
                                <span className="stat-compact-label">Ortalama</span>
                            </div>
                        </div>

                        <div className="stat-item-compact stat-card-pending" onClick={() => navigate('/seller/earnings')}>
                            <div className="stat-compact-icon-wrapper">
                                <div className="stat-compact-icon">
                                    <FiTrendingUp />
                                </div>
                            </div>
                            <div className="stat-compact-content">
                                <span className="stat-compact-value">₺{parseFloat(stats?.pending_earnings || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                <span className="stat-compact-label">Bekleyen</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h2 className="section-title">Hızlı İşlemler</h2>
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
        </SellerLayout>
    );
};

export default SellerDashboard;
