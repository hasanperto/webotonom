// API ve dosya URL'leri için utility fonksiyonları

// API Base URL
export const getApiUrl = () => {
    // Environment variable varsa onu kullan
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // Production'da window.location.origin kullan
    if (import.meta.env.PROD) {
        return `${window.location.origin}/api`;
    }
    
    // Development'ta localhost
    return 'http://localhost:5000/api';
};

// Upload dosyaları için URL
export const getUploadUrl = (path) => {
    if (!path) return '/img/default.svg';
    
    // Zaten tam URL ise direkt dön
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // Base URL'i al
    let baseUrl = '';
    
    // Environment variable varsa onu kullan
    if (import.meta.env.VITE_API_URL) {
        baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    } else if (import.meta.env.PROD) {
        // Production'da window.location.origin kullan
        baseUrl = window.location.origin;
    } else {
        // Development'ta localhost
        baseUrl = 'http://localhost:5000';
    }
    
    // Path'i temizle - başındaki /uploads/ varsa kaldır (çift path önleme)
    let cleanPath = path;
    if (cleanPath.startsWith('/uploads/')) {
        cleanPath = cleanPath.replace('/uploads/', '');
    }
    if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replace('uploads/', '');
    }
    
    // Base URL'e /uploads/ ekle
    return `${baseUrl}/uploads/${cleanPath}`;
};

// Image URL helper (daha kısa kullanım için)
export const getImageUrl = (path) => {
    return getUploadUrl(path);
};

