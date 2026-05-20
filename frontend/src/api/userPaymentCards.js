import api from './axios';

export const userPaymentCardsAPI = {
    getCards: () => api.get('/user/payment-cards'),
    addCard: (data) => api.post('/user/payment-cards', data),
    deleteCard: (id) => api.delete(`/user/payment-cards/${id}`),
    setDefaultCard: (id) => api.post(`/user/payment-cards/${id}/set-default`)
};

