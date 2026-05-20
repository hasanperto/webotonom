import api from './axios';

export const userAddressesAPI = {
    getAddresses: () => api.get('/user/addresses'),
    addAddress: (data) => api.post('/user/addresses', data),
    updateAddress: (id, data) => api.put(`/user/addresses/${id}`, data),
    deleteAddress: (id) => api.delete(`/user/addresses/${id}`),
    setDefaultAddress: (id) => api.post(`/user/addresses/${id}/set-default`)
};

