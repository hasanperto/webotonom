import axios from 'axios';
import { getApiUrl } from '../utils/api';

const API_URL = getApiUrl();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - Token ekle
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Hata yönetimi
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Bakım modu kontrolü - maintenance sayfasından çağrılan isteklerde döngüyü önle
        if (error.response?.status === 503 && error.response?.data?.maintenance) {
            // Eğer zaten maintenance sayfasındaysak veya maintenance endpoint'ini çağırıyorsak, tekrar yönlendirme yapma
            const currentPath = window.location.pathname;
            const requestUrl = error.config?.url || '';
            
            // Login sayfası ve admin route'ları bakım modundan muaf
            if (currentPath === '/maintenance' || 
                currentPath === '/login' || 
                currentPath.startsWith('/admin') ||
                requestUrl.includes('/api/public/settings/maintenance') ||
                requestUrl.includes('/api/auth') ||
                requestUrl.includes('/api/admin')) {
                // Bu sayfalardayız veya bu endpoint'leri çağırıyoruz, döngüyü önle
                return Promise.reject(error);
            }
            
            // Admin kullanıcı kontrolü - localStorage'dan kontrol et
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user.role_id === 1) {
                        // Admin kullanıcı - maintenance sayfasına yönlendirme yapma
                        return Promise.reject(error);
                    }
                }
            } catch {
                // User parse hatası - devam et
            }
            
            // Diğer durumlarda maintenance sayfasına yönlendir
            window.location.href = '/maintenance';
            return Promise.reject(error);
        }
        
        if (error.response?.status === 401) {
            // Maintenance sayfasında değilsek login'e yönlendir
            if (window.location.pathname !== '/maintenance') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

