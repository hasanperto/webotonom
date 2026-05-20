import api from './axios';

export const couponsAPI = {
    validate: (data) => api.post('/coupons/validate', data)
};

