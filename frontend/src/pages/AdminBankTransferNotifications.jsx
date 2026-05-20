import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import {
    FiCheckCircle, FiXCircle, FiClock, FiCreditCard,
    FiFileText, FiUser, FiSearch, FiFilter, FiDollarSign,
    FiCalendar, FiEye, FiDownload, FiPackage
} from 'react-icons/fi';
import './AdminBankTransferNotifications.css';

const AdminBankTransferNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/bank-transfer-notifications?status=${filter}`);
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Load notifications error:', error);
            showToast('Bildirimler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Bu banka havalesi bildirimini onaylamak istediğinize emin misiniz? Sipariş otomatik olarak ödendi olarak işaretlenecektir.')) {
            return;
        }

        try {
            setProcessingId(id);
            await api.put(`/admin/bank-transfer-notifications/${id}/approve`, {
                admin_notes: adminNotes || null
            });

            showToast('Banka havalesi bildirimi onaylandı ve sipariş güncellendi', 'success');
            setSelectedNotification(null);
            setAdminNotes('');
            loadNotifications();
        } catch (error) {
            console.error('Approve notification error:', error);
            showToast('Onaylama başarısız: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Bu banka havalesi bildirimini reddetmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            setProcessingId(id);
            await api.put(`/admin/bank-transfer-notifications/${id}/reject`, {
                admin_notes: adminNotes || null
            });

            showToast('Banka havalesi bildirimi reddedildi', 'success');
            setSelectedNotification(null);
            setAdminNotes('');
            loadNotifications();
        } catch (error) {
            console.error('Reject notification error:', error);
            showToast('Reddetme başarısız: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const statuses = {
            pending: { label: 'Beklemede', class: 'badge-pending', icon: FiClock, color: '#f59e0b' },
            approved: { label: 'Onaylandı', class: 'badge-success', icon: FiCheckCircle, color: '#10b981' },
            rejected: { label: 'Reddedildi', class: 'badge-danger', icon: FiXCircle, color: '#ef4444' }
        };
        const style = statuses[status] || statuses.pending;
        const Icon = style.icon;
        return (
            <span className={`status-badge ${style.class}`} style={{ backgroundColor: style.color }}>
                <Icon /> {style.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (amount, currency = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const filteredNotifications = notifications.filter(notif => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            notif.order_number?.toLowerCase().includes(searchLower) ||
            notif.receipt_number?.toLowerCase().includes(searchLower) ||
            notif.username?.toLowerCase().includes(searchLower) ||
            notif.email?.toLowerCase().includes(searchLower) ||
            notif.full_name?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <AdminLayout>
            <div className="admin-bank-transfer-notifications-page">
                <div className="page-header">
                    <div className="header-content">
                        <h1>
                            <FiCreditCard className="header-icon" />
                            Banka Havalesi Bildirimleri
                        </h1>
                        <p>Beklemede olan banka havalesi ödeme bildirimlerini kontrol edin ve onaylayın</p>
                    </div>
                    <button className="btn-refresh" onClick={loadNotifications} disabled={loading}>
                        <FiSearch /> Yenile
                    </button>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                )}

                {/* Filters */}
                <div className="filters-section">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            <FiClock /> Beklemede ({notifications.filter(n => n.status === 'pending').length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                            onClick={() => setFilter('approved')}
                        >
                            <FiCheckCircle /> Onaylanan ({notifications.filter(n => n.status === 'approved').length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
                            onClick={() => setFilter('rejected')}
                        >
                            <FiXCircle /> Reddedilen ({notifications.filter(n => n.status === 'rejected').length})
                        </button>
                    </div>

                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Sipariş no, dekont no, kullanıcı adı ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Yükleniyor...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                        <FiCreditCard className="empty-icon" />
                        <h3>Bildirim bulunamadı</h3>
                        <p>{filter === 'pending' ? 'Beklemede olan bildirim yok' : 'Bu kategoride bildirim yok'}</p>
                    </div>
                ) : (
                    <div className="notifications-table-container">
                        <table className="notifications-table">
                            <thead>
                                <tr>
                                    <th>Sipariş No</th>
                                    <th>Kullanıcı</th>
                                    <th>Dekont No</th>
                                    <th>Tutar</th>
                                    <th>Tarih</th>
                                    <th>Durum</th>
                                    <th className="text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNotifications.map((notif) => (
                                    <tr key={notif.id}>
                                        <td>
                                            <Link to={`/admin/orders/${notif.order_id}`} className="order-link">
                                                <FiPackage /> {notif.order_number}
                                            </Link>
                                        </td>
                                        <td>
                                            <div className="user-info">
                                                <FiUser /> {notif.full_name || notif.username || notif.email}
                                            </div>
                                        </td>
                                        <td>
                                            <code>{notif.receipt_number}</code>
                                            {notif.reference_number && (
                                                <small className="reference-number">
                                                    <br />Ref: {notif.reference_number}
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <strong>{formatPrice(notif.final_amount, notif.currency)}</strong>
                                        </td>
                                        <td>
                                            <FiCalendar /> {formatDate(notif.created_at)}
                                        </td>
                                        <td>{getStatusBadge(notif.status)}</td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-view"
                                                onClick={() => setSelectedNotification(notif)}
                                            >
                                                <FiEye /> Detay
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Detail Modal */}
                {selectedNotification && (
                    <div className="modal-overlay" onClick={() => {
                        setSelectedNotification(null);
                        setAdminNotes('');
                    }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Banka Havalesi Bildirimi Detayı</h2>
                                <button
                                    className="modal-close"
                                    onClick={() => {
                                        setSelectedNotification(null);
                                        setAdminNotes('');
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="detail-section">
                                    <h3>Sipariş Bilgileri</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <label>Sipariş No:</label>
                                            <Link to={`/admin/orders/${selectedNotification.order_id}`}>
                                                {selectedNotification.order_number}
                                            </Link>
                                        </div>
                                        <div className="detail-item">
                                            <label>Tutar:</label>
                                            <strong>{formatPrice(selectedNotification.final_amount, selectedNotification.currency)}</strong>
                                        </div>
                                        <div className="detail-item">
                                            <label>Sipariş Durumu:</label>
                                            <span className={`status-badge status-${selectedNotification.order_status}`}>
                                                {selectedNotification.order_status}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Ödeme Durumu:</label>
                                            <span className={`status-badge status-${selectedNotification.order_payment_status}`}>
                                                {selectedNotification.order_payment_status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Kullanıcı Bilgileri</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <label>Ad Soyad:</label>
                                            <span>{selectedNotification.full_name || '-'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Kullanıcı Adı:</label>
                                            <span>{selectedNotification.username || '-'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>E-posta:</label>
                                            <span>{selectedNotification.email || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Ödeme Bilgileri</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <label>Dekont Numarası:</label>
                                            <code>{selectedNotification.receipt_number}</code>
                                        </div>
                                        {selectedNotification.reference_number && (
                                            <div className="detail-item">
                                                <label>Referans Numarası:</label>
                                                <code>{selectedNotification.reference_number}</code>
                                            </div>
                                        )}
                                        <div className="detail-item">
                                            <label>Bildirim Tarihi:</label>
                                            <span>{formatDate(selectedNotification.created_at)}</span>
                                        </div>
                                        {selectedNotification.receipt_file && (
                                            <div className="detail-item full-width">
                                                <label>Dekont Dosyası:</label>
                                                <a
                                                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${selectedNotification.receipt_file}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="file-link"
                                                >
                                                    <FiDownload /> Dosyayı İndir
                                                </a>
                                            </div>
                                        )}
                                        {selectedNotification.notes && (
                                            <div className="detail-item full-width">
                                                <label>Kullanıcı Notları:</label>
                                                <p className="notes-text">{selectedNotification.notes}</p>
                                            </div>
                                        )}
                                        {selectedNotification.admin_notes && (
                                            <div className="detail-item full-width">
                                                <label>Admin Notları:</label>
                                                <p className="notes-text">{selectedNotification.admin_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedNotification.status === 'pending' && (
                                    <div className="detail-section">
                                        <h3>Admin Notları</h3>
                                        <textarea
                                            className="admin-notes-input"
                                            placeholder="Onay/Red nedeni için not ekleyebilirsiniz..."
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows="3"
                                        />
                                    </div>
                                )}
                            </div>

                            {selectedNotification.status === 'pending' && (
                                <div className="modal-footer">
                                    <button
                                        className="btn-reject"
                                        onClick={() => handleReject(selectedNotification.id)}
                                        disabled={processingId === selectedNotification.id}
                                    >
                                        <FiXCircle /> Reddet
                                    </button>
                                    <button
                                        className="btn-approve"
                                        onClick={() => handleApprove(selectedNotification.id)}
                                        disabled={processingId === selectedNotification.id}
                                    >
                                        <FiCheckCircle /> Onayla
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminBankTransferNotifications;
