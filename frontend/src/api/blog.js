import api from './axios';

function withLang(params = {}) {
    const lang =
        params.lang ||
        localStorage.getItem('language') ||
        'tr';
    return { ...params, lang };
}

export const blogAPI = {
    getPosts: (params) => api.get('/blog', { params: withLang(params) }),
    getPost: (slug, params) => api.get(`/blog/${slug}`, { params: withLang(params) }),
    addComment: (id, data) => api.post(`/blog/${id}/comments`, data),
};

