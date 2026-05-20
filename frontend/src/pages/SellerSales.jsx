import { useState, useEffect } from 'react';
import { sellerAPI } from '../api/seller';
import SellerLayout from '../components/SellerLayout';
import { FiShoppingBag, FiSearch, FiDownload, FiEye } from 'react-icons/fi';
import './SellerSales.css';

const SellerSales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getSales();
            setSales(response.data.sales || []);
        } catch (error) {
            console.error('Sales load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            sale.project_title?.toLowerCase().includes(query) ||
            sale.customer_name?.toLowerCase().includes(query) ||
            sale.order_number?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <SellerLayout>
                <div className="seller-sales-page">
                    <div className="loading-fullscreen">
                        <div className="spinner-large"></div>
                        <p>Satışlar yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="seller-sales-page">
                <div className="dashboard-content-wrapper">
                    <div className="page-header">
                    <div className="header-content">
                        <h1>Satışlarım</h1>
                        <p>Tüm satış geçmişinizi buradan görüntüleyebilirsiniz</p>
                    </div>
                </div>

                {/* Arama */}
                <div className="search-section">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Müşteri, proje veya sipariş no ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Satış Listesi */}
                {filteredSales.length === 0 ? (
                    <div className="empty-sales">
                        <FiShoppingBag className="empty-icon" />
                        <h3>Henüz satış yok</h3>
                        <p>Projeleriniz satıldığında burada görünecek</p>
                    </div>
                ) : (
                    <div className="sales-table-wrapper">
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Sipariş No</th>
                                    <th>Proje</th>
                                    <th>Müşteri</th>
                                    <th>Tutar</th>
                                    <th>Kazanç</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map(sale => (
                                    <tr key={sale.id}>
                                        <td>{new Date(sale.created_at).toLocaleDateString('tr-TR')}</td>
                                        <td className="order-number">{sale.order_number || `#${sale.order_id}`}</td>
                                        <td className="project-name">{sale.project_title || 'Proje'}</td>
                                        <td>{sale.customer_name || 'Müşteri'}</td>
                                        <td className="amount">₺{parseFloat(sale.total_amount || 0).toLocaleString('tr-TR')}</td>
                                        <td className="earnings">₺{parseFloat(sale.earnings || 0).toLocaleString('tr-TR')}</td>
                                        <td>
                                            <span className={`status-badge status-${sale.payment_status}`}>
                                                {sale.payment_status === 'paid' && 'Ödendi'}
                                                {sale.payment_status === 'pending' && 'Beklemede'}
                                                {sale.payment_status === 'failed' && 'Başarısız'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-icon"
                                                onClick={() => window.open(`/seller/sales/${sale.id}`, '_blank')}
                                                title="Detayları Gör"
                                            >
                                                <FiEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerSales;

