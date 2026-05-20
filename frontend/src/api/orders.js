import api from './axios';

export const ordersAPI = {
    createOrder: (data) => api.post('/orders', data),
    getOrders: (params) => api.get('/orders', { params }),
    getOrder: (id) => api.get(`/orders/${id}`),
    cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
    getInvoice: (id) => api.get(`/orders/${id}/invoice`)
};

