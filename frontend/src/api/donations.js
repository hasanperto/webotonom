import api from './axios';

export const donationsAPI = {
    donate: (projectId, data) => api.post(`/donations/projects/${projectId}`, data),
    getProjectDonations: (projectId) => api.get(`/donations/projects/${projectId}`),
    getMyDonations: () => api.get('/donations/user/my-donations'),
    updateMessage: (donationId, message) => api.put(`/donations/user/${donationId}/message`, { message })
};

