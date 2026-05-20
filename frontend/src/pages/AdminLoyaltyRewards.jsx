
import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiAward, FiX } from 'react-icons/fi';
import './AdminLoyaltyRewards.css';

const AdminLoyaltyRewards = () => {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentReward, setCurrentReward] = useState({
        id: null,
        required_points: 100,
        reward_type: 'percentage_coupon',
        reward_value: 10,
        description: '',
        is_active: true
    });

    useEffect(() => {
        loadRewards();
    }, []);

    const loadRewards = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/loyalty-rewards');
            setRewards(response.data.rewards || []);
        } catch (error) {
            console.error('Load rewards error:', error);
            alert('Ödül listesi yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/admin/loyalty-rewards/${currentReward.id}`, currentReward);
                alert('Ödül güncellendi');
            } else {
                await api.post('/admin/loyalty-rewards', currentReward);
                alert('Ödül eklendi');
            }
            setModalOpen(false);
            loadRewards();
            resetForm();
        } catch (error) {
            console.error('Save reward error:', error);
            alert('Kaydetme hatası');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu ödülü silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/admin/loyalty-rewards/${id}`);
            setRewards(rewards.filter(r => r.id !== id));
        } catch (error) {
            console.error('Delete reward error:', error);
            alert('Silme hatası');
        }
    };

    const openEditModal = (reward) => {
        setCurrentReward(reward);
        setEditMode(true);
        setModalOpen(true);
    };

    const openAddModal = () => {
        resetForm();
        setEditMode(false);
        setModalOpen(true);
    };

    const resetForm = () => {
        setCurrentReward({
            id: null,
            required_points: 100,
            reward_type: 'percentage_coupon',
            reward_value: 10,
            description: '',
            is_active: true
        });
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-container">
                    <div className="spinner-large"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-rewards-page">
                {/* Header */}
                <div className="page-header-flex">
                    <div>
                        <h1 className="page-title">
                            <FiAward /> Sadakat Ödülleri
                        </h1>
                        <p className="page-subtitle">Puan ödül sistemi yönetimi</p>
                    </div>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <FiPlus /> Yeni Ödül Ekle
                    </button>
                </div>

                {/* Table */}
                <div className="rewards-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Gerekli Puan</th>
                                <th>Ödül Tipi</th>
                                <th>Değer</th>
                                <th>Açıklama</th>
                                <th>Durum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rewards.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">Henüz ödül kuralı eklenmemiş.</td>
                                </tr>
                            ) : (
                                rewards.map(reward => (
                                    <tr key={reward.id}>
                                        <td className="font-bold">{reward.required_points} Puan</td>
                                        <td>
                                            {reward.reward_type === 'percentage_coupon' && '% İndirim'}
                                            {reward.reward_type === 'fixed_coupon' && 'Sabit İndirim'}
                                            {reward.reward_type === 'balance' && 'Bakiye'}
                                        </td>
                                        <td className="font-bold text-primary">
                                            {reward.reward_type === 'percentage_coupon' ? `%${reward.reward_value}` : `${reward.reward_value} TL`}
                                        </td>
                                        <td>{reward.description}</td>
                                        <td>
                                            <span className={`status-badge ${reward.is_active ? 'active' : 'inactive'}`}>
                                                {reward.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="btn-icon edit" onClick={() => openEditModal(reward)}>
                                                <FiEdit2 />
                                            </button>
                                            <button className="btn-icon delete" onClick={() => handleDelete(reward.id)}>
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {modalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>{editMode ? 'Ödülü Düzenle' : 'Yeni Ödül Ekle'}</h3>
                                <button className="close-btn" onClick={() => setModalOpen(false)}><FiX /></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="form-group">
                                    <label>Gerekli Puan</label>
                                    <input
                                        type="number"
                                        value={currentReward.required_points}
                                        onChange={e => setCurrentReward({ ...currentReward, required_points: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ödül Tipi</label>
                                    <select
                                        value={currentReward.reward_type}
                                        onChange={e => setCurrentReward({ ...currentReward, reward_type: e.target.value })}
                                    >
                                        <option value="percentage_coupon">% İndirim Kuponu</option>
                                        <option value="fixed_coupon">Sabit Tutar İndirim Kuponu</option>
                                        <option value="balance">Bakiye (Cüzdan)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Değer (Oran veya Tutar)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={currentReward.reward_value}
                                        onChange={e => setCurrentReward({ ...currentReward, reward_value: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Açıklama</label>
                                    <input
                                        type="text"
                                        value={currentReward.description}
                                        onChange={e => setCurrentReward({ ...currentReward, description: e.target.value })}
                                        placeholder="Örn: %10 İndirim Kuponu"
                                        required
                                    />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={currentReward.is_active}
                                            onChange={e => setCurrentReward({ ...currentReward, is_active: e.target.checked })}
                                        />
                                        Aktif
                                    </label>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
                                    <button type="submit" className="btn btn-primary">Kaydet</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminLoyaltyRewards;
