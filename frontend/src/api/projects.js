import api from './axios';

export const projectsAPI = {
    getAll: (params) => api.get('/projects', { params }),
    getById: (id, lang) => {
        const params = lang ? { lang } : {};
        return api.get(`/projects/${id}`, { params });
    },
    getCategories: () => api.get('/projects/categories/list'),
    getTags: () => api.get('/projects/tags/list'),
    trackVisit: (data) => api.post('/projects/track-visit', data)
};

