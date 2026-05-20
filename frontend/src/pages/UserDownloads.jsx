import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useLanguage } from '../context/LanguageContext';
import { FiDownload, FiCalendar, FiPackage, FiEye } from 'react-icons/fi';
import './UserDownloads.css';

const UserDownloads = () => {
    const { t, language } = useLanguage();
    const [downloads, setDownloads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDownloads();
    }, [language]);

    const loadDownloads = async () => {
        try {
            // TODO: Backend API endpoint eklenmeli
            // const response = await usersAPI.getDownloads();
            // setDownloads(response.data.downloads || []);
            setDownloads([]);
        } catch (error) {
            console.error('Downloads load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <UserLayout>
                <div className="user-downloads-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('downloads.loading')}</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="user-downloads-page">
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <FiDownload className="title-icon" />
                            {t('downloads.title')}
                        </h1>
                        <p className="page-subtitle">{t('downloads.subtitle')}</p>
                    </div>
                </div>

                {downloads.length === 0 ? (
                    <div className="empty-state">
                        <FiDownload className="empty-icon" />
                        <h3>{t('downloads.empty.title')}</h3>
                        <p>{t('downloads.empty.description')}</p>
                        <Link to="/projects" className="btn btn-primary">
                            {t('downloads.empty.explore_projects')}
                        </Link>
                    </div>
                ) : (
                    <div className="downloads-list">
                        {downloads.map(download => (
                            <div key={download.id} className="download-card">
                                <div className="download-header">
                                    <div className="download-info">
                                        <h3 className="download-title">{download.project_title}</h3>
                                        <span className="download-date">
                                            <FiCalendar className="date-icon" />
                                            {formatDate(download.downloaded_at)}
                                        </span>
                                    </div>
                                    <div className="download-version">
                                        <FiPackage className="version-icon" />
                                        v{download.version || '1.0.0'}
                                    </div>
                                </div>

                                <div className="download-actions">
                                    <button className="btn btn-primary">
                                        <FiDownload className="btn-icon" />
                                        {t('downloads.actions.download')}
                                    </button>
                                    <Link 
                                        to={`/projects/${download.project_id}`}
                                        className="btn btn-outline"
                                    >
                                        <FiEye className="btn-icon" />
                                        {t('downloads.actions.view_project')}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
};

export default UserDownloads;

