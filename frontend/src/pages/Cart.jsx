import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cartAPI } from '../api/cart';
import { couponsAPI } from '../api/coupons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getImageUrl } from '../utils/api';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiTag, FiShoppingCart, FiHome } from 'react-icons/fi';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { motionEase } from '../utils/motion';
import './Cart.css';

const Cart = () => {
    const { isAuthenticated } = useAuth();
    const { loadCart: reloadCartContext } = useCart();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (isAuthenticated) {
            loadCart();
        }
    }, [isAuthenticated, language]);

    const loadCart = async () => {
        try {
            setLoading(true);
            const response = await cartAPI.getCart(language);
            setCart(response.data);
        } catch (error) {
            console.error('Cart load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id) => {
        try {
            await cartAPI.removeFromCart(id);
            await loadCart();
            await reloadCartContext(); // CartContext'i güncelle
        } catch (error) {
            alert(t('cart.remove_failed'));
        }
    };

    const handleQuantityChange = async (id, newQuantity) => {
        if (newQuantity < 1) {
            return;
        }
        try {
            await cartAPI.updateCartItem(id, { quantity: newQuantity });
            await loadCart();
            await reloadCartContext(); // CartContext'i güncelle
        } catch (error) {
            alert(t('cart.quantity_update_failed'));
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
                alert(t('cart.coupon_applied'));
            }
        } catch (error) {
            alert(error.response?.data?.error || t('cart.coupon_invalid'));
        }
    };

    const finalTotal = cart ? Math.max(0, cart.total - couponDiscount) : 0;

    if (!isAuthenticated) {
        return (
            <div className="cart-page">
                <div className="container">
                    <p>{t('cart.login_required')}</p>
                    <Link to="/login" className="btn btn-primary">{t('cart.login')}</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="loading">{t('cart.loading')}</div>;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="empty-cart-modern">
                        <div className="empty-cart-icon-wrapper">
                            <div className="empty-cart-icon-bg"></div>
                            <FiShoppingCart className="empty-cart-icon" />
                        </div>
                        <h2 className="empty-cart-title">{t('cart.empty_title')}</h2>
                        <p className="empty-cart-description">
                            {t('cart.empty_description')}
                            <br />
                            {t('cart.empty_description_2')}
                        </p>
                        <div className="empty-cart-actions">
                            <Link to="/projects" className="btn-empty-cart-primary">
                                <FiShoppingCart />
                                <span>{t('cart.start_shopping')}</span>
                            </Link>
                            <Link to="/" className="btn-empty-cart-secondary">
                                <FiHome />
                                <span>{t('cart.back_to_home')}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page cart-page--has-items">
            <div className="cart-container">
                <div className="cart-header">
                    <h1 className="cart-title">
                        <FiShoppingBag /> {t('cart.title')}
                    </h1>
                    <span className="cart-count">{cart.items.length} {cart.items.length === 1 ? t('cart.product') : t('cart.products')}</span>
                </div>
                
                <div className="cart-layout">
                    <div className="cart-items-section">
                        <AnimatePresence initial={false} mode="popLayout">
                        {cart.items.map(item => (
                            <M.div
                                key={item.id}
                                layout
                                className="cart-item-modern"
                                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduceMotion ? undefined : { opacity: 0, x: -20, scale: 0.98 }}
                                transition={{ duration: 0.22, ease: motionEase }}
                            >
                                <div className="cart-item-image">
                                    {item.image ? (
                                        <img src={getImageUrl(item.image)} alt={item.title} />
                                    ) : (
                                        <div className="cart-item-placeholder">
                                            <FiShoppingBag />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="cart-item-content">
                                    <div className="cart-item-header">
                                        <h3 className="cart-item-title">
                                            <Link to={`/projects/${item.project_id}`}>{item.title}</Link>
                                        </h3>
                                        <button 
                                            onClick={() => handleRemove(item.id)}
                                            className="cart-item-remove"
                                            title={t('cart.remove')}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                    
                                    <div className="cart-item-price-section">
                                        {item.discount_price ? (
                                            <div className="price-group">
                                                <span className="price-old">{formatPrice(item.price, item.currency || 'TRY')}</span>
                                                <span className="price-new">{formatPrice(item.discount_price, item.currency || 'TRY')}</span>
                                            </div>
                                        ) : (
                                            <span className="price-single">{formatPrice(item.price, item.currency || 'TRY')}</span>
                                        )}
                                    </div>
                                    
                                    <div className="cart-item-footer">
                                        <div className="quantity-modern">
                                            <button 
                                                onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                                                className="qty-btn qty-minus"
                                                disabled={!item.quantity || item.quantity <= 1}
                                            >
                                                <FiMinus />
                                            </button>
                                            <span className="qty-value">{item.quantity || 1}</span>
                                            <button 
                                                onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                                                className="qty-btn qty-plus"
                                            >
                                                <FiPlus />
                                            </button>
                                        </div>
                                        <div className="item-total">
                                            <span className="total-label">{t('cart.subtotal')}</span>
                                            <span className="total-value">{formatPrice((item.discount_price || item.price) * (item.quantity || 1), item.currency || 'TRY')}</span>
                                        </div>
                                    </div>
                                </div>
                            </M.div>
                        ))}
                        </AnimatePresence>
                    </div>

                    <div className="cart-summary-section">
                        <div className="summary-modern">
                            <h2 className="summary-title">{t('cart.order_summary')}</h2>
                            
                            <div className="summary-content">
                                <div className="summary-line">
                                    <span className="summary-label">{t('cart.subtotal')}</span>
                                    <span className="summary-value">{formatPrice(cart.total, cart.currency || 'TRY')}</span>
                                </div>

                                {couponApplied && (
                                    <div className="summary-line summary-discount">
                                        <span className="summary-label">
                                            <FiTag /> {t('cart.discount')}
                                        </span>
                                        <span className="summary-value">-{formatPrice(couponDiscount, cart.currency || 'TRY')}</span>
                                    </div>
                                )}

                                <div className="summary-divider"></div>

                                <div className="summary-line summary-total">
                                    <span className="summary-label">{t('cart.total')}</span>
                                    <span className="summary-value">{formatPrice(finalTotal, cart.currency || 'TRY')}</span>
                                </div>
                            </div>

                            {!couponApplied && (
                                <form onSubmit={handleApplyCoupon} className="coupon-modern">
                                    <div className="coupon-input-wrapper">
                                        <FiTag className="coupon-icon" />
                                        <input
                                            type="text"
                                            placeholder={t('cart.coupon_code')}
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="coupon-input"
                                        />
                                    </div>
                                    <button type="submit" className="coupon-btn">{t('cart.apply')}</button>
                                </form>
                            )}

                            <Link to="/checkout-wizard" className="checkout-btn">
                                <FiShoppingBag className="me-2" />
                                {t('cart.proceed_to_checkout')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="cart-mobile-checkout-bar" role="region" aria-label={t('cart.order_summary')}>
                <div className="cart-mobile-checkout-inner">
                    <div className="cart-mobile-checkout-total">
                        <span className="cart-mobile-checkout-label">{t('cart.total')}</span>
                        <span className="cart-mobile-checkout-value">{formatPrice(finalTotal, cart.currency || 'TRY')}</span>
                    </div>
                    <Link to="/checkout-wizard" className="cart-mobile-checkout-btn">
                        <FiShoppingBag />
                        <span>{t('cart.proceed_to_checkout')}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Cart;

