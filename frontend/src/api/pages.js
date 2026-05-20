import api from './axios';

const pagesAPI = {
    getBySlug: (slug) => api.get(`/pages/${encodeURIComponent(slug)}`),
    list: () => api.get('/pages'),
};

export default pagesAPI;


