
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { usersAPI } from '../api/users';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { FiShare2, FiLink, FiGift, FiCopy, FiCheckCircle } from 'react-icons/fi';
import './UserShares.css';

const UserShares = () => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const [points, setPoints] = useState({
        current: 0,
        next_reward: 100,
        next_reward_desc: '',
        all_rewards: []
    });
    const [shares, setShares] = useState([]); // Mock data mostly
    const [loading, setLoading] = useState(true);
    const [copiedLink, setCopiedLink] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getLoyaltyStatus();
            const data = response.data;

            setPoints({
                current: data.current_points,
                next_reward: data.next_reward ? data.next_reward.required_points : data.current_points,
                next_reward_desc: data.next_reward ? data.next_reward.description : (data.all_rewards.length > 0 ? 'Tüm ödüller kazanıldı!' : 'Henüz ödül yok.'),
                all_rewards: data.all_rewards
            });

            // Mock shares history for now
            setShares([
                { id: 1, type: 'project', title: 'E-Ticaret Scripti v2', points_earned: 2, created_at: '2023-11-15T10:30:00' },
                { id: 2, type: 'homepage', title: 'Site Ana Sayfası', points_earned: 1, created_at: '2023-11-20T14:15:00' },
            ]);
        } catch (error) {
            console.error('Load loyalty data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopiedLink(type);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="user-shares-page loading-center">
                    <div className="spinner-large"></div>
                </div>
            </UserLayout>
        );
    }

    const progressPercentage = points.next_reward > 0
        ? Math.min((points.current / points.next_reward) * 100, 100)
        : 0;

    return (
        <UserLayout>
            <div className="user-shares-page">
                {/* Header Section */}
                <div className="shares-header-modern">
                    <div className="header-content">
                        <div className="header-badge">
                            <FiShare2 /> {t('shares.title') || 'Paylaş & Kazan'}
                        </div>
                        <p className="page-subtitle">
                            {t('shares.subtitle') || 'Projeleri paylaşarak puan toplayın ve indirim kuponları kazanın.'}
                        </p>
                    </div>
                </div>

                {/* Points Progress Section */}
                <div className="points-progress-card">
                    <div className="points-info">
                        <div className="current-points">
                            <span className="points-label">{t('shares.current_points') || 'Mevcut Puanınız'}</span>
                            <span className="points-value">{points.current}</span>
                        </div>
                        <div className="points-target">
                            <span className="target-label">{t('shares.next_reward') || 'Sonraki Ödül'}</span>
                            <span className="target-value">{points.next_reward} {t('shares.points') || 'Puan'}</span>
                        </div>
                    </div>

                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
                    </div>

                    <div className="reward-info">
                        <FiGift className="gift-icon" />
                        <span>
                            {points.next_reward_desc || `${points.next_reward} puanda sürpriz ödül!`}
                        </span>
                    </div>
                </div>

                {/* All Rewards Catalog */}
                {points.all_rewards && points.all_rewards.length > 0 && (
                    <div className="rewards-catalog-section">
                        <h3>{t('shares.rewards_catalog') || 'Ödül Kataloğu'}</h3>
                        <div className="rewards-grid">
                            {points.all_rewards.map((reward, index) => {
                                const isUnlocked = points.current >= reward.required_points;
                                const isNext = !isUnlocked && (index === 0 || points.current >= points.all_rewards[index - 1].required_points);

                                return (
                                    <div key={reward.id} className={`reward-card ${isUnlocked ? 'unlocked' : 'locked'} ${isNext ? 'next-target' : ''}`}>
                                        <div className="reward-icon-wrapper">
                                            {isUnlocked ? <FiCheckCircle /> : <FiGift />}
                                        </div>
                                        <div className="reward-content">
                                            <div className="reward-points">{reward.required_points} Puan</div>
                                            <h4>{reward.description}</h4>
                                            <p className="reward-status">
                                                {isUnlocked ? 'Kazanıldı' : `${reward.required_points - points.current} puan kaldı`}
                                            </p>
                                        </div>
                                        {isUnlocked && (
                                            <div className="unlocked-badge">
                                                Hazır
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Referral Links Section */}
                <div className="referral-links-section">
                    <h3>{t('shares.your_links') || 'Paylaşım Linkleriniz'}</h3>
                    <div className="link-cards">
                        {/* Homepage Link */}
                        <div className="link-card">
                            <div className="link-icon">
                                <FiShare2 />
                            </div>
                            <div className="link-details">
                                <h4>{t('shares.homepage_link') || 'Ana Sayfa Linki'}</h4>
                                <p>{t('shares.homepage_desc') || 'Her tekil ziyaretçi için 1 puan kazanın.'}</p>
                                <div className="link-input-group">
                                    <input
                                        type="text"
                                        readOnly
                                        value={user ? `${window.location.origin}?ref=USER${user.id}` : '...'}
                                    />
                                    <button
                                        className={`btn-copy ${copiedLink === 'home' ? 'copied' : ''}`}
                                        onClick={() => user && copyToClipboard(`${window.location.origin}?ref=USER${user.id}`, 'home')}
                                        disabled={!user}
                                    >
                                        {copiedLink === 'home' ? <FiCheckCircle /> : <FiCopy />}
                                    </button>
                                </div>
                            </div>
                            <div className="points-badge">+1 Puan</div>
                        </div>

                        {/* Specific Project Link (Placeholder) */}
                        <div className="link-card">
                            <div className="link-icon">
                                <FiLink />
                            </div>
                            <div className="link-details">
                                <h4>{t('shares.project_link') || 'Projeleri Paylaşın'}</h4>
                                <p>{t('shares.project_desc') || 'Koleksiyon veya proje paylaşarak 2 puan kazanın.'}</p>
                                <div className="link-input-group">
                                    <input
                                        type="text"
                                        readOnly
                                        value={user ? `${window.location.origin}/projects?ref=USER${user.id}` : '...'}
                                    />
                                    <button
                                        className={`btn-copy ${copiedLink === 'project' ? 'copied' : ''}`}
                                        onClick={() => user && copyToClipboard(`${window.location.origin}/projects?ref=USER${user.id}`, 'project')}
                                        disabled={!user}
                                    >
                                        {copiedLink === 'project' ? <FiCheckCircle /> : <FiCopy />}
                                    </button>
                                </div>
                            </div>
                            <div className="points-badge highlight">+2 Puan</div>
                        </div>
                    </div>
                </div>

                {/* Shares History Table */}
                <div className="shares-history-section">
                    <h3>{t('shares.history_title') || 'Paylaşım Geçmişi'}</h3>
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>{t('shares.table.date') || 'Tarih'}</th>
                                    <th>{t('shares.table.type') || 'Tür'}</th>
                                    <th>{t('shares.table.details') || 'Detay'}</th>
                                    <th>{t('shares.table.earned') || 'Kazanılan'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shares.map(share => (
                                    <tr key={share.id}>
                                        <td data-label="Tarih" className="date-cell">
                                            {new Date(share.created_at).toLocaleDateString()}
                                        </td>
                                        <td data-label="Tür">
                                            <span className={`type-badge ${share.type}`}>
                                                {share.type === 'project' ? 'Proje' : 'Ana Sayfa'}
                                            </span>
                                        </td>
                                        <td data-label="Detay">
                                            <span className="share-title">{share.title}</span>
                                        </td>
                                        <td data-label="Kazanılan" className="points-cell">
                                            +{share.points_earned} Puan
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </UserLayout >
    );
};

export default UserShares;
