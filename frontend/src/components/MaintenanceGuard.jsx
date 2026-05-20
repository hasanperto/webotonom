import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Maintenance from '../pages/Maintenance';
import { getApiUrl } from '../utils/api';

const MaintenanceGuard = ({ children }) => {
    const { isAdmin, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Auth yükleniyorsa bekle
        if (authLoading) {
            return;
        }
        
        // ÖNCE admin kontrolü - admin ise hiçbir şey yapma (location.pathname değişse bile)
        if (isAdmin && isAuthenticated) {
            setMaintenanceMode(false);
            setChecking(false);
            return;
        }
        
        // Login sayfası bakım modundan muaf - direkt erişim ver
        if (location.pathname === '/login') {
            setMaintenanceMode(false);
            setChecking(false);
            return;
        }
        
        // Maintenance sayfasındaysak kontrol etme
        if (location.pathname === '/maintenance') {
            setChecking(false);
            setMaintenanceMode(true);
            return;
        }
        
        // Diğer durumlarda bakım modu kontrolü yap
        checkMaintenanceMode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, isAuthenticated, authLoading, location.pathname]); // location.pathname eklendi - login sayfası kontrolü için

    const checkMaintenanceMode = async () => {
        try {
            setChecking(true);
            
            // ÖNCE admin kontrolü - admin ise hiçbir şey yapma
            if (isAdmin && isAuthenticated) {
                setMaintenanceMode(false);
                setChecking(false);
                return;
            }

            // Admin route'ları bakım modundan muaf (login sayfası dahil)
            if (location.pathname.startsWith('/admin') || location.pathname === '/login') {
                setMaintenanceMode(false);
                setChecking(false);
                return;
            }

            // Bakım modu kontrolü - timeout ile
            const apiBaseUrl = getApiUrl();
            const endpoint = '/public/settings/maintenance';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
            
            try {
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
                    // 503 hatası bakım modu demektir
                    if (response.status === 503) {
                        setMaintenanceMode(true);
                    } else {
                        setMaintenanceMode(false);
                    }
                } else {
                    const data = await response.json();
                    setMaintenanceMode(data.enabled === true);
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                // Timeout veya network hatası - bakım modu aktif değil kabul et
                if (fetchError.name === 'AbortError') {
                    console.error('Maintenance check timeout');
                } else {
                    console.error('Maintenance check network error:', fetchError);
                }
                setMaintenanceMode(false);
            }
        } catch (error) {
            console.error('Maintenance check error:', error);
            // Hata durumunda bakım modu aktif değil kabul et
            setMaintenanceMode(false);
        } finally {
            setChecking(false);
        }
    };

    // ÖNCE admin kontrolü yap - admin ise direkt erişim ver (API çağrısı yapmadan)
    // Bu, admin giriş yaptıktan sonra maintenance sayfasına yönlendirilmesini önler
    if (!authLoading && isAdmin && isAuthenticated) {
        return <>{children}</>;
    }

    // Login sayfası bakım modundan muaf - direkt erişim ver
    if (location.pathname === '/login') {
        return <>{children}</>;
    }

    // Auth yükleniyor veya maintenance kontrolü yapılıyor
    if (authLoading || checking) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <div className="spinner-large"></div>
            </div>
        );
    }

    // Bakım modu aktifse maintenance sayfasını göster (Header/Footer olmadan)
    if (maintenanceMode) {
        return (
            <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 99999,
                width: '100vw',
                height: '100vh',
                overflow: 'auto'
            }}>
                <Maintenance />
            </div>
        );
    }

    // Normal durumda içeriği göster (Header/Footer AppContent'te render ediliyor)
    return <>{children}</>;
};

export default MaintenanceGuard;
