import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sellerAPI } from '../api/seller';
import SellerLayout from '../components/SellerLayout';
import { FiArrowLeft, FiPrinter, FiUser, FiCalendar, FiCreditCard, FiPackage, FiDollarSign } from 'react-icons/fi';
import './SellerSalesDetail.css';

const SellerSalesDetail = () => {
    const { id } = useParams();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSaleDetail();
    }, [id]);

    const loadSaleDetail = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getSale(id);
            setSale(response.data.sale);
        } catch (err) {
            console.error('Sale detail error:', err);
            setError('Satış detayları yüklenemedi. Yetkiniz olmayabilir veya satış bulunamadı.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const formatDate = (dateString, full = true) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: full ? '2-digit' : undefined,
            minute: full ? '2-digit' : undefined
        });
    };

    if (loading) return (
        <SellerLayout>
            <div className="loading-fullscreen">
                <div className="spinner-large"></div>
                <p>Detaylar yükleniyor...</p>
            </div>
        </SellerLayout>
    );

    if (error) return (
        <SellerLayout>
            <div className="error-container">
                <h3>Hata</h3>
                <p>{error}</p>
                <Link to="/seller/sales" className="btn-back">
                    <FiArrowLeft /> Satışlara Dön
                </Link>
            </div>
        </SellerLayout>
    );

    if (!sale) return null;

    return (
        <SellerLayout>
            <div className="seller-sales-detail-page">
                {/* Header */}
                <div className="detail-header">
                    <div className="header-left">
                        <Link to="/seller/sales" className="back-link">
                            <FiArrowLeft /> Geri
                        </Link>
                        <h1>Sipariş #{sale.order_number}</h1>
                        <span className={`status-badge detail-status ${sale.payment_status}`}>
                            {sale.payment_status === 'paid' ? 'Ödendi' : sale.payment_status}
                        </span>
                    </div>
                    <div className="header-actions">
                        <button className="btn-print" onClick={() => window.print()}>
                            <FiPrinter /> Yazdır
                        </button>
                    </div>
                </div>

                <div className="detail-grid">
                    {/* Main Info */}
                    <div className="detail-main">
                        <div className="info-card">
                            <h3><FiUser /> Müşteri Bilgileri</h3>
                            <div className="info-row">
                                <span className="label">Ad Soyad:</span>
                                <span className="value">{sale.customer_name || 'Misafir'}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">E-posta:</span>
                                <span className="value">{sale.customer_email || '-'}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Telefon:</span>
                                <span className="value">{sale.customer_phone || '-'}</span>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3><FiCalendar /> Sipariş Detayları</h3>
                            <div className="info-row">
                                <span className="label">Oluşturulma Tarihi:</span>
                                <span className="value">{formatDate(sale.created_at)}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Ödeme Yöntemi:</span>
                                <span className="value uppercase">{sale.payment_method || 'Kredi Kartı'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="items-section">
                        <h3><FiPackage /> Satılan Ürünler</h3>
                        <div className="items-table-wrapper">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Ürün</th>
                                        <th>Fiyat (Liste)</th>
                                        <th>İndirim</th>
                                        <th>İşlem Tutarı</th>
                                        <th>KDV (%18)</th>
                                        <th>Komisyon (%{sale.commission_rate || 15})</th>
                                        <th>Net Kazanç</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items.map((item, index) => {
                                        const listPrice = parseFloat(item.subtotal);
                                        // effective_price backend'den gelir, yoksa subtotal kullanılır
                                        const transactionAmount = item.effective_price ? parseFloat(item.effective_price) : listPrice;
                                        const discountVal = listPrice - transactionAmount;

                                        // KDV ve Komisyon, İŞLEM TUTARI üzerinden hesaplanır
                                        const net = transactionAmount / 1.18;
                                        const commission = net * (parseFloat(sale.commission_rate || 15) / 100);

                                        return (
                                            <tr key={item.id || index}>
                                                <td>
                                                    <div className="item-info">
                                                        {item.image && (
                                                            <img src={item.image} alt={item.project_title} className="item-thumb" />
                                                        )}
                                                        <div>
                                                            <div className="item-title">{item.project_title}</div>
                                                            <div className="item-slug">#{item.project_slug}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{formatCurrency(listPrice)}</td>
                                                <td className="text-danger">-{formatCurrency(discountVal)}</td>
                                                <td>{formatCurrency(transactionAmount)}</td>
                                                <td className="text-secondary">{formatCurrency(transactionAmount - net)}</td>
                                                <td className="text-danger">-{formatCurrency(commission)}</td>
                                                <td className="text-success font-bold">{formatCurrency(item.earning)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="summary-section">
                        <div className="summary-card">
                            <div className="summary-row">
                                <span>Toplam Satış (Brüt):</span>
                                <span>{formatCurrency(sale.total_sales_amount)}</span>
                            </div>
                            <div className="summary-row highlight">
                                <span>Toplam Net Kazanç:</span>
                                <span className="text-success">{formatCurrency(sale.total_earnings)}</span>
                            </div>
                            <p className="summary-note">
                                * Kazanç hesabı: (Brüt / 1.18) - Komisyon
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerSalesDetail;
