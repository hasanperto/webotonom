import api from './axios';

export const cartAPI = {
    addToCart: (data) => api.post('/cart/add', data),
    getCart: (lang) => {
        const params = lang ? { lang } : {};
        return api.get('/cart', { params });
    },
    updateCartItem: (id, data) => api.put(`/cart/${id}`, data),
    removeFromCart: (id) => api.delete(`/cart/${id}`),
    clearCart: () => api.delete('/cart')
};

