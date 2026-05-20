import { useState, useEffect } from 'react';
import SellerLayout from '../components/SellerLayout';
import { sellerAPI } from '../api/seller';
import { 
    FiTag, FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiXCircle,
    FiSearch, FiRefreshCw, FiSave, FiX, FiCalendar, FiPercent
} from 'react-icons/fi';
import './SellerCoupons.css';

const SellerCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [projects, setProjects] = useState([]);
    const [maxCoupons, setMaxCoupons] = useState(5);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_amount: '',
        max_amount: '',
        usage_limit: '',
        one_time_use: false,
        start_date: '',
        expires_at: '',
        status: 'active',
        description: '',
        project_id: ''
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getCoupons();
            setCoupons(response.data.coupons || []);
            setProjects(response.data.projects || []);
            setMaxCoupons(response.data.maxCoupons || 5);
        } catch (error) {
            console.error('Coupons load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        // Maksimum kupon kontrolü
        if (coupons.length >= maxCoupons) {
            alert(`Maksimum ${maxCoupons} kupon oluşturabilirsiniz.`);
            return;
        }

        if (projects.length === 0) {
            alert('Önce bir proje oluşturmalısınız.');
            return;
        }

        setEditingCoupon(null);
        setFormData({
            code: '',
            discount_type: 'percentage',
            discount_value: '',
            min_amount: '',
            max_amount: '',
            usage_limit: '',
            one_time_use: false,
            start_date: '',
            expires_at: '',
            status: 'active',
            description: '',
            project_id: projects[0]?.id || ''
        });
        setShowAddModal(true);
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_amount: coupon.min_amount || '',
            max_amount: coupon.max_amount || '',
            usage_limit: coupon.usage_limit || '',
            one_time_use: coupon.one_time_use === 1,
            start_date: coupon.start_date ? coupon.start_date.split(' ')[0] : '',
            expires_at: coupon.expires_at ? coupon.expires_at.split(' ')[0] : '',
            status: coupon.status,
            description: coupon.description || '',
            project_id: coupon.project_id || ''
        });
        setShowAddModal(true);
    };

    const handleSave = async () => {
        // Validasyon
        if (!formData.project_id) {
            alert('Lütfen bir proje seçin');
            return;
        }
        if (!formData.code || !formData.discount_value) {
            alert('Kupon kodu ve indirim değeri gereklidir');
            return;
        }

        try {
            if (editingCoupon) {
                await sellerAPI.updateCoupon(editingCoupon.id, formData);
            } else {
                await sellerAPI.createCoupon(formData);
            }
            setShowAddModal(false);
            loadCoupons();
            alert(editingCoupon ? 'Kupon güncellendi' : 'Kupon oluşturuldu');
        } catch (error) {
            console.error('Save coupon error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Kupon kaydedilemedi';
            alert('Hata: ' + errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
        
        try {
            await sellerAPI.deleteCoupon(id);
            loadCoupons();
            alert('Kupon silindi');
        } catch (error) {
            console.error('Delete coupon error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Kupon silinemedi'));
        }
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    };

    const isExpired = (expiresAt) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    if (loading) {
        return (
            <SellerLayout>
                <div className="seller-coupons-page">
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
            <div className="seller-coupons-page">
                <div className="coupons-header">
                    <div className="header-content">
                        <h1 className="page-title">Kuponlarım</h1>
                        <p className="page-subtitle">Projeleriniz için indirim kuponları oluşturun</p>
                        <div className="coupon-limit-info">
                            <span className="limit-badge">
                                {coupons.length} / {maxCoupons} Kupon
                            </span>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadCoupons}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button 
                            className="btn-primary" 
                            onClick={handleAdd}
                            disabled={coupons.length >= maxCoupons}
                        >
                            <FiPlus /> Yeni Kupon Ekle
                        </button>
                    </div>
                </div>

                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Kupon ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="coupons-grid">
                    {filteredCoupons.map(coupon => (
                        <div key={coupon.id} className={`coupon-card ${isExpired(coupon.expires_at) ? 'expired' : ''}`}>
                            <div className="coupon-header">
                                <div className="coupon-code">
                                    <FiTag />
                                    <strong>{coupon.code}</strong>
                                </div>
                                <div className="coupon-badges">
                                    {isExpired(coupon.expires_at) && (
                                        <span className="badge badge-danger">Süresi Dolmuş</span>
                                    )}
                                    <span className={`badge badge-${coupon.status === 'active' ? 'success' : 'secondary'}`}>
                                        {coupon.status === 'active' ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                            </div>
                            <div className="coupon-body">
                                <div className="coupon-discount">
                                    {coupon.discount_type === 'percentage' ? (
                                        <>
                                            <FiPercent />
                                            <strong>%{coupon.discount_value}</strong>
                                            <span>İndirim</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiTag />
                                            <strong>{coupon.discount_value}₺</strong>
                                            <span>İndirim</span>
                                        </>
                                    )}
                                </div>
                                {coupon.project_title && (
                                    <div className="coupon-project">
                                        <FiTag className="project-icon" />
                                        <span>{coupon.project_title}</span>
                                    </div>
                                )}
                                {coupon.description && (
                                    <p className="coupon-description">{coupon.description}</p>
                                )}
                                <div className="coupon-meta">
                                    <div className="meta-item">
                                        <span>Min. Tutar:</span>
                                        <strong>{coupon.min_amount ? `${coupon.min_amount}₺` : 'Yok'}</strong>
                                    </div>
                                    <div className="meta-item">
                                        <span>Kullanım:</span>
                                        <strong>{coupon.usage_count || 0} / {coupon.usage_limit || '∞'}</strong>
                                    </div>
                                    <div className="meta-item">
                                        <span>Bitiş:</span>
                                        <strong>{formatDate(coupon.expires_at)}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="coupon-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => handleEdit(coupon)}
                                    title="Düzenle"
                                >
                                    <FiEdit />
                                </button>
                                <button
                                    className="btn-icon btn-danger"
                                    onClick={() => handleDelete(coupon.id)}
                                    title="Sil"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCoupons.length === 0 && (
                    <div className="empty-state">
                        <FiTag className="empty-icon" />
                        <h3>Kupon Bulunamadı</h3>
                        <p>{searchTerm ? 'Arama kriterlerinize uygun kupon yok.' : 'Henüz kuponunuz bulunmuyor.'}</p>
                    </div>
                )}

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingCoupon ? 'Kupon Düzenle' : 'Yeni Kupon Ekle'}</h2>
                                <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Proje *</label>
                                    <select
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Proje Seçin</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Kupon Kodu *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="HOSGELDIN10"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>İndirim Tipi *</label>
                                        <select
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                        >
                                            <option value="percentage">Yüzde (%)</option>
                                            <option value="fixed">Sabit Tutar (₺)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>İndirim Değeri *</label>
                                        <input
                                            type="number"
                                            value={formData.discount_value}
                                            onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                            placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Minimum Tutar (₺)</label>
                                        <input
                                            type="number"
                                            value={formData.min_amount}
                                            onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                                            placeholder="100"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Maksimum Tutar (₺)</label>
                                        <input
                                            type="number"
                                            value={formData.max_amount}
                                            onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                                            placeholder="1000"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Kullanım Limiti</label>
                                        <input
                                            type="number"
                                            value={formData.usage_limit}
                                            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                            placeholder="100 (boş = sınırsız)"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Durum</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Pasif</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Başlangıç Tarihi</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Bitiş Tarihi</label>
                                        <input
                                            type="date"
                                            value={formData.expires_at}
                                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Açıklama</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        placeholder="Kupon açıklaması..."
                                    />
                                </div>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.one_time_use}
                                        onChange={(e) => setFormData({ ...formData, one_time_use: e.target.checked })}
                                    />
                                    Tek Kullanımlık
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                    İptal
                                </button>
                                <button className="btn-primary" onClick={handleSave}>
                                    <FiSave /> Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SellerLayout>
    );
};

export default SellerCoupons;
