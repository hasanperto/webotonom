import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../api/cart';
import { couponsAPI } from '../api/coupons';
import { ordersAPI } from '../api/orders';
import { paymentsAPI } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const Checkout = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Türkiye',
        payment_method: 'credit_card'
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadCart();
    }, [isAuthenticated, navigate]);

    const loadCart = async () => {
        try {
            setLoading(true);
            const response = await cartAPI.getCart();
            setCart(response.data);
        } catch (error) {
            console.error('Cart load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        try {
            const response = await couponsAPI.validate({
                code: couponCode,
                project_id: cart.items[0]?.project_id
            });
            
            if (response.data.valid) {
                const coupon = response.data;
                if (coupon.discount_type === 'percentage') {
                    setCouponDiscount((cart.total * coupon.discount_value) / 100);
                } else {
                    setCouponDiscount(coupon.discount_value);
                }
                setCouponApplied(true);
                alert('Kupon uygulandı!');
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Kupon geçersiz');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.address) {
            alert('Lütfen tüm zorunlu alanları doldurun');
            return;
        }

        try {
            // Sipariş oluştur
            const orderData = {
                billing_info: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country
                },
                coupon_code: couponApplied ? couponCode : null,
                payment_method: formData.payment_method
            };

            const orderResponse = await ordersAPI.createOrder(orderData);
            
            if (orderResponse.data.order) {
                const orderId = orderResponse.data.order.id;

                // Ödeme işlemini başlat
                try {
                    const paymentResponse = await paymentsAPI.processPayment({
                        order_id: orderId,
                        payment_method: formData.payment_method,
                        payment_data: {} // Stripe/Iyzico için gerekli veriler buraya eklenecek
                    });

                    if (paymentResponse.data.success) {
                        // Başarılı - sipariş detay sayfasına yönlendir
                        navigate(`/orders/${orderId}`, {
                            state: { 
                                order: orderResponse.data.order,
                                paymentSuccess: true
                            }
                        });
                    } else {
                        // Ödeme başarısız ama sipariş oluşturuldu
                        navigate(`/orders/${orderId}`, {
                            state: { 
                                order: orderResponse.data.order,
                                paymentSuccess: false
                            }
                        });
                    }
                } catch (paymentError) {
                    // Ödeme hatası ama sipariş oluşturuldu
                    console.error('Payment error:', paymentError);
                    navigate(`/orders/${orderId}`, {
                        state: { 
                            order: orderResponse.data.order,
                            paymentSuccess: false,
                            paymentError: paymentError.response?.data?.error
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Order creation error:', error);
            alert(error.response?.data?.error || 'Sipariş oluşturulurken bir hata oluştu');
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

    const finalTotal = cart ? Math.max(0, cart.total - couponDiscount) : 0;

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="checkout-page">
                <div className="container">
                    <p>Sepetiniz boş. Ödeme yapmak için sepete ürün ekleyin.</p>
                    <button onClick={() => navigate('/projects')} className="btn btn-primary">
                        Alışverişe Başla
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Ödeme</h1>
                
                <div className="checkout-grid">
                    <div className="checkout-form-section">
                        <form onSubmit={handleSubmit} className="checkout-form">
                            <h2>Fatura Bilgileri</h2>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ad Soyad *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>E-posta *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Telefon</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label>Adres *</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    required
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Şehir</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ülke</label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                                    />
                                </div>
                            </div>

                            <h2>Ödeme Yöntemi</h2>
                            <div className="payment-methods">
                                <label className="payment-option">
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="credit_card"
                                        checked={formData.payment_method === 'credit_card'}
                                        onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                    />
                                    <span>💳 Kredi Kartı</span>
                                </label>
                                <label className="payment-option">
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        value="bank_transfer"
                                        checked={formData.payment_method === 'bank_transfer'}
                                        onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                    />
                                    <span>🏦 Banka Havalesi</span>
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary btn-large btn-block">
                                Ödemeyi Tamamla
                            </button>
                        </form>
                    </div>

                    <div className="checkout-summary">
                        <div className="summary-card">
                            <h2>Sipariş Özeti</h2>
                            
                            <div className="order-items">
                                {cart.items.map(item => (
                                    <div key={item.id} className="order-item-summary">
                                        <span>{item.title}</span>
                                        <span>{formatPrice((item.discount_price || item.price) * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="summary-row">
                                <span>Ara Toplam</span>
                                <span>{formatPrice(cart.total)}</span>
                            </div>

                            {couponApplied && (
                                <div className="summary-row discount">
                                    <span>İndirim</span>
                                    <span>-{formatPrice(couponDiscount)}</span>
                                </div>
                            )}

                            {!couponApplied && (
                                <form onSubmit={handleApplyCoupon} className="coupon-form">
                                    <input
                                        type="text"
                                        placeholder="Kupon Kodu"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                    />
                                    <button type="submit" className="btn btn-outline">Uygula</button>
                                </form>
                            )}

                            <div className="summary-row total">
                                <span>Toplam</span>
                                <span>{formatPrice(finalTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;

