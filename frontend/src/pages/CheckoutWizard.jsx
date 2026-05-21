import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartAPI } from '../api/cart';
import { couponsAPI } from '../api/coupons';
import { ordersAPI } from '../api/orders';
import { paymentsAPI } from '../api/payments';
import { usersAPI } from '../api/users';
import { userAddressesAPI } from '../api/userAddresses';
import { userPaymentCardsAPI } from '../api/userPaymentCards';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl } from '../utils/api';
import {
    FiShoppingCart, FiMapPin, FiCreditCard, FiCheckCircle,
    FiChevronRight, FiPlus, FiX, FiTrash2, FiEdit, FiLock
} from 'react-icons/fi';
import { AnimatePresence, LayoutGroup, motion as M, useReducedMotion } from 'framer-motion';
import { motionEase } from '../utils/motion';
import './CheckoutWizard.css';

const CheckoutWizard = () => {
    const { isAuthenticated, user } = useAuth();
    const { loadCart: reloadCartContext } = useCart();
    const { language, t } = useLanguage();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [tax, setTax] = useState(0); // KDV
    const [userBalance, setUserBalance] = useState(0);

    // Address states
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({
        type: 'home', // home, work, other
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        district: '',
        postal_code: '',
        phone: '',
        country: 'Türkiye',
        is_default: false
    });

    // Payment states
    const [savedCards, setSavedCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('credit_card'); // credit_card, paypal, bank_transfer, balance
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [newCard, setNewCard] = useState({
        card_number: '',
        card_holder: '',
        expiry_date: '',
        cvv: '',
        save_card: false
    });

    // Form states
    const [billingInfo, setBillingInfo] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        postal_code: '',
        country: 'Türkiye'
    });
    const [customerNotes, setCustomerNotes] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Order result
    const [orderResult, setOrderResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [checkoutPaymentMethods, setCheckoutPaymentMethods] = useState([
        'credit_card', 'paypal', 'bank_transfer', 'balance'
    ]);
    const [paymentDemoMode, setPaymentDemoMode] = useState(true);
    const [demoHints, setDemoHints] = useState(null);
    const [paypalDemo, setPaypalDemo] = useState({ email: '', password: '' });
    const reduceMotion = useReducedMotion();

    const loadCheckoutPaymentMethods = async () => {
        try {
            const res = await paymentsAPI.getMethods();
            const ids = (res.data?.methods || [])
                .filter((m) => m.enabled)
                .map((m) => m.id);
            if (ids.length > 0) {
                setCheckoutPaymentMethods(ids);
                setPaymentDemoMode(!!res.data?.demo_mode);
                if (!ids.includes(paymentMethod)) {
                    setPaymentMethod(ids[0]);
                }
            }
            if (res.data?.demo_hints) {
                const h = res.data.demo_hints;
                setDemoHints(h);
                setNewCard((prev) => ({
                    ...prev,
                    card_number: h.card_number || prev.card_number,
                    card_holder: h.card_holder || prev.card_holder,
                    expiry_date: h.expiry || prev.expiry_date,
                    cvv: h.cvv || prev.cvv,
                }));
                setPaypalDemo({
                    email: h.paypal_email || '',
                    password: h.paypal_password || '',
                });
            }
        } catch {
            /* varsayılan dört yöntem */
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadData();
    }, [isAuthenticated, navigate, language]);

    useEffect(() => {
        // Sepeti yükle ve varsa kuponu uygula
        const initCheckout = async () => {
            await loadData();

            // LocalStorage'dan kuponu kontrol et
            const storedCoupon = localStorage.getItem('checkout_coupon');
            if (storedCoupon) {
                try {
                    const parsedCoupon = JSON.parse(storedCoupon);
                    setCouponCode(parsedCoupon.code);
                    setCouponApplied(true);
                    setCouponDiscount(parsedCoupon.discount);
                    // Cart yüklendiğinde hesaplama otomatik yapılacak (loadCart fonksiyonunda değil, useEffect ile yapılmalı)
                    // Ancak loadCart henüz cart state'ini set etmemiş olabilir.
                } catch (e) {
                    localStorage.removeItem('checkout_coupon');
                }
            }
        };

        initCheckout();
    }, [isAuthenticated, navigate, language]);

    // Cart loaded ve kupon varsa indirimi hesapla (sayfa yenilendiğinde)
    useEffect(() => {
        if (cart && couponApplied && couponCode) {
            // Kupon geçerliliğini tekrar kontrol edebiliriz ama şimdilik sadece indirimi uygulayalım
            // İndirim backend'den gelmeliydi ama burada localStorage'dan aldık
            // Basitlik için yeniden hesaplamıyorum, stored discount'u kullanıyorum.
            // Ama tax güncellemesi lazım
            const subtotal = cart.total - couponDiscount;
            setTax(subtotal * 0.18);
        }
    }, [cart, couponApplied, couponDiscount]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadCart(),
                loadUserProfile(),
                loadSavedAddresses(),
                loadSavedCards(),
                loadUserBalance(),
                loadBankAccounts(),
                loadCheckoutPaymentMethods()
            ]);
        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBankAccounts = async () => {
        try {
            const response = await api.get('/bank-accounts');
            setBankAccounts(response.data.accounts || []);
        } catch (error) {
            console.error('Load bank accounts error:', error);
            setBankAccounts([]);
        }
    };

    const loadCart = async () => {
        try {
            const response = await cartAPI.getCart(language);
            setCart(response.data);
            // KDV hesapla (%18)
            if (response.data.total) {
                const subtotal = response.data.total - couponDiscount;
                setTax(subtotal * 0.18);
            }
        } catch (error) {
            console.error('Cart load error:', error);
        }
    };

    const loadUserProfile = async () => {
        try {
            const response = await usersAPI.getProfile();
            const profile = response.data.user;
            
            // Bakiye bilgisini de güncelle
            const balance = parseFloat(profile?.balance || 0);
            setUserBalance(balance);
            
            setBillingInfo({
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username,
                email: profile.email || '',
                phone: profile.phone || '',
                address: profile.address || '',
                city: profile.city || '',
                district: '',
                postal_code: '',
                country: profile.country || 'Türkiye'
            });
        } catch (error) {
            console.error('Profile load error:', error);
        }
    };

    const loadSavedAddresses = async () => {
        try {
            const response = await userAddressesAPI.getAddresses();
            const addresses = response.data.addresses || [];
            setSavedAddresses(addresses);
            // Varsayılan adresi seç
            const defaultAddress = addresses.find(addr => addr.is_default);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
                // Billing info'yu varsayılan adresle doldur
                setBillingInfo({
                    name: defaultAddress.name,
                    email: billingInfo.email || user?.email || '',
                    phone: defaultAddress.phone || '',
                    address: defaultAddress.address_line1,
                    city: defaultAddress.city,
                    district: defaultAddress.district || '',
                    postal_code: defaultAddress.postal_code || '',
                    country: defaultAddress.country || 'Türkiye'
                });
            } else if (addresses.length === 0) {
                // Eğer kayıtlı adres yoksa formu otomatik aç
                setShowAddAddressModal(true);
            }
        } catch (error) {
            console.error('Addresses load error:', error);
        }
    };

    const loadSavedCards = async () => {
        try {
            const response = await userPaymentCardsAPI.getCards();
            setSavedCards(response.data.cards || []);
            // Varsayılan kartı seç
            const defaultCard = response.data.cards?.find(card => card.is_default);
            if (defaultCard) {
                setSelectedCardId(defaultCard.id);
            }
        } catch (error) {
            console.error('Cards load error:', error);
        }
    };

    const loadUserBalance = async () => {
        try {
            const response = await usersAPI.getProfile();
            const balance = parseFloat(response.data.user?.balance || 0);
            setUserBalance(balance);
        } catch (error) {
            console.error('Balance load error:', error);
            setUserBalance(0);
        }
    };

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode.trim()) return;

        try {
            const response = await couponsAPI.validate({
                code: couponCode,
                project_id: cart.items[0]?.project_id
            });

            if (response.data.valid) {
                const coupon = response.data;
                let discount = 0;
                if (coupon.discount_type === 'percentage') {
                    discount = (cart.total * coupon.discount_value) / 100;
                    if (coupon.max_amount) {
                        discount = Math.min(discount, coupon.max_amount);
                    }
                } else {
                    discount = coupon.discount_value;
                }
                setCouponDiscount(discount);
                setCouponApplied(true);
                // LocalStorage'a kaydet
                localStorage.setItem('checkout_coupon', JSON.stringify({
                    code: couponCode,
                    discount: discount
                }));

                // KDV'yi yeniden hesapla
                const subtotal = cart.total - discount;
                setTax(subtotal * 0.18);
            }
        } catch (error) {
            alert(error.response?.data?.error || t('checkout.coupon_invalid'));
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setCouponDiscount(0);
        setCouponApplied(false);
        localStorage.removeItem('checkout_coupon');
        const subtotal = cart.total;
        setTax(subtotal * 0.18);
    };

    const handleQuantityChange = async (id, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            await cartAPI.updateCartItem(id, { quantity: newQuantity });
            await loadCart();
            await reloadCartContext(); // CartContext'i güncelle
        } catch (error) {
            alert(t('checkout.quantity_update_failed'));
        }
    };

    const handleRemoveItem = async (id) => {
        if (!window.confirm(t('checkout.confirm_remove_item'))) {
            return;
        }
        try {
            await cartAPI.removeFromCart(id);
            await loadCart();
            await reloadCartContext(); // CartContext'i güncelle
        } catch (error) {
            alert(t('checkout.remove_item_failed'));
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            // Sepet adımı - devam et
            if (!cart || cart.items.length === 0) {
                alert(t('checkout.cart_empty'));
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Bilgiler adımı - validasyon
            if (!selectedAddressId && savedAddresses.length > 0) {
                alert(t('checkout.select_address'));
                return;
            }
            if (!selectedAddressId && savedAddresses.length === 0) {
                // Eğer hiç adres yoksa, yeni adres eklenmeli
                if (!newAddress.name || !newAddress.address_line1 || !newAddress.city || !newAddress.phone || !newAddress.country) {
                    alert(t('checkout.fill_address_info'));
                    return;
                }
            }
            // Billing info validasyonu - adres seçilmişse adresten alınır
            if (selectedAddressId) {
                const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
                if (!selectedAddress) {
                    alert(t('checkout.address_not_found'));
                    return;
                }
            }
            if (!termsAccepted) {
                alert(t('checkout.accept_terms'));
                return;
            }
            setCurrentStep(3);
        } else if (currentStep === 3) {
            // Ödeme adımı - ödeme işlemi
            handleProcessPayment();
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleAddAddress = async () => {
        try {
            if (!newAddress.name || !newAddress.address_line1 || !newAddress.city || !newAddress.phone || !newAddress.country) {
                alert(t('checkout.fill_required_fields'));
                return;
            }

            await userAddressesAPI.addAddress(newAddress);
            await loadSavedAddresses();
            setShowAddAddressModal(false);
            setNewAddress({
                type: 'home',
                name: '',
                address_line1: '',
                address_line2: '',
                city: '',
                district: '',
                postal_code: '',
                phone: '',
                country: 'Türkiye',
                is_default: false
            });
            alert(t('checkout.address_added'));
        } catch (error) {
            alert(error.response?.data?.error || t('checkout.address_add_failed'));
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm(t('checkout.confirm_delete_address'))) {
            return;
        }
        try {
            await userAddressesAPI.deleteAddress(id);
            await loadSavedAddresses();
            if (selectedAddressId === id) {
                setSelectedAddressId(null);
            }
        } catch (error) {
            alert(error.response?.data?.error || t('checkout.address_delete_failed'));
        }
    };

    const handleAddCard = async () => {
        try {
            if (!newCard.card_number || !newCard.card_holder || !newCard.expiry_date || !newCard.cvv) {
                alert(t('checkout.fill_card_info'));
                return;
            }

            if (newCard.save_card) {
                await userPaymentCardsAPI.addCard({
                    card_number: newCard.card_number,
                    card_holder: newCard.card_holder,
                    expiry_date: newCard.expiry_date,
                    cvv: newCard.cvv,
                    is_default: false
                });
                await loadSavedCards();
                // Yeni eklenen kartı seç
                const cardsResponse = await userPaymentCardsAPI.getCards();
                const latestCard = cardsResponse.data.cards?.[cardsResponse.data.cards.length - 1];
                if (latestCard) {
                    setSelectedCardId(latestCard.id);
                }
            } else {
                // Geçici kart bilgilerini kullan (newCard state'inde tutulacak)
                setSelectedCardId(null);
            }

            setShowAddCardModal(false);
            setNewCard({
                card_number: '',
                card_holder: '',
                expiry_date: '',
                cvv: '',
                save_card: false
            });

            if (newCard.save_card) {
                alert(t('checkout.card_saved'));
            }
        } catch (error) {
            alert(error.response?.data?.error || t('checkout.card_add_failed'));
        }
    };

    const handleDeleteCard = async (id) => {
        if (!window.confirm(t('checkout.confirm_delete_card'))) {
            return;
        }
        try {
            await userPaymentCardsAPI.deleteCard(id);
            await loadSavedCards();
            if (selectedCardId === id) {
                setSelectedCardId(null);
            }
        } catch (error) {
            alert(error.response?.data?.error || t('checkout.card_delete_failed'));
        }
    };

    // Kart numarası maskeleme
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    // Expiry date maskeleme (MM/YY)
    const formatExpiryDate = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    // CVV maskeleme (sadece sayılar)
    const formatCVV = (value) => {
        return value.replace(/[^0-9]/gi, '');
    };

    // Kart tipi tespit etme
    const getCardType = (cardNumber) => {
        const number = cardNumber.replace(/\s/g, '');
        if (/^4/.test(number)) return 'visa';
        if (/^5[1-5]/.test(number)) return 'mastercard';
        if (/^3[47]/.test(number)) return 'amex';
        if (/^6/.test(number)) return 'discover';
        return 'default';
    };

    const handleProcessPayment = async () => {
        setProcessing(true);
        try {
            // Billing info'yu hazırla
            let finalBillingInfo = { ...billingInfo };

            // Eğer adres seçilmişse, adres bilgilerini kullan
            if (selectedAddressId) {
                const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
                if (selectedAddress) {
                    finalBillingInfo = {
                        name: selectedAddress.name,
                        email: billingInfo.email || user?.email || '',
                        phone: selectedAddress.phone || billingInfo.phone || '',
                        address: selectedAddress.address_line1,
                        city: selectedAddress.city,
                        district: selectedAddress.district || '',
                        postal_code: selectedAddress.postal_code || '',
                        country: selectedAddress.country || 'Türkiye'
                    };
                }
            } else if (savedAddresses.length === 0) {
                // Eğer hiç adres yoksa, yeni adres bilgilerini kullan
                finalBillingInfo = {
                    name: newAddress.name,
                    email: billingInfo.email || user?.email || '',
                    phone: newAddress.phone,
                    address: newAddress.address_line1,
                    city: newAddress.city,
                    district: newAddress.district || '',
                    postal_code: newAddress.postal_code || '',
                    country: newAddress.country || 'Türkiye'
                };
            }

            // Validasyon
            if (!finalBillingInfo.name || !finalBillingInfo.email || !finalBillingInfo.address) {
                alert('Lütfen tüm zorunlu fatura bilgilerini doldurun');
                setProcessing(false);
                return;
            }

            // Sipariş oluştur
            const orderData = {
                billing_info: finalBillingInfo,
                coupon_code: couponApplied ? couponCode : null,
                payment_method: paymentMethod,
                customer_notes: customerNotes,
                card_id: paymentMethod === 'credit_card' ? selectedCardId : null
            };

            const orderResponse = await ordersAPI.createOrder(orderData);

            if (orderResponse.data.order) {
                const orderId = orderResponse.data.order.id;

                // Banka havalesi için ödeme işlemi yapma, direkt başarılı say
                if (paymentMethod === 'bank_transfer') {
                    setOrderResult({
                        order: orderResponse.data.order,
                        payment: null,
                        success: true
                    });
                    localStorage.removeItem('checkout_coupon'); // Kuponu temizle
                    await reloadCartContext(); // Sepet temizlendi, CartContext'i güncelle
                    setCurrentStep(4);
                } else {
                    // Diğer ödeme yöntemleri için ödeme işlemini başlat
                    try {
                        const paymentResponse = await paymentsAPI.processPayment({
                            order_id: orderId,
                            payment_method: paymentMethod,
                            payment_data: {
                                card_id: selectedCardId,
                                card_info: paymentMethod === 'credit_card' && !selectedCardId ? newCard : null,
                                paypal_email: paymentMethod === 'paypal' ? paypalDemo.email : undefined,
                                paypal_password: paymentMethod === 'paypal' ? paypalDemo.password : undefined,
                            }
                        });

                        if (paymentResponse.data.success) {
                            // Bakiye ile ödeme yapıldıysa bakiyeyi güncelle
                            if (paymentMethod === 'balance') {
                                await loadUserBalance();
                            }
                            
                            setOrderResult({
                                order: orderResponse.data.order,
                                payment: paymentResponse.data.transaction || paymentResponse.data.paymentResult,
                                success: true
                            });
                            localStorage.removeItem('checkout_coupon'); // Kuponu temizle
                            await reloadCartContext(); // Sepet temizlendi, CartContext'i güncelle
                            setCurrentStep(4);
                        } else {
                            setOrderResult({
                                order: orderResponse.data.order,
                                payment: null,
                                success: false
                            });
                            setCurrentStep(4);
                        }
                    } catch (paymentError) {
                        const payErr =
                            paymentError.response?.data?.error ||
                            paymentError.response?.data?.details;
                        if (payErr) alert(payErr);
                        setOrderResult({
                            order: orderResponse.data.order,
                            payment: null,
                            success: false,
                            error: payErr,
                        });
                        setCurrentStep(4);
                    }
                }
            }
        } catch (error) {
            console.error('Order creation error:', error);
            const msg =
                error.response?.data?.error ||
                error.response?.data?.details ||
                t('checkout.order_error');
            alert(msg);
        } finally {
            setProcessing(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(price);
    };

    const calculateTotals = () => {
        if (!cart) return { subtotal: 0, discount: 0, tax: 0, total: 0 };
        const subtotal = cart.total;
        const discount = couponDiscount;
        const afterDiscount = subtotal - discount;
        const calculatedTax = afterDiscount * 0.18; // %18 KDV
        const total = afterDiscount + calculatedTax;
        return { subtotal, discount, tax: calculatedTax, total };
    };

    const totals = calculateTotals();

    if (loading) {
        return (
            <div className="checkout-wizard-page">
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="checkout-wizard-page">
                <div className="container">
                    <div className="empty-cart-state">
                        <div className="empty-cart-icon-wrapper">
                            <div className="empty-cart-icon-bg"></div>
                            <FiShoppingCart className="empty-icon" />
                        </div>
                        <h2 className="empty-cart-title">{t('checkout.empty_cart')}</h2>
                        <p className="empty-cart-description">
                            {t('checkout.empty_cart_desc')}
                            <br />
                            {t('checkout.empty_cart_desc_2')}
                        </p>
                        <div className="empty-cart-actions">
                            <Link to="/projects" className="btn-empty-cart-primary">
                                <FiShoppingCart />
                                <span>{t('checkout.start_shopping')}</span>
                            </Link>
                            <Link to="/" className="btn-empty-cart-secondary">
                                {t('checkout.back_to_home')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`checkout-wizard-page${currentStep < 4 ? ' checkout-wizard-page--flow' : ''}`}>
            <div className="container">
                {/* Wizard Header */}
                <LayoutGroup id="checkout-wizard-steps">
                <div className="wizard-header">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                        <button type="button" className="step-trigger" onClick={() => setCurrentStep(1)}>
                            <span className="step-icon">
                                {currentStep === 1 && (
                                    <M.span
                                        layoutId="checkout-wizard-step-pill"
                                        className="wizard-step-layout-pill"
                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                                        aria-hidden
                                    />
                                )}
                                <FiShoppingCart />
                            </span>
                            <span className="step-label">{t('checkout.cart')}</span>
                        </button>
                    </div>
                    <div className="step-line">
                        <FiChevronRight />
                    </div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                        <button type="button" className="step-trigger" onClick={() => currentStep > 2 && setCurrentStep(2)}>
                            <span className="step-icon">
                                {currentStep === 2 && (
                                    <M.span
                                        layoutId="checkout-wizard-step-pill"
                                        className="wizard-step-layout-pill"
                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                                        aria-hidden
                                    />
                                )}
                                <FiMapPin />
                            </span>
                            <span className="step-label">{t('checkout.info')}</span>
                        </button>
                    </div>
                    <div className="step-line">
                        <FiChevronRight />
                    </div>
                    <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                        <button type="button" className="step-trigger" onClick={() => currentStep > 3 && setCurrentStep(3)}>
                            <span className="step-icon">
                                {currentStep === 3 && (
                                    <M.span
                                        layoutId="checkout-wizard-step-pill"
                                        className="wizard-step-layout-pill"
                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                                        aria-hidden
                                    />
                                )}
                                <FiCreditCard />
                            </span>
                            <span className="step-label">{t('checkout.payment')}</span>
                        </button>
                    </div>
                    <div className="step-line">
                        <FiChevronRight />
                    </div>
                    <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                        <button type="button" className="step-trigger" disabled>
                            <span className="step-icon">
                                {currentStep === 4 && (
                                    <M.span
                                        layoutId="checkout-wizard-step-pill"
                                        className="wizard-step-layout-pill"
                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                                        aria-hidden
                                    />
                                )}
                                <FiCheckCircle />
                            </span>
                            <span className="step-label">{t('checkout.confirm')}</span>
                        </button>
                    </div>
                </div>
                </LayoutGroup>

                {/* Wizard Content */}
                <div className="wizard-content">
                    <AnimatePresence mode="wait" initial={false}>
                    {/* Step 1: Cart */}
                    {currentStep === 1 && (
                        <M.div
                            key="wizard-step-1"
                            className="wizard-step-content"
                            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
                            transition={{ duration: 0.22, ease: motionEase }}
                        >
                            <div className="checkout-layout">
                                <div className="checkout-main">
                                    <div className="step-title-wrapper">
                                        <h5 className="step-title">
                                            <FiShoppingCart className="step-title-icon" />
                                            {t('checkout.my_cart')} ({cart.items.length} {cart.items.length === 1 ? t('checkout.product') : t('checkout.products')})
                                        </h5>
                                    </div>
                                    <ul className="cart-items-list">
                                        {cart.items.map(item => (
                                            <li key={item.id} className="cart-item-card">
                                                <div className="cart-item-content">
                                                    <div className="item-image-wrapper">
                                                        {item.image ? (
                                                            <img
                                                                src={getImageUrl(item.image)}
                                                                alt={item.title}
                                                                className="item-image"
                                                                onError={(e) => {
                                                                    e.target.src = '/img/default.svg';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="item-image-placeholder">
                                                                <FiShoppingCart />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="item-details">
                                                        <div className="item-title-row">
                                                            <h6>
                                                                <Link to={`/projects/${item.project_id}`}>
                                                                    {item.title}
                                                                </Link>
                                                            </h6>
                                                            <button
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="btn-remove-item"
                                                                title={t('checkout.remove')}
                                                            >
                                                                <FiX />
                                                            </button>
                                                        </div>
                                                        <div className="item-meta">
                                                            <span className="badge badge-success">{t('checkout.in_stock')}</span>
                                                        </div>
                                                        <div className="item-quantity-row">
                                                            <span className="text-muted">{t('checkout.quantity')}:</span>
                                                            <div className="quantity-controls">
                                                                <button
                                                                    onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                                                                    className="quantity-btn"
                                                                    disabled={!item.quantity || item.quantity <= 1}
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="quantity-value">{item.quantity || 1}</span>
                                                                <button
                                                                    onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                                                                    className="quantity-btn"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="item-price-section">
                                                        <div className="item-price">
                                                            {item.discount_price ? (
                                                                <>
                                                                    <span className="price-new">{formatPrice(item.discount_price)}</span>
                                                                    <span className="price-old">{formatPrice(item.price)}</span>
                                                                </>
                                                            ) : (
                                                                <span className="price-new">{formatPrice(item.price)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="checkout-sidebar">
                                    <div className="sidebar-section">
                                        <h6>{t('checkout.order_summary')}</h6>

                                        {/* Order Items */}
                                        <div className="order-items-summary">
                                            <h6 className="summary-subtitle">{t('checkout.products')}</h6>
                                            <div className="order-items-list">
                                                {cart.items.map(item => (
                                                    <div key={item.id} className="order-item-summary">
                                                        <div className="order-item-info">
                                                            <span className="order-item-name">{item.title}</span>
                                                            <span className="order-item-quantity">x{item.quantity || 1}</span>
                                                        </div>
                                                        <span className="order-item-price">
                                                            {formatPrice((item.discount_price || item.price) * (item.quantity || 1))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Coupon Section */}
                                        <div className="coupon-section">
                                            <h6 className="summary-subtitle">{t('checkout.coupon_code')}</h6>
                                            {!couponApplied ? (
                                                <form onSubmit={handleApplyCoupon} className="coupon-form">
                                                    <div className="input-group">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder={t('checkout.enter_coupon')}
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value)}
                                                        />
                                                        <button type="submit" className="btn btn-primary">
                                                            {t('checkout.apply')}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="coupon-applied">
                                                    <span className="coupon-code">{couponCode}</span>
                                                    <button onClick={handleRemoveCoupon} className="btn-remove-coupon">
                                                        <FiX />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Price Details */}
                                        <div className="price-summary">
                                            <h6 className="summary-subtitle">{t('checkout.price_details')}</h6>
                                            <dl className="price-details">
                                                <div className="price-row">
                                                    <dt>{t('checkout.subtotal')}</dt>
                                                    <dd>{formatPrice(totals.subtotal)}</dd>
                                                </div>
                                                {totals.discount > 0 && (
                                                    <div className="price-row discount">
                                                        <dt>{t('checkout.total_discount')}</dt>
                                                        <dd className="text-success">-{formatPrice(totals.discount)}</dd>
                                                    </div>
                                                )}
                                                <div className="price-row">
                                                    <dt>{t('checkout.tax')} (%18)</dt>
                                                    <dd>{formatPrice(totals.tax)}</dd>
                                                </div>
                                                <div className="price-row total">
                                                    <dt>{t('checkout.total')}</dt>
                                                    <dd>{formatPrice(totals.total)}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>

                                    <div className="d-grid">
                                        <button
                                            className="btn btn-primary btn-next"
                                            onClick={handleNextStep}
                                        >
                                            {t('checkout.continue')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </M.div>
                    )}

                    {/* Step 2: Address */}
                    {currentStep === 2 && (
                        <M.div
                            key="wizard-step-2"
                            className="wizard-step-content"
                            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
                            transition={{ duration: 0.22, ease: motionEase }}
                        >
                            <div className="checkout-layout">
                                <div className="checkout-main">
                                    <div className="step-title-wrapper">
                                        <h5 className="step-title">
                                            <FiMapPin className="step-title-icon" />
                                            {t('checkout.billing_info')}
                                        </h5>
                                    </div>

                                    {/* Saved Addresses */}
                                    {savedAddresses.length > 0 && (
                                        <div className="saved-addresses-section">
                                            <h6 className="section-subtitle">{t('checkout.saved_addresses')}</h6>
                                            <div className="addresses-grid">
                                                {savedAddresses.map(address => (
                                                    <div key={address.id} className="address-item-wrapper">
                                                        <div
                                                            className={`address-card-modern ${selectedAddressId === address.id ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setSelectedAddressId(address.id);
                                                                setBillingInfo({
                                                                    ...billingInfo,
                                                                    name: address.name,
                                                                    phone: address.phone || billingInfo.phone,
                                                                    address: address.address_line1,
                                                                    city: address.city,
                                                                    district: address.district || '',
                                                                    postal_code: address.postal_code || '',
                                                                    country: address.country || 'Türkiye'
                                                                });
                                                            }}
                                                        >
                                                            <div className="address-card-header">
                                                                <div className="address-radio">
                                                                    <input
                                                                        type="radio"
                                                                        name="selected_address"
                                                                        checked={selectedAddressId === address.id}
                                                                        onChange={() => setSelectedAddressId(address.id)}
                                                                    />
                                                                </div>
                                                                <div className="address-info">
                                                                    <div className="address-name-row">
                                                                        <h6 className="address-name">{address.name}</h6>
                                                                        <div className="address-badges">
                                                                            <span className={`badge badge-${address.type}`}>
                                                                                {address.type === 'home' ? `🏠 ${t('checkout.home')}` : address.type === 'work' ? `💼 ${t('checkout.work')}` : `📍 ${t('checkout.other')}`}
                                                                            </span>
                                                                            {address.is_default && (
                                                                                <span className="badge badge-default">⭐ {t('checkout.default')}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="address-details">
                                                                        <div className="address-line-item">
                                                                            <span className="address-label">{t('checkout.address')}:</span>
                                                                            <span className="address-value">{address.address_line1}</span>
                                                                        </div>
                                                                        {address.address_line2 && (
                                                                            <div className="address-line-item">
                                                                                <span className="address-value">{address.address_line2}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="address-line-item">
                                                                            <span className="address-label">{t('checkout.city_district')}:</span>
                                                                            <span className="address-value">
                                                                                {address.district && `${address.district}, `}
                                                                                {address.city}
                                                                            </span>
                                                                        </div>
                                                                        {address.postal_code && (
                                                                            <div className="address-line-item">
                                                                                <span className="address-label">{t('checkout.postal_code')}:</span>
                                                                                <span className="address-value">{address.postal_code}</span>
                                                                            </div>
                                                                        )}
                                                                        {address.phone && (
                                                                            <div className="address-line-item">
                                                                                <span className="address-label">{t('checkout.phone')}:</span>
                                                                                <span className="address-value">{address.phone}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteAddress(address.id);
                                                                    }}
                                                                    className="address-delete-btn"
                                                                    title={t('checkout.delete_address')}
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add New Address Button */}
                                    <div className="add-address-section">
                                        <button
                                            type="button"
                                            className="btn-add-address"
                                            onClick={() => setShowAddAddressModal(true)}
                                        >
                                            <FiPlus /> {t('checkout.add_new_address')}
                                        </button>
                                    </div>

                                    {/* Customer Notes */}
                                    <div className="notes-section">
                                        <label className="form-label" htmlFor="customerNotes">
                                            {t('checkout.order_notes')}
                                        </label>
                                        <textarea
                                            className="form-control"
                                            id="customerNotes"
                                            rows="3"
                                            placeholder={t('checkout.order_notes_placeholder')}
                                            value={customerNotes}
                                            onChange={(e) => setCustomerNotes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="checkout-sidebar">
                                    <div className="sidebar-section">
                                        <h6>{t('checkout.order_summary')}</h6>

                                        {/* Order Items */}
                                        <div className="order-items-summary">
                                            <h6 className="summary-subtitle">{t('checkout.products')}</h6>
                                            <div className="order-items-list">
                                                {cart.items.map(item => (
                                                    <div key={item.id} className="order-item-summary">
                                                        <div className="order-item-info">
                                                            <span className="order-item-name">{item.title}</span>
                                                            <span className="order-item-quantity">x{item.quantity || 1}</span>
                                                        </div>
                                                        <span className="order-item-price">
                                                            {formatPrice((item.discount_price || item.price) * (item.quantity || 1))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Price Details */}
                                        <div className="price-summary">
                                            <h6 className="summary-subtitle">{t('checkout.price_details')}</h6>
                                            <dl className="price-details">
                                                <div className="price-row">
                                                    <dt>{t('checkout.subtotal')}</dt>
                                                    <dd>{formatPrice(totals.subtotal)}</dd>
                                                </div>
                                                {totals.discount > 0 && (
                                                    <div className="price-row discount">
                                                        <dt>{t('checkout.total_discount')}</dt>
                                                        <dd className="text-success">-{formatPrice(totals.discount)}</dd>
                                                    </div>
                                                )}
                                                <div className="price-row">
                                                    <dt>{t('checkout.tax')} (%18)</dt>
                                                    <dd>{formatPrice(totals.tax)}</dd>
                                                </div>
                                                <div className="price-row total">
                                                    <dt>{t('checkout.total')}</dt>
                                                    <dd>{formatPrice(totals.total)}</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        {/* Billing Info Summary */}
                                        {(selectedAddressId || billingInfo.name) && (
                                            <div className="billing-info-summary">
                                                <h6 className="summary-subtitle">{t('checkout.billing_info_uppercase')}</h6>
                                                <div className="billing-info-content">
                                                    {selectedAddressId ? (
                                                        (() => {
                                                            const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
                                                            return selectedAddress ? (
                                                                <>
                                                                    <div className="billing-info-item">
                                                                        <span className="billing-label">{t('checkout.full_name')}:</span>
                                                                        <span className="billing-value">{selectedAddress.name}</span>
                                                                    </div>
                                                                    <div className="billing-info-item">
                                                                        <span className="billing-label">{t('checkout.email')}:</span>
                                                                        <span className="billing-value">{billingInfo.email || user?.email || '-'}</span>
                                                                    </div>
                                                                    {selectedAddress.phone && (
                                                                        <div className="billing-info-item">
                                                                            <span className="billing-label">{t('checkout.phone')}:</span>
                                                                            <span className="billing-value">{selectedAddress.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="billing-info-item">
                                                                        <span className="billing-label">{t('checkout.address')}:</span>
                                                                        <span className="billing-value">{selectedAddress.address_line1}</span>
                                                                    </div>
                                                                    {selectedAddress.address_line2 && (
                                                                        <div className="billing-info-item">
                                                                            <span className="billing-value">{selectedAddress.address_line2}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="billing-info-item">
                                                                        <span className="billing-label">{t('checkout.city_district')}:</span>
                                                                        <span className="billing-value">
                                                                            {selectedAddress.district && `${selectedAddress.district}, `}
                                                                            {selectedAddress.city}
                                                                        </span>
                                                                    </div>
                                                                    {selectedAddress.postal_code && (
                                                                        <div className="billing-info-item">
                                                                            <span className="billing-label">{t('checkout.postal_code')}:</span>
                                                                            <span className="billing-value">{selectedAddress.postal_code}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : null;
                                                        })()
                                                    ) : (
                                                        <>
                                                            {billingInfo.name && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Ad Soyad:</span>
                                                                    <span className="billing-value">{billingInfo.name}</span>
                                                                </div>
                                                            )}
                                                            {billingInfo.email && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">E-posta:</span>
                                                                    <span className="billing-value">{billingInfo.email}</span>
                                                                </div>
                                                            )}
                                                            {billingInfo.phone && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Telefon:</span>
                                                                    <span className="billing-value">{billingInfo.phone}</span>
                                                                </div>
                                                            )}
                                                            {billingInfo.address && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Adres:</span>
                                                                    <span className="billing-value">{billingInfo.address}</span>
                                                                </div>
                                                            )}
                                                            {billingInfo.city && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Şehir/İlçe:</span>
                                                                    <span className="billing-value">
                                                                        {billingInfo.district && `${billingInfo.district}, `}
                                                                        {billingInfo.city}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {billingInfo.postal_code && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Posta Kodu:</span>
                                                                    <span className="billing-value">{billingInfo.postal_code}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Terms */}
                                    <div className="terms-section-sidebar">
                                        <label className="terms-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                required
                                            />
                                            <span>
                                                <Link to="/page/kullanim-kosullari" target="_blank">{t('checkout.terms')}</Link> {t('checkout.and')}
                                                <Link to="/page/gizlilik-politikasi" target="_blank"> {t('checkout.privacy_policy')}</Link> {t('checkout.terms_accept')} <span className="text-danger">*</span>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button
                                            className="btn btn-primary btn-next"
                                            onClick={handleNextStep}
                                        >
                                            {t('checkout.continue')}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-label-secondary"
                                            onClick={handlePreviousStep}
                                        >
                                            <FiChevronRight style={{ transform: 'rotate(180deg)' }} /> {t('checkout.back')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </M.div>
                    )}

                    {/* Step 3: Payment */}
                    {currentStep === 3 && (
                        <M.div
                            key="wizard-step-3"
                            className="wizard-step-content wizard-step-payment"
                            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
                            transition={{ duration: 0.22, ease: motionEase }}
                        >
                            <div className="checkout-layout">
                                <div className="checkout-main">
                                    <div className="step-title-wrapper">
                                        <h5 className="step-title">
                                            <FiCreditCard className="step-title-icon" />
                                            {t('checkout.payment_method')}
                                        </h5>
                                    </div>

                                    {/* Payment Tabs — API'den aktif yöntemler */}
                                    <div className="payment-methods-tabs">
                                        {checkoutPaymentMethods.includes('credit_card') && (
                                            <button
                                                type="button"
                                                className={`payment-method-tab ${paymentMethod === 'credit_card' ? 'active' : ''}`}
                                                onClick={() => setPaymentMethod('credit_card')}
                                            >
                                                <FiCreditCard className="tab-icon" />
                                                <span>{t('checkout.credit_card')}</span>
                                            </button>
                                        )}
                                        {checkoutPaymentMethods.includes('paypal') && (
                                            <button
                                                type="button"
                                                className={`payment-method-tab ${paymentMethod === 'paypal' ? 'active' : ''}`}
                                                onClick={() => setPaymentMethod('paypal')}
                                            >
                                                <span className="tab-icon">💳</span>
                                                <span>{t('checkout.paypal')}</span>
                                            </button>
                                        )}
                                        {checkoutPaymentMethods.includes('bank_transfer') && (
                                            <button
                                                type="button"
                                                className={`payment-method-tab ${paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                                                onClick={() => setPaymentMethod('bank_transfer')}
                                            >
                                                <span className="tab-icon">🏦</span>
                                                <span>{t('checkout.bank_transfer')}</span>
                                            </button>
                                        )}
                                        {checkoutPaymentMethods.includes('balance') && (
                                            <button
                                                type="button"
                                                className={`payment-method-tab ${paymentMethod === 'balance' ? 'active' : ''} ${userBalance < totals.total ? 'disabled' : ''}`}
                                                onClick={() => {
                                                    if (userBalance >= totals.total) {
                                                        setPaymentMethod('balance');
                                                    }
                                                }}
                                                disabled={userBalance < totals.total}
                                                title={userBalance < totals.total ? `${t('checkout.insufficient_balance')} (${formatPrice(userBalance)} / ${formatPrice(totals.total)})` : ''}
                                            >
                                                <span className="tab-icon">💰</span>
                                                {userBalance >= totals.total ? (
                                                    <span>
                                                        <span>{t('checkout.balance')}</span>
                                                        <span className="balance-amount">{formatPrice(userBalance)}</span>
                                                    </span>
                                                ) : (
                                                    <span>
                                                        <span>{t('checkout.balance')}</span>
                                                        <span className="balance-amount insufficient">{formatPrice(userBalance)}</span>
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {paymentDemoMode && (
                                        <div className="payment-demo-hint-box">
                                            <p className="payment-demo-hint">
                                                {t('checkout.payment_demo_hint', 'Demo mod: gercek tahsilat yapilmaz. Asagidaki test bilgileri otomatik dolduruldu.')}
                                            </p>
                                            {demoHints && paymentMethod === 'credit_card' && (
                                                <p className="payment-demo-credentials">
                                                    <strong>Test kart:</strong> {demoHints.card_number} · SKT {demoHints.expiry} · CVV {demoHints.cvv}
                                                </p>
                                            )}
                                            {demoHints && paymentMethod === 'paypal' && (
                                                <p className="payment-demo-credentials">
                                                    <strong>Demo PayPal:</strong> {demoHints.paypal_email} / {demoHints.paypal_password}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="tab-content">
                                        {/* Credit Card */}
                                        {paymentMethod === 'credit_card' && (
                                            <div className="payment-tab-content">
                                                {/* Saved Cards */}
                                                {savedCards.length > 0 && (
                                                    <div className="saved-cards-section">
                                                        <h6 className="section-subtitle">{t('checkout.saved_cards')}</h6>
                                                        <div className="cards-grid">
                                                            {savedCards.map(card => (
                                                                <div key={card.id} className="card-item-wrapper">
                                                                    <div
                                                                        className={`payment-card-modern ${selectedCardId === card.id ? 'selected' : ''}`}
                                                                        onClick={() => setSelectedCardId(card.id)}
                                                                    >
                                                                        <div className="payment-card-header">
                                                                            <div className="card-radio">
                                                                                <input
                                                                                    type="radio"
                                                                                    name="selected_card"
                                                                                    checked={selectedCardId === card.id}
                                                                                    onChange={() => setSelectedCardId(card.id)}
                                                                                />
                                                                            </div>
                                                                            <div className="card-info">
                                                                                <div className="card-name-row">
                                                                                    <h6 className="card-holder-name">{card.card_holder}</h6>
                                                                                    <div className="card-badges">
                                                                                        <span className="badge badge-card-type">{card.card_type}</span>
                                                                                        {card.is_default && (
                                                                                            <span className="badge badge-default">⭐ {t('checkout.default')}</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="card-details">
                                                                                    <div className="card-line-item">
                                                                                        <span className="card-label">{t('checkout.card_number')}:</span>
                                                                                        <span className="card-value">{card.masked_number}</span>
                                                                                    </div>
                                                                                    <div className="card-line-item">
                                                                                        <span className="card-label">{t('checkout.expiry_date')}:</span>
                                                                                        <span className="card-value">{card.expiry_date}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="card-actions">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteCard(card.id);
                                                                                }}
                                                                                className="card-delete-btn"
                                                                                title={t('checkout.delete_card')}
                                                                            >
                                                                                <FiTrash2 />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Add New Card Button */}
                                                <div className="add-card-section">
                                                    <button
                                                        type="button"
                                                        className="btn-add-card"
                                                        onClick={() => setShowAddCardModal(true)}
                                                    >
                                                        <FiPlus /> {t('checkout.add_new_card')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* PayPal */}
                                        {paymentMethod === 'paypal' && (
                                            <div className="payment-tab-content">
                                                <div className="alert alert-info">
                                                    <h6>{t('checkout.paypal_payment')}</h6>
                                                    <p className="mb-2">{t('checkout.paypal_secure_payment')}</p>
                                                    <div className="mb-3">
                                                        <strong>{t('checkout.paypal_commission')}: %4</strong>
                                                        <br />
                                                        <small className="text-muted">
                                                            {t('checkout.total_amount')}: {formatPrice(totals.total)} + %4 {t('checkout.commission')} = {formatPrice(totals.total * 1.04)}
                                                        </small>
                                                    </div>
                                                </div>
                                                {paymentDemoMode ? (
                                                    <div className="paypal-demo-fields">
                                                        <div className="form-group">
                                                            <label>PayPal E-posta (demo)</label>
                                                            <input
                                                                type="email"
                                                                className="form-control"
                                                                value={paypalDemo.email}
                                                                onChange={(e) => setPaypalDemo({ ...paypalDemo, email: e.target.value })}
                                                                autoComplete="username"
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>PayPal Sifre (demo)</label>
                                                            <input
                                                                type="password"
                                                                className="form-control"
                                                                value={paypalDemo.password}
                                                                onChange={(e) => setPaypalDemo({ ...paypalDemo, password: e.target.value })}
                                                                autoComplete="current-password"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-muted">{t('checkout.paypal_click_button')}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Bank Transfer */}
                                        {paymentMethod === 'bank_transfer' && (
                                            <div className="payment-tab-content">
                                                <div className="alert alert-info">
                                                    <h6>{t('checkout.bank_account_info')}</h6>
                                                    <p className="mb-2">{t('checkout.bank_transfer_info')}</p>
                                                    {bankAccounts.length > 0 ? (
                                                        bankAccounts.map((account, index) => (
                                                            <div key={account.id} className="bank-account-item" style={{ marginBottom: index < bankAccounts.length - 1 ? '1.5rem' : '0' }}>
                                                                <ul className="list-unstyled mb-0">
                                                                    <li><strong>{t('checkout.bank')}:</strong> {account.bank_name}</li>
                                                                    <li><strong>{t('checkout.iban')}:</strong> {account.iban}</li>
                                                                    <li><strong>{t('checkout.account_holder')}:</strong> {account.account_holder}</li>
                                                                    {account.account_number && (
                                                                        <li><strong>{t('checkout.account_number')}:</strong> {account.account_number}</li>
                                                                    )}
                                                                    {account.branch_name && (
                                                                        <li><strong>{t('checkout.branch') || 'Şube'}:</strong> {account.branch_name}</li>
                                                                    )}
                                                                    {account.swift_code && (
                                                                        <li><strong>SWIFT:</strong> {account.swift_code}</li>
                                                                    )}
                                                                    <li><strong>{t('checkout.description')}:</strong> {t('checkout.order_number')}: ({t('checkout.order_number_shown_after')})</li>
                                                                </ul>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <ul className="list-unstyled mb-0">
                                                            <li><strong>{t('checkout.bank')}:</strong> Örnek Bank</li>
                                                            <li><strong>{t('checkout.iban')}:</strong> TR12 3456 7890 1234 5678 9012 34</li>
                                                            <li><strong>{t('checkout.account_holder')}:</strong> TeknoProje A.Ş.</li>
                                                            <li><strong>{t('checkout.description')}:</strong> {t('checkout.order_number')}: ({t('checkout.order_number_shown_after')})</li>
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="alert alert-warning">
                                                    <h6><FiCheckCircle className="me-2" />{t('checkout.important_info')}</h6>
                                                    <p className="mb-0">{t('checkout.bank_transfer_note')}</p>
                                                </div>
                                                <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                                                    <p className="mb-0">
                                                        <strong>{t('checkout.payment_after_order') || 'Önemli:'}</strong> {t('checkout.payment_after_order_desc') || 'Siparişinizi tamamladıktan sonra "Siparişlerim" sayfasından ödeme bildirimi yapabilirsiniz.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Balance */}
                                        {paymentMethod === 'balance' && (
                                            <div className="payment-tab-content">
                                                {userBalance >= totals.total ? (
                                                    <div className="alert alert-success">
                                                        <div className="balance-payment-header">
                                                            <h6>
                                                                <span className="balance-icon">✅</span>
                                                                {t('checkout.balance_payment') || 'Bakiye ile Ödeme'}
                                                            </h6>
                                                        </div>
                                                        <p className="mb-3">{t('checkout.pay_with_balance') || 'Bakiyenizden ödeme yapabilirsiniz'}</p>
                                                        <div className="balance-details">
                                                            <div className="balance-row">
                                                                <span className="balance-label">{t('checkout.current_balance')}:</span>
                                                                <span className="balance-value success">{formatPrice(userBalance)}</span>
                                                            </div>
                                                            <div className="balance-row">
                                                                <span className="balance-label">{t('checkout.order_amount')}:</span>
                                                                <span className="balance-value">{formatPrice(totals.total)}</span>
                                                            </div>
                                                            <div className="balance-divider"></div>
                                                            <div className="balance-row total">
                                                                <span className="balance-label">{t('checkout.remaining_balance')}:</span>
                                                                <span className="balance-value success">{formatPrice(userBalance - totals.total)}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-success mt-3 mb-0">
                                                            <strong>✓ {t('checkout.balance_sufficient') || 'Bakiyeniz yeterli'}</strong>
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="alert alert-warning">
                                                        <div className="balance-payment-header">
                                                            <h6>
                                                                <span className="balance-icon">⚠️</span>
                                                                {t('checkout.insufficient_balance')}
                                                            </h6>
                                                        </div>
                                                        <p className="mb-3">{t('checkout.balance_insufficient_message') || 'Bakiyeniz bu sipariş için yeterli değil. Lütfen bakiyenize para yükleyin.'}</p>
                                                        <div className="balance-details">
                                                            <div className="balance-row">
                                                                <span className="balance-label">{t('checkout.current_balance')}:</span>
                                                                <span className="balance-value insufficient">{formatPrice(userBalance)}</span>
                                                            </div>
                                                            <div className="balance-row">
                                                                <span className="balance-label">{t('checkout.order_amount')}:</span>
                                                                <span className="balance-value">{formatPrice(totals.total)}</span>
                                                            </div>
                                                            <div className="balance-divider"></div>
                                                            <div className="balance-row total">
                                                                <span className="balance-label">{t('checkout.insufficient_amount') || 'Eksik Tutar'}:</span>
                                                                <span className="balance-value insufficient">{formatPrice(totals.total - userBalance)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3">
                                                            <Link to="/user/wallet" className="btn btn-primary btn-sm">
                                                                💰 {t('checkout.add_balance') || 'Bakiye Yükle'}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                </div>

                                <div className="checkout-sidebar">
                                    <div className="sidebar-section">
                                        <h6>{t('checkout.order_summary')}</h6>

                                        {/* Order Items */}
                                        <div className="order-items-summary">
                                            <h6 className="summary-subtitle">{t('checkout.products')}</h6>
                                            <div className="order-items-list">
                                                {cart.items.map(item => (
                                                    <div key={item.id} className="order-item-summary">
                                                        <div className="order-item-info">
                                                            <span className="order-item-name">{item.title}</span>
                                                            <span className="order-item-quantity">x{item.quantity || 1}</span>
                                                        </div>
                                                        <span className="order-item-price">
                                                            {formatPrice((item.discount_price || item.price) * (item.quantity || 1))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Price Details */}
                                        <div className="price-summary">
                                            <h6 className="summary-subtitle">{t('checkout.price_details')}</h6>
                                            <dl className="price-details">
                                                <div className="price-row">
                                                    <dt>{t('checkout.subtotal')}</dt>
                                                    <dd>{formatPrice(totals.subtotal)}</dd>
                                                </div>
                                                {totals.discount > 0 && (
                                                    <div className="price-row discount">
                                                        <dt>{t('checkout.total_discount')}</dt>
                                                        <dd className="text-success">-{formatPrice(totals.discount)}</dd>
                                                    </div>
                                                )}
                                                <div className="price-row">
                                                    <dt>{t('checkout.tax')} (%18)</dt>
                                                    <dd>{formatPrice(totals.tax)}</dd>
                                                </div>
                                                <div className="price-row total">
                                                    <dt>{t('checkout.total')}</dt>
                                                    <dd>{formatPrice(totals.total)}</dd>
                                                </div>
                                            </dl>
                                        </div>

                                        {/* Billing Info Summary */}
                                        {(selectedAddressId || billingInfo.name) && (
                                            <div className="billing-info-summary">
                                                <h6 className="summary-subtitle">{t('checkout.billing_info_uppercase')}</h6>
                                                <div className="billing-info-content">
                                                    {selectedAddressId ? (
                                                        (() => {
                                                            const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
                                                            return selectedAddress ? (
                                                                <>
                                                                    <div className="billing-info-item">
                                                                        <span className="billing-label">{t('checkout.full_name')}:</span>
                                                                        <span className="billing-value">{selectedAddress.name}</span>
                                                                    </div>
                                                                    <div className="billing-info-item">
                                                                        <span className="billing-label">{t('checkout.email')}:</span>
                                                                        <span className="billing-value">{billingInfo.email || user?.email || '-'}</span>
                                                                    </div>
                                                                    {selectedAddress.phone && (
                                                                        <div className="billing-info-item">
                                                                            <span className="billing-label">{t('checkout.phone')}:</span>
                                                                            <span className="billing-value">{selectedAddress.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="billing-info-item">
                                                                        <span className="billing-label">{t('checkout.address')}:</span>
                                                                        <span className="billing-value">{selectedAddress.address_line1}</span>
                                                                    </div>
                                                                    {selectedAddress.address_line2 && (
                                                                        <div className="billing-info-item">
                                                                            <span className="billing-value">{selectedAddress.address_line2}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="billing-info-item">
                                                                        <span className="billing-label">{t('checkout.city_district')}:</span>
                                                                        <span className="billing-value">
                                                                            {selectedAddress.district && `${selectedAddress.district}, `}
                                                                            {selectedAddress.city}
                                                                        </span>
                                                                    </div>
                                                                    {selectedAddress.postal_code && (
                                                                        <div className="billing-info-item">
                                                                            <span className="billing-label">{t('checkout.postal_code')}:</span>
                                                                            <span className="billing-value">{selectedAddress.postal_code}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : null;
                                                        })()
                                                    ) : (
                                                        <>
                                                            {billingInfo.name && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Ad Soyad:</span>
                                                                    <span className="billing-value">{billingInfo.name}</span>
                                                                </div>
                                                            )}
                                                            {billingInfo.email && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">E-posta:</span>
                                                                    <span className="billing-value">{billingInfo.email}</span>
                                                                </div>
                                                            )}
                                                            {billingInfo.phone && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Telefon:</span>
                                                                    <span className="billing-value">{billingInfo.phone}</span>
                                                                </div>
                                                            )}
                                                            {billingInfo.address && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Adres:</span>
                                                                    <span className="billing-value">{billingInfo.address}</span>
                                                                </div>
                                                            )}
                                                            {billingInfo.city && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Şehir/İlçe:</span>
                                                                    <span className="billing-value">
                                                                        {billingInfo.district && `${billingInfo.district}, `}
                                                                        {billingInfo.city}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {billingInfo.postal_code && (
                                                                <div className="billing-info-item">
                                                                    <span className="billing-label">Posta Kodu:</span>
                                                                    <span className="billing-value">{billingInfo.postal_code}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Info Summary */}
                                        <div className="payment-info-summary">
                                            <h6 className="summary-subtitle">{t('checkout.payment_info')}</h6>
                                            <div className="payment-info-content">
                                                <div className="payment-info-item">
                                                    <span className="payment-label">{t('checkout.payment_method')}:</span>
                                                    <span className="payment-value">
                                                        {paymentMethod === 'credit_card' && `💳 ${t('checkout.credit_card')}`}
                                                        {paymentMethod === 'paypal' && `💳 ${t('checkout.paypal')}`}
                                                        {paymentMethod === 'bank_transfer' && `🏦 ${t('checkout.bank_transfer')}`}
                                                        {paymentMethod === 'balance' && `💰 ${t('checkout.balance')} (${formatPrice(userBalance)})`}
                                                    </span>
                                                </div>
                                                {paymentMethod === 'credit_card' && selectedCardId && (
                                                    (() => {
                                                        const selectedCard = savedCards.find(card => card.id === selectedCardId);
                                                        return selectedCard ? (
                                                            <>
                                                                <div className="payment-info-item">
                                                                    <span className="payment-label">{t('checkout.card_holder')}:</span>
                                                                    <span className="payment-value">{selectedCard.card_holder}</span>
                                                                </div>
                                                                <div className="payment-info-item">
                                                                    <span className="payment-label">{t('checkout.card_number')}:</span>
                                                                    <span className="payment-value">{selectedCard.masked_number}</span>
                                                                </div>
                                                                <div className="payment-info-item">
                                                                    <span className="payment-label">{t('checkout.expiry_date')}:</span>
                                                                    <span className="payment-value">{selectedCard.expiry_date}</span>
                                                                </div>
                                                                <div className="payment-info-item">
                                                                    <span className="payment-label">{t('checkout.card_type')}:</span>
                                                                    <span className="payment-value">{selectedCard.card_type}</span>
                                                                </div>
                                                            </>
                                                        ) : null;
                                                    })()
                                                )}
                                                {paymentMethod === 'credit_card' && !selectedCardId && (
                                                    <div className="payment-info-item">
                                                        <span className="payment-value" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            {t('checkout.new_card_info')}
                                                        </span>
                                                    </div>
                                                )}
                                                {paymentMethod === 'paypal' && (
                                                    <div className="payment-info-item">
                                                        <span className="payment-value" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            {t('checkout.paypal_will_pay')}
                                                        </span>
                                                    </div>
                                                )}
                                                {paymentMethod === 'bank_transfer' && (
                                                    <div className="payment-info-item">
                                                        <span className="payment-value" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            {t('checkout.bank_transfer_will_pay')}
                                                        </span>
                                                    </div>
                                                )}
                                                {paymentMethod === 'balance' && (
                                                    <div className="payment-info-item">
                                                        <span className="payment-label">{t('checkout.balance_to_use')}:</span>
                                                        <span className="payment-value">{formatPrice(totals.total)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Terms */}
                                        <div className="terms-section-sidebar">
                                            <label className="terms-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={termsAccepted}
                                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                                    required
                                                />
                                                <span>
                                                    <Link to="/page/kullanim-kosullari" target="_blank">{t('checkout.terms')}</Link> {t('checkout.and')}
                                                    <Link to="/page/gizlilik-politikasi" target="_blank"> {t('checkout.privacy_policy')}</Link> {t('checkout.terms_accept')} <span className="text-danger">*</span>
                                                </span>
                                            </label>
                                        </div>

                                        <div className="d-grid gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleProcessPayment}
                                                disabled={processing || (paymentMethod === 'balance' && userBalance < totals.total) || !termsAccepted}
                                            >
                                                {processing ? t('checkout.processing') : t('checkout.complete_payment')}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-label-secondary"
                                                onClick={handlePreviousStep}
                                            >
                                                <FiChevronRight style={{ transform: 'rotate(180deg)' }} /> {t('checkout.back')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </M.div>
                    )}

                    {/* Step 4: Confirmation */}
                    {currentStep === 4 && orderResult && (
                        <M.div
                            key="wizard-step-4"
                            className="wizard-step-content"
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.24, ease: motionEase }}
                        >
                            <div className="row">
                                <div className="col-12 col-lg-10 mx-auto">
                                    <div className="confirmation-content">
                                        <div className="confirmation-icon">
                                            <FiCheckCircle />
                                        </div>
                                        <h4>{t('checkout.thank_you')} 😇</h4>
                                        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary, #6b7280)', marginBottom: '2rem' }}>
                                            {t('checkout.order_created_1')}{' '}
                                            <Link to={`/orders/${orderResult.order.id}`} className="text-primary" style={{ fontWeight: 700, textDecoration: 'none' }}>
                                                #{orderResult.order.order_number}
                                            </Link>{' '}
                                            {t('checkout.order_created_2')}
                                        </p>

                                        {/* Order Status */}
                                        <div className="confirmation-status-cards">
                                            <div className="confirmation-status-card">
                                                <h6>{t('checkout.order_status')}</h6>
                                                <span className={`confirmation-status-badge ${orderResult.order.order_status === 'pending' ? 'bg-label-primary' : orderResult.order.order_status === 'processing' ? 'bg-label-info' : 'bg-label-success'}`}>
                                                    {orderResult.order.order_status === 'pending' ? t('checkout.pending') :
                                                        orderResult.order.order_status === 'processing' ? t('checkout.processing_status') :
                                                            orderResult.order.order_status === 'completed' ? t('checkout.completed') : t('checkout.pending')}
                                                </span>
                                            </div>
                                            <div className="confirmation-status-card">
                                                <h6>{t('checkout.payment_status')}</h6>
                                                <span className={`confirmation-status-badge ${orderResult.payment?.status === 'completed' || orderResult.success ? 'bg-label-success' : 'bg-label-warning'}`}>
                                                    {orderResult.payment?.status === 'completed' || orderResult.success ? t('checkout.paid') : t('checkout.pending')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Payment Notification */}
                                        {!orderResult.success && (
                                            <div className="alert alert-info" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                                                <h6><FiCheckCircle className="me-2" />{t('checkout.payment_notification')}</h6>
                                                <p className="mb-0">
                                                    {orderResult.error || t('checkout.payment_complete_note')}
                                                </p>
                                            </div>
                                        )}

                                        <div style={{ maxWidth: '600px', margin: '2rem auto 0' }}>
                                            <p style={{ fontSize: '1rem', color: 'var(--text-secondary, #6b7280)', lineHeight: '1.8' }}>
                                                {t('checkout.email_sent_1')} <strong style={{ color: 'var(--text-color, #1a1a1a)' }}>{billingInfo.email}</strong> {t('checkout.email_sent_2')}
                                                {t('checkout.email_check_spam')}
                                            </p>
                                            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary, #6b7280)', marginTop: '1rem' }}>
                                                <FiCheckCircle className="me-1" style={{ color: '#10b981' }} />
                                                <span className="fw-medium">{t('checkout.order_time')}:</span>{' '}
                                                {new Date().toLocaleString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>

                                        <div className="mt-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <Link to={`/orders/${orderResult.order.id}`} className="btn btn-primary" style={{ minWidth: '200px' }}>
                                                <FiCheckCircle className="me-2" />
                                                {t('checkout.view_order_details')}
                                            </Link>
                                            <Link to="/user/orders" className="btn btn-outline" style={{ minWidth: '200px' }}>
                                                {t('checkout.back_to_orders')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </M.div>
                    )}

                    </AnimatePresence>

                    {/* Add Address Modal */}
                    {showAddAddressModal && (
                        <div className="modal-overlay" onClick={() => setShowAddAddressModal(false)}>
                            <div className="modal-content address-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h5>{t('checkout.add_new_address')}</h5>
                                    <button
                                        type="button"
                                        className="modal-close"
                                        onClick={() => setShowAddAddressModal(false)}
                                    >
                                        <FiX />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="new-address-form-grid">
                                        <div className="form-group">
                                            <label className="form-label">{t('checkout.address_type')}</label>
                                            <select
                                                className="form-control"
                                                value={newAddress.type}
                                                onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                                            >
                                                <option value="home">{t('checkout.home')}</option>
                                                <option value="work">{t('checkout.work')}</option>
                                                <option value="other">{t('checkout.other')}</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('checkout.full_name')} *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newAddress.name}
                                                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group form-group-full">
                                            <label className="form-label">{t('checkout.address_line_1')} *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newAddress.address_line1}
                                                onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group form-group-full">
                                            <label className="form-label">{t('checkout.address_line_2')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newAddress.address_line2}
                                                onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('checkout.city')} *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newAddress.city}
                                                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('checkout.district')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newAddress.district}
                                                onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('checkout.postal_code')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newAddress.postal_code}
                                                onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('checkout.phone')} *</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={newAddress.phone}
                                                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group form-group-full">
                                            <label className="form-label">{t('checkout.country')} *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newAddress.country || 'Türkiye'}
                                                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group form-group-full">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="isDefaultAddress"
                                                    checked={newAddress.is_default}
                                                    onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                                                />
                                                <label className="form-check-label" htmlFor="isDefaultAddress">
                                                    {t('checkout.set_as_default')}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setShowAddAddressModal(false);
                                            setNewAddress({
                                                type: 'home',
                                                name: '',
                                                address_line1: '',
                                                address_line2: '',
                                                city: '',
                                                district: '',
                                                postal_code: '',
                                                phone: '',
                                                country: 'Türkiye',
                                                is_default: false
                                            });
                                        }}
                                    >
                                        {t('checkout.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleAddAddress}
                                    >
                                        {t('checkout.save_address')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Payment Card Modal */}
                    {showAddCardModal && (
                        <div className="modal-overlay" onClick={() => setShowAddCardModal(false)}>
                            <div className="modal-content card-modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h5>{t('checkout.add_new_card')}</h5>
                                    <button
                                        type="button"
                                        className="modal-close"
                                        onClick={() => setShowAddCardModal(false)}
                                    >
                                        <FiX />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {/* Kart Önizleme */}
                                    <div className="card-preview">
                                        <div className="card-preview-front">
                                            <div className="card-preview-header">
                                                <div className="card-chip"></div>
                                                <div className="card-logo">💳</div>
                                            </div>
                                            <div className="card-preview-number">
                                                {newCard.card_number || '•••• •••• •••• ••••'}
                                            </div>
                                            <div className="card-preview-footer">
                                                <div className="card-preview-holder">
                                                    <div className="card-preview-label">{t('checkout.card_holder')}</div>
                                                    <div className="card-preview-value">
                                                        {newCard.card_holder || 'KART SAHİBİ'}
                                                    </div>
                                                </div>
                                                <div className="card-preview-expiry">
                                                    <div className="card-preview-label">{t('checkout.expiry_date')}</div>
                                                    <div className="card-preview-value">
                                                        {newCard.expiry_date || 'MM/YY'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form */}
                                    <div className="new-card-form-modern">
                                        <div className="form-group form-group-full">
                                            <label className="form-label">{t('checkout.card_number_full')} *</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    className="form-control card-input"
                                                    placeholder="1234 5678 9012 3456"
                                                    value={newCard.card_number}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                                                        if (value.length > 16) value = value.slice(0, 16);
                                                        value = value.match(/.{1,4}/g)?.join(' ') || value;
                                                        setNewCard({ ...newCard, card_number: value });
                                                    }}
                                                    maxLength="19"
                                                    required
                                                />
                                                <span className="input-icon">💳</span>
                                            </div>
                                        </div>
                                        <div className="form-group form-group-full">
                                            <label className="form-label">{t('checkout.card_holder')} *</label>
                                            <input
                                                type="text"
                                                className="form-control card-input"
                                                placeholder="JOHN DOE"
                                                value={newCard.card_holder}
                                                onChange={(e) => {
                                                    const value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
                                                    setNewCard({ ...newCard, card_holder: value });
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="form-group-row">
                                            <div className="form-group">
                                                <label className="form-label">{t('checkout.expiry_date')} *</label>
                                                <input
                                                    type="text"
                                                    className="form-control card-input"
                                                    placeholder="MM/YY"
                                                    value={newCard.expiry_date}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, '');
                                                        if (value.length >= 2) {
                                                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                                        }
                                                        if (value.length > 5) value = value.slice(0, 5);
                                                        setNewCard({ ...newCard, expiry_date: value });
                                                    }}
                                                    maxLength="5"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{t('checkout.cvv')} *</label>
                                                <div className="input-wrapper">
                                                    <input
                                                        type="password"
                                                        className="form-control card-input"
                                                        placeholder="•••"
                                                        value={newCard.cvv}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                                                            setNewCard({ ...newCard, cvv: value });
                                                        }}
                                                        maxLength="3"
                                                        required
                                                    />
                                                    <span className="input-icon">🔒</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group form-group-full">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="saveCardModal"
                                                    checked={newCard.save_card}
                                                    onChange={(e) => setNewCard({ ...newCard, save_card: e.target.checked })}
                                                />
                                                <label className="form-check-label" htmlFor="saveCardModal">
                                                    {t('checkout.save_card_future')}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setShowAddCardModal(false);
                                            setNewCard({
                                                card_number: '',
                                                card_holder: '',
                                                expiry_date: '',
                                                cvv: '',
                                                save_card: false
                                            });
                                        }}
                                    >
                                        {t('checkout.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleAddCard}
                                    >
                                        {newCard.save_card ? t('checkout.save_and_use_card') : t('checkout.use_card')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {currentStep >= 1 && currentStep <= 3 && (
                    <div className="checkout-mobile-action-bar" role="region" aria-label={t('checkout.order_summary')}>
                        <div className="checkout-mobile-action-inner">
                            <div className="checkout-mobile-total">
                                <span className="checkout-mobile-total-label">{t('checkout.total')}</span>
                                <span className="checkout-mobile-total-value">{formatPrice(totals.total)}</span>
                            </div>
                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary checkout-mobile-action-btn"
                                    onClick={handleNextStep}
                                >
                                    {t('checkout.continue')}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-primary checkout-mobile-action-btn"
                                    onClick={handleProcessPayment}
                                    disabled={processing || (paymentMethod === 'balance' && userBalance < totals.total) || !termsAccepted}
                                >
                                    {processing ? t('checkout.processing') : t('checkout.complete_payment')}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default CheckoutWizard;

