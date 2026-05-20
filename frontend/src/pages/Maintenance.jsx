import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { FiSettings, FiClock, FiRefreshCw, FiLock, FiLogIn } from 'react-icons/fi';
import api from '../api/axios';
import { getApiUrl } from '../utils/api';
import { motionEase } from '../utils/motion';
import './Maintenance.css';

const Maintenance = () => {
    const { language } = useLanguage();
    const reduceMotion = useReducedMotion();
    const navigate = useNavigate();
    const hasLoadedRef = useRef(false); // Sonsuz döngü önleme
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAdminAccess, setShowAdminAccess] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [checkingPassword, setCheckingPassword] = useState(false);

    useEffect(() => {
        // Sadece bir kez yükle - sonsuz döngü önleme
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadMaintenanceMessage();
        }
    }, []); // language dependency kaldırıldı - sadece mount'ta çalış

    const loadMaintenanceMessage = async () => {
        try {
            setLoading(true);
            // Bakım modu sayfası için özel endpoint kullan (bakım modundan muaf)
            // fetch kullanarak axios interceptor'dan kaçınıyoruz
            // API URL'ini doğru şekilde oluştur - getApiUrl() kullan
            const apiBaseUrl = getApiUrl();
            // getApiUrl() zaten /api içeriyor, bu yüzden sadece endpoint'i ekle
            const endpoint = '/public/settings/maintenance';
            
            // Timeout ile fetch - sonsuz bekleme önleme
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
            
            const response = await fetch(`${apiBaseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // 503 hatası bile olsa, mesajı göster
                if (response.status === 503) {
                    const errorData = await response.json().catch(() => ({}));
                    if (errorData.maintenance) {
                        const messageKey = `message_${language}`;
                        const defaultMessage = errorData.message || errorData.message_tr || 'Site bakımda. Lütfen daha sonra tekrar deneyin.';
                        const localizedMessage = errorData[messageKey] || defaultMessage;
                        setMessage(localizedMessage);
                        setLoading(false);
                        return;
                    }
                }
                throw new Error('Failed to load maintenance message');
            }
            
            const data = await response.json();
            
            // Çok dilli mesaj desteği
            const messageKey = `message_${language}`;
            const defaultMessage = data.message || data.message_tr || 'Site bakımda. Lütfen daha sonra tekrar deneyin.';
            const localizedMessage = data[messageKey] || defaultMessage;
            
            setMessage(localizedMessage);
        } catch (error) {
            console.error('Maintenance message load error:', error);
            // Varsayılan mesajlar - veritabanı hatası olsa bile göster
            const defaultMessages = {
                tr: 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
                en: 'Site is under maintenance. Please try again later.',
                de: 'Die Website befindet sich im Wartungsmodus. Bitte versuchen Sie es später erneut.'
            };
            setMessage(defaultMessages[language] || defaultMessages.tr);
        } finally {
            setLoading(false);
        }
    };

    // Admin kontrolü MaintenanceGuard'da yapılıyor - burada yapmaya gerek yok
    // Admin ise MaintenanceGuard zaten direkt siteye erişim veriyor

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleAdminLogin = () => {
        navigate('/login');
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setCheckingPassword(true);

        try {
            const response = await api.post('/api/auth/maintenance-access', {
                password: adminPassword
            });

            if (response.data.success) {
                // Şifre doğru, bakım modunu kapat
                await api.put('/admin/settings/maintenance', {
                    enabled: false
                });
                // Ana sayfaya yönlendir
                window.location.href = '/';
            }
        } catch (error) {
            setPasswordError(
                language === 'tr' ? 'Şifre hatalı!' :
                language === 'en' ? 'Incorrect password!' :
                'Falsches Passwort!'
            );
        } finally {
            setCheckingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="maintenance-page">
                <M.div
                    className="maintenance-container maintenance-container--loading"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                >
                    <div className="spinner-large" role="status" aria-label="Loading" />
                </M.div>
            </div>
        );
    }

    return (
        <div className="maintenance-page">
            <M.div
                className="maintenance-container"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: motionEase }}
            >
                <M.div
                    className="maintenance-icon"
                    animate={reduceMotion ? {} : { rotate: 360 }}
                    transition={reduceMotion ? {} : { duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                    <FiSettings />
                </M.div>
                <h1 className="maintenance-title">
                    {language === 'tr' && 'Bakım Modu'}
                    {language === 'en' && 'Maintenance Mode'}
                    {language === 'de' && 'Wartungsmodus'}
                </h1>
                <p className="maintenance-message">{message}</p>
                
                {/* Admin Erişim Bölümü */}
                <div className="maintenance-admin-access">
                    <button 
                        onClick={() => setShowAdminAccess(!showAdminAccess)} 
                        className="btn-admin-access"
                    >
                        <FiLock />{' '}
                        {language === 'tr' && 'Yönetici Erişimi'}
                        {language === 'en' && 'Admin Access'}
                        {language === 'de' && 'Administratorzugriff'}
                    </button>
                    
                    <AnimatePresence initial={false}>
                        {showAdminAccess && (
                            <M.div
                                key="admin-access"
                                className="admin-access-form"
                                initial={reduceMotion ? false : { opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: motionEase }}
                            >
                                <button
                                    type="button"
                                    onClick={handleAdminLogin}
                                    className="btn-admin-login"
                                >
                                    <FiLogIn />{' '}
                                    {language === 'tr' && 'Admin Girişi Yap'}
                                    {language === 'en' && 'Login as Admin'}
                                    {language === 'de' && 'Als Admin anmelden'}
                                </button>

                                <div className="divider">
                                    {language === 'tr' && 'veya'}
                                    {language === 'en' && 'or'}
                                    {language === 'de' && 'oder'}
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="password-form">
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder={
                                            language === 'tr' ? 'Bakım Modu Şifresi' :
                                            language === 'en' ? 'Maintenance Password' :
                                            'Wartungsmodus-Passwort'
                                        }
                                        className="password-input"
                                        required
                                    />
                                    {passwordError && (
                                        <p className="password-error">{passwordError}</p>
                                    )}
                                    <button
                                        type="submit"
                                        className="btn-submit-password"
                                        disabled={checkingPassword}
                                    >
                                        {checkingPassword ? (
                                            language === 'tr' ? 'Kontrol ediliyor...' :
                                            language === 'en' ? 'Checking...' :
                                            'Wird geprüft...'
                                        ) : (
                                            language === 'tr' ? 'Bakım Modunu Kapat' :
                                            language === 'en' ? 'Disable Maintenance' :
                                            'Wartungsmodus deaktivieren'
                                        )}
                                    </button>
                                </form>
                            </M.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="maintenance-actions">
                    <button onClick={handleRefresh} className="btn-refresh-maintenance">
                        <FiRefreshCw />{' '}
                        {language === 'tr' && 'Yenile'}
                        {language === 'en' && 'Refresh'}
                        {language === 'de' && 'Aktualisieren'}
                    </button>
                </div>
                <div className="maintenance-footer">
                    <FiClock className="clock-icon" />
                    <span>
                        {language === 'tr' && 'Yakında döneceğiz'}
                        {language === 'en' && 'We\'ll be back soon'}
                        {language === 'de' && 'Wir sind bald zurück'}
                    </span>
                </div>
            </M.div>
        </div>
    );
};

export default Maintenance;
