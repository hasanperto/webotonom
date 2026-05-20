import { useState, useEffect } from 'react';
import SellerLayout from '../components/SellerLayout';
import { sellerAPI } from '../api/seller';
import {
    FiDollarSign, FiShoppingBag,
    FiEye, FiStar, FiUsers, FiPackage, FiBarChart2,
    FiCalendar
} from 'react-icons/fi';
import './SellerAnalytics.css';

const SellerAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getAnalytics({ period });
            setAnalytics(response.data);
        } catch (error) {
            console.error('Analytics load error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const formatCurrency = (value) => {
        return `₺${parseFloat(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const formatNumber = (value) => {
        return parseFloat(value || 0).toLocaleString('tr-TR');
    };


    if (loading) {
        return (
            <SellerLayout>
                <div className="analytics-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    if (!analytics) {
        return (
            <SellerLayout>
                <div className="analytics-page">
                    <div className="empty-state">
                        <p>Veri yüklenemedi</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    const { general, sales, earnings, dailyTrend, topProducts, categories, customers, monthlyComparison } = analytics;

    return (
        <SellerLayout>
            <div className="analytics-page">
                {/* Header */}
                <div className="analytics-header">
                    <div className="header-content">
                        <h1 className="page-title">Analitik</h1>
                        <p className="page-subtitle">Satış ve performans istatistikleriniz</p>
                    </div>
                    <div className="period-selector">
                        <button
                            className={`period-btn ${period === '7' ? 'active' : ''}`}
                            onClick={() => setPeriod('7')}
                        >
                            7 Gün
                        </button>
                        <button
                            className={`period-btn ${period === '30' ? 'active' : ''}`}
                            onClick={() => setPeriod('30')}
                        >
                            30 Gün
                        </button>
                        <button
                            className={`period-btn ${period === '90' ? 'active' : ''}`}
                            onClick={() => setPeriod('90')}
                        >
                            90 Gün
                        </button>
                        <button
                            className={`period-btn ${period === '365' ? 'active' : ''}`}
                            onClick={() => setPeriod('365')}
                        >
                            1 Yıl
                        </button>
                    </div>
                </div>

                {/* Stats Grid - Minimal */}
                <div className="stats-grid-minimal">
                    <div className="stat-card-minimal primary">
                        <div className="stat-icon-minimal">
                            <FiDollarSign />
                        </div>
                        <div className="stat-info-minimal">
                            <div className="stat-label-minimal">Kazanç</div>
                            <div className="stat-value-minimal">{formatCurrency(earnings?.total_earnings || 0)}</div>
                            <div className="stat-change-minimal">
                                {formatNumber(earnings?.transaction_count || 0)} işlem
                            </div>
                        </div>
                        <div className="stat-chart-minimal">
                            <div className="mini-chart-bar" style={{ height: '60%' }}></div>
                        </div>
                    </div>

                    <div className="stat-card-minimal success">
                        <div className="stat-icon-minimal">
                            <FiShoppingBag />
                        </div>
                        <div className="stat-info-minimal">
                            <div className="stat-label-minimal">Satış</div>
                            <div className="stat-value-minimal">{formatNumber(sales?.total_orders || 0)}</div>
                            <div className="stat-change-minimal">
                                {formatCurrency(sales?.total_revenue || 0)} gelir
                            </div>
                        </div>
                        <div className="stat-chart-minimal">
                            <div className="mini-chart-bar" style={{ height: '75%' }}></div>
                        </div>
                    </div>

                    <div className="stat-card-minimal info">
                        <div className="stat-icon-minimal">
                            <FiEye />
                        </div>
                        <div className="stat-info-minimal">
                            <div className="stat-label-minimal">Görüntülenme</div>
                            <div className="stat-value-minimal">{formatNumber(general?.total_views || 0)}</div>
                            <div className="stat-change-minimal">
                                {formatNumber(general?.total_downloads || 0)} indirme
                            </div>
                        </div>
                        <div className="stat-chart-minimal">
                            <div className="mini-chart-bar" style={{ height: '50%' }}></div>
                        </div>
                    </div>

                    <div className="stat-card-minimal warning">
                        <div className="stat-icon-minimal">
                            <FiStar />
                        </div>
                        <div className="stat-info-minimal">
                            <div className="stat-label-minimal">Puan</div>
                            <div className="stat-value-minimal">
                                {parseFloat(general?.avg_rating || 0).toFixed(1)}
                            </div>
                            <div className="stat-change-minimal">
                                {formatNumber(general?.total_reviews || 0)} değerlendirme
                            </div>
                        </div>
                        <div className="stat-chart-minimal">
                            <div className="mini-chart-bar" style={{ height: `${(parseFloat(general?.avg_rating || 0) / 5) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="stat-card-minimal">
                        <div className="stat-icon-minimal">
                            <FiPackage />
                        </div>
                        <div className="stat-info-minimal">
                            <div className="stat-label-minimal">Ürünler</div>
                            <div className="stat-value-minimal">{formatNumber(sales?.products_sold || 0)}</div>
                            <div className="stat-change-minimal">
                                {formatNumber(general?.total_projects || 0)} toplam
                            </div>
                        </div>
                        <div className="stat-chart-minimal">
                            <div className="mini-chart-bar" style={{ height: general?.total_projects > 0 ? `${((sales?.products_sold || 0) / general.total_projects) * 100}%` : '0%' }}></div>
                        </div>
                    </div>

                    <div className="stat-card-minimal">
                        <div className="stat-icon-minimal">
                            <FiUsers />
                        </div>
                        <div className="stat-info-minimal">
                            <div className="stat-label-minimal">Müşteri</div>
                            <div className="stat-value-minimal">{formatNumber(customers?.unique_customers || 0)}</div>
                            <div className="stat-change-minimal">
                                Ort. {formatCurrency(customers?.avg_customer_value || 0)}
                            </div>
                        </div>
                        <div className="stat-chart-minimal">
                            <div className="mini-chart-bar" style={{ height: '45%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Charts Section - Minimal */}
                <div className="charts-grid-minimal">
                    {/* Günlük Trend */}
                    <div className="chart-card-minimal">
                        <div className="chart-header-minimal">
                            <div>
                                <h3>Günlük Satış</h3>
                                <p className="chart-subtitle">{formatCurrency(sales?.total_revenue || 0)} toplam gelir</p>
                            </div>
                            <FiBarChart2 className="chart-icon-minimal" />
                        </div>
                        <div className="chart-content-minimal">
                            {dailyTrend && dailyTrend.length > 0 ? (
                                <div className="trend-chart-minimal">
                                    {dailyTrend.map((day, index) => {
                                        const maxRevenue = Math.max(...dailyTrend.map(d => parseFloat(d.revenue || 0)));
                                        const height = maxRevenue > 0 ? (parseFloat(day.revenue || 0) / maxRevenue) * 100 : 0;
                                        const dayName = new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' });
                                        const dayNum = new Date(day.date).getDate();
                                        return (
                                            <div key={index} className="trend-bar-minimal">
                                                <div className="bar-tooltip">
                                                    <div className="tooltip-content">
                                                        <div className="tooltip-date">{new Date(day.date).toLocaleDateString('tr-TR')}</div>
                                                        <div className="tooltip-revenue">{formatCurrency(day.revenue)}</div>
                                                        <div className="tooltip-orders">{formatNumber(day.orders)} sipariş</div>
                                                    </div>
                                                </div>
                                                <div className="bar-wrapper-minimal">
                                                    <div
                                                        className="bar-minimal"
                                                        style={{ height: `${Math.max(height, 5)}%` }}
                                                    >
                                                        <span className="bar-orders">{day.orders}</span>
                                                    </div>
                                                </div>
                                                <div className="bar-label-minimal">
                                                    <span className="bar-day">{dayNum}</span>
                                                    <span className="bar-month">{dayName}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-chart-minimal">
                                    <FiBarChart2 />
                                    <p>Veri bulunamadı</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Aylık Karşılaştırma */}
                    <div className="chart-card-minimal">
                        <div className="chart-header-minimal">
                            <div>
                                <h3>Aylık Performans</h3>
                                <p className="chart-subtitle">Son 6 ay</p>
                            </div>
                            <FiCalendar className="chart-icon-minimal" />
                        </div>
                        <div className="chart-content-minimal">
                            {monthlyComparison && monthlyComparison.length > 0 ? (
                                <div className="monthly-chart-minimal">
                                    {monthlyComparison.map((month, index) => {
                                        const maxRevenue = Math.max(...monthlyComparison.map(m => parseFloat(m.revenue || 0)));
                                        const height = maxRevenue > 0 ? (parseFloat(month.revenue || 0) / maxRevenue) * 100 : 0;
                                        const [year, monthNum] = month.month.split('-');
                                        const monthName = new Date(year, parseInt(monthNum) - 1).toLocaleDateString('tr-TR', { month: 'short' });
                                        return (
                                            <div key={index} className="month-bar-minimal">
                                                <div className="bar-tooltip">
                                                    <div className="tooltip-content">
                                                        <div className="tooltip-date">{month.month}</div>
                                                        <div className="tooltip-revenue">{formatCurrency(month.revenue)}</div>
                                                        <div className="tooltip-orders">{formatNumber(month.orders)} sipariş</div>
                                                    </div>
                                                </div>
                                                <div className="bar-wrapper-minimal">
                                                    <div
                                                        className="bar-minimal"
                                                        style={{ height: `${Math.max(height, 5)}%` }}
                                                    >
                                                        <span className="bar-orders">{month.orders}</span>
                                                    </div>
                                                </div>
                                                <div className="bar-label-minimal">
                                                    <span className="bar-month">{monthName}</span>
                                                    <span className="bar-year">{year}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-chart-minimal">
                                    <FiCalendar />
                                    <p>Veri bulunamadı</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Products & Categories - Minimal */}
                <div className="tables-grid-minimal">
                    {/* En Çok Satan Projeler */}
                    <div className="table-card-minimal">
                        <div className="table-header-minimal">
                            <h3>En Çok Satanlar</h3>
                            <span className="table-count">{topProducts?.length || 0} proje</span>
                        </div>
                        <div className="table-content-minimal">
                            {topProducts && topProducts.length > 0 ? (
                                <div className="compact-table-minimal">
                                    {topProducts.map((product, index) => {
                                        const maxRevenue = Math.max(...topProducts.map(p => parseFloat(p.revenue || 0)));
                                        const revenuePercent = maxRevenue > 0 ? (parseFloat(product.revenue || 0) / maxRevenue) * 100 : 0;
                                        return (
                                            <div key={product.id} className="table-row-minimal">
                                                <div className="row-rank-minimal">{index + 1}</div>
                                                <div className="row-content-minimal">
                                                    <div className="row-title-minimal">{product.title}</div>
                                                    <div className="row-progress-minimal">
                                                        <div 
                                                            className="progress-bar-minimal" 
                                                            style={{ width: `${revenuePercent}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="row-meta-minimal">
                                                        <span>{formatNumber(product.sales_count)} satış</span>
                                                        <span>•</span>
                                                        <span>{formatNumber(product.views)} görüntülenme</span>
                                                    </div>
                                                </div>
                                                <div className="row-value-minimal">{formatCurrency(product.revenue)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state-minimal">Veri bulunamadı</div>
                            )}
                        </div>
                    </div>

                    {/* Kategori Bazlı Satışlar */}
                    <div className="table-card-minimal">
                        <div className="table-header-minimal">
                            <h3>Kategori Dağılımı</h3>
                            <span className="table-count">{categories?.length || 0} kategori</span>
                        </div>
                        <div className="table-content-minimal">
                            {categories && categories.length > 0 ? (
                                <div className="compact-table-minimal">
                                    {categories.map((category, index) => {
                                        const maxRevenue = Math.max(...categories.map(c => parseFloat(c.revenue || 0)));
                                        const revenuePercent = maxRevenue > 0 ? (parseFloat(category.revenue || 0) / maxRevenue) * 100 : 0;
                                        return (
                                            <div key={index} className="table-row-minimal">
                                                <div className="row-rank-minimal">{index + 1}</div>
                                                <div className="row-content-minimal">
                                                    <div className="row-title-minimal">{category.category_name}</div>
                                                    <div className="row-progress-minimal">
                                                        <div 
                                                            className="progress-bar-minimal" 
                                                            style={{ width: `${revenuePercent}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="row-meta-minimal">
                                                        <span>{formatNumber(category.sales_count)} satış</span>
                                                    </div>
                                                </div>
                                                <div className="row-value-minimal">{formatCurrency(category.revenue)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state-minimal">Veri bulunamadı</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerAnalytics;
