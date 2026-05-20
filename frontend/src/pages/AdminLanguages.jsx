import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiGlobe, FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiXCircle,
    FiSearch, FiRefreshCw, FiSave, FiX
} from 'react-icons/fi';
import './AdminLanguages.css';

const AdminLanguages = () => {
    const navigate = useNavigate();
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLanguage, setEditingLanguage] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        native_name: '',
        rtl: false,
        is_default: false,
        status: 'active',
        sort_order: 0
    });

    useEffect(() => {
        loadLanguages();
    }, []);

    const loadLanguages = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/languages');
            setLanguages(response.data.languages || []);
        } catch (error) {
            console.error('Languages load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingLanguage(null);
        setFormData({
            code: '',
            name: '',
            native_name: '',
            rtl: false,
            is_default: false,
            status: 'active',
            sort_order: 0
        });
        setShowAddModal(true);
    };

    const handleEdit = (language) => {
        setEditingLanguage(language);
        setFormData({
            code: language.code,
            name: language.name,
            native_name: language.native_name,
            rtl: language.rtl === 1,
            is_default: language.is_default === 1,
            status: language.status,
            sort_order: language.sort_order
        });
        setShowAddModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingLanguage) {
                await api.put(`/admin/languages/${editingLanguage.id}`, formData);
            } else {
                await api.post('/admin/languages', formData);
            }
            setShowAddModal(false);
            loadLanguages();
        } catch (error) {
            console.error('Save language error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Dil kaydedilemedi'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu dili silmek istediğinize emin misiniz?')) return;
        
        try {
            await api.delete(`/admin/languages/${id}`);
            loadLanguages();
        } catch (error) {
            console.error('Delete language error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Dil silinemedi'));
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await api.put(`/admin/languages/${id}/status`, { status: newStatus });
            loadLanguages();
        } catch (error) {
            console.error('Toggle status error:', error);
        }
    };

    const filteredLanguages = languages.filter(lang =>
        lang.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.native_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-languages-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-languages-page">
                <div className="admin-header-minimal">
                    <div>
                        <h1 className="page-title-advanced">Dil Yönetimi</h1>
                        <p className="page-subtitle-advanced">Sistem dillerini yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadLanguages}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-primary" onClick={handleAdd}>
                            <FiPlus /> Yeni Dil Ekle
                        </button>
                    </div>
                </div>

                <div className="search-box-minimal">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Dil ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="languages-grid">
                    {filteredLanguages.map(language => (
                        <div key={language.id} className="language-card-minimal">
                            <div className="language-header">
                                <div className="language-info">
                                    <h3>{language.native_name}</h3>
                                    <span className="language-code">{language.code.toUpperCase()}</span>
                                </div>
                                <div className="language-badges">
                                    {language.is_default === 1 && (
                                        <span className="badge badge-primary">Varsayılan</span>
                                    )}
                                    {language.rtl === 1 && (
                                        <span className="badge badge-info">RTL</span>
                                    )}
                                    <span className={`badge badge-${language.status === 'active' ? 'success' : 'secondary'}`}>
                                        {language.status === 'active' ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                            </div>
                            <div className="language-body">
                                <p className="language-name">{language.name}</p>
                                <div className="language-meta">
                                    <span>Sıra: {language.sort_order}</span>
                                </div>
                            </div>
                            <div className="language-actions">
                                <button
                                    className="btn-icon"
                                    onClick={() => handleToggleStatus(language.id, language.status)}
                                    title={language.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                                >
                                    {language.status === 'active' ? <FiXCircle /> : <FiCheckCircle />}
                                </button>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleEdit(language)}
                                    title="Düzenle"
                                >
                                    <FiEdit />
                                </button>
                                <button
                                    className="btn-icon btn-danger"
                                    onClick={() => handleDelete(language.id)}
                                    title="Sil"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredLanguages.length === 0 && (
                    <div className="empty-state-minimal">
                        <FiGlobe />
                        <p>Dil bulunamadı</p>
                    </div>
                )}

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingLanguage ? 'Dil Düzenle' : 'Yeni Dil Ekle'}</h2>
                                <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Dil Kodu *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="tr, en, de..."
                                        maxLength={5}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Dil Adı (İngilizce) *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Turkish, English..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Yerel Ad *</label>
                                    <input
                                        type="text"
                                        value={formData.native_name}
                                        onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                                        placeholder="Türkçe, English..."
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Sıra</label>
                                        <input
                                            type="number"
                                            value={formData.sort_order}
                                            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
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
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.rtl}
                                            onChange={(e) => setFormData({ ...formData, rtl: e.target.checked })}
                                        />
                                        RTL (Sağdan Sola)
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_default}
                                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                        />
                                        Varsayılan Dil
                                    </label>
                                </div>
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
        </AdminLayout>
    );
};

export default AdminLanguages;

