import { useState, useEffect } from 'react';
import SellerLayout from '../components/SellerLayout';
import { sellerAPI } from '../api/seller';
import {
    FiBarChart2, FiDollarSign, FiShoppingBag, FiUsers, FiPackage,
    FiTrendingUp, FiCalendar, FiDownload, FiRefreshCw, FiStar
} from 'react-icons/fi';
import './SellerReports.css';

const SellerReports = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [period, setPeriod] = useState('30');
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState(null);

    useEffect(() => {
        loadReports();
    }, [activeTab, period]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getReports({ type: activeTab === 'all' ? 'all' : activeTab, period });
            console.log('Reports response:', response.data);
            if (response.data && response.data.reports) {
                setReports(response.data.reports);
            } else {
                console.warn('Reports data structure unexpected:', response.data);
                setReports({});
            }
        } catch (error) {
            console.error('Reports load error:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            setReports({});
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return `₺${parseFloat(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const formatNumber = (value) => {
        return parseFloat(value || 0).toLocaleString('tr-TR');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    };

    const tabs = [
        { id: 'sales', label: 'Satış Raporları', icon: FiShoppingBag },
        { id: 'earnings', label: 'Kazanç Raporları', icon: FiDollarSign },
        { id: 'projects', label: 'Proje Raporları', icon: FiPackage },
        { id: 'customers', label: 'Müşteri Raporları', icon: FiUsers },
        { id: 'time', label: 'Zaman Bazlı', icon: FiCalendar }
    ];

    if (loading) {
        return (
            <SellerLayout>
                <div className="seller-reports-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="seller-reports-page">
                <div className="reports-header">
                    <div className="header-content">
                        <h1 className="page-title">Raporlar</h1>
                        <p className="page-subtitle">Detaylı satış ve performans raporlarınız</p>
                    </div>
                    <div className="header-actions">
                        <div className="period-selector">
                            <select
                                className="period-select"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                            >
                                <option value="7">Son 7 Gün</option>
                                <option value="30">Son 30 Gün</option>
                                <option value="90">Son 90 Gün</option>
                                <option value="365">Son 1 Yıl</option>
                            </select>
                        </div>
                        <button className="btn-refresh" onClick={loadReports}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <div className="tabs-container">
                    <div className="tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon className="tab-icon" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="reports-content">
                    {activeTab === 'sales' && (
                        <div className="report-section">
                            <div className="section-header">
                                <h2>Satış Raporları</h2>
                                <p>Günlük ve proje bazlı satış istatistikleri</p>
                            </div>

                            {reports?.sales?.daily && Array.isArray(reports.sales.daily) && reports.sales.daily.length > 0 ? (
                                <>
                                    <div className="report-card">
                                        <h3>Günlük Satış Trendi</h3>
                                        <div className="table-container">
                                            <table className="report-table">
                                                <thead>
                                                    <tr>
                                                        <th>Tarih</th>
                                                        <th>Sipariş</th>
                                                        <th>Ürün</th>
                                                        <th>Toplam Gelir</th>
                                                        <th>Ortalama Sipariş</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports.sales.daily.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{formatDate(item.date)}</td>
                                                            <td>{item.order_count || 0}</td>
                                                            <td>{item.product_count || 0}</td>
                                                            <td className="value-cell">{formatCurrency(item.total_revenue)}</td>
                                                            <td className="value-cell">{formatCurrency(item.avg_order_value)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="report-card">
                                        <h3>Proje Bazlı Satışlar</h3>
                                        <div className="table-container">
                                            <table className="report-table">
                                                <thead>
                                                    <tr>
                                                        <th>Proje</th>
                                                        <th>Sipariş</th>
                                                        <th>Toplam Gelir</th>
                                                        <th>Ortalama Fiyat</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports.sales.byProject && reports.sales.byProject.length > 0 ? (
                                                        reports.sales.byProject.map((item) => (
                                                            <tr key={item.id}>
                                                                <td className="title-cell">{item.title}</td>
                                                                <td>{item.order_count || 0}</td>
                                                                <td className="value-cell">{formatCurrency(item.revenue)}</td>
                                                                <td className="value-cell">{formatCurrency(item.avg_price)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="empty-cell">Henüz satış yok</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <FiShoppingBag className="empty-icon" />
                                    <h3>Satış Verisi Bulunamadı</h3>
                                    <p>Seçilen dönemde satış verisi bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'earnings' && (
                        <div className="report-section">
                            <div className="section-header">
                                <h2>Kazanç Raporları</h2>
                                <p>Günlük kazanç ve işlem detayları</p>
                            </div>

                            {reports?.earnings?.daily && Array.isArray(reports.earnings.daily) && reports.earnings.daily.length > 0 ? (
                                <>
                                    <div className="report-card">
                                        <h3>Günlük Kazanç Trendi</h3>
                                        <div className="table-container">
                                            <table className="report-table">
                                                <thead>
                                                    <tr>
                                                        <th>Tarih</th>
                                                        <th>Sipariş</th>
                                                        <th>Toplam Kazanç</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports.earnings.daily.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{formatDate(item.date)}</td>
                                                            <td>{item.order_count || 0}</td>
                                                            <td className="value-cell earning-value">{formatCurrency(item.total_earnings)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {reports.earnings.transactions && reports.earnings.transactions.length > 0 && (
                                        <div className="report-card">
                                            <h3>İşlem Bazlı Kazançlar</h3>
                                            <div className="table-container">
                                                <table className="report-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Tarih</th>
                                                            <th>İşlem</th>
                                                            <th>Kazanç</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reports.earnings.transactions.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{formatDate(item.date)}</td>
                                                                <td>{item.transaction_count || 0}</td>
                                                                <td className="value-cell earning-value">{formatCurrency(item.total_earnings)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="empty-state">
                                    <FiDollarSign className="empty-icon" />
                                    <h3>Kazanç Verisi Bulunamadı</h3>
                                    <p>Seçilen dönemde kazanç verisi bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="report-section">
                            <div className="section-header">
                                <h2>Proje Raporları</h2>
                                <p>Projelerinizin performans istatistikleri</p>
                            </div>

                            {reports?.projects && Array.isArray(reports.projects) && reports.projects.length > 0 ? (
                                <div className="report-card">
                                    <div className="table-container">
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>Proje</th>
                                                    <th>Durum</th>
                                                    <th>Görüntülenme</th>
                                                    <th>İndirme</th>
                                                    <th>Satış</th>
                                                    <th>Gelir</th>
                                                    <th>Puan</th>
                                                    <th>Yorum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reports.projects.map((project) => (
                                                    <tr key={project.id}>
                                                        <td className="title-cell">{project.title}</td>
                                                        <td>
                                                            <span className={`status-badge status-${project.status}`}>
                                                                {project.status === 'active' ? 'Aktif' : project.status === 'pending' ? 'Beklemede' : 'Pasif'}
                                                            </span>
                                                        </td>
                                                        <td>{formatNumber(project.view_count)}</td>
                                                        <td>{formatNumber(project.download_count)}</td>
                                                        <td>{project.sale_count || 0}</td>
                                                        <td className="value-cell">{formatCurrency(project.total_revenue)}</td>
                                                        <td>
                                                            <div className="rating-cell">
                                                                <FiStar className="star-icon" />
                                                                {parseFloat(project.avg_rating || 0).toFixed(1)}
                                                            </div>
                                                        </td>
                                                        <td>{project.review_count || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <FiPackage className="empty-icon" />
                                    <h3>Proje Verisi Bulunamadı</h3>
                                    <p>Henüz projeniz bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="report-section">
                            <div className="section-header">
                                <h2>Müşteri Raporları</h2>
                                <p>Müşterilerinizin satın alma ve bağış istatistikleri</p>
                            </div>

                            {reports?.customers && Array.isArray(reports.customers) && reports.customers.length > 0 ? (
                                <div className="report-card">
                                    <div className="table-container">
                                        <table className="report-table">
                                            <thead>
                                                <tr>
                                                    <th>Müşteri</th>
                                                    <th>E-posta</th>
                                                    <th>Sipariş</th>
                                                    <th>Toplam Harcama</th>
                                                    <th>Kazancım</th>
                                                    <th>Bağış</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reports.customers.map((customer) => (
                                                    <tr key={customer.id}>
                                                        <td className="title-cell">{customer.username || 'İsimsiz'}</td>
                                                        <td>{customer.email}</td>
                                                        <td>{customer.order_count || 0}</td>
                                                        <td className="value-cell">{formatCurrency(customer.total_spent)}</td>
                                                        <td className="value-cell earning-value">{formatCurrency(customer.total_earnings)}</td>
                                                        <td className="value-cell donation-value">{formatCurrency(customer.total_donation)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <FiUsers className="empty-icon" />
                                    <h3>Müşteri Verisi Bulunamadı</h3>
                                    <p>Seçilen dönemde müşteri verisi bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'time' && (
                        <div className="report-section">
                            <div className="section-header">
                                <h2>Zaman Bazlı Raporlar</h2>
                                <p>Aylık ve haftalık performans analizi</p>
                            </div>

                            {reports?.time ? (
                                <>
                                    <div className="report-card">
                                        <h3>Aylık Rapor</h3>
                                        <div className="table-container">
                                            <table className="report-table">
                                                <thead>
                                                    <tr>
                                                        <th>Ay</th>
                                                        <th>Sipariş</th>
                                                        <th>Ürün</th>
                                                        <th>Müşteri</th>
                                                        <th>Gelir</th>
                                                        <th>Kazanç</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports.time.monthly && Array.isArray(reports.time.monthly) && reports.time.monthly.length > 0 ? (
                                                        reports.time.monthly.map((item, index) => (
                                                            <tr key={index}>
                                                                <td className="title-cell">{item.month}</td>
                                                                <td>{item.order_count || 0}</td>
                                                                <td>{item.product_count || 0}</td>
                                                                <td>{item.customer_count || 0}</td>
                                                                <td className="value-cell">{formatCurrency(item.revenue)}</td>
                                                                <td className="value-cell earning-value">{formatCurrency(item.earnings)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="6" className="empty-cell">Veri bulunamadı</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="report-card">
                                        <h3>Haftalık Rapor</h3>
                                        <div className="table-container">
                                            <table className="report-table">
                                                <thead>
                                                    <tr>
                                                        <th>Hafta Başlangıcı</th>
                                                        <th>Sipariş</th>
                                                        <th>Gelir</th>
                                                        <th>Kazanç</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports.time.weekly && Array.isArray(reports.time.weekly) && reports.time.weekly.length > 0 ? (
                                                        reports.time.weekly.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{formatDate(item.week_start)}</td>
                                                                <td>{item.order_count || 0}</td>
                                                                <td className="value-cell">{formatCurrency(item.revenue)}</td>
                                                                <td className="value-cell earning-value">{formatCurrency(item.earnings)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="empty-cell">Veri bulunamadı</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <FiCalendar className="empty-icon" />
                                    <h3>Zaman Bazlı Veri Bulunamadı</h3>
                                    <p>Seçilen dönemde zaman bazlı veri bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerReports;
