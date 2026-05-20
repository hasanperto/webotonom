import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import {
    FiUsers, FiPackage, FiShoppingBag, FiDollarSign,
    FiTrendingUp, FiTrendingDown, FiEye, FiClock,
    FiCheckCircle, FiXCircle, FiBarChart2, FiSettings,
    FiGift, FiFileText, FiArrowRight, FiActivity,
    FiCreditCard, FiMessageSquare, FiStar, FiDownload,
    FiShield, FiZap, FiTarget, FiPercent, FiRefreshCw
} from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { refreshExchangeRates } = useCurrency();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingRates, setUpdatingRates] = useState(false);
    const [detailedStats, setDetailedStats] = useState({
        activeUsers: 0,
        pendingProjects: 0,
        completedOrders: 0,
        totalDonations: 0,
        activeProjects: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingDonations: 0,
        pendingPayments: 0,
        pendingOrders: 0,
        pendingTickets: 0,
        pendingWithdrawals: 0
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, ticketsRes] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/tickets/pending-count').catch(() => ({ data: { count: 0 } }))
            ]);

            const data = dashboardRes.data;
            setStats(data); // Now contains objects: users, projects, orders, etc.

            // Support tickets still separate for now or integrated if backend updated
            const pendingTickets = ticketsRes.data.count || 0;

            setDetailedStats({
                activeUsers: data.users?.active || 0,
                pendingProjects: data.projects?.pending || 0,
                completedOrders: data.orders?.completed || 0,
                totalDonations: data.donations?.total || 0,
                activeProjects: data.projects?.active || 0,
                totalRevenue: data.revenue || 0,
                monthlyRevenue: (data.revenue || 0) * 0.3,
                pendingDonations: data.donations?.pending || 0,
                pendingPayments: data.payments?.pending || 0,
                pendingOrders: (data.orders?.pending || 0) + (data.orders?.processing || 0), // Bekleyen + İşlemde
                pendingTickets,
                pendingWithdrawals: data.withdrawals?.pending || 0
            });
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('tr-TR').format(num || 0);
    };

    const handleUpdateExchangeRates = async () => {
        try {
            setUpdatingRates(true);
            const response = await api.post('/admin/settings/currency/update-rates');
            
            if (response.data) {
                // CurrencyContext'i yenile
                await refreshExchangeRates(true);
                alert('Döviz kurları başarıyla güncellendi!');
            }
        } catch (error) {
            console.error('Update exchange rates error:', error);
            alert(error.response?.data?.error || 'Döviz kurları güncellenirken hata oluştu!');
        } finally {
            setUpdatingRates(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-dashboard-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-dashboard-page">
                {/* Header */}
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Dashboard</h1>
                        <p className="page-subtitle-advanced">Sistem genel bakış ve yönetim</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadDashboardData}>
                            <FiZap /> Yenile
                        </button>
                        <button 
                            className="btn-update-rates" 
                            onClick={handleUpdateExchangeRates}
                            disabled={updatingRates}
                            title="Döviz kurlarını güncelle"
                        >
                            <FiRefreshCw className={updatingRates ? 'spinning' : ''} /> 
                            {updatingRates ? 'Güncelleniyor...' : 'Kurları Güncelle'}
                        </button>
                    </div>
                </div>

                {/* Main Stats Grid - Colorful & Animated */}
                <div className="admin-stats-grid-advanced">

                    {/* 1. Siparişler (Orders) - PRIORITY */}
                    <Link to="/admin/orders" className={`stat-card-advanced orders-card ${(detailedStats.pendingOrders > 0 || (stats?.orders?.processing || 0) > 0) ? 'card-alert' : ''}`}>
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper orders">
                                <FiShoppingBag className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Toplam Sipariş</span>
                                <span className="stat-value-advanced">{formatNumber(stats?.orders?.total || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className={`mini-stat ${(stats?.orders?.pending || 0) > 0 ? 'danger' : 'warning'}`}>
                                <span className="mini-label">Bekleyen</span>
                                <span className="mini-value">{formatNumber(stats?.orders?.pending || 0)}</span>
                            </div>
                            <div className={`mini-stat ${(stats?.orders?.processing || 0) > 0 ? 'danger' : 'info'}`}>
                                <span className="mini-label">İşlemde</span>
                                <span className="mini-value">{formatNumber(stats?.orders?.processing || 0)}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Tamamlanan</span>
                                <span className="mini-value">{formatNumber(stats?.orders?.completed || 0)}</span>
                            </div>
                        </div>
                    </Link>

                    {/* 2. Ödeme Talepleri (Payment Requests) - PRIORITY */}
                    <Link to="/admin/payment-requests" className={`stat-card-advanced payments-card ${detailedStats.pendingPayments > 0 ? 'card-alert' : ''}`}>
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper payments">
                                <FiCreditCard className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Ödeme Talepleri</span>
                                <span className="stat-value-advanced">{formatNumber(stats?.payments?.total || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className={`mini-stat ${(stats?.payments?.pending || 0) > 0 ? 'danger' : 'warning'}`}>
                                <span className="mini-label">Bekleyen</span>
                                <span className="mini-value">{formatNumber(stats?.payments?.pending || 0)}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Tamamlanan</span>
                                <span className="mini-value">{formatNumber(stats?.payments?.completed || 0)}</span>
                            </div>
                            <div className="mini-stat danger">
                                <span className="mini-label">Red/Hata</span>
                                <span className="mini-value">{formatNumber(stats?.payments?.failed || 0)}</span>
                            </div>
                        </div>
                    </Link>

                    {/* 2.5 Para Çekme Talepleri (Withdrawals) - NEW */}
                    <Link to="/admin/withdrawals" className={`stat-card-advanced withdrawals-card ${detailedStats.pendingWithdrawals > 0 ? 'card-alert' : ''}`}>
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper withdrawals">
                                <FiDollarSign className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Para Çekme</span>
                                <span className="stat-value-advanced">{formatNumber(stats?.withdrawals?.total || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className="mini-stat warning">
                                <span className="mini-label">Bekleyen</span>
                                <span className="mini-value">{formatNumber(stats?.withdrawals?.pending || 0)}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Tamamlanan</span>
                                <span className="mini-value">{formatNumber(stats?.withdrawals?.completed || 0)}</span>
                            </div>
                            <div className="mini-stat danger">
                                <span className="mini-label">Reddedilen</span>
                                <span className="mini-value">{formatNumber(stats?.withdrawals?.rejected || 0)}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Müşteri Bakiyesi (Emanet) - NEW - Main Grid */}
                    <div className="stat-card-advanced payments-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper payments">
                                <FiCreditCard className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Müşteri Bakiyesi</span>
                                <span className="stat-value-advanced">{formatPrice(stats?.userBalances || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className="mini-stat warning">
                                <span className="mini-label">Harcanan</span>
                                <span className="mini-value">{formatPrice(stats?.spentBalance || 0)}</span>
                            </div>
                            <div className="mini-stat info">
                                <span className="mini-label">Emanet</span>
                                <span className="mini-value">{formatPrice(stats?.userBalances || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Destek Talepleri (Support) */}
                    <Link to="/admin/support" className={`stat-card-advanced support-card ${detailedStats.pendingTickets > 0 ? 'card-alert' : ''}`}>
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper support">
                                <FiMessageSquare className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Destek</span>
                                <span className="stat-value-advanced">{formatNumber(detailedStats.pendingTickets || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className="mini-stat warning">
                                <span className="mini-label">Yanıt Bekleyen</span>
                                <span className="mini-value">{formatNumber(detailedStats.pendingTickets)}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Çözüldü</span>
                                <span className="mini-value">-</span>
                            </div>
                        </div>
                    </Link>

                    {/* 4. Bağışlar (Donations) */}
                    <Link to="/admin/donations" className={`stat-card-advanced donations-card ${detailedStats.pendingDonations > 0 ? 'card-alert' : ''}`}>
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper donations">
                                <FiGift className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Bağışlar</span>
                                <span className="stat-value-advanced">{formatNumber(stats?.donations?.total || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className={`mini-stat ${(stats?.donations?.pending || 0) > 0 ? 'danger' : 'warning'}`}>
                                <span className="mini-label">Onay Bekleyen</span>
                                <span className="mini-value">{formatNumber(stats?.donations?.pending || 0)}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Tamamlanan</span>
                                <span className="mini-value">{formatNumber(stats?.donations?.completed || 0)}</span>
                            </div>
                        </div>
                    </Link>

                    {/* NEW: Site Komisyon Geliri */}
                    <div className="stat-card-advanced revenue-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper revenue">
                                <FiDollarSign className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Net Komisyon</span>
                                <span className="stat-value-advanced">{formatPrice(stats?.commission || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className="mini-stat success">
                                <span className="mini-label">Toplam Ciro</span>
                                <span className="mini-value">{formatPrice(stats?.revenue || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. Projeler */}
                    <Link to="/admin/projects" className="stat-card-advanced projects-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper projects">
                                <FiPackage className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Projeler</span>
                                <span className="stat-value-advanced">{formatNumber(stats?.projects?.total || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className="mini-stat warning">
                                <span className="mini-label">Onayda</span>
                                <span className="mini-value">{formatNumber(stats?.projects?.pending || 0)}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Yayında</span>
                                <span className="mini-value">{formatNumber(stats?.projects?.active || 0)}</span>
                            </div>
                            <div className="mini-stat danger">
                                <span className="mini-label">Red</span>
                                <span className="mini-value">{formatNumber(stats?.projects?.rejected || 0)}</span>
                            </div>
                        </div>
                    </Link>

                    {/* 6. Kullanıcılar */}
                    <Link to="/admin/users" className="stat-card-advanced users-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper users">
                                <FiUsers className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Kullanıcılar</span>
                                <span className="stat-value-advanced">{formatNumber(stats?.users?.total || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className="mini-stat warning">
                                <span className="mini-label">Beklemede</span>
                                <span className="mini-value">{formatNumber(stats?.users?.pending || 0)}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-label">Aktif</span>
                                <span className="mini-value">{formatNumber(stats?.users?.active || 0)}</span>
                            </div>
                            <div className="mini-stat danger">
                                <span className="mini-label">Yasaklı</span>
                                <span className="mini-value">{formatNumber(stats?.users?.banned || 0)}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Revenue Card (No Link) */}
                    <div className="stat-card-advanced revenue-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-wrapper revenue">
                                <FiDollarSign className="stat-icon" />
                                <div className="stat-icon-bg"></div>
                            </div>
                            <div className="stat-header-info">
                                <span className="stat-label-advanced">Toplam Gelir</span>
                                <span className="stat-value-advanced">{formatPrice(stats?.revenue || 0)}</span>
                            </div>
                        </div>
                        <div className="stat-card-body">
                            <div className="mini-stat success">
                                <span className="mini-label">Komisyon</span>
                                <span className="mini-value">{formatPrice(stats?.commission || 0)}</span>
                            </div>
                            <div className="mini-stat warning">
                                <span className="mini-label">Vergi (KDV)</span>
                                <span className="mini-value">{formatPrice(stats?.taxRevenue || 0)}</span>
                            </div>
                            <div className="mini-stat info">
                                <span className="mini-label">Abonelik</span>
                                <span className="mini-value">{formatPrice(stats?.subscriptionRevenue || 0)}</span>
                            </div>
                            <div className="mini-stat success" style={{ color: '#10b981' }}>
                                <span className="mini-label">Projeler</span>
                                <span className="mini-value">{formatPrice(stats?.adminProjectRevenue || 0)}</span>
                            </div>
                            <div className="mini-stat warning" style={{ color: '#ec4899' }}>
                                <span className="mini-label">Bağışlar</span>
                                <span className="mini-value">{formatPrice(stats?.adminDonationRevenue || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - Enhanced */}
                <div className="admin-quick-actions-advanced">
                    <h2 className="section-title-advanced">
                        <FiZap className="section-icon" />
                        Hızlı İşlemler
                    </h2>
                    <div className="actions-grid-advanced">
                        <Link to="/admin/users" className="action-card-advanced users-action">
                            <div className="action-icon-wrapper users">
                                <FiUsers />
                            </div>
                            <div className="action-content">
                                <h3>Kullanıcı Yönetimi</h3>
                                <p>Kullanıcıları görüntüle ve yönet</p>
                                <span className="action-count">{formatNumber(stats?.users?.total || 0)} kullanıcı</span>
                            </div>
                            <FiArrowRight className="action-arrow" />
                        </Link>

                        <Link to="/admin/projects" className="action-card-advanced projects-action">
                            <div className="action-icon-wrapper projects">
                                <FiPackage />
                            </div>
                            <div className="action-content">
                                <h3>Proje Yönetimi</h3>
                                <p>Projeleri onayla veya reddet</p>
                                {detailedStats.pendingProjects > 0 ? (
                                    <span className="action-count warning">{detailedStats.pendingProjects} bekliyor</span>
                                ) : (
                                    <span className="action-count">{formatNumber(stats?.projects?.total || 0)} proje</span>
                                )}
                            </div>
                            <FiArrowRight className="action-arrow" />
                        </Link>

                        <Link to="/admin/orders" className="action-card-advanced orders-action">
                            <div className="action-icon-wrapper orders">
                                <FiShoppingBag />
                            </div>
                            <div className="action-content">
                                <h3>Sipariş Yönetimi</h3>
                                <p>Siparişleri görüntüle ve yönet</p>
                                <span className="action-count">{formatNumber(stats?.orders?.total || 0)} sipariş</span>
                            </div>
                            <FiArrowRight className="action-arrow" />
                        </Link>

                        <Link to="/admin/donations" className="action-card-advanced donations-action">
                            <div className="action-icon-wrapper donations">
                                <FiGift />
                            </div>
                            <div className="action-content">
                                <h3>Bağış Yönetimi</h3>
                                <p>Bağışları onayla ve yönet</p>
                                {detailedStats.pendingDonations > 0 ? (
                                    <span className="action-count warning">{detailedStats.pendingDonations} onay bekliyor</span>
                                ) : (
                                    <span className="action-count">{formatNumber(detailedStats.totalDonations)} bağış</span>
                                )}
                            </div>
                            <FiArrowRight className="action-arrow" />
                        </Link>

                        <Link to="/admin/sections" className="action-card-advanced sections-action">
                            <div className="action-icon-wrapper sections">
                                <FiFileText />
                            </div>
                            <div className="action-content">
                                <h3>Bölüm Yönetimi</h3>
                                <p>Ana sayfa bölümlerini düzenle</p>
                                <span className="action-count">Bölümler</span>
                            </div>
                            <FiArrowRight className="action-arrow" />
                        </Link>

                        <Link to="/admin/settings" className="action-card-advanced settings-action">
                            <div className="action-icon-wrapper settings">
                                <FiSettings />
                            </div>
                            <div className="action-content">
                                <h3>Sistem Ayarları</h3>
                                <p>Genel sistem ayarlarını yönet</p>
                                <span className="action-count">Ayarlar</span>
                            </div>
                            <FiArrowRight className="action-arrow" />
                        </Link>
                    </div>
                </div>

                {/* Detailed Statistics Section */}
                <div className="admin-detailed-stats">
                    <h2 className="section-title-advanced">
                        <FiBarChart2 className="section-icon" />
                        Detaylı İstatistikler
                    </h2>
                    <div className="detailed-stats-grid">
                        <div className="detailed-stat-card">
                            <div className="detailed-stat-header">
                                <FiUsers className="detailed-stat-icon users" />
                                <span className="detailed-stat-label">Kullanıcı İstatistikleri</span>
                            </div>
                            <div className="detailed-stat-content">
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Toplam Kullanıcı</span>
                                    <span className="detailed-stat-value">{formatNumber(stats?.users?.total || 0)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Aktif Kullanıcı</span>
                                    <span className="detailed-stat-value positive">{formatNumber(detailedStats.activeUsers)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Aktiflik Oranı</span>
                                    <span className="detailed-stat-value">
                                        %{Math.round((detailedStats.activeUsers / (stats?.users?.total || 1)) * 100)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="detailed-stat-card">
                            <div className="detailed-stat-header">
                                <FiPackage className="detailed-stat-icon projects" />
                                <span className="detailed-stat-label">Proje İstatistikleri</span>
                            </div>
                            <div className="detailed-stat-content">
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Toplam Proje</span>
                                    <span className="detailed-stat-value">{formatNumber(stats?.projects?.total || 0)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Aktif Proje</span>
                                    <span className="detailed-stat-value positive">{formatNumber(detailedStats.activeProjects)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Bekleyen</span>
                                    <span className="detailed-stat-value warning">{formatNumber(detailedStats.pendingProjects)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detailed-stat-card">
                            <div className="detailed-stat-header">
                                <FiDollarSign className="detailed-stat-icon revenue" />
                                <span className="detailed-stat-label">Gelir İstatistikleri</span>
                            </div>
                            <div className="detailed-stat-content">
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Toplam Gelir</span>
                                    <span className="detailed-stat-value">{formatPrice(stats?.revenue || 0)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Komisyon</span>
                                    <span className="detailed-stat-value positive">{formatPrice(stats?.commission || 0)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Admin Proje</span>
                                    <span className="detailed-stat-value">{formatPrice(stats?.adminProjectRevenue || 0)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Bağış Geliri</span>
                                    <span className="detailed-stat-value">{formatPrice(stats?.adminDonationRevenue || 0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detailed-stat-card">
                            <div className="detailed-stat-header">
                                <FiGift className="detailed-stat-icon donations" />
                                <span className="detailed-stat-label">Bağış İstatistikleri</span>
                            </div>
                            <div className="detailed-stat-content">
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Toplam Bağış</span>
                                    <span className="detailed-stat-value">{formatNumber(detailedStats.totalDonations)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Onay Bekleyen</span>
                                    <span className="detailed-stat-value warning">{formatNumber(detailedStats.pendingDonations)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Onay Oranı</span>
                                    <span className="detailed-stat-value">
                                        %{detailedStats.totalDonations > 0
                                            ? Math.round(((detailedStats.totalDonations - detailedStats.pendingDonations) / detailedStats.totalDonations) * 100)
                                            : 100}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cüzdan İstatistikleri (Müşteri Bakiyesi) - NEW */}
                        <div className="detailed-stat-card">
                            <div className="detailed-stat-header">
                                <FiCreditCard className="detailed-stat-icon payments" />
                                <span className="detailed-stat-label">Müşteri Bakiyesi</span>
                            </div>
                            <div className="detailed-stat-content">
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Toplam Emanet</span>
                                    <span className="detailed-stat-value info">{formatPrice(stats?.userBalances || 0)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Harcanan Bakiye</span>
                                    <span className="detailed-stat-value warning">{formatPrice(stats?.spentBalance || 0)}</span>
                                </div>
                                <div className="detailed-stat-item">
                                    <span className="detailed-stat-name">Para Çekme</span>
                                    <span className="detailed-stat-value">{formatNumber(stats?.withdrawals?.pending || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Items - Enhanced */}
                {(detailedStats.pendingProjects > 0 || detailedStats.pendingDonations > 0 || detailedStats.pendingPayments > 0) && (
                    <div className="admin-pending-advanced">
                        <h2 className="section-title-advanced">
                            <FiClock className="section-icon" />
                            Bekleyen İşlemler
                        </h2>
                        <div className="pending-items-advanced">
                            {detailedStats.pendingProjects > 0 && (
                                <Link to="/admin/projects?filter=pending" className="pending-item-advanced projects">
                                    <div className="pending-icon-wrapper">
                                        <FiPackage />
                                    </div>
                                    <div className="pending-content-advanced">
                                        <h3>Onay Bekleyen Projeler</h3>
                                        <p>{detailedStats.pendingProjects} proje onay bekliyor</p>
                                    </div>
                                    <div className="pending-badge">{detailedStats.pendingProjects}</div>
                                    <FiArrowRight className="pending-arrow" />
                                </Link>
                            )}
                            {detailedStats.pendingDonations > 0 && (
                                <Link to="/admin/donations?filter=pending" className="pending-item-advanced donations">
                                    <div className="pending-icon-wrapper">
                                        <FiGift />
                                    </div>
                                    <div className="pending-content-advanced">
                                        <h3>Onay Bekleyen Bağışlar</h3>
                                        <p>{detailedStats.pendingDonations} bağış onay bekliyor</p>
                                    </div>
                                    <div className="pending-badge">{detailedStats.pendingDonations}</div>
                                    <FiArrowRight className="pending-arrow" />
                                </Link>
                            )}
                            {detailedStats.pendingPayments > 0 && (
                                <Link to="/admin/payment-requests?filter=pending_actions" className="pending-item-advanced payments">
                                    <div className="pending-icon-wrapper">
                                        <FiCreditCard />
                                    </div>
                                    <div className="pending-content-advanced">
                                        <h3>Onay Bekleyen Ödemeler</h3>
                                        <p>{detailedStats.pendingPayments} ödeme talebi onay bekliyor</p>
                                    </div>
                                    <div className="pending-badge">{detailedStats.pendingPayments}</div>
                                    <FiArrowRight className="pending-arrow" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
