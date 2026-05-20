import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiTrendingUp, FiDollarSign, FiPackage, FiStar, FiArrowRight, FiDownload, FiTag } from 'react-icons/fi';
import { getProducts, getSalesStats, getRecommendedProducts, submitQuoteRequest, submitDemoRequest } from '../api/sales';
import { getImageUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Sales.css';

const Sales = () => {
    const { isAuthenticated } = useAuth();
    const [products, setProducts] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quoteForm, setQuoteForm] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        budget_range: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsData, recommendedData] = await Promise.all([
                getProducts({ limit: 12 }),
                isAuthenticated ? getRecommendedProducts().catch(() => []) : Promise.resolve([])
            ]);
            
            setProducts(productsData.products || []);
            setRecommended(recommendedData || []);
            
            if (isAuthenticated) {
                try {
                    const statsData = await getSalesStats();
                    setStats(statsData);
                } catch (error) {
                    console.error('Error loading stats:', error);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuoteRequest = async (e) => {
        e.preventDefault();
        try {
            await submitQuoteRequest({
                ...quoteForm,
                project_id: selectedProduct?.id
            });
            alert('Teklif talebiniz alındı! En kısa sürede size dönüş yapacağız.');
            setShowQuoteModal(false);
            setQuoteForm({
                name: '',
                email: '',
                phone: '',
                company: '',
                message: '',
                budget_range: ''
            });
        } catch (error) {
            alert('Teklif talebi gönderilirken bir hata oluştu.');
        }
    };

    const handleDemoRequest = async (e) => {
        e.preventDefault();
        try {
            await submitDemoRequest({
                project_id: selectedProduct?.id,
                message: quoteForm.message
            });
            alert('Demo talebiniz alındı! Demo bilgileri e-posta adresinize gönderilecektir.');
            setShowDemoModal(false);
            setQuoteForm({ ...quoteForm, message: '' });
        } catch (error) {
            alert('Demo talebi gönderilirken bir hata oluştu.');
        }
    };

    const formatPrice = (price) => {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '₺0';
        // Eğer ondalık kısım .00 ise tam sayı olarak göster
        if (numPrice % 1 === 0) {
            return `₺${numPrice.toLocaleString('tr-TR')}`;
        }
        return `₺${numPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="sales-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sales-page">
            <div className="sales-hero">
                <div className="container">
                    <h1>Ürün ve Hizmetlerimiz</h1>
                    <p>Profesyonel yazılım çözümleri ve hizmetlerimizi keşfedin</p>
                </div>
            </div>

            {stats && (
                <div className="sales-stats-section">
                    <div className="container">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <FiShoppingBag className="stat-icon" />
                                <h3>{stats.total_orders || 0}</h3>
                                <p>Toplam Sipariş</p>
                            </div>
                            <div className="stat-card">
                                <FiPackage className="stat-icon" />
                                <h3>{stats.total_products_sold || 0}</h3>
                                <p>Satılan Ürün</p>
                            </div>
                            <div className="stat-card">
                                <FiDollarSign className="stat-icon" />
                                <h3>₺{parseFloat(stats.total_revenue || 0).toFixed(2)}</h3>
                                <p>Toplam Gelir</p>
                            </div>
                            <div className="stat-card">
                                <FiTrendingUp className="stat-icon" />
                                <h3>₺{parseFloat(stats.average_order_value || 0).toFixed(2)}</h3>
                                <p>Ortalama Sipariş</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container">
                {recommended.length > 0 && (
                    <section className="recommended-section">
                        <h2>Size Özel Öneriler</h2>
                        <div className="products-grid">
                            {recommended.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onQuoteRequest={() => {
                                        setSelectedProduct(product);
                                        setShowQuoteModal(true);
                                    }}
                                    onDemoRequest={() => {
                                        setSelectedProduct(product);
                                        setShowDemoModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <section className="products-section">
                    <h2>Tüm Ürünler</h2>
                    <div className="products-grid">
                        {products.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product}
                                onQuoteRequest={() => {
                                    setSelectedProduct(product);
                                    setShowQuoteModal(true);
                                }}
                                onDemoRequest={() => {
                                    setSelectedProduct(product);
                                    setShowDemoModal(true);
                                }}
                            />
                        ))}
                    </div>
                </section>
            </div>

            {/* Teklif Talebi Modal */}
            {showQuoteModal && (
                <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Teklif Talebi</h3>
                        <form onSubmit={handleQuoteRequest}>
                            <div className="form-group">
                                <label>Ad Soyad *</label>
                                <input
                                    type="text"
                                    value={quoteForm.name}
                                    onChange={(e) => setQuoteForm({...quoteForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>E-posta *</label>
                                <input
                                    type="email"
                                    value={quoteForm.email}
                                    onChange={(e) => setQuoteForm({...quoteForm, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Telefon</label>
                                <input
                                    type="tel"
                                    value={quoteForm.phone}
                                    onChange={(e) => setQuoteForm({...quoteForm, phone: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Şirket</label>
                                <input
                                    type="text"
                                    value={quoteForm.company}
                                    onChange={(e) => setQuoteForm({...quoteForm, company: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Bütçe Aralığı</label>
                                <select
                                    value={quoteForm.budget_range}
                                    onChange={(e) => setQuoteForm({...quoteForm, budget_range: e.target.value})}
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="0-1000">₺0 - ₺1,000</option>
                                    <option value="1000-5000">₺1,000 - ₺5,000</option>
                                    <option value="5000-10000">₺5,000 - ₺10,000</option>
                                    <option value="10000+">₺10,000+</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mesaj</label>
                                <textarea
                                    value={quoteForm.message}
                                    onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                                    rows="4"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowQuoteModal(false)} className="btn btn-outline">
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Gönder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Demo Talebi Modal */}
            {showDemoModal && isAuthenticated && (
                <div className="modal-overlay" onClick={() => setShowDemoModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Demo Talebi</h3>
                        <form onSubmit={handleDemoRequest}>
                            <div className="form-group">
                                <label>Mesaj</label>
                                <textarea
                                    value={quoteForm.message}
                                    onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                                    rows="4"
                                    placeholder="Demo talebiniz hakkında ek bilgi verin..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowDemoModal(false)} className="btn btn-outline">
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Demo Talep Et
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProductCard = ({ product, onQuoteRequest, onDemoRequest }) => {
    const formatPrice = (price) => {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '₺0';
        // Eğer ondalık kısım .00 ise tam sayı olarak göster
        if (numPrice % 1 === 0) {
            return `₺${numPrice.toLocaleString('tr-TR')}`;
        }
        return `₺${numPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const discount = product.discount_price 
        ? Math.round(((product.price - product.discount_price) / product.price) * 100)
        : 0;

    return (
        <div className="product-card">
            {discount > 0 && (
                <div className="discount-badge">-{discount}%</div>
            )}
            <Link to={`/projects/${product.id}`} className="product-link">
                <div className="product-image-wrapper">
                    {product.primary_image ? (
                        <img 
                            src={getImageUrl(product.primary_image)} 
                            alt={product.title}
                            className="product-image"
                        />
                    ) : (
                        <div className="product-image-placeholder">
                            <FiPackage size={60} />
                        </div>
                    )}
                </div>
                <div className="product-info">
                    <h3>{product.title}</h3>
                    {product.category_name && (
                        <div className="product-category">
                            <FiTag /> {product.category_name}
                        </div>
                    )}
                    {product.rating && (
                        <div className="product-rating">
                            <FiStar className="star filled" />
                            <span>{parseFloat(product.rating).toFixed(1)}</span>
                        </div>
                    )}
                    <div className="product-price-section">
                        {product.discount_price ? (
                            <>
                                <span className="old-price">{formatPrice(product.price)}</span>
                                <span className="new-price">{formatPrice(product.discount_price)}</span>
                            </>
                        ) : (
                            <span className="price">{formatPrice(product.price)}</span>
                        )}
                    </div>
                </div>
            </Link>
            <div className="product-actions">
                <Link to={`/projects/${product.id}`} className="btn btn-primary btn-sm">
                    Detaylar <FiArrowRight />
                </Link>
                <button onClick={onQuoteRequest} className="btn btn-outline btn-sm">
                    Teklif Al
                </button>
                {onDemoRequest && (
                    <button onClick={onDemoRequest} className="btn btn-outline btn-sm">
                        Demo İste
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sales;

