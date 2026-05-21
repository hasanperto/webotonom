import api from './axios';

export const paymentsAPI = {
    getMethods: () => api.get('/payments/methods'),
    processPayment: (data) => api.post('/payments/process', data),
    getPaymentStatus: (orderId) => api.get(`/payments/status/${orderId}`),
    createStripeIntent: (data) => api.post('/payments/stripe/create-intent', data),
    initializeIyzico: (data) => api.post('/payments/iyzico/initialize', data)
};

