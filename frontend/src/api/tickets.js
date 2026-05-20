import api from './axios';

export const ticketsAPI = {
    // Departman API'leri
    getDepartments: () => api.get('/tickets/departments'),
    createDepartment: (data) => api.post('/tickets/departments', data),
    updateDepartment: (id, data) => api.put(`/tickets/departments/${id}`, data),
    
    // Satın alınan projeler
    getPurchasedProjects: (params) => api.get('/tickets/purchased-projects', { params }),
    
    // Ticket API'leri
    create: (data) => api.post('/tickets', data),
    getMyTickets: (params) => api.get('/tickets/my-tickets', { params }),
    getTicket: (id) => api.get(`/tickets/${id}`),
    reply: (id, data) => api.post(`/tickets/${id}/reply`, data),
    updateStatus: (id, status) => api.put(`/tickets/${id}/status`, { status }),
    
    // FAQ
    getFAQ: () => api.get('/tickets/faq/list')
};

