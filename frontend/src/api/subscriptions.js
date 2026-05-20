import api from './axios';

export const subscriptionsAPI = {
    getPlans: (lang) => {
        const params = lang ? { lang } : {};
        return api.get('/subscriptions/plans', { params });
    },
    getMySubscriptions: (lang) => {
        const params = lang ? { lang } : {};
        return api.get('/subscriptions/my-subscriptions', { params });
    },
    subscribe: (data) => api.post('/subscriptions/subscribe', data),
    cancel: (id) => api.post(`/subscriptions/cancel/${id}`)
};

