import api from './axios';

export const sellerAPI = {
    // Dashboard istatistikleri
    getStats: () => api.get('/seller/dashboard'),
    
    // Projeler
    getProjects: () => api.get('/seller/projects'),
    getProject: (id) => api.get(`/seller/projects/${id}`),
    createProject: (data) => {
        // FormData ise headers'ı otomatik ayarla
        if (data instanceof FormData) {
            return api.post('/seller/projects', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return api.post('/seller/projects', data);
    },
    updateProject: (id, data) => api.put(`/seller/projects/${id}`, data),
    deleteProject: (id) => api.delete(`/seller/projects/${id}`),
    
    // Kazançlar
    getEarnings: () => api.get('/seller/earnings'),
    getWithdrawals: () => api.get('/seller/withdrawals'),
    requestWithdrawal: (data) => api.post('/seller/withdrawals', data),
    
    // Siparişler
    getOrders: (params) => api.get('/seller/orders', { params }),
    getOrder: (id) => api.get(`/seller/orders/${id}`),
    
    // Satışlar
    getSales: (params) => api.get('/seller/sales', { params }),
    getSale: (id) => api.get(`/seller/sales/${id}`),
    
    // Mesajlar
    getMessages: () => api.get('/seller/messages'),
    sendMessage: (data) => api.post('/seller/messages', data),
    
    // Müşteriler
    getCustomers: () => api.get('/seller/customers'),
    
    // Kuponlar
    getCoupons: () => api.get('/seller/coupons'),
    createCoupon: (data) => api.post('/seller/coupons', data),
    
    // Raporlar
    getReports: (params) => api.get('/seller/reports', { params }),
    
    // Analytics
    getAnalytics: (params) => api.get('/seller/analytics', { params }),
    
    // Favoriler (Satıcının projelerine favori ekleyen kullanıcılar)
    getFavorites: () => api.get('/seller/favorites'),
    removeFavorite: (favoriteId) => api.delete(`/seller/favorites/${favoriteId}`),
    
    // Medya
    uploadMedia: (file, formData) => {
        // Eğer formData zaten varsa onu kullan, yoksa yeni oluştur
        const fd = formData || new FormData();
        if (!formData) {
            fd.append('file', file);
        }
        return api.post('/seller/media', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getMedia: () => api.get('/seller/media'),
    deleteMedia: (id) => api.delete(`/seller/media/${id}`),
};

