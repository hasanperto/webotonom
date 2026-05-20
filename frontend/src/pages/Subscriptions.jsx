import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionsAPI } from '../api/subscriptions';
import { cartAPI } from '../api/cart';
import { ticketsAPI } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useModules } from '../context/ModulesContext';
import { FiCheck, FiStar, FiTrendingUp, FiShield, FiPackage, FiClock, FiAlertCircle, FiMessageCircle } from 'react-icons/fi';
import './Subscriptions.css';

const Subscriptions = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, isSeller } = useAuth();
    const { t, language } = useLanguage();
    const { modules } = useModules();
    const [plans, setPlans] = useState([]);
    const [mySubscriptions, setMySubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [departments, setDepartments] = useState([]);

    const loadPlans = useCallback(async () => {
        try {
            const res = await subscriptionsAPI.getPlans(language);
            setPlans(res.data?.plans || res.data || []);
        } catch (error) {
            console.error('Plans load error:', error);
            setPlans([]);
        }
    }, [language]);

    const loadUserSubscriptions = useCallback(async () => {
        try {
            const res = await subscriptionsAPI.getMySubscriptions(language);
            setMySubscriptions(res.data?.subscriptions || []);
        } catch (error) {
            console.error('Subscriptions load error:', error);
            setMySubscriptions([]);
        } finally {
            setLoading(false);
        }
    }, [language]);

    const loadDepartments = useCallback(async () => {
        try {
            const res = await ticketsAPI.getDepartments();
            setDepartments(res.data?.departments || res.data || []);
        } catch (error) {
            console.error('Departments load error:', error);
            setDepartments([]);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        
        loadPlans();
        loadUserSubscriptions();
        loadDepartments();
    }, [isAuthenticated, loadPlans, loadUserSubscriptions, loadDepartments]);

    const handleSubscribe = async (planId) => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/subscriptions');
            return;
        }

        // Aktif abonelik varsa satın alma engelle
        const hasActiveSubscription = mySubscriptions.some(sub => sub.status === 'active');
        if (hasActiveSubscription) {
            alert(t('subscription_upgrade_note', 'Aktif aboneliğiniz bulunmaktadır. Abonelik yükseltmek için lütfen destek talebi oluşturun.'));
            return;
        }

        try {
            setProcessingId(planId);
            // Sepete ekle
            await cartAPI.addToCart({ plan_id: planId });
            // Checkout sayfasına yönlendir
            navigate('/checkout');
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Sepete ekleme sırasında bir hata oluştu.';
            alert(errorMsg);
            setProcessingId(null);
        }
    };

    const handleUpgradeRequest = async (planId) => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/subscriptions');
            return;
        }

        // Departmanlar yüklenmemişse yükle
        if (departments.length === 0) {
            try {
                await loadDepartments();
            } catch (error) {
                console.error('Failed to load departments:', error);
            }
        }

        // Satıcı desteği departmanını bul
        const sellerDept = departments.find(dept => 
            dept.slug === 'seller-support' || 
            (dept.name && dept.name.toLowerCase().includes('satıcı'))
        );
        const departmentId = sellerDept ? sellerDept.id : (departments.length > 0 ? departments[0].id : null);

        if (!departmentId) {
            alert(t('subscription_no_department', 'Destek departmanı bulunamadı. Lütfen daha sonra tekrar deneyin.'));
            return;
        }

        const plan = plans.find(p => p.id === planId);
        const planName = plan ? plan.name : 'Bilinmeyen Plan';

        try {
            const messageTemplate = t('subscription_upgrade_message', `Merhaba,\n\n{planName} paketine yükseltmek istiyorum.\n\nLütfen aboneliğimi yükseltme konusunda yardımcı olabilir misiniz?`);
            const message = messageTemplate.replace('{planName}', planName);

            await ticketsAPI.create({
                subject: t('subscription_upgrade_subject', 'Abonelik Yükseltme Talebi'),
                message: message,
                department_id: departmentId,
                priority: 'high',
                category: 'subscription'
            });
            alert(t('subscription_upgrade_success', 'Destek talebiniz oluşturuldu. En kısa sürede size dönüş yapılacaktır.'));
            navigate('/user/tickets');
        } catch (error) {
            console.error('Upgrade request error:', error);
            alert(error.response?.data?.error || t('subscription_upgrade_error', 'Destek talebi oluşturulurken bir hata oluştu.'));
        }
    };

    const handleCancel = async (id) => {
        if (confirm('Aboneliği iptal etmek istediğinize emin misiniz? Satıcı yetkileriniz süre sonunda bitecektir.')) {
            try {
                setProcessingId(id);
                await subscriptionsAPI.cancel(id);
                alert('Abonelik iptal edildi.');
                loadUserSubscriptions();
            } catch (error) {
                alert(error.response?.data?.error || 'İptal işlemi başarısız.');
            } finally {
                setProcessingId(null);
            }
        }
    };

    const formatPrice = (price) => {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '₺0';
        return numPrice % 1 === 0
            ? `₺${numPrice.toLocaleString('tr-TR')}`
            : `₺${numPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    };

    const getPeriodLabel = (plan) => {
        // Simple mapping based on billing_period from DB
        switch (plan.billing_period) {
            case 'monthly': return 'Ay';
            case '3_months': return '3 Ay';
            case '6_months': return '6 Ay';
            case 'yearly': return 'Yıl';
            case 'lifetime': return 'Ömür Boyu';
            default: return 'Yıl';
        }
    };

    const getPlanClass = (slug) => {
        if (slug.includes('gold')) return 'plan-gold';
        if (slug.includes('silver')) return 'plan-silver';
        if (slug.includes('bronze')) return 'plan-bronze';
        return '';
    };

    return (
        <div className="subscriptions-page">
            {/* Hero Section */}
            <div className="subscriptions-hero">
                <div className="container">
                    <div className="hero-content">
                        <span className="hero-badge">{t('become_seller', 'Satıcı Olun')}</span>
                        <h1>{t('grow_business_title', 'İşinizi Büyütmenin En Kolay Yolu')}</h1>
                        <p>{t('grow_business_desc', 'Profesyonel araçlar, gelişmiş analitikler ve sınırsız satış imkanı ile hemen kazanmaya başlayın.')}</p>

                        <div className="hero-features">
                            <div className="feature-item">
                                <span className="feature-icon"><FiTrendingUp /></span>
                                <div>
                                    <strong>{t('increase_sales', 'Satışları Artırın')}</strong>
                                    <span>{t('advanced_marketing_tools', 'Gelişmiş pazarlama araçları')}</span>
                                </div>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon"><FiShield /></span>
                                <div>
                                    <strong>{t('secure_payment', 'Güvenli Ödeme')}</strong>
                                    <span>{t('protected_infrastructure', 'Korunaklı altyapı')}</span>
                                </div>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon"><FiStar /></span>
                                <div>
                                    <strong>{t('stand_out', 'Öne Çıkın')}</strong>
                                    <span>{t('more_visibility', 'Daha fazla görünürlük')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container main-content">
                {/* Active Subscriptions */}
                {isAuthenticated && mySubscriptions.length > 0 && (
                    <div className="current-subscription-section">
                        <div className="section-header">
                            <FiPackage className="section-icon" />
                            <h2>{t('current_subscription', 'Mevcut Aboneliğiniz')}</h2>
                        </div>
                        <div className="active-subs-grid">
                            {mySubscriptions.map(sub => (
                                <div key={sub.id} className={`active-sub-card ${sub.status}`}>
                                    <div className="sub-header">
                                        <div>
                                            <h3>{sub.plan_name}</h3>
                                            <span className={`status-badge ${sub.status}`}>
                                                {sub.status === 'active' ? t('active', 'Aktif') : sub.status}
                                            </span>
                                        </div>
                                        {sub.status === 'active' && (
                                            <button
                                                onClick={() => handleCancel(sub.id)}
                                                className="btn btn-sm btn-outline-danger"
                                                disabled={processingId === sub.id}
                                            >
                                                {processingId === sub.id ? t('processing', 'İşleniyor...') : t('cancel_subscription', 'İptal Et')}
                                            </button>
                                        )}
                                    </div>
                                    <div className="sub-details">
                                        <div className="detail-item">
                                            <FiClock />
                                            <span>{t('start_date', 'Başlangıç')}: {new Date(sub.start_date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <div className="detail-item">
                                            <FiAlertCircle />
                                            <span>{t('end_date', 'Bitiş')}: {new Date(sub.end_date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Plans Grid */}
                <div className="pricing-section">
                    <div className="pricing-header">
                        <h2>{t('choose_plan', 'Size Uygun Planı Seçin')}</h2>
                        <p>{t('choose_plan_desc', 'İhtiyacınıza göre Bronze, Silver veya Gold paketlerden birini seçerek hemen satışa başlayın.')}</p>
                    </div>

                    {loading && plans.length === 0 ? (
                        <div className="loading-state">{t('loading_plans', 'Planlar yükleniyor...')}</div>
                    ) : (
                        <>
                            <div className="plans-grid">
                                {plans.map((plan) => {
                                    const isPopular = plan.slug.includes('gold') || plan.slug.includes('pro');
                                    const planClass = getPlanClass(plan.slug);
                                    
                                    // Bu planın aktif aboneliği var mı kontrol et
                                    const activeSubscription = mySubscriptions.find(
                                        sub => sub.plan_id === plan.id && sub.status === 'active'
                                    );
                                    const isCurrentPlan = !!activeSubscription;
                                    
                                    // Aktif abonelik var mı kontrol et
                                    const hasActiveSubscription = mySubscriptions.some(sub => sub.status === 'active');

                                    return (
                                        <div key={plan.id} className={`plan-card ${isPopular ? 'popular' : ''} ${planClass} ${isCurrentPlan ? 'current-plan' : ''}`}>
                                            {isPopular && <div className="popular-tag">{t('most_popular', 'En Popüler')}</div>}
                                            {isCurrentPlan && <div className="current-plan-badge">{t('current_subscription', 'Mevcut Abonelik')}</div>}
                                            <div className="plan-header">
                                                <h3>{plan.name}</h3>
                                                <div className="plan-price">
                                                    {formatPrice(plan.price)}
                                                    <span className="period">/{t('period_' + plan.billing_period, getPeriodLabel(plan))}</span>
                                                </div>
                                                <p className="plan-desc">{plan.description}</p>
                                            </div>

                                            <div className="plan-divider"></div>

                                            {/* LİMİTLERİ GÖSTER */}
                                            {plan.limits && Object.keys(plan.limits).length > 0 && (
                                                <div className="plan-limits">
                                                     {plan.limits.project_limit && (
                                                         <div className="limit-item">
                                                             <strong>{plan.limits.project_limit === '-1' ? t('unlimited', 'Sınırsız') : plan.limits.project_limit}</strong> {t('project_limit_label', 'Proje Yayınlama')}
                                                         </div>
                                                     )}
                                                </div>
                                            )}

                                            <ul className="plan-features">
                                                {(() => {
                                                    let features = [];
                                                    if (Array.isArray(plan.features)) {
                                                        features = plan.features;
                                                    } else if (typeof plan.features === 'string') {
                                                        features = plan.features.split(',');
                                                    }

                                                    if (!features || features.length === 0) {
                                                        return <li style={{ opacity: 0.5 }}>{t('no_features', 'Özellik listelenmedi')}</li>;
                                                    }

                                                    return features.map((feature, idx) => (
                                                        <li key={idx}>
                                                            <FiCheck className="check-icon" />
                                                            {feature.trim()}
                                                        </li>
                                                    ));
                                                })()}
                                            </ul>

                                            {isCurrentPlan ? (
                                                <button
                                                    className="btn btn-block btn-success"
                                                    disabled
                                                >
                                                    {t('current_subscription', 'Mevcut Abonelik')}
                                                </button>
                                            ) : hasActiveSubscription ? (
                                                <button
                                                    onClick={() => handleUpgradeRequest(plan.id)}
                                                    className="btn btn-block btn-upgrade"
                                                >
                                                    <FiMessageCircle className="icon-inline" />
                                                    {t('request_upgrade', 'Yükseltme Talebi Oluştur')}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSubscribe(plan.id)}
                                                    className={`btn btn-block ${isPopular ? 'btn-primary' : 'btn-outline'}`}
                                                    disabled={processingId === plan.id}
                                                >
                                                    {processingId === plan.id 
                                                        ? t('processing', 'İşleniyor...') 
                                                        : t('start_now', 'Hemen Başla')
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Aktif Abonelik Uyarısı */}
                            {isAuthenticated && mySubscriptions.some(sub => sub.status === 'active') && (
                                <div className="subscription-note">
                                    <FiAlertCircle className="note-icon" />
                                    <div>
                                        <strong>{t('subscription_active_note_title', 'Aktif Aboneliğiniz Bulunmaktadır')}</strong>
                                        <p>{t('subscription_active_note', 'Aktif aboneliğiniz olduğu için yeni paket satın alamazsınız. Abonelik yükseltmek için lütfen "Yükseltme Talebi Oluştur" butonunu kullanarak destek talebi oluşturun.')}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Subscriptions;

