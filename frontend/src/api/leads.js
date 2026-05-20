import api from './axios';

export const leadsAPI = {
    submit: (data) => api.post('/leads/submit', data)
};

