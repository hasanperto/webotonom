import api from './axios';

export const usersAPI = {
    getProfile: () => api.get('/users/profile'),
    getStats: () => api.get('/users/stats'),
    getOrders: () => api.get('/users/orders'),
    getFavorites: (params) => api.get('/users/favorites', { params }),
    toggleFavorite: (projectId) => api.post(`/users/favorites/${projectId}`),
    getTransactions: (params) => api.get('/users/transactions', { params }),
    getMessages: () => api.get('/users/messages'),
    sendMessage: (data) => api.post('/users/messages', data),
    markMessagesRead: (conversationId) => api.put(`/users/messages/${conversationId}/read`),
    getUserById: (userId) => api.get(`/users/${userId}`),
    getPaymentRequests: () => api.get('/users/payment-requests'),
    updatePaymentRequestNote: (id, note) => api.put(`/users/payment-requests/${id}/note`, { note }),
    getLoyaltyStatus: () => api.get('/users/loyalty/status')
};

