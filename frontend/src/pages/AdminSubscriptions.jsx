import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import {
    FiCreditCard, FiUsers, FiBarChart2, FiPlus, FiEdit, FiTrash2,
    FiSearch, FiRefreshCw, FiSave, FiX, FiCheckCircle, FiClock, FiCalendar, FiActivity
} from 'react-icons/fi';
import './AdminSubscriptions.css';
import './AdminSubscriptionsModern.css';

const AdminSubscriptions = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tab || 'plans');
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Plan Modal State
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    
    // Subscription Edit Modal State
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [subFormData, setSubFormData] = useState({
        plan_id: '',
        end_date: '',
        status: 'active'
    });

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        price: '',
        currency: 'TRY',
        billing_period: 'monthly',
        is_featured: false,
        status: 'active',
        sort_order: 0,
        features: [], // Array for dynamic list
        limitsArray: [] // Array of {key, value} for dynamic list
    });

    useEffect(() => {
        if (tab) {
            setActiveTab(tab);
        }
    }, [tab]);

    useEffect(() => {
        if (activeTab === 'plans') {
            loadPlans();
        } else if (activeTab === 'active') {
            loadSubscriptions();
        } else if (activeTab === 'stats') {
            loadStats();
        }
    }, [activeTab]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        navigate(`/admin/subscriptions/${tabId}`);
    };

    const loadPlans = async () => {
        try {
            setLoading(true);
            // Endpoints updated to match backend structure: /api/subscriptions/admin/...
            const response = await api.get('/subscriptions/admin/plans');
            setPlans(response.data.plans || []);
        } catch (error) {
            console.error('Plans load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/subscriptions/admin/active');
            setSubscriptions(response.data.subscriptions || []);
        } catch (error) {
            console.error('Subscriptions load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/subscriptions/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Stats load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        try {
            // Convert limitsArray back to limits object
            const limitsObject = {};
            if (Array.isArray(formData.limitsArray)) {
                formData.limitsArray.forEach(item => {
                    if (item.key && item.value) {
                        limitsObject[item.key] = item.value;
                    }
                });
            }

            const payload = {
                ...formData,
                limits: limitsObject,
                // Features is already an array, backend handles it
            };

            if (editingPlan) {
                await api.put(`/subscriptions/admin/plans/${editingPlan.id}`, payload);
            } else {
                await api.post('/subscriptions/admin/plans', payload);
            }
            setShowPlanModal(false);
            loadPlans();
        } catch (error) {
            console.error('Save plan error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Plan kaydedilemedi'));
        }
    };

    const handleDeletePlan = async (id) => {
        if (window.confirm('Bu planı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            try {
                await api.delete(`/subscriptions/admin/plans/${id}`);
                loadPlans();
            } catch (error) {
                console.error('Delete plan error:', error);
                alert('Hata: ' + (error.response?.data?.error || 'Plan silinemedi. Aktif abonelikleri kontrol edin.'));
            }
        }
    };

    // --- Subscription Actions ---

    const handleEditSubscription = (sub) => {
        setEditingSub(sub);
        // Find plan ID from plans list by name matching or direct ID if available
        // Note: backend query joins plans, so we might not have raw plan_id in the view list easily unless selected.
        // The endpoint `/admin/active` returns `sp.name as plan_name`, but usually also `us.*` which includes `plan_id`.
        
        setSubFormData({
            plan_id: sub.plan_id,
            end_date: sub.end_date ? new Date(sub.end_date).toISOString().split('T')[0] : '',
            status: sub.status
        });
        setShowSubModal(true);
    };

    const handleUpdateSubscription = async () => {
        if (!editingSub) return;
        try {
            await api.put(`/subscriptions/admin/user-subscriptions/${editingSub.id}`, subFormData);
            setShowSubModal(false);
            loadSubscriptions(); // Refresh list
            alert('Abonelik güncellendi.');
        } catch (error) {
            console.error('Update sub error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Güncelleme başarısız'));
        }
    };

    const handleDeleteSubscription = async (id) => {
        if (window.confirm('Bu kullanıcı aboneliğini kalıcı olarak silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/subscriptions/admin/user-subscriptions/${id}`);
                loadSubscriptions();
            } catch (error) {
                console.error('Delete sub error:', error);
                alert('Hata: Silme işlemi başarısız.');
            }
        }
    };

    const formatCurrency = (amount, currency = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    if (loading && activeTab === 'plans' && plans.length === 0) {
        return (
            <AdminLayout>
                <div className="admin-subscriptions-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-subscriptions-page">
                <div className="admin-header-minimal">
                    <div>
                        <h1 className="page-title-advanced">Abonelik Yönetimi</h1>
                        <p className="page-subtitle-advanced">Abonelik planlarını ve aktif abonelikleri yönetin</p>
                    </div>
                    {activeTab === 'plans' && (
                        <div className="header-actions">
                            <button className="btn-primary" onClick={() => {
                                setEditingPlan(null);
                                setFormData({
                                    name: '',
                                    slug: '',
                                    description: '',
                                    price: '',
                                    currency: 'TRY',
                                    billing_period: 'monthly',
                                    is_featured: false,
                                    status: 'active',
                                    sort_order: 0,
                                    features: [],
                                    limitsArray: [{ key: 'project_limit', value: '' }]
                                });
                                setShowPlanModal(true);
                            }}>
                                <FiPlus /> Yeni Plan
                            </button>
                        </div>
                    )}
                </div>

                <div className="subscriptions-tabs">
                    <button
                        className={`subscription-tab ${activeTab === 'plans' ? 'active' : ''}`}
                        onClick={() => handleTabChange('plans')}
                    >
                        <FiCreditCard /> Planlar
                    </button>
                    <button
                        className={`subscription-tab ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => handleTabChange('active')}
                    >
                        <FiUsers /> Aktif Abonelikler
                    </button>
                    <button
                        className={`subscription-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => handleTabChange('stats')}
                    >
                        <FiBarChart2 /> İstatistikler
                    </button>
                </div>

                {activeTab === 'plans' && (
                    <div className="plans-grid">
                        {plans.map(plan => (
                            <div key={plan.id} className="plan-card-minimal">
                                <div className="plan-header">
                                    <h3>{plan.name}</h3>
                                    {plan.is_featured === 1 && (
                                        <span className="badge badge-primary">Öne Çıkan</span>
                                    )}
                                </div>
                                <div className="plan-body">
                                    <div className="plan-price">
                                        {formatCurrency(plan.price, plan.currency)}
                                        <span>/{plan.billing_period}</span>
                                    </div>
                                    {plan.description && (
                                        <p className="plan-description">{plan.description}</p>
                                    )}
                                    {plan.features_list && (
                                        <p className="plan-features-summary" style={{ fontSize: '0.8rem', color: '#666' }}>
                                            <strong>Özellikler:</strong> {plan.features_list.substring(0, 50)}...
                                        </p>
                                    )}
                                    {plan.limits && Object.keys(plan.limits).length > 0 && (
                                        <div className="plan-limits-preview">
                                            <h4>Limitler:</h4>
                                            <ul>
                                                {Object.entries(plan.limits).map(([key, value]) => {
                                                    let label = key;
                                                    if (key === 'project_limit') label = 'Proje Limiti';
                                                    if (key === 'commission_rate') label = 'Komisyon Oranı';
                                                    if (key === 'support_level') label = 'Destek Seviyesi';
                                                    if (key === 'storage_limit') label = 'Depolama';
                                                    
                                                    let displayValue = value;
                                                    if (value === '-1') displayValue = 'Sınırsız';
                                                    if (key === 'commission_rate') displayValue = `%${value}`;
                                                    if (key === 'support_level' && value === 'priority') displayValue = 'Öncelikli';
                                                    if (key === 'support_level' && value === 'email') displayValue = 'E-posta';
                                                    if (key === 'support_level' && value === 'live_chat') displayValue = 'Canlı Destek';

                                                    return (
                                                        <li key={key}>
                                                            <span className="limit-key">{label}:</span>
                                                            <span className="limit-value">{displayValue}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className="plan-actions">
                                    <button className="btn-icon" title="Düzenle" onClick={() => {
                                        setEditingPlan(plan);

                                        // Convert features string to array
                                        const featuresArray = plan.features_list ? plan.features_list.split(',').map(f => f.trim()) : [];

                                        // Convert limits object to array
                                        const limitsArray = [];
                                        if (plan.limits) {
                                            Object.entries(plan.limits).forEach(([key, value]) => {
                                                limitsArray.push({ key, value });
                                            });
                                        }

                                        setFormData({
                                            name: plan.name,
                                            slug: plan.slug,
                                            description: plan.description || '',
                                            price: plan.price,
                                            currency: plan.currency,
                                            billing_period: plan.billing_period,
                                            is_featured: plan.is_featured === 1,
                                            status: plan.status,
                                            sort_order: plan.sort_order,
                                            features: featuresArray,
                                            limitsArray: limitsArray
                                        });
                                        setShowPlanModal(true);
                                    }}>
                                        <FiEdit />
                                    </button>
                                    <button className="btn-icon btn-icon-danger" title="Sil" onClick={() => handleDeletePlan(plan.id)}>
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'active' && (
                    <div className="subscriptions-list">
                        {subscriptions.map(sub => (
                            <div key={sub.id} className="subscription-card-minimal">
                                <div className="subscription-header">
                                    <div>
                                        <h3>{sub.username}</h3>
                                        <p>{sub.plan_name}</p>
                                    </div>
                                    <span className={`badge badge-${sub.status === 'active' ? 'success' : 'secondary'}`}>
                                        {sub.status === 'active' ? 'Aktif' : sub.status}
                                    </span>
                                </div>
                                <div className="subscription-body">
                                    <div className="subscription-meta">
                                        <span><FiClock /> Başlangıç: {new Date(sub.start_date).toLocaleDateString('tr-TR')}</span>
                                        {sub.end_date && (
                                            <span><FiCalendar /> Bitiş: {new Date(sub.end_date).toLocaleDateString('tr-TR')}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="subscription-actions" style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', paddingLeft: '1rem' }}>
                                    <button 
                                        className="btn-icon" 
                                        title="Düzenle"
                                        onClick={() => handleEditSubscription(sub)}
                                    >
                                        <FiEdit />
                                    </button>
                                    <button 
                                        className="btn-icon btn-icon-danger" 
                                        title="Sil"
                                        onClick={() => handleDeleteSubscription(sub.id)}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'stats' && stats && (
                    <div className="subscription-stats-grid">
                        <div className="stat-card-minimal">
                            <h3>Toplam Plan</h3>
                            <p>{stats.total_plans || 0}</p>
                        </div>
                        <div className="stat-card-minimal">
                            <h3>Aktif Abonelik</h3>
                            <p>{stats.active_subscriptions || 0}</p>
                        </div>
                        <div className="stat-card-minimal">
                            <h3>Aylık Gelir</h3>
                            <p>{formatCurrency(stats.monthly_revenue || 0)}</p>
                        </div>
                    </div>
                )}

                {showPlanModal && (
                    <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingPlan ? 'Plan Düzenle' : 'Yeni Plan Ekle'}</h2>
                                <button className="btn-icon" onClick={() => setShowPlanModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body modern-form">
                                <div className="form-section">
                                    <h3 className="form-section-title">Temel Bilgiler</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Plan Adı *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                                placeholder="Örn: Gold Paket"
                                                className="modern-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Slug (URL) *</label>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                placeholder="gold-paket"
                                                className="modern-input"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Açıklama</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="2"
                                            placeholder="Planın kısa açıklaması..."
                                            className="modern-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3 className="form-section-title">Fiyatlandırma</h3>
                                    <div className="form-grid three-cols">
                                        <div className="form-group">
                                            <label>Fiyat *</label>
                                            <div className="input-with-icon">
                                                <input
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    placeholder="0.00"
                                                    className="modern-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Para Birimi</label>
                                            <select
                                                value={formData.currency}
                                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                                className="modern-select"
                                            >
                                                <option value="TRY">TRY (₺)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Periyot</label>
                                            <select
                                                value={formData.billing_period}
                                                onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                                                className="modern-select"
                                            >
                                                <option value="monthly">Aylık</option>
                                                <option value="3_months">3 Aylık</option>
                                                <option value="6_months">6 Aylık</option>
                                                <option value="yearly">Yıllık</option>
                                                <option value="lifetime">Ömür Boyu</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid two-cols">
                                    <div className="form-section">
                                        <h3 className="form-section-title">Özellikler</h3>
                                        <div className="dynamic-list modern">
                                            {(Array.isArray(formData.features) ? formData.features : []).map((feature, index) => (
                                                <div key={index} className="dynamic-item">
                                                    <input
                                                        type="text"
                                                        value={feature}
                                                        onChange={(e) => {
                                                            const newFeatures = [...formData.features];
                                                            newFeatures[index] = e.target.value;
                                                            setFormData({ ...formData, features: newFeatures });
                                                        }}
                                                        placeholder="Özellik adı..."
                                                        className="modern-input small"
                                                    />
                                                    <button
                                                        className="btn-icon-small danger"
                                                        onClick={() => {
                                                            const newFeatures = formData.features.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, features: newFeatures });
                                                        }}
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                className="btn-text-primary"
                                                onClick={() => setFormData({ ...formData, features: [...(Array.isArray(formData.features) ? formData.features : []), ''] })}
                                            >
                                                <FiPlus /> Özellik Ekle
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h3 className="form-section-title">Limitler</h3>
                                        <div className="dynamic-list modern">
                                            {(Array.isArray(formData.limitsArray) ? formData.limitsArray : []).map((limit, index) => (
                                                <div key={index} className="dynamic-item limit-row">
                                                    <input
                                                        type="text"
                                                        value={limit.key}
                                                        onChange={(e) => {
                                                            const newLimits = [...formData.limitsArray];
                                                            newLimits[index].key = e.target.value;
                                                            setFormData({ ...formData, limitsArray: newLimits });
                                                        }}
                                                        placeholder="Anahtar (key)"
                                                        className="modern-input small key-input"
                                                        list={`limit-suggestions-${index}`}
                                                    />
                                                    <datalist id={`limit-suggestions-${index}`}>
                                                        <option value="project_limit">project_limit</option>
                                                        <option value="commission_rate">commission_rate</option>
                                                        <option value="support_level">support_level</option>
                                                    </datalist>
                                                    <input
                                                        type="text"
                                                        value={limit.value}
                                                        onChange={(e) => {
                                                            const newLimits = [...formData.limitsArray];
                                                            newLimits[index].value = e.target.value;
                                                            setFormData({ ...formData, limitsArray: newLimits });
                                                        }}
                                                        placeholder="Değer"
                                                        className="modern-input small value-input"
                                                    />
                                                    <button
                                                        className="btn-icon-small danger"
                                                        onClick={() => {
                                                            const newLimits = formData.limitsArray.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, limitsArray: newLimits });
                                                        }}
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="limit-actions">
                                                <button
                                                    className="btn-text-primary"
                                                    onClick={() => setFormData({ ...formData, limitsArray: [...(Array.isArray(formData.limitsArray) ? formData.limitsArray : []), { key: '', value: '' }] })}
                                                >
                                                    <FiPlus /> Limit Ekle
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section settings-row">
                                    <label className="checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="label-text">Öne Çıkan Plan</span>
                                    </label>
                                    
                                    <div className="form-group inline-group">
                                        <label>Sıralama</label>
                                        <input
                                            type="number"
                                            value={formData.sort_order}
                                            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                            className="modern-input small-number"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowPlanModal(false)}>
                                    İptal
                                </button>
                                <button className="btn-primary" onClick={handleSavePlan}>
                                    <FiSave /> Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subscription Edit Modal */}
                {showSubModal && (
                    <div className="modal-overlay" onClick={() => setShowSubModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h2>Abonelik Düzenle</h2>
                                <button className="btn-icon" onClick={() => setShowSubModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Kullanıcı: {editingSub?.username}</label>
                                </div>
                                <div className="form-group">
                                    <label>Plan Değiştir</label>
                                    <select
                                        value={subFormData.plan_id}
                                        onChange={(e) => setSubFormData({ ...subFormData, plan_id: e.target.value })}
                                    >
                                        <option value="">Plan Seçin</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price, p.currency)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Bitiş Tarihi (Süre Uzat/Kısalt)</label>
                                    <input
                                        type="date"
                                        value={subFormData.end_date}
                                        onChange={(e) => setSubFormData({ ...subFormData, end_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Durum</label>
                                    <select
                                        value={subFormData.status}
                                        onChange={(e) => setSubFormData({ ...subFormData, status: e.target.value })}
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="cancelled">İptal Edildi</option>
                                        <option value="expired">Süresi Doldu</option>
                                        <option value="suspended">Askıya Alındı</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowSubModal(false)}>
                                    İptal
                                </button>
                                <button className="btn-primary" onClick={handleUpdateSubscription}>
                                    <FiSave /> Güncelle
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminSubscriptions;

