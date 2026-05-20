import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api/users';
import { donationsAPI } from '../api/donations';
import { getImageUrl } from '../utils/api';
import { Link } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [donations, setDonations] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadProfile();
            loadFavorites();
            loadDonations();
            loadOrders();
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            const response = await usersAPI.getProfile();
            setProfile(response.data.user);
        } catch (error) {
            console.error('Profile load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFavorites = async () => {
        try {
            const response = await usersAPI.getFavorites();
            setFavorites(response.data.favorites || []);
        } catch (error) {
            console.error('Favorites load error:', error);
        }
    };

    const loadDonations = async () => {
        try {
            const response = await donationsAPI.getMyDonations();
            setDonations(response.data.donations || []);
        } catch (error) {
            console.error('Donations load error:', error);
        }
    };

    const loadOrders = async () => {
        try {
            const response = await usersAPI.getOrders();
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Orders load error:', error);
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
        return <div className="loading">Yükleniyor...</div>;
    }

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {profile?.first_name?.[0] || user?.username?.[0] || 'U'}
                        </div>
                    </div>
                    <div className="profile-info">
                        <h1>{profile?.first_name && profile?.last_name 
                            ? `${profile.first_name} ${profile.last_name}` 
                            : user?.username}</h1>
                        <p className="profile-email">{user?.email}</p>
                        <p className="profile-role">Rol: {user?.role === 'admin' ? 'Yönetici' : user?.role === 'seller' ? 'Satıcı' : 'Kullanıcı'}</p>
                    </div>
                </div>

                <div className="profile-tabs">
                    <button 
                        className={activeTab === 'overview' ? 'active' : ''}
                        onClick={() => setActiveTab('overview')}
                    >
                        Genel Bakış
                    </button>
                    <button 
                        className={activeTab === 'favorites' ? 'active' : ''}
                        onClick={() => setActiveTab('favorites')}
                    >
                        Favoriler ({favorites.length})
                    </button>
                    <button 
                        className={activeTab === 'donations' ? 'active' : ''}
                        onClick={() => setActiveTab('donations')}
                    >
                        Bağışlarım ({donations.length})
                    </button>
                    <button 
                        className={activeTab === 'orders' ? 'active' : ''}
                        onClick={() => setActiveTab('orders')}
                    >
                        Siparişlerim ({orders.length})
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">❤️</div>
                                    <h3>{favorites.length}</h3>
                                    <p>Favori Proje</p>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">💝</div>
                                    <h3>{donations.length}</h3>
                                    <p>Bağış</p>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🛒</div>
                                    <h3>{orders.length}</h3>
                                    <p>Sipariş</p>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">⭐</div>
                                    <h3>{profile?.rating || '0'}</h3>
                                    <p>Ortalama Puan</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'favorites' && (
                        <div className="favorites-tab">
                            {favorites.length === 0 ? (
                                <p className="empty-state">Henüz favori projeniz yok.</p>
                            ) : (
                                <div className="projects-grid">
                                    {favorites.map(project => (
                                        <Link 
                                            key={project.id} 
                                            to={`/projects/${project.id}`}
                                            className="project-card"
                                        >
                                            {project.primary_image && (
                                                <img src={getImageUrl(project.primary_image)} alt={project.title} />
                                            )}
                                            <div className="project-info">
                                                <h3>{project.title}</h3>
                                                <p>{project.category_name}</p>
                                                <p className="price">{formatPrice(project.discount_price || project.price)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'donations' && (
                        <div className="donations-tab">
                            {donations.length === 0 ? (
                                <p className="empty-state">Henüz bağış yapmadınız.</p>
                            ) : (
                                <div className="donations-list">
                                    {donations.map(donation => (
                                        <div key={donation.id} className="donation-item">
                                            <div className="donation-info">
                                                <h3>
                                                    <Link to={`/projects/${donation.project_id}`}>
                                                        {donation.project_title}
                                                    </Link>
                                                </h3>
                                                {donation.message && (
                                                    <p className="donation-message">{donation.message}</p>
                                                )}
                                                <small>{new Date(donation.created_at).toLocaleDateString('tr-TR')}</small>
                                            </div>
                                            <div className="donation-amount">
                                                <strong>{formatPrice(donation.amount)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="orders-tab">
                            {orders.length === 0 ? (
                                <p className="empty-state">Henüz siparişiniz yok.</p>
                            ) : (
                                <div className="orders-list">
                                    {orders.map(order => (
                                        <div key={order.id} className="order-item">
                                            <div className="order-header">
                                                <div>
                                                    <h3>Sipariş #{order.id}</h3>
                                                    <p>{order.project_titles}</p>
                                                    <small>{new Date(order.created_at).toLocaleDateString('tr-TR')}</small>
                                                </div>
                                                <div className="order-status">
                                                    <span className={`status ${order.payment_status}`}>
                                                        {order.payment_status === 'paid' ? 'Ödendi' : 'Beklemede'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="order-footer">
                                                <span className="order-total">Toplam: {formatPrice(order.final_amount)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;

